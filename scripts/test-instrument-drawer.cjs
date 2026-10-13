/* The Page and The Draw keep their work in the drawer, and The House shows
   it there. These checks run the built pages: the instrument's own script
   with js/keep.js, and The House's drawer with what they kept. jsdom has no
   IndexedDB and draws nothing, so a drawing's picture store and the canvas
   are stood in for; the real store is js/keep.js's own. Run
   `bundle exec jekyll build` first. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const site = path.join(root, '_site');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
if (!fs.existsSync(path.join(site, 'house', 'catalog.json'))) {
  console.error('test-instrument-drawer: run `bundle exec jekyll build` first');
  process.exit(1);
}
const KEY = 'olae-house-v1';
const keepJs = read(root, 'js', 'keep.js');
const catalogText = read(site, 'house', 'catalog.json');
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const settle = async () => { for (let i = 0; i < 6; i++) await tick(); };

/* The page's own inline scripts, found by what they say rather than where
   they stand. */
function inline(html, marker) {
  const found = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((code) => code.includes(marker));
  assert.equal(found.length, 1, 'one script holds ' + marker);
  return found[0];
}

/* A picture store in memory, in the shape of js/keep.js's own. */
function memoryFiles(w, store = new Map()) {
  return {
    store,
    works: () => true,
    put: (id, blob) => { store.set(id, blob); return Promise.resolve(); },
    get: (id) => Promise.resolve(store.get(id) || null),
    remove: (id) => { store.delete(id); return Promise.resolve(); },
    tidy: () => Promise.resolve()
  };
}

function load(file, url, { storage = {}, files, before, scripts }) {
  const html = read(site, file);
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.scrollTo = () => {};
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, value);
  if (before) before(w);
  w.eval(keepJs);
  if (files) w.OLAE_KEEP.files = files;
  for (const marker of scripts) w.eval(inline(html, marker));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  const q = (s) => w.document.querySelector(s);
  const drawer = () => JSON.parse(w.localStorage.getItem(KEY) || '{"kept":[]}').kept;
  return { dom, w, q, drawer };
}

const page = (options = {}) => load('write/index.html', options.url || 'https://hakanaltun.io/write/', {
  ...options,
  scripts: ['OLAE_STORAGE =', 'the drawer: a copy of the page', '4b · clear']
});

function type(p, words) {
  const area = p.q('#page');
  area.value = words;
  area.dispatchEvent(new p.w.Event('input', { bubbles: true }));
}

