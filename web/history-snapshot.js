/** Holds one history generation while original images remain lazy and View-owned. */
export class HistorySnapshot {
  constructor(call) {
    this.call = call;
    this.current = null;
    this.epoch = 0;
    this.pendingLease = Promise.resolve();
  }
  latest() {
    return this.call("storage.get", { key: "history", scope: "memory" });
  }
  lease(generations) {
    const values = [...new Set(generations.filter(Boolean))];
    const next = this.pendingLease
      .catch(() => {})
      .then(() =>
        this.call("storage.set", {
          key: "history-snapshot",
          scope: "memory",
          value: values.length ? { generations: values } : null,
        }),
      );
    this.pendingLease = next;
    return next;
  }
  async capture(index, visible) {
    const epoch = ++this.epoch;
    const check = () => {
      if (epoch !== this.epoch || !visible())
        throw new DOMException("History closed", "AbortError");
    };
    try {
      while (true) {
        check();
        index ??= await this.latest();
        check();
        await this.lease([this.current?.generation, index?.generation]);
        check();
        const latest = await this.latest();
        check();
        if (latest?.generation !== index?.generation) {
          index = latest;
          continue;
        }
        const monitors = [];
        let retry = false;
        for (const monitor of index?.monitors ?? []) {
          const entries = [];
          for (const key of monitor.chunks) {
            const paths = await this.call("storage.get", {
              key,
              scope: "memory",
            });
            check();
            if (!Array.isArray(paths)) {
              const newest = await this.latest();
              check();
              if (newest?.generation !== index?.generation) {
                index = newest;
                retry = true;
                break;
              }
              throw Error("履歴を更新してください。");
            }
            paths.forEach((path, position) =>
              entries.push({ path, storageKey: key, pointer: `/${position}` }),
            );
          }
          if (retry) break;
          monitors.push({ count: entries.length, entries });
        }
        if (retry) continue;
        check();
        this.current = { generation: index?.generation ?? "", monitors };
        // Both generations stay pinned until the replacement is complete.
        void this.lease([this.current.generation]).catch(() => {});
        return this.current;
      }
    } catch (error) {
      if (epoch === this.epoch)
        await this.lease([this.current?.generation]).catch(() => {});
      throw error;
    }
  }
  remove(file) {
    for (const monitor of this.current?.monitors ?? []) {
      monitor.entries = monitor.entries.filter(
        (entry) => entry.path.toLowerCase() !== file.toLowerCase(),
      );
      monitor.count = monitor.entries.length;
    }
  }
  close() {
    this.epoch++;
    this.current = null;
    void this.lease([]).catch(() => {});
  }
}
