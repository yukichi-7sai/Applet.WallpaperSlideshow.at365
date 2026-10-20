using System.Text.Json;
using AppDock.SDK;
using Applets.WallpaperSlideshow;

internal static class GalleryPreferencesTests
{
    internal static void Run()
    {
        var storage = new FakeStorage();
        var view = new HistoryGalleryPreferences(storage);
        Check(view.ReadAsync(default).GetAwaiter().GetResult().CardWidth == 260 && storage.Writes == 0, "default without write");
        view.SaveAsync(340, default).GetAwaiter().GetResult();
        Check(new HistoryGalleryPreferences(storage).ReadAsync(default).GetAwaiter().GetResult().CardWidth == 340, "restart restores width");
        foreach (var width in new[] { 0, 179, 181, 361 }) {
            try { view.SaveAsync(width, default).GetAwaiter().GetResult(); throw new Exception("invalid width accepted"); }
            catch (ArgumentException) { }
        }
        storage.Fail = true;
        try { view.SaveAsync(200, default).GetAwaiter().GetResult(); throw new Exception("save failure accepted"); }
        catch (IOException) { }
        Check(view.ReadAsync(default).GetAwaiter().GetResult().CardWidth == 340, "failure preserves stored width");
        storage.Fail = false;
        view.SaveAsync(200, default).GetAwaiter().GetResult();
        Check(view.ReadAsync(default).GetAwaiter().GetResult().Error == "", "explicit retry recovers");
        foreach (var json in new[] { "{\"schemaVersion\":2,\"cardWidth\":200}", "{\"schemaVersion\":1,\"cardWidth\":181}", "{\"schemaVersion\":1,\"cardWidth\":200,\"unknown\":1}", "[]" }) {
            storage.Value = JsonDocument.Parse(json).RootElement.Clone();
            var writes = storage.Writes;
            var invalid = new HistoryGalleryPreferences(storage);
            var initial = invalid.ReadAsync(default).GetAwaiter().GetResult();
            Check(initial.CardWidth == 260 && initial.Error.Length > 0, "invalid state remains readable at default");
            try { invalid.SaveAsync(300, default).GetAwaiter().GetResult(); throw new Exception("corrupt storage overwritten"); }
            catch (InvalidOperationException) { }
            Check(storage.Writes == writes, "invalid state preserved");
        }
        Console.WriteLine("PASS: gallery size validation, independent storage, restart, failure/retry and corrupt/unknown state preservation");
    }
    private static void Check(bool value, string message) { if (!value) throw new Exception(message); }
    private sealed class FakeStorage : IStorageService
    {
        internal JsonElement Value;
        internal bool Fail;
        internal int Writes;
        public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        {
            Check(key == HistoryGalleryPreferences.Key, "only gallery storage");
            return Task.FromResult(Value.ValueKind == JsonValueKind.Undefined ? default : JsonSerializer.Deserialize<T>(Value.GetRawText()));
        }
        public Task SetAsync<T>(string key, T value, CancellationToken cancellationToken = default)
        {
            Check(key == HistoryGalleryPreferences.Key, "only gallery storage");
            if (Fail) throw new IOException("fixture");
            Value = JsonSerializer.SerializeToElement(value, new JsonSerializerOptions(JsonSerializerDefaults.Web));
            Writes++;
            return Task.CompletedTask;
        }
    }
}