(async () => {
  // --- The Page --------------------------------------------------------------
  let p = page();
  assert.equal(p.q('#drawerBtn').hidden, false, 'the drawer button shows once js/keep.js is there');
  assert.equal(p.q('#drawerPop').hidden, true, 'its box waits closed');
  assert.ok(p.q('script[src^="/js/keep.js"]').defer, 'js/keep.js is deferred, so it never holds up the page');
  p.q('#drawerBtn').click();
  assert.equal(p.q('#drawerPop').hidden, false, 'the button opens the box');
  assert.equal(p.q('#drawerBtn').getAttribute('aria-expanded'), 'true');
  assert.equal(p.q('#drawerLink').getAttribute('href'), '/house/?from=page#drawer', 'Open your drawer leads to the drawer, with the way back');
  p.q('#keepBtn').click();
  assert.equal(p.q('#drawerSaid').textContent, 'There is nothing on the page to keep yet.');
  assert.equal(p.drawer().length, 0, 'an empty page keeps nothing');

  const letter = '# A letter\n\nDear Ayşe, the rain came back today.\n';
  type(p, letter);
  assert.equal(p.q('#keepBtn').textContent, 'Keep in your drawer');
  p.q('#keepBtn').click();
  let kept = p.drawer();
  assert.equal(kept.length, 1, 'Keep puts the page in the drawer');
  assert.match(kept[0].id, /^page-[a-z0-9]+$/);
  assert.equal(kept[0].kind, 'The Page');
  assert.match(kept[0].title, /^Written on \d{1,2} [A-Z][a-z]+ \d{4}$/);
  assert.equal(kept[0].text, letter, 'the page is kept line for line, as the download gives it');
  assert.equal(kept[0].href, '/write/');
  assert.equal(p.q('#drawerSaid').textContent, 'Kept in your drawer.');
  assert.equal(p.q('#keepBtn').textContent, 'In your drawer ✓');
  const pageId = kept[0].id;
  assert.equal(JSON.parse(p.w.localStorage.getItem('olae-page-v1')).kept, pageId, 'the page remembers the copy it was kept as');

  p.q('#keepBtn').click();
  assert.equal(p.q('#drawerSaid').textContent, 'Your drawer has this page as it is now.');
  assert.equal(p.drawer().length, 1, 'keeping the same words again adds nothing');

  type(p, letter + 'I kept the window open all evening.');
  assert.equal(p.q('#keepBtn').textContent, 'Update the copy in your drawer', 'more writing offers to bring the copy up to date');
  p.q('#keepBtn').click();
  kept = p.drawer();
  assert.equal(kept.length, 1, 'keeping again updates the same copy');
  assert.equal(kept[0].id, pageId);
  assert.equal(kept[0].text, letter + 'I kept the window open all evening.');
  assert.equal(p.q('#drawerSaid').textContent, 'The copy in your drawer is up to date.');

  // Escape and a click elsewhere close the box.
  p.w.document.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(p.q('#drawerPop').hidden, true, 'Escape closes the box');
  assert.equal(p.w.document.activeElement, p.q('#drawerBtn'), 'and returns to its button');
  p.q('#drawerBtn').click();
  p.q('#page').click();
  assert.equal(p.q('#drawerPop').hidden, true, 'a click on the page closes it');

  // Clear lets go of the copy; Undo takes hold of it again. The label is
  // read as the reader reads it, with the box open.
  const label = () => {
    p.q('#drawerBtn').click();
    const words = p.q('#keepBtn').textContent;
    p.q('#drawerBtn').click();
    return words;
  };
  const clear = p.q('#clearBtn');
  clear.click(); clear.click();
  assert.equal(p.q('#page').value, '', 'Clear empties the page');
  assert.equal(label(), 'Keep in your drawer', 'an emptied page lets go of its copy');
  clear.click();
  assert.equal(label(), 'In your drawer ✓', 'Undo brings back the words and the copy they were kept as');
  clear.click(); clear.click();
  type(p, 'Another morning.');
  p.q('#drawerBtn').click();
  p.q('#keepBtn').click();
  kept = p.drawer();
  assert.equal(kept.length, 2, 'after Clear, the next page is kept on its own');
  assert.equal(kept[0].text, letter + 'I kept the window open all evening.', 'and the first stays as it was');
  p.dom.window.close();

  // A page taken out of the drawer in The House is kept anew.
  p = page({ storage: { 'olae-page-v1': JSON.stringify({ text: 'Kept once.', kept: 'page-gone' }), [KEY]: JSON.stringify({ v: 2, kept: [] }) } });
  assert.equal(p.q('#keepBtn').textContent, 'Keep in your drawer', 'a copy no longer in the drawer is not offered as kept');
  p.q('#keepBtn').click();
  assert.notEqual(p.drawer()[0].id, 'page-gone');
  p.dom.window.close();

  // Taking a note to The Page leaves the page's hold on its copy alone.
  p = page({ storage: { 'olae-page-v1': JSON.stringify({ text: 'Kept once.', kept: 'page-abc' }) } });
  assert.equal(p.w.OLAE_KEEP.toPage('A note.', null), true);
  const after = JSON.parse(p.w.localStorage.getItem('olae-page-v1'));
  assert.equal(after.text, 'Kept once.\n\nA note.');
  assert.equal(after.kept, 'page-abc');
  p.dom.window.close();

  // Inside The Desk, the drawer opens in the whole window.
  p = page({
    url: 'https://hakanaltun.io/write/?desk=1',
    before: (w) => { w.OLAE_DESK_EMBED = { register() {} }; }
  });
  assert.equal(p.q('#drawerLink').target, '_top');
  assert.equal(p.q('#drawerLink').getAttribute('href'), '/house/?from=desk#drawer');
  p.dom.window.close();

  // --- What the drawer can and cannot hold -----------------------------------
  p = page();
  const KEEP = p.w.OLAE_KEEP;
  assert.equal(KEEP.storeWork({ id: 'page-long', kind: 'The Page', title: 'Long', text: 'x'.repeat(200001), href: '/write/' }), 'long');
  assert.equal(KEEP.storeWork({ id: 'text-abc', kind: 'An essay', title: 'Not a work', href: '/' }), 'unsaved', 'only a page or a drawing is kept this way');
  // A full store leaves the drawer as it was, and still saving.
  KEEP.toggle({ id: 'word-window', kind: 'A word', title: 'window', href: '/word/window/' });
  const setItem = p.w.Storage.prototype.setItem;
  p.w.Storage.prototype.setItem = function (key, value) {
    if (key === KEY && value.length > 5000) throw new p.w.DOMException('Full', 'QuotaExceededError');
    return setItem.call(this, key, value);
  };
  assert.equal(KEEP.storeWork({ id: 'page-big', kind: 'The Page', title: 'Big', text: 'y'.repeat(6000), href: '/write/' }), 'full');
  assert.deepEqual(p.drawer().map((k) => k.id), ['word-window'], 'a page with no room leaves the drawer as it was');
  assert.equal(KEEP.works(), true, 'and the drawer goes on being saved');
  KEEP.toggle({ id: 'word-museum', kind: 'A word', title: 'museum', href: '/word/museum/' });
  assert.deepEqual(p.drawer().map((k) => k.id), ['word-window', 'word-museum']);
  p.w.Storage.prototype.setItem = setItem;
  // Plain text carries the whole page and no address.
  const plainPage = KEEP.plain({ id: 'page-x', kind: 'The Page', title: 'Written on 1 May 2026', text: 'Line one.\nLine two.', href: '/write/' });
  assert.equal(plainPage, 'The Page · Written on 1 May 2026\nLine one.\nLine two.');
  assert.equal(KEEP.plain({ id: 'drawing-x', kind: 'The Draw', title: 'Drawn on 1 May 2026', href: '/draw/' }), 'The Draw · Drawn on 1 May 2026\nA drawing, kept in your drawer as a picture.');
  p.dom.window.close();

  // A browser that cannot keep the drawer keeps nothing from The Page.
  p = load('write/index.html', 'https://hakanaltun.io/write/', {
    before: (w) => {
      const real = w.localStorage;
      const blocked = { getItem: (k) => real.getItem(k), removeItem: (k) => real.removeItem(k), setItem: (k, v) => { if (k.indexOf('olae-house-v1') === 0) throw new w.DOMException('Denied', 'SecurityError'); real.setItem(k, v); } };
      Object.defineProperty(w, 'localStorage', { get() { return blocked; } });
    },
    scripts: ['OLAE_STORAGE =', 'the drawer: a copy of the page']
  });
  type(p, 'Words.');
  p.q('#keepBtn').click();
  assert.equal(p.q('#drawerSaid').textContent, 'This browser cannot keep your drawer. Download the page instead.');
  p.dom.window.close();

  // --- The Draw ---------------------------------------------------------------
  const pictures = new Map();
  const drawPage = (files) => load('draw/index.html', 'https://hakanaltun.io/draw/', {
    files,
    before: (w) => {
      const noop = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
      w.HTMLCanvasElement.prototype.toBlob = function (done, type) { done(new w.Blob(['png ' + this.width + 'x' + this.height], { type })); };
      w.HTMLCanvasElement.prototype.setPointerCapture = noop;
    },
    scripts: ['the drawer: the drawing as a picture']
  });
  let d = drawPage(memoryFiles(null, pictures));
  assert.equal(d.q('#drawerBtn').hidden, false);
  assert.equal(d.q('#drawerLink').getAttribute('href'), '/house/?from=draw#drawer');
  const stroke = (x) => {
    const canvas = d.q('#paper');
    const at = (type, dx) => { const e = new d.w.MouseEvent(type, { bubbles: true, clientX: x + dx, clientY: 40 + dx, button: 0 }); canvas.dispatchEvent(e); };
    at('pointerdown', 0); at('pointermove', 10); at('pointermove', 20); at('pointerup', 20);
  };
  d.q('#drawerBtn').click();
  d.q('#keepBtn').click();
  assert.equal(d.q('#drawerSaid').textContent, 'There is nothing on the page to keep yet.');
  stroke(10);
  assert.equal(d.q('#drawerPop').hidden, true, 'drawing on the page closes the box');
  d.q('#drawerBtn').click();
  d.q('#keepBtn').click();
  assert.equal(d.q('#keepBtn').textContent, 'Keeping…', 'the button waits while the picture is put away');
  assert.equal(d.q('#keepBtn').disabled, true);
  await settle();
  kept = d.drawer();
  assert.equal(kept.length, 1);
  assert.match(kept[0].id, /^drawing-[a-z0-9]+$/);
  assert.equal(kept[0].kind, 'The Draw');
  assert.match(kept[0].title, /^Drawn on \d{1,2} [A-Z][a-z]+ \d{4}$/);
  assert.equal(kept[0].text, undefined, 'the record holds no picture');
  assert.ok(pictures.has(kept[0].id), 'the picture waits beside it under the same id');
  assert.equal(d.q('#drawerSaid').textContent, 'Kept in your drawer.');
  assert.equal(d.q('#keepBtn').textContent, 'In your drawer ✓');
  const drawingId = kept[0].id;
  d.q('#keepBtn').click();
  assert.equal(d.q('#drawerSaid').textContent, 'Your drawer has this drawing as it is now.');
  stroke(60);
  d.q('#drawerBtn').click();
  assert.equal(d.q('#keepBtn').textContent, 'Update the picture in your drawer');
  d.q('#keepBtn').click();
  await settle();
  assert.equal(d.drawer().length, 1, 'keeping again updates the same picture');
  assert.equal(d.drawer()[0].id, drawingId);
  assert.equal(d.q('#drawerSaid').textContent, 'The picture in your drawer is up to date.');
  // Undoing every stroke lets go of it.
  d.q('#undoBtn').click(); d.q('#undoBtn').click();
  stroke(30);
  d.q('#drawerBtn').click();
  assert.equal(d.q('#keepBtn').textContent, 'Keep in your drawer', 'a page drawn anew is kept on its own');
  d.dom.window.close();

  // A picture that cannot be stored keeps nothing.
  d = drawPage(Object.assign(memoryFiles(), { put: () => Promise.reject(new Error('Full')) }));
  stroke(10);
  d.q('#drawerBtn').click();
  d.q('#keepBtn').click();
  await settle();
  assert.equal(d.drawer().length, 0);
  assert.equal(d.q('#drawerSaid').textContent, 'This browser cannot keep a drawing in your drawer. Download it instead.');
  assert.equal(d.q('#keepBtn').disabled, false);
  d.dom.window.close();

  // Without a picture store the button stays away.
  d = drawPage(Object.assign(memoryFiles(), { works: () => false }));
  assert.equal(d.q('#drawerBtn').hidden, true);
  d.dom.window.close();

  // --- The House --------------------------------------------------------------
  const longPage = '# On the ferry\n\n' + Array.from({ length: 6 }, (_, i) => 'Paragraph ' + (i + 1) + '. The gulls followed the boat the whole way to Kadıköy.').join('\n\n');
  const records = [
    { id: 'page-a1', kind: 'The Page', title: 'Written on 13 October 2026', text: longPage, href: '/write/', at: Date.UTC(2026, 9, 13) },
    { id: drawingId, kind: 'The Draw', title: 'Drawn on 13 October 2026', href: '/draw/', at: Date.UTC(2026, 9, 13) }
  ];
  const housePage = (url) => {
    const html = read(site, 'house/index.html');
    const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
    const w = dom.window;
    w.HTMLElement.prototype.scrollIntoView = function () {};
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { if (!this.open) return; this.open = false; this.dispatchEvent(new w.Event('close')); };
    w.setInterval = () => 0;
    w.URL.createObjectURL = () => 'blob:picture';
    w.URL.revokeObjectURL = () => {};
    w.fetch = (address) => Promise.resolve(String(address).startsWith('/house/catalog.json')
      ? { ok: true, json: () => Promise.resolve(JSON.parse(catalogText)) }
      : { ok: false, json: () => Promise.resolve({}) });
    w.localStorage.setItem(KEY, JSON.stringify({ v: 2, kept: records }));
    w.eval(keepJs);
    w.OLAE_KEEP.files = memoryFiles(null, pictures);
    for (const name of ['astronomy', 'house-weather', 'house']) w.eval(read(root, 'js', name + '.js'));
    return { dom, w, q: (s) => w.document.querySelector(s), all: (s) => [...w.document.querySelectorAll(s)] };
  };
  const h = housePage('https://hakanaltun.io/house/?from=page#drawer');
  await settle();
  assert.equal(h.q('#house-dialog-title').textContent, 'Your drawer');
  const back = h.q('#house-dialog-content .house-back');
  assert.equal(back.textContent, '← Back to The Page', 'the drawer leads back to the instrument it was opened from');
  assert.equal(back.getAttribute('href'), '/write/');
  const items = h.all('#house-dialog-content .house-item');
  const pageItem = items.find((a) => a.textContent.includes('Written on'));
  const drawingItem = items.find((a) => a.textContent.includes('Drawn on'));
  const opening = pageItem.querySelector('.house-page-text');
  assert.ok(opening.textContent.startsWith('# On the ferry'), 'a page shows its opening');
  assert.ok(!opening.textContent.endsWith('…'), 'an opening that ends with a whole line takes no ellipsis');
  assert.ok(opening.textContent.length < longPage.length);
  const whole = pageItem.querySelector('details.house-page-whole');
  assert.equal(whole.querySelector('summary').textContent, 'The whole page');
  assert.equal(whole.querySelector('.house-page-text').textContent.replace(/⁠/g, ''), longPage, 'and the whole of it a touch away');
  assert.match(pageItem.querySelector('.house-page-count').textContent, /^\d+ words$/);
  const buttons = (a) => [...a.querySelectorAll('.house-item-actions button')].map((b) => b.textContent);
  assert.deepEqual(buttons(pageItem), ['Download as text', 'Remove'], 'a page has no note and no card');
  assert.deepEqual(buttons(drawingItem), ['Download as PNG', 'Remove'], 'nor has a drawing');
  assert.equal(pageItem.querySelector('.house-item-actions a'), null, 'and no way to a page it does not live on');
  const image = drawingItem.querySelector('.house-drawing img');
  assert.ok(image, 'a drawing shows its picture');
  assert.equal(image.getAttribute('alt'), 'Your drawing');

  // Downloads give what the instrument gives.
  const saved = [];
  h.w.HTMLAnchorElement.prototype.click = function () { saved.push(this.download); };
  pageItem.querySelector('[data-take]').click();
  drawingItem.querySelector('[data-take]').click();
  await settle();
  assert.deepEqual(saved, ['page-2026-10-13.txt', 'draw-2026-10-13.png']);

  // Taking out the reader's own work asks twice, and takes the picture too.
  const out = drawingItem.querySelector('[data-remove]');
  out.click();
  assert.equal(out.textContent, 'Remove it for good');
  assert.equal(h.q('#house-dialog-status').textContent, 'The drawing would leave your drawer. Download it first to keep a copy.');
  assert.ok(h.w.OLAE_KEEP.find(drawingId), 'the first press takes nothing out');
  out.click();
  assert.equal(h.w.OLAE_KEEP.find(drawingId), null);
  await settle();
  assert.equal(pictures.has(drawingId), false, 'its picture goes with it');
  h.dom.window.close();

  // A backup carries the picture, and restoring puts it back.
  records.splice(0, records.length, { id: 'drawing-b2', kind: 'The Draw', title: 'Drawn on 1 May 2026', href: '/draw/', at: 1 });
  const b = housePage('https://hakanaltun.io/house/#drawer');
  await settle();
  pictures.set('drawing-b2', new b.w.Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }));
  let backupBlob = null;
  b.w.URL.createObjectURL = (blob) => { if (/json/.test(blob.type)) backupBlob = blob; return 'blob:x'; };
  b.w.HTMLAnchorElement.prototype.click = function () {};
  b.q('[data-export="backup"]').click();
  for (let i = 0; i < 20 && !backupBlob; i++) await tick();
  const backup = JSON.parse(await backupBlob.text());
  assert.deepEqual(backup.items.map((i) => i.id), ['drawing-b2']);
  assert.equal(backup.pictures['drawing-b2'], 'data:image/png;base64,iVBORw==', 'the backup carries the picture');
  b.dom.window.close();

  pictures.clear();
  records.splice(0, records.length);
  const r = housePage('https://hakanaltun.io/house/#drawer');
  await settle();
  const input = r.q('[data-drawer-file]');
  const file = new r.w.File([JSON.stringify(backup)], 'your-drawer.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { value: [file] });
  input.dispatchEvent(new r.w.Event('change'));
  for (let i = 0; i < 40 && !r.w.OLAE_KEEP.find('drawing-b2'); i++) await new Promise((done) => setTimeout(done, 5));
  assert.ok(r.w.OLAE_KEEP.find('drawing-b2'), 'restoring brings the drawing back');
  assert.ok(pictures.has('drawing-b2'), 'with its picture');
  assert.equal(r.q('#house-dialog-status').textContent, '1 item added to your drawer.');
  r.dom.window.close();

  const versions = [read(root, '_includes', 'head.html'), read(root, 'write', 'index.html'), read(root, 'draw', 'index.html')].map((html) => (html.match(/\/js\/keep\.js\?v=([\w-]+)/) || [])[1]);
  assert.equal(new Set(versions).size, 1, 'every page loads the same js/keep.js');
  assert.ok(read(root, 'sw.js').includes('"/js/keep.js"'), 'the instruments find js/keep.js offline too');

  console.log('Instrument drawer checks passed: The Page and The Draw keep, update, let go and refuse plainly; the drawer shows, downloads, backs up and takes out their work.');
})().catch((error) => { console.error(error); process.exit(1); });
