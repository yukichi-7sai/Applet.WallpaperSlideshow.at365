using System.Drawing;
using at365.WallpaperSlideshow;

internal static class DesktopTests
{
    internal sealed class FakeHost : IDesktopHost
    {
        public int Attempts, Failures;
        public readonly List<FakeConnection> Connections = [];
        public IDesktopConnection Connect(Rectangle[] monitors, Action lost)
        {
            Attempts++;
            if (Failures-- > 0) throw new IOException("expected unavailable desktop");
            var connection = new FakeConnection(lost);
            Connections.Add(connection);
            return connection;
        }
    }
    internal sealed class FakeConnection(Action lost) : IDesktopConnection
    {
        public bool IsAlive { get; set; } = true;
        public bool FailShow;
        public int Disposals, Shows;
        public Bitmap? Image;
        public void Show(Bitmap image, Rectangle bounds) {
            if (FailShow) throw new IOException("expected show failure");
            Image = image; Shows++;
        }
        public void Lose() { IsAlive = false; lost(); }
        public void Dispose() { Disposals++; IsAlive = false; Image = null; }
    }
    private sealed class Pending(Action action) : IDisposable
    {
        public bool Cancelled;
        public void Fire() => action(); // Deliberately allow stale callbacks to exercise generations.
        public void Dispose() => Cancelled = true;
    }
    internal static RenderedFrame Frame(Color color, Rectangle[]? monitors = null)
    {
        monitors ??= [new Rectangle(-10, 0, 10, 8), new Rectangle(0, 0, 12, 8)];
        var bounds = monitors.Aggregate(Rectangle.Union);
        var bitmap = new Bitmap(bounds.Width, bounds.Height);
        using (var graphics = Graphics.FromImage(bitmap)) graphics.Clear(color);
        return new(bitmap, bounds, monitors, [(0, "fixture")], 30);
    }
    private static void Check(bool value, string message) { if (!value) throw new Exception(message); }
    private static void Disposed(Bitmap bitmap) {
        try { bitmap.GetPixel(0, 0); throw new Exception("Bitmap was not disposed"); }
        catch (ArgumentException) { }
    }
    public static void Run()
    {
        var host = new FakeHost();
        var pending = new List<(int Delay, Pending Action)>();
        var errors = new List<Exception>();
        using var presenter = new DesktopPresenter(host, (delay, action) => {
            var item = new Pending(action); pending.Add((delay, item)); return item;
        }, errors.Add);
        var bounds = new[] { new Rectangle(-10, 0, 10, 8), new Rectangle(0, 0, 12, 8) };
        presenter.Resume(bounds);
        using var first = Frame(Color.Red);
        var firstImage = first.Image;
        Check(presenter.Present(first), "Frame rejected on connected desktop");
        first.Dispose();
        Check(firstImage.GetPixel(0, 0).R == 255, "Result disposal released the displayed image");
        try { first.TakeBitmap(); throw new Exception("Frame transferred twice"); } catch (InvalidOperationException) { }
        using var next = Frame(Color.Blue);
        var nextImage = next.Image;
        Check(presenter.Present(next), "Replacement failed");
        Disposed(firstImage);
        host.Connections[^1].Lose();
        Check(!presenter.CanRender && presenter.HasImage, "Disconnect did not retain current image");
        pending[^1].Action.Fire();
        Check(presenter.CanRender && host.Connections[^1].Image == nextImage, "Reconnect lost current image");
        Check(host.Connections[^1].Shows == 1, "Reconnect re-published extra frames");
        host.Connections[^1].FailShow = true;
        using var failed = Frame(Color.Green);
        var failedImage = failed.Image;
        Check(!presenter.Present(failed), "Presentation failure was accepted");
        Check(failedImage.GetPixel(0, 0).G > 0, "Failure stole the caller's frame");
        failed.Dispose(); Disposed(failedImage);
        pending[^1].Action.Fire();
        Check(host.Connections[^1].Image == nextImage, "Presentation failure discarded previous valid frame");
        host.Connections[^1].Lose();
        var stale = pending[^1].Action;
        presenter.Pause();
        Disposed(nextImage);
        stale.Fire();
        Check(!presenter.CanRender && !presenter.HasImage, "Late reconnect resumed a paused desktop");
        presenter.DesktopChanged();
        Check(!presenter.CanRender, "Shell event bypassed pause");
        host.Failures = 20;
        presenter.Resume(bounds);
        for (int i = 0; i < 5; i++) pending[^1].Action.Fire();
        Check(errors.Count == 1 && presenter.State.Contains("表示エラー"), "Retries were not bounded or final error missing");
        Check(pending.TakeLast(5).Select(x => x.Delay).SequenceEqual(new[] {1000, 2000, 5000, 10000, 30000}), "Retry delays changed");
        host.Failures = 0;
        presenter.RetryNow();
        Check(presenter.CanRender, "Explicit retry did not recover exhausted connection");
        using var wrong = Frame(Color.Red, [new Rectangle(0, 0, 1, 1)]);
        Check(!presenter.Present(wrong), "Stale monitor geometry was displayed");
        presenter.Resume([new Rectangle(0, -20, 8, 20)]);
        Check(presenter.CanRender && !presenter.HasImage, "Geometry change retained incompatible image");
        presenter.Dispose(); presenter.Dispose();
        Check(host.Connections.All(c => c.Disposals == 1), "Connections were leaked or disposed twice");
        Console.WriteLine("PASS: memory ownership / replacement / failed frame / shell loss and reconnect / bounded retries / pause generations / geometry / disposal");
    }
}
