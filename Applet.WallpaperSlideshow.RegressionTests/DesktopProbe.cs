using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using at365.WallpaperSlideshow;
using Microsoft.Win32;

internal static class DesktopProbe
{
    public static void Run(bool display)
    {
        Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        var bounds = Screen.AllScreens.OrderBy(s => s.Bounds.Left).ThenBy(s => s.Bounds.Top).Select(s => s.Bounds).ToArray();
        var target = DesktopHost.Inspect();
        Console.WriteLine(JsonSerializer.Serialize(new {
            mode = display ? "bounded-real-desktop" : "read-only-inspection",
            os = Environment.OSVersion.VersionString,
            monitors = bounds.Select(b => new { b.X, b.Y, b.Width, b.Height }),
            parent = target?.Parent.ToInt64(), raised = target?.Raised,
            dpiContext = target == null ? 0 : GetWindowDpiAwarenessContext(target.Parent).ToInt64(),
        }));
        if (!display) return;
        var before = Snapshot();
        var foreground = GetForegroundWindow();
        using var dispatcher = new Form { ShowInTaskbar = false };
        _ = dispatcher.Handle;
        var virtualBounds = bounds.Aggregate(Rectangle.Union);
        using var bitmap = new Bitmap(virtualBounds.Width, virtualBounds.Height);
        using (var graphics = Graphics.FromImage(bitmap)) graphics.Clear(Color.FromArgb(31, 71, 113));
        var lost = false;
        using (var connection = new DesktopHost(a => dispatcher.BeginInvoke(a)).Connect(bounds, () => lost = true))
        {
            connection.Show(bitmap, virtualBounds);
            var clock = Stopwatch.StartNew();
            while (clock.ElapsedMilliseconds < 1200) { Application.DoEvents(); Thread.Sleep(10); }
            if (!connection.IsAlive || lost) throw new Exception("Real desktop connection was lost during the bounded smoke");
            var surfaces = OwnSurfaces();
            if (surfaces.Length != bounds.Length) throw new Exception("Real desktop surface count mismatch");
            foreach (var window in surfaces)
            {
                GetWindowRect(window, out var rect);
                if (!bounds.Contains(Rectangle.FromLTRB(rect.Left, rect.Top, rect.Right, rect.Bottom)))
                    throw new Exception("Physical desktop surface bounds changed by DPI virtualization");
                if ((GetWindowLong(window, -20) & 0x80020) != 0x80020)
                    throw new Exception("Desktop surface does not have layered input transparency");
            }
            Console.WriteLine(JsonSerializer.Serialize(new { connected = true, surfaces = surfaces.Length,
                foregroundPreserved = foreground == GetForegroundWindow(), wallpaperSettingsAndCachePreserved = before == Snapshot() }));
        }
        Application.DoEvents();
        if (OwnSurfaces().Length != 0) throw new Exception("Desktop surfaces survived disposal");
        Console.WriteLine("PASS: bounded real Explorer attachment / physical geometry / input styles / deterministic disposal");
    }

    private static string Snapshot()
    {
        using var key = Registry.CurrentUser.OpenSubKey(@"Control Panel\Desktop");
        var values = string.Join("|", new[] { "WallPaper", "WallpaperStyle", "TileWallpaper" }.Select(n => key?.GetValue(n)?.ToString()));
        var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Microsoft", "Windows", "Themes", "TranscodedWallpaper");
        if (File.Exists(path))
        {
            using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
            values += "|" + Convert.ToHexString(SHA256.HashData(stream)) + "|" + File.GetLastWriteTimeUtc(path).Ticks;
        }
        return values;
    }

    public static void WriteBackground() => Console.WriteLine(JsonSerializer.Serialize(new { snapshot = Snapshot() }));

