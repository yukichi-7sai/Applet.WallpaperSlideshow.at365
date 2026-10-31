namespace at365.WallpaperSlideshow;

public sealed class HistoryManager
{
    public static HistoryManager Instance { get; } = new();
    private LinkedList<string>[] history = [];
    private Config? config;
    internal long Revision { get; private set; }
    private HistoryManager() { }
    public void SetConfig(Config value) {
        config = value;
        Revision++;
        foreach (var list in history) while (list.Count > value.History.Limit) list.RemoveLast();
    }
    public void EnsureInitialized(Screen[] screens) {
        EnsureMonitorCount(screens.Length);
    }
    internal int MonitorCount => history.Length;
    internal void EnsureMonitorCount(int count) {
        if (history.Length == count) return;
        var next = new LinkedList<string>[count];
        for (int i = 0; i < next.Length; i++) next[i] = i < history.Length ? history[i] : new();
        history = next;
        Revision++;
    }
    public void Push(int monitor, string path, int limit) {
        if (monitor < 0 || monitor >= history.Length || limit == 0) return;
        var list = history[monitor]; list.AddFirst(path);
        Revision++;
        while (list.Count > Math.Min(limit, config?.History.Limit ?? limit)) list.RemoveLast();
    }
    internal sealed record Entry(int Monitor, string Path);
    internal void Remove(string path) {
        foreach (var list in history) for (var node = list.First; node is not null;) {
            var next = node.Next;
            if (string.Equals(node.Value, path, StringComparison.OrdinalIgnoreCase)) { list.Remove(node); Revision++; }
            node = next;
        }
    }
    internal Entry[] Snapshot() => history.SelectMany((list, i) => list.Select(path => new Entry(i, path))).ToArray();
}
