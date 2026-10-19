'use strict';
const bridge = window.appletPage;
const $ = (id) => document.getElementById(id);
const paths = {
  back: 'M19 12H5m6-6-6 6 6 6', left: 'm14 6-6 6 6 6', right: 'm10 6 6 6-6 6',
  refresh: 'M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1',
  monitor: 'M4 4h16v12H4zM8 20h8m-4-4v4', close: 'm6 6 12 12M18 6 6 18',
  image: 'M3 4h18v16H3zM3 16l5-5 5 5 3-3 5 5M16 8h.01',
  open: 'M14 3h7v7m0-7L10 14M10 3H4v17h17v-6',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
};
function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', paths[name]); svg.append(path); return svg;
}
document.querySelectorAll('[data-icon]').forEach((element) => element.replaceWith(icon(element.dataset.icon)));
function element(tag, className, text) {
  const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node;
}
const action = (id, input = {}) => bridge.call('actions.invoke', { id, input });
let model, settings, generationNumber = 0, intent, processing = false, refreshQueued = false, deferred = false, actionBusy = false;
let confirmationToken, dialogFocus;
const positions = new Map(), cardNodes = new Map();
let cardGeneration;
function showError(error) {
  $('error').textContent = String(error?.message || error).replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '');
  $('error').hidden = false;
}
function busy() {
  for (const button of document.querySelectorAll('.card-action,.image-button')) button.disabled = processing || actionBusy || !model;
  for (const button of document.querySelectorAll('.image-button')) if (!button.querySelector('img')?.getAttribute('src') || button.querySelector('img').hidden) button.disabled = true;
  $('previous').disabled = processing || actionBusy || !model || model.page === 0;
  $('next').disabled = processing || actionBusy || !model || (model.page + 1) * model.pageSize >= model.total;
  $('cards').setAttribute('aria-busy', String(processing || !!model?.loading));
}
async function applyTheme() {
  const snapshot = await bridge.snapshot(); document.documentElement.classList.toggle('dark', snapshot.dark);
}
function requestPage(monitor, page, fresh = true) {
  intent = { monitor, page, fresh }; generationNumber++; refreshQueued = true; void drain();
}
function changed() { refreshQueued = true; void drain(); }
async function release(generation) {
  if (!generation) return;
  try { await action('history.release', { generation }); } catch { /* A disposed View is already revoked by the host. */ }
}
async function drain() {
  if (processing || actionBusy) return;
  processing = true; busy();
  try {
    while (refreshQueued && !actionBusy) {
      refreshQueued = false;
      await applyTheme();
      if ($('preview').open || $('delete-dialog').open) { deferred = true; break; }
      const wanted = intent; intent = undefined;
      const request = generationNumber;
      settings = await action('history.state');
      for (const [monitor, page] of Object.entries(settings.positions || {})) positions.set(Number(monitor), page);
      const monitor = wanted?.monitor ?? model?.monitor ?? settings.monitor;
      const page = wanted?.page ?? model?.page ?? settings.page;
      const fresh = wanted?.fresh || !model || model.contentRevision !== settings.revision || model.pageSize !== settings.pageSize || monitor >= Math.max(1, settings.monitorCount);
      let generation = fresh ? '' : model.generation, offset = 0, result;
      const items = [];
      do {
        result = await action('history.read', { monitor, page, offset, limit: 32, generation });
        generation = result.generation;
        if (request !== generationNumber) break;
        items.push(...result.items); offset = result.nextOffset;
      } while (offset !== null);
      if (request !== generationNumber) { if (generation !== model?.generation) await release(generation); continue; }
      const previous = model?.generation;
      model = { ...result, items };
      positions.set(model.monitor, model.page);
      render();
      if (previous && previous !== model.generation) await release(previous);
    }
  } catch (error) { showError(error); }
  finally { processing = false; busy(); }
  if (refreshQueued && !actionBusy) void drain();
}
function renderMonitors() {
  const count = Math.max(1, model.monitorCount);
  if ($('monitors').children.length !== count) {
    $('monitors').replaceChildren();
    for (let index = 0; index < count; index++) {
      const button = element('button', 'monitor-tab');
      button.id = `monitor-${index}`; button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'cards');
      button.append(icon('monitor'), element('span', '', `モニター${index + 1}`));
      button.addEventListener('click', () => requestPage(index, positions.get(index) ?? 0));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + count) % count;
        $(`monitor-${target}`).focus(); requestPage(target, positions.get(target) ?? 0);
      });
      $('monitors').append(button);
    }
  }
  [...$('monitors').children].forEach((button, index) => {
    button.setAttribute('aria-selected', String(index === model.monitor)); button.tabIndex = index === model.monitor ? 0 : -1;
  });
  $('cards').setAttribute('aria-labelledby', `monitor-${model.monitor}`);
}
function makeCard(item, generation) {
  const card = element('article', 'card'); card.dataset.slot = item.slot;
  const imageButton = element('button', 'image-button');
  const placeholder = element('span', 'image-placeholder'); placeholder.append(icon('image'), element('span'));
  const image = document.createElement('img'); image.loading = 'lazy'; image.decoding = 'async'; image.hidden = true;
  image.addEventListener('error', () => { image.hidden = true; placeholder.hidden = false; placeholder.lastChild.textContent = '画像を読み込めません'; imageButton.disabled = true; });
  imageButton.append(placeholder, image);
  imageButton.addEventListener('click', () => {
    if (!image.getAttribute('src')) return;
    dialogFocus = imageButton; $('preview-image').src = image.src; $('preview-image').alt = item.title;
    $('preview-caption').textContent = item.tooltip; $('preview').showModal();
  });
  const content = element('div', 'card-content'), title = element('h2', 'image-name'), meta = element('p', 'image-meta'); content.append(title, meta);
  const actions = element('div', 'card-actions');
  const open = element('button', 'button card-action'); open.setAttribute('aria-label', '画像を開く'); open.append(icon('open'), element('span', '', '開く'));
  const remove = element('button', 'button card-action delete'); remove.setAttribute('aria-label', '画像を削除'); remove.append(icon('trash'), element('span', '', '削除'));
  open.addEventListener('click', () => void operate(async () => { await action('history.open', { generation, slot: item.slot }); }));
  remove.addEventListener('click', () => void operate(async () => {
    const response = await action('history.delete-request', { generation, slot: item.slot });
    confirmationToken = response.confirmationToken; $('delete-path').textContent = response.path; dialogFocus = remove; $('delete-dialog').showModal();
  }));
  actions.append(open, remove); card.append(imageButton, content, actions);
  return { card, imageButton, image, placeholder, title, meta };
}
function render() {
  renderMonitors();
  if (cardGeneration !== model.generation) { cardNodes.clear(); $('cards').replaceChildren(); cardGeneration = model.generation; }
  for (const item of model.items) {
    let view = cardNodes.get(item.slot);
    if (!view) { view = makeCard(item, model.generation); cardNodes.set(item.slot, view); $('cards').append(view.card); }
    view.title.textContent = item.title; view.card.title = item.tooltip;
    view.imageButton.setAttribute('aria-label', `壁紙のプレビュー: ${item.title}`);
    view.image.alt = item.title;
    view.meta.textContent = item.status === 'loading' ? '画像を準備しています' : [item.resolution, item.sizeText].filter(Boolean).join(' · ') || item.error;
    view.imageButton.classList.toggle('loading', item.status === 'loading');
    view.placeholder.lastChild.textContent = item.status === 'error' ? '画像を読み込めません' : '読み込み中';
    if (item.image && view.image.getAttribute('src') !== item.image) { view.image.src = item.image; view.image.hidden = false; view.placeholder.hidden = true; }
  }
  $('count').replaceChildren(element('strong', '', `${model.total} 件`), document.createTextNode(model.total ? ` · ${model.page * model.pageSize + 1}–${Math.min((model.page + 1) * model.pageSize, model.total)}` : ''));
  $('page-number').textContent = model.total ? `${model.page + 1} / ${Math.ceil(model.total / model.pageSize)}` : '0 / 0';
  $('loading').hidden = !model.loading;
  $('cards').hidden = model.total === 0; $('empty').hidden = model.total !== 0;
  $('empty-title').textContent = settings.historyLimit === 0 ? '履歴は無効になっています' : 'まだ壁紙の履歴がありません';
  $('empty-message').textContent = settings.historyLimit === 0 ? 'Appletの設定で履歴件数を増やすと、使用した壁紙を表示できます。' : 'このモニターで使った壁紙が、ここに並びます。';
  busy();
}
async function operate(callback) {
  if (actionBusy || (processing && !$('delete-dialog').open)) return;
  actionBusy = true; busy(); $('error').hidden = true;
  try { await callback(); } catch (error) { showError(error); }
  finally { actionBusy = false; busy(); if (refreshQueued) void drain(); }
}
function finishDialog(id) {
  $(id).close(); if (dialogFocus?.isConnected) dialogFocus.focus(); else $('refresh').focus();
  if (deferred) { deferred = false; changed(); }
}
$('preview-close').addEventListener('click', () => finishDialog('preview'));
$('preview').addEventListener('cancel', (event) => { event.preventDefault(); finishDialog('preview'); });
let previewBackdropPressed = false;
function onPreviewBackdrop(event) {
  const preview = $('preview'), bounds = preview.getBoundingClientRect();
  return event.target === preview && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
}
$('preview').addEventListener('pointerdown', (event) => { previewBackdropPressed = onPreviewBackdrop(event); });
$('preview').addEventListener('click', (event) => {
  if (previewBackdropPressed && onPreviewBackdrop(event)) finishDialog('preview');
  previewBackdropPressed = false;
});
async function cancelDelete() {
  if (actionBusy) return;
  await operate(async () => {
    const token = confirmationToken; confirmationToken = undefined;
    try { if (token) await action('history.delete-cancel', { confirmationToken: token }); }
    finally { finishDialog('delete-dialog'); }
  });
  changed();
}
$('delete-cancel').addEventListener('click', () => void cancelDelete());
$('delete-dialog').addEventListener('cancel', (event) => { event.preventDefault(); void cancelDelete(); });
$('delete-confirm').addEventListener('click', () => void operate(async () => {
  const token = confirmationToken; if (!token) return;
  confirmationToken = undefined; $('delete-confirm').disabled = true; $('delete-cancel').disabled = true;
  try { await action('history.delete-confirm', { confirmationToken: token }); }
  finally {
    finishDialog('delete-dialog'); $('delete-confirm').disabled = false; $('delete-cancel').disabled = false;
    if (model) requestPage(model.monitor, model.page);
  }
}));
$('previous').addEventListener('click', () => requestPage(model.monitor, model.page - 1));
$('next').addEventListener('click', () => requestPage(model.monitor, model.page + 1));
$('refresh').addEventListener('click', () => { $('error').hidden = true; requestPage(model?.monitor ?? 0, model?.page ?? 0); });
$('home').addEventListener('click', () => void operate(async () => { await bridge.executeCommand('at365.wallpaper-slideshow.home'); }));
if (bridge) {
  const unsubscribe = bridge.onChanged(changed); window.addEventListener('unload', unsubscribe, { once: true }); changed();
} else { $('cards').setAttribute('aria-busy', 'false'); showError('AppDockからこのページを開いてください。'); }
