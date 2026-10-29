// src/shared/image-gallery.ts
var e = {
	min: 120,
	max: 360,
	step: 20,
	initial: 260
};
function t(t) {
	return typeof t == "number" && Number.isInteger(t) && t >= e.min && t <= e.max && (t - e.min) % e.step === 0;
}
// ui/image-gallery/interactions.ts
function n(e, t, n, r) {
	let i, a = 0, o = 0, s = !1, c = document.createElement("div");
	c.className = "ad-gallery-marquee", c.dataset.testid = "gallery-selection-area";
	let l = document.createElement("div");
	l.className = "ad-gallery-drag-badge", l.dataset.testid = "gallery-drag-card", l.setAttribute("aria-hidden", "true");
	let u = document.createElement("img");
	u.draggable = !1;
	let d = document.createElement("span");
	d.dataset.testid = "gallery-drag-count", l.append(u, d);
	let f = document.createElement("div");
	f.className = "ad-gallery-insertion", f.dataset.testid = "gallery-insertion";
	let p = () => {
		c.remove(), l.remove(), f.remove(), i?.target?.element.removeAttribute("data-gallery-drop"), r.root.classList.remove("ad-gallery-gesturing");
		let t = new Set(n().items.filter((e) => e.selected).map((e) => e.id));
		for (let n of e.querySelectorAll("[data-image-id]")) n.classList.toggle("ad-gallery-selected", t.has(n.dataset.imageId));
	}, m = () => {
		i?.active && (s = !0), p(), i = void 0, cancelAnimationFrame(a);
	}, h = () => {
		let a = i;
		if (!a?.active) return;
		if (a.imageId) {
			l.style.left = `${a.x + 200 > window.innerWidth ? a.x - 194 : a.x + 14}px`, l.style.top = `${a.y + 190 > window.innerHeight ? a.y - 184 : a.y + 14}px`;
			let t = document.elementFromPoint(a.x, a.y), i = r.targets().find((e) => !e.element.matches(":disabled") && !!t && e.element.contains(t));
			i?.element !== a.target?.element && (a.target?.element.removeAttribute("data-gallery-drop"), i?.element.setAttribute("data-gallery-drop", "true"), a.target = i), a.insertion = void 0, f.remove();
			let o = t?.closest("[data-image-id]"), s = n().items.find((e) => e.id === a.imageId), c = n().items.find((e) => e.id === o?.dataset.imageId), u = r.viewport();
			if (!i && r.canReorder() && o && e.contains(o) && c && c.id !== a.imageId && !(s?.selected && c.selected) && a.y >= u.top && a.y <= u.bottom) {
				let e = o.getBoundingClientRect(), t = a.x >= e.left + e.width / 2;
				a.insertion = {
					imageId: c.id,
					after: t
				}, Object.assign(f.style, {
					left: `${(t ? e.right : e.left) - 2}px`,
					top: `${Math.max(e.top, u.top)}px`,
					height: `${Math.min(e.bottom, u.bottom) - Math.max(e.top, u.top)}px`
				}), document.body.append(f);
			}
			l.dataset.valid = String(!!i || !!a.insertion);
			return;
		}
		let o = r.root.getBoundingClientRect(), s = t.getBoundingClientRect().top + a.contentY - t.scrollTop, u = t.getBoundingClientRect().top + a.selectionY - t.scrollTop, d = Math.max(r.viewport().top, Math.min(a.y, r.viewport().bottom)), p = Math.max(o.left, Math.min(a.x, o.right)), m = Math.max(o.top, Math.min(a.y, o.bottom)), h = Math.min(a.startX, p), g = Math.max(a.startX, p), _ = Math.min(s, m), v = Math.max(s, m);
		Object.assign(c.style, {
			left: `${h}px`,
			top: `${Math.max(_, o.top)}px`,
			width: `${g - h}px`,
			height: `${Math.max(0, Math.min(v, o.bottom) - Math.max(_, o.top))}px`
		});
		let y = new Map(n().items.map((e) => [e.id, e]));
		a.selection = [];
		for (let t of e.querySelectorAll("[data-image-id]")) {
			let e = y.get(t.dataset.imageId);
			if (!e) continue;
			let n = t.getBoundingClientRect(), r = e.selectable !== !1 && n.right > h && n.left < g && n.bottom > Math.min(u, d) && n.top < Math.max(u, d);
			r && a.selection.push(e.id), t.classList.toggle("ad-gallery-selected", r || a.additive && !!e.selected);
		}
	}, g = (e) => {
		let n = i;
		if (!n?.active) return;
		if (!r.enabled()) {
			m();
			return;
		}
		let s = Math.min(32, e - (o || e));
		o = e;
		for (let e of n.imageId ? r.scrollTargets() : [t]) {
			let i = e === t ? r.viewport() : e.getBoundingClientRect();
			if (n.x < i.left || n.x > i.right || n.y < i.top - 32 || n.y > i.bottom + 32) continue;
			let a = n.y < i.top + 48 ? -Math.min(1, (i.top + 48 - n.y) / 48) : n.y > i.bottom - 48 ? Math.min(1, (n.y - i.bottom + 48) / 48) : 0;
			e.scrollTop += a * s * .8, e === t && a > 0 && e.scrollHeight - e.scrollTop - e.clientHeight < 64 && r.more();
		}
		h(), a = requestAnimationFrame(g);
	}, _ = (e) => {
		if (s = !1, e.button !== 0 || !e.isPrimary || !r.enabled() || n().selection !== "multiple") return;
		let a = e.target instanceof Element ? e.target : void 0;
		if (!a || !r.root.contains(a) || a.closest("input, label, select, textarea, a, summary, [contenteditable], [role=\"menu\"], button:not(.ad-gallery-image)")) return;
		let o = t.getBoundingClientRect();
		for (let n of [t, ...r.scrollTargets()]) {
			let t = n.getBoundingClientRect();
			if (n.contains(a) && (e.clientX >= t.left + n.clientWidth || e.clientY >= t.top + n.clientHeight)) return;
		}
		let c = a.closest("[data-image-id]"), l = n().items.find((e) => e.id === c?.dataset.imageId);
		(!c || l && l.selectable !== !1) && (m(), i = {
			pointerId: e.pointerId,
			startX: e.clientX,
			startY: e.clientY,
			contentY: e.clientY - o.top + t.scrollTop,
			selectionY: Math.max(e.clientY, r.viewport().top) - o.top + t.scrollTop,
			x: e.clientX,
			y: e.clientY,
			additive: e.ctrlKey || e.metaKey,
			imageId: l?.id,
			active: !1,
			selection: []
		});
	}, v = (t) => {
		let s = i;
		if (s && s.pointerId === t.pointerId) {
			if (!r.enabled() || !(t.buttons & 1)) m();
			else if (s.x = t.clientX, s.y = t.clientY, !(!s.active && Math.hypot(s.x - s.startX, s.y - s.startY) < 6)) {
				if (t.preventDefault(), !s.active) {
					if (s.active = !0, r.root.classList.add("ad-gallery-gesturing"), window.getSelection()?.removeAllRanges(), s.imageId) {
						d.textContent = "…", l.dataset.multiple = "false";
						let t = [...e.querySelectorAll("[data-image-id]")].find((e) => e.dataset.imageId === s.imageId)?.querySelector("img");
						t?.getAttribute("src") ? u.src = t.src : u.removeAttribute("src"), u.alt = n().items.find((e) => e.id === s.imageId)?.title ?? "", document.body.append(l), s.transfer = r.beginDrag(s.imageId), s.transfer.then((e) => {
							i === s && (d.textContent = `${e.count}枚`, l.dataset.multiple = String(e.count > 1));
						}).catch(() => {
							i === s && m();
						});
					} else document.body.append(c);
					o = 0, a = requestAnimationFrame(g);
				}
				h();
			}
		}
	}, y = (e) => {
		let t = i;
		if (!t || t.pointerId !== e.pointerId) return;
		t.x = e.clientX, t.y = e.clientY, h();
		let n = t.target, a = t.insertion, o = r.enabled();
		m(), o && (t.active ? (e.preventDefault(), t.transfer && n ? t.transfer.then(({ token: e }) => {
			r.enabled() && r.drop(e, n.id);
		}).catch(() => {}) : t.transfer && a ? t.transfer.then(({ token: e }) => {
			r.enabled() && r.reorder(e, a.imageId, a.after);
		}).catch(() => {}) : t.imageId || r.selectRange(t.selection, t.additive)) : !t.imageId && !t.additive && r.clear());
	}, b = (e) => {
		s && e.detail !== 0 && (s = !1, e.preventDefault(), e.stopImmediatePropagation());
	}, x = (e) => {
		e.key === "Escape" && i && (m(), e.preventDefault(), e.stopPropagation());
	}, S = (e) => {
		i && e.preventDefault();
	};
	return window.addEventListener("pointerdown", _, !0), window.addEventListener("pointermove", v, { passive: !1 }), window.addEventListener("pointerup", y, !0), window.addEventListener("pointercancel", m), window.addEventListener("blur", m), window.addEventListener("click", b, !0), window.addEventListener("keydown", x, !0), t.addEventListener("dragstart", S), {
		cancel: m,
		update: h,
		dispose() {
			m(), window.removeEventListener("pointerdown", _, !0), window.removeEventListener("pointermove", v), window.removeEventListener("pointerup", y, !0), window.removeEventListener("pointercancel", m), window.removeEventListener("blur", m), window.removeEventListener("click", b, !0), window.removeEventListener("keydown", x, !0), t.removeEventListener("dragstart", S);
		}
	};
}
// ui/image-gallery/index.ts
var r = (e, t, n = "") => {
	let r = document.createElement(e);
	return r.className = t, r.textContent = n, r;
}, i = (e) => /^(data:image\/(?:png|jpeg|webp);base64,|blob:|appdock:\/\/page-images\/)/.test(e);
function a(a, o) {
	a.classList.add("ad-gallery");
	let s = /* @__PURE__ */ new Map(), c = {
		items: [],
		cardWidth: e.initial,
		fit: "contain",
		selection: "none",
		empty: ""
	}, l = !1, u = 0, d = 0, f = o.interactions ? n(a, o.scrollElement, () => c, o.interactions) : void 0, p = r("p", "ad-gallery-empty"), m = (e) => {
		let t = e.button.getBoundingClientRect().width || c.cardWidth;
		return [
			512,
			1024,
			2048
		].find((e) => e >= t * window.devicePixelRatio) ?? 2048;
	}, h = () => {
		if (!l) for (let e of s.values()) {
			if (u >= 3) break;
			let t = m(e);
			if (!e.visible || e.loading || e.item.state !== "ready" || !e.item.assetId || e.edge >= t || e.requested >= t) continue;
			let n = e.generation, r = e.item.assetId;
			e.loading = !0, e.requested = t, u++, e.status.textContent = e.image.hasAttribute("src") ? "" : "読み込み中", o.image(r, t).then(async (r) => {
				if (l || n !== e.generation || !e.visible) return;
				if (!i(r)) throw Error("画像を読み込めません");
				let a = new Image();
				a.src = r, await a.decode(), !l && n === e.generation && e.visible && (e.image.src = r, e.edge = t, e.status.textContent = "");
			}).catch(() => {
				!l && n === e.generation && (e.status.textContent = "画像を読み込めません");
			}).finally(() => {
				u--, e.loading = !1, n !== e.generation && (e.requested = 0), h();
			});
		}
	}, g = new IntersectionObserver((e) => {
		for (let t of e) {
			let e = s.get(t.target.dataset.imageId);
			e && (e.visible = t.isIntersecting, e.visible || (e.image.removeAttribute("src"), e.edge = 0, e.requested = 0, e.generation++));
		}
		h();
	}, {
		root: o.scrollElement,
		rootMargin: "300px"
	}), _ = new ResizeObserver(() => {
		cancelAnimationFrame(d), d = requestAnimationFrame(h);
	});
	_.observe(a);
	let v = () => {
		let e = o.interactions?.viewport().top ?? o.scrollElement.getBoundingClientRect().top;
		for (let t of a.children) {
			let n = s.get(t.dataset.imageId);
			if (!n) continue;
			let r = n.node.getBoundingClientRect();
			if (r.bottom > e) return {
				id: n.item.id,
				offset: r.top - e
			};
		}
	}, y = (e) => {
		if (!e) return;
		let t = s.get(e.id);
		t && (o.scrollElement.scrollTop += t.node.getBoundingClientRect().top - (o.interactions?.viewport().top ?? o.scrollElement.getBoundingClientRect().top) - e.offset);
	}, b = (e) => {
		let t = r("article", "ad-gallery-card");
		t.dataset.imageId = e.id;
		let n = r("button", "ad-gallery-image");
		n.type = "button";
		let i = r("img", "");
		i.draggable = !1, i.alt = "", i.decoding = "async";
		let a = r("span", "ad-gallery-status");
		n.append(i, a);
		let s = r("input", "ad-gallery-check");
		s.type = "checkbox";
		let l = r("label", "ad-gallery-check-area");
		l.append(s);
		let u = r("div", "ad-gallery-body"), d = r("h3", "ad-gallery-title"), f = r("p", "ad-gallery-detail"), p = r("div", "ad-gallery-labels"), m = r("div", "ad-gallery-actions");
		u.append(d, f, p), t.append(n, l, u, m);
		let h = {
			node: t,
			button: n,
			image: i,
			status: a,
			check: s,
			checkArea: l,
			title: d,
			detail: f,
			labels: p,
			actions: m,
			item: e,
			visible: !1,
			edge: 0,
			requested: 0,
			generation: 0,
			loading: !1
		};
		return n.onclick = () => c.selection === "single" ? o.select(h.item.id, !0) : o.activate(h.item.id), s.onchange = () => o.select(h.item.id, s.checked), g.observe(t), h;
	};
	return {
		anchor: v,
		restore: y,
		cancelInteraction: () => f?.cancel(),
		setModel(n) {
			if (l) return;
			let i = v(), u = [...a.children].map((e) => e.dataset.imageId).filter((e) => !!e);
			c = n, a.style.setProperty("--ad-gallery-width", `${t(n.cardWidth) ? n.cardWidth : e.initial}px`), a.dataset.fit = n.fit, a.dataset.compact = String(n.cardWidth < 180);
			let d = new Set(n.items.map((e) => e.id));
			for (let [e, t] of s) d.has(e) || (t.generation++, g.unobserve(t.node), t.node.remove(), s.delete(e));
			if (n.items.forEach((e, t) => {
				let i = s.get(e.id) ?? b(e);
				s.set(e.id, i), i.item.assetId !== e.assetId && (i.generation++, i.edge = 0, i.requested = 0), i.item = e, i.node.classList.toggle("ad-gallery-selected", !!e.selected), i.check.hidden = n.selection !== "multiple", i.checkArea.hidden = n.selection !== "multiple", i.check.checked = !!e.selected, i.check.disabled = e.selectable === !1, i.check.setAttribute("aria-label", `${e.title}を選択`), i.button.setAttribute("aria-label", `${e.title}${n.selection === "single" ? "を選択" : "を拡大"}`), n.selection === "single" ? i.button.setAttribute("aria-pressed", String(!!e.selected)) : i.button.removeAttribute("aria-pressed"), i.button.disabled = e.selectable === !1 || n.selection !== "single" && e.state !== "ready", i.node.title = e.description ?? e.title, i.title.textContent = e.title, i.title.title = e.title, i.detail.textContent = e.detail;
				let c = e.labels.slice(0, 2);
				e.labels.length > 2 && c.push(`ほか${e.labels.length - 2}件`), i.labels.dataset.signature !== JSON.stringify(c) && (i.labels.replaceChildren(...c.map((e) => r("span", "ad-gallery-tag", e))), i.labels.dataset.signature = JSON.stringify(c)), e.state === "ready" ? i.edge && (i.status.textContent = "") : i.status.textContent = {
					missing: "未到着・読取待ち",
					error: "画像を読み込めません",
					loading: "読み込み中"
				}[e.state];
				for (let t of [...i.actions.children]) e.actions.some((e) => e.id === t.dataset.action) || t.remove();
				e.actions.forEach((e) => {
					let t = [...i.actions.querySelectorAll("button")].find((t) => t.dataset.action === e.id);
					t || (t = r("button", "ad-gallery-action"), t.type = "button", t.dataset.action = e.id, t.onclick = () => o.action(i.item.id, e.id), i.actions.append(t)), t.textContent = e.title, t.disabled = !!e.disabled;
				}), a.children[t] !== i.node && a.insertBefore(i.node, a.children[t] ?? null);
			}), p.textContent = n.empty, n.items.length ? p.remove() : a.append(p), i && !s.has(i.id)) {
				let e = u.indexOf(i.id), t = u.slice(e + 1).find((e) => s.has(e)) ?? u.slice(0, e).reverse().find((e) => s.has(e));
				t && (i.id = t);
			}
			y(i), f?.update(), h();
		},
		dispose() {
			l = !0, f?.dispose(), cancelAnimationFrame(d), g.disconnect(), _.disconnect();
			for (let e of s.values()) e.generation++;
			s.clear(), a.replaceChildren(), a.classList.remove("ad-gallery");
		}
	};
}
function o(t, n) {
	let i = r("label", "ad-gallery-size", "画像サイズ"), a = r("span", "", "小"), o = r("span", "", "大"), s = r("input", "");
	s.type = "range", s.min = String(e.min), s.max = String(e.max), s.step = String(e.step), s.setAttribute("aria-label", "画像サイズ");
	let c = n.value, l = (t) => {
		s.value = String(t), s.setAttribute("aria-valuetext", `${t === e.initial ? "標準" : t < e.initial ? "小さめ" : "大きめ"} ${t}`);
	}, u = () => {
		let e = Number(s.value);
		c !== e && (c = e, n.commit(e));
	};
	s.oninput = () => {
		l(Number(s.value)), n.change(Number(s.value));
	}, s.onchange = () => {
		!d && !f && u();
	};
	let d = !1, f = !1;
	s.onpointerdown = () => {
		d = !0;
	};
	let p = () => {
		d && (d = !1, u());
	};
	return window.addEventListener("pointerup", p), window.addEventListener("pointercancel", p), s.onkeydown = (e) => {
		[
			"ArrowLeft",
			"ArrowRight",
			"ArrowUp",
			"ArrowDown",
			"Home",
			"End",
			"PageUp",
			"PageDown"
		].includes(e.key) && (f = !0);
	}, s.onkeyup = () => {
		f = !1, u();
	}, s.onblur = () => {
		d = !1, f = !1, u();
	}, l(n.value), i.append(a, s, o), t.append(i), {
		setValue(e) {
			!d && !f && (c = e, l(e));
		},
		dispose() {
			window.removeEventListener("pointerup", p), window.removeEventListener("pointercancel", p), i.remove();
		}
	};
}
function s(e, t) {
	e.classList.add("ad-gallery-preview");
	let n = r("div", "ad-gallery-preview-stage"), a = r("img", ""), o = r("p", "ad-gallery-preview-status");
	o.setAttribute("role", "status");
	let s = r("p", "ad-gallery-preview-detail"), c = r("p", "ad-gallery-preview-labels");
	n.append(a, o), e.append(n, s, c);
	let l = 0, u = "", d = !1;
	return {
		setModel(e) {
			a.alt = e.title, s.textContent = e.detail, c.textContent = e.labels.join(" / ");
			let n = `${e.assetId}:${e.state}`;
			if (n === u || d) return;
			u = n;
			let r = ++l;
			a.removeAttribute("src"), o.textContent = e.state === "missing" ? "画像がありません" : e.state === "error" ? "画像を読み込めません" : "読み込み中", e.state === "ready" && t.image(e.assetId).then(async (e) => {
				if (!i(e)) throw Error("Unsupported image URL");
				let t = new Image();
				t.src = e, await t.decode(), !(d || r !== l) && (a.src = e, o.textContent = "");
			}).catch(() => {
				!d && r === l && (o.textContent = "画像を読み込めません");
			});
		},
		dispose() {
			d = !0, l++, a.removeAttribute("src"), e.replaceChildren(), e.classList.remove("ad-gallery-preview");
		}
	};
}
export { e as gallerySize, s as mountGalleryPreview, o as mountGallerySizeControl, a as mountImageGallery, t as validGalleryWidth };
