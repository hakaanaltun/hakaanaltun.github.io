/* The rendered document is also the no-JavaScript reading version. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, '_site/pictures/black-hole/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/pictures.js'), 'utf8');
function page(modals) {
  const dom = new JSDOM(html, { url: 'https://hakanaltun.io/pictures/black-hole/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  if (modals) {
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  } else { w.HTMLDialogElement.prototype.showModal = undefined; }
  w.eval(script);
  return { dom, w, d: w.document };
}
{
  const { dom, d } = page(false);
  assert.equal(d.body.classList.contains('picture-ready'), false);
  assert.equal(d.querySelector('#picture-places').hidden, true);
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
console.log('Picture checks passed: sourced fallback reading, optional hints, a label beside the thin ring, the story opening on the picture\'s history, every detail and named crop opened at the top, modal return focus and exploration help.');
