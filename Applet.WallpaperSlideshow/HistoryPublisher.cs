using System.Text.Json;
using AppDock.SDK;
using at365.WallpaperSlideshow;

namespace Applets.WallpaperSlideshow;

/// <summary>Publishes path metadata only. History pixels are owned by the local JavaScript page.</summary>
internal sealed class HistoryPublisher(Form dispatcher, IStorageService storage)
{
    internal const string PageId = "history";
    private readonly SemaphoreSlim gate = new(1, 1);
    private readonly CancellationTokenSource lifetime = new();
    private string[] publishedKeys = [];
    private readonly HashSet<string> retiredKeys = [];
    private long publishedRevision = -1;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    public async Task PublishAsync(CancellationToken token)
    {
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(token, lifetime.Token);
        await gate.WaitAsync(linked.Token);
        try {
            var snapshot = await dispatcher.InvokeAsync(() => new {
                revision = HistoryManager.Instance.Revision,
                monitorCount = HistoryManager.Instance.MonitorCount,
                entries = HistoryManager.Instance.Snapshot()
            }, linked.Token);
            if (snapshot.revision == publishedRevision) { await ReleaseRetiredAsync(linked.Token); return; }
            var generation = Guid.NewGuid().ToString("N");
            var keys = new List<string>();
            var monitors = new List<object>();
            try {
                for (var monitor = 0; monitor < snapshot.monitorCount; monitor++) {
                    var paths = snapshot.entries.Where(entry => entry.Monitor == monitor).Select(entry => entry.Path).ToArray();
                    var chunks = new List<string>();
                    var offset = 0;
                    while (offset < paths.Length) {
                        var values = new List<string>();
                        var bytes = 2;
                        while (offset < paths.Length) {
                            var length = JsonSerializer.SerializeToUtf8Bytes(paths[offset], Json).Length + 1;
                            if (values.Count > 0 && bytes + length > 240 * 1024) break;
                            values.Add(paths[offset++]); bytes += length;
                        }
                        var key = $"history-{generation}-{keys.Count}";
                        keys.Add(key); chunks.Add(key);
                        await storage.SetAsync(key, values, StorageScope.Memory, linked.Token);
                    }
                    monitors.Add(new { count = paths.Length, chunks });
                }
                // Readers switch generations only after every immutable chunk has arrived.
                await storage.SetAsync("history", new { schemaVersion = 1, revision = snapshot.revision, generation, monitors }, StorageScope.Memory, linked.Token);
                var old = publishedKeys;
                publishedKeys = keys.ToArray(); publishedRevision = snapshot.revision;
                retiredKeys.UnionWith(old);
                retiredKeys.ExceptWith(publishedKeys);
                await ReleaseRetiredAsync(linked.Token);
            } catch {
                // Keep uncertain publications readable until a later index is acknowledged.
                retiredKeys.UnionWith(keys.Except(publishedKeys));
                throw;
            }
        } finally { gate.Release(); }
    }
    public void Stop() => lifetime.Cancel();
    private async Task ReleaseRetiredAsync(CancellationToken token)
    {
        foreach (var key in retiredKeys.ToArray()) {
            await storage.SetAsync<object?>(key, null, StorageScope.Memory, token);
            retiredKeys.Remove(key);
        }
    }
}
