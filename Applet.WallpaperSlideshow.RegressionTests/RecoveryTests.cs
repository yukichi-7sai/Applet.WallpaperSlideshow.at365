using System.Reflection;
using at365.WallpaperSlideshow;

internal static class RecoveryTests
{
    private static void Check(bool value, string message)
    {
        if (!value) throw new Exception(message);
    }

    public static void Run(string root)
    {

        RecoverWatcher(root);
        ScanPartialTree();
        HostLogTests.Run(root);
        RecoverWatcherOnPlayback(root);
        DisposeController();
        Console.WriteLine("PASS: watcher recovery/disposal, partial scan, logging, controller disposal");
    }

    private static void RecoverWatcher(string root)
    {
        var folder = Path.Combine(root, "images");
        int changes = 0;
        using var signal = new ManualResetEventSlim();
        using var watcher = new FolderWatcher([folder], () => { Interlocked.Increment(ref changes); signal.Set(); });
        Directory.CreateDirectory(folder);
        watcher.Refresh();
        Check(changes > 0, "Missing folder did not reconnect");
        signal.Reset();
        File.WriteAllText(Path.Combine(folder, "one.png"), "test");
        Check(signal.Wait(TimeSpan.FromSeconds(5)), "Reconnected watcher received no file events");
        watcher.MarkFailed(folder, new InternalBufferOverflowException("simulated overflow"));
        watcher.Refresh();
        signal.Reset();
        File.WriteAllText(Path.Combine(folder, "two.png"), "test");
        Check(signal.Wait(TimeSpan.FromSeconds(5)), "Watcher did not recover from error");
        File.Delete(Path.Combine(folder, "one.png"));
        File.Delete(Path.Combine(folder, "two.png"));
        Directory.Delete(folder);
        watcher.Refresh();
        Directory.CreateDirectory(folder);
        watcher.Refresh();
        signal.Reset();
        File.WriteAllText(Path.Combine(folder, "three.png"), "test");
        Check(signal.Wait(TimeSpan.FromSeconds(5)), "Recreated folder not watched");
        watcher.Dispose();
        var before = changes;
        watcher.MarkFailed(folder, new IOException("after disposal"));
        watcher.Refresh();
        Check(changes == before, "Disposed watcher delivered callbacks");
    }

    private static void ScanPartialTree()
    {
        static IEnumerable<string> Files(string path)
        {
            if (path == "denied") throw new UnauthorizedAccessException("simulated denial");
            return [path + ".png", path + ".txt"];
        }
        var files = ImageCatalog.Scan("root", Files,
            path => path == "root" ? ["denied", "good"] : Array.Empty<string>());
        Check(files.Order().SequenceEqual(new[] { "good.png", "root.png" }), "Inaccessible child discarded readable files");
    }

    private static void DisposeController()
    {
        var controller = ApplicationController.Instance;
        var field = typeof(ApplicationController).GetField("_maintenanceTimer", BindingFlags.NonPublic | BindingFlags.Instance)!;
        using var timer = new System.Windows.Forms.Timer();
        int disposed = 0;
        timer.Disposed += (_, _) => disposed++;
        field.SetValue(controller, timer);
        controller.Dispose();
        controller.Dispose();
        Check(disposed == 1, "Shutdown did not dispose maintenance timer exactly once");
    }

