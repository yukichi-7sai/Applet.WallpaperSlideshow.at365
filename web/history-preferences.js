export class HistoryPreferences {
  constructor(call) {
    this.call = call;
    this.width = 260;
    this.error = "";
    this.loaded = false;
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
      try {
        const value = await this.call("storage.get", {
          key: "gallery-view",
          scope: "device",
        });
        if (value != null) {
          if (
            typeof value !== "object" ||
            Array.isArray(value) ||
            Object.keys(value).length !== 2 ||
            value.schemaVersion !== 1 ||
            !HistoryPreferences.valid(value.cardWidth)
          )
            throw Error();
          this.width = value.cardWidth;
        }
      } catch {
        this.blocked = true;
        this.error =
          "画像サイズの保存データを読み取れません。元のデータを確認してAppletを再起動してください。";
      }
      this.loaded = true;
    }
    return { cardWidth: this.width, error: this.error };
  }
  async save(width) {
    if (!HistoryPreferences.valid(width))
      throw Error("画像サイズを確認してください。");
    await this.read();
    if (this.blocked) throw Error(this.error);
    try {
      await this.call("storage.set", {
        key: "gallery-view",
        scope: "device",
        value: { schemaVersion: 1, cardWidth: width },
      });
      this.width = width;
      this.error = "";
    } catch {
      this.error =
        "画像サイズを保存できませんでした。保存先を確認して再試行してください。";
      throw Error(this.error);
    }
    return { cardWidth: this.width, error: this.error };
  }
}
