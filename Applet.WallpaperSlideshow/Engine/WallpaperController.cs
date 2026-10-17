namespace at365.WallpaperSlideshow;

public sealed class WallpaperController : IDisposable
{
    public static WallpaperController Instance { get; } = new();
    private Config config = new();
    private long revision, queueRevision = -1;
    private readonly QueueManager queues = new(); // Only accessed by the worker.
    private LatestWorker<RenderRequest, RenderedFrame>? worker;
    private DesktopPresenter? presenter;
    private WallpaperController() { }

    public string DisplayState => presenter?.State ?? "表示の準備中";
    public event Action? StateChanged;
    internal sealed record RenderRequest(Config Config, Rectangle[] Bounds, long Revision);

    internal void Attach(DispatcherForm form)
    {
        void Post(Action action)
        {
            if (form.IsDisposed || !form.IsHandleCreated) return;
            try { form.BeginInvoke(action); }
            catch (InvalidOperationException) when (form.IsDisposed || !form.IsHandleCreated) { }
        }
        presenter = new DesktopPresenter(new DesktopHost(Post), DesktopPresenter.ScheduleOnUi,
            error => AppLog.Error("デスクトップへの接続", error));
        worker = new LatestWorker<RenderRequest, RenderedFrame>(Build, Post, Publish);
        presenter.StateChanged += () => StateChanged?.Invoke();
        presenter.ConnectionChanged += () => {
            worker.Invalidate();
            if (presenter.CanRender && !presenter.HasImage) UpdateWallpaper(true);
        };
        form.OnDesktopChanged = presenter.DesktopChanged;
    }

    public void Initialize(Config value) { config = value; Invalidate(); }
    public void Invalidate() { revision++; worker?.Invalidate(); }

    public void ResumePresentation()
    {
        if (presenter == null) return;
        presenter.Resume(StableScreensProvider.Screens.Select(s => s.Bounds).ToArray());
        if (presenter.CanRender && presenter.HasImage) UpdateWallpaper(true);
    }

    public void PausePresentation() { Invalidate(); presenter?.Pause(); }
    public void CheckDesktop() => presenter?.CheckHealth();

    public void UpdateWallpaper(bool replace = false)
    {
        if (presenter?.CanRender != true) return;
        var bounds = StableScreensProvider.Screens.Select(s => s.Bounds).ToArray();
        worker?.Request(new RenderRequest(config, bounds, revision), replace);
    }

    public void Next()
    {
        if (presenter == null) return;
        var connected = presenter.CanRender;
        presenter.RetryNow();
        if (connected || presenter.HasImage) UpdateWallpaper(true);
    }

    private RenderedFrame Build(RenderRequest request, CancellationToken token)
    {
        queues.Cancellation = token;
        if (queueRevision != request.Revision)
        {
            queues.SetConfig(request.Config);
            queues.ReplaceQueues(QueueManager.Prepare(request.Config, request.Bounds.Length, token));
            queueRevision = request.Revision;
        }
        return Render(request, queues, token);
    }

    internal static RenderedFrame Render(RenderRequest request, QueueManager queues, CancellationToken token)
    {
        token.ThrowIfCancellationRequested();
        if (request.Bounds.Length == 0) throw new InvalidOperationException("モニターがありません。");
        var bounds = request.Bounds.Aggregate(Rectangle.Union);
        _ = checked((long)bounds.Width * bounds.Height * 4);
        var bitmap = new Bitmap(bounds.Width, bounds.Height);
        try
        {
            using var graphics = Graphics.FromImage(bitmap);
            graphics.Clear(Color.Black);
            var renderer = new WallpaperRenderer { Cancellation = token };
            renderer.SetConfig(request.Config);
            var history = new List<(int, string)>();
            for (int i = 0; i < request.Bounds.Length; i++)
            {
                token.ThrowIfCancellationRequested();
                var image = queues.GetNextImage(i);
                renderer.ComposeMonitor(i, image, graphics, bounds, request.Bounds,
                    queues.GetQueue(i), (monitor, path) => history.Add((monitor, path)));
            }
            token.ThrowIfCancellationRequested();
            return new RenderedFrame(bitmap, bounds, request.Bounds, history, request.Config.History.Limit);
        }
        catch { bitmap.Dispose(); throw; }
    }

    private void Publish(RenderedFrame result)
    {
        if (presenter?.Present(result) != true) return;
        foreach (var item in result.History)
            HistoryManager.Instance.Push(item.Monitor, item.Path, result.HistoryLimit);
    }

    public void Dispose()
    {
        worker?.Dispose();
        presenter?.Dispose(); presenter = null;
        worker = null;
    }
}
