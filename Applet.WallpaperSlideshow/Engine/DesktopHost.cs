using System.ComponentModel;
using System.Runtime.InteropServices;

namespace at365.WallpaperSlideshow;

internal sealed class DesktopHost(Action<Action> post) : IDesktopHost
{
    internal sealed record Attachment(nint Parent, nint Icons, nint Wallpaper, uint Process, bool Raised);

    internal static Attachment? Inspect(bool prepare = false)
    {
        var progman = Native.FindWindow("Progman", null);
        if (progman == 0) return null;
        if (prepare)
            Native.SendMessageTimeout(progman, 0x052c, 0xd, 1, 2, 1000, out _);
        var icons = Native.FindWindowEx(progman, 0, "SHELLDLL_DefView", null);
        var wallpaper = Native.FindWindowEx(progman, 0, "WorkerW", null);
        Native.GetWindowThreadProcessId(progman, out var process);
        if (icons != 0 && wallpaper != 0)
            return new(progman, icons, wallpaper, process, true);
        Attachment? result = null;
        Native.EnumWindows((top, _) => {
            var view = Native.FindWindowEx(top, 0, "SHELLDLL_DefView", null);
            if (view == 0) return true;
            var worker = Native.FindWindowEx(0, top, "WorkerW", null);
            Native.GetWindowThreadProcessId(top, out var owner);
            Native.GetWindowThreadProcessId(worker, out var workerOwner);
            if (worker != 0 && owner == process && workerOwner == process)
                result = new(worker, view, worker, process, false);
            return result == null;
        }, 0);
        return result;
    }

    public IDesktopConnection Connect(Rectangle[] monitors, Action disconnected)
    {
        if (monitors.Length == 0) throw new InvalidOperationException("モニターがありません。");
        var target = Inspect(true) ?? throw new InvalidOperationException("デスクトップの背面表示先を取得できません。");
        return new Connection(target, monitors, post, disconnected);
    }

    private sealed class Connection : IDesktopConnection
    {
        private readonly Attachment target;
        private readonly List<Surface> surfaces = [];
        private readonly Native.WinEventCallback callback;
        private nint hook;
        private bool disposed;
        private int notified;

        public Connection(Attachment target, Rectangle[] monitors, Action<Action> post, Action disconnected)
        {
            this.target = target;
            void Lost()
            {
                if (disposed || Interlocked.Exchange(ref notified, 1) != 0) return;
                post(() => { if (!disposed) disconnected(); });
            }
            callback = (_, _, window, obj, child, _, _) => {
                if (obj == 0 && child == 0 && !Native.IsWindow(window)
                    && (window == target.Parent || window == target.Icons || window == target.Wallpaper)) Lost();
            };
            try
            {
                using var dpi = new DpiScope(target.Parent);
                foreach (var monitor in monitors) surfaces.Add(new Surface(target, monitor, Lost));
                hook = Native.SetWinEventHook(0x8001, 0x8001, 0, callback, target.Process, 0, 0);
                if (hook == 0) throw new Win32Exception(Marshal.GetLastWin32Error(), "デスクトップの破棄通知を購読できません。");
                if (!IsAlive) throw new InvalidOperationException("デスクトップの配置先が変更されました。");
            }
            catch { Dispose(); throw; }
        }

        public bool IsAlive => !disposed && Native.IsWindow(target.Parent) && Native.IsWindow(target.Icons)
            && Native.IsWindow(target.Wallpaper) && surfaces.All(s => s.IsAttached);

        public void Show(Bitmap image, Rectangle bounds)
        {
            if (!IsAlive) throw new InvalidOperationException("デスクトップの接続が失われました。");
            using var dpi = new DpiScope(target.Parent);
            foreach (var surface in surfaces) surface.SetImage(image, bounds);
            foreach (var surface in surfaces) surface.Display();
        }

        public void Dispose()
        {
            if (disposed) return;
            disposed = true;
            if (hook != 0) { Native.UnhookWinEvent(hook); hook = 0; }
            foreach (var surface in surfaces) surface.Dispose();
            surfaces.Clear();
            GC.KeepAlive(callback);
        }
    }

