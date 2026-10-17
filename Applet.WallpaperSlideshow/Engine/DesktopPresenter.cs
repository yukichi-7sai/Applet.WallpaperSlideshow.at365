namespace at365.WallpaperSlideshow;

internal interface IDesktopHost
{
    IDesktopConnection Connect(Rectangle[] monitors, Action disconnected);
}

internal interface IDesktopConnection : IDisposable
{
    bool IsAlive { get; }
    void Show(Bitmap image, Rectangle bounds);
}

// All methods, scheduled actions and events run on the owning UI thread.
internal sealed class DesktopPresenter(IDesktopHost host,
    Func<int, Action, IDisposable> schedule, Action<Exception> report) : IDisposable
{
    private static readonly int[] RetryDelays = [1000, 2000, 5000, 10000, 30000];
    private IDesktopConnection? connection;
    private IDisposable? retry;
    private Bitmap? image;
    private Rectangle imageBounds;
    private Rectangle[] monitors = [];
    private bool paused = true, disposed;
    private int generation, attempts;
    public bool CanRender => !paused && !disposed && connection != null;
    public bool HasImage => image != null;
    public string State { get; private set; } = "停止中";
    public event Action? StateChanged;
    public event Action? ConnectionChanged;

    public void Resume(Rectangle[] bounds)
    {
        if (disposed) return;
        if (!monitors.SequenceEqual(bounds))
        {
            Disconnect();
            image?.Dispose(); image = null;
            monitors = (Rectangle[])bounds.Clone();
        }
        paused = false;
        if (connection == null) RetryNow();
    }

    public void RetryNow()
    {
        if (paused || disposed || connection != null) return;
        retry?.Dispose(); retry = null;
        generation++;
        attempts = 0;
        Connect();
    }

    private void Connect()
    {
        if (paused || disposed) return;
        var version = generation;
        SetState(attempts == 0 ? "表示の準備中" : "デスクトップへ再接続待ち");
        try
        {
            connection = host.Connect(monitors, () => {
                if (version == generation && connection != null) Lost();
            });
            if (!connection.IsAlive) throw new InvalidOperationException("デスクトップの接続先が失われました。");
            if (image != null) connection.Show(image, imageBounds);
            attempts = 0;
            SetState(image == null ? "画像の準備中" : "表示中");
            ConnectionChanged?.Invoke();
        }
        catch (Exception error)
        {
            DisconnectConnection();
            ScheduleRetry(error);
        }
    }

    private void ScheduleRetry(Exception error)
    {
        if (paused || disposed) return;
        if (attempts >= RetryDelays.Length)
        {
            SetState("表示エラー（次の壁紙で再試行）");
            report(error);
            return;
        }
        SetState("デスクトップへ再接続待ち");
        var version = generation;
        retry = schedule(RetryDelays[attempts++], () => {
            if (disposed || paused || version != generation) return;
            retry?.Dispose(); retry = null;
            Connect();
        });
    }

    private void Lost()
    {
        if (paused || disposed) return;
        Disconnect();
        attempts = 0;
        SetState("デスクトップへ再接続待ち");
        ScheduleRetry(new InvalidOperationException("デスクトップの接続が失われました。"));
    }

    public void DesktopChanged()
    {
        if (paused || disposed) return;
        Disconnect();
        RetryNow();
    }

    public void CheckHealth()
    {
        if (connection != null && !connection.IsAlive) Lost();
    }

    public bool Present(RenderedFrame frame)
    {
        if (!CanRender || !monitors.SequenceEqual(frame.Monitors)) return false;
        try
        {
            // Borrow until every surface accepts the image. Failed surfaces are destroyed
            // before the caller disposes its still-owned frame.
            connection!.Show(frame.Image, frame.Bounds);
            var old = image;
            image = frame.TakeBitmap();
            imageBounds = frame.Bounds;
            old?.Dispose();
            SetState("表示中");
            return true;
        }
        catch (Exception error)
        {
            Disconnect();
            attempts = 0;
            ScheduleRetry(error);
            return false;
        }
    }

    public void Pause()
    {
        paused = true;
        Disconnect();
        image?.Dispose(); image = null;
        SetState("停止中");
    }

    private void Disconnect()
    {
        generation++;
        retry?.Dispose(); retry = null;
        DisconnectConnection();
        ConnectionChanged?.Invoke();
    }

    private void DisconnectConnection()
    {
        var old = connection;
        connection = null;
        old?.Dispose();
    }

    private void SetState(string state)
    {
        if (State == state) return;
        State = state;
        StateChanged?.Invoke();
    }

    public void Dispose()
    {
        if (disposed) return;
        disposed = true;
        Pause();
    }

    internal static IDisposable ScheduleOnUi(int milliseconds, Action action)
    {
        var timer = new System.Windows.Forms.Timer { Interval = milliseconds };
        timer.Tick += (_, _) => { timer.Stop(); action(); };
        timer.Start();
        return timer;
    }
}
