/** Encoded thumbnails live only in this mounted page; stale reads cannot refill a released cache. */
export class MemoryImages {
  constructor(call, visible, changed) {
    this.call = call;
    this.visible = visible;
    this.changed = changed;
    this.entries = new Map();
    this.sources = new Map();
    this.epoch = 0;
  }
  async source(item) {
    const existing = this.sources.get(item.path);
    if (existing) return existing;
    const epoch = this.epoch;
    const promise = (async () => {
      const source = await this.call("sourceImages.register", {
        key: item.storageKey,
        pointer: item.pointer,
        file: item.path,
      });
      if (
        epoch !== this.epoch ||
        !this.visible() ||
        this.sources.get(item.path) !== promise
      ) {
        void this.call("sourceImages.release", { ids: [source.id] }).catch(
          () => {},
        );
        throw new DOMException("Page closed", "AbortError");
      }
      return source;
    })();
    this.sources.set(item.path, promise);
    try {
      return await promise;
    } catch (error) {
      if (this.sources.get(item.path) === promise)
        this.sources.delete(item.path);
      throw error;
    }
  }
  image(item, width, height) {
    const key = JSON.stringify([item.path, width, height]);
    const existing = this.entries.get(key);
    if (existing)
      return existing.promise.then((url) => {
        if (
          this.visible() &&
          this.entries.get(key) === existing &&
          existing.info
        ) {
          Object.assign(item, existing.info);
          this.changed(item);
        }
        return url;
      });
    const entry = {
      file: item.path,
      controller: new AbortController(),
      url: null,
      epoch: this.epoch,
    };
    this.entries.set(key, entry);
    const live = () =>
      entry.epoch === this.epoch &&
      this.visible() &&
      this.entries.get(key) === entry;
    entry.promise = (async () => {
      let bitmap, canvas;
      try {
        const source = await this.source(item);
        const response = await fetch(source.url, {
          signal: entry.controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw Error("画像を読み込めません");
        const blob = await response.blob();
        if (!live()) throw new DOMException("Page closed", "AbortError");
        bitmap = await createImageBitmap(blob);
        if (!live()) throw new DOMException("Page closed", "AbortError");
        const scale = Math.min(1, width / bitmap.width, height / bitmap.height);
        canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(bitmap.width * scale));
        canvas.height = Math.max(1, Math.floor(bitmap.height * scale));
        canvas
          .getContext("2d")
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        entry.info = {
          resolution: `${bitmap.width}×${bitmap.height}`,
          sizeText: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        };
        Object.assign(item, entry.info);
        bitmap.close();
        bitmap = null;
        const thumbnail = await new Promise((resolve, reject) =>
          canvas.toBlob(
            (value) =>
              value ? resolve(value) : reject(Error("画像を読み込めません")),
            "image/png",
          ),
        );
        if (!live()) throw new DOMException("Page closed", "AbortError");
        entry.url = URL.createObjectURL(thumbnail);
        this.changed(item);
        return entry.url;
      } catch (error) {
        if (live() && error.name !== "AbortError") {
          this.entries.delete(key);
          item.status = "error";
          item.error = "画像を読み込めません";
          this.changed(item);
        }
        throw error;
      } finally {
        bitmap?.close();
        if (canvas) {
          canvas.width = 1;
          canvas.height = 1;
        }
      }
    })();
    return entry.promise;
  }
  retain(files) {
    for (const [key, entry] of this.entries)
      if (!files.has(entry.file)) this.release(key, entry);
    for (const [file, pending] of this.sources)
      if (!files.has(file)) {
        this.sources.delete(file);
        void pending
          .then((source) =>
            this.call("sourceImages.release", { ids: [source.id] }),
          )
          .catch(() => {});
      }
  }
  release(key, entry) {
    this.entries.delete(key);
    entry.controller.abort();
    if (entry.url) URL.revokeObjectURL(entry.url);
  }
  clear() {
    this.epoch++;
    for (const [key, entry] of this.entries) this.release(key, entry);
    for (const pending of this.sources.values())
      void pending
        .then((source) =>
          this.call("sourceImages.release", { ids: [source.id] }),
        )
        .catch(() => {});
    this.sources.clear();
  }
}
