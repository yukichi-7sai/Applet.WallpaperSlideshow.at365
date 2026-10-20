//#region src/shared/image-gallery.ts
var e = {
	min: 180,
	max: 360,
	step: 20,
	initial: 260
};
function t(t) {
	return typeof t == "number" && Number.isInteger(t) && t >= e.min && t <= e.max && (t - e.min) % e.step === 0;
}
//#endregion
//#region ui/image-gallery/index.ts
var n = (e, t, n = "") => {
	let r = document.createElement(e);
	return r.className = t, r.textContent = n, r;
}, r = (e) => /^(data:image\/(?:png|jpeg|webp);base64,|blob:|appdock:\/\/page-images\/)/.test(e);
function i(i, a) {
	i.classList.add("ad-gallery");
	let o = /* @__PURE__ */ new Map(), s = {
		items: [],
		cardWidth: e.initial,
		fit: "contain",
		selection: "none",
		empty: ""
	}, c = !1, l = 0, u = 0, d = n("p", "ad-gallery-empty"), f = (e) => {
		let t = e.button.getBoundingClientRect().width || s.cardWidth;
		return [
			512,
			1024,
			2048
		].find((e) => e >= t * window.devicePixelRatio) ?? 2048;
	}, p = () => {
		if (!c) for (let e of o.values()) {
			if (l >= 3) break;
			let t = f(e);
			if (!e.visible || e.loading || e.item.state !== "ready" || !e.item.assetId || e.edge >= t || e.requested >= t) continue;
			let n = e.generation, i = e.item.assetId;
			e.loading = !0, e.requested = t, l++, e.status.textContent = e.image.hasAttribute("src") ? "" : "読み込み中", a.image(i, t).then(async (i) => {
				if (c || n !== e.generation || !e.visible) return;
				if (!r(i)) throw Error("画像を読み込めません");
				let a = new Image();
				a.src = i, await a.decode(), !c && n === e.generation && e.visible && (e.image.src = i, e.edge = t, e.status.textContent = "");
			}).catch(() => {
				!c && n === e.generation && (e.status.textContent = "画像を読み込めません");
			}).finally(() => {
				l--, e.loading = !1, n !== e.generation && (e.requested = 0), p();
			});
		}
	}, m = new IntersectionObserver((e) => {
		for (let t of e) {
			let e = o.get(t.target.dataset.imageId);
			e && (e.visible = t.isIntersecting, e.visible || (e.image.removeAttribute("src"), e.edge = 0, e.requested = 0, e.generation++));
		}
		p();
	}, {
		root: a.scrollElement,
		rootMargin: "300px"
	}), h = new ResizeObserver(() => {
		cancelAnimationFrame(u), u = requestAnimationFrame(p);
	});
	h.observe(i);
	let g = () => {
		let e = a.scrollElement.getBoundingClientRect().top;
		for (let t of i.children) {
			let n = o.get(t.dataset.imageId);
			if (!n) continue;
			let r = n.node.getBoundingClientRect();
			if (r.bottom > e) return {
				id: n.item.id,
				offset: r.top - e
			};
		}
	}, _ = (e) => {
		if (!e) return;
		let t = o.get(e.id);
		t && (a.scrollElement.scrollTop += t.node.getBoundingClientRect().top - a.scrollElement.getBoundingClientRect().top - e.offset);
	}, v = (e) => {
		let t = n("article", "ad-gallery-card");
		t.dataset.imageId = e.id;
		let r = n("button", "ad-gallery-image");
		r.type = "button";
		let i = n("img", "");
		i.alt = "", i.decoding = "async";
		let o = n("span", "ad-gallery-status");
		r.append(i, o);
		let c = n("input", "ad-gallery-check");
		c.type = "checkbox";
		let l = n("div", "ad-gallery-body"), u = n("h3", "ad-gallery-title"), d = n("p", "ad-gallery-detail"), f = n("div", "ad-gallery-labels"), p = n("div", "ad-gallery-actions");
		l.append(u, d, f), t.append(r, c, l, p);
		let h = {
			node: t,
			button: r,
			image: i,
			status: o,
			check: c,
			title: u,
			detail: d,
			labels: f,
			actions: p,
			item: e,
			visible: !1,
			edge: 0,
			requested: 0,
			generation: 0,
			loading: !1
		};
		return r.onclick = () => s.selection === "single" ? a.select(h.item.id, !0) : a.activate(h.item.id), c.onchange = () => a.select(h.item.id, c.checked), m.observe(t), h;
	};
	return {
		anchor: g,
		restore: _,
		setModel(r) {
			if (c) return;
			let l = g(), u = [...i.children].map((e) => e.dataset.imageId).filter((e) => !!e);
			s = r, i.style.setProperty("--ad-gallery-width", `${t(r.cardWidth) ? r.cardWidth : e.initial}px`), i.dataset.fit = r.fit;
			let f = new Set(r.items.map((e) => e.id));
			for (let [e, t] of o) f.has(e) || (t.generation++, m.unobserve(t.node), t.node.remove(), o.delete(e));
			if (r.items.forEach((e, t) => {
				let s = o.get(e.id) ?? v(e);
				o.set(e.id, s), s.item.assetId !== e.assetId && (s.generation++, s.edge = 0, s.requested = 0), s.item = e, s.node.classList.toggle("ad-gallery-selected", !!e.selected), s.check.hidden = r.selection !== "multiple", s.check.checked = !!e.selected, s.check.disabled = e.selectable === !1, s.check.setAttribute("aria-label", `${e.title}を選択`), s.button.setAttribute("aria-label", `${e.title}${r.selection === "single" ? "を選択" : "を拡大"}`), r.selection === "single" ? s.button.setAttribute("aria-pressed", String(!!e.selected)) : s.button.removeAttribute("aria-pressed"), s.button.disabled = e.selectable === !1 || r.selection !== "single" && e.state !== "ready", s.node.title = e.description ?? e.title, s.title.textContent = e.title, s.title.title = e.title, s.detail.textContent = e.detail;
				let c = e.labels.slice(0, 2);
				e.labels.length > 2 && c.push(`ほか${e.labels.length - 2}件`), s.labels.dataset.signature !== JSON.stringify(c) && (s.labels.replaceChildren(...c.map((e) => n("span", "ad-gallery-tag", e))), s.labels.dataset.signature = JSON.stringify(c)), e.state === "ready" ? s.edge && (s.status.textContent = "") : s.status.textContent = {
					missing: "未到着・読取待ち",
					error: "画像を読み込めません",
					loading: "読み込み中"
				}[e.state];
				for (let t of [...s.actions.children]) e.actions.some((e) => e.id === t.dataset.action) || t.remove();
				e.actions.forEach((e) => {
					let t = [...s.actions.querySelectorAll("button")].find((t) => t.dataset.action === e.id);
					t || (t = n("button", "ad-gallery-action"), t.type = "button", t.dataset.action = e.id, t.onclick = () => a.action(s.item.id, e.id), s.actions.append(t)), t.textContent = e.title, t.disabled = !!e.disabled;
				}), i.children[t] !== s.node && i.insertBefore(s.node, i.children[t] ?? null);
			}), d.textContent = r.empty, r.items.length ? d.remove() : i.append(d), l && !o.has(l.id)) {
				let e = u.indexOf(l.id), t = u.slice(e + 1).find((e) => o.has(e)) ?? u.slice(0, e).reverse().find((e) => o.has(e));
				t && (l.id = t);
			}
			_(l), p();
		},
		dispose() {
			c = !0, cancelAnimationFrame(u), m.disconnect(), h.disconnect();
			for (let e of o.values()) e.generation++;
			o.clear(), i.replaceChildren(), i.classList.remove("ad-gallery");
		}
	};
}
function a(t, r) {
	let i = n("label", "ad-gallery-size", "画像サイズ"), a = n("span", "", "小"), o = n("span", "", "大"), s = n("input", "");
	s.type = "range", s.min = String(e.min), s.max = String(e.max), s.step = String(e.step), s.setAttribute("aria-label", "画像サイズ");
	let c = r.value, l = (t) => {
		s.value = String(t), s.setAttribute("aria-valuetext", `${t === e.initial ? "標準" : t < e.initial ? "小さめ" : "大きめ"} ${t}`);
	}, u = () => {
		let e = Number(s.value);
		c !== e && (c = e, r.commit(e));
	};
	s.oninput = () => {
		l(Number(s.value)), r.change(Number(s.value));
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
	}, l(r.value), i.append(a, s, o), t.append(i), {
		setValue(e) {
			!d && !f && (c = e, l(e));
		},
		dispose() {
			window.removeEventListener("pointerup", p), window.removeEventListener("pointercancel", p), i.remove();
		}
	};
}
function o(e, t) {
	e.classList.add("ad-gallery-preview");
	let i = n("div", "ad-gallery-preview-stage"), a = n("img", ""), o = n("p", "ad-gallery-preview-status");
	o.setAttribute("role", "status");
	let s = n("p", "ad-gallery-preview-detail"), c = n("p", "ad-gallery-preview-labels");
	i.append(a, o), e.append(i, s, c);
	let l = 0, u = "", d = !1;
	return {
		setModel(e) {
			a.alt = e.title, s.textContent = e.detail, c.textContent = e.labels.join(" / ");
			let n = `${e.assetId}:${e.state}`;
			if (n === u || d) return;
			u = n;
			let i = ++l;
			a.removeAttribute("src"), o.textContent = e.state === "missing" ? "画像がありません" : e.state === "error" ? "画像を読み込めません" : "読み込み中", e.state === "ready" && t.image(e.assetId).then(async (e) => {
				if (!r(e)) throw Error("Unsupported image URL");
				let t = new Image();
				t.src = e, await t.decode(), !(d || i !== l) && (a.src = e, o.textContent = "");
			}).catch(() => {
				!d && i === l && (o.textContent = "画像を読み込めません");
			});
		},
		dispose() {
			d = !0, l++, a.removeAttribute("src"), e.replaceChildren(), e.classList.remove("ad-gallery-preview");
		}
	};
}
//#endregion
export { e as gallerySize, o as mountGalleryPreview, a as mountGallerySizeControl, i as mountImageGallery, t as validGalleryWidth };
