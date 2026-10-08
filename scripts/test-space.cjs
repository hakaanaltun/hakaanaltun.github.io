/* Follow the rendered journey as a reader, including its no-script version. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, '_site/pictures/space/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/space.js'), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
function page({ hash = '', modal = true, fullscreen = false } = {}) {
  const dom = new JSDOM(html, { url: 'https://hakanaltun.io/pictures/space/' + hash, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document;
  w.scrollTo = (x, y) => { w.restoredPosition = [x, y]; };
  Object.defineProperties(w, { scrollX: { value: 0 }, scrollY: { value: 120 } });
  w.HTMLDialogElement.prototype.showModal = modal ? function () { this.open = true; } : undefined;
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  d.querySelector('.space-about').setAttribute('inert', '');
  for (const stage of d.querySelectorAll('.space-stage')) Object.defineProperty(stage, 'clientHeight', { value: 320 });
  if (fullscreen) {
    let element = null;
    Object.defineProperties(d, { fullscreenEnabled: { value: true }, fullscreenElement: { get: () => element } });
    d.getElementById('space-visit').requestFullscreen = () => {
      if (fullscreen === 'reject') return Promise.reject(new Error('Unavailable'));
      element = d.getElementById('space-visit');
      d.dispatchEvent(new w.Event('fullscreenchange'));
      return Promise.resolve();
    };
    d.exitFullscreen = () => { element = null; d.dispatchEvent(new w.Event('fullscreenchange')); return Promise.resolve(); };
  }
  w.eval(script);
  return { dom, w, d };
}
async function run() {
  {
    const { dom, d } = page({ modal: false });
    assert.equal(d.body.classList.contains('space-ready'), false);
    assert.equal(d.getElementById('space-fullscreen').hidden, true);
    for (const scene of d.querySelectorAll('.space-scene')) {
      assert.equal(scene.hidden, false);
      for (const link of scene.querySelectorAll('a[href^="#"]')) assert.ok(d.querySelector(link.getAttribute('href')), 'every destination exists without JavaScript');
    }
    for (const planet of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) assert.ok(d.getElementById('space-note-' + planet));
    for (const note of d.querySelectorAll('.space-notes details')) {
      assert.ok(note.querySelector('.picture-detail-body').textContent.trim());
      assert.ok(note.querySelector('.picture-detail-sources a[href^="https://"]'));
      assert.ok(fs.existsSync(path.join(root, note.dataset.image)));
    }
    assert.ok(d.querySelector('#pale-blue-dot .space-frame').getAttribute('style').includes('pale-blue-dot.jpg'));
    assert.ok(d.querySelector('#space-note-pale-blue-dot').textContent.includes('Voyager 2'));
    assert.ok(d.querySelector('#space-note-carl-sagan').textContent.includes('1978 Pulitzer'));
    const quote = d.querySelector('.space-quotation blockquote').textContent.trim();
    assert.ok(quote.length <= 90, 'the quotation remains brief');
    dom.window.close();
  }
  {
    const { dom, d, w } = page({ hash: '#giant-planets' });
    const visit = d.getElementById('space-visit');
    assert.equal(visit.dataset.scene, 'giant-planets', 'a shared address returns to its scene');
    assert.equal(d.querySelectorAll('.space-scene:not([hidden])').length, 1);
    d.querySelector('#giant-planets .space-gate').click();
    assert.equal(visit.dataset.scene, 'pale-blue-dot');
    assert.equal(w.location.hash, '#pale-blue-dot');
    assert.equal(d.activeElement.id, 'title-pale-blue-dot');
    w.history.back(); await tick();
    assert.equal(visit.dataset.scene, 'giant-planets', 'browser Back returns to the previous visit');
    w.history.forward(); await tick();
    assert.equal(visit.dataset.scene, 'pale-blue-dot');
    const places = d.getElementById('space-places');
    places.click(); assert.equal(places.getAttribute('aria-pressed'), 'true');
    places.click(); assert.equal(places.getAttribute('aria-pressed'), 'false');
    const seen = new Set();
    while (!seen.has(visit.dataset.scene)) {
      seen.add(visit.dataset.scene);
      const scene = d.getElementById(visit.dataset.scene);
      const dialog = d.getElementById('space-detail');
      for (const trigger of scene.querySelectorAll('.space-object[data-space-detail],.space-person')) {
        const note = d.getElementById('space-note-' + trigger.dataset.spaceDetail);
        trigger.click();
        assert.equal(dialog.open, true);
        assert.equal(dialog.scrollTop, 0);
        assert.equal(dialog.querySelector('h2').textContent, note.querySelector('h2').textContent);
        assert.equal(d.getElementById('space-detail-image').getAttribute('aria-label'), note.dataset.alt);
        dialog.scrollTop = 300;
        d.getElementById('space-return').click();
        assert.equal(dialog.open, false);
        assert.equal(d.activeElement, trigger, 'closing returns to the chosen object or portrait');
      }
      scene.querySelector('.space-gate').click();
    }
    assert.equal(seen.size, d.querySelectorAll('.space-scene').length, 'the route visits every scene before returning');
    dom.window.close();
  }
  for (const mode of [false, true, 'reject']) {
    const { dom, d, w } = page({ fullscreen: mode });
    const visit = d.getElementById('space-visit'), control = d.getElementById('space-fullscreen');
    control.click(); await tick();
    assert.equal(visit.classList.contains('is-fullscreen'), true);
    assert.equal(visit.getAttribute('aria-modal'), 'true');
    assert.equal(visit.style.getPropertyValue('--fullscreen-frame-width'), '480px', 'the complete frame fits the available stage height');
    assert.equal(d.body.style.overflow, 'hidden');
    assert.ok(d.querySelector('.picture-masthead').hasAttribute('inert'));
    d.querySelector('#earth .space-object').click();
    assert.equal(d.getElementById('space-detail').open, true, 'details also open inside full screen');
    d.getElementById('space-return').click();
    d.getElementById('space-places').click();
    if (mode === true) await d.exitFullscreen();
    else d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    assert.equal(visit.classList.contains('is-fullscreen'), false);
    assert.equal(d.body.classList.contains('show-places'), true);
    assert.equal(visit.style.getPropertyValue('--fullscreen-frame-width'), '');
    assert.equal(d.querySelector('.picture-masthead').hasAttribute('inert'), false);
    assert.equal(d.querySelector('.space-about').hasAttribute('inert'), true);
    assert.equal(d.body.style.overflow, '');
    assert.deepEqual(w.restoredPosition, [0, 120]);
    assert.equal(d.activeElement, control);
    dom.window.close();
  }
  console.log('Space passed: eight planets, sourced fallback reading, full route, shared addresses, browser history, fresh details and return focus, Pale Blue Dot and Sagan, hints, native/window fullscreen and rejected requests.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
