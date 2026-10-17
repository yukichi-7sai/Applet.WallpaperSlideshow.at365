using at365.WallpaperSlideshow;

namespace Applets.WallpaperSlideshow;

// Keep Windows desktop mutations behind this boundary so protocol tests use an isolated engine.
internal interface ISlideshowController
{
    bool IsPaused { get; }
    string DisplayState => IsPaused ? "停止中（手動停止・ロック・リモート接続）" : "表示中";
    void Start(Config config, bool paused);
    void Configure(Config config);
    void Pause(bool paused);
    void Next();
    void OpenWindowsBackgroundSettings();
    void Stop();
}
internal sealed class SlideshowController(DispatcherForm dispatcher) : ISlideshowController
{
    private bool started;
    public bool IsPaused => ApplicationController.Instance.IsPaused;
    public string DisplayState => ApplicationController.Instance.DisplayState;
    public void Start(Config config, bool paused) {
        started = true;
        ApplicationController.Instance.Initialize(config, dispatcher, paused);
    }
    public void Configure(Config config) => ApplicationController.Instance.Configure(config);
    public void Pause(bool paused) => ApplicationController.Instance.TogglePause(paused);
    public void Next() => ApplicationController.Instance.Next();
    public void OpenWindowsBackgroundSettings() => System.Diagnostics.Process.Start(
        new System.Diagnostics.ProcessStartInfo("ms-settings:personalization-background") { UseShellExecute = true });
    public void Stop() { if (started) { ApplicationController.Instance.PrepareShutdown(); started = false; } }
}
