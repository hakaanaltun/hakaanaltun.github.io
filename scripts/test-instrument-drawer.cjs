/* The instruments keep their work in the drawer (js/tool-drawer.js), The
   Reader keeps passages from the reader's own file, and The House shows
   them there and leads back. These checks run the built pages: each
   instrument's own script with js/keep.js and js/tool-drawer.js, and The
   House's drawer with what they kept. jsdom has no IndexedDB and draws
   nothing, so a drawing's picture store and the canvas are stood in for;
   the real store is js/keep.js's own. Run `bundle exec jekyll build`
   first. */
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
const LINKS = 'olae-tool-kept';
const keepJs = read(root, 'js', 'keep.js');
const toolDrawerJs = read(root, 'js', 'tool-drawer.js');
const catalogText = read(site, 'house', 'catalog.json');
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const settle = async () => { for (let i = 0; i < 8; i++) await tick(); };
const DATE = /\d{1,2} [A-Z][a-z]+ \d{4}$/;

/* The page's own inline scripts, found by what they say rather than where
   they stand. */
function inline(html, marker) {
  const found = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((code) => code.includes(marker));
  assert.equal(found.length, 1, 'one script holds ' + marker);
  return found[0];
}

/* A picture store in memory, in the shape of js/keep.js's own. */
function memoryFiles(store = new Map()) {
  return {
    store,
    works: () => true,
    put: (id, blob) => { store.set(id, blob); return Promise.resolve(); },
    get: (id) => Promise.resolve(store.get(id) || null),
    remove: (id) => { store.delete(id); return Promise.resolve(); },
    tidy: () => Promise.resolve()
  };
}

function load(file, url, { storage = {}, files, before, scripts, drawer = true }) {
  const html = read(site, file);
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.scrollTo = () => {};
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  if (before) before(w);
  w.eval(keepJs);
  if (files) w.OLAE_KEEP.files = files;
  for (const marker of scripts) w.eval(inline(html, marker));
  // The deferred scripts, in their order on the page.
  if (drawer) w.eval(toolDrawerJs);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  const q = (s) => w.document.querySelector(s);
  const kept = () => JSON.parse(w.localStorage.getItem(KEY) || '{"kept":[]}').kept;
  const links = () => JSON.parse(w.localStorage.getItem(LINKS) || '{}');
  const open = () => { if (q('#drawerPop').hidden) q('#drawerBtn').click(); };
  const shut = () => { if (!q('#drawerPop').hidden) q('#drawerBtn').click(); };
  const label = () => { const was = q('#drawerPop').hidden; open(); const words = q('#keepBtn').textContent; if (was) shut(); return words; };
  const keep = () => { open(); q('#keepBtn').click(); return q('#drawerSaid').textContent; };
  return { dom, w, q, kept, links, open, shut, label, keep };
}
const STORAGE = 'OLAE_STORAGE =';
const page = (options = {}) => load('write/index.html', options.url || 'https://hakanaltun.io/write/', {
  ...options,
  scripts: [STORAGE, 'the drawer: a copy of the page', '4b · clear']
});
function type(p, area, words) {
  const node = p.q(area);
  node.value = words;
  node.dispatchEvent(new p.w.Event('input', { bubbles: true }));
}
const record = (id, fields) => Object.assign({ id, kind: 'The Page', title: 'Written on 1 May 2026', href: '/write/', at: 1 }, fields);

