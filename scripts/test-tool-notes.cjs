/* The notes and questions under every instrument (_includes/tool-notes.html):
   folded away until the reader asks, opened and folded by "notes &
   questions", opened by a link to them, and never there in full screen. And
   a page turned inside a pane of The Desk scrolls that pane alone. Runs
   against the built pages: run `bundle exec jekyll build` first. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const site = path.join(root, '_site');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
if (!fs.existsSync(path.join(site, 'tools', 'index.html'))) {
  console.error('test-tool-notes: run `bundle exec jekyll build` first');
  process.exit(1);
}
const slugs = [...read(root, '_data', 'tools.yml').matchAll(/^- slug: (\S+)/gm)].map((m) => m[1]);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function page(slug, url = 'https://hakanaltun.io/' + slug + '/', before) {
  const html = read(site, slug, 'index.html');
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () { w.__scrolledTo = this; };
  if (before) before(w);
  const code = [...html.matchAll(/<script data-tool-notes>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(code.length, 1, slug + ' carries the notes behaviour once');
  // document.currentScript is the include's own script while it runs.
  const tag = w.document.querySelector('script[data-tool-notes]');
  Object.defineProperty(w.document, 'currentScript', { configurable: true, get: () => tag });
  w.eval(code[0]);
  const q = (s) => w.document.querySelector(s);
  return { dom, w, q, notes: q('.notes'), cue: () => q('.notes-toggle') };
}

(async () => {
  for (const slug of slugs) {
    const p = page(slug);
    const { notes, w } = p;
    assert.ok(notes, slug + ' has its notes');
    assert.ok(notes.contains(p.q('script[data-tool-notes]')), slug + ': the include stands inside the notes');
    assert.ok(notes.hasAttribute('hidden'), slug + ': the notes wait folded');
    assert.equal(notes.id, 'notes');
    const cue = p.cue();
    assert.ok(cue, slug + ': there is a way to open them');
    assert.equal(cue.getAttribute('aria-controls'), 'notes');
    assert.equal(cue.getAttribute('aria-expanded'), 'false');
    assert.equal(cue.textContent.replace(/\s+/g, ' ').trim(), 'notes & questions ↓');
    assert.ok(!notes.contains(cue), slug + ': the way in stands outside the notes');
    cue.click();
    assert.ok(!notes.hasAttribute('hidden'), slug + ': "notes & questions" opens them');
    assert.equal(cue.getAttribute('aria-expanded'), 'true');
    assert.equal(cue.textContent.replace(/\s+/g, ' ').trim(), 'notes & questions ↑');
    assert.equal(w.__scrolledTo, notes, slug + ': and brings them into view');
    cue.click();
    assert.ok(notes.hasAttribute('hidden'), slug + ': and folds them again');
    // Full screen, native or the instrument's own, puts them away.
    w.document.body.classList.add('immersive');
    await tick();
    assert.ok(w.document.documentElement.classList.contains('tool-full'), slug + ': full screen is seen');
    w.document.body.classList.remove('immersive');
    await tick();
    assert.ok(!w.document.documentElement.classList.contains('tool-full'));
    Object.defineProperty(w.document, 'fullscreenElement', { configurable: true, get: () => w.document.documentElement });
    w.document.dispatchEvent(new w.Event('fullscreenchange'));
    assert.ok(w.document.documentElement.classList.contains('tool-full'), slug + ': native full screen as well');
    p.dom.window.close();

    // A link straight to the notes, or into them, opens them.
    const linked = page(slug, 'https://hakanaltun.io/' + slug + '/#notes');
    assert.ok(!linked.notes.hasAttribute('hidden'), slug + ': /#notes arrives open');
    assert.equal(linked.cue().getAttribute('aria-expanded'), 'true');
    linked.dom.window.close();
  }

  // The rules that put the notes away hold every opener and every full screen.
  const css = read(root, '_includes', 'tool-notes.html');
  for (const rule of ['html.tool-full .notes', 'html.tool-full .notes-toggle', 'body.immersive .notes', 'body.immersive .notes-toggle', 'html.in-desk .notes-open-row']) {
    assert.ok(css.includes(rule), rule);
  }
  assert.ok(/\.notes\[hidden\]:not\(\[hidden="until-found"\]\)\{ display:none; \}/.test(css), 'plain hidden notes take no room');
  assert.ok(css.includes("'onbeforematch' in notes"), 'until-found is used only where the browser knows it');

  // A page turned in a Reader, or a heading reached from its contents,
  // scrolls the Reader's own window: scrollIntoView would move The Desk
  // around it.
  for (const file of ['js/reader-pdf.js']) assert.ok(!/\.scrollIntoView\(/.test(read(root, file)), file + ' scrolls only its own window');
  const reader = read(root, 'read', 'index.html');
  const goTo = reader.slice(reader.indexOf('function goTo('), reader.indexOf('article.addEventListener("click"'));
  assert.ok(goTo && !/\.scrollIntoView\(/.test(goTo), 'the Reader\'s contents scroll only its own window');

  console.log('Tool notes checks passed: on every instrument the notes wait folded, open and fold from "notes & questions", open from a link, and leave in full screen; a Reader in a pane scrolls only itself.');
})().catch((error) => { console.error(error); process.exit(1); });
