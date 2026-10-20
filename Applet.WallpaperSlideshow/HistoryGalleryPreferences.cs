using System.Text.Json;
using AppDock.SDK;

namespace Applets.WallpaperSlideshow;

internal sealed class HistoryGalleryPreferences(IStorageService storage)
{
    internal const string Key = "gallery-view";
    private readonly SemaphoreSlim gate = new(1, 1);
    private bool loaded, blocked;
    private int width = 260;
    private string error = "";
    internal sealed record View(int CardWidth, string Error);
    private sealed record Saved(int SchemaVersion, int CardWidth);
    private static bool Valid(int value) => value >= 180 && value <= 360 && (value - 180) % 20 == 0;

    internal async Task<View> ReadAsync(CancellationToken token)
    {
        await gate.WaitAsync(token);
        try { await LoadAsync(token); return new(width, error); }
        finally { gate.Release(); }
    }
    internal async Task<View> SaveAsync(int value, CancellationToken token)
    {
        if (!Valid(value)) throw new ArgumentException("画像サイズを確認してください。");
        await gate.WaitAsync(token);
        try {
            await LoadAsync(token);
            if (blocked) throw new InvalidOperationException(error);
            try {
                // This PC-local key is independent from thumbnail generation and slideshow settings.
                await storage.SetAsync(Key, new Saved(1, value), token);
                width = value; error = "";
            }
            catch (OperationCanceledException) { throw; }
            catch {
                error = "画像サイズを保存できませんでした。保存先を確認して再試行してください。";
                throw new IOException(error);
            }
            return new(width, error);
        }
        finally { gate.Release(); }
    }
    private async Task LoadAsync(CancellationToken token)
    {
        if (loaded) return;
        try {
            var value = await storage.GetAsync<JsonElement>(Key, token);
            if (value.ValueKind is not (JsonValueKind.Undefined or JsonValueKind.Null)) {
                if (value.ValueKind != JsonValueKind.Object ||
                    value.EnumerateObject().Count() != 2 ||
                    !value.TryGetProperty("schemaVersion", out var schema) || !schema.TryGetInt32(out var version) || version != 1 ||
                    !value.TryGetProperty("cardWidth", out var size) || !size.TryGetInt32(out var parsed) || !Valid(parsed))
                    throw new InvalidDataException();
                width = parsed;
            }
        }
        catch (OperationCanceledException) { throw; }
        catch {
            blocked = true;
            error = "画像サイズの保存データを読み取れません。元のデータを確認してAppletを再起動してください。";
        }
        loaded = true;
    }
}
