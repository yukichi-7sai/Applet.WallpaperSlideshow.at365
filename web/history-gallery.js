/** History-owned UI. Changes here do not synchronize with the host gallery. */
export const historyGallerySize = {
  min: 180,
  max: 360,
  step: 20,
  initial: 260,
};
function validGalleryWidth(value) {
  return (
    Number.isInteger(value) &&
    value >= historyGallerySize.min &&
    value <= historyGallerySize.max &&
    (value - historyGallerySize.min) % historyGallerySize.step === 0
  );
}

const element = (tag, className, text = "") => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};

const safeImage = (source) =>
  /^(data:image\/(?:png|jpeg|webp);base64,|blob:|appdock:\/\/page-images\/)/.test(
    source,
  );
/** Keyed DOM updates preserve focused controls, decoded images and the visible anchor. */
export function mountHistoryGallery(container, options) {
  container.classList.add("ad-gallery");
  const cards = new Map();
  let model = {
    items: [],
    cardWidth: historyGallerySize.initial,
    fit: "cover",
    empty: "",
  };
  let disposed = false,
    active = 0,
    frame = 0;
  const empty = element("p", "ad-gallery-empty");
  const wantedEdge = (card) => {
    const width = card.button.getBoundingClientRect().width || model.cardWidth;
    return (
      [512, 1024, 2048].find((v) => v >= width * window.devicePixelRatio) ??
      2048
    );
  };
  const pump = () => {
    if (disposed) return;
    for (const card of cards.values()) {
      if (active >= 3) break;
      const edge = wantedEdge(card);
      if (
        !card.visible ||
        card.loading ||
        card.item.state !== "ready" ||
        !card.item.assetId ||
        card.edge >= edge ||
        card.requested >= edge
      )
        continue;
      const generation = card.generation,
        assetId = card.item.assetId;
      card.loading = true;
      card.requested = edge;
      active++;
      card.status.textContent = card.image.hasAttribute("src")
        ? ""
        : "読み込み中";
      void options
        .image(assetId, edge)
        .then(async (source) => {
          if (disposed || generation !== card.generation || !card.visible)
            return;
          // Only image URLs supplied by the adapter; never interpret markup.
          if (!safeImage(source)) throw Error("画像を読み込めません");
          const decoded = new Image();
          decoded.src = source;
          await decoded.decode();
          if (disposed || generation !== card.generation || !card.visible)
            return;
          card.image.src = source;
          card.edge = edge;
          card.status.textContent = "";
        })
        .catch(() => {
          if (!disposed && generation === card.generation)
            card.status.textContent = "画像を読み込めません";
        })
        .finally(() => {
          active--;
          card.loading = false;
          if (generation !== card.generation) card.requested = 0;
          pump();
        });
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const card = cards.get(entry.target.dataset.imageId);
        if (card) {
          card.visible = entry.isIntersecting;
          // Invalidate pending replies too: an image may leave before its first decode.
          if (!card.visible) {
            card.image.removeAttribute("src");
            card.edge = 0;
            card.requested = 0;
            card.generation++;
          }
        }
      }
      pump();
    },
    { root: options.scrollElement, rootMargin: "300px" },
  );
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(pump);
  });
  resize.observe(container);
  const anchor = () => {
    const top = options.scrollElement.getBoundingClientRect().top;
    for (const child of container.children) {
      const card = cards.get(child.dataset.imageId);
      if (!card) continue;
      const r = card.node.getBoundingClientRect();
      if (r.bottom > top) return { id: card.item.id, offset: r.top - top };
    }
  };
  const restore = (value) => {
    if (!value) return;
    const card = cards.get(value.id);
    if (card)
      options.scrollElement.scrollTop +=
        card.node.getBoundingClientRect().top -
        options.scrollElement.getBoundingClientRect().top -
        value.offset;
  };
  const reveal = (id) => {
    const card = cards.get(id);
    if (!card) return false;
    card.node.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "instant",
    });
    return true;
  };
  const create = (item) => {
    const node = element("article", "ad-gallery-card");
    node.tabIndex = -1;
    node.dataset.imageId = item.id;
    const button = element("button", "ad-gallery-image");
    button.type = "button";
    const image = element("img", "");
    image.draggable = false;
    image.alt = "";
    image.decoding = "async";
    const status = element("span", "ad-gallery-status");
    button.append(image, status);
    const body = element("div", "ad-gallery-body");
    const title = element("h3", "ad-gallery-title"),
      detail = element("p", "ad-gallery-detail");
    const labels = element("div", "ad-gallery-labels"),
      actions = element("div", "ad-gallery-actions");
    body.append(title, detail, labels);
    node.append(button, body, actions);
    const card = {
      node,
      button,
      image,
      status,
      title,
      detail,
      labels,
      actions,
      item,
      visible: false,
      edge: 0,
      requested: 0,
      generation: 0,
      loading: false,
    };
    button.onclick = () => options.activate(card.item.id);
    node.addEventListener("click", () => options.select?.(card.item.id), true);
    observer.observe(node);
    return card;
  };
  return {
    anchor,
    restore,
    reveal,
    focus(id) {
      const card = cards.get(id);
      if (!card) return false;
      reveal(id);
      (card.button.disabled ? card.node : card.button).focus({
        preventScroll: true,
      });
      return true;
    },
    setModel(next) {
      if (disposed) return;
      const saved = anchor();
      const previousOrder = [...container.children]
        .map((child) => child.dataset.imageId)
        .filter((id) => !!id);
      model = next;
      container.style.setProperty(
        "--ad-gallery-width",
        `${validGalleryWidth(next.cardWidth) ? next.cardWidth : historyGallerySize.initial}px`,
      );
      container.dataset.fit = next.fit;
      container.dataset.compact = String(next.cardWidth < 180);
      const ids = new Set(next.items.map((i) => i.id));
      for (const [id, card] of cards)
        if (!ids.has(id)) {
          card.generation++;
          observer.unobserve(card.node);
          card.node.remove();
          cards.delete(id);
        }
      next.items.forEach((item, index) => {
        const card = cards.get(item.id) ?? create(item);
        cards.set(item.id, card);
        if (card.item.assetId !== item.assetId) {
          card.generation++;
          card.edge = 0;
          card.requested = 0;
        }
        card.item = item;
        if (item.selected) card.node.setAttribute("aria-current", "true");
        else card.node.removeAttribute("aria-current");
        card.button.setAttribute("aria-label", `${item.title}を拡大`);
        card.button.disabled =
          item.selectable === false || item.state !== "ready";
        card.node.title = item.description ?? item.title;
        card.title.textContent = item.title;
        card.title.title = item.title;
        card.detail.textContent = item.detail;
        const tags = item.labels.slice(0, 2);
        if (item.labels.length > 2)
          tags.push(`ほか${item.labels.length - 2}件`);
        if (card.labels.dataset.signature !== JSON.stringify(tags)) {
          card.labels.replaceChildren(
            ...tags.map((v) => element("span", "ad-gallery-tag", v)),
          );
          card.labels.dataset.signature = JSON.stringify(tags);
        }
        if (item.state === "error" || item.state === "missing") {
          card.generation++;
          card.image.removeAttribute("src");
          card.edge = 0;
          card.requested = 0;
        }
        if (item.state !== "ready")
          card.status.textContent = {
            missing: "未到着・読取待ち",
            error: "画像を読み込めません",
            loading: "読み込み中",
          }[item.state];
        else if (card.edge) card.status.textContent = "";
        for (const old of [...card.actions.children])
          if (!item.actions.some((a) => a.id === old.dataset.action))
            old.remove();
        item.actions.forEach((action) => {
          let control = [...card.actions.querySelectorAll("button")].find(
            (b) => b.dataset.action === action.id,
          );
          if (!control) {
            control = element("button", "ad-gallery-action");
            control.type = "button";
            control.dataset.action = action.id;
            control.onclick = () => options.action(card.item.id, action.id);
            card.actions.append(control);
          }
          control.textContent = action.title;
          control.disabled = !!action.disabled;
        });
        // Avoid moving already ordered DOM nodes (moving the focused node loses focus).
        if (container.children[index] !== card.node)
          container.insertBefore(card.node, container.children[index] ?? null);
      });
      empty.textContent = next.empty;
      if (!next.items.length) container.append(empty);
      else empty.remove();
      if (saved && !cards.has(saved.id)) {
        const index = previousOrder.indexOf(saved.id);
        const replacement =
          previousOrder.slice(index + 1).find((id) => cards.has(id)) ??
          previousOrder
            .slice(0, index)
            .reverse()
            .find((id) => cards.has(id));
        if (replacement) saved.id = replacement;
      }
      restore(saved);
      pump();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      for (const card of cards.values()) card.generation++;
      cards.clear();
      container.replaceChildren();
      container.classList.remove("ad-gallery");
    },
  };
}
export function mountHistorySizeControl(container, options) {
  const label = element("label", "ad-gallery-size", "画像サイズ");
  const small = element("span", "", "小"),
    large = element("span", "", "大");
  const input = element("input", "");
  input.type = "range";
  input.min = String(historyGallerySize.min);
  input.max = String(historyGallerySize.max);
  input.step = String(historyGallerySize.step);
  input.setAttribute("aria-label", "画像サイズ");
  let committed = options.value;
  const setValue = (value) => {
    input.value = String(value);
    input.setAttribute(
      "aria-valuetext",
      `${value === historyGallerySize.initial ? "標準" : value < historyGallerySize.initial ? "小さめ" : "大きめ"} ${value}`,
    );
  };
  const commit = () => {
    const value = Number(input.value);
    if (committed !== value) {
      committed = value;
      options.commit(value);
    }
  };
  input.oninput = () => {
    setValue(Number(input.value));
    options.change(Number(input.value));
  };
  input.onchange = () => {
    if (!dragging && !keyDown) commit();
  };
  let dragging = false,
    keyDown = false;
  input.onpointerdown = () => {
    dragging = true;
  };
  const pointerEnd = () => {
    if (dragging) {
      dragging = false;
      commit();
    }
  };
  window.addEventListener("pointerup", pointerEnd);
  window.addEventListener("pointercancel", pointerEnd);
  input.onkeydown = (e) => {
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(e.key)
    )
      keyDown = true;
  };
  input.onkeyup = () => {
    keyDown = false;
    commit();
  };
  input.onblur = () => {
    dragging = false;
    keyDown = false;
    commit();
  };
  setValue(options.value);
  label.append(small, input, large);
  container.append(label);
  return {
    setValue(value) {
      if (!dragging && !keyDown) {
        committed = value;
        setValue(value);
      }
    },
    dispose() {
      window.removeEventListener("pointerup", pointerEnd);
      window.removeEventListener("pointercancel", pointerEnd);
      label.remove();
    },
  };
}

