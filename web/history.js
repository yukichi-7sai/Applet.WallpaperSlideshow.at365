import {
  mountImageGallery,
  mountGallerySizeControl,
  mountGalleryPreview,
  gallerySize,
} from "./vendor/image-gallery/image-gallery.js";
import { HistoryPreferences } from "./history-preferences.js";
import { MemoryImages } from "./memory-images.js";

const bridge = window.appletPage;
const call = (operation, input = {}) => bridge.call(operation, input);
const memory = (key) => call("storage.get", { key, scope: "memory" });
const $ = (id) => document.getElementById(id);
const paths = {
  back: "M19 12H5m6-6-6 6 6 6",
  left: "m14 6-6 6 6 6",
  right: "m10 6 6 6-6 6",
  refresh:
    "M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1",
  monitor: "M4 4h16v12H4zM8 20h8m-4-4v4",
  close: "m6 6 12 12M18 6 6 18",
};
function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[name]);
  svg.append(path);
  return svg;
}
document
  .querySelectorAll("[data-icon]")
  .forEach((node) => node.replaceWith(icon(node.dataset.icon)));
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
let model,
  settings = {},
  visible = false,
  processing = false,
  refreshQueued = false,
  actionBusy = false;
let intent,
  deferred = false,
  forceImages = false,
  generationNumber = 0,
  confirmationToken,
  dialogFocus;
let cardWidth = gallerySize.initial,
  sizeLoaded = false,
  sizeTouched = false,
  widthSave = Promise.resolve();
let positionsLoaded = false,
  selectedMonitor = 0,
  savedPositions = "";
const positions = new Map();
const preferences = new HistoryPreferences(call);
const imageId = (item) => item.id;
const assetId = (item) =>
  JSON.stringify([
    item.path,
    settings.thumbnailWidth ?? 480,
    settings.thumbnailHeight ?? 360,
    images.epoch,
  ]);
