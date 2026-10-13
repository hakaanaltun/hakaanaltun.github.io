/* The Desk's two places: either can hold any instrument, the same one on
   both sides included, and each instance keeps its own storage. Runs
   js/desk.js against the built desk page; the instruments' frames are not
   loaded, so only the desk itself is checked here. Run
   `bundle exec jekyll build` first. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const site = path.join(root, '_site');
if (!fs.existsSync(path.join(site, 'desk', 'index.html'))) {
  console.error('test-desk: run `bundle exec jekyll build` first');
  process.exit(1);
}
const deskJs = fs.readFileSync(path.join(root, 'js', 'desk.js'), 'utf8');
const KEY = 'olae-desk-layout-v1';

function desk(saved) {
  const dom = new JSDOM(fs.readFileSync(path.join(site, 'desk', 'index.html'), 'utf8'), { url: 'https://hakanaltun.io/desk/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  // The frames stay empty here; the desk waits for them without a clock.
  w.setTimeout = () => 0;
  if (saved !== undefined) w.localStorage.setItem(KEY, JSON.stringify(saved));
  w.eval(deskJs);
  const shown = () => [...w.document.querySelectorAll('.panel')].filter((p) => !p.hidden).sort((a, b) => a.dataset.slot - b.dataset.slot);
  const choose = (slot, slug) => {
    const select = shown()[slot].querySelector('select');
    select.value = slug;
    select.dispatchEvent(new w.Event('change'));
  };
  const frames = () => shown().map((p) => p.querySelector('iframe').getAttribute('src'));
  const stored = () => JSON.parse(w.localStorage.getItem(KEY));
  return { dom, w, shown, choose, frames, stored };
}

// The first desk: the Reader beside The Page.
let d = desk();
assert.deepEqual(d.shown().map((p) => p.id), ['panel-read', 'panel-write']);

// The Reader on both sides: a second instance, with its own keys.
d.choose(1, 'read');
assert.deepEqual(d.shown().map((p) => p.id), ['panel-read', 'panel-read-2'], 'both places hold The Reader');
assert.match(d.frames()[0], /^\/read\/\?desk=1&v=/);
assert.match(d.frames()[1], /^\/read\/\?desk=1&pane=2&v=/, 'the second Reader is told it is the second');
assert.equal(d.w.document.getElementById('desk-status').textContent, 'The Reader on both sides of the desk.');
assert.deepEqual(d.stored().order, ['read:1', 'read:2']);
assert.equal(d.shown()[1].getAttribute('aria-label'), 'The Reader, right pane');
assert.equal(d.w.document.getElementById('divider').getAttribute('aria-controls'), 'panel-read panel-read-2');

// Away and back: the second Reader is still there, not opened again.
const second = d.shown()[1].querySelector('iframe');
d.choose(1, 'write');
assert.deepEqual(d.shown().map((p) => p.id), ['panel-read', 'panel-write'], 'The Page that was there comes back');
d.choose(1, 'read');
assert.equal(d.shown()[1].querySelector('iframe'), second, 'and the second Reader returns as it was');

// Swapping exchanges the two whole.
d.w.document.getElementById('swap').click();
assert.deepEqual(d.stored().order, ['read:2', 'read:1']);
assert.deepEqual(d.shown().map((p) => p.id), ['panel-read-2', 'panel-read']);

// Choosing the left Reader's instrument again changes nothing.
d.choose(0, 'read');
assert.deepEqual(d.stored().order, ['read:2', 'read:1']);

// Two Pages and two Draws as well.
d.choose(0, 'write');
d.choose(1, 'write');
assert.deepEqual(d.shown().map((p) => p.id), ['panel-write', 'panel-write-2']);
assert.match(d.frames()[1], /^\/write\/\?desk=1&pane=2&/);
d.choose(0, 'draw');
d.choose(1, 'draw');
assert.deepEqual(d.stored().order, ['draw:1', 'draw:2']);
d.dom.window.close();

// A layout kept before October 2026 named instruments alone.
d = desk({ order: ['draw', 'read'], ratio: 40 });
assert.deepEqual(d.shown().map((p) => p.id), ['panel-draw', 'panel-read']);
d.dom.window.close();
// The same instance twice, written by hand, becomes two.
d = desk({ order: ['read:1', 'read:1'] });
assert.deepEqual(d.shown().map((p) => p.id), ['panel-read', 'panel-read-2']);
d.dom.window.close();
// Anything else is set aside for the first desk.
for (const bad of [{ order: ['read:3', 'write'] }, { order: ['desk', 'read'] }, { order: 'read' }, null]) {
  d = desk(bad);
  assert.deepEqual(d.shown().map((p) => p.id), ['panel-read', 'panel-write'], JSON.stringify(bad));
  d.dom.window.close();
}

// Inside a frame, the second instance has keys of its own.
const embed = fs.readFileSync(path.join(root, '_includes', 'desk-embed.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function embedded(search) {
  const location = { origin: 'https://hakanaltun.io', search };
  const window = { parent: { location, OLAE_DESK: { restore() {} } } };
  vm.runInNewContext(embed, { window, location, document: { documentElement: { classList: { add() {} }, style: { setProperty() {} }, setAttribute() {} }, addEventListener() {} }, URLSearchParams, requestAnimationFrame: (fn) => fn() });
  return window.OLAE_DESK_EMBED;
}
assert.equal(embedded('?desk=1').key('olae-desk-page-v1'), 'olae-desk-page-v1', 'the first instance keeps the keys the desk always had');
assert.equal(embedded('?desk=1&pane=2').key('olae-desk-page-v1'), 'olae-desk-page-v1-2');
assert.equal(embedded('?desk=1&pane=9').key('olae-desk-read-pos'), 'olae-desk-read-pos', 'only a second instance is known');
const uses = {
  'write/index.html': 'OLAE_DESK_EMBED.key("olae-desk-page-v1")',
  'draw/index.html': 'OLAE_DESK_EMBED.key("olae-desk-draw-v1")',
  'read/index.html': 'OLAE_DESK_EMBED.key("olae-desk-read-pos")'
};
for (const [file, call] of Object.entries(uses)) assert.ok(fs.readFileSync(path.join(root, file), 'utf8').includes(call), file + ' keeps its own work in a second instance');
assert.ok(fs.readFileSync(path.join(root, 'read', 'index.html'), 'utf8').includes('OLAE_DESK_EMBED.key("olae-read-size")'), 'and a second Reader its own type size');

console.log('Desk checks passed: the same instrument on both sides, second instances with their own keys, returning to an instance put away, swapping, and layouts kept before.');