    private static void RecoverWatcherOnPlayback(string root)
    {
        const BindingFlags fields = BindingFlags.NonPublic | BindingFlags.Instance;
        static T Read<T>(object target, string name) =>
            (T)target.GetType().GetField(name, fields)!.GetValue(target)!;
        static void Tick(System.Windows.Forms.Timer timer) =>
            typeof(System.Windows.Forms.Timer).GetMethod("OnTick", fields)!.Invoke(timer, [EventArgs.Empty]);
        var folder = Path.Combine(root, "playback-recovery");
        var controller = (ApplicationController)Activator.CreateInstance(typeof(ApplicationController), nonPublic: true)!;
        var wallpaper = WallpaperController.Instance;
        var config = new Config { IntervalSeconds = 60, Monitors = [new MonitorConfig { Folders = [folder] }] };
        void WaitForWatchers() => Check(Read<Task>(controller, "_watcherTask").Wait(TimeSpan.FromSeconds(5)), "Watcher check did not finish");
        FileSystemWatcher? Registration() => Read<Dictionary<string, FileSystemWatcher?>>(
            Read<FolderWatcher>(controller, "_folderWatcher"), "_watchers")[folder];
        try
        {
            // Start paused so the real desktop is never connected; all subsequent display work uses the fake.
            controller.Initialize(config, DispatcherForm.Instance, manuallyPaused: true);
            WaitForWatchers();
            Read<DesktopPresenter>(wallpaper, "presenter").Dispose();
            var host = new DesktopTests.FakeHost();
            var presenter = new DesktopPresenter(host, DesktopPresenter.ScheduleOnUi, error => throw error);
            wallpaper.GetType().GetField("presenter", fields)!.SetValue(wallpaper, presenter);
            var automatic = Read<System.Windows.Forms.Timer>(controller, "_uiTimer");
            var maintenance = Read<System.Windows.Forms.Timer>(controller, "_maintenanceTimer");
            automatic.Stop();
            maintenance.Stop();
            Check(maintenance.Interval == 5000, "Desktop health interval changed");
            Directory.CreateDirectory(folder);
            Tick(maintenance);
            Tick(automatic);
            controller.Next();
            Check(Registration() == null, "Maintenance or paused playback reconnected the folder");

            controller.TogglePause(false);
            automatic.Stop();
            WaitForWatchers();
            Check(Registration() != null, "Resume did not reconnect the returned folder");
            var watcher = Read<FolderWatcher>(controller, "_folderWatcher");
            var first = Registration();
            watcher.MarkFailed(folder, new IOException("automatic update recovery"));
            Tick(maintenance);
            Check(ReferenceEquals(first, Registration()), "Desktop maintenance retried file watching");
            Tick(automatic);
            WaitForWatchers();
            Check(Registration() != null && !ReferenceEquals(first, Registration()), "Automatic update did not recover the watcher");

            first = Registration();
            watcher.MarkFailed(folder, new IOException("manual next recovery"));
            controller.Next();
            WaitForWatchers();
            Check(Registration() != null && !ReferenceEquals(first, Registration()), "Manual next did not recover the watcher");
            typeof(ApplicationController).GetField("_requiredInitialize", fields)!.SetValue(controller, 0);
            File.WriteAllText(Path.Combine(folder, "changed.png"), "fixture event only");
            Check(SpinWait.SpinUntil(() => Read<int>(controller, "_requiredInitialize") != 0, TimeSpan.FromSeconds(5)),
                "Normal file notifications stopped after recovery");

            var pending = new TaskCompletionSource();
            var taskField = typeof(ApplicationController).GetField("_watcherTask", fields)!;
            taskField.SetValue(controller, pending.Task);
            try
            {
                Tick(automatic);
                controller.Next();
                Check(ReferenceEquals(pending.Task, taskField.GetValue(controller)), "Playback overlapped an unfinished watcher check");
            }
            finally { pending.SetResult(); }

            var connection = host.Connections[^1];
            connection.IsAlive = false;
            Tick(maintenance);
            Check(connection.Disposals == 1, "Desktop maintenance no longer detects a lost display connection");
            Console.WriteLine("PASS: no periodic folder retries / paused playback / resume / automatic update / manual next / normal notifications / no overlapping checks / desktop health retained");
        }
        finally
        {
            controller.Dispose();
            var task = typeof(ApplicationController).GetField("_watcherTask", fields)!.GetValue(controller) as Task;
            task?.GetAwaiter().GetResult();
            (typeof(ApplicationController).GetField("_folderWatcher", fields)!.GetValue(controller) as FolderWatcher)?.Dispose();
        }
    }
}
