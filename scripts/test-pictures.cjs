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
  for (const trigger of d.querySelectorAll('[data-detail]')) {
    trigger.click();
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
console.log('Picture checks passed: sourced fallback reading, optional hints, every detail and named crop, modal return focus and exploration help.');
