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
  // A label that shows opens its detail like the dot, which matters most for
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
{
  const { dom, d } = page(true);
  const dialog = d.querySelector('#picture-detail');
  const controls = d.querySelector('#picture-places');
  assert.equal(d.body.classList.contains('picture-ready'), true);
  assert.equal(controls.getAttribute('aria-pressed'), 'false');
  controls.click();
  assert.equal(d.querySelector('#picture-visit').classList.contains('show-places'), true);
  assert.equal(controls.getAttribute('aria-pressed'), 'true');
  controls.click();
  assert.equal(controls.getAttribute('aria-pressed'), 'false');
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
// homepage section sits in the accent rhythm in style.css, slate and green
// taking turns down the page. A section added without its colour, or one that
// leaves two neighbours the same, fails here.
{
  const home = new JSDOM(fs.readFileSync(path.join(root, '_site/index.html'), 'utf8')).window.document;
  const order = [...home.querySelectorAll('main section[id]')].filter(s => !s.parentElement.closest('section')).map(s => s.id);
  assert.equal(order[order.indexOf('words-with-stories') + 1], 'pictures-with-stories', 'Pictures with Stories follows Words with Stories');
  assert.ok(home.querySelector('#pictures-with-stories a.home-picture-card[href="/pictures/black-hole/"] img'));
  // The journey takes its turn too, with the downscales its card needs.
  assert.ok(home.querySelector('#pictures-with-stories a.home-picture-card[href="/pictures/space/"] img[srcset*="/pictures/space/assets/480/"]'));
  const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  const list = colour => (css.match(new RegExp('html\\[data-theme="light"\\] body\\.is-home :is\\(([^)]*)\\) \\{\\s*--petrol: ' + colour)) || [])[1];
  const slate = list('oklch').split(',').map(s => s.trim().slice(1));
  const green = list('var\\(--sec-accent').split(',').map(s => s.trim().slice(1));
  order.forEach((id, i) => {
    assert.ok(slate.includes(id) !== green.includes(id), id + ' is in exactly one colour list');
    assert.equal(slate.includes(id), i % 2 === 0, id + ' takes its turn in the rhythm');
  });
}
async function fullscreenChecks() {
  function setup(w, native) {
    w.scrollTo = (x, y) => { w.restoredPosition = [x, y]; };
    Object.defineProperties(w, { scrollX: { value: 0 }, scrollY: { value: 180 } });
    const stage = w.document.querySelector('.picture-stage');
    Object.defineProperties(stage, { clientWidth: { value: 900 }, clientHeight: { value: 500 } });
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
fullscreenChecks().then(() => {
  console.log('Picture checks passed: sourced fallback reading, optional hints and full screen, native and window exits, rejected fullscreen requests, whole-sheet fit, retained hint choice, page position and return focus, every sourced detail and named crop opened at the top, story history, exploration help, and homepage accent rhythm.');
}).catch(error => { console.error(error); process.exitCode = 1; });