    private sealed class Surface : NativeWindow, IDisposable
    {
        private readonly Attachment target;
        private readonly Rectangle monitor;
        private readonly Action lost;
        private readonly BufferedGraphicsContext buffers = new();
        private Bitmap? image;
        private Rectangle source;
        private bool closing;
        private bool displayed;
        public bool IsAttached => Handle != 0 && Native.GetParent(Handle) == target.Parent
            && (!displayed || IsOrdered());

        private bool IsOrdered()
        {
            if (!target.Raised) return true;
            for (var next = Native.GetWindow(target.Icons, 2); next != 0; next = Native.GetWindow(next, 2))
            {
                if (next == Handle) return true;
                if (next == target.Wallpaper) return false;
            }
            return false;
        }

        public Surface(Attachment target, Rectangle monitor, Action lost)
        {
            this.target = target; this.monitor = monitor; this.lost = lost;
            try
            {
                var top = new Native.Point(monitor.Left, monitor.Top);
                var bottom = new Native.Point(monitor.Right, monitor.Bottom);
                if (!Native.PhysicalToLogicalPointForPerMonitorDPI(target.Parent, ref top)
                    || !Native.PhysicalToLogicalPointForPerMonitorDPI(target.Parent, ref bottom))
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "デスクトップ座標を変換できません。");
                Native.MapWindowPoints(0, target.Parent, ref top, 1);
                Native.MapWindowPoints(0, target.Parent, ref bottom, 1);
                CreateHandle(new CreateParams {
                    Caption = "AppDock Wallpaper Surface", Parent = target.Parent,
                    Style = 0x40000000 | 0x04000000, // WS_CHILD | WS_CLIPSIBLINGS
                    ExStyle = 0x08000000 | 0x00080000 | 0x00000020 | 0x00000080,
                    X = top.X, Y = top.Y, Width = bottom.X - top.X, Height = bottom.Y - top.Y,
                });
                if (Native.GetParent(Handle) != target.Parent || !Native.SetLayeredWindowAttributes(Handle, 0, 255, 2))
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "背面ウィンドウを準備できません。");
            }
            catch { Dispose(); throw; }
        }

        public void SetImage(Bitmap value, Rectangle bounds)
        {
            image = value;
            source = new Rectangle(monitor.Left - bounds.Left, monitor.Top - bounds.Top, monitor.Width, monitor.Height);
        }

        public void Display()
        {
            if (Handle == 0 || (!displayed && !Native.SetWindowPos(Handle, target.Raised ? target.Icons : 0, 0, 0, 0, 0, 0x53)))
                throw new Win32Exception(Marshal.GetLastWin32Error(), "背面ウィンドウを表示できません。");
            if (!IsOrdered()) throw new InvalidOperationException("デスクトップの重なり順を確認できません。");
            displayed = true;
            Native.InvalidateRect(Handle, 0, false);
            Native.UpdateWindow(Handle);
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == 0x14) { m.Result = 1; return; } // WM_ERASEBKGND
            if (m.Msg == 0x21) { m.Result = 3; return; } // WM_MOUSEACTIVATE / MA_NOACTIVATE
            if (m.Msg == 0x2e0) lost(); // WM_DPICHANGED: recreate in the new parent's DPI context.
            if (m.Msg == 0x318) {
                try { Draw(m.WParam); }
                catch (Exception error) { AppLog.Error("デスクトップの再描画", error); lost(); }
                m.Result = 0; return;
            } // WM_PRINTCLIENT
            if (m.Msg == 0xf)
            {
                var dc = Native.BeginPaint(Handle, out var paint);
                try
                {
                    Draw(dc);
                }
                catch (Exception error) { AppLog.Error("デスクトップの描画", error); lost(); }
                finally { Native.EndPaint(Handle, ref paint); }
                m.Result = 0; return;
            }
            if (m.Msg == 0x82 && !closing) lost(); // WM_NCDESTROY
            base.WndProc(ref m);
        }

        private void Draw(nint dc)
        {
            if (dc == 0 || image == null || !Native.GetClientRect(Handle, out var client)) return;
            var destination = new Rectangle(0, 0, client.Right, client.Bottom);
            if (destination.Width <= 0 || destination.Height <= 0) return;
            // Keep the compatible bitmap for this surface, but never retain a paint DC.
            buffers.MaximumBuffer = destination.Size;
            using var buffer = buffers.Allocate(dc, destination);
            buffer.Graphics.DrawImage(image, destination, source, GraphicsUnit.Pixel);
            buffer.Render(dc);
        }

        public void Dispose()
        {
            closing = true;
            if (Handle != 0) DestroyHandle();
            buffers.Dispose();
            image = null;
        }
    }

    private readonly struct DpiScope : IDisposable
    {
        private readonly nint previous;
        public DpiScope(nint parent)
        {
            var context = Native.GetWindowDpiAwarenessContext(parent);
            previous = context != 0 ? Native.SetThreadDpiAwarenessContext(context) : 0;
            if (previous == 0) throw new Win32Exception(Marshal.GetLastWin32Error(), "デスクトップのDPI設定を取得できません。");
        }
        public void Dispose() { if (previous != 0) Native.SetThreadDpiAwarenessContext(previous); }
    }

    private static class Native
    {
        [StructLayout(LayoutKind.Sequential)] internal struct Point(int x, int y) { public int X = x, Y = y; }
        [StructLayout(LayoutKind.Sequential)] internal struct Rect { public int Left, Top, Right, Bottom; }
        [StructLayout(LayoutKind.Sequential)] internal struct Paint {
            public nint Dc; public int Erase; public Rect Rectangle; public int Restore, Incremental;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 32)] public byte[] Reserved;
        }
        internal delegate bool EnumCallback(nint window, nint parameter);
        internal delegate void WinEventCallback(nint hook, uint evt, nint window, int obj, int child, uint thread, uint time);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] internal static extern nint FindWindow(string name, string? title);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] internal static extern nint FindWindowEx(nint parent, nint after, string name, string? title);
        [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool EnumWindows(EnumCallback callback, nint parameter);
        [DllImport("user32.dll")] internal static extern uint GetWindowThreadProcessId(nint window, out uint process);
        [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool IsWindow(nint window);
        [DllImport("user32.dll")] internal static extern nint GetParent(nint window);
        [DllImport("user32.dll")] internal static extern nint GetWindow(nint window, uint relation);
        [DllImport("user32.dll", SetLastError = true)] internal static extern nint SendMessageTimeout(nint window, uint message, nint wparam, nint lparam, uint flags, uint timeout, out nint result);
        [DllImport("user32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool SetLayeredWindowAttributes(nint window, uint key, byte alpha, uint flags);
        [DllImport("user32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool SetWindowPos(nint window, nint after, int x, int y, int width, int height, uint flags);
        [DllImport("user32.dll")] internal static extern nint GetWindowDpiAwarenessContext(nint window);
        [DllImport("user32.dll", SetLastError = true)] internal static extern nint SetThreadDpiAwarenessContext(nint context);
        [DllImport("user32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool PhysicalToLogicalPointForPerMonitorDPI(nint window, ref Point point);
        [DllImport("user32.dll")] internal static extern int MapWindowPoints(nint from, nint to, ref Point point, uint count);
        [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool InvalidateRect(nint window, nint rect, [MarshalAs(UnmanagedType.Bool)] bool erase);
        [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool UpdateWindow(nint window);
        [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool GetClientRect(nint window, out Rect rect);
        [DllImport("user32.dll")] internal static extern nint BeginPaint(nint window, out Paint paint);
        [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool EndPaint(nint window, ref Paint paint);
        [DllImport("user32.dll", SetLastError = true)] internal static extern nint SetWinEventHook(uint min, uint max, nint module, WinEventCallback callback, uint process, uint thread, uint flags);
        [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool UnhookWinEvent(nint hook);
    }
}
