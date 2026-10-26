/* The rendered document is also the no-JavaScript reading version. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, '_site/pictures/black-hole/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/pictures.js'), 'utf8');
function page(modals, setup) {
  const dom = new JSDOM(html, { url: 'https://hakanaltun.io/pictures/black-hole/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  if (modals) {
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  } else { w.HTMLDialogElement.prototype.showModal = undefined; }
  if (setup) setup(w);
  w.eval(script);
  return { dom, w, d: w.document };
}
{
  const { dom, d } = page(false);
  assert.equal(d.body.classList.contains('picture-ready'), false);
  assert.equal(d.querySelector('#picture-places').hidden, true);
  assert.equal(d.querySelector('#picture-fullscreen').hidden, true);
  for (const link of d.querySelectorAll('.picture-choices a')) {
    const note = d.querySelector(link.getAttribute('href'));
    assert.ok(note && note.querySelector('article').textContent.trim());
    assert.equal(new URL(note.querySelector('.picture-detail-sources a').href).protocol, 'https:');
  }
  for (const part of d.querySelectorAll('.picture-story-part')) {
    assert.ok(part.querySelector('p').textContent.trim());
    assert.ok(part.querySelector('.picture-story-sources a'), 'each part of the story has its sources beneath it');
  }
  // A label that would cover a thin line sits beside it.
  assert.equal(d.querySelector('.picture-hotspot[data-detail="photon-ring"]').dataset.labelSide, 'right');
  // A label that shows opens its detail like its area, which matters most for
  // a label beside its place; a hidden one takes no clicks.
  {
    const css = fs.readFileSync(path.join(root, 'css/pictures.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(css, /\.picture-hotspot-label \{[^}]*pointer-events:none/, 'a hidden label takes no clicks');
    for (const shown of [/\.show-places \.picture-hotspot-label \{[^}]*\}/, /\.picture-hotspot:hover \.picture-hotspot-label \{[^}]*\}/, /\.picture-hotspot:focus-visible \.picture-hotspot-label,[^{]*\{[^}]*\}/]) {
      const rule = css.match(shown);
      assert.ok(rule && /opacity:1/.test(rule[0]) && /pointer-events:auto/.test(rule[0]), 'a shown label takes clicks: ' + shown);
    }
  }
  // The story opens with the picture's own history: Luminet, then the EHT.
  const parts = [...d.querySelectorAll('.picture-story-part p')].map(p => p.textContent);
  assert.match(parts[0], /Luminet/);
  assert.match(parts[1], /Event Horizon Telescope/);
  const index = JSON.parse(fs.readFileSync(path.join(root, '_site/search-index.json'), 'utf8'));
  assert.ok(index.find(item => item.url === '/pictures/black-hole/').text.includes('Luminet'));
  dom.window.close();
}
// Pointer selection leaves the focus position intact, including after a
// modal closes. Switching back to the keyboard restores visible focus.
{
  const { dom, d, w } = page(true);
  const trigger = d.querySelector('[data-detail]');
  trigger.dispatchEvent(new w.Event('pointerdown', { bubbles: true }));
  trigger.click();
  d.querySelector('#picture-return').click();
  assert.equal(d.activeElement, trigger);
  assert.ok(d.body.hasAttribute('data-picture-pointer'));
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  assert.equal(d.body.hasAttribute('data-picture-pointer'), false);
  trigger.click();
  d.querySelector('#picture-return').click();
  assert.equal(d.activeElement, trigger);
  assert.equal(d.body.hasAttribute('data-picture-pointer'), false);
  dom.window.close();
}
{
  const { dom, d } = page(true);
  const dialog = d.querySelector('#picture-detail');
  const controls = d.querySelector('#picture-places');
  assert.equal(d.body.classList.contains('picture-ready'), true);
  assert.equal(controls.getAttribute('aria-pressed'), 'false');
  controls.click();
  assert.equal(d.querySelector('#picture-visit').classList.contains('show-places'), true);
  assert.equal(controls.getAttribute('aria-pressed'), 'true');
  assert.equal(dom.window.localStorage.getItem('olae-places'), 'shown', 'the browser remembers the names');
  controls.click();
  assert.equal(controls.getAttribute('aria-pressed'), 'false');
  assert.equal(dom.window.localStorage.getItem('olae-places'), null, 'until they are hidden');
  // The close view is at the top of the dialog every time it opens: the
  // reset has to happen while the dialog is open, or a phone reader who
  // scrolled down to leave meets the next detail scrolled the same way.
  const resets = [];
  Object.defineProperty(dialog, 'scrollTop', { configurable: true, get() { return 0; }, set(value) { resets.push([value, dialog.open]); } });
  for (const trigger of d.querySelectorAll('[data-detail]')) {
    resets.length = 0;
    trigger.click();
    assert.deepEqual(resets.at(-1), [0, true], 'the dialog is scrolled to its top once it is open');
    const note = d.getElementById('note-' + trigger.dataset.detail);
    assert.equal(dialog.open, true);
    assert.equal(dialog.querySelector('h2').textContent, note.querySelector('h2').textContent);
    assert.equal(dialog.querySelector('.picture-detail-body').textContent, note.querySelector('.picture-detail-body').textContent);
    assert.equal(dialog.querySelector('.picture-detail-sources a').href, note.querySelector('.picture-detail-sources a').href);
    assert.equal(d.querySelector('#picture-detail-image').getAttribute('aria-label'), note.dataset.alt);
    d.querySelector('#picture-return').click();
    assert.equal(dialog.open, false);
    assert.equal(d.activeElement, trigger);
  }
  d.querySelector('#picture-how').click();
  assert.equal(d.querySelector('#picture-help').open, true);
  d.querySelector('#picture-help-close').click();
  assert.equal(d.activeElement.id, 'picture-how');
  dom.window.close();
}
// The homepage carries the section under Words with Stories, and every
// homepage section is named in exactly one of the voices in style.css, the
// colour of its section's own page. A section added without its colour, or
// one that stands next to its own colour, fails here.
{
  const home = new JSDOM(fs.readFileSync(path.join(root, '_site/index.html'), 'utf8')).window.document;
  const order = [...home.querySelectorAll('main section[id]')].filter(s => !s.parentElement.closest('section')).map(s => s.id);
  assert.equal(order[order.indexOf('words-with-stories') + 1], 'pictures-with-stories', 'Pictures with Stories follows Words with Stories');
  assert.ok(home.querySelector('#pictures-with-stories a.home-picture-card[href="/pictures/black-hole/"] img'));
  // The journey takes its turn too, with the downscales its card needs.
  assert.ok(home.querySelector('#pictures-with-stories a.home-picture-card[href="/pictures/space/"] img[srcset*="/pictures/space/assets/480/"]'));
  const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  // Each voice is a rule whose selectors end in { --sec-h: N; ... }. The ids a
  // voice names on the homepage are the bare ones; an id with an attribute
  // after it (the quotes' data-voice) is a colour the script switches to.
  const voiceOf = {};
  for (const m of css.matchAll(/([^{}]+)\{\s*--sec-h:\s*(\d+);\s*--sec-c:\s*([\d.]+);/g)) {
    const voice = m[2] + '/' + m[3];
    for (const sel of m[1].split(/,(?![^(]*\))/)) {
      if (!/body\.is-home\s/.test(sel)) continue;
      for (const id of sel.matchAll(/#([a-z][\w-]*)(?![\w[-])/g)) {
        assert.ok(!(id[1] in voiceOf) || voiceOf[id[1]] === voice, id[1] + ' is named in one voice only');
        voiceOf[id[1]] = voice;
      }
    }
  }
  order.forEach((id, i) => {
    assert.ok(id in voiceOf, id + ' has a voice in style.css');
    if (i) assert.notEqual(voiceOf[id], voiceOf[order[i - 1]], id + ' does not share a colour with ' + order[i - 1]);
  });
  // Homepage sections retain their voices; the menu inherits its page accent.
  assert.ok(/body\.is-home #main > section \{\s*--sec-accent:/.test(css));
  assert.ok(!css.includes('.drawer-body [data-voice'), 'menu inherits the page accent');
  for (const theme of ['dark', 'sky', 'midnight']) {
    assert.ok(css.includes('html[data-theme="' + theme + '"] body.is-home #main > section {'));
  }
  assert.ok(order.every(id => home.getElementById(id).parentElement.id === 'main'), 'every homepage section stands directly in main');
  // A quote takes the colour of the page it comes from.
  const scripts = fs.readFileSync(path.join(root, '_includes/home-scripts.html'), 'utf8');
  assert.ok(/qSection\.setAttribute\('data-voice', pick\.v\)/.test(scripts), 'the quote marks its section with its voice');
  for (const v of ['writing', 'story']) {
    assert.ok(css.includes('#quotes[data-voice="' + v + '"]'), 'a ' + v + ' quote has its colour');
  }
  // The swatches on /themes/ are built from js/palettes.js's own table of the
  // voices and each palette's lightness. Until 23 October 2026 they were
  // hexes worked out once, and the fiction and The House had drifted to
  // colours they no longer wore. The table has to say what style.css says,
  // voice for voice, and show every voice the homepage speaks in.
  const palettesJs = fs.readFileSync(path.join(root, 'js/palettes.js'), 'utf8');
  const table = [...palettesJs.matchAll(/\{ label: '([^']+)',\s*page: '([\w-]+)',\s*h: (\d+), c: ([\d.]+), ld: ([\d.]+), cd: ([\d.]+), dl: (-?[\d.]+) \}/g)];
  assert.ok(table.length, 'js/palettes.js lists the voices');
  const ruleFor = (page) => {
    for (const m of css.matchAll(/([^{}]+)\{\s*--sec-h:\s*(\d+);\s*--sec-c:\s*([\d.]+);\s*--sec-ld:\s*([\d.]+);\s*--sec-cd:\s*([\d.]+);(?:\s*--sec-dl:\s*([^;]+);)?\s*\}/g)) {
      if (m[1].split(',').some(sel => [ 'body.series-' + page, 'body.is-home #' + page ].includes(sel.trim()))) return m;
    }
    return null;
  };
  for (const [, label, page, h, c, ld, cd, dl] of table) {
    const rule = ruleFor(page);
    assert.ok(rule, label + ': style.css has a voice for body.series-' + page + ' or #' + page);
    assert.deepEqual([+h, +c, +ld, +cd, +dl], [+rule[2], +rule[3], +rule[4], +rule[5], rule[6] ? +rule[6] : 0],
      label + '’s swatch on /themes/ matches its voice in style.css');
  }
  const swatched = new Set(table.map(m => m[3] + '/' + m[4]));
  for (const id of order) {
    assert.ok(swatched.has(voiceOf[id]), 'the voice of #' + id + ' has a swatch on /themes/');
  }
  // Each palette prints the voices at its own --sec-l.
  const levels = [...palettesJs.matchAll(/\{ name: '[^']+',\s*tag: '[^']+', l: ([\d.]+),/g)].map(m => +m[1]);
  const palettesCss = fs.readFileSync(path.join(root, 'css/palettes.css'), 'utf8');
  const lightRules = palettesCss.slice(palettesCss.indexOf('/* Light:'));
  const expected = [+lightRules.match(/--sec-l:\s*([\d.]+)/)[1]];
  for (let n = 2; n <= 12; n++) {
    expected.push(+palettesCss.match(new RegExp('html\\[data-palette="' + n + '"\\]\\s*\\{\\s*--sec-l:\\s*([\\d.]+)'))[1]);
  }
  assert.deepEqual(levels, expected, 'each palette on /themes/ uses its own --sec-l');
}
// The Sun now opens directly in the journey; the other pictures retain their pages.
{
 const dom=new JSDOM(fs.readFileSync(path.join(root,'_site/pictures/sun/index.html'),'utf8'));
 const d=dom.window.document;
 assert.equal(d.querySelector('meta[http-equiv="refresh"]').content,'0; url=/pictures/space/#sun');
 assert.equal(d.querySelector('link[rel="canonical"]').href,'https://hakanaltun.io/pictures/space/');
 const catalogue=new JSDOM(fs.readFileSync(path.join(root,'_site/pictures/index.html'),'utf8'));
 const space=catalogue.window.document.getElementById('picture-category-space').closest('section');
 assert.equal(space.querySelector('.picture-journey').getAttribute('href'),'/pictures/space/');
 assert.equal(space.querySelectorAll('.picture-card').length,2);
 assert(!space.querySelector('a[href="/pictures/sun/"]'));
 dom.window.close();catalogue.window.close();
}
// A picture opened from another in full screen fills the window at once, with
// the places to look if they were shown. The address loses both, and leaving
// full screen keeps the page where it is. The way back carries them again,
// and the way to all pictures does not.
async function arrivalChecks() {
  const sunHtml = fs.readFileSync(path.join(root, '_site/pictures/black-hole/index.html'), 'utf8');
  const dom = new JSDOM(sunHtml, { url: 'https://hakanaltun.io/pictures/black-hole/?screen=full&places=shown', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document;
  w.scrollTo = (x, y) => { w.restoredPosition = [x, y]; };
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  w.eval(script);
  const visit = d.getElementById('picture-visit');
  assert.equal(visit.classList.contains('is-fullscreen'), true);
  assert.equal(visit.classList.contains('show-places'), true);
  assert.equal(d.getElementById('picture-places').getAttribute('aria-pressed'), 'true');
  assert.equal(d.getElementById('picture-fullscreen').textContent, 'Exit full screen');
  assert.ok(d.querySelector('.picture-masthead').hasAttribute('inert'));
  assert.equal(w.location.href, 'https://hakanaltun.io/pictures/black-hole/');
  assert.equal(d.activeElement, d.body, 'arrival leaves focus with the page');
  let carried = null;
  w.addEventListener('click', event => { carried = event.target.getAttribute('href'); event.preventDefault(); });
  const mercury = d.createElement('a'); mercury.href='/pictures/space/#scene-mercury'; visit.append(mercury);
  mercury.click();
  assert.equal(carried, 'https://hakanaltun.io/pictures/space/?screen=full&places=shown#scene-mercury');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(mercury.getAttribute('href'), '/pictures/space/#scene-mercury', 'the link keeps its own address');
  d.querySelector('.picture-controls a[href="/pictures/"]').click();
  assert.equal(carried, '/pictures/');
  d.getElementById('picture-fullscreen').click();
  assert.equal(visit.classList.contains('is-fullscreen'), false);
  assert.equal(w.restoredPosition, undefined);
  d.getElementById('picture-places').click();
  mercury.click();
  assert.equal(carried, '/pictures/space/#scene-mercury', 'a plain view carries nothing');
  dom.window.close();
}
// Names shown in The House, the Farm House or another picture are shown here
// too, and a browser that blocks storage still shows them for the picture.
{
  let { dom, d } = page(true, (w) => w.localStorage.setItem('olae-places', 'shown'));
  assert.equal(d.querySelector('#picture-visit').classList.contains('show-places'), true);
  assert.equal(d.querySelector('#picture-places').getAttribute('aria-pressed'), 'true');
  assert.equal(d.querySelector('#picture-places').textContent, 'Hide places to look');
  dom.window.close();
  ({ dom, d } = page(true, (w) => Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('Denied', 'SecurityError'); } })));
  d.querySelector('#picture-places').click();
  assert.equal(d.querySelector('#picture-visit').classList.contains('show-places'), true);
  dom.window.close();
}
// If the script never comes, the layout's guard still shows the page.
{
  const sunHtml = fs.readFileSync(path.join(root, '_site/pictures/black-hole/index.html'), 'utf8');
  const dom = new JSDOM(sunHtml, { url: 'https://hakanaltun.io/pictures/black-hole/?screen=full', runScripts: 'dangerously' });
  assert.equal(dom.window.document.documentElement.hasAttribute('data-picture-arriving'), true);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  assert.equal(dom.window.document.documentElement.hasAttribute('data-picture-arriving'), false);
  dom.window.close();
}
async function fullscreenChecks() {
  function setup(w, native) {
    w.scrollTo = (x, y) => { w.restoredPosition = [x, y]; };
    Object.defineProperties(w, { scrollX: { value: 0 }, scrollY: { value: 180 } });
    const stage = w.document.querySelector('.picture-stage');
    w.stageSize = { width: 900, height: 500 };
    Object.defineProperties(stage, { clientWidth: { get: () => w.stageSize.width }, clientHeight: { get: () => w.stageSize.height } });
    w.visualViewport = new w.EventTarget();
    w.document.querySelector('.picture-story').setAttribute('inert', '');
    if (!native) return;
    let element = null;
    Object.defineProperties(w.document, {
      fullscreenEnabled: { value: true },
      fullscreenElement: { get: () => element }
    });
    w.document.getElementById('picture-visit').requestFullscreen = () => {
      if (native === 'reject') return Promise.reject(new Error('Full screen unavailable'));
      element = w.document.getElementById('picture-visit');
      w.document.dispatchEvent(new w.Event('fullscreenchange'));
      return Promise.resolve();
    };
    w.document.exitFullscreen = () => {
      element = null;
      w.document.dispatchEvent(new w.Event('fullscreenchange'));
      return Promise.resolve();
    };
  }
  for (const native of [false, true, 'reject']) {
    const { dom, d, w } = page(true, w => setup(w, native));
    const visit = d.getElementById('picture-visit');
    const control = d.getElementById('picture-fullscreen');
    assert.equal(control.hidden, false);
    assert.equal(visit.classList.contains('is-fullscreen'), false, 'full screen waits for the reader');
    control.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(control.getAttribute('aria-pressed'), 'true');
    assert.equal(control.disabled, false);
    assert.equal(visit.getAttribute('aria-modal'), 'true');
    assert.equal(d.activeElement, control);
    assert.ok(d.querySelector('.picture-masthead').hasAttribute('inert'));
    assert.equal(d.body.style.overflow, 'hidden');
    assert.ok(visit.contains(d.getElementById('picture-detail')), 'explanations belong inside the fullscreen element');
    const frame = d.querySelector('.picture-frame');
    const image = d.querySelector('.picture-image');
    assert.ok(parseFloat(frame.style.width) <= 900);
    assert.ok(parseFloat(frame.style.width) * image.height / image.width <= 500, 'the entire sheet fits without cropping');
    // Rotate to a short landscape stage, then back. Also cover the visual
    // viewport resize from mobile browser chrome without a window resize.
    for (const [width, height, target] of [[600, 350, w], [600, 300, w.visualViewport], [360, 620, w]]) {
      w.stageSize = { width, height };
      target.dispatchEvent(new w.Event('resize'));
      assert.equal(parseFloat(frame.style.width), Math.min(width, height * image.width / image.height));
    }
    const trigger = visit.querySelector('[data-detail]');
    trigger.click();
    assert.equal(d.getElementById('picture-detail').open, true);
    assert.ok(d.querySelector('#picture-detail-content .picture-detail-sources a'));
    d.querySelector('#picture-return').click();
    assert.equal(d.activeElement, trigger);
    d.getElementById('picture-places').click();
    if (native === true) {
      await d.exitFullscreen(); // Escape or another browser-driven exit.
    } else {
      d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    }
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(visit.classList.contains('is-fullscreen'), false);
    assert.equal(visit.classList.contains('show-places'), true, 'the hint choice survives exit');
    assert.equal(control.getAttribute('aria-pressed'), 'false');
    assert.equal(visit.hasAttribute('aria-modal'), false);
    assert.equal(d.querySelector('.picture-masthead').hasAttribute('inert'), false);
    assert.equal(d.querySelector('.picture-story').hasAttribute('inert'), true, 'previously inert content stays inert');
    assert.equal(d.body.style.overflow, '');
    assert.equal(frame.style.width, '');
    assert.deepEqual(w.restoredPosition, [0, 180]);
    assert.equal(d.activeElement, control);
    control.click();
    await new Promise(resolve => setImmediate(resolve));
    control.click(); // The explicit exit works as well as browser exit.
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(control.getAttribute('aria-pressed'), 'false');
    dom.window.close();
  }
}
fullscreenChecks().then(arrivalChecks).then(() => {
  console.log('Picture checks passed: sourced fallback reading, optional hints and full screen, native and window exits, rejected fullscreen requests, whole-sheet fit, retained hint choice, remembered places to look, page position and return focus, every sourced detail and named crop opened at the top, story history, exploration help, full screen and places carried between pictures, Sun redirect and the two watercolor cards, homepage accent rhythm, and the voices of the theme previews.');
}).catch(error => { console.error(error); process.exitCode = 1; });