const itemFor = (id) => model?.items.find((item) => imageId(item) === id);
const images = new MemoryImages(
  call,
  () => visible && !!model,
  (item) => {
    if (model?.items.includes(item)) renderCards();
    if (item.status === "error") changed();
  },
);
const imageFor = async (id) => {
  const item = model?.items.find((item) => assetId(item) === id);
  if (!item) throw Error("画像を読み込めません");
  return images.image(
    item,
    settings.thumbnailWidth ?? 480,
    settings.thumbnailHeight ?? 360,
  );
};
const preview = mountGalleryPreview($("preview-content"), { image: imageFor });
const gallery = mountImageGallery($("cards"), {
  scrollElement: document.documentElement,
  image: imageFor,
  select: () => {},
  activate: (id) => {
    const item = itemFor(id);
    if (!item || item.status !== "ready" || processing || actionBusy) return;
    dialogFocus = document.activeElement;
    preview.setModel({
      assetId: assetId(item),
      title: item.title,
      detail: item.path,
      labels: [],
      state: "ready",
    });
    $("preview").showModal();
  },
  action: (id, command) => {
    const item = itemFor(id);
    if (!item || !model) return;
    const focus = document.activeElement;
    if (command === "open")
      void operate(async () => {
        const source = await images.source(item);
        await call("sourceImages.open", { id: source.id });
      });
    else if (command === "delete")
      void operate(async () => {
        const source = await images.source(item);
        confirmationToken = { source, path: item.path };
        $("delete-path").textContent = item.path;
        dialogFocus = focus;
        $("delete-dialog").showModal();
      });
  },
});
function renderCards() {
  if (!model) return;
  gallery.setModel({
    cardWidth,
    fit: "cover",
    selection: "none",
    empty: "",
    items: model.items.map((item) => ({
      id: imageId(item),
      assetId: assetId(item),
      title: item.title,
      description: item.path,
      detail:
        [item.resolution, item.sizeText].filter(Boolean).join(" · ") ||
        item.error ||
        "画像を準備しています",
      labels: [],
      state: item.status,
      selectable: !processing && !actionBusy,
      actions: [
        { id: "open", title: "開く", disabled: processing || actionBusy },
        { id: "delete", title: "削除", disabled: processing || actionBusy },
      ],
    })),
  });
}
function sizeError(message) {
  $("size-error").replaceChildren();
  $("size-error").hidden = !message;
  if (!message) return;
  const retry = element("button", "button secondary", "保存を再試行");
  retry.addEventListener("click", () => saveWidth(cardWidth));
  $("size-error").append(document.createTextNode(message + " "), retry);
}
function saveWidth(value) {
  sizeTouched = true;
  widthSave = widthSave
    .catch(() => {})
    .then(async () => {
      try {
        await preferences.save(value);
        sizeError("");
      } catch (error) {
        sizeError(String(error?.message || error));
      }
    });
}
const sizeControl = mountGallerySizeControl($("gallery-size"), {
  value: cardWidth,
  change: (value) => {
    sizeTouched = true;
    cardWidth = value;
    renderCards();
  },
  commit: saveWidth,
});
$("gallery-size").querySelector('input[type="range"]').min = "180";
function showError(error) {
  $("error").textContent = String(error?.message || error).replace(
    /^Error invoking remote method '[^']+': (?:Error: )?/,
    "",
  );
  $("error").hidden = false;
}
function busy() {
  renderCards();
  $("previous").disabled =
    processing || actionBusy || !model || model.page === 0;
  $("next").disabled =
    processing ||
    actionBusy ||
    !model ||
    (model.page + 1) * model.pageSize >= model.total;
  $("cards").setAttribute("aria-busy", String(processing));
}
function requestPage(monitor, page, refresh = false) {
  intent = { monitor, page };
  generationNumber++;
  forceImages ||= refresh;
  changed();
}
function changed() {
  refreshQueued = true;
  if (visible) void drain();
}
async function readItems(index, monitor, page, pageSize) {
  const previous = new Map(model?.items.map((item) => [item.path, item]) ?? []);
  const meta = index?.monitors?.[monitor] ?? { count: 0, chunks: [] };
  const start = page * pageSize,
    end = start + pageSize;
  const result = [];
  let offset = 0;
  const duplicates = new Map();
  for (const key of meta.chunks) {
    const paths = await memory(key);
    if (!Array.isArray(paths)) {
      if ((await memory("history"))?.generation !== index.generation)
        return null;
      throw Error("履歴を更新してください。");
    }
    paths.forEach((path, position) => {
      const slot = offset + position;
      if (slot < start || slot >= end) return;
      const occurrence = duplicates.get(path) ?? 0;
      duplicates.set(path, occurrence + 1);
      const name = path.split(/[\\/]/).at(-1),
        maximum = settings.maxFileNameLength ?? 30;
      const old = previous.get(path);
      result.push({
        id: JSON.stringify([monitor, path, occurrence]),
        path,
        storageKey: key,
        pointer: `/${position}`,
        title: name.length > maximum ? name.slice(0, maximum) + "…" : name,
        status:
          old?.status === "error" && model.generation !== index.generation
            ? "ready"
            : (old?.status ?? "ready"),
        resolution: old?.resolution ?? "",
        sizeText: old?.sizeText ?? "",
        error: old?.error ?? "",
      });
    });
    offset += paths.length;
    if (offset >= end) break;
  }
  return result;
}
async function drain() {
  if (processing || actionBusy || !visible) return;
  processing = true;
  busy();
  try {
    while (refreshQueued && visible && !actionBusy) {
      refreshQueued = false;
      if ($("preview").open || $("delete-dialog").open) {
        deferred = true;
        break;
      }
      const wanted = intent;
      intent = undefined;
      const request = generationNumber;
      const snapshot = await bridge.snapshot();
      if (!visible || request !== generationNumber) continue;
      document.documentElement.classList.toggle("dark", snapshot.dark);
      const previousSize = JSON.stringify([
        settings.thumbnailWidth,
        settings.thumbnailHeight,
      ]);
      settings = snapshot.settings;
      if (!sizeLoaded) {
        const view = await preferences.read();
        sizeLoaded = true;
        if (!sizeTouched) {
          cardWidth = view.cardWidth;
          sizeControl.setValue(cardWidth);
        }
        sizeError(view.error);
      }
      if (!positionsLoaded) {
        const view = await memory("history-view");
        positionsLoaded = true;
        if (view) {
          selectedMonitor = Number.isInteger(view.monitor) ? view.monitor : 0;
          for (const [key, value] of Object.entries(view.positions ?? {}))
            if (Number.isInteger(value) && value >= 0)
              positions.set(Number(key), value);
        }
      }
      const index = await memory("history");
      const signature = JSON.stringify([
        settings.historyPageSize,
        settings.maxFileNameLength,
        settings.thumbnailWidth,
        settings.thumbnailHeight,
        settings.historyLimit,
      ]);
      if (
        !wanted &&
        !forceImages &&
        model?.generation === index?.generation &&
        model.signature === signature
      )
        continue;
      const monitorCount = index?.monitors?.length ?? 0;
      const monitor = Math.min(
        Math.max(0, wanted?.monitor ?? model?.monitor ?? selectedMonitor),
        Math.max(0, monitorCount - 1),
      );
      const pageSize = settings.historyPageSize ?? 4,
        total = index?.monitors?.[monitor]?.count ?? 0;
      const page = Math.min(
        Math.max(0, wanted?.page ?? positions.get(monitor) ?? 0),
        Math.max(0, Math.ceil(total / pageSize) - 1),
      );
      if (
        forceImages ||
        previousSize !==
          JSON.stringify([settings.thumbnailWidth, settings.thumbnailHeight])
      ) {
        images.clear();
        model = undefined;
        forceImages = false;
      }
      const items = await readItems(index, monitor, page, pageSize);
      if (items === null) {
        refreshQueued = true;
        continue;
      }
      if (!visible || request !== generationNumber) continue;
      model = {
        items,
        signature,
        generation: index?.generation ?? "empty",
        monitor,
        monitorCount,
        page,
        pageSize,
        total,
      };
      positions.set(monitor, page);
      selectedMonitor = monitor;
      images.retain(new Set(items.map((item) => item.path)));
      render();
      const view = { monitor, positions: Object.fromEntries(positions) };
      const encoded = JSON.stringify(view);
      if (encoded !== savedPositions) {
        savedPositions = encoded;
        await call("storage.set", {
          key: "history-view",
          scope: "memory",
          value: view,
        });
      }
    }
  } catch (error) {
    if (visible) showError(error);
  } finally {
    processing = false;
    busy();
  }
  if (refreshQueued && visible && !actionBusy) void drain();
}
function renderMonitors() {
  const count = Math.max(1, model.monitorCount);
  if ($("monitors").children.length !== count) {
    $("monitors").replaceChildren();
    for (let index = 0; index < count; index++) {
      const button = element("button", "monitor-tab");
      button.id = `monitor-${index}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", "cards");
      button.append(
        icon("monitor"),
        element("span", "", `モニター${index + 1}`),
      );
      button.addEventListener("click", () =>
        requestPage(index, positions.get(index) ?? 0),
      );
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const target =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : (index + (event.key === "ArrowRight" ? 1 : -1) + count) % count;
        $(`monitor-${target}`).focus();
        requestPage(target, positions.get(target) ?? 0);
      });
      $("monitors").append(button);
    }
  }
  [...$("monitors").children].forEach((button, index) => {
    button.setAttribute("aria-selected", String(index === model.monitor));
    button.tabIndex = index === model.monitor ? 0 : -1;
  });
  $("cards").setAttribute("aria-labelledby", `monitor-${model.monitor}`);
}
function render() {
  renderMonitors();
  $("count").replaceChildren(
    element("strong", "", `${model.total} 件`),
    document.createTextNode(
      model.total
        ? ` · ${model.page * model.pageSize + 1}–${Math.min((model.page + 1) * model.pageSize, model.total)}`
        : "",
    ),
  );
  $("page-number").textContent = model.total
    ? `${model.page + 1} / ${Math.ceil(model.total / model.pageSize)}`
    : "0 / 0";
  $("loading").hidden = true;
  $("cards").hidden = model.total === 0;
  $("empty").hidden = model.total !== 0;
  $("empty-title").textContent =
    settings.historyLimit === 0
      ? "履歴は無効になっています"
      : "まだ壁紙の履歴がありません";
  $("empty-message").textContent =
    settings.historyLimit === 0
      ? "Appletの設定で履歴件数を増やすと、使用した壁紙を表示できます。"
      : "このモニターで使った壁紙が、ここに並びます。";
  busy();
}
async function operate(callback) {
  if (actionBusy || (processing && !$("delete-dialog").open)) return;
  actionBusy = true;
  busy();
  $("error").hidden = true;
  try {
    await callback();
  } catch (error) {
    if (visible) showError(error);
  } finally {
    actionBusy = false;
    busy();
    if (refreshQueued) void drain();
  }
}
function finishDialog(id) {
  $(id).close();
  if (id === "preview")
    preview.setModel({
      assetId: "",
      title: "",
      detail: "",
      labels: [],
      state: "missing",
    });
  if (dialogFocus?.isConnected) dialogFocus.focus();
  else $("refresh").focus();
  if (deferred) {
    deferred = false;
    changed();
  }
}
$("preview-close").addEventListener("click", () => finishDialog("preview"));
$("preview").addEventListener("cancel", (event) => {
  event.preventDefault();
  finishDialog("preview");
});
let previewBackdropPressed = false;
function onPreviewBackdrop(event) {
  const preview = $("preview"),
    bounds = preview.getBoundingClientRect();
  return (
    event.target === preview &&
    (event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom)
  );
}
$("preview").addEventListener("pointerdown", (event) => {
  previewBackdropPressed = onPreviewBackdrop(event);
});
$("preview").addEventListener("click", (event) => {
  if (previewBackdropPressed && onPreviewBackdrop(event))
    finishDialog("preview");
  previewBackdropPressed = false;
});
function cancelDelete() {
  if (!actionBusy) {
    confirmationToken = undefined;
    finishDialog("delete-dialog");
  }
}
$("delete-cancel").addEventListener("click", cancelDelete);
$("delete-dialog").addEventListener("cancel", (event) => {
  event.preventDefault();
  cancelDelete();
});
$("delete-confirm").addEventListener(
  "click",
  () =>
    void operate(async () => {
      const pending = confirmationToken;
      if (!pending) return;
      confirmationToken = undefined;
      $("delete-confirm").disabled = true;
      $("delete-cancel").disabled = true;
      try {
        await call("sourceImages.trash", { id: pending.source.id });
      } finally {
        finishDialog("delete-dialog");
        $("delete-confirm").disabled = false;
        $("delete-cancel").disabled = false;
        if (model) requestPage(model.monitor, model.page, true);
      }
    }),
);
$("previous").addEventListener("click", () =>
  requestPage(model.monitor, model.page - 1),
);
$("next").addEventListener("click", () =>
  requestPage(model.monitor, model.page + 1),
);
$("refresh").addEventListener("click", () => {
  $("error").hidden = true;
  requestPage(model?.monitor ?? 0, model?.page ?? 0, true);
});
$("home").addEventListener(
  "click",
  () =>
    void operate(() => bridge.executeCommand("at365.wallpaper-slideshow.home")),
);
function visibility(value) {
  if (visible === value) return;
  visible = value;
  generationNumber++;
  if (visible) {
    changed();
    return;
  }
  confirmationToken = undefined;
  if ($("delete-dialog").open) $("delete-dialog").close();
  if ($("preview").open) $("preview").close();
  preview.setModel({
    assetId: "",
    title: "",
    detail: "",
    labels: [],
    state: "missing",
  });
  images.clear();
  model = undefined;
  gallery.setModel({
    cardWidth,
    fit: "cover",
    selection: "none",
    empty: "",
    items: [],
  });
}
if (bridge) {
  const unsubscribe = bridge.onChanged(changed);
  const unsubscribeVisibility = bridge.onVisibilityChanged(visibility);
  window.addEventListener(
    "unload",
    () => {
      visible = false;
      images.clear();
      unsubscribe();
      unsubscribeVisibility();
      gallery.dispose();
      preview.dispose();
      sizeControl.dispose();
    },
    { once: true },
  );
  void bridge.snapshot().then((snapshot) => visibility(snapshot.visible));
} else {
  $("cards").setAttribute("aria-busy", "false");
  showError("AppDockからこのページを開いてください。");
}
