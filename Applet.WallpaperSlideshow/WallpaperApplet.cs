using System.Diagnostics;
using System.Text.Json;
using AppDock.SDK;
using at365.WallpaperSlideshow;
using Microsoft.Win32;
using DockPanel = AppDock.SDK.Panel;

namespace Applets.WallpaperSlideshow;

internal sealed class WallpaperApplet(Form dispatcher, ISlideshowController engine, Action<string>? deleteImage = null, Action<string>? openImage = null) : IAppDockExtension, IPageActionHandler
{
    private IExtensionContext? context;
    private AppLog.HostSession? logging;
    private IDisposable? subscription;
    private Config? config;
    private string? fingerprint;
    private HistoryPageController? history;
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
        var imageFolder = Path.Combine(await services.Ui.GetImageDirectoryAsync(token), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(imageFolder);
        history = new(dispatcher, services, imageFolder, () => config, deleteImage, openImage);
        await dispatcher.InvokeAsync(() => {
            options.Validate(StableScreensProvider.Screens.Select(s => s.Bounds));
            started = true;
            engine.Start(options, services.Settings.Get("paused", false));
            config = options;
            fingerprint = SlideshowOptions.Fingerprint(options);
        }, token);
        Register(services.ExtensionId + ".next", "次の壁紙に更新", async ct => {
            await dispatcher.InvokeAsync(engine.Next, ct); await PublishAsync(ct); await history.InvalidateAsync(ct);
        });
        Register(services.ExtensionId + ".background-settings", "Windowsの背景設定を開く",
            ct => dispatcher.InvokeAsync(engine.OpenWindowsBackgroundSettings, ct));
        Register(services.ExtensionId + ".history", "最近使った壁紙を開く", ct => services.Pages.OpenAsync(HistoryPageController.PageId, ct));
        Register(services.ExtensionId + ".home", "壁紙の操作に戻る", async ct => {
            await history.ResetAsync(false, ct);
            await services.Pages.DisposeAsync(HistoryPageController.PageId, ct);
            await PublishAsync(ct);
            await services.Ui.OpenDetailsAsync(ct);
        });
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
        await PublishAsync(token);
    }
    private async Task ApplyAsync(CancellationToken token)
    {
        var services = context;
        if (services is null) return;
        try {
            await dispatcher.InvokeAsync(() => engine.Pause(services.Settings.Get("paused", false)), token);
            var options = SlideshowOptions.Read(services.Settings);
            await dispatcher.InvokeAsync(() => {
                options.Validate(StableScreensProvider.Screens.Select(s => s.Bounds));
                var nextFingerprint = SlideshowOptions.Fingerprint(options);
                if (nextFingerprint != fingerprint) { engine.Configure(options); fingerprint = nextFingerprint; config = options; }
            }, token);
            await PublishAsync(token);
            if (history is not null) await history.InvalidateAsync(token);
        } catch (Exception error) when (error is not OperationCanceledException) {
            AppLog.Error("AppDock設定の反映", error);
            await PublishAsync(token, error.Message);
        }
    }
    private async Task PublishAsync(CancellationToken token, string? error = null)
    {
        var services = context;
        if (services is null) return;
        var panel = await dispatcher.InvokeAsync(() => new DockPanel("壁紙スライドショー",
            error is null ? "モニターごとの画像フォルダーから、重複なしで壁紙を切り替えます。" : "設定エラー: " + error,
            new[] {
                new PanelFact("状態", engine.DisplayState),
                new PanelFact("更新間隔", $"{config?.IntervalSeconds ?? 60} 秒"),
                new PanelFact("モニター", string.Join(" / ", StableScreensProvider.Screens.Select((s, i) => $"{i + 1}: {s.Bounds.Width}×{s.Bounds.Height}"))),
                new PanelFact("画像ソース", string.Join(" / ", config?.Monitors.Select((m, i) => $"{i + 1}: {m.SourceFolders().Count()}フォルダー") ?? [])),
                new PanelFact("バージョン", typeof(WallpaperApplet).Assembly.GetName().Version!.ToString(3)),
            }, new[] {
                new PanelAction("開始／再開", services.ExtensionId + ".settings.paused.off"),
                new PanelAction("停止", services.ExtensionId + ".settings.paused.on"),
                new PanelAction("開始／停止を切り替え", services.ExtensionId + ".settings.paused.toggle"),
                new PanelAction("次の壁紙に更新", services.ExtensionId + ".next"),
                new PanelAction("データフォルダーを開く", services.ExtensionId + ".data"),
            }), token);
        await services.Ui.ShowPanelAsync(panel, token);
    }
    public async Task<JsonElement?> HandlePageActionAsync(string actionId, JsonElement input, string pageId, CancellationToken token)
    {
        if (pageId != HistoryPageController.PageId || history is null || context is null)
            throw new InvalidOperationException("履歴ページを開き直してください。");
        await commandGate.WaitAsync(token);
        try { return await history.HandleAsync(actionId, input, token); }
        catch (Exception error) when (error is not OperationCanceledException) { AppLog.Error("履歴ページの操作", error); throw; }
        finally { commandGate.Release(); }
    }
    private async void DisplayChanged(object? sender, EventArgs e) => await RefreshStateAsync();
    private async void StateChanged() => await RefreshStateAsync();
    private async Task RefreshStateAsync()
    {
        try {
            await PublishAsync(CancellationToken.None);
            if (context is not null && history is not null) await history.InvalidateAsync(CancellationToken.None);
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
            if (history is not null) { await history.ResetAsync(true, CancellationToken.None); history = null; }
            await dispatcher.InvokeAsync(() => {
                try { StopEngine(); }
                finally { if (dispatcher is DispatcherForm sessionWindow) sessionWindow.OnSessionEnding = null; }
            }, CancellationToken.None);
        }
        finally { if (logging is not null) { await logging.DisposeAsync(); logging = null; } }
    }
    private void StopEngine() { if (!started) return; engine.Stop(); started = false; }
}
