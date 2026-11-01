export class HistoryPreferences {
  constructor(call) {
    this.call = call;
    this.width = 260;
    this.autoRefresh = false;
    this.error = "";
    this.loaded = false;
    this.reading = null;
    this.blocked = false;
  }
  static valid(value) {
    return (
      Number.isInteger(value) &&
      value >= 180 &&
      value <= 360 &&
      (value - 180) % 20 === 0
    );
  }
  async read() {
    if (!this.loaded) {
      this.reading ??= (async () => {
        try {
          const value = await this.call("storage.get", {
            key: "gallery-view",
            scope: "device",
          });
          if (value != null) {
            if (
              typeof value !== "object" ||
              Array.isArray(value) ||
              Object.keys(value).some(
                (key) =>
                  !["schemaVersion", "cardWidth", "autoRefresh"].includes(key),
              ) ||
              value.schemaVersion !== 1 ||
              !HistoryPreferences.valid(value.cardWidth) ||
              (Object.hasOwn(value, "autoRefresh") &&
                typeof value.autoRefresh !== "boolean")
            )
              throw Error();
            this.width = value.cardWidth;
            this.autoRefresh = value.autoRefresh ?? false;
          }
        } catch {
          this.blocked = true;
          this.error =
            "履歴ページの保存データを読み取れません。元のデータを確認してAppletを再起動してください。";
        }
        this.loaded = true;
      })();
      await this.reading;
    }
    return {
      cardWidth: this.width,
      autoRefresh: this.autoRefresh,
      error: this.error,
    };
  }
  async save(width, autoRefresh) {
    await this.read();
    if (width === undefined) width = this.width;
    if (autoRefresh === undefined) autoRefresh = this.autoRefresh;
    if (!HistoryPreferences.valid(width))
      throw Error("画像サイズを確認してください。");
    if (typeof autoRefresh !== "boolean")
      throw Error("自動更新の設定を確認してください。");
    if (this.blocked) throw Error(this.error);
    try {
      await this.call("storage.set", {
        key: "gallery-view",
        scope: "device",
        value: { schemaVersion: 1, cardWidth: width, autoRefresh },
      });
      this.width = width;
      this.autoRefresh = autoRefresh;
      this.error = "";
    } catch {
      this.error =
        "履歴ページの設定を保存できませんでした。保存先を確認して再試行してください。";
      throw Error(this.error);
    }
    return {
      cardWidth: this.width,
      autoRefresh: this.autoRefresh,
      error: this.error,
    };
  }
}
