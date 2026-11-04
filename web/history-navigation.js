/** Stable occurrence IDs distinguish repeated paths across page boundaries. */
export function historyEntries(snapshot, monitor) {
  const occurrences = new Map();
  return (snapshot?.monitors[monitor]?.entries ?? []).map((entry, index) => {
    const occurrence = occurrences.get(entry.path) ?? 0;
    occurrences.set(entry.path, occurrence + 1);
    return {
      ...entry,
      index,
      id: JSON.stringify([monitor, entry.path, occurrence]),
    };
  });
}

/** Selection belongs to the View; a preview keeps the opened history order. */
export class HistoryNavigation {
  selected = null;
  session = null;

  select(monitor, item) {
    this.selected = { monitor, id: item.id, index: item.index };
  }

  open(monitor, items, id) {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.session = { monitor, items: items.slice(), index };
    this.select(monitor, items[index]);
    return true;
  }

  get current() {
    return this.session?.items[this.session.index];
  }

  canMove(direction) {
    if (!this.session || ![-1, 1].includes(direction)) return false;
    const index = this.session.index + direction;
    return index >= 0 && index < this.session.items.length;
  }

  move(direction) {
    if (!this.canMove(direction)) return false;
    this.session.index += direction;
    this.select(this.session.monitor, this.current);
    return true;
  }

  reconcile(snapshot) {
    if (!this.selected) return;
    const entry = historyEntries(snapshot, this.selected.monitor).find(
      (item) => item.id === this.selected.id,
    );
    if (entry) this.select(this.selected.monitor, entry);
    else this.selected = null;
  }

  close() {
    const target = this.session ? this.selected : null;
    this.session = null;
    return target;
  }
}
