using System.Diagnostics;
using System.Text.Json;
using AppDock.SDK;
using at365.WallpaperSlideshow;

namespace Applets.WallpaperSlideshow;

internal sealed class HistoryPageController(Form dispatcher, IExtensionContext context, string imageFolder,
    Func<Config?> configuration, Action<string>? deleteImage, Action<string>? openImage = null)
{
    internal const string PageId = "history";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly object sync = new();
    private readonly Dictionary<string, Snapshot> snapshots = new();
    private readonly Dictionary<int, int> positions = new();
    private readonly CancellationTokenSource lifetime = new();
    private Snapshot? current, queued, working;
    private Task worker = Task.CompletedTask;
    private bool pumping;
    private int selectedMonitor;
    private long revision;
    private Confirmation? confirmation;
    private sealed class Snapshot(string id, int monitor, int page, int total, int pageSize, int monitorCount, long revision, Size size, Item[] items, string folder, CancellationToken token)
    {
        internal readonly string Id = id, Folder = folder;
        internal readonly int Monitor = monitor, Page = page, Total = total, PageSize = pageSize, MonitorCount = monitorCount;
        internal readonly long Revision = revision;
        internal readonly Size Size = size;
        internal readonly Item[] Items = items;
        internal readonly CancellationTokenSource Cancellation = CancellationTokenSource.CreateLinkedTokenSource(token);
        internal readonly HashSet<string> Files = new();
        internal bool Released, Loading = items.Length > 0;
    }
    private sealed class Item(string path, string title)
    {
        internal readonly string Path = path, Title = title;
        internal string? ImageId, ImageUrl;
        internal string Resolution = "", SizeText = "", Status = "loading", Error = "";
    }
    private sealed record Confirmation(string Token, string Generation, string Path);
    private sealed record ItemView(int Slot, string Title, string Tooltip, string Resolution, string SizeText, string? Image, string Status, string Error);

    public async Task<JsonElement?> HandleAsync(string actionId, JsonElement input, CancellationToken token)
    {
        token.ThrowIfCancellationRequested();
        switch (actionId) {
            case "history.state": {
                var count = await dispatcher.InvokeAsync(() => HistoryManager.Instance.MonitorCount, token);
                lock (sync) return Serialize(new { monitorCount = count, monitor = selectedMonitor,
                    page = positions.GetValueOrDefault(selectedMonitor), pageSize = PageSize,
                    historyLimit = configuration()?.History.Limit ?? 30, revision, positions = new Dictionary<int, int>(positions), confirming = confirmation is not null });
            }
            case "history.read": {
                int monitor = Number(input, "monitor", 0, 100), page = Number(input, "page", 0, 1000);
                int offset = Number(input, "offset", 0, 1000), limit = Number(input, "limit", 1, 32);
                var generation = Text(input, "generation");
                var snapshot = generation.Length == 0 ? await CreateAsync(monitor, page, token) : Find(generation, false);
                lock (sync) {
                    if (snapshot.Released) throw new InvalidOperationException("履歴を更新してください。");
                    var items = new List<ItemView>();
                    var bytes = 0;
                    var next = Math.Min(offset, snapshot.Items.Length);
                    while (next < snapshot.Items.Length && items.Count < limit) {
                        var item = snapshot.Items[next];
                        var view = new ItemView(next, item.Title, item.Path, item.Resolution, item.SizeText, item.ImageUrl, item.Status, item.Error);
                        var length = JsonSerializer.SerializeToUtf8Bytes(view, Json).Length + 1;
                        if (bytes + length > 240 * 1024) break;
                        items.Add(view); bytes += length; next++;
                    }
                    if (items.Count == 0 && next < snapshot.Items.Length) throw new InvalidDataException("画像の情報が大きすぎます。");
                    return Serialize(new { generation = snapshot.Id, contentRevision = snapshot.Revision,
                        monitor = snapshot.Monitor, page = snapshot.Page, total = snapshot.Total, pageSize = snapshot.PageSize,
                        monitorCount = snapshot.MonitorCount, offset, nextOffset = next < snapshot.Items.Length ? (int?)next : null,
                        items, loading = snapshot.Loading });
                }
            }
            case "history.release":
                await ReleaseAsync(Text(input, "generation"), true, token); return null;
            case "history.open": {
                var (_, item) = Target(input);
                await dispatcher.InvokeAsync(() => {
                    if (!File.Exists(item.Path)) throw new FileNotFoundException("画像が見つかりません。", item.Path);
                    if (openImage is not null) openImage(item.Path);
                    else Process.Start(new ProcessStartInfo(item.Path) { UseShellExecute = true });
                }, token);
                return null;
            }
            case "history.delete-request": {
                var (snapshot, item) = Target(input);
                lock (sync) {
                    confirmation = new(Guid.NewGuid().ToString("N"), snapshot.Id, item.Path);
                    return Serialize(new { confirmationToken = confirmation.Token, path = item.Path });
                }
            }
            case "history.delete-cancel":
                lock (sync) { RequireConfirmation(Text(input, "confirmationToken")); confirmation = null; }
                return null;
            case "history.delete-confirm": {
                Confirmation pending;
                lock (sync) { pending = RequireConfirmation(Text(input, "confirmationToken")); confirmation = null; }
                // Consume the token before the external operation; an unknown outcome is never retried.
                await Task.Run(() => { token.ThrowIfCancellationRequested(); if (File.Exists(pending.Path)) (deleteImage ?? ImageDeletion.Recycle)(pending.Path); }, token);
                await dispatcher.InvokeAsync(() => HistoryManager.Instance.Remove(pending.Path), token);
                await InvalidateAsync(token);
                return null;
            }
            default: throw new InvalidOperationException("このページ操作は利用できません。");
        }
    }
    private int PageSize => Math.Clamp(context.Settings.Get("historyPageSize", 4), 1, 1000);
    private static JsonElement Serialize<T>(T value) => JsonSerializer.SerializeToElement(value, Json);
    private static int Number(JsonElement input, string name, int minimum, int maximum)
        => input.TryGetProperty(name, out var value) && value.TryGetInt32(out var number) && number >= minimum && number <= maximum
            ? number : throw new ArgumentException("履歴の表示範囲を確認してください。");
    private static string Text(JsonElement input, string name)
        => input.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String && value.GetString()!.Length <= 80
            ? value.GetString()! : throw new ArgumentException("履歴の識別子を確認してください。");
    private Snapshot Find(string id, bool requireCurrent)
    {
        lock (sync) return snapshots.TryGetValue(id, out var snapshot) && !snapshot.Released && (!requireCurrent || ReferenceEquals(current, snapshot))
            ? snapshot : throw new InvalidOperationException("履歴を更新してください。");
    }
    private (Snapshot Snapshot, Item Item) Target(JsonElement input)
    {
        var snapshot = Find(Text(input, "generation"), true);
        var slot = Number(input, "slot", 0, 999);
        if (slot >= snapshot.Items.Length) throw new InvalidOperationException("履歴を更新してください。");
        return (snapshot, snapshot.Items[slot]);
    }
    private Confirmation RequireConfirmation(string value)
    {
        if (confirmation is null || confirmation.Token != value) throw new InvalidOperationException("履歴から削除する画像を選び直してください。");
        Find(confirmation.Generation, true);
        return confirmation;
    }
    private async Task<Snapshot> CreateAsync(int monitor, int page, CancellationToken token)
    {
        lifetime.Token.ThrowIfCancellationRequested();
        var pageSize = PageSize;
        var data = await dispatcher.InvokeAsync(() => {
            var count = HistoryManager.Instance.MonitorCount;
            var selected = Math.Clamp(monitor, 0, Math.Max(0, count - 1));
            var entries = HistoryManager.Instance.Snapshot().Where(entry => entry.Monitor == selected).ToArray();
            return (count, selected, entries);
        }, token);
        page = Math.Clamp(page, 0, Math.Max(0, (data.entries.Length - 1) / pageSize));
        var options = configuration()?.History;
        var maximum = Math.Clamp(options?.MaxFileNameLength ?? 30, 1, 1024);
        var items = data.entries.Skip(page * pageSize).Take(pageSize).Select(entry => {
            var title = Path.GetFileName(entry.Path);
            return new Item(entry.Path, title.Length > maximum ? title[..maximum] + "…" : title);
        }).ToArray();
        string[] expired;
        lock (sync) expired = snapshots.Keys.Where(id => current?.Id != id).ToArray();
        foreach (var id in expired) await ReleaseAsync(id, true, token);
        var idValue = Guid.NewGuid().ToString("N");
        var folder = Path.Combine(imageFolder, idValue);
        Directory.CreateDirectory(folder);
        Snapshot snapshot;
        lock (sync) {
            confirmation = null;
            current?.Cancellation.Cancel();
            snapshot = new(idValue, data.selected, page, data.entries.Length, pageSize, data.count, revision,
                new Size(Math.Clamp(options?.ThumbnailWidth ?? 480, 1, 2048), Math.Clamp(options?.ThumbnailHeight ?? 360, 1, 2048)), items, folder, lifetime.Token);
            selectedMonitor = data.selected; positions[selectedMonitor] = page;
            snapshots.Add(snapshot.Id, snapshot); current = snapshot; queued = snapshot;
            if (!pumping) { pumping = true; worker = Task.Run(PumpAsync); }
        }
        return snapshot;
    }
    private async Task PumpAsync()
    {
        while (true) {
            Snapshot? snapshot;
            lock (sync) { snapshot = queued; queued = null; working = snapshot; if (snapshot is null) { pumping = false; return; } }
            try { await GenerateAsync(snapshot); }
            catch (OperationCanceledException) when (snapshot.Cancellation.IsCancellationRequested) { }
            catch (Exception error) { AppLog.Error("履歴サムネイルの作成", error); }
            finally {
                lock (sync) snapshot.Loading = false;
                if (!snapshot.Cancellation.IsCancellationRequested) await NotifyAsync();
                lock (sync) {
                    working = null;
                    if (snapshot.Released) snapshot.Cancellation.Dispose();
                }
                if (snapshot.Released) TryDeleteFolder(snapshot.Folder);
                if (lifetime.IsCancellationRequested) TryDeleteFolder(imageFolder);
            }
        }
    }
    private async Task GenerateAsync(Snapshot snapshot)
    {
        var token = snapshot.Cancellation.Token;
        for (var index = 0; index < snapshot.Items.Length; index++) {
            token.ThrowIfCancellationRequested();
            var item = snapshot.Items[index];
            string? file = null, imageId = null;
            var retained = false;
            var registering = false;
            try {
                using var thumbnail = ThumbnailResult.Load(item.Path, snapshot.Size, token);
                token.ThrowIfCancellationRequested();
                string? url = null;
                if (thumbnail.Image is not null) {
                    file = Path.Combine(snapshot.Folder, Guid.NewGuid().ToString("N") + ".png");
                    lock (sync) snapshot.Files.Add(file);
                    // GDI+ filename APIs reject long cache paths; managed streams support them.
                    using (var output = new FileStream(file, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                        thumbnail.Image.Save(output, System.Drawing.Imaging.ImageFormat.Png);
                    token.ThrowIfCancellationRequested();
                    registering = true;
                    var registered = await context.Pages.RegisterImagesAsync(PageId, [new PageImageFile("slot." + index, file)], token);
                    registering = false;
                    imageId = registered.Images.Single().Id; url = registered.Images.Single().Url;
                }
                lock (sync) {
                    token.ThrowIfCancellationRequested();
                    item.Resolution = thumbnail.Resolution; item.SizeText = thumbnail.SizeText;
                    item.ImageId = imageId; item.ImageUrl = url;
                    item.Status = url is null ? "error" : "ready";
                    item.Error = url is null ? "画像を読み込めません" : "";
                    retained = true;
                }
            } catch (OperationCanceledException) when (token.IsCancellationRequested) { throw; }
            catch (Exception error) {
                AppLog.Error("履歴画像の読み込み", error);
                // A closed View or a rejected registration must not cause one RPC failure per remaining image.
                if (registering) {
                    lock (sync) foreach (var remaining in snapshot.Items.Skip(index)) {
                        remaining.Status = "error"; remaining.Error = "履歴を更新してください";
                    }
                    return;
                }
                lock (sync) { item.Status = "error"; item.Error = "画像を読み込めません"; }
            } finally {
                if (!retained) {
                    if (imageId is not null) await ReleaseReferencesAsync([imageId], CancellationToken.None);
                    if (file is not null) TryDelete(file);
                }
            }
            if (index == 0 || index % 8 == 7 || index == snapshot.Items.Length - 1) await NotifyAsync();
        }
    }
    public async Task InvalidateAsync(CancellationToken token)
    {
        lock (sync) revision++;
        if (!lifetime.IsCancellationRequested) await NotifyAsync(token);
    }
    private async Task NotifyAsync(CancellationToken token = default)
    {
        if (lifetime.IsCancellationRequested) return;
        try { await context.Pages.NotifyChangedAsync(PageId, token); }
        catch (OperationCanceledException) { }
        catch (Exception error) { if (!lifetime.IsCancellationRequested) AppLog.Error("履歴ページの更新通知", error); }
    }
    private async Task ReleaseReferencesAsync(IReadOnlyList<string> ids, CancellationToken token)
    {
        if (lifetime.IsCancellationRequested || ids.Count == 0) return;
        for (var offset = 0; offset < ids.Count; offset += 64) {
            try { await context.Pages.ReleaseImagesAsync(PageId, ids.Skip(offset).Take(64).ToArray(), token); }
            catch (OperationCanceledException) { return; }
            catch (InvalidOperationException) { return; } // The View may already have been disposed.
        }
    }
    private async Task ReleaseAsync(string id, bool notifyHost, CancellationToken token)
    {
        Snapshot? snapshot;
        string[] files, references;
        lock (sync) {
            if (!snapshots.Remove(id, out snapshot)) return;
            snapshot.Released = true; snapshot.Cancellation.Cancel();
            if (!ReferenceEquals(working, snapshot)) snapshot.Cancellation.Dispose();
            if (ReferenceEquals(current, snapshot)) current = null;
            if (ReferenceEquals(queued, snapshot)) queued = null;
            if (confirmation?.Generation == id) confirmation = null;
            files = snapshot.Files.ToArray();
            references = snapshot.Items.Select(item => item.ImageId).OfType<string>().ToArray();
        }
        if (notifyHost) await ReleaseReferencesAsync(references, token);
        foreach (var file in files) TryDelete(file);
        TryDeleteFolder(snapshot.Folder);
    }
    public async Task ResetAsync(bool stopping, CancellationToken token)
    {
        if (stopping) lifetime.Cancel();
        string[] ids;
        lock (sync) { confirmation = null; ids = snapshots.Keys.ToArray(); }
        foreach (var id in ids) await ReleaseAsync(id, !stopping, token);
        if (stopping) {
            await Task.WhenAny(worker, Task.Delay(300, CancellationToken.None));
            TryDeleteFolder(imageFolder);
        }
    }
    private static void TryDelete(string file) {
        try { File.Delete(file); } catch (IOException) { } catch (UnauthorizedAccessException error) { AppLog.Error("履歴画像の解放", error); }
    }
    private static void TryDeleteFolder(string folder) {
        try { Directory.Delete(folder, false); } catch (IOException) { } catch (UnauthorizedAccessException error) { AppLog.Error("履歴フォルダーの解放", error); }
    }
}
