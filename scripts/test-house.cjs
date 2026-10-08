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
  house: read(root, 'js', 'house.js'),
  trivia: read(root, 'js', 'trivia.js'),
  translate: read(root, 'js', 'reader-translate.js'),
  snow: read(root, 'js', 'let-it-snow.js')
};
const catalogText = read(site, 'house', 'catalog.json');
const catalog = JSON.parse(catalogText);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function page(file, url, { saved, blocked = false, run = [] } = {}) {
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
    ? { ok: true, json: () => Promise.resolve(JSON.parse(catalogText)) }
    : { ok: false, json: () => Promise.resolve({}) });
  if (saved !== undefined) w.localStorage.setItem(KEY, saved);
  if (blocked) Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('Denied', 'SecurityError'); } });
  for (const name of run) w.eval(scripts[name]);
  const q = (s) => w.document.querySelector(s);
  const click = (s) => { const node = typeof s === 'string' ? q(s) : s; assert.ok(node, String(s)); node.click(); };
  const stored = () => JSON.parse(w.localStorage.getItem(KEY));
  return { dom, w, q, click, stored };
}
const house = (options = {}) => page('house/index.html', options.url || 'https://hakanaltun.io/house/', { ...options, run: ['keep', 'astronomy', 'house'] });

(async () => {
  // Every instrument keeps the return destination tied to this visit's URL.
  const toolSlugs = [...read(root, '_data', 'tools.yml').matchAll(/^- slug: (\S+)/gm)].map(m => m[1]);
  for (const slug of toolSlugs) {
    for (const from of ['', '?from=house', '?from=elsewhere']) {
      const p = page(slug + '/index.html', 'https://hakanaltun.io/' + slug + '/' + from);
      p.w.eval(p.q('script[data-tool-return]').textContent);
      const back = p.q('.tools-link');
      const fromHouse = from === '?from=house';
      assert.equal(back.getAttribute('href'), fromHouse ? '/house/#study' : '/tools/', slug + from);
      assert.equal(back.textContent.trim(), fromHouse ? '←\u200aThe House' : '←\u200ainstruments');
      assert.equal(back.getAttribute('aria-label'), fromHouse ? 'Back to The House study' : 'All the instruments');
      p.dom.window.close();
    }
  }
  const room = new JSDOM(read(site, 'house/index.html'));
  const roomLinks = [...room.window.document.querySelectorAll('a'), ...room.window.document.querySelector('#house-window').content.querySelectorAll('a')];
  for (const link of roomLinks) {
    const url = new URL(link.getAttribute('href'), 'https://hakanaltun.io');
    if (!toolSlugs.some(slug => url.pathname === '/' + slug + '/')) continue;
    assert.equal(url.searchParams.get('from'), 'house', url.href);
    assert.ok(url.searchParams.get('v'), 'a House visit loads the current instrument page');
  }
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
  a.click('#house-enter');
  assert.equal(a.q('#study').hidden, false);
  assert.equal(a.w.location.hash, '#study');
  assert.match(a.q('#house-hour').textContent, /in İstanbul$/);
  assert.ok(['sill', 'shelf', 'cushion', 'rug'].includes(a.q('#house-scene').dataset.moris));

  a.click('[data-open="words"]');
  assert.equal(a.q('#house-dialog').open, true);
  const cards = a.w.document.querySelectorAll('#house-dialog-content .house-word-card');
  assert.equal(cards.length, 3, 'three cards on the desk');
  const todaysWords = Array.from(cards, (c) => c.querySelector('h3').textContent);
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
  for (const slug of ['sun', 'stars', 'twilight']) {
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
  // The moon is in the window only while it is above İstanbul's horizon.
  // Altitudes from PyEphem, airless, for the moon's centre.
  const A = a.w.OLAE_ASTRO;
  for (const [at, altitude] of [['2026-10-03T05:30Z', 63.59], ['2026-10-07T20:30Z', -41.59], ['2026-09-25T16:10Z', 9.48]]) {
    assert.ok(Math.abs(A.moonAltitude(new Date(at), 41.015, 28.979) - altitude) < 0.5, 'the moon at ' + at);
  }
  assert.equal(a.q('#house-scene').dataset.moon === 'up', A.moonAltitude(new Date(), 41.015, 28.979) > A.MOON_HORIZON);
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
  a = house({ saved: JSON.stringify({ v: 2, kept, lamp: 'on', seen: 'x', answered: 5 }) });
  await tick();
  assert.equal(a.q('[data-kept-count]').textContent, '3');
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
  a.dom.window.close();

  // --- Since the last visit --------------------------------------------------
  const allIds = [].concat(...['pieces', 'words', 'notes', 'quizzes'].map((k) => catalog[k].map((x) => x.id)));
  const newWord = catalog.words[catalog.words.length - 1];
  const newPiece = catalog.pieces[0];
  const known = allIds.filter((id) => id !== newWord.id && id !== newPiece.id);
  a = house({ saved: JSON.stringify({ kept: [], seen: { day: '2000-01-01', known, fresh: [] } }) });
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

  // --- Keeping from the rest of the site ------------------------------------------
  const word = catalog.words.find((w) => w.id === 'word-serendipity');
  let p = page('word/serendipity/index.html', 'https://hakanaltun.io/word/serendipity/', { run: ['keep'] });
  const wordButton = p.q('[data-keep-button]');
  assert.equal(wordButton.textContent, 'Keep this word');
  p.click(wordButton);
  assert.equal(p.stored().kept[0].id, 'word-serendipity');
  assert.equal(p.stored().kept[0].quote, word.description);
  assert.equal(wordButton.getAttribute('aria-pressed'), 'true');
  assert.equal(p.q('.keep-toast a').getAttribute('href'), '/house/#drawer');
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
  assert.ok(p.w.document.querySelectorAll('.house-weather line').length > 0, 'rain at the window');
  assert.equal(p.q('#let-it-rain').getAttribute('aria-pressed'), 'true');
  assert.equal(p.q('#house-status').textContent, 'Light rain at the study window.');
  p.click('#let-it-snow');
  assert.equal(p.q('#house-scene').dataset.weather, 'snow', 'snow takes over from rain');
  assert.equal(p.w.document.querySelectorAll('.house-weather line').length, 0);
  assert.ok(p.w.document.querySelectorAll('.house-weather circle').length > 0);
  p.click('#let-it-snow');
  p.click('#let-it-snow');
  assert.equal(p.q('#house-scene').dataset.weather, undefined, 'and the sky clears');
  assert.equal(p.w.document.querySelectorAll('.house-weather *').length, 0);
  assert.equal(p.q('canvas.snowfall'), null);
  p.dom.window.close();

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
  t = trail(true);
  t.move('mouse');
  assert.equal(t.q('canvas.cursor-trail'), null, 'and none for a reader who asked for less motion');
  t.dom.window.close();

  console.log('House: catalog and addresses, daily room, keeping from the room and from words, quizzes, the book and essays, legacy and hostile records, blocked storage, arrivals, #drawer, export and backup offered only where they work, the moon, the planets after dark, weather at the window, and the pointer\'s trail passed.');
})().catch((error) => { console.error(error); process.exit(1); });
