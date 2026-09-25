/* The drawer is visitor-owned state. Exercise it against Jekyll's actual
   output, including denied storage and records left by an older version. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, '_site/house/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/house.js'), 'utf8');
const key = 'olae-house-v1';
function boot(saved, blocked = false) {
  const dom = new JSDOM(html, { url: 'https://hakanaltun.io/house/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  w.setInterval = () => 0;
  if (saved !== undefined) w.localStorage.setItem(key, saved);
  if (blocked) Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('Denied', 'SecurityError'); } });
  w.eval(script);
  const q = (s) => w.document.querySelector(s);
  const click = (s) => { assert.ok(q(s), s); q(s).click(); };
  return { dom, w, q, click };
}
let a = boot();
a.click('#house-enter');
assert.equal(a.q('#study').hidden, false);
assert.equal(a.w.location.hash, '#study');
a.click('[data-open="books"]');
assert.equal(a.q('#house-dialog').open, true);
a.click('[data-keep="book-fragments"]');
assert.equal(a.q('[data-kept-count]').textContent, '1');
assert.equal(a.q('[data-keep="book-fragments"]').getAttribute('aria-pressed'), 'true');
const saved = a.w.localStorage.getItem(key);
a.click('#house-close');
a.click('[data-open="drawer"]');
assert.match(a.q('#house-dialog-content').textContent, /First there was Symmetry/);
assert.equal(a.q('#house-dialog-content a').getAttribute('href'), '/book/part-one/#point-zero');
a.dom.window.close();
a = boot(saved);
assert.equal(a.q('[data-kept-count]').textContent, '1');
assert.equal(a.q('#house-welcome').textContent, 'Welcome back.');
a.click('[data-open="drawer"]');
a.click('[data-remove="book-fragments"]');
assert.deepEqual(JSON.parse(a.w.localStorage.getItem(key)).kept, []);
assert.match(a.q('#house-dialog-content').textContent, /Nothing here yet/);
assert.equal(a.w.document.activeElement.id, 'house-close');
a.click('#house-close');
a.click('[data-open="question"]');
a.click('[data-answer="other"]');
assert.equal(a.q('.house-answer-note').hidden, false);
assert.match(a.q('.house-answer-result').textContent, /The Great Bell/);
assert.equal(a.q('[data-answer="correct"]').dataset.result, 'correct');
a.click('[data-keep="trivia-big-ben"]');
a.click('#house-close');
a.click('[data-open="question"]');
assert.equal(a.q('.house-answer-note').hidden, false);
assert.equal(a.q('[data-keep="trivia-big-ben"]').getAttribute('aria-pressed'), 'true');
a.click('#house-close');
a.click('#house-lamp');
assert.equal(typeof JSON.parse(a.w.localStorage.getItem(key)).lamp, 'boolean');
// Storage changes from another tab also update the visible drawer.
a.click('[data-open="drawer"]');
a.w.localStorage.setItem(key, JSON.stringify({ kept: ['word-serendipity'], lamp: false }));
a.w.dispatchEvent(new a.w.StorageEvent('storage', { key }));
assert.match(a.q('#house-dialog-content').textContent, /serendipity/);
assert.equal(a.q('#house-lamp').getAttribute('aria-pressed'), 'false');
a.dom.window.close();
for (const bad of ['{bad', 'null', '42', JSON.stringify({ kept: ['constructor', '__proto__', 'gone', 'book-fragments', 'book-fragments'], lamp: 'on' })]) {
  a = boot(bad);
  a.click('[data-open="drawer"]');
  assert.ok(Number(a.q('[data-kept-count]').textContent) <= 1);
  a.dom.window.close();
}
a = boot(undefined, true);
a.click('[data-open="words"]');
a.click('[data-keep="word-serendipity"]');
assert.equal(a.q('[data-kept-count]').textContent, '1');
assert.match(a.q('#house-dialog-status').textContent, /only until you leave/);
a.click('#house-close');
a.click('[data-open="drawer"]');
assert.match(a.q('#house-dialog-content').textContent, /cannot save/);
a.dom.window.close();
// Every hand-selected destination must resolve in the built site.
const doc = new JSDOM(html).window.document;
for (const template of doc.querySelectorAll('template')) {
  for (const link of template.content.querySelectorAll('a[href^="/"]')) {
    const url = new URL(link.href, 'https://hakanaltun.io');
    const file = path.join(root, '_site', url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname);
    assert.ok(fs.existsSync(file), 'Broken House link: ' + url.pathname);
    if (url.hash) {
      const target = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
      assert.ok(target.getElementById(url.hash.slice(1)), 'Missing anchor: ' + url.href);
    }
  }
}
assert.equal(doc.querySelectorAll('#house-words').length, 1);
assert.equal(doc.querySelector('#house-words').content.querySelectorAll('[data-house-item]').length, 3);
console.log('House: persistence, removals, quiz, cross-tab updates, denied/malformed storage, and destinations passed.');
