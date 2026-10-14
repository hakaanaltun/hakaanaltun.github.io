/* The House and the drawer. The drawer is the reader's own and outlives any
   version of the site, so these checks run against Jekyll's actual output:
   the room and its catalog, the pages a thing can be kept from, records
   left by the first House, records edited by hand, and storage that cannot
   be reached at all. Run `bundle exec jekyll build` first. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const site = path.join(root, '_site');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
if (!fs.existsSync(path.join(site, 'house', 'catalog.json'))) {
  console.error('test-house: run `bundle exec jekyll build` first');
  process.exit(1);
}
const KEY = 'olae-house-v1';
const scripts = {
  keep: read(root, 'js', 'keep.js'),
  astronomy: read(root, 'js', 'astronomy.js'),
  // The House lays its drawer out with js/drawer.js, which its page loads
  // just before it.
  house: read(root, 'js', 'drawer.js') + '\n;\n' + read(root, 'js', 'house.js'),
  drawer: read(root, 'js', 'drawer.js'),
  nav: read(root, 'js', 'site-nav.js'),
  weather: read(root, 'js', 'house-weather.js'),
  trivia: read(root, 'js', 'trivia.js'),
  translate: read(root, 'js', 'reader-translate.js'),
  snow: read(root, 'js', 'let-it-snow.js')
};
const catalogText = read(site, 'house', 'catalog.json');
const catalog = JSON.parse(catalogText);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// jsdom draws nothing, so the Custom Highlight API is stood in for: the
// marks a page sets are kept where a check can read them.
const highlights = (w) => {
  w.CSS = Object.assign(w.CSS || {}, { highlights: new Map() });
  w.Highlight = class { constructor() { this.ranges = []; } add(range) { this.ranges.push(range); } };
};
const marked = (w) => { const h = w.CSS.highlights.get('olae-kept'); return h ? h.ranges.map((r) => r.toString().replace(/\u2060/g, '').replace(/\s+/g, ' ').trim()) : []; };

function page(file, url, { saved, blocked = false, run = [], before, catalog: served } = {}) {
  const dom = new JSDOM(read(site, file), { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new w.Event('close'));
  };
  w.setInterval = () => 0;
  w.fetch = (address) => Promise.resolve(String(address).startsWith('/house/catalog.json')
    ? { ok: true, json: () => Promise.resolve(served ? JSON.parse(JSON.stringify(served)) : JSON.parse(catalogText)) }
    : { ok: false, json: () => Promise.resolve({}) });
  if (saved !== undefined) w.localStorage.setItem(KEY, saved);
  if (blocked) Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('Denied', 'SecurityError'); } });
  if (before) before(w);
  for (const name of run) w.eval(scripts[name]);
  const q = (s) => w.document.querySelector(s);
  const click = (s) => { const node = typeof s === 'string' ? q(s) : s; assert.ok(node, String(s)); node.click(); };
  const stored = () => JSON.parse(w.localStorage.getItem(KEY));
  return { dom, w, q, click, stored };
}
const house = (options = {}) => page('house/index.html', options.url || 'https://hakanaltun.io/house/', { ...options, run: ['keep', 'astronomy', 'weather', 'house'] });

(async () => {
  // Every instrument keeps the return destination tied to this visit's URL.
  const toolSlugs = [...read(root, '_data', 'tools.yml').matchAll(/^- slug: (\S+)/gm)].map(m => m[1]);
  for (const slug of toolSlugs) {
    const ways = {
      '': ['/tools/', '←\u200ainstruments', 'All the instruments'],
      '?from=house': ['/house/#study', '←\u200athe study', 'Back to The House study'],
      '?from=balcony&v=1': ['/house/#balcony', '←\u200athe balcony', 'Back to The House balcony'],
      '?from=drawer&v=1': ['/house/#drawer', '←\u200ayour drawer', 'Back to your drawer'],
      // The drawer, and a note on a page, send their own address with back=,
      // and the way back returns there.
      '?from=drawer&back=%2Fhouse%2F%3Fin%3Dbalcony%23drawer&v=1': ['/house/?in=balcony#drawer', '←\u200ayour drawer', 'Back to your drawer'],
      '?from=drawer&back=%2Fpieces%2Fon-lying.html%23drawer': ['/pieces/on-lying.html#drawer', '←\u200ayour drawer', 'Back to your drawer'],
      '?from=piece&back=%2Fpieces%2Fon-lying.html': ['/pieces/on-lying.html', '←\u200athe piece', 'Back to the piece'],
      '?from=word&back=%2Fword%2Fserendipity%2F': ['/word/serendipity/', '←\u200athe word', 'Back to the word'],
      '?from=quiz&back=%2Ftrivia%2Fbritain%2F': ['/trivia/britain/', '←\u200athe quiz', 'Back to the quiz'],
      '?from=book&back=%2Fpart-one%2F': ['/part-one/', '←\u200athe book', 'Back to the book'],
      '?from=read&back=%2Fread%2F%3Ffrom%3Dhouse': ['/read/?from=house', '←\u200aThe Reader', 'Back to The Reader'],
      // A page named without its address has nowhere to lead, and an address
      // on another site is never followed.
      '?from=piece': ['/tools/', '←\u200ainstruments', 'All the instruments'],
      '?from=drawer&back=%2F%2Fexample.com%2F': ['/house/#drawer', '←\u200ayour drawer', 'Back to your drawer'],
      '?from=drawer&back=https%3A%2F%2Fexample.com%2F': ['/house/#drawer', '←\u200ayour drawer', 'Back to your drawer'],
      '?from=drawer&back=%2F%5Cexample.com%2F': ['/house/#drawer', '←\u200ayour drawer', 'Back to your drawer'],
      '?from=balcony&back=%2Fpieces%2Fon-lying.html': ['/house/#balcony', '←\u200athe balcony', 'Back to The House balcony'],
      '?from=elsewhere': ['/tools/', '←\u200ainstruments', 'All the instruments'],
      '?from=constructor': ['/tools/', '←\u200ainstruments', 'All the instruments']
    };
    for (const [from, [href, words, label]] of Object.entries(ways)) {
      const p = page(slug + '/index.html', 'https://hakanaltun.io/' + slug + '/' + from);
      p.w.eval(p.q('script[data-tool-return]').textContent);
      const back = p.q('.tools-link');
      assert.equal(back.getAttribute('href'), href, slug + from);
      assert.equal(back.textContent.trim(), words);
      assert.equal(back.getAttribute('aria-label'), label);
      p.dom.window.close();
    }
  }
  // An instrument opened in the study leads back to the study, and one opened
  // on the balcony, or from its sky, back to the balcony.
  const room = new JSDOM(read(site, 'house/index.html'));
  const doc = room.window.document;
  const inside = (id) => [...doc.querySelectorAll('#' + id + ' a'), ...[].concat(...(id === 'study' ? ['house-window'] : ['house-stars', 'house-notebook']).map((t) => [...doc.getElementById(t).content.querySelectorAll('a')]))];
  let instruments = 0;
  for (const [id, from] of [['study', 'house'], ['balcony', 'balcony']]) {
    for (const link of inside(id)) {
      const url = new URL(link.getAttribute('href'), 'https://hakanaltun.io');
      if (!toolSlugs.some(slug => url.pathname === '/' + slug + '/')) continue;
      instruments++;
      assert.equal(url.searchParams.get('from'), from, url.href);
      assert.ok(url.searchParams.get('v'), 'a House visit loads the current instrument page');
    }
  }
  assert.ok(instruments >= 8, 'the study and the balcony both lead to instruments');
  // The Breath is over the view; the notebook on the table leads on to
  // The Page. The Reader and The Page are no longer places on the balcony.
  assert.ok(doc.querySelector('#balcony a[href^="/breathe/?from=balcony"]'), 'the balcony offers The Breath');
  assert.ok(doc.querySelector('#balcony .house-hotspot--notebook[data-open="notebook"]'), 'the notebook on the table');
  assert.ok(doc.getElementById('house-notebook').content.querySelector('a[data-notebook-page][href^="/write/?from=balcony"]'), 'the notebook leads on to The Page');
  assert.equal(doc.querySelectorAll('#balcony a[href^="/read/"], #balcony a[href^="/write/"]').length, 0, 'no Reader or Page on the balcony itself');
  // Every place in both rooms has its name, and nothing in the picture
  // shows until a pointer, the keyboard or "Show places to look" asks.
  for (const spot of doc.querySelectorAll('.house-scene .house-hotspot')) {
    assert.ok(spot.querySelector(':scope > .house-label > .house-hotspot-name'), 'a named place: ' + spot.className);
  }
  assert.equal(doc.querySelectorAll('[data-places]').length, 2, 'Show places to look, in each room');
  // A small thing inside a larger one, such as the lamp against the window,
  // stays above it even while the larger one is under the pointer, which
  // once kept the lamp out of reach for a pointer that crossed the window.
  const houseCss = read(root, 'css', 'house.css');
  assert.ok(houseCss.includes('.house-hotspot:hover { z-index: calc(var(--z, 1) + 1); }'), 'a place under the pointer rises one layer');
  assert.ok(houseCss.includes('.house-hotspot:focus-visible { z-index: calc(var(--z, 1) + 1);'), 'and under the keyboard');
  const layer = {};
  for (const [, selectors, z] of houseCss.matchAll(/([^{}]+)\{ --z: (\d+); \}/g)) {
    for (const name of selectors.match(/\.house-hotspot--[\w-]+/g)) layer[name.slice(16)] = +z;
  }
  const boxes = [];
  for (const [, at, name, rule] of houseCss.matchAll(/^(?:\.house-scene\[data-moris(?:-spot)?="(\w+)"\] )?\.house-hotspot--([\w-]+) \{ ([^}]*--ax: [\d.]+;[^}]*)\}$/gm)) {
    const v = (key) => +rule.match(new RegExp('--' + key + ': ([\\d.]+)'))[1];
    const spot = doc.querySelector('.house-hotspot--' + name);
    boxes.push({ name: name + (at ? ' (' + at + ')' : ''), z: layer[name] || 1, room: spot.closest('section').id, x: v('ax'), y: v('ay'), w: v('aw'), h: v('ah') });
  }
  assert.ok(boxes.length >= 20, 'the places and their sizes: ' + boxes.length);
  for (const small of boxes) {
    for (const large of boxes) {
      if (small === large || small.room !== large.room || small.w * small.h >= large.w * large.h) continue;
      if (Math.abs(small.x - large.x) < large.w / 2 && Math.abs(small.y - large.y) < large.h / 2) {
        assert.ok(small.z > large.z + 1, small.name + ' stays above ' + large.name + ' under the pointer');
      }
    }
  }
  // The door between the rooms is drawn shut and open in both of them, and
  // stands open only while Moris is out on the balcony.
  for (const id of ['#house-scene', '#house-balcony-scene']) {
    assert.ok(doc.querySelector(id + ' g.house-door-shut') && doc.querySelector(id + ' g.house-door-open'), 'the door shut and open in ' + id);
  }
  assert.ok(houseCss.includes('.house-scene[data-moris="balcony"] .house-door-shut, .house-scene:not([data-moris="balcony"]) .house-door-open { display: none; }'), 'open only while he is out');
  // The balcony's lamp has its switch on the balcony wall beside the door;
  // the globe itself is no switch.
  assert.ok(doc.querySelector('#house-balcony-scene .house-hotspot--balcony-switch[data-balcony-lamp]'), 'the switch beside the door');
  assert.equal(doc.querySelectorAll('#house-scene [data-balcony-lamp], #study .house-objects [data-balcony-lamp]').length, 0, 'no switch for it in the study');
  assert.ok(!doc.querySelector('.house-hotspot--balcony-lamp').hasAttribute('data-balcony-lamp'));
  room.window.close();

  // --- The catalog --------------------------------------------------------
  for (const key of ['words', 'questions', 'lines', 'pieces', 'notes', 'quizzes']) {
    assert.ok(catalog[key].length > 0, `catalog has ${key}`);
  }
  const ids = [].concat(...['words', 'questions', 'pieces', 'notes', 'quizzes'].map((k) => catalog[k].map((x) => x.id)));
  assert.equal(new Set(ids).size, ids.length, 'catalog ids are unique');
  assert.ok(catalog.questions.some((x) => x.id === 'trivia-britain-great-bell'), 'the first House’s Big Ben question keeps its place');
  const skipped = fs.readFileSync(path.join(root, '_data', 'unsuggested.yml'), 'utf8').match(/slug: (\S+)/g).map((s) => s.slice(6));
  const skippedTitles = catalog.pieces.filter((p) => skipped.includes(p.id.slice(6))).map((p) => p.title);
  assert.ok(catalog.lines.every((l) => l.book || !skippedTitles.includes(l.source)), 'the shelf leaves out unsuggested pieces');
  // Every word is listed, for the drawer, but only a word in a collection is
  // marked collected; the desk and the door take only those.
  const collections = fs.readFileSync(path.join(root, '_data', 'word_collections.yml'), 'utf8');
  const grouped = [].concat(...Array.from(collections.matchAll(/^\s*words: \[([^\]]*)\]/gm), (m) => m[1].split(',').map((s) => s.trim())));
  assert.ok(grouped.length > 0, 'the collections list their words');
  for (const w of catalog.words) {
    assert.equal(w.collected, grouped.includes(w.id.slice(5)), `${w.word} is marked collected only when a collection holds it`);
  }
  // Whether or not any word waits outside the collections, every word is
  // listed, so a word a reader kept is never lost from the drawer.
  const wordFiles = fs.readdirSync(path.join(root, '_words')).filter((f) => f.endsWith('.md')).map((f) => 'word-' + f.slice(0, -3));
  assert.deepEqual(catalog.words.map((w) => w.id).sort(), wordFiles.sort(), 'every word is listed for the drawer');

  // Every address the room can hand out resolves on the built site.
  const addresses = [].concat(...['words', 'questions', 'lines', 'pieces', 'notes', 'quizzes'].map((k) => catalog[k].map((x) => x.url)));
  for (const address of new Set(addresses)) {
    const url = new URL(address, 'https://hakanaltun.io');
    const file = path.join(site, url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname);
    assert.ok(fs.existsSync(file), 'Broken House address: ' + address);
    if (url.hash) assert.ok(new JSDOM(fs.readFileSync(file, 'utf8')).window.document.getElementById(decodeURIComponent(url.hash.slice(1))), 'Missing anchor: ' + address);
  }

  // --- Keeping in the room -------------------------------------------------
  let a = house();
  await tick();
  assert.equal(a.w.document.documentElement.classList.contains('house-inside'), false, 'the reader\'s own pointer at the door');
  a.click('#house-enter');
  assert.equal(a.q('#study').hidden, false);
  assert.equal(a.w.location.hash, '#study');
  assert.ok(a.w.document.documentElement.classList.contains('house-inside'), 'the gold speck in the room');
  assert.match(a.q('#house-hour').textContent, /in İstanbul$/);
  assert.ok(['sill', 'shelf', 'cushion', 'rug', 'balcony'].includes(a.q('#house-scene').dataset.moris));

  a.click('[data-open="words"]');
  assert.equal(a.q('#house-dialog').open, true);
  const cards = a.w.document.querySelectorAll('#house-dialog-content .house-word-card');
  assert.equal(cards.length, 3, 'three cards on the desk');
  const todaysWords = Array.from(cards, (c) => c.querySelector('h3').textContent);
  assert.ok(todaysWords.every((t) => catalog.words.find((w) => w.word === t).collected), 'the desk puts out only collected words');
  const firstCard = a.q('#house-dialog-content [data-keep-button]');
  const firstWord = JSON.parse(firstCard.getAttribute('data-keep-item'));
  a.click(firstCard);
  assert.equal(a.q('[data-kept-count]').textContent, '1');
  assert.equal(firstCard.getAttribute('aria-pressed'), 'true');
  assert.match(a.q('#house-dialog-status').textContent, /Kept in your drawer/);
  assert.equal(a.stored().kept[0].id, firstWord.id);
  assert.equal(a.stored().kept[0].href, catalog.words.find((w) => w.id === firstWord.id).url);
  a.click('#house-close');

  a.click('[data-open="books"]');
  const lines = a.w.document.querySelectorAll('#house-dialog-content .house-item');
  assert.equal(lines.length, 2, 'a line from the book and one from the pieces');
  assert.equal(lines[0].querySelector('.house-item-kind').textContent, 'The Fragments');
  a.click(lines[0].querySelector('[data-keep-button]'));
  a.click('#house-close');

  a.click('[data-open="drawer"]');
  const drawerText = a.q('#house-dialog-content').textContent;
  assert.match(drawerText, new RegExp(firstWord.title));
  assert.match(a.q('#house-dialog-content').textContent, /Download as text/);
  const exports = () => Array.from(a.w.document.querySelectorAll('#house-dialog-content [data-export]'), (b) => b.getAttribute('data-export'));
  assert.deepEqual(exports(), ['backup', 'restore', 'text', 'print']);
  // Opened from an iPhone's Home Screen, the house cannot print, so the
  // drawer does not offer it.
  Object.defineProperty(a.w.navigator, 'standalone', { value: true, configurable: true });
  Object.defineProperty(a.w.navigator, 'maxTouchPoints', { value: 5, configurable: true });
  a.click('#house-close');
  a.click('[data-open="drawer"]');
  assert.deepEqual(exports(), ['backup', 'restore', 'text']);
  delete a.w.navigator.standalone;
  delete a.w.navigator.maxTouchPoints;
  a.click('#house-close');
  a.click('[data-open="drawer"]');
  assert.deepEqual(exports(), ['backup', 'restore', 'text', 'print']);
  // Newest first.
  assert.equal(a.q('#house-dialog-content .house-item .house-item-kind').textContent, 'The Fragments');

  // The drawer leaves as text, with full addresses.
  let blob = null;
  a.w.URL.createObjectURL = (b) => { blob = b; return 'blob:x'; };
  a.w.URL.revokeObjectURL = () => {};
  a.w.HTMLAnchorElement.prototype.click = function () {};
  a.click('[data-export="text"]');
  const exported = await blob.text();
  assert.match(exported, /^Your drawer\nOn Life & Everything/);
  assert.match(exported, new RegExp('https://hakanaltun.io' + firstWord.href.replace(/\//g, '\\/')));
  a.dom.window.close();

  // The same room for another visit the same day.
  a = house();
  await tick();
  a.click('[data-open="words"]');
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('#house-dialog-content .house-word-card h3'), (h) => h.textContent), todaysWords);
  a.dom.window.close();

  // --- The notebook on the balcony ------------------------------------------
  // A note is written there and kept in the drawer, or taken on to The Page.
  // Until then the notebook holds it, closed or on the next visit.
  const balconyUrl = 'https://hakanaltun.io/house/#balcony';
  const notebookText = () => a.q('#house-dialog-content [data-notebook-text]');
  const write = (words) => {
    notebookText().value = words;
    notebookText().dispatchEvent(new a.w.Event('input', { bubbles: true }));
  };
  a = house({ url: balconyUrl });
  await tick();
  a.click('.house-hotspot--notebook');
  assert.equal(a.q('#house-dialog-title').textContent, 'The notebook');
  write('The ferry lights.\nWrite about the islands.');
  await wait(350);
  assert.equal(a.stored().notebook, 'The ferry lights.\nWrite about the islands.', 'the notebook holds the page as it is written');
  a.click('#house-close');
  assert.equal(a.stored().kept.length, 0, 'nothing is kept until the reader keeps it');
  const leftOpen = JSON.stringify(a.stored());
  a.dom.window.close();
  a = house({ url: balconyUrl, saved: leftOpen });
  await tick();
  a.click('#balcony .house-objects [data-open="notebook"]');
  assert.equal(notebookText().value, 'The ferry lights.\nWrite about the islands.', 'and still holds it on the next visit');
  a.click('[data-notebook-keep]');
  const fromNotebook = a.stored().kept[0];
  assert.match(fromNotebook.id, /^notebook-[a-z0-9]+$/);
  assert.equal(fromNotebook.kind, 'The notebook');
  assert.match(fromNotebook.title, /^On the balcony, \d{1,2} [A-Z][a-z]+$/);
  assert.equal(fromNotebook.note, 'The ferry lights.\nWrite about the islands.');
  assert.equal(fromNotebook.href, '/house/#balcony');
  assert.equal(a.stored().notebook, undefined, 'a kept page is no longer the notebook\'s own');
  // It says so where the reader is looking, and stays open to be changed,
  // with the drawer, a new page and Take out where Keep was.
  const notebookSaid = () => a.q('#house-dialog-content [data-notebook-said]').textContent;
  const notebookButtons = () => Array.from(a.w.document.querySelectorAll('#house-dialog-content .house-item-actions button')).filter((b) => !b.hidden).map((b) => b.textContent);
  assert.equal(notebookSaid(), 'Kept in your drawer.');
  assert.equal(a.q('#house-dialog-content [data-notebook-label]').textContent, 'Your note', 'named as a note is in the drawer');
  assert.equal(notebookText().value, 'The ferry lights.\nWrite about the islands.', 'the kept page stays in the notebook');
  assert.deepEqual(notebookButtons(), ['Open your drawer', 'A new page', 'Take out']);
  assert.equal(a.w.document.activeElement, a.q('[data-notebook-drawer]'), 'focus goes where Keep was');
  assert.equal(a.q('[data-kept-count]').textContent, '1');
  write('The ferry lights.\nWrite about the islands, and the gulls.');
  await wait(350);
  assert.equal(a.stored().kept[0].note, 'The ferry lights.\nWrite about the islands, and the gulls.', 'a change here is a change in the drawer');
  assert.equal(a.stored().notebook, undefined);
  a.click('#house-close');
  a.click('.house-hotspot--notebook');
  assert.equal(notebookText().value, 'The ferry lights.\nWrite about the islands, and the gulls.', 'opened again in the same visit, it is still that page');
  assert.deepEqual(notebookButtons(), ['Open your drawer', 'A new page', 'Take out']);
  // The drawer opens in the same box. There the note belongs to the
  // balcony, and being all note it has no card.
  a.click('[data-notebook-drawer]');
  assert.equal(a.q('#house-dialog-title').textContent, 'Your drawer');
  const keptNote = a.q('#house-dialog-content .house-item');
  assert.equal(keptNote.querySelector('.house-item-actions a').textContent, 'Go to the balcony →');
  assert.equal(keptNote.querySelector('[data-share]'), null);
  assert.equal(keptNote.querySelector('.house-note-text').textContent, 'The ferry lights.\nWrite about the islands, and the gulls.');
  a.click('#house-close');
  // Taken out, the words stay in the notebook and Keep is back.
  a.click('.house-hotspot--notebook');
  a.click('[data-notebook-out]');
  assert.equal(a.stored().kept.length, 0);
  assert.equal(a.stored().notebook, 'The ferry lights.\nWrite about the islands, and the gulls.');
  assert.equal(notebookSaid(), 'Taken out of your drawer. The page stays in the notebook.');
  assert.deepEqual(notebookButtons(), ['Keep in your drawer', 'Open your drawer']);
  assert.equal(a.q('#house-dialog-content [data-notebook-label]').textContent, 'Write a note');
  // Kept again, then a new page.
  a.click('[data-notebook-keep]');
  assert.equal(a.stored().kept.length, 1);
  // Taken out of the drawer in another tab, the kept page goes back to
  // being the notebook's own at once, and the notebook says so.
  const elsewhere = a.stored();
  elsewhere.kept = [];
  a.w.localStorage.setItem(KEY, JSON.stringify(elsewhere));
  a.q('[data-notebook-out]').focus();
  a.w.dispatchEvent(new a.w.StorageEvent('storage', { key: KEY }));
  assert.equal(notebookSaid(), 'Taken out of your drawer. The page stays in the notebook.');
  assert.deepEqual(notebookButtons(), ['Keep in your drawer', 'Open your drawer']);
  assert.equal(a.q('#house-dialog-content [data-notebook-label]').textContent, 'Write a note');
  assert.equal(a.stored().notebook, 'The ferry lights.\nWrite about the islands, and the gulls.', 'the words stay in the notebook');
  assert.equal(a.w.document.activeElement, a.q('[data-notebook-keep]'), 'focus goes where Take out was');
  a.click('[data-notebook-keep]');
  assert.equal(a.stored().kept.length, 1);
  a.click('[data-notebook-fresh]');
  assert.equal(notebookText().value, '');
  assert.equal(notebookSaid(), '');
  assert.deepEqual(notebookButtons(), ['Keep in your drawer', 'Open your drawer'], 'the drawer is open to a new page too');
  assert.equal(a.stored().kept[0].note, 'The ferry lights.\nWrite about the islands, and the gulls.', 'the kept page stays in the drawer');
  // While a new page is written, the earlier ones can be read and changed
  // in the drawer, and the way back finds the new page waiting.
  write('A second page.');
  a.click('[data-notebook-drawer]');
  assert.equal(a.q('#house-dialog-title').textContent, 'Your drawer');
  assert.equal(a.q('#house-dialog-content .house-back').textContent, '← Back to the notebook');
  a.click('#house-dialog-content [data-note^="notebook-"]');
  const earlier = a.q('#house-dialog-content .keep-note-text');
  earlier.value = 'The first page, changed.';
  earlier.dispatchEvent(new a.w.Event('input', { bubbles: true }));
  a.click('#house-dialog-content .keep-note-done');
  assert.equal(a.stored().kept[0].note, 'The first page, changed.');
  a.click('#house-dialog-content .house-back');
  assert.equal(a.q('#house-dialog-title').textContent, 'The notebook');
  assert.equal(notebookText().value, 'A second page.', 'the page being written waits');
  a.click('#house-close');
  // The drawer opened any other way has no way back to the notebook, and
  // a page's "Go to the balcony" on the balcony closes the box.
  a.click('.house-drawer-toggle');
  assert.equal(a.q('#house-dialog-content .house-back'), null);
  a.click('#house-dialog-content .house-item-actions a');
  assert.equal(a.q('#house-dialog').open, false, 'already on the balcony, the box closes');
  a.click('.house-hotspot--notebook');
  write('');
  await wait(350);
  a.click('[data-notebook-keep]');
  assert.equal(notebookSaid(), 'Write something first.');
  assert.equal(a.stored().kept.length, 1, 'an empty page is not kept');
  write('A');
  assert.equal(notebookSaid(), '', 'the warning goes once there is writing');
  write('');
  await wait(350);
  a.click('#house-close');
  // jsdom cannot open The Page, so the link goes nowhere once the House is done with it.
  a.w.document.addEventListener('click', (event) => event.preventDefault());
  // With nothing written, it is only the way to The Page.
  a.click('.house-hotspot--notebook');
  a.click('#house-dialog-content [data-notebook-page]');
  assert.equal(new URL(a.q('#house-dialog-content [data-notebook-page]').getAttribute('href'), balconyUrl).searchParams.get('at'), null);
  assert.equal(a.w.localStorage.getItem('olae-page-v1'), null, 'and The Page is left as it was');
  a.click('#house-close');
  // Taken on, the words go after whatever The Page holds, and it opens at its end.
  a.w.localStorage.setItem('olae-page-v1', JSON.stringify({ text: 'An older draft.\n\n', at: 1 }));
  a.click('.house-hotspot--notebook');
  write('This one wants to be longer.');
  const onward = a.q('#house-dialog-content [data-notebook-page]');
  a.click(onward);
  assert.equal(JSON.parse(a.w.localStorage.getItem('olae-page-v1')).text, 'An older draft.\n\nThis one wants to be longer.');
  const onwardUrl = new URL(onward.getAttribute('href'), balconyUrl);
  assert.equal(onwardUrl.pathname, '/write/');
  assert.equal(onwardUrl.searchParams.get('from'), 'balcony', 'The Page leads back to the balcony');
  assert.equal(onwardUrl.searchParams.get('at'), 'end');
  assert.ok(onwardUrl.searchParams.get('v'));
  assert.equal(a.stored().notebook, undefined, 'the words went with the reader');
  assert.equal(a.stored().kept.length, 1, 'and nothing more was kept');
  a.dom.window.close();
  // The Page opens at the end of its writing for them, and as it always has otherwise.
  for (const [query, end] of [['?from=balcony&at=end&v=1', true], ['?from=balcony&v=1', false]]) {
    const writing = new JSDOM(read(site, 'write', 'index.html'), {
      url: 'https://hakanaltun.io/write/' + query, runScripts: 'dangerously', pretendToBeVisual: true,
      beforeParse(w) { w.localStorage.setItem('olae-page-v1', JSON.stringify({ text: 'One.\n\nTwo.', at: 1 })); w.scrollTo = () => {}; }
    });
    const ta = writing.window.document.getElementById('page');
    assert.equal(ta.value, 'One.\n\nTwo.');
    assert.equal(writing.window.document.activeElement === ta, end, query);
    if (end) assert.equal(ta.selectionStart, ta.value.length, 'the caret after the last words');
    // The caret's select event is queued; let it land before the window goes.
    await tick();
    writing.window.close();
  }

  // --- The question on the wall ---------------------------------------------
  a = house();
  await tick();
  a.click('[data-open="question"]');
  const qid = a.q('[data-question]').getAttribute('data-question');
  const question = catalog.questions.find((x) => x.id === qid);
  // Lettered A to D down the wall, whatever order the choices fell in.
  const answerButtons = Array.from(a.w.document.querySelectorAll('[data-answer]'));
  assert.deepEqual(answerButtons.map((b) => b.querySelector('.house-answer-letter').textContent), ['A.', 'B.', 'C.', 'D.']);
  const wallOrder = answerButtons.map((b) => b.querySelector('.house-answer-text').textContent);
  assert.deepEqual([...wallOrder].sort(), [...question.choices].sort());
  // And the order is the day's, not the visit's: another visit today, with
  // a different roll of the dice, finds the same choice under the same letter.
  {
    const again = house();
    await tick();
    again.w.Math.random = () => 0.999;
    again.click('[data-open="question"]');
    assert.deepEqual(Array.from(again.w.document.querySelectorAll('[data-answer] .house-answer-text'), (n) => n.textContent), wallOrder);
    again.dom.window.close();
  }
  const other = a.q('[data-answer="other"]');
  a.click(other);
  assert.equal(a.q('.house-answer-note').hidden, false);
  assert.equal(a.q('.house-answer-result').textContent, 'The answer is ' + question.choices[question.answer] + '.');
  assert.equal(a.q('.house-answer-result em').textContent, question.choices[question.answer], 'the answer set apart from the line');
  assert.equal(a.stored().answered.id, qid);
  // The choice is kept by its words, not its letter, which moves with the
  // next visit's shuffle.
  assert.equal(a.stored().answered.choice, other.querySelector('.house-answer-text').textContent);
  a.click('.house-answer-note [data-keep-button]');
  assert.equal(a.stored().kept[0].id, qid);
  assert.equal(a.stored().kept[0].quote, question.note);
  a.click('#house-close');
  a.click('[data-open="question"]');
  assert.equal(a.q('.house-answer-note').hidden, false, 'still answered today');
  assert.equal(a.q('[data-result="chosen"] .house-answer-text').textContent, a.stored().answered.choice, 'and the same choice is marked');
  assert.equal(a.q('.house-answer-note [data-keep-button]').getAttribute('aria-pressed'), 'true');
  a.click('#house-close');

  // The lamp, and the window.
  const lampWas = a.q('#house-scene').dataset.lamp;
  a.click('.house-hotspot--lamp');
  assert.notEqual(a.q('#house-scene').dataset.lamp, lampWas);
  assert.equal(typeof a.stored().lamp, 'boolean');
  // A touch anywhere else in the room leaves the lamp alone.
  const lampNow = a.q('#house-scene').dataset.lamp;
  a.click('#house-scene');
  a.q('.house-room-art').dispatchEvent(new a.w.MouseEvent('click', { bubbles: true }));
  assert.equal(a.q('#house-scene').dataset.lamp, lampNow, 'the room is not the lamp');
  assert.equal(a.q('#house-scene').getAttribute('aria-pressed'), null);
  a.click('[data-open="window"]');
  assert.match(a.q('#house-dialog-content').textContent, /in İstanbul\./);
  assert.match(a.q('#house-dialog-content').textContent, /Sunset/);
  assert.match(a.q('#house-dialog-content').textContent, /% lit/);
  assert.match(a.q('#house-dialog-content').textContent, /Moon(rise|set)\d\d:\d\d/);
  for (const slug of ['stars', 'twilight']) {
    const link = a.q('#house-dialog-content a[href^="/' + slug + '/?"]');
    const url = new URL(link.href);
    assert.equal(url.searchParams.get('city'), 'istanbul', slug + ' stays in İstanbul');
    assert.equal(url.searchParams.get('from'), 'house', slug + ' returns to The House');
  }
  a.click('#house-close');
  // After dark the window names the planets that are up, from the
  // ephemeris The Stars uses, loaded only when the window is opened.
  for (const [at, planets] of [['2026-10-07T19:30:00Z', /PlanetsSaturn in the southeast/], ['2026-10-07T10:00:00Z', null]]) {
    const n = page('house/index.html', 'https://hakanaltun.io/house/');
    const NativeDate = n.w.Date;
    n.w.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : [at])); } static now() { return new NativeDate(at).getTime(); } };
    n.w.eval(read(root, 'js', 'vendor', 'astronomy-engine-2.1.19.min.js'));
    n.w.eval(read(root, 'js', 'sky-map.js'));
    for (const name of ['keep', 'astronomy', 'house']) n.w.eval(scripts[name]);
    await tick();
    n.click('[data-open="window"]');
    await tick();
    const text = n.q('#house-dialog-content').textContent;
    if (planets) assert.match(text, planets);
    else assert.doesNotMatch(text, /Planets/, 'no planets by day');
    n.dom.window.close();
  }
  // The moon's height: altitudes from PyEphem, airless, for its centre.
  // Its bearing from Astronomy Engine.
  const A = a.w.OLAE_ASTRO;
  for (const [at, altitude, azimuth] of [['2026-10-03T05:30Z', 63.59, 247.1], ['2026-10-07T20:30Z', -41.59, 15.7], ['2026-09-25T16:10Z', 9.48, 102.4]]) {
    const moon = A.moonPosition(new Date(at), 41.015, 28.979);
    assert.ok(Math.abs(A.moonAltitude(new Date(at), 41.015, 28.979) - altitude) < 0.5, 'the moon at ' + at);
    assert.ok(Math.abs(moon.azimuth - azimuth) < 0.5, 'the moon\'s bearing at ' + at);
  }
  a.click('[data-open="moris"]');
  // Moris is told, not shown: what he is doing now, and the way to his album.
  // The line from The Fragments stays under the album's cover.
  assert.equal(a.q('#house-dialog-content img, #house-dialog-content blockquote'), null);
  assert.match(a.q('[data-moris-line]').textContent, /^He /);
  assert.equal(a.q('#house-dialog-content a.house-more').getAttribute('href'), '/moris/');
  a.click('#house-close');

  // Another tab changes the drawer; this one follows.
  a.click('[data-open="drawer"]');
  a.w.localStorage.setItem(KEY, JSON.stringify({ kept: ['word-serendipity'], lamp: false }));
  a.w.dispatchEvent(new a.w.StorageEvent('storage', { key: KEY }));
  assert.match(a.q('#house-dialog-content').textContent, /serendipity/);
  assert.equal(a.q('.house-hotspot--lamp').getAttribute('aria-pressed'), 'false');
  a.dom.window.close();

  // --- Records from the first House, and records nobody should trust ------
  a = house({ saved: JSON.stringify({ kept: ['book-fragments', 'trivia-big-ben', 'word-serendipity', 'constructor', '__proto__', 'book-fragments'], lamp: true }) });
  await tick();
  assert.equal(a.q('[data-kept-count]').textContent, '3');
  assert.equal(a.q('#house-welcome').textContent, 'Welcome back.');
  a.click('[data-open="drawer"]');
  let text = a.q('#house-dialog-content').textContent;
  assert.match(text, /First there was Symmetry/);
  assert.match(text, /cracked within a few months/, 'the Big Ben note is read fresh from the bank');
  assert.match(text, /Horace Walpole/, 'the word is read fresh from its story');
  const hrefs = Array.from(a.w.document.querySelectorAll('#house-dialog-content .house-item-actions a'), (l) => l.getAttribute('href'));
  assert.deepEqual(hrefs.sort(), ['/book/part-one/#point-zero', '/trivia/britain/', '/word/serendipity/']);
  a.click('[data-remove="' + a.stored().kept[0].id + '"]');
  assert.equal(a.stored().kept.length, 2);
  assert.equal(a.w.document.activeElement.getAttribute('data-remove') !== null, true, 'focus moves to the next Remove');
  a.dom.window.close();

  const kept = [
    { id: 'word-long-gone', kind: 'A word', title: 'gone', quote: 'A word the site no longer has.', href: '/word/long-gone/' },
    { id: 'text-abc', kind: 'An essay', title: 'Script', quote: 'x', href: 'javascript:alert(1)' },
    { id: 'text-def', kind: 'An essay', title: 'Elsewhere', quote: 'y', href: '//evil.example/' },
    { id: 'Bad Id', title: 'no' },
    { id: 'text-ghi' }
  ];
  a = house({ saved: JSON.stringify({ v: 2, kept, lamp: 'on', balconyLamp: 'on', seen: 'x', answered: 5 }) });
  await tick();
  assert.equal(a.q('[data-kept-count]').textContent, '3');
  assert.equal(a.stored().balconyLamp, null, 'a lamp is on or off, nothing else');
  a.click('[data-open="drawer"]');
  text = a.q('#house-dialog-content').textContent;
  assert.match(text, /A word the site no longer has/, 'a thing whose page has gone stays in the drawer');
  for (const link of a.w.document.querySelectorAll('#house-dialog-content a')) {
    assert.ok(/^\/(?!\/)/.test(link.getAttribute('href')), 'drawer links stay on the site: ' + link.getAttribute('href'));
  }
  a.dom.window.close();
  for (const bad of ['{bad', 'null', '42', '[]']) {
    a = house({ saved: bad });
    await tick();
    assert.equal(a.q('[data-kept-count]').textContent, '0');
    a.dom.window.close();
  }

  // --- Storage that cannot be reached ------------------------------------------
  a = house({ blocked: true });
  await tick();
  a.click('[data-open="words"]');
  a.click('#house-dialog-content [data-keep-button]');
  assert.equal(a.q('[data-kept-count]').textContent, '1', 'kept for this visit');
  assert.match(a.q('#house-dialog-status').textContent, /stays only until you leave/);
  a.click('#house-close');
  a.click('[data-open="drawer"]');
  assert.match(a.q('#house-dialog-content').textContent, /cannot save/);
  // What is here for this visit can still leave as a backup, but a browser
  // that cannot keep the drawer is not offered a restore it cannot finish.
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('#house-dialog-content [data-export]'), (b) => b.getAttribute('data-export')), ['backup', 'text', 'print']);
  a.click('#house-close');
  a.click('#study [data-places]');
  assert.ok(a.q('#house').classList.contains('show-places'), 'the places show for this visit');
  a.dom.window.close();

  // --- Since the last visit --------------------------------------------------
  const allIds = [].concat(...['pieces', 'words', 'notes', 'quizzes'].map((k) => catalog[k].map((x) => x.id)));
  // A word waiting for a collection is unknown too, and is not announced.
  // Every word may have a collection, so one is set aside here.
  const waiting = JSON.parse(catalogText);
  const waitingWord = waiting.words.find((w) => w.collected);
  waitingWord.collected = false;
  const newWord = waiting.words.filter((w) => w.collected).pop();
  const newPiece = catalog.pieces[0];
  const known = allIds.filter((id) => id !== newWord.id && id !== newPiece.id && id !== waitingWord.id);
  a = house({ saved: JSON.stringify({ kept: [], seen: { day: '2000-01-01', known, fresh: [] } }), catalog: waiting });
  await tick();
  assert.equal(a.q('#house-since').hidden, false);
  assert.match(a.q('#house-since').textContent, new RegExp(newWord.word));
  assert.match(a.q('#house-since').textContent, new RegExp(newPiece.title));
  assert.equal(a.q('#house-since-list').children.length, 2);
  assert.equal(a.q('#house-welcome').textContent, 'Welcome back.');
  const after = a.w.localStorage.getItem(KEY);
  a.dom.window.close();
  a = house({ saved: after });
  await tick();
  assert.equal(a.q('#house-since-list').children.length, 2, 'the note stays for the rest of the day');
  a.dom.window.close();
  a = house();
  await tick();
  assert.equal(a.q('#house-since').hidden, true, 'a first visit has nothing to report');
  assert.equal(a.q('#house-welcome').textContent, 'Come in.');
  a.dom.window.close();

  // --- The sky in the window and over the balcony ---------------------------
  // İstanbul's sun and moon at a given moment, as the page sees them.
  const houseAt = (when, url = 'https://hakanaltun.io/house/#study', sky = false, before) => {
    const n = page('house/index.html', url, { before });
    const NativeDate = n.w.Date;
    n.w.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : [when])); } static now() { return new NativeDate(when).getTime(); } };
    if (sky) for (const file of [['vendor', 'astronomy-engine-2.1.19.min.js'], ['bright-stars.js'], ['sky-map.js']]) n.w.eval(read(root, 'js', ...file));
    for (const name of ['keep', 'astronomy', 'house']) n.w.eval(scripts[name]);
    return n;
  };
  const shown = (n, s) => !n.q(s).hidden;
  // Rain and snow fall as a few paths by depth, one drop to each move.
  const drops = (n, s) => [...n.w.document.querySelectorAll(s)].reduce((sum, path) => sum + (path.getAttribute('d').match(/M/g) || []).length, 0);
  const spot = (n, s) => ({ x: +n.q(s).getAttribute('cx'), y: +n.q(s).getAttribute('cy') });
  const words = (n) => n.q('#house-dialog-content').textContent.replace(/\s+/g, ' ').trim();
  const dialogLinks = (n) => Array.from(n.w.document.querySelectorAll('#house-dialog-content a'), (l) => l.getAttribute('href'));

  // A morning in October: the sun is low in the southeast, to the left over
  // the balcony and, in the window, just where it stands there, so out of
  // the window's sight to the left. The
  // moon, a day from new, is lost in its light. Moris is on his cushion, the
  // door to the balcony is shut and its glass is folded away.
  let n = houseAt('2026-10-11T10:00:00+03:00');
  await tick();
  assert.equal(n.q('#house-scene').dataset.sun, 'in');
  assert.ok(spot(n, '#house-scene .house-sun').x < 560, 'beyond the window on the left while the sun is in the southeast');
  assert.equal(n.q('#house-scene').dataset.moon, undefined, 'a moon lost in the sun is not drawn');
  assert.equal(n.q('#house-scene').dataset.moris, 'cushion');
  assert.equal(n.q('#balcony').hidden, true);
  // The places are quiet until asked for, in both rooms at once.
  assert.equal(n.q('#house-balcony-scene').dataset.balconyLamp, 'off', 'the balcony lamp is off by day');
  n.click('#study [data-places]');
  assert.ok(n.q('#house').classList.contains('show-places'));
  assert.equal(n.w.localStorage.getItem('olae-places'), 'shown', 'the browser remembers it');
  for (const button of n.w.document.querySelectorAll('[data-places]')) {
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(button.textContent, 'Hide places to look');
  }
  n.click('.house-hotspot--balcony');
  assert.equal(n.w.location.hash, '#balcony');
  assert.equal(n.q('#balcony').hidden, false, 'out through the door');
  assert.equal(n.q('#study').hidden, true);
  assert.equal(n.q('#house-entrance').hidden, true);
  assert.ok(n.w.document.documentElement.classList.contains('house-inside'), 'and on the balcony');
  assert.equal(n.w.document.activeElement, n.q('#house-balcony-title'));
  assert.equal(n.q('#balcony [data-house-hour]').textContent, 'Morning in İstanbul');
  assert.equal(n.q('#balcony [data-house-clock]').textContent, '10:00');
  assert.equal(n.q('#balcony .house-time').textContent.replace(/\s+/g, ' ').trim(), 'Morning in İstanbul · 10:00', 'no temperature before a report');
  n.click('#balcony [data-places]');
  assert.equal(n.q('#house').classList.contains('show-places'), false, 'and quiet again');
  assert.equal(n.w.localStorage.getItem('olae-places'), null, 'until it is asked for again');
  const scene = n.q('#house-balcony-scene');
  assert.equal(scene.dataset.moris, 'cushion', 'the glass folded away while Moris is inside');
  assert.equal(n.q('#balcony [data-moris-item]').hidden, true);
  assert.equal(scene.dataset.sun, 'in');
  assert.ok(shown(n, '.house-hotspot--sun'));
  assert.ok(spot(n, '#house-balcony-scene .house-sun').x < 500 && spot(n, '#house-balcony-scene .house-sun').y < 285, 'the sun to the left, above the sea');
  assert.equal(n.q('.house-hotspot--sun').getAttribute('href'), '/pictures/sun/?from=balcony', 'the sun leads to its picture');
  assert.ok(!shown(n, '.house-hotspot--moon') && !shown(n, '.house-hotspot--stars'));
  assert.equal(n.q('.house-hotspot--window-sun'), null, 'no picture travel from the study window');
  assert.equal(n.q('.house-hotspot--window-moon'), null);
  assert.equal(n.q('#house-window').content.querySelector('a[href^="/pictures/"]'), null);
  let said;
  for (const selector of ['.house-hotspot--sun', '#balcony [data-sky-item="sun"] a']) {
    const link = n.q(selector);
    assert.equal(link.tagName, 'A');
    assert.equal(link.hasAttribute('data-open'), false);
    link.addEventListener('click', event => event.preventDefault(), { once: true });
    n.click(link);
    assert.equal(n.q('#house-dialog').open, false, 'sky links do not open a dialog');
  }
  // The weather goes out with the reader, and comes back in.
  n.w.matchMedia = () => ({ matches: false });
  n.w.eval(scripts.snow);
  n.w.document.dispatchEvent(new n.w.Event('DOMContentLoaded'));
  n.click('#let-it-rain');
  assert.equal(scene.dataset.weather, 'rain');
  assert.equal(n.q('#house-scene').dataset.weather, 'rain', 'the same sky from the window');
  assert.equal(n.w.document.querySelectorAll('#house-balcony-scene .house-weather .house-rain').length, 6, 'rain in six layers by depth');
  assert.equal(drops(n, '#house-balcony-scene .house-weather .house-rain'), 170, 'rain over the city, twice the window\'s');
  assert.equal(n.w.document.querySelectorAll('#house-scene .house-weather *').length, 0);
  assert.equal(n.q('#house-status').textContent, 'Light rain over the city.');
  n.click('.house-hotspot--study-door');
  assert.equal(n.w.location.hash, '#study');
  assert.equal(n.q('#study').hidden, false, 'back in through the door');
  assert.equal(n.q('#balcony').hidden, true);
  assert.equal(drops(n, '#house-scene .house-weather .house-rain'), 85, 'the rain at the study window again');
  assert.equal(n.w.document.querySelectorAll('#house-balcony-scene .house-weather *').length, 0);
  n.dom.window.close();

  // The clocks turn over together, on the minute: the wall clock's hands
  // and the time in both rooms' bars, whenever the page was opened.
  {
    let now = Date.parse('2026-10-11T10:00:45+03:00');
    const minutes = [];
    const c = page('house/index.html', 'https://hakanaltun.io/house/#study', {
      before(w) {
        const NativeDate = w.Date;
        w.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } };
        const later = w.setTimeout;
        w.setTimeout = (fn, ms, ...rest) => ms > 1000 ? (minutes.push([fn, ms]), 0) : later(fn, ms, ...rest);
      }
    });
    for (const name of ['keep', 'astronomy', 'house']) c.w.eval(scripts[name]);
    await tick();
    const hands = () => c.q('.house-clock-minute').getAttribute('transform');
    assert.equal(c.q('#house-clock').textContent, '10:00');
    assert.equal(hands(), 'rotate(0 450 146)');
    assert.equal(minutes.length, 1);
    assert.equal(minutes[0][1], 15050, 'the next turn waits for the minute');
    now = Date.parse('2026-10-11T10:01:00.050+03:00');
    minutes[0][0]();
    assert.equal(c.q('#house-clock').textContent, '10:01', 'the time in the bar turns with the hands');
    assert.equal(c.q('#balcony [data-house-clock]').textContent, '10:01');
    assert.equal(hands(), 'rotate(6 450 146)');
    assert.equal(minutes.length, 2);
    c.dom.window.close();
  }

  // Opened from the list under a room on a phone, which a screen reader does
  // not see, a box gives the focus back to the same place in the picture.
  for (const [url, room, name] of [['https://hakanaltun.io/house/#study', '#study', 'books'], ['https://hakanaltun.io/house/#balcony', '#balcony', 'notebook']]) {
    const f = house({ url });
    await tick();
    f.click(room + ' .house-objects [data-open="' + name + '"]');
    assert.equal(f.q('#house-dialog').open, true);
    f.click('#house-close');
    assert.equal(f.w.document.activeElement, f.q(room + ' .house-hotspot[data-open="' + name + '"]'), 'focus back on the picture, not in the hidden list: ' + name);
    f.click(room + ' .house-hotspot[data-open="' + name + '"]');
    f.click('#house-close');
    assert.equal(f.w.document.activeElement, f.q(room + ' .house-hotspot[data-open="' + name + '"]'), 'and from the picture, back where it was');
    f.dom.window.close();
  }

  // Moris goes out to the balcony twice a day, and its glass is shut and its
  // door open while he is there: from noon to two, asleep on the empty
  // chair, and from two hours before sunset (18:31 that day) until half an
  // hour before it, lying by the glass. Between them he is on his cushion,
  // the door is shut, and as the sun goes down he is asleep at the window.
  for (const [hour, place, spot, line] of [['13:00', 'balcony', 'chair', /^He is asleep on a chair out on the balcony for the middle of the day\.$/], ['14:30', 'cushion', undefined, null], ['17:00', 'balcony', 'glass', /^He is out on the balcony again until the sun is low, lying by the glass and looking out\.$/], ['18:10', 'sill', undefined, null]]) {
    n = houseAt('2026-10-11T' + hour + ':00+03:00', 'https://hakanaltun.io/house/#balcony');
    await tick();
    assert.equal(n.q('#house-scene').dataset.moris, place, 'Moris at ' + hour);
    assert.equal(n.q('#house-balcony-scene').dataset.moris, place, 'the glass closed and the door open only while he is out there');
    assert.equal(n.q('#house-balcony-scene').dataset.morisSpot, spot, 'on the chair at midday and by the glass later');
    if (spot) assert.equal(n.q('#house-balcony-scene .house-moris').getAttribute('transform'), spot === 'chair' ? 'translate(-15.2 129.9) scale(.76)' : 'translate(1012.7 29.3) scale(-.735 .735)');
    assert.equal(n.q('#balcony [data-moris-item]').hidden, place !== 'balcony');
    assert.equal(n.q('#study .house-objects [data-open="moris"]').parentNode.hidden, place === 'balcony', 'not in the study meanwhile');
    if (line) {
      n.click('.house-hotspot--balcony-moris');
      assert.equal(n.q('#house-dialog-place').textContent, 'On the balcony');
      assert.match(n.q('[data-moris-line]').textContent, line);
      n.click('#house-close');
    }
    n.dom.window.close();
  }

  // While Moris is out the glass is closed: the sun says where it stands
  // and why the way on is shut, and leads nowhere until he goes back in.
  n = houseAt('2026-10-12T12:30:00+03:00', 'https://hakanaltun.io/house/#balcony', true);
  await tick();
  assert.equal(n.q('#house-balcony-scene').dataset.moris, 'balcony', 'Moris out at midday');
  assert.ok(shown(n, '.house-hotspot--sun'));
  for (const selector of ['.house-hotspot--sun', '#balcony [data-sky-item="sun"] a']) {
    const link = n.q(selector);
    assert.equal(link.getAttribute('aria-haspopup'), 'dialog');
    n.click(link);
    assert.equal(n.q('#house-dialog').open, true, 'the closed glass opens a box instead of the picture');
    assert.match(n.q('#house-dialog-content').textContent, /The glass is closed while Moris is out here/);
    n.click('#house-close');
  }
  n.dom.window.close();

  // A night with a young moon: no sun, the moon low in the southwest, in the
  // window where it stands over the balcony, and the
  // stars, the brightest of them, drawn from the catalogue The Stars uses.
  n = houseAt('2026-10-16T21:00:00+03:00', 'https://hakanaltun.io/house/#balcony', true);
  await tick();
  assert.equal(n.q('#balcony').hidden, false, 'the balcony by its address');
  assert.equal(n.q('#house-scene').dataset.moon, 'up');
  const windowMoon = spot(n, '#house-scene .house-moon-disc'), balconyMoon = spot(n, '#house-balcony-scene .house-moon-disc');
  assert.ok(windowMoon.x > 560 && windowMoon.x < 826, 'in the window while the moon is in the southwest');
  assert.equal(windowMoon.x, balconyMoon.x, 'over the same place in both rooms');
  assert.equal(Math.round((balconyMoon.y - windowMoon.y) * 10) / 10, 63, 'the window\'s horizon 63 above the balcony\'s');
  assert.equal(n.q('#house-balcony-scene').dataset.sun, 'down');
  assert.ok(!shown(n, '.house-hotspot--sun'));
  assert.ok(shown(n, '.house-hotspot--moon') && shown(n, '.house-hotspot--stars'));
  assert.ok(spot(n, '#house-balcony-scene .house-moon-disc').x > 500, 'the moon to the right');
  assert.equal(n.q('.house-hotspot--moon').getAttribute('href'), '/pictures/space/?from=balcony#scene-moon', 'the moon leads to the Moon on the journey');
  await tick();
  const stars = n.w.document.querySelectorAll('#house-balcony-scene .house-sky-stars circle');
  assert.ok(stars.length >= 3 && stars.length < 40, 'a few bright stars and planets: ' + stars.length);
  assert.ok(n.q('#house-balcony-scene .house-sky-stars .is-planet'), 'Saturn among them');
  for (const selector of ['.house-hotspot--moon', '#balcony [data-sky-item="moon"] a']) {
    const link = n.q(selector);
    assert.equal(link.tagName, 'A');
    link.addEventListener('click', event => event.preventDefault(), { once: true });
    n.click(link);
    assert.equal(n.q('#house-dialog').open, false);
  }
  n.click('.house-hotspot--stars');
  await tick();
  said = words(n);
  assert.match(said, /PlanetsSaturn in the southeast/);
  assert.match(said, /Bright stars[A-Z]/);
  assert.match(said, /Sunrise07:\d\d/);
  assert.deepEqual(dialogLinks(n), ['/stars/?city=istanbul&from=balcony&v=20261011-1', '/moon/?from=balcony&v=20261011-1']);
  n.click('#house-close');
  // The balcony's lamp is on after dark until the reader puts it out, and
  // the drawer's record remembers which they chose.
  assert.equal(n.q('#house-balcony-scene').dataset.balconyLamp, 'on');
  assert.equal(n.q('.house-hotspot--balcony-switch').getAttribute('aria-pressed'), 'true');
  // A hand on the globe only makes it flicker, and keeps nothing.
  n.click('.house-hotspot--balcony-lamp');
  assert.equal(n.q('#house-balcony-scene').dataset.balconyLamp, 'off', 'the light goes for a moment');
  assert.equal(n.q('#house-status').textContent, 'The lamp flickers. Its switch is on the wall by the door.');
  await wait(400);
  assert.equal(n.q('#house-balcony-scene').dataset.balconyLamp, 'on', 'and comes back within a second');
  assert.equal(n.q('#house-balcony-scene').dataset.flicker, undefined);
  assert.equal(n.stored().balconyLamp, null, 'the globe is no switch');
  // Its switch is on the wall beside the door.
  n.click('.house-hotspot--balcony-switch');
  assert.equal(n.q('#house-balcony-scene').dataset.balconyLamp, 'off');
  assert.equal(n.stored().balconyLamp, false);
  assert.equal(n.q('#house-status').textContent, 'The balcony lamp is off.');
  for (const button of n.w.document.querySelectorAll('button[data-balcony-lamp]')) assert.equal(button.getAttribute('aria-pressed'), 'false');
  assert.equal(n.q('#house-scene').dataset.lamp, 'on', 'the study lamp is its own');
  assert.equal(n.q('#house-scene').dataset.balconyLamp, 'off', 'the study sees it through the door');
  // An unlit globe stays dark under a hand.
  n.click('.house-hotspot--balcony-lamp');
  assert.equal(n.q('#house-balcony-scene').dataset.balconyLamp, 'off', 'no flicker while the lamp is off');
  assert.equal(n.q('#house-balcony-scene').dataset.flicker, undefined);
  assert.equal(n.q('#house-status').textContent, 'Its switch is on the wall by the door.');
  await wait(400);
  assert.equal(n.q('#house-balcony-scene').dataset.balconyLamp, 'off');
  assert.equal(n.stored().balconyLamp, false);
  n.click('.house-hotspot--balcony-switch');
  assert.equal(n.q('#house-balcony-scene').dataset.balconyLamp, 'on');
  assert.equal(n.q('#house-scene').dataset.balconyLamp, 'on');
  assert.equal(n.stored().balconyLamp, true);
  assert.equal(n.q('#house-status').textContent, 'The balcony lamp is on.');
  n.dom.window.close();
  // The names stay shown until the reader hides them, after The Page or on
  // another visit.
  n = houseAt('2026-10-16T21:00:00+03:00', 'https://hakanaltun.io/house/#balcony', false, (w) => w.localStorage.setItem('olae-places', 'shown'));
  await tick();
  assert.ok(n.q('#house').classList.contains('show-places'));
  assert.equal(n.q('#balcony [data-places]').getAttribute('aria-pressed'), 'true');
  assert.equal(n.q('#balcony [data-places]').textContent, 'Hide places to look');
  n.dom.window.close();

  // A summer's early morning: the sun is up but still behind the house, in
  // the northeast. The window has no sun in it; on the balcony its name waits
  // at the left edge of the view.
  n = houseAt('2026-06-21T06:30:00+03:00', 'https://hakanaltun.io/house/#balcony');
  await tick();
  assert.equal(n.q('#house-scene').dataset.sun, 'behind');
  assert.equal(n.q('#house-balcony-scene').dataset.sun, 'behind');
  assert.ok(shown(n, '.house-hotspot--sun'));
  assert.equal(n.q('.house-hotspot--sun').dataset.side, 'edge-right');
  assert.equal(n.q('.house-hotspot--sun').getAttribute('href'), '/pictures/sun/?from=balcony');
  n.dom.window.close();

  // A picture opened from the balcony leads back there.
  for (const [file, address] of [['pictures/sun/index.html', 'https://hakanaltun.io/pictures/sun/?from=balcony'], ['pictures/space/index.html', 'https://hakanaltun.io/pictures/space/?from=balcony#scene-moon'], ['pictures/sun/index.html', 'https://hakanaltun.io/pictures/sun/?from=house'], ['pictures/space/index.html', 'https://hakanaltun.io/pictures/space/?from=house#scene-moon'], ['pictures/sun/index.html', 'https://hakanaltun.io/pictures/sun/']]) {
    const pic = page(file, address);
    pic.w.eval(read(root, 'js', 'pictures.js'));
    const way = pic.q('.picture-footer a');
    const balconyWay = address.includes('from=balcony');
    assert.equal(way.getAttribute('href'), balconyWay ? '/house/#balcony' : address.includes('from=house') ? '/house/#study' : '/pictures/');
    assert.equal(way.textContent, balconyWay ? '← the balcony' : address.includes('from=house') ? '← the study' : '← Pictures with Stories');
    pic.dom.window.close();
  }
  // The Farm House, entered from the study's shelf, leads back to the study.
  assert.match(read(site, 'farm-house', 'index.html'), /<a href="\/house\/#study">← the study<\/a>/);

  // --- The drawer by its address -------------------------------------------------
  a = house({ url: 'https://hakanaltun.io/house/#drawer' });
  await tick();
  assert.equal(a.q('#study').hidden, false);
  assert.equal(a.q('#house-dialog').open, true);
  assert.equal(a.q('#house-dialog-title').textContent, 'Your drawer');
  // An empty drawer offers only what can be done with it: bringing one in.
  assert.deepEqual(Array.from(a.w.document.querySelectorAll('#house-dialog-content [data-export]'), (b) => b.getAttribute('data-export')), ['restore']);
  assert.match(a.q('#house-dialog-content').textContent, /Nothing here yet[\s\S]*restore it here/);
  a.click('#house-close');
  assert.equal(a.w.location.hash, '#study');
  a.dom.window.close();
  // The drawer's address names the room it was open over, and its own way
  // back, so the way back to it from The Page finds it as it was.
  a = house({ url: 'https://hakanaltun.io/house/?in=balcony#drawer' });
  await tick();
  assert.equal(a.q('#balcony').hidden, false, 'the drawer opens over the balcony it was open over');
  assert.equal(a.q('#study').hidden, true);
  assert.equal(a.q('#house-dialog').open, true);
  assert.equal(a.q('#house-dialog-content .house-back'), null, 'opened from the menu, it has no way back but its close');
  a.click('#house-close');
  assert.equal(a.w.location.pathname + a.w.location.search + a.w.location.hash, '/house/#balcony', 'closed, it leaves the reader on the balcony');
  a.dom.window.close();
  a = house({ url: 'https://hakanaltun.io/house/?in=balcony&from=notebook#drawer' });
  await tick();
  assert.equal(a.q('#balcony').hidden, false);
  assert.equal(a.q('#house-dialog-content .house-back').textContent, '← Back to the notebook', 'opened from the notebook, it leads back to it');
  a.click('#house-dialog-content .house-back');
  assert.equal(a.q('#house-dialog-title').textContent, 'The notebook');
  a.dom.window.close();
  a = house({ url: 'https://hakanaltun.io/house/?in=door#drawer' });
  await tick();
  assert.equal(a.q('#house-entrance').hidden, false, 'over the door, at the door');
  a.click('#house-close');
  assert.equal(a.w.location.pathname + a.w.location.search + a.w.location.hash, '/house/');
  a.dom.window.close();
  // From an instrument the way back keeps the instrument's own way back.
  a = house({ url: 'https://hakanaltun.io/house/?from=write&back=%2Fwrite%2F%3Ffrom%3Dbalcony#drawer' });
  await tick();
  assert.equal(a.q('#house-dialog-content .house-back').textContent, '← Back to The Page');
  assert.equal(a.q('#house-dialog-content .house-back').getAttribute('href'), '/write/?from=balcony');
  a.dom.window.close();
  a = house({ url: 'https://hakanaltun.io/house/?from=write#drawer' });
  await tick();
  assert.equal(a.q('#house-dialog-content .house-back').getAttribute('href'), '/write/', 'without back=, to the instrument itself');
  a.dom.window.close();
  a = house({ url: 'https://hakanaltun.io/house/?from=piece&back=%2Fpieces%2Fon-lying.html#drawer' });
  await tick();
  assert.equal(a.q('#house-dialog-content .house-back').textContent, '← Back to the piece');
  assert.equal(a.q('#house-dialog-content .house-back').getAttribute('href'), '/pieces/on-lying.html');
  a.dom.window.close();
  a = house({ url: 'https://hakanaltun.io/house/?from=piece&back=%2F%2Fexample.com%2F#drawer' });
  await tick();
  assert.equal(a.q('#house-dialog-content .house-back'), null, 'an address on another site is never followed');
  a.dom.window.close();

  // --- Keeping from the rest of the site ------------------------------------------
  const word = catalog.words.find((w) => w.id === 'word-serendipity');
  let p = page('word/serendipity/index.html', 'https://hakanaltun.io/word/serendipity/', { run: ['keep'] });
  const wordButton = p.q('[data-keep-button]');
  assert.equal(wordButton.textContent, 'Keep this word');
  p.click(wordButton);
  assert.equal(p.stored().kept[0].id, 'word-serendipity');
  assert.equal(p.stored().kept[0].quote, word.description);
  assert.equal(wordButton.getAttribute('aria-pressed'), 'true');
  assert.equal(p.q('.keep-toast a').getAttribute('href'), '/house/?from=word&back=%2Fword%2Fserendipity%2F#drawer', 'without the site\'s menu, the drawer in The House leads back to the word');
  assert.ok(p.q('.keep-toast a').hasAttribute('data-open-drawer'), 'with it, the drawer opens over the page');
  p.dom.window.close();

  p = page('trivia/britain/index.html', 'https://hakanaltun.io/trivia/britain/', { run: ['keep', 'trivia'] });
  p.click('#trivia-start');
  assert.equal(p.q('#trivia-keep').hidden, true, 'nothing to keep before an answer');
  p.click('.trivia-choice');
  assert.equal(p.q('#trivia-keep').hidden, false);
  p.click('#trivia-keep');
  const fromQuiz = p.stored().kept[0];
  const bankQuestion = catalog.questions.find((x) => x.id === fromQuiz.id);
  assert.ok(bankQuestion, 'the quiz keeps a question by the id the House knows');
  assert.equal(fromQuiz.quote, bankQuestion.note);
  assert.equal(fromQuiz.kind, 'British Culture');
  p.click('#trivia-next');
  assert.equal(p.q('#trivia-keep').hidden, true);
  p.dom.window.close();

  // A word's story and a quiz's questions and notes have a piece's prompt:
  // Türkçe, Keep, Note and Highlight. The author asked for it on 12 October 2026.
  const promptButtons = () => Array.from(p.w.document.querySelectorAll('.reader-translate button:not(.reader-translate-close)'), (b) => b.textContent);
  p = page('word/quarantine/index.html', 'https://hakanaltun.io/word/quarantine/', { run: ['keep', 'translate'], before: highlights });
  await tick();
  assert.deepEqual(promptButtons(), ['Türkçe', 'Keep', 'Note', 'Highlight'], 'a word story has the prompt');
  assert.equal(p.q('.keep-prompt'), null, 'and no second prompt of its own');
  const cited = Array.from(p.w.document.querySelectorAll('.word-story-body p')).find((el) => el.querySelector('.word-cite'));
  let storyRange = p.w.document.createRange();
  storyRange.selectNodeContents(cited);
  const fromStory = p.w.OLAE_KEEP.passageFor(storyRange);
  assert.equal(fromStory.kind, 'Words with Stories');
  assert.equal(fromStory.title, 'quarantine');
  assert.equal(fromStory.href, '/word/quarantine/');
  const uncited = cited.cloneNode(true);
  uncited.querySelectorAll('.word-cite').forEach((cite) => cite.remove());
  assert.equal(fromStory.quote, uncited.textContent.replace(/\u2060/g, '').replace(/\s+/g, ' ').trim(), 'the source numbers are left out of what is kept');
  p.w.OLAE_KEEP.highlight(fromStory);
  assert.deepEqual(marked(p.w), [fromStory.quote], 'and the highlight is found without them');
  p.dom.window.close();

  p = page('trivia/britain/index.html', 'https://hakanaltun.io/trivia/britain/', { run: ['keep', 'trivia', 'translate'], before: highlights });
  await tick();
  assert.deepEqual(promptButtons(), ['Türkçe', 'Keep', 'Note', 'Highlight'], 'a quiz has the prompt');
  p.click('#trivia-start');
  p.click('.trivia-choice');
  const answered = p.q('#trivia-question-text').textContent.replace(/\u2060/g, '');
  const noteRange = p.w.document.createRange();
  noteRange.selectNodeContents(p.q('#trivia-feedback'));
  const fromNote = p.w.OLAE_KEEP.passageFor(noteRange);
  assert.equal(fromNote.kind, 'British Culture');
  assert.equal(fromNote.title, answered, 'a passage from a note is named by its question');
  assert.equal(fromNote.href, '/trivia/britain/');
  p.dom.window.close();

  p = page('book/part-one/index.html', 'https://hakanaltun.io/book/part-one/', { run: ['keep'] });
  await tick();
  const opening = Array.from(p.w.document.querySelectorAll('#point-zero ~ p')).find((el) => el.textContent.includes('memory needs an after'));
  let range = p.w.document.createRange();
  range.selectNodeContents(opening);
  const passage = p.w.OLAE_KEEP.passageFor(range);
  assert.equal(passage.title, 'Point Zero');
  assert.equal(passage.kind, 'The Fragments');
  assert.equal(passage.href, '/book/part-one/#point-zero');
  assert.match(passage.quote, /memory needs an after/);
  assert.ok(p.q('.keep-prompt'), 'the book pages bring their own prompt');
  assert.deepEqual(Array.from(p.w.document.querySelectorAll('.keep-prompt button'), (b) => b.textContent), ['Keep this passage', 'Add a note'], 'with a note beside Keep');
  p.w.OLAE_KEEP.keepPassage(passage);
  assert.equal(p.stored().kept[0].href, '/book/part-one/#point-zero');
  p.dom.window.close();

  // The shelf's line and the same words selected in the book are one thing.
  const bookLine = catalog.lines.find((l) => l.book && l.source === 'Point Zero');
  p = page('book/part-one/index.html', 'https://hakanaltun.io/book/part-one/', { run: ['keep'] });
  const shelfId = p.w.OLAE_KEEP.textId(bookLine.text);
  const para = Array.from(p.w.document.querySelectorAll('#point-zero ~ p')).find((el) => el.textContent.includes(bookLine.text));
  range = p.w.document.createRange();
  const node = para.firstChild;
  const at = node.textContent.indexOf(bookLine.text);
  range.setStart(node, at);
  range.setEnd(node, at + bookLine.text.length);
  assert.equal(p.w.OLAE_KEEP.passageFor(range).id, shelfId);
  p.dom.window.close();

  // The build joins a closed-up dash to the word before it. A passage kept
  // from that page has the id and words it had before, with a plain dash.
  p = page('book/part-one/index.html', 'https://hakanaltun.io/book/part-one/', { run: ['keep'] });
  const dashed = Array.from(p.w.document.querySelectorAll('.book-chapter p')).find((el) => {
    const words = el.textContent.replace(/\s+/g, ' ').trim();
    return words.includes('\u2060\u2014') && words.length <= 700;
  });
  assert.ok(dashed, 'the book has a paragraph with a joined dash');
  range = p.w.document.createRange();
  range.selectNodeContents(dashed);
  const plainWords = dashed.textContent.replace(/\u2060/g, '').replace(/\s+/g, ' ').trim();
  let fnv = 0x811c9dc5;
  for (const ch of plainWords.toLowerCase()) { fnv ^= ch.charCodeAt(0); fnv = Math.imul(fnv, 0x01000193) >>> 0; }
  const dashedPassage = p.w.OLAE_KEEP.passageFor(range);
  assert.equal(dashedPassage.id, 'text-' + fnv.toString(36), 'the joiner does not change a passage\'s id');
  assert.equal(dashedPassage.quote, plainWords, 'the drawer keeps the plain dash');
  p.dom.window.close();

  const essay = catalog.pieces.find((x) => x.id === 'piece-on-lying');
  p = page(essay.url.slice(1), 'https://hakanaltun.io' + essay.url, { run: ['keep', 'translate'] });
  await tick();
  const keepInPrompt = p.q('.reader-translate .reader-translate-keep');
  assert.ok(keepInPrompt, 'the translation prompt carries Keep on an essay');
  assert.equal(p.q('.keep-prompt'), null, 'and no second prompt');
  range = p.w.document.createRange();
  range.selectNodeContents(p.q('.essay-body p'));
  const essayPassage = p.w.OLAE_KEEP.passageFor(range);
  assert.equal(essayPassage.kind, 'An essay');
  assert.equal(essayPassage.title, 'On Lying');
  assert.equal(essayPassage.href, essay.url);
  p.dom.window.close();

  // --- A passage on its page: Keep, a note, Highlight ---------------------
  p = page(essay.url.slice(1), 'https://hakanaltun.io' + essay.url, { run: ['keep', 'translate'], before: highlights });
  await tick();
  const K = p.w.OLAE_KEEP;
  const essayParagraphs = Array.from(p.w.document.querySelectorAll('.essay-body p')).filter((el) => el.textContent.trim().length > 40);
  const rangeOf = (el) => { const r = p.w.document.createRange(); r.selectNodeContents(el); return r; };
  const itemOf = (id) => p.stored().kept.find((k) => k.id === id);
  assert.deepEqual(Array.from(p.w.document.querySelectorAll('.reader-translate button:not(.reader-translate-close)'), (b) => b.textContent), ['Türkçe', 'Keep', 'Note', 'Highlight'], 'the prompt: translate, keep, a note, a highlight');
  const kept1 = K.passageFor(rangeOf(essayParagraphs[0]));
  K.keepPassage(kept1);
  const panel = p.q('.keep-panel');
  assert.ok(panel && !panel.hidden, 'keeping a passage opens the panel');
  assert.equal(p.q('.keep-panel-said').textContent, 'Kept in your drawer.');
  assert.equal(p.q('[data-panel-note]').textContent, 'Add a note');
  assert.equal(p.q('[data-panel-marks]').hidden, true);
  assert.equal(p.q('.keep-panel-actions a').getAttribute('href'), '/house/?from=piece&back=' + encodeURIComponent(essay.url) + '#drawer');
  assert.ok(p.q('.keep-panel-actions a').hasAttribute('data-open-drawer'), 'the way to the drawer opens it over the page');
  assert.equal(p.q('.keep-toast'), null, 'the panel says it, not a toast');
  assert.deepEqual(marked(p.w), [], 'keeping leaves the page as it is');
  assert.equal('mark' in itemOf(kept1.id), false);
  p.click('[data-panel-note]');
  const area = p.q('.keep-panel .keep-note-text');
  assert.ok(area, 'Add a note opens the note');
  assert.equal(p.w.document.activeElement, area);
  assert.equal(p.q('.keep-panel label').getAttribute('for'), area.id);
  assert.equal(area.maxLength, 2000);
  area.value = 'Read this again\nafter the exam.';
  area.dispatchEvent(new p.w.Event('input', { bubbles: true }));
  await wait(450);
  assert.equal(itemOf(kept1.id).note, 'Read this again\nafter the exam.', 'the note is saved as it is written');
  assert.equal(p.q('.keep-panel .keep-note-copy'), null, 'no Copy: The Page takes the note');
  const pageLink = new URL(p.q('.keep-panel .keep-note-page').getAttribute('href'), 'https://hakanaltun.io');
  assert.equal(pageLink.pathname, '/write/', 'The Page is beside the note, to write at length');
  assert.equal(pageLink.searchParams.get('from'), 'piece', 'and its way back leads to the piece the note was written on');
  assert.equal(pageLink.searchParams.get('back'), essay.url);
  assert.ok(pageLink.searchParams.get('v'), 'loading The Page as it is now');
  assert.equal(p.q('.keep-panel .keep-note-page').textContent.replace(/\u00a0/g, ' '), 'Write at length on The Page →');
  // Taken on to The Page, the note goes with the passage and its link,
  // after whatever is written there, and only once.
  p.w.localStorage.setItem('olae-page-v1', JSON.stringify({ text: 'My draft.\n', at: 1 }));
  const stayHere = (event) => event.preventDefault();
  p.w.document.addEventListener('click', stayHere);
  p.click('.keep-panel .keep-note-page');
  p.click('.keep-panel .keep-note-page');
  p.w.document.removeEventListener('click', stayHere);
  assert.equal(JSON.parse(p.w.localStorage.getItem('olae-page-v1')).text, 'My draft.\n\nAn essay · On Lying\n“' + kept1.quote + '”\nNote: Read this again\nafter the exam.\nhttps://hakanaltun.io' + essay.url, 'The Page takes the passage, the note and the page\'s link, after its own writing');
  assert.equal(new URL(p.q('.keep-panel .keep-note-page').getAttribute('href'), 'https://hakanaltun.io').searchParams.get('at'), 'end', 'and opens at its end');
  area.value = 'Read this again.';
  area.dispatchEvent(new p.w.Event('input', { bubbles: true }));
  p.click('.keep-panel .keep-note-done');
  assert.equal(itemOf(kept1.id).note, 'Read this again.', 'Done saves without waiting');
  assert.equal(p.q('.keep-panel .keep-note'), null);
  assert.equal(p.q('.keep-panel-said').textContent, 'Your note is in your drawer.');
  assert.equal(p.q('[data-panel-note]').textContent, 'Your note');
  K.keepPassage(kept1);
  assert.equal(p.q('.keep-panel-said').textContent, 'Already in your drawer.');
  assert.equal(p.q('.keep-panel .keep-note-text').value, 'Read this again.', 'keeping the same words again opens their note');
  assert.notEqual(p.w.document.activeElement, p.q('.keep-panel .keep-note-text'), 'unfocused, so no keyboard rises');
  p.w.document.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(panel.hidden, true, 'Escape closes the panel');

  // Highlight marks a passage; pressed over a highlight, it clears it.
  K.highlightSelection(rangeOf(essayParagraphs[0]));
  assert.deepEqual(marked(p.w), [kept1.quote], 'Highlight marks the passage where it stands');
  assert.match(p.q('.keep-toast').textContent, /^Highlighted\. It stays in this browser\./);
  assert.equal(itemOf(kept1.id).mark, true);
  assert.equal('keep' in itemOf(kept1.id), false, 'something kept stays kept');
  const inner = p.w.document.createRange();
  inner.setStart(essayParagraphs[0].firstChild, 2);
  inner.setEnd(essayParagraphs[0].firstChild, 6);
  assert.equal(K.isHighlighted(inner), true, 'a selection inside a highlight finds it');
  assert.equal(K.isHighlighted(rangeOf(essayParagraphs[2])), false);
  const lit = K.passageFor(rangeOf(essayParagraphs[2]));
  K.highlightSelection(rangeOf(essayParagraphs[2]));
  assert.deepEqual(marked(p.w).sort(), [kept1.quote, lit.quote].sort());
  assert.equal(itemOf(lit.id).mark, true, 'a highlight alone goes in the drawer, marked');
  assert.equal(itemOf(lit.id).keep, false, 'and is not otherwise kept');
  K.highlightSelection(inner);
  assert.equal(itemOf(kept1.id).note, 'Read this again.', 'clearing a highlight leaves the note');
  assert.equal('mark' in itemOf(kept1.id), false);
  assert.equal(p.q('.keep-toast').textContent, 'Highlight removed.');
  K.highlightSelection(rangeOf(essayParagraphs[2]));
  assert.equal(itemOf(lit.id), undefined, 'a highlight alone, cleared, leaves nothing behind');
  assert.deepEqual(marked(p.w), []);

  // Touching a highlight opens a small box beside it.
  K.highlightSelection(rangeOf(essayParagraphs[0]));
  p.w.Range.prototype.getClientRects = function () {
    return this.toString().includes(kept1.quote.slice(0, 30)) ? [{ left: 0, right: 600, top: 100, bottom: 160 }] : [];
  };
  const touchAt = (x, y, on = essayParagraphs[0]) => on.dispatchEvent(new p.w.MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
  touchAt(20, 400);
  await wait(300);
  assert.equal(panel.hidden, true, 'a touch outside a highlight opens nothing');
  touchAt(20, 120);
  await wait(300);
  assert.equal(panel.hidden, false, 'a touch on a highlight opens the small box');
  assert.ok(panel.classList.contains('keep-panel--near'), 'beside the passage');
  assert.equal(p.q('.keep-panel-said').textContent, 'Highlighted.');
  assert.equal(p.q('.keep-panel-note').textContent, 'Read this again.', 'with the note');
  assert.equal(p.q('.keep-panel .keep-note-text'), null, 'not opened for writing');
  assert.deepEqual([p.q('[data-panel-note]'), p.q('[data-panel-out]'), p.q('[data-panel-marks]')].map((b) => b.hidden ? '' : b.textContent), ['Your note', 'Remove highlight', 'Hide highlights']);
  assert.equal(p.q('.keep-panel-actions a').hidden, true, 'the small box keeps to the passage');
  p.click('[data-panel-note]');
  assert.equal(p.q('.keep-panel .keep-note-text').value, 'Read this again.', 'Your note opens it');
  assert.ok(!panel.classList.contains('keep-panel--near'), 'and the note is written at the foot of the window');
  p.w.document.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  // Hiding the highlights keeps them.
  touchAt(20, 120);
  await wait(300);
  p.click('[data-panel-marks]');
  assert.deepEqual(marked(p.w), [], 'Hide highlights takes them off the page');
  assert.equal(p.stored().marks, false, 'and remembers it');
  assert.equal(itemOf(kept1.id).mark, true, 'the highlight itself stays');
  assert.equal(p.q('.keep-panel-said').textContent, 'Highlights hidden on every page.');
  assert.equal(p.q('[data-panel-marks]').textContent, 'Show highlights', 'and can bring them straight back');
  p.click('[data-panel-marks]');
  assert.deepEqual(marked(p.w), [kept1.quote]);
  p.click('[data-panel-marks]');
  p.w.document.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  touchAt(20, 120);
  await wait(300);
  assert.equal(panel.hidden, true, 'a hidden highlight opens nothing');
  K.highlightSelection(rangeOf(essayParagraphs[2]));
  assert.equal('marks' in p.stored(), false, 'a new highlight brings them all back into view');
  assert.deepEqual(marked(p.w).sort(), [kept1.quote, lit.quote].sort());
  K.highlightSelection(rangeOf(essayParagraphs[2]));
  // Remove highlight, in the box, clears only the mark from something kept.
  touchAt(20, 120);
  await wait(300);
  p.click('[data-panel-out]');
  assert.equal(p.q('.keep-panel-said').textContent, 'Highlight removed.');
  assert.deepEqual(marked(p.w), []);
  assert.equal(itemOf(kept1.id).note, 'Read this again.', 'the kept passage and its note stay');

  // A passage with a note asks twice before it is taken out.
  K.keepPassage(kept1);
  p.click('[data-panel-out]');
  assert.equal(p.stored().kept.length, 1, 'not on the first press');
  assert.equal(p.q('[data-panel-out]').textContent, 'Take it out with the note');
  assert.equal(p.q('.keep-panel-said').textContent, 'Your note would go with it.');
  p.click('[data-panel-out]');
  assert.equal(p.stored().kept.length, 0, 'gone on the second');
  assert.equal(p.q('.keep-panel-said').textContent, 'Taken out of your drawer.');
  K.keepPassage(kept1);
  p.click('[data-panel-out]');
  assert.equal(p.stored().kept.length, 0, 'one without a note goes at once');

  // Note, beside Keep: the note comes first, and nothing is kept until the
  // reader keeps it.
  const kept2 = K.passageFor(rangeOf(essayParagraphs[1]));
  K.notePassage(kept2);
  assert.equal(panel.hidden, false);
  assert.equal(p.stored().kept.length, 0, 'nothing is kept yet');
  assert.equal(p.q('.keep-panel-quote').hidden, false, 'the passage is shown above the note');
  assert.equal(p.q('.keep-panel-quote').textContent.replace(/⁠/g, ''), kept2.quote);
  // The drawer is a link away while the note is written, and the note
  // waits for the reader in this tab while they look there.
  const shownActions = () => Array.from(p.w.document.querySelectorAll('.keep-panel-actions > *')).filter((el) => !el.hidden).map((el) => el.textContent);
  assert.equal(p.q('.keep-panel-actions').hidden, false);
  assert.deepEqual(shownActions(), ['Open your drawer →'], 'only the way to the drawer beside an unkept note');
  const draftArea = p.q('.keep-panel .keep-note-text');
  assert.equal(p.w.document.activeElement, draftArea, 'the note is ready to write');
  assert.equal(p.q('.keep-panel .keep-note-done').textContent, 'Keep with the note');
  draftArea.value = 'First thought.';
  draftArea.dispatchEvent(new p.w.Event('input', { bubbles: true }));
  await wait(450);
  p.w.dispatchEvent(new p.w.Event('pagehide'));
  assert.equal(p.stored().kept.length, 0, 'writing keeps nothing on its own');
  const heldNote = p.w.sessionStorage.getItem('olae-note-draft');
  assert.deepEqual(JSON.parse(heldNote), { path: essay.url, item: JSON.parse(JSON.stringify(kept2)), note: 'First thought.' }, 'the unkept note is held for this tab');
  {
    // Back on the page, the panel opens with it again, unfocused.
    const again = page(essay.url.slice(1), 'https://hakanaltun.io' + essay.url, { run: ['keep', 'translate'], before: (w) => { highlights(w); w.sessionStorage.setItem('olae-note-draft', heldNote); } });
    await tick();
    assert.equal(again.q('.keep-panel').hidden, false, 'the note waits on its page');
    assert.equal(again.q('.keep-panel-said').textContent, 'Your note on this passage, not kept yet.');
    assert.equal(again.q('.keep-panel .keep-note-text').value, 'First thought.');
    assert.equal(again.q('.keep-panel-quote').textContent.replace(/\u2060/g, ''), kept2.quote);
    assert.notEqual(again.w.document.activeElement, again.q('.keep-panel .keep-note-text'), 'unfocused, so no keyboard rises');
    assert.equal(again.stored(), null, 'and still nothing is kept');
    again.dom.window.close();
  }
  {
    // Held for another page, it waits there and not here.
    const elsewhere = page(essay.url.slice(1), 'https://hakanaltun.io' + essay.url, { run: ['keep', 'translate'], before: (w) => { highlights(w); w.sessionStorage.setItem('olae-note-draft', heldNote.replace(essay.url, '/pieces/elsewhere.html')); } });
    await tick();
    assert.ok(!elsewhere.q('.keep-panel') || elsewhere.q('.keep-panel').hidden);
    elsewhere.dom.window.close();
  }
  p.w.localStorage.removeItem('olae-page-v1');
  const stayOnPiece = (event) => event.preventDefault();
  p.w.document.addEventListener('click', stayOnPiece);
  p.click('.keep-panel .keep-note-page');
  p.w.document.removeEventListener('click', stayOnPiece);
  assert.match(JSON.parse(p.w.localStorage.getItem('olae-page-v1')).text, /^An essay · On Lying\n“[\s\S]*”\nNote: First thought\.\nhttps:/, 'The Page takes a note before it is kept');
  assert.equal(p.stored().kept.length, 0, 'and taking it there keeps nothing');
  p.click('.keep-panel-close');
  assert.equal(panel.hidden, false, 'closing an unkept note asks once more');
  assert.equal(p.q('.keep-panel-said').textContent, 'Your note is not kept yet. Close again to let it go.');
  p.w.document.dispatchEvent(new p.w.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(panel.hidden, false, 'nor does a touch elsewhere close it');
  draftArea.value = 'First thought, and a second.';
  draftArea.dispatchEvent(new p.w.Event('input', { bubbles: true }));
  p.click('.keep-panel .keep-note-done');
  assert.equal(p.stored().kept.length, 1, 'Keep with the note keeps both');
  assert.equal(itemOf(kept2.id).note, 'First thought, and a second.');
  assert.equal(p.q('.keep-panel-said').textContent, 'Kept in your drawer, with your note.');
  assert.deepEqual(shownActions(), ['Your note', 'Take out', 'Open your drawer →'], 'kept, the panel offers all three again');
  assert.equal(p.w.sessionStorage.getItem('olae-note-draft'), null, 'a kept note no longer waits');
  assert.deepEqual(marked(p.w), [], 'and leaves the page unmarked');
  p.w.OLAE_KEEP.remove(kept2.id);
  K.notePassage(kept2);
  p.q('.keep-panel .keep-note-text').value = 'Not this time.';
  p.q('.keep-panel .keep-note-text').dispatchEvent(new p.w.Event('input', { bubbles: true }));
  assert.ok(p.w.sessionStorage.getItem('olae-note-draft'));
  p.click('.keep-panel-close');
  p.click('.keep-panel-close');
  assert.equal(panel.hidden, true, 'closed on the second Close');
  assert.equal(p.stored().kept.length, 0, 'a note let go leaves nothing behind');
  assert.equal(p.w.sessionStorage.getItem('olae-note-draft'), null, 'nor waits anywhere');
  // A note or a keep on a highlight makes it kept, and it stays highlighted.
  K.highlightSelection(rangeOf(essayParagraphs[1]));
  K.notePassage(kept2);
  assert.equal(p.q('.keep-panel .keep-note-done').textContent, 'Keep with the note', 'a highlight alone is not kept yet');
  p.q('.keep-panel .keep-note-text').value = 'On a highlight.';
  p.q('.keep-panel .keep-note-text').dispatchEvent(new p.w.Event('input', { bubbles: true }));
  p.click('.keep-panel .keep-note-done');
  assert.equal(itemOf(kept2.id).note, 'On a highlight.');
  assert.equal(itemOf(kept2.id).mark, true);
  assert.equal('keep' in itemOf(kept2.id), false);
  K.notePassage(kept2);
  assert.equal(p.q('.keep-panel-said').textContent, 'Already in your drawer.');
  assert.equal(p.w.document.activeElement, p.q('.keep-panel .keep-note-text'), 'Note on words already kept opens their note');
  p.w.OLAE_KEEP.remove(kept2.id);
  K.highlightSelection(rangeOf(essayParagraphs[1]));
  K.keepPassage(kept2);
  assert.equal(p.q('.keep-panel-said').textContent, 'Kept in your drawer.');
  assert.equal('keep' in itemOf(kept2.id), false);
  assert.equal(itemOf(kept2.id).mark, true);
  p.w.OLAE_KEEP.remove(kept2.id);
  // A passage from another page, or words the page no longer has, are not marked.
  K.highlight({ id: 'text-elsewhere', kind: 'An essay', title: 'Elsewhere', quote: kept1.quote, href: '/pieces/elsewhere.html' });
  K.highlight({ id: 'text-reworded', kind: 'An essay', title: 'On Lying', quote: 'Words this essay has never held at all.', href: essay.url });
  assert.deepEqual(marked(p.w), []);
  p.dom.window.close();

  // Spacing and the dash's word joiner do not hide a passage from its mark,
  // and a highlight is found again after the page puts it back.
  p = page('book/part-one/index.html', 'https://hakanaltun.io/book/part-one/', { run: ['keep'], before: highlights });
  await tick();
  assert.deepEqual(Array.from(p.w.document.querySelectorAll('.keep-prompt button'), (b) => b.textContent), ['Keep this passage', 'Add a note', 'Highlight'], 'the book\'s own prompt offers Highlight where it can be drawn');
  const dashedHere = Array.from(p.w.document.querySelectorAll('.book-chapter p')).find((el) => el.textContent === dashed.textContent);
  assert.ok(dashedHere && dashedHere.ownerDocument === p.w.document);
  range = p.w.document.createRange();
  range.selectNodeContents(dashedHere);
  const bookPassage = p.w.OLAE_KEEP.passageFor(range);
  p.w.OLAE_KEEP.highlightSelection(range);
  assert.deepEqual(marked(p.w), [bookPassage.quote], 'a passage with a joined dash is marked');
  const markBefore = p.w.CSS.highlights.get('olae-kept').ranges[0];
  assert.equal(markBefore.startContainer.parentElement.closest('p'), dashedHere);
  const putBack = dashedHere.cloneNode(true);
  dashedHere.replaceWith(putBack);
  assert.equal(markBefore.collapsed, true, 'lifting the paragraph out collapses the old mark');
  await wait(250);
  const markAfter = p.w.CSS.highlights.get('olae-kept').ranges[0];
  assert.equal(markAfter.startContainer.parentElement.closest('p'), putBack, 'and the mark is found again on the paragraph put back');
  assert.deepEqual(marked(p.w), [bookPassage.quote]);
  p.dom.window.close();

  // Without the Custom Highlight API there is no Highlight to offer, and
  // keeping still works.
  p = page(essay.url.slice(1), 'https://hakanaltun.io' + essay.url, { run: ['keep', 'translate'], before: (w) => { delete w.Highlight; } });
  await tick();
  assert.deepEqual(Array.from(p.w.document.querySelectorAll('.reader-translate button:not(.reader-translate-close)'), (b) => b.textContent), ['Türkçe', 'Keep', 'Note']);
  range = p.w.document.createRange();
  range.selectNodeContents(p.q('.essay-body p'));
  p.w.OLAE_KEEP.keepPassage(p.w.OLAE_KEEP.passageFor(range));
  assert.equal(p.q('.keep-panel').hidden, false);
  assert.equal(p.stored().kept.length, 1);
  p.dom.window.close();

  // --- A note in the drawer --------------------------------------------------
  const noted = { id: 'text-noted', kind: 'An essay', title: 'On Lying', quote: 'A lie is an environment.', href: '/pieces/on-lying.html', note: 'First line.\nSecond line.', mark: true };
  const bare = { id: 'word-serendipity', kind: 'A word', title: 'serendipity', quote: '', href: '/word/serendipity/' };
  a = house({ saved: JSON.stringify({ v: 2, kept: [bare, noted] }) });
  await tick();
  a.click('[data-open="drawer"]');
  assert.equal(a.q('.house-drawer-marks').firstChild.textContent, 'Your highlights are shown on their pages.');
  assert.equal(a.q('[data-marks]').textContent, 'Hide them');
  a.click('[data-marks]');
  assert.equal(a.stored().marks, false, 'the drawer can hide the highlights');
  assert.equal(a.q('.house-drawer-marks').firstChild.textContent, 'Your highlights are hidden on their pages.');
  assert.equal(a.q('[data-marks]').textContent, 'Show them');
  assert.equal(a.w.document.activeElement, a.q('[data-marks]'));
  a.click('[data-marks]');
  assert.equal('marks' in a.stored(), false, 'and show them again');
  assert.equal(a.q('[data-note="text-noted"]').closest('.house-item').querySelector('.house-item-kind').textContent, 'An essay · Highlighted', 'a highlight says so in the drawer');
  const notedItem = a.q('[data-note="text-noted"]').closest('.house-item');
  assert.equal(notedItem.querySelector('.house-note-text').textContent, 'First line.\nSecond line.', 'the drawer shows the note under what was kept');
  assert.equal(a.q('[data-note="text-noted"]').textContent, 'Edit the note');
  assert.equal(a.q('[data-note="word-serendipity"]').textContent, 'Add a note', 'anything in the drawer can take one');
  a.click('[data-note="word-serendipity"]');
  const drawerArea = a.q('#house-dialog-content .keep-note-text');
  assert.equal(a.w.document.activeElement, drawerArea);
  const toPage = new URL(a.q('#house-dialog-content .keep-note-page').getAttribute('href'), 'https://hakanaltun.io');
  assert.equal(toPage.pathname, '/write/');
  assert.equal(toPage.searchParams.get('from'), 'drawer', 'from the drawer, The Page returns to the drawer');
  assert.equal(toPage.searchParams.get('back'), '/house/?in=door#drawer', 'as it was, over the room it was open over');
  assert.ok(toPage.searchParams.get('v'), 'and loads the current page');
  // The drawer's notes go on to The Page as every note does.
  const stayInDrawer = (event) => event.preventDefault();
  a.w.document.addEventListener('click', stayInDrawer);
  a.click('#house-dialog-content .keep-note-page');
  a.w.document.removeEventListener('click', stayInDrawer);
  assert.equal(JSON.parse(a.w.localStorage.getItem('olae-page-v1')).text, 'A word · serendipity\n' + word.description + '\nhttps://hakanaltun.io/word/serendipity/', 'the word goes on to The Page, as the House tells it now');
  drawerArea.value = 'Walpole, 1754.';
  drawerArea.dispatchEvent(new a.w.Event('input', { bubbles: true }));
  a.click('#house-dialog-content .keep-note-done');
  assert.equal(a.stored().kept.find((k) => k.id === 'word-serendipity').note, 'Walpole, 1754.');
  assert.match(a.q('[data-note="word-serendipity"]').closest('.house-item').textContent, /Walpole, 1754\./, 'the drawer is drawn again with the note');
  assert.equal(a.w.document.activeElement, a.q('[data-note="word-serendipity"]'), 'focus comes back to the note\'s button');
  // A note left open when the drawer closes keeps what was written, and
  // never writes it back over a newer note.
  a.click('[data-note="word-serendipity"]');
  let left = a.q('#house-dialog-content .keep-note-text');
  left.value = 'Older words.';
  left.dispatchEvent(new a.w.Event('input', { bubbles: true }));
  left.dispatchEvent(new a.w.Event('blur'));
  a.click('#house-close');
  assert.equal(a.stored().kept.find((k) => k.id === 'word-serendipity').note, 'Older words.');
  a.click('[data-open="drawer"]');
  a.click('[data-note="word-serendipity"]');
  left = a.q('#house-dialog-content .keep-note-text');
  left.value = 'Newer words.';
  left.dispatchEvent(new a.w.Event('input', { bubbles: true }));
  a.click('#house-dialog-content .keep-note-done');
  a.w.dispatchEvent(new a.w.Event('pagehide'));
  assert.equal(a.stored().kept.find((k) => k.id === 'word-serendipity').note, 'Newer words.', 'an editor that has left writes nothing more');
  a.click('[data-note="word-serendipity"]');
  a.q('#house-dialog-content .keep-note-text').value = 'Walpole, 1754.';
  a.q('#house-dialog-content .keep-note-text').dispatchEvent(new a.w.Event('input', { bubbles: true }));
  a.click('#house-dialog-content .keep-note-done');
  blob = null;
  a.w.URL.createObjectURL = (b) => { blob = b; return 'blob:x'; };
  a.w.URL.revokeObjectURL = () => {};
  a.w.HTMLAnchorElement.prototype.click = function () {};
  a.click('[data-export="text"]');
  assert.match(await blob.text(), /“A lie is an environment\.”\nNote: First line\.\nSecond line\.\nhttps:\/\/hakanaltun\.io\/pieces\/on-lying\.html/, 'the text download carries the note');
  const removeNoted = a.q('[data-remove="text-noted"]');
  a.click(removeNoted);
  assert.equal(a.stored().kept.length, 2, 'a thing with a note asks twice');
  assert.equal(removeNoted.textContent, 'Remove it and the note');
  assert.match(a.q('#house-dialog-status').textContent, /Your note would go with it/);
  a.click(removeNoted);
  assert.equal(a.stored().kept.length, 1);
  a.dom.window.close();

  // Automatic weather affects both views without moving the reader or
  // claiming a manual choice. Manual controls can override it and resume.
  const city = page('house/index.html', 'https://hakanaltun.io/house/#study', { run: ['keep', 'astronomy'] });
  let cityWeather;
  city.w.OLAE_ISTANBUL_WEATHER = { start: fn => { cityWeather = fn; } };
  city.w.eval(scripts.house);
  assert.equal(city.q('#house-weather-summary').textContent, 'Checking İstanbul’s weather…');
  let moved = 0;
  city.w.HTMLElement.prototype.scrollIntoView = () => { moved++; };
  const degrees = () => ['#study', '#balcony'].map(room => { const t = city.q(room + ' [data-house-temperature]'); return t.hidden ? null : t.textContent; });
  assert.deepEqual(degrees(), [null, null], 'no temperature before a report');
  cityWeather({ available: true, summary: 'Rain', kind: 'rain', level: 1, clouded: true, temperature: 9 });
  assert.deepEqual(degrees(), ['·\u00a09°C', '·\u00a09°C'], 'İstanbul’s temperature beside the time in both rooms');
  assert.equal(city.q('#house-weather-summary').textContent, 'Rain in İstanbul. ', 'and in that one place only');
  // The first report replaces the opening sky without its slow fades, so
  // rain never falls from a sunny sky; passing cloud keeps them.
  assert.ok(read(root, 'css', 'house.css').includes('.house-scene[data-sky-instant] :is(.house-sun, .house-moon, .house-stars, .house-sky-stars, .house-light-beam, .house-sky-top, .house-sky-bottom) { transition: none; }'));
  assert.equal(city.q('#house-scene').dataset.skyInstant, undefined, 'and only for that report');
  assert.equal(city.q('#house-scene').dataset.weather, 'rain');
  assert.equal(city.q('#house-balcony-scene').dataset.weather, 'rain');
  assert.equal(city.q('#house-scene').dataset.clouded, '');
  assert.equal(city.q('#balcony').dataset.skyObscured, 'true');
  assert.equal(city.q('#house-weather-follow').hidden, true);
  assert.equal(moved, 0, 'automatic showers never scroll');
  city.w.matchMedia = () => ({ matches: false });
  city.w.eval(scripts.snow);
  city.w.document.dispatchEvent(new city.w.Event('DOMContentLoaded'));
  city.click('#let-it-snow');
  cityWeather({ available: true, summary: 'Clear', kind: null, level: 0, clouded: false, temperature: -2 });
  assert.equal(city.q('#house-scene').dataset.weather, 'snow', 'a manual choice survives weather updates');
  assert.deepEqual(degrees(), ['·\u00a0−2°C', '·\u00a0−2°C'], 'the temperature stays İstanbul’s, with a minus sign');
  cityWeather({ available: true, summary: 'Overcast', kind: null, level: 0, clouded: true });
  city.click('#house-weather-follow');
  assert.equal(city.q('#house-scene').dataset.weather, undefined);
  assert.equal(city.q('#house-scene').dataset.clouded, '');
  assert.equal(city.q('#balcony').dataset.skyObscured, 'true');
  assert.equal(city.q('#house-weather-follow').hidden, true);
  assert.equal(city.q('#house-weather-summary').textContent, 'Overcast in İstanbul. ');
  assert.equal(city.q('#house-status').textContent, 'The House follows İstanbul’s weather again.', 'not a clearing sky under cloud');
  // Stopping the footer's weather returns to the city at once, not to a
  // clear sky chosen by nobody.
  for (const step of ['light', 'heavy', 'off']) city.click('#let-it-rain');
  assert.equal(city.q('#let-it-rain').getAttribute('aria-pressed'), 'false');
  assert.equal(city.q('#house-scene').dataset.weather, undefined);
  assert.equal(city.q('#house-scene').dataset.clouded, '', 'under İstanbul’s cloud again');
  assert.equal(city.q('#balcony').dataset.skyObscured, 'true');
  assert.equal(city.q('#house-weather-summary').textContent, 'Overcast in İstanbul. ');
  assert.equal(city.q('#house-weather-follow').hidden, true);
  assert.equal(city.q('#house-status').textContent, 'The House follows İstanbul’s weather again.');
  cityWeather({ available: true, summary: 'Clear', kind: null, level: 0, clouded: false });
  assert.equal(city.q('#house-scene').dataset.clouded, undefined);
  assert.equal(city.q('#balcony').dataset.skyObscured, 'false');
  assert.deepEqual(degrees(), [null, null], 'a report without a temperature shows none');
  cityWeather({ available: false, kind: null, level: 0, clouded: false, temperature: 12 });
  assert.match(city.q('#house-weather-summary').textContent, /unavailable/);
  assert.deepEqual(degrees(), [null, null], 'nor does unavailable weather');
  await tick();
  city.dom.window.close();
  // Following İstanbul again before its first report still says it is checking.
  const early = page('house/index.html', 'https://hakanaltun.io/house/#study', { run: ['keep', 'astronomy'] });
  early.w.OLAE_ISTANBUL_WEATHER = { start: () => {} };
  early.w.matchMedia = () => ({ matches: false });
  early.w.eval(scripts.house);
  early.w.eval(scripts.snow);
  early.w.document.dispatchEvent(new early.w.Event('DOMContentLoaded'));
  early.click('#let-it-snow');
  assert.equal(early.q('#house-weather-summary').textContent, 'Weather chosen by you. ');
  early.click('#house-weather-follow');
  assert.equal(early.q('#house-weather-summary').textContent, 'Checking İstanbul’s weather…');
  assert.equal(early.q('#house-scene').dataset.weather, undefined);
  await tick();
  early.dom.window.close();

  // The footer's weather falls outside the window here, not over the page.
  // The House runs before the weather does, as it does in the page, and
  // offers the window once the page has loaded.
  p = house();
  await tick();
  p.w.matchMedia = () => ({ matches: false });
  p.w.eval(scripts.snow);
  p.w.document.dispatchEvent(new p.w.Event('DOMContentLoaded'));
  p.click('#let-it-rain');
  assert.equal(p.q('canvas.snowfall'), null, 'no rain over the page');
  assert.equal(p.q('#house-scene').dataset.weather, 'rain');
  assert.equal(drops(p, '.house-weather .house-rain'), 85, 'rain at the window');
  assert.equal(p.q('#let-it-rain').getAttribute('aria-pressed'), 'true');
  assert.equal(p.q('#house-status').textContent, 'Light rain at the study window.');
  p.click('#let-it-snow');
  assert.equal(p.q('#house-scene').dataset.weather, 'snow', 'snow takes over from rain');
  assert.equal(p.w.document.querySelectorAll('.house-weather .house-rain').length, 0);
  assert.equal(drops(p, '.house-weather .house-snowfall'), 85);
  p.click('#let-it-snow');
  p.click('#let-it-snow');
  assert.equal(p.q('#house-scene').dataset.weather, undefined, 'and the sky clears');
  assert.equal(p.w.document.querySelectorAll('.house-weather *').length, 0);
  assert.equal(p.q('canvas.snowfall'), null);
  p.dom.window.close();

  // The footer's snow and rain stand again under both rooms, and a touch
  // there presses the footer's own button: the same signs, names and steps.
  p = house();
  await tick();
  const choice = p.q('#house-weather-choice');
  assert.equal(choice.hidden, true, 'not before the sky is there');
  p.w.matchMedia = () => ({ matches: false });
  p.w.eval(scripts.snow);
  p.w.document.dispatchEvent(new p.w.Event('DOMContentLoaded'));
  assert.equal(choice.hidden, true, 'nor at the door, where there is no sky');
  const icon = (kind) => p.q('#house-weather-choice [data-weather-choice="' + kind + '"]');
  const twins = () => ['snow', 'rain'].forEach((kind) => ['aria-label', 'aria-pressed', 'title'].forEach((name) =>
    assert.equal(icon(kind).getAttribute(name), p.q('#let-it-' + kind).getAttribute(name), kind + ': ' + name + ' as in the footer')));
  assert.equal(icon('snow').textContent, p.q('#let-it-snow').textContent, 'the footer’s snowflake');
  assert.equal(icon('rain').querySelector('path').getAttribute('d'), p.q('#let-it-rain path').getAttribute('d'), 'and its drop');
  p.click('#house-enter');
  assert.equal(choice.hidden, false, 'under the study');
  twins();
  for (const [step, title] of [['rain', 'Light rain. Click for heavy rain'], ['rain', 'Heavy rain. Click to stop the rain'], [undefined, 'Let it rain']]) {
    p.click(icon('rain'));
    assert.equal(icon('rain').title, title);
    twins();
    assert.equal(p.q('#house-scene').dataset.weather, step);
  }
  assert.equal(p.q('canvas.snowfall'), null, 'the page itself stays dry');
  p.click('#let-it-snow');
  twins();
  assert.equal(icon('snow').getAttribute('aria-pressed'), 'true', 'what the footer chooses shows here too');
  assert.equal(p.q('#house-weather-follow').hidden, false);
  p.click('.house-hotspot--balcony');
  assert.equal(choice.hidden, false, 'under the balcony');
  p.click('#house-weather-follow');
  twins();
  assert.equal(icon('snow').getAttribute('aria-pressed'), 'false', 'following İstanbul again lets the choice go');
  p.click('.house-hotspot--study-door');
  p.click('#house-leave');
  assert.equal(choice.hidden, true, 'back at the door');
  await tick();
  p.dom.window.close();

  // The balcony's sound is told where the reader is, İstanbul's hour,
  // month, temperature and weather, and whether the glass is shut. It is
  // heard out there and not in the study; js/house-sound.js and
  // scripts/test-house-sound.cjs do the rest.
  const heard = [];
  let liveRain;
  const listening = (w) => {
    w.OLAE_HOUSE_SOUND = { update: (state) => heard.push(state) };
    w.OLAE_ISTANBUL_WEATHER = { start: (fn) => { liveRain = fn; } };
  };
  const lastHeard = () => ({ ...heard[heard.length - 1] });
  let s = houseAt('2026-10-11T13:00:00+03:00', 'https://hakanaltun.io/house/#study', false, listening);
  assert.deepEqual(lastHeard(), { outside: false, glass: 'closed', weather: null, level: 0, period: 'day', hour: 13, month: 10, temp: null },
    'in the study at one on an October afternoon, with Moris out and the glass shut');
  s.w.matchMedia = () => ({ matches: false });
  s.w.eval(scripts.snow);
  s.w.document.dispatchEvent(new s.w.Event('DOMContentLoaded'));
  s.click('#let-it-rain');
  assert.equal(lastHeard().weather, 'rain', 'rain at the study window');
  assert.equal(lastHeard().outside, false);
  s.click('.house-hotspot--balcony');
  assert.equal(lastHeard().outside, true, 'and out on the balcony');
  s.click('#let-it-rain');
  assert.equal(lastHeard().level, 2);
  s.click('#house-weather-choice [data-weather-choice="snow"]');
  assert.equal(lastHeard().weather, 'snow');
  s.click('#house-weather-follow');
  liveRain({ available: true, summary: 'Rain', kind: 'rain', level: 1, clouded: true, temperature: 9 });
  assert.deepEqual([lastHeard().weather, lastHeard().level, lastHeard().temp], ['rain', 1, 9], 'İstanbul’s own rain and temperature are heard too');
  liveRain({ available: true, summary: 'Rain', kind: 'rain', level: 1, clouded: true, temperature: 8 });
  assert.equal(lastHeard().temp, 8, 'a new temperature is passed on');
  liveRain({ available: false, kind: null, level: 0, clouded: false, temperature: 12 });
  assert.equal(lastHeard().temp, null, 'unavailable weather gives no temperature');
  s.click('.house-hotspot--study-door');
  assert.equal(lastHeard().outside, false, 'back in the study');
  await tick();
  s.dom.window.close();
  s = houseAt('2026-10-11T14:30:00+03:00', 'https://hakanaltun.io/house/#balcony', false, listening);
  assert.deepEqual([lastHeard().outside, lastHeard().glass], [true, 'open'], 'at half past two Moris is in and the glass is folded away');
  await tick();
  s.dom.window.close();
  s = houseAt('2026-10-11T23:30:00+03:00', 'https://hakanaltun.io/house/#balcony', false, listening);
  assert.deepEqual([lastHeard().period, lastHeard().hour], ['night', 23], 'İstanbul’s night');
  await tick();
  s.dom.window.close();

  // --- The drawer over any page -------------------------------------------
  // The House's menu in the header, the site's menu and the footer open the
  // reader's drawer over the page they are on, fetching what the page lacks
  // of it the first time, and it closes back to that page.
  {
    const about = read(site, 'about', 'index.html');
    const assets = JSON.parse(about.match(/window\.OLAE_DRAWER_ASSETS = (\{.*?\});/)[1]);
    for (const key of ['keep_js', 'keep_css', 'drawer_js', 'drawer_css']) assert.ok(fs.existsSync(path.join(site, assets[key].split('?')[0])), 'the drawer has its ' + key);
    assert.match(read(site, 'house', 'index.html'), new RegExp('<script src="' + assets.drawer_js.replace(/[?.]/g, '\\$&') + '" defer></script>\\s*<script src="/js/house\\.js'), 'The House loads the drawer just before itself');
    const o = page('about/index.html', 'https://hakanaltun.io/about/', {
      saved: JSON.stringify({ v: 2, kept: [{ id: 'word-quarantine', kind: 'A word', title: 'quarantine', quote: 'What was kept.', href: '/word/quarantine/', at: 1 }] })
    });
    o.w.OLAE_DRAWER_ASSETS = assets;
    o.w.eval(scripts.nav);
    const footer = o.q('footer a[data-open-drawer]');
    assert.equal(footer.getAttribute('href'), '/house/#drawer', 'without the script, the footer leads to the drawer in The House');
    assert.equal(footer.getAttribute('aria-label'), 'Your drawer');
    const instruments = o.q('footer a[href="/tools/"]');
    assert.equal(instruments.nextElementSibling, footer, 'the drawer stands beside the instruments');
    assert.equal(instruments.querySelectorAll('svg rect').length, 4, 'and the instruments keep their four squares');
    assert.deepEqual([...o.w.document.querySelectorAll('#footer-actions-menu > *')].map((el) => el.matches('.theme-menu-wrap') ? 'theme' : el.matches('[href="/tools/"]') ? 'instruments' : el.matches('[data-open-drawer]') ? 'drawer' : el.matches('.footer-share-btn') ? 'share' : el.tagName),
      ['theme', 'instruments', 'drawer', 'share'], 'the theme first, then the instruments and the drawer, and sharing last');
    footer.focus();
    footer.click();
    const loaded = (src) => { const tag = o.q('head script[src="' + src + '"]'); assert.ok(tag, 'fetched ' + src); return tag; };
    const style = (href) => { const tag = o.q('head link[href="' + href + '"]'); assert.ok(tag, 'fetched ' + href); tag.dispatchEvent(new o.w.Event('load')); };
    style(assets.keep_css);
    style(assets.drawer_css);
    o.w.eval(scripts.keep);
    loaded(assets.keep_js).dispatchEvent(new o.w.Event('load'));
    await tick();
    o.w.eval(scripts.drawer);
    loaded(assets.drawer_js).dispatchEvent(new o.w.Event('load'));
    await wait(20);
    const overlay = o.q('#drawer-dialog');
    assert.ok(overlay && overlay.open, 'the drawer opens over the page');
    assert.equal(o.w.location.pathname, '/about/', 'and the page stays where it is');
    assert.equal(overlay.querySelector('h2').textContent, 'Your drawer');
    assert.equal(overlay.querySelectorAll('.house-item').length, 1);
    assert.match(overlay.querySelector('.house-item').textContent, /quaranta/, 'with the current words of what was kept');
    assert.equal(o.w.document.activeElement, overlay.querySelector('.house-close'));
    overlay.querySelector('[data-note="word-quarantine"]').click();
    const note = overlay.querySelector('.keep-note textarea');
    assert.ok(note, 'a note is written in place over the page as in The House');
    const notePage = new URL(overlay.querySelector('.keep-note-page').getAttribute('href'), 'https://hakanaltun.io');
    assert.equal(notePage.searchParams.get('from'), 'drawer');
    assert.equal(notePage.searchParams.get('back'), '/about/#drawer', 'The Page leads back to the drawer over this page');
    overlay.querySelector('.house-close').click();
    assert.equal(overlay.open, false);
    assert.equal(o.w.document.activeElement, footer, 'closing leaves the reader where they were');
    // That address opens the drawer over the page again, and closed, the
    // drawer leaves the page's address as it was.
    {
      const r = page('about/index.html', 'https://hakanaltun.io/about/#drawer');
      r.w.OLAE_DRAWER_ASSETS = assets;
      r.w.eval(scripts.nav);
      for (const href of [assets.keep_css, assets.drawer_css]) r.q('head link[href="' + href + '"]').dispatchEvent(new r.w.Event('load'));
      r.w.eval(scripts.keep);
      r.q('head script[src="' + assets.keep_js + '"]').dispatchEvent(new r.w.Event('load'));
      await tick();
      r.w.eval(scripts.drawer);
      r.q('head script[src="' + assets.drawer_js + '"]').dispatchEvent(new r.w.Event('load'));
      await wait(20);
      const again = r.q('#drawer-dialog');
      assert.ok(again && again.open, '#drawer opens the drawer over the page');
      again.querySelector('.house-close').click();
      assert.equal(r.w.location.pathname + r.w.location.search + r.w.location.hash, '/about/', 'closed, the address no longer says it is open');
      r.dom.window.close();
    }
    // The House's own menu in the header.
    const toggle = o.q('.nav-house-toggle');
    const menu = o.q('#nav-house-menu');
    assert.equal(toggle.hidden, false, 'the chevron shows once the script is there');
    assert.equal(menu.hidden, true);
    toggle.dispatchEvent(new o.w.MouseEvent('click', { bubbles: true, detail: 1 }));
    assert.equal(menu.hidden, false, 'the chevron opens The House\'s menu');
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.deepEqual([...menu.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]), [['To the door', '/house/'], ['Your drawer', '/house/#drawer']]);
    o.w.document.dispatchEvent(new o.w.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(menu.hidden, true, 'Escape folds it');
    // The name opens the menu too, and no longer goes to the door.
    const name = o.q('.nav-house > a');
    assert.equal(name.getAttribute('href'), '/house/', 'without the script, the name is the way to the door');
    assert.equal(name.getAttribute('role'), 'button');
    assert.equal(name.getAttribute('aria-controls'), 'nav-house-menu');
    assert.equal(toggle.tabIndex, -1, 'the name is the one control for the keyboard');
    const go = (init) => name.dispatchEvent(new o.w.MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
    assert.equal(go({ detail: 1 }), false, 'a click on The House does not go to the door');
    assert.equal(menu.hidden, false, 'it opens the menu');
    assert.equal(name.getAttribute('aria-expanded'), 'true');
    assert.equal(toggle.getAttribute('aria-expanded'), 'true', 'and the chevron turns with it');
    go({ detail: 1 });
    assert.equal(menu.hidden, true, 'a second click folds it');
    assert.equal(name.getAttribute('aria-expanded'), 'false');
    // jsdom cannot follow the link, so the click is stopped once the menu
    // has had its turn, and what it was left to do is read there.
    let toDoor = null;
    const seen = (e) => { toDoor = !e.defaultPrevented; e.preventDefault(); };
    o.w.document.addEventListener('click', seen);
    go({ detail: 1, ctrlKey: true });
    o.w.document.removeEventListener('click', seen);
    assert.equal(toDoor, true, 'a click for a new tab still goes to the door');
    assert.equal(menu.hidden, true);
    name.focus();
    name.dispatchEvent(new o.w.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    assert.equal(menu.hidden, false, 'Space opens it from the keyboard');
    assert.equal(o.w.document.activeElement, menu.querySelector('a'), 'at its first link');
    o.w.document.dispatchEvent(new o.w.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(menu.hidden, true);
    assert.equal(o.w.document.activeElement, name, 'and Escape brings focus back to the name');
    toggle.dispatchEvent(new o.w.MouseEvent('click', { bubbles: true, detail: 1 }));
    menu.querySelector('[data-open-drawer]').click();
    await wait(20);
    assert.equal(menu.hidden, true, 'the menu folds as the drawer opens');
    assert.ok(overlay.open, 'its drawer opens over the page');
    assert.equal(o.w.document.querySelectorAll('#drawer-dialog').length, 1, 'in the same box');
    overlay.querySelector('.house-close').click();
    assert.equal(o.w.document.activeElement, name, 'and gives focus back to The House');
    // The site's menu has the same two under The House.
    const side = o.q('#site-drawer .drawer-house');
    assert.equal(side.tagName, 'DETAILS');
    assert.deepEqual([...side.querySelectorAll('a')].map((a) => a.getAttribute('href')), ['/house/', '/house/#drawer']);
    side.querySelector('[data-open-drawer]').click();
    await wait(20);
    assert.ok(overlay.open, 'the site\'s menu opens it too');
    overlay.querySelector('.house-close').click();
    o.dom.window.close();

    // In The House the menu opens the room's own drawer over the door, and
    // the door is still there when it closes.
    const h = house();
    await tick();
    h.w.eval(scripts.nav);
    h.q('.nav-house-toggle').dispatchEvent(new h.w.MouseEvent('click', { bubbles: true, detail: 1 }));
    h.q('#nav-house-menu [data-open-drawer]').click();
    assert.equal(h.q('#house-dialog').open, true);
    assert.equal(h.q('#house-dialog-title').textContent, 'Your drawer');
    assert.equal(h.q('#drawer-dialog'), null, 'The House uses its own box');
    assert.equal(h.q('#house-entrance').hidden, false, 'over the door');
    h.click('#house-close');
    assert.equal(h.q('#house-entrance').hidden, false, 'which is still there');
    assert.equal(h.w.location.hash, '');
    h.dom.window.close();
  }

  // The pointer's trail. A mouse lays one canvas over the page that nothing
  // can land on; a finger, a reader who asked for less motion, and a pointer
  // over an open dialog get none.
  assert.match(read(site, 'house', 'index.html'), /<script src="\/js\/cursor-trail\.js/, 'The House leaves a trail');
  const trail = (reduce) => {
    const t = page('house/index.html', 'https://hakanaltun.io/house/');
    t.w.matchMedia = () => ({ matches: reduce });
    t.w.requestAnimationFrame = () => 0;
    t.w.HTMLCanvasElement.prototype.getContext = () => ({});
    t.w.eval(read(root, 'js', 'cursor-trail.js'));
    t.move = (pointerType, on = t.q('#house-scene')) => on.dispatchEvent(new t.w.PointerEvent('pointermove', { pointerType, clientX: 40, clientY: 40, bubbles: true }));
    return t;
  };
  let t = trail(false);
  t.move('touch');
  t.move('pen');
  assert.equal(t.q('canvas.cursor-trail'), null, 'no trail behind a finger or a pen');
  t.q('#house-dialog').setAttribute('open', '');
  t.move('mouse', t.q('#house-dialog-title'));
  assert.equal(t.q('canvas.cursor-trail'), null, 'none under an open dialog');
  t.q('#house-dialog').removeAttribute('open');
  t.move('mouse');
  t.move('mouse');
  assert.equal(t.w.document.querySelectorAll('canvas.cursor-trail').length, 1, 'one canvas behind a mouse');
  assert.equal(t.q('canvas.cursor-trail').style.pointerEvents, 'none', 'that nothing can land on');
  assert.equal(t.q('canvas.cursor-trail').getAttribute('aria-hidden'), 'true');
  t.dom.window.close();
  // At the door the trail's colour is none (css/house.css), and it leaves none.
  t = trail(false);
  t.q('#house-entrance').style.setProperty('--trail', 'none');
  t.move('mouse', t.q('#house-entrance'));
  t.move('mouse', t.q('#house-entrance'));
  assert.equal(t.q('canvas.cursor-trail'), null, 'none at the door');
  t.dom.window.close();
  t = trail(true);
  t.move('mouse');
  assert.equal(t.q('canvas.cursor-trail'), null, 'and none for a reader who asked for less motion');
  t.dom.window.close();

  console.log('House: catalog and addresses, daily room, keeping from the room and from words, quizzes, the book and essays, the passage prompt on word stories and quiz notes, the kept passage\'s panel, its note and the way on to The Page, Highlight and its clearing, the small box by a highlight, hidden highlights, a note written before keeping, notes in the drawer, legacy and hostile records, blocked storage, arrivals, #drawer, export and backup offered only where they work, the moon, the planets after dark, weather at the window, the footer\'s snow and rain under both rooms, what the balcony\'s sound is told, the balcony, its glass, its door, its sky and its lamp, its notebook, a kept page left open in it, and the way on to The Page, Moris on the chair and by the glass, quiet places and a remembered Show places to look, the ways back to the study, the balcony, the drawer as it was and the page a note was written on, the pointer\'s trail, in the rooms only, and the drawer over any page from the header, the site\'s menu and the footer passed.');
})().catch((error) => { console.error(error); process.exit(1); });

