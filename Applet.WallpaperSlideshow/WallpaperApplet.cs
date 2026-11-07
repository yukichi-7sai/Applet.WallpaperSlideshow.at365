using System.Diagnostics;
using System.Text.Json;
using AppDock.SDK;
using at365.WallpaperSlideshow;
using Microsoft.Win32;

namespace Applets.WallpaperSlideshow;

internal sealed class WallpaperApplet(Form dispatcher, ISlideshowController engine) : IAppDockExtension, IPageFileHandler
{
    private IExtensionContext? context;
    private AppLog.HostSession? logging;
    private IDisposable? subscription;
    private string? fingerprint;
    private HistoryPublisher? history;
    private bool started;
    private readonly SemaphoreSlim commandGate = new(1, 1);
    public async Task ActivateAsync(IExtensionContext services, CancellationToken token)
    {
        context = services;
        logging = AppLog.Connect(services.Log);
        if (dispatcher is DispatcherForm sessionWindow) sessionWindow.OnSessionEnding = StopEngine;
        try { await ActivateCoreAsync(services, token); }
        catch (Exception error) when (error is not OperationCanceledException) {
            await AppLog.ErrorAsync("Appletの開始", error);
            throw;
        }
    }
    private async Task ActivateCoreAsync(IExtensionContext services, CancellationToken token)
    {
        void Register(string id, string title, Func<CancellationToken, Task> action) => services.Commands.Register(id, title, async ct => {
            await commandGate.WaitAsync(ct);
            try { await action(ct); } finally { commandGate.Release(); }
        });
        var options = SlideshowOptions.Read(services.Settings);
        history = new(dispatcher, services.Storage);
        await dispatcher.InvokeAsync(() => {
            options.Validate(StableScreensProvider.Screens.Select(s => s.Bounds));
            started = true;
            engine.Start(options, !services.Settings.Get("slideshowEnabled", true));
            fingerprint = SlideshowOptions.Fingerprint(options);
        }, token);
        Register(services.ExtensionId + ".next", "次の壁紙に更新", async ct => {
            await dispatcher.InvokeAsync(engine.Next, ct); await history.PublishAsync(ct);
        });
        Register(services.ExtensionId + ".background-settings", "Windowsの背景設定を開く",
            ct => dispatcher.InvokeAsync(engine.OpenWindowsBackgroundSettings, ct));
        Register(services.ExtensionId + ".history", "最近使った壁紙を開く", ct => services.Pages.OpenAsync(HistoryPublisher.PageId, ct));
        Register(services.ExtensionId + ".home", "設定を開く", ct => services.Ui.OpenSettingsAsync(ct));
        Register(services.ExtensionId + ".data", "壁紙のデータフォルダーを開く", async ct => {
            await dispatcher.InvokeAsync(() => {
                Directory.CreateDirectory(Const.AppDataFolder);
                Process.Start(new ProcessStartInfo(Const.AppDataFolder) { UseShellExecute = true });
            }, ct);
        });
        subscription = services.Settings.OnChanged(async ct => {
            await commandGate.WaitAsync(ct);
            try { await ApplyAsync(ct); } finally { commandGate.Release(); }
        });
        SystemEvents.DisplaySettingsChanged += DisplayChanged;
        ApplicationController.Instance.StateChanged += StateChanged;

        await history.PublishAsync(token);
    }
    private async Task ApplyAsync(CancellationToken token)
    {
        var services = context;
        if (services is null) return;
        try {
            await dispatcher.InvokeAsync(() => engine.Pause(!services.Settings.Get("slideshowEnabled", true)), token);
            var options = SlideshowOptions.Read(services.Settings);
            await dispatcher.InvokeAsync(() => {
                options.Validate(StableScreensProvider.Screens.Select(s => s.Bounds));
                var nextFingerprint = SlideshowOptions.Fingerprint(options);
                if (nextFingerprint != fingerprint) { engine.Configure(options); fingerprint = nextFingerprint; }
            }, token);

            if (history is not null) await history.PublishAsync(token);
        } catch (Exception error) when (error is not OperationCanceledException) {
            AppLog.Error("AppDock設定の反映", error);

        }
    }
    public async Task HandlePageFileRemovedAsync(string pageId, string file, CancellationToken token)
    {
        if (pageId != HistoryPublisher.PageId || history is null || context is null)
            throw new InvalidOperationException("履歴ページを開き直してください。");
        await commandGate.WaitAsync(token);
        try {
            await dispatcher.InvokeAsync(() => HistoryManager.Instance.Remove(file), token);
            await history.PublishAsync(token);
        }
        finally { commandGate.Release(); }
    }
    private async void DisplayChanged(object? sender, EventArgs e) => await RefreshStateAsync();
    private async void StateChanged() => await RefreshStateAsync();
    private async Task RefreshStateAsync()
    {
        try {

            if (context is not null && history is not null) await history.PublishAsync(CancellationToken.None);
        }
        catch (Exception error) { if (context is not null) AppLog.Error("表示状態の更新", error); }
    }
    public async Task DeactivateAsync(CancellationToken token)
    {
        subscription?.Dispose(); subscription = null;
        SystemEvents.DisplaySettingsChanged -= DisplayChanged;
        ApplicationController.Instance.StateChanged -= StateChanged;
        context = null;
        try {
            if (history is not null) { history.Stop(); history = null; }
            await dispatcher.InvokeAsync(() => {
                try { StopEngine(); }
                finally { if (dispatcher is DispatcherForm sessionWindow) sessionWindow.OnSessionEnding = null; }
            }, CancellationToken.None);
        }
        finally { if (logging is not null) { await logging.DisposeAsync(); logging = null; } }
    }
    private void StopEngine() { if (!started) return; engine.Stop(); started = false; }
}