(async () => {
  // --- The Page --------------------------------------------------------------
  let p = page();
  assert.ok(p.q('script[src^="/js/keep.js"]').defer && p.q('script[src^="/js/tool-drawer.js"]').defer, 'the drawer\'s scripts never hold up the page');
  assert.ok(p.q('.actions #drawerBtn + #dlBtn'), 'the drawer button stands beside the download');
  assert.equal(p.q('#drawerPop').hidden, true, 'its box waits closed');
  p.open();
  assert.equal(p.q('#drawerBtn').getAttribute('aria-expanded'), 'true');
  assert.equal(p.q('#drawerLink').getAttribute('href'), '/house/?from=write#drawer', 'Open your drawer leads to the drawer, with the way back');
  assert.equal(p.keep(), 'There is nothing on the page to keep yet.');
  assert.equal(p.kept().length, 0, 'an empty page keeps nothing');

  const letter = '# A letter\n\nDear Ayşe, the rain came back today.\n';
  type(p, '#page', letter);
  assert.equal(p.label(), 'Keep in your drawer');
  assert.equal(p.keep(), 'Kept in your drawer.');
  let kept = p.kept();
  assert.equal(kept.length, 1, 'Keep puts the page in the drawer');
  assert.match(kept[0].id, /^page-[a-z0-9]+$/);
  assert.equal(kept[0].kind, 'The Page');
  assert.match(kept[0].title, new RegExp('^Written on ' + DATE.source));
  assert.equal(kept[0].text, letter, 'the page is kept line for line, as the download gives it');
  assert.equal(kept[0].href, '/write/');
  assert.equal(p.q('#keepBtn').textContent, 'In your drawer ✓');
  const pageId = kept[0].id;
  assert.deepEqual(p.links().write, { id: pageId }, 'the page remembers the copy it was kept as');

  assert.equal(p.keep(), 'Your drawer has this page as it is now.');
  assert.equal(p.kept().length, 1, 'keeping the same words again adds nothing');

  type(p, '#page', letter + 'I kept the window open all evening.');
  await settle();
  assert.equal(p.q('#keepBtn').textContent, 'Update the copy in your drawer', 'more writing offers to bring the copy up to date');
  assert.equal(p.keep(), 'The copy in your drawer is up to date.');
  kept = p.kept();
  assert.equal(kept.length, 1, 'keeping again updates the same copy');
  assert.equal(kept[0].id, pageId);
  assert.equal(kept[0].text, letter + 'I kept the window open all evening.');

  // Escape and a touch elsewhere close the box.
  p.w.document.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(p.q('#drawerPop').hidden, true, 'Escape closes the box');
  assert.equal(p.w.document.activeElement, p.q('#drawerBtn'), 'and returns to its button');
  p.open();
  p.q('#page').dispatchEvent(new p.w.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(p.q('#drawerPop').hidden, true, 'a touch on the page closes it');

  // Clear lets go of the copy; Undo takes hold of it again.
  const clear = p.q('#clearBtn');
  clear.click(); clear.click();
  await settle();
  assert.equal(p.q('#page').value, '', 'Clear empties the page');
  assert.equal(p.label(), 'Keep in your drawer', 'an emptied page lets go of its copy');
  clear.click();
  await settle();
  assert.equal(p.label(), 'In your drawer ✓', 'Undo brings back the words and the copy they were kept as');
  clear.click(); clear.click();
  await settle();
  type(p, '#page', 'Another morning.');
  await settle();
  p.keep();
  kept = p.kept();
  assert.equal(kept.length, 2, 'after Clear, the next page is kept on its own');
  assert.equal(kept[0].text, letter + 'I kept the window open all evening.', 'and the first stays as it was');
  p.dom.window.close();

  // A page taken out of the drawer in The House is kept anew.
  p = page({ storage: { 'olae-page-v1': { text: 'Kept once.' }, [LINKS]: { write: { id: 'page-gone' } } } });
  assert.equal(p.label(), 'Keep in your drawer', 'a copy no longer in the drawer is not offered as kept');
  p.keep();
  assert.notEqual(p.kept()[0].id, 'page-gone');
  p.dom.window.close();

  // Taking a note to The Page leaves what else The Page keeps alone.
  p = page({ storage: { 'olae-page-v1': { text: 'Kept once.', other: 'stays' } } });
  assert.equal(p.w.OLAE_KEEP.toPage('A note.', null), true);
  const after = JSON.parse(p.w.localStorage.getItem('olae-page-v1'));
  assert.equal(after.text, 'Kept once.\n\nA note.');
  assert.equal(after.other, 'stays');
  p.dom.window.close();

  // Inside The Desk, the drawer opens in the whole window, and each place
  // remembers its own copy.
  for (const pane of [1, 2]) {
    p = page({
      url: 'https://hakanaltun.io/write/?desk=1' + (pane > 1 ? '&pane=2' : ''),
      before: (w) => { w.OLAE_DESK_EMBED = { pane, key: (base) => (pane > 1 ? base + '-2' : base), register() {} }; }
    });
    assert.equal(p.q('#drawerLink').target, '_top');
    assert.equal(p.q('#drawerLink').getAttribute('href'), '/house/?from=desk#drawer');
    type(p, '#page', 'Notes beside a reading, ' + pane + '.');
    p.keep();
    assert.ok(p.links()['write@desk' + pane], 'the place on the desk remembers its copy');
    assert.equal(p.links().write, undefined, 'apart from The Page on its own');
    p.dom.window.close();
  }

  // --- What the drawer can and cannot hold -----------------------------------
  p = page();
  const KEEP = p.w.OLAE_KEEP;
  assert.equal(KEEP.storeWork({ id: 'page-long', kind: 'The Page', title: 'Long', text: 'x'.repeat(200001), href: '/write/' }), 'long');
  assert.equal(KEEP.storeWork({ id: 'diff-long', kind: 'The Diff', title: 'Long', text: 'x', drafts: ['y'.repeat(150000), 'z'.repeat(60000)], href: '/diff/' }), 'long');
  assert.equal(KEEP.storeWork({ id: 'text-abc', kind: 'An essay', title: 'Not a work', href: '/' }), 'unsaved', 'only an instrument\'s work is kept this way');
  assert.deepEqual(['page-a', 'drawing-a', 'script-a', 'lots-a', 'list-a', 'clean-a', 'diff-a', 'text-a', 'word-a', 'notebook-a'].map(KEEP.workOf),
    ['page', 'drawing', 'script', 'lots', 'list', 'clean', 'diff', '', '', '']);
  // A full store leaves the drawer as it was, and still saving.
  KEEP.toggle({ id: 'word-window', kind: 'A word', title: 'window', href: '/word/window/' });
  const setItem = p.w.Storage.prototype.setItem;
  p.w.Storage.prototype.setItem = function (key, value) {
    if (key === KEY && value.length > 5000) throw new p.w.DOMException('Full', 'QuotaExceededError');
    return setItem.call(this, key, value);
  };
  assert.equal(KEEP.storeWork({ id: 'page-big', kind: 'The Page', title: 'Big', text: 'y'.repeat(6000), href: '/write/' }), 'full');
  assert.deepEqual(p.kept().map((k) => k.id), ['word-window'], 'a page with no room leaves the drawer as it was');
  assert.equal(KEEP.works(), true, 'and the drawer goes on being saved');
  KEEP.toggle({ id: 'word-museum', kind: 'A word', title: 'museum', href: '/word/museum/' });
  assert.deepEqual(p.kept().map((k) => k.id), ['word-window', 'word-museum']);
  p.w.Storage.prototype.setItem = setItem;
  // Plain text carries the whole work and no address.
  assert.equal(KEEP.plain({ id: 'page-x', kind: 'The Page', title: 'Written on 1 May 2026', text: 'Line one.\nLine two.', href: '/write/' }), 'The Page · Written on 1 May 2026\nLine one.\nLine two.');
  assert.equal(KEEP.plain({ id: 'drawing-x', kind: 'The Draw', title: 'Drawn on 1 May 2026', href: '/draw/' }), 'The Draw · Drawn on 1 May 2026\nA drawing, kept in your drawer as a picture.');
  assert.equal(KEEP.plain({ id: 'text-x', kind: 'The Reader', title: 'notes.md', quote: 'A passage of my own.', href: '/read/' }), 'The Reader · notes.md\n“A passage of my own.”', 'a passage from the reader\'s own file has no address');
  p.dom.window.close();

  // A browser that cannot keep the drawer keeps nothing from The Page.
  p = load('write/index.html', 'https://hakanaltun.io/write/', {
    before: (w) => {
      const real = w.localStorage;
      const blocked = { getItem: (k) => real.getItem(k), removeItem: (k) => real.removeItem(k), setItem: (k, v) => { if (k.indexOf(KEY) === 0) throw new w.DOMException('Denied', 'SecurityError'); real.setItem(k, v); } };
      Object.defineProperty(w, 'localStorage', { get() { return blocked; } });
    },
    scripts: [STORAGE, 'the drawer: a copy of the page']
  });
  type(p, '#page', 'Words.');
  assert.equal(p.keep(), 'This browser cannot keep your drawer. Download it instead.');
  p.dom.window.close();

  // --- Back from the drawer ----------------------------------------------------
  const backTo = (state, open, options = {}) => page({
    url: 'https://hakanaltun.io/write/?from=drawer&open=' + open + '&v=1',
    storage: Object.assign({ [KEY]: { v: 2, kept: state.kept || [] } }, state.page !== undefined ? { 'olae-page-v1': { text: state.page } } : {}, state.link ? { [LINKS]: { write: { id: state.link } } } : {}),
    ...options
  });
  const A = record('page-a', { text: 'The page I kept.' });
  const B = record('page-b', { text: 'Another kept page.' });
  // To an empty page.
  p = backTo({ kept: [A] }, 'page-a');
  assert.equal(p.q('#page').value, 'The page I kept.', 'Continue on The Page puts the kept page here');
  assert.equal(p.q('#drawerPop').hidden, false, 'and says so in the open box');
  assert.equal(p.q('#drawerSaid').textContent, 'Opened from your drawer.');
  assert.equal(p.links().write.id, 'page-a', 'the page now holds that copy');
  assert.equal(p.w.location.search, '?from=drawer&v=1', 'and the address forgets the request, so a reload asks nothing');
  assert.equal(JSON.parse(p.w.localStorage.getItem('olae-page-v1')).text, 'The page I kept.');
  p.dom.window.close();
  // Over other writing: it goes into the drawer first.
  p = backTo({ kept: [A], page: 'Something new.' }, 'page-a');
  assert.equal(p.q('#page').value, 'The page I kept.');
  assert.equal(p.q('#drawerSaid').textContent, 'Opened from your drawer. What was here before is in your drawer too.');
  assert.deepEqual(p.kept().map((k) => k.text), ['The page I kept.', 'Something new.'], 'nothing is lost');
  p.dom.window.close();
  // Over its own copy, written over without being emptied: the copy coming
  // back is never written over.
  p = backTo({ kept: [A], page: 'Written over it.', link: 'page-a' }, 'page-a');
  assert.equal(p.q('#page').value, 'The page I kept.');
  assert.deepEqual(p.kept().map((k) => k.text), ['The page I kept.', 'Written over it.']);
  p.dom.window.close();
  // Over another kept page, changed: that copy is brought up to date.
  p = backTo({ kept: [A, B], page: 'Another kept page, changed.', link: 'page-b' }, 'page-a');
  assert.deepEqual(p.kept().map((k) => k.text), ['The page I kept.', 'Another kept page, changed.']);
  assert.equal(p.links().write.id, 'page-a');
  p.dom.window.close();
  // Already here.
  p = backTo({ kept: [A], page: 'The page I kept.', link: 'page-a' }, 'page-a');
  assert.equal(p.q('#drawerSaid').textContent, 'This page is here as you kept it.');
  assert.equal(p.kept().length, 1);
  p.dom.window.close();
  // The same words, not yet linked to their copy: no second copy.
  p = backTo({ kept: [A], page: 'The page I kept.' }, 'page-a');
  assert.equal(p.q('#drawerSaid').textContent, 'Opened from your drawer.');
  assert.equal(p.kept().length, 1);
  assert.equal(p.links().write.id, 'page-a');
  p.dom.window.close();
  // Gone from the drawer, or another instrument's.
  for (const id of ['page-gone', 'script-a']) {
    p = backTo({ kept: [A, record('script-a', { kind: 'The Prompter', text: 'A script.' })], page: 'Stays.' }, id);
    assert.equal(p.q('#drawerSaid').textContent, 'This is no longer in your drawer.');
    assert.equal(p.q('#page').value, 'Stays.');
    p.dom.window.close();
  }
  // No room for what is here: nothing changes.
  p = backTo({ kept: [A], page: 'z'.repeat(6000) }, 'page-a', {
    before: (w) => {
      const setOne = w.Storage.prototype.setItem;
      w.Storage.prototype.setItem = function (key, value) {
        if (key === KEY && value.length > 5000) throw new w.DOMException('Full', 'QuotaExceededError');
        return setOne.call(this, key, value);
      };
    }
  });
  assert.equal(p.q('#drawerSaid').textContent, 'There is no room in your drawer for what is here, so nothing was changed.');
  assert.equal(p.q('#page').value, 'z'.repeat(6000));
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
  let d = drawPage(memoryFiles(pictures));
  assert.ok(d.q('.actions #drawerBtn + #dlBtn'));
  assert.equal(d.q('#drawerLink').getAttribute('href'), '/house/?from=draw#drawer');
  const stroke = (x) => {
    const canvas = d.q('#paper');
    const at = (type, dx) => canvas.dispatchEvent(new d.w.MouseEvent(type, { bubbles: true, clientX: x + dx, clientY: 40 + dx, button: 0 }));
    at('pointerdown', 0); at('pointermove', 10); at('pointermove', 20); at('pointerup', 20);
  };
  assert.equal(d.keep(), 'There is nothing on the page to keep yet.');
  stroke(10);
  assert.equal(d.q('#drawerPop').hidden, true, 'drawing on the page closes the box');
  d.open();
  d.q('#keepBtn').click();
  assert.equal(d.q('#keepBtn').textContent, 'Keeping…', 'the button waits while the picture is put away');
  assert.equal(d.q('#keepBtn').disabled, true);
  await settle();
  kept = d.kept();
  assert.equal(kept.length, 1);
  assert.match(kept[0].id, /^drawing-[a-z0-9]+$/);
  assert.equal(kept[0].kind, 'The Draw');
  assert.match(kept[0].title, new RegExp('^Drawn on ' + DATE.source));
  assert.equal(kept[0].text, undefined, 'the record holds no picture');
  assert.ok(pictures.has(kept[0].id), 'the picture waits beside it under the same id');
  assert.equal(d.q('#drawerSaid').textContent, 'Kept in your drawer.');
  assert.equal(d.q('#keepBtn').textContent, 'In your drawer ✓');
  const drawingId = kept[0].id;
  assert.equal(d.keep(), 'Your drawer has this drawing as it is now.');
  stroke(60);
  await settle();
  assert.equal(d.label(), 'Update the picture in your drawer');
  d.keep();
  await settle();
  assert.equal(d.kept().length, 1, 'keeping again updates the same picture');
  assert.equal(d.kept()[0].id, drawingId);
  assert.equal(d.q('#drawerSaid').textContent, 'The picture in your drawer is up to date.');
  // Undoing every stroke lets go of it.
  d.q('#undoBtn').click(); d.q('#undoBtn').click();
  await settle();
  stroke(30);
  await settle();
  assert.equal(d.label(), 'Keep in your drawer', 'a page drawn anew is kept on its own');
  d.dom.window.close();

  // A picture that cannot be stored keeps nothing.
  d = drawPage(Object.assign(memoryFiles(), { put: () => Promise.reject(new Error('Full')) }));
  stroke(10);
  d.keep();
  await settle();
  assert.equal(d.kept().length, 0);
  assert.equal(d.q('#drawerSaid').textContent, 'This browser cannot keep a drawing in your drawer. Download it instead.');
  assert.equal(d.q('#keepBtn').disabled, false);
  d.dom.window.close();

  // Without a picture store there is no button.
  d = drawPage(Object.assign(memoryFiles(), { works: () => false }));
  assert.equal(d.q('#drawerBtn'), null);
  d.dom.window.close();

  // --- The Prompter, The List and The Clean -------------------------------------
  const simple = [
    { file: 'prompt', area: '#script', marker: ': "olae-prompt-v1";', prefix: 'script', kind: 'The Prompter', title: /^A script, /, text: 'Week 3\n\nGood morning.', empty: 'There is no script to keep yet.', key: 'olae-prompt-v1' },
    { file: 'list', area: '#list', marker: ': "olae-list-v1";', prefix: 'list', kind: 'The List', title: /^A list of 3, /, text: 'pears\napples\nfigs', empty: 'There is no list to keep yet.', key: 'olae-list-v1' },
    { file: 'clean', area: '#text', marker: ': "olae-clean-v1";', prefix: 'clean', kind: 'The Clean', title: /^Text kept on /, text: '“Quoted”—and done…', empty: 'There is no text to keep yet.', key: 'olae-clean-v1' }
  ];
  for (const tool of simple) {
    const url = 'https://hakanaltun.io/' + tool.file + '/';
    let t = load(tool.file + '/index.html', url, { scripts: [STORAGE, tool.marker] });
    assert.ok(t.q('.actions #drawerBtn'), tool.kind + ' has the drawer button');
    assert.equal(t.keep(), tool.empty);
    type(t, tool.area, tool.text);
    assert.equal(t.keep(), 'Kept in your drawer.');
    const item = t.kept()[0];
    assert.match(item.id, new RegExp('^' + tool.prefix + '-'));
    assert.equal(item.kind, tool.kind);
    assert.match(item.title, tool.title);
    assert.equal(item.text, tool.text);
    assert.equal(item.href, '/' + tool.file + '/');
    t.dom.window.close();
    // and back again, over something else
    t = load(tool.file + '/index.html', url + '?from=drawer&open=' + item.id, {
      storage: { [KEY]: { v: 2, kept: [item] }, [tool.key]: { text: 'Something else.' } },
      scripts: [STORAGE, tool.marker]
    });
    assert.equal(t.q(tool.area).value, tool.text, 'Open in ' + tool.kind + ' puts it back');
    assert.equal(t.q('#drawerSaid').textContent, 'Opened from your drawer. What was here before is in your drawer too.');
    assert.equal(JSON.parse(t.w.localStorage.getItem(tool.key)).text, tool.text, 'and it is saved there');
    assert.deepEqual(t.kept().map((k) => k.text), [tool.text, 'Something else.']);
    t.dom.window.close();
  }

  // --- The Diff -----------------------------------------------------------------
  let df = load('diff/index.html', 'https://hakanaltun.io/diff/', { scripts: [STORAGE, ': "olae-diff-v1";'] });
  assert.equal(df.keep(), 'There are no drafts to keep yet.');
  type(df, '#beforeText', 'The rain came back today.');
  type(df, '#afterText', 'The rain came back this evening.');
  assert.equal(df.keep(), 'Kept in your drawer.');
  const comparison = df.kept()[0];
  assert.match(comparison.id, /^diff-/);
  assert.match(comparison.title, /^Compared on /);
  assert.deepEqual(comparison.drafts, ['The rain came back today.', 'The rain came back this evening.'], 'both drafts are kept');
  assert.ok(comparison.text.startsWith('2 words added · 1 word removed · 4 unchanged\nRemoved words are set in [- -], added words in {+ +}.'), comparison.text);
  assert.ok(comparison.text.includes('The rain came back [-today.-] {+this evening.+}'), 'the comparison is plain text');
  assert.ok(comparison.text.endsWith('Before\n\nThe rain came back today.\n\nAfter\n\nThe rain came back this evening.'), 'with both drafts after it');
  df.dom.window.close();
  df = load('diff/index.html', 'https://hakanaltun.io/diff/?from=drawer&open=' + comparison.id, {
    storage: { [KEY]: { v: 2, kept: [comparison] } },
    scripts: [STORAGE, ': "olae-diff-v1";']
  });
  assert.equal(df.q('#beforeText').value, 'The rain came back today.', 'Open in The Diff puts both drafts back');
  assert.equal(df.q('#afterText').value, 'The rain came back this evening.');
  assert.ok(df.q('#result').classList.contains('on'), 'and compares them');
  df.dom.window.close();

  // --- The Lots -----------------------------------------------------------------
  const lotsPage = (url, storage) => load('lots/index.html', url, { storage, scripts: [STORAGE, ': "olae-lots-v1";'] });
  let l = lotsPage('https://hakanaltun.io/lots/');
  assert.equal(l.keep(), 'There are no names to keep yet.');
  type(l, '#nameList', 'Ayşe\nAli\nMehmet\nZeynep\nCan\nElif');
  assert.equal(l.keep(), 'Kept in your drawer.');
  assert.equal(l.kept()[0].text, 'Ayşe\nAli\nMehmet\nZeynep\nCan\nElif', 'a list is kept one name to a line');
  assert.match(l.kept()[0].title, /^6 names, /);
  l.q('#groupNum').value = '2';
  l.q('#dealBtn').click();
  await settle();
  assert.equal(l.label(), 'Update the copy in your drawer', 'groups dealt change what would be kept');
  l.keep();
  const lots = l.kept()[0];
  assert.equal(l.kept().length, 1);
  assert.match(lots.title, /^6 names in 3 groups, /);
  const dealt = [...l.w.document.querySelectorAll('#groupsResult .group')].map((g) => [...g.querySelectorAll('li')].map((li) => li.textContent));
  assert.equal(lots.text, dealt.map((m, i) => ['Group ' + (i + 1)].concat(m).join('\n')).join('\n\n'), 'shown groups are kept under their names');
  // Groups that no longer hold the list as it is are left out.
  type(l, '#nameList', 'Ayşe\nAli\nMehmet\nZeynep\nCan\nElif\nDeniz');
  assert.equal(l.w.OLAE_TOOL_WORK.work().text.indexOf('Group'), -1);
  l.dom.window.close();
  // Back from the drawer with its groups as they were.
  l = lotsPage('https://hakanaltun.io/lots/?from=drawer&open=' + lots.id, { [KEY]: { v: 2, kept: [lots] }, 'olae-lots-v1': { text: 'Other\nClass', drawn: ['Other'] } });
  assert.equal(l.q('#nameList').value, dealt.flat().join('\n'), 'the names come back');
  assert.deepEqual([...l.w.document.querySelectorAll('#groupsResult .group')].map((g) => [...g.querySelectorAll('li')].map((li) => li.textContent)), dealt, 'and the groups as they were');
  assert.equal(l.q('#groupsNote').textContent, '6 names in 3 groups');
  assert.equal(l.q('#drawnList').children.length, 0, 'with nothing drawn yet');
  assert.deepEqual(l.kept().map((k) => k.text), [lots.text, 'Other\nClass'], 'the class that was here goes into the drawer');
  l.dom.window.close();
  // A list that arrives in a shared link is not the kept copy; the page's own
  // list, carried in its address, is.
  const encode = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  l = lotsPage('https://hakanaltun.io/lots/#s=' + encode({ t: 'Shared\nList', d: [], r: true }), { 'olae-lots-v1': { text: 'Mine\nOwn' }, [LINKS]: { lots: { id: 'lots-mine' } } });
  assert.equal(l.links().lots, undefined, 'a shared list lets go of the kept copy');
  l.dom.window.close();
  l = lotsPage('https://hakanaltun.io/lots/#s=' + encode({ t: 'Mine\nOwn', d: [], r: true }), { 'olae-lots-v1': { text: 'Mine\nOwn' }, [LINKS]: { lots: { id: 'lots-mine' } } });
  assert.deepEqual(l.links().lots, { id: 'lots-mine' }, 'its own list on a reload keeps it');
  l.dom.window.close();

  // --- The Reader -----------------------------------------------------------------
  const readerPage = (url, before) => load('read/index.html', url, { scripts: [], drawer: false, before });
  let r = readerPage('https://hakanaltun.io/read/');
  const reading = r.q('#reading');
  assert.equal(reading.getAttribute('data-keep-passage'), '', 'the text can be kept from');
  assert.equal(reading.getAttribute('data-keep-kind'), 'The Reader');
  reading.innerHTML = '<h1>Notes on light</h1><p>Chlorophyll absorbs red and blue light and reflects green.</p>';
  r.w.document.title = 'notes-on-light.md';
  const range = r.w.document.createRange();
  range.selectNodeContents(reading.querySelector('p'));
  const passage = r.w.OLAE_KEEP.passageFor(range);
  assert.equal(passage.kind, 'The Reader');
  assert.equal(passage.title, 'notes-on-light.md', 'a passage is named by its file');
  assert.equal(passage.href, '/read/');
  r.w.OLAE_KEEP.keepPassage(passage, null);
  assert.equal(r.q('.keep-panel a').getAttribute('href'), '/house/?from=read#drawer', 'its drawer leads back to The Reader');
  assert.ok(read(root, 'read', 'index.html').includes('--petrol:var(--ink)'), 'the prompt and panel take the Reader\'s own colours');
  r.dom.window.close();
  r = readerPage('https://hakanaltun.io/read/?desk=1', (w) => { w.OLAE_DESK_EMBED = { pane: 1, key: (b) => b, register() {} }; });
  r.q('#reading').innerHTML = '<p>Chlorophyll absorbs red and blue light and reflects green.</p>';
  const inDesk = r.w.document.createRange();
  inDesk.selectNodeContents(r.q('#reading p'));
  r.w.OLAE_KEEP.keepPassage(r.w.OLAE_KEEP.passageFor(inDesk), null);
  assert.equal(r.q('.keep-panel a').getAttribute('href'), '/house/?from=desk#drawer');
  assert.equal(r.q('.keep-panel a').target, '_top', 'inside The Desk the drawer opens in the whole window');
  r.dom.window.close();

  // --- The House --------------------------------------------------------------
  const longPage = '# On the ferry\n\n' + Array.from({ length: 6 }, (_, i) => 'Paragraph ' + (i + 1) + '. The gulls followed the boat the whole way to Kadıköy.').join('\n\n');
  const day = Date.UTC(2026, 9, 13);
  const records = [
    { id: 'page-a1', kind: 'The Page', title: 'Written on 13 October 2026', text: longPage, href: '/write/', at: day },
    { id: drawingId, kind: 'The Draw', title: 'Drawn on 13 October 2026', href: '/draw/', at: day },
    { id: 'script-a1', kind: 'The Prompter', title: 'A script, 13 October 2026', text: 'Week 3', href: '/prompt/', at: day },
    { id: 'lots-a1', kind: 'The Lots', title: '2 names, 13 October 2026', text: 'Ayşe\nAli', href: '/lots/', at: day },
    { id: 'diff-a1', kind: 'The Diff', title: 'Compared on 13 October 2026', text: comparison.text, drafts: comparison.drafts, href: '/diff/', at: day },
    { id: 'text-r1', kind: 'The Reader', title: 'notes-on-light.md', quote: 'Chlorophyll absorbs red and blue light.', href: '/read/', at: day }
  ];
  pictures.set(drawingId, new (new JSDOM('').window.Blob)(['png'], { type: 'image/png' }));
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
    w.OLAE_KEEP.files = memoryFiles(pictures);
    for (const name of ['astronomy', 'house-weather', 'drawer', 'house']) w.eval(read(root, 'js', name + '.js'));
    return { dom, w, q: (s) => w.document.querySelector(s), all: (s) => [...w.document.querySelectorAll(s)] };
  };
  for (const [from, words] of [['write', 'The Page'], ['lots', 'The Lots'], ['read', 'The Reader'], ['desk', 'The Desk']]) {
    const way = housePage('https://hakanaltun.io/house/?from=' + from + '#drawer');
    await settle();
    const back = way.q('#house-dialog-content .house-back');
    assert.equal(back.textContent, '← Back to ' + words, 'the drawer leads back to the instrument it was opened from');
    assert.equal(back.getAttribute('href'), '/' + from + '/');
    way.dom.window.close();
  }
  const h = housePage('https://hakanaltun.io/house/#drawer');
  await settle();
  assert.equal(h.q('#house-dialog-title').textContent, 'Your drawer');
  assert.equal(h.q('#house-dialog-content .house-back'), null, 'a drawer opened in The House has no way back to give');
  const items = h.all('#house-dialog-content .house-item');
  const item = (title) => items.find((a) => a.querySelector('h3').textContent === title);
  const pageItem = item('Written on 13 October 2026');
  const opening = pageItem.querySelector('.house-page-text');
  assert.ok(opening.textContent.startsWith('# On the ferry'), 'a page shows its opening');
  assert.ok(!opening.textContent.endsWith('…'), 'an opening that ends with a whole line takes no ellipsis');
  const whole = pageItem.querySelector('details.house-page-whole');
  assert.equal(whole.querySelector('summary').textContent, 'The whole page');
  assert.equal(whole.querySelector('.house-page-text').textContent.replace(/⁠/g, ''), longPage, 'and the whole of it a touch away');
  assert.match(pageItem.querySelector('.house-page-count').textContent, /^\d+ words$/);
  const actionsOf = (a) => [...a.querySelectorAll('.house-item-actions a, .house-item-actions button')].map((b) => b.textContent.replace(/ /g, ' '));
  assert.deepEqual(actionsOf(pageItem), ['Continue on The Page →', 'Download as text', 'Remove'], 'a page has no note and no card');
  const way = (a) => new URL(a.querySelector('.house-item-actions a').getAttribute('href'), 'https://hakanaltun.io');
  assert.equal(way(pageItem).pathname, '/write/');
  assert.equal(way(pageItem).searchParams.get('open'), 'page-a1', 'it goes back into The Page');
  assert.equal(way(pageItem).searchParams.get('from'), 'drawer', 'with the way back to the drawer');
  assert.ok(way(pageItem).searchParams.get('v'), 'past an older copy the service worker may hold');
  const drawingItem = item('Drawn on 13 October 2026');
  assert.deepEqual(actionsOf(drawingItem), ['Download as PNG', 'Remove'], 'a drawing does not go back into The Draw');
  const image = drawingItem.querySelector('.house-drawing img');
  assert.ok(image, 'a drawing shows its picture');
  assert.equal(image.getAttribute('alt'), 'Your drawing');
  assert.deepEqual(actionsOf(item('A script, 13 October 2026')), ['Open in The Prompter →', 'Download as text', 'Remove']);
  assert.equal(way(item('A script, 13 October 2026')).pathname, '/prompt/');
  assert.deepEqual(actionsOf(item('2 names, 13 October 2026')), ['Open in The Lots →', 'Download as text', 'Remove']);
  assert.equal(item('2 names, 13 October 2026').querySelector('.house-page-count'), null, 'a list is not counted in words');
  assert.deepEqual(actionsOf(item('Compared on 13 October 2026')), ['Open in The Diff →', 'Download as text', 'Remove']);
  const readerItem = item('notes-on-light.md');
  assert.deepEqual(actionsOf(readerItem), ['Open The Reader →', 'Add a note', 'Remove'], 'a passage from the reader\'s own file has no card');
  assert.equal(way(readerItem).pathname, '/read/');
  assert.equal(way(readerItem).searchParams.get('from'), 'drawer');

  // Downloads give what the instrument gives.
  const saved = [];
  h.w.HTMLAnchorElement.prototype.click = function () { saved.push(this.download); };
  for (const title of ['Written on 13 October 2026', 'Drawn on 13 October 2026', 'A script, 13 October 2026', 'Compared on 13 October 2026']) item(title).querySelector('[data-take]').click();
  await settle();
  // The drawing's picture is fetched first, so it arrives last.
  assert.deepEqual(saved.sort(), ['diff-2026-10-13.txt', 'draw-2026-10-13.png', 'page-2026-10-13.txt', 'script-2026-10-13.txt']);

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
  const scriptOut = h.q('#house-dialog-content [data-remove="script-a1"]');
  scriptOut.click();
  assert.equal(h.q('#house-dialog-status').textContent, 'The script would leave your drawer. Download it first to keep a copy.');
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
  const rs = housePage('https://hakanaltun.io/house/#drawer');
  await settle();
  const input = rs.q('[data-drawer-file]');
  const file = new rs.w.File([JSON.stringify(backup)], 'your-drawer.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { value: [file] });
  input.dispatchEvent(new rs.w.Event('change'));
  for (let i = 0; i < 40 && !rs.w.OLAE_KEEP.find('drawing-b2'); i++) await new Promise((done) => setTimeout(done, 5));
  assert.ok(rs.w.OLAE_KEEP.find('drawing-b2'), 'restoring brings the drawing back');
  assert.ok(pictures.has('drawing-b2'), 'with its picture');
  assert.equal(rs.q('#house-dialog-status').textContent, '1 item added to your drawer.');
  rs.dom.window.close();

  // Every page loads the same scripts, and the instruments find them offline.
  // The site's pages take theirs from _data/drawer_assets.yml.
  assert.ok(read(root, '_includes', 'head.html').includes('{{ site.data.drawer_assets.keep_js }}'));
  const pages = ['_data/drawer_assets.yml', 'write/index.html', 'draw/index.html', 'prompt/index.html', 'list/index.html', 'clean/index.html', 'diff/index.html', 'lots/index.html', 'read/index.html'];
  const versions = pages.map((file) => (read(root, file).match(/\/js\/keep\.js\?v=([\w-]+)/) || [])[1]);
  assert.equal(new Set(versions).size, 1, 'every page loads the same js/keep.js');
  const sw = read(root, 'sw.js');
  for (const asset of ['"/js/keep.js"', '"/js/tool-drawer.js"', '"/css/tool-drawer.css"', '"/css/keep.css"', '"/js/drawer.js"', '"/css/drawer.css"']) assert.ok(sw.includes(asset), asset + ' is there offline');

  console.log('Instrument drawer checks passed: every instrument keeps, updates, lets go and refuses plainly, and comes back from the drawer without losing what was there; The Lots keeps its groups and The Reader its passages; the drawer shows, downloads, backs up and takes out their work.');
})().catch((error) => { console.error(error); process.exit(1); });