/** Preview content only: the adapter owns the dialog, source authorization and focus. */
export function mountHistoryPreview(container, options) {
  container.classList.add("ad-gallery-preview");
  container.tabIndex = -1;
  const stage = element("div", "ad-gallery-preview-stage");
  const picture = element("img", "");
  picture.draggable = false;
  const status = element("p", "ad-gallery-preview-status");
  status.setAttribute("role", "status");
  const detail = element("p", "ad-gallery-preview-detail");
  const labels = element("p", "ad-gallery-preview-labels");
  stage.append(picture, status);
  const controls = [-1, 1].map((direction) => {
    const button = element(
      "button",
      `ad-gallery-preview-nav ${direction < 0 ? "previous" : "next"}`,
      direction < 0 ? "‹" : "›",
    );
    button.type = "button";
    button.setAttribute("aria-label", direction < 0 ? "前の画像" : "次の画像");
    button.title = direction < 0 ? "前の画像（←）" : "次の画像（→）";
    let press;
    button.addEventListener("pointerdown", (event) => {
      press = { x: event.clientX, y: event.clientY, moved: false };
    });
    button.addEventListener("pointermove", (event) => {
      if (
        press &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6
      )
        press.moved = true;
    });
    button.addEventListener("pointercancel", () => {
      press = undefined;
    });
    button.addEventListener("click", (event) => {
      if (event.detail === 0 || (press && !press.moved))
        options.navigate?.(direction);
      press = undefined;
    });
    stage.append(button);
    return button;
  });
  container.append(stage, detail, labels);
  let sequence = 0,
    previous = "",
    disposed = false;
  return {
    setModel(model) {
      const focused = controls.find(
        (control) => control === document.activeElement,
      );
      controls[0].disabled = !model.canPrevious;
      controls[1].disabled = !model.canNext;
      if (focused?.disabled)
        (controls.find((control) => !control.disabled) ?? container).focus({
          preventScroll: true,
        });
      picture.alt = model.title;
      detail.textContent = model.detail;
      labels.textContent = model.labels.join(" / ");
      const key = `${model.assetId}:${model.state}`;
      if (key === previous || disposed) return;
      previous = key;
      const current = ++sequence;
      picture.removeAttribute("src");
      status.textContent =
        model.state === "missing"
          ? "画像がありません"
          : model.state === "error"
            ? "画像を読み込めません"
            : "読み込み中";
      if (model.state !== "ready") return;
      void options
        .image(model.assetId)
        .then(async (source) => {
          if (!safeImage(source)) throw Error("Unsupported image URL");
          const decoded = new Image();
          decoded.src = source;
          await decoded.decode();
          if (disposed || current !== sequence) return;
          picture.src = source;
          status.textContent = "";
        })
        .catch(() => {
          if (!disposed && current === sequence)
            status.textContent = "画像を読み込めません";
        });
    },
    dispose() {
      disposed = true;
      sequence++;
      picture.removeAttribute("src");
      container.replaceChildren();
      container.classList.remove("ad-gallery-preview");
    },
  };
}
