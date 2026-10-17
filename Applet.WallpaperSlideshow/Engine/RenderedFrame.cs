namespace at365.WallpaperSlideshow;

internal sealed class RenderedFrame(Bitmap bitmap, Rectangle bounds, Rectangle[] monitors,
    List<(int Monitor, string Path)> history, int historyLimit) : IDisposable
{
    private Bitmap? image = bitmap;
    public Bitmap Image => image ?? throw new ObjectDisposedException(nameof(RenderedFrame));
    public Rectangle Bounds { get; } = bounds;
    public Rectangle[] Monitors { get; } = (Rectangle[])monitors.Clone();
    public List<(int Monitor, string Path)> History { get; } = history;
    public int HistoryLimit { get; } = historyLimit;
    public Bitmap TakeBitmap() => Interlocked.Exchange(ref image, null)
        ?? throw new InvalidOperationException("描画画像はすでに受け渡されています。");
    public void Dispose() => Interlocked.Exchange(ref image, null)?.Dispose();
}