    public static void InspectSurfaces(uint process)
    {
        Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);
        using var child = Process.GetProcessById((int)process);
        Console.WriteLine(JsonSerializer.Serialize(new {
            windows = Surfaces(process).Select(window => {
                GetWindowRect(window, out var rect);
                return new { handle = window.ToInt64(), rect.Left, rect.Top, rect.Right, rect.Bottom,
                    parent = GetParent(window).ToInt64(), dpi = GetDpiForWindow(window), extendedStyle = GetWindowLong(window, -20) };
            }),
            gdiObjects = GetGuiResources(child.Handle, 0), userObjects = GetGuiResources(child.Handle, 1),
            privateBytes = child.PrivateMemorySize64,
        }));
    }

    public static void CloseSurface(uint process, nint window)
    {
        if (!Surfaces(process).Contains(window)) throw new InvalidOperationException("Only an explicitly selected test process's desktop surface is accepted");
        if (SendMessageTimeout(window, 0x10, 0, 0, 2, 3000, out _) == 0)
            throw new Exception("Could not close the selected test surface");
    }

    public static void CaptureSurface(uint process, nint window, string path)
    {
        if (!Surfaces(process).Contains(window)) throw new InvalidOperationException("Selected HWND is not an owned desktop surface");
        GetClientRect(window, out var rect);
        using var bitmap = new Bitmap(rect.Right, rect.Bottom);
        using (var graphics = Graphics.FromImage(bitmap))
        {
            var dc = graphics.GetHdc();
            try { if (!PrintWindow(window, dc, 1)) throw new Exception("PrintWindow failed"); }
            finally { graphics.ReleaseHdc(dc); }
        }
        bitmap.Save(path, System.Drawing.Imaging.ImageFormat.Png);
        var pixel = bitmap.GetPixel(bitmap.Width / 2, bitmap.Height / 2);
        Console.WriteLine(JsonSerializer.Serialize(new { pixel.R, pixel.G, pixel.B, bitmap.Width, bitmap.Height }));
    }

    private static nint[] OwnSurfaces() => Surfaces((uint)Environment.ProcessId);
    private static nint[] Surfaces(uint targetProcess)
    {
        var result = new List<nint>();
        var target = DesktopHost.Inspect();
        if (target == null) return [];
        EnumChildWindows(target.Parent, (window, _) => {
            GetWindowThreadProcessId(window, out var process);
            var title = new StringBuilder(100);
            GetWindowText(window, title, title.Capacity);
            if (process == targetProcess && title.ToString() == "AppDock Wallpaper Surface") result.Add(window);
            return true;
        }, 0);
        return result.ToArray();
    }

    [StructLayout(LayoutKind.Sequential)] private struct Rect { public int Left, Top, Right, Bottom; }
    private delegate bool WindowCallback(nint window, nint parameter);
    [DllImport("user32.dll")] private static extern nint GetForegroundWindow();
    [DllImport("user32.dll")] private static extern nint GetParent(nint window);
    [DllImport("user32.dll")] private static extern uint GetDpiForWindow(nint window);
    [DllImport("user32.dll")] private static extern uint GetGuiResources(nint process, uint flag);
    [DllImport("user32.dll")] private static extern nint SendMessageTimeout(nint window, uint message, nint wparam, nint lparam, uint flags, uint timeout, out nint result);
    [DllImport("user32.dll")] private static extern nint GetWindowDpiAwarenessContext(nint window);
    [DllImport("user32.dll")] private static extern bool EnumChildWindows(nint parent, WindowCallback callback, nint parameter);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(nint window, out uint process);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetWindowText(nint window, StringBuilder text, int length);
    [DllImport("user32.dll")] private static extern int GetWindowLong(nint window, int index);
    [DllImport("user32.dll")] private static extern bool GetWindowRect(nint window, out Rect rect);
    [DllImport("user32.dll")] private static extern bool GetClientRect(nint window, out Rect rect);
    [DllImport("user32.dll")] private static extern bool PrintWindow(nint window, nint dc, uint flags);
}
