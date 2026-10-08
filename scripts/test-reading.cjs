/* Reading options and the portable drawer. These exercise what a reader
   does and what can go wrong, rather than copying the implementation. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const panel = read('_includes/reading-options.html').replace(/\{%[\s\S]*?%\}/g, '').replace(/\{\{[^}]*\}\}/g, '');
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function page(stored) {
  const dom = new JSDOM('<html lang="en"><body>' + panel + '<article class="essay-body" data-reading-body><p>First paragraph, with a few words.</p><p>Second paragraph.</p></article></body></html>', { url: 'https://hakanaltun.io/pieces/on-lying.html', runScripts: 'outside-only' });
  if (stored !== undefined) dom.window.localStorage.setItem('olae-reading-v1', stored);
  return { dom, w: dom.window, q: s => dom.window.document.querySelector(s) };
}
function run(w, name) { w.eval(read('js/' + name + '.js')); }
const pressed = (q, choice) => [...q('#reading-options').querySelectorAll('[data-choice="' + choice + '"]')]
  .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.value);

async function main() {
  // A reader who has chosen nothing gets the piece exactly as published:
  // no attribute, no variable, nothing stored.
  {
    const { dom, w, q } = page();
    run(w, 'reading-settings'); await tick();
    const html = w.document.documentElement;
    assert.equal(q('#reading-options').hidden, false);
    assert.equal(html.hasAttribute('data-reading-size'), false);
    assert.equal(html.hasAttribute('data-reading-spacing'), false);
    assert.equal(html.style.getPropertyValue('--reading-scale'), '');
    assert.deepEqual(pressed(q, 'size'), ['1']);
    assert.deepEqual(pressed(q, 'spacing'), ['1.85']);
    assert.equal(w.localStorage.getItem('olae-reading-v1'), null);
    dom.window.close();
  }
  // Every typography rule in reading.css waits for a reader's choice, so
  // "original" can never drift from the published page.
  {
    const css = read('css/reading.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = css.match(/[^{}]+\{[^{}]*\}/g) || [];
    rules.filter(rule => /\.essay-body/.test(rule) && /(font-size|line-height)\s*:/.test(rule) && !/@media print|body\.is-post/.test(rule))
      .forEach(rule => assert.match(rule.trim(), /^html\[data-reading-(size|spacing)\]/, 'ungated typography rule: ' + rule.trim()));
  }
  // A stored choice is applied before paint, a stale font choice is ignored,
  // a choice is kept, and going back to "original" for both leaves nothing.
  {
    const { dom, w, q } = page(JSON.stringify({ size: '1.3', spacing: '2.4', font: 'sans' }));
    run(w, 'reading-settings'); await tick();
    const html = w.document.documentElement;
    assert.equal(html.getAttribute('data-reading-size'), '1.3');
    assert.equal(html.style.getPropertyValue('--reading-scale'), '1.3');
    assert.equal(html.getAttribute('data-reading-spacing'), '2.4');
    assert.equal(html.hasAttribute('data-reading-font'), false, 'old font preferences are ignored');
    assert.deepEqual(pressed(q, 'size'), ['1.3']);
    q('[data-choice="size"][value="1.15"]').click();
    assert.equal(html.getAttribute('data-reading-size'), '1.15');
    assert.deepEqual(pressed(q, 'size'), ['1.15']);
    assert.deepEqual(JSON.parse(w.localStorage.getItem('olae-reading-v1')), { size: '1.15', spacing: '2.4' });
    q('[data-choice="size"][value="1"]').click();
    q('[data-choice="spacing"][value="1.85"]').click();
    assert.equal(html.hasAttribute('data-reading-size'), false);
    assert.equal(html.hasAttribute('data-reading-spacing'), false);
    assert.equal(html.style.getPropertyValue('--reading-spacing'), '');
    assert.equal(w.localStorage.getItem('olae-reading-v1'), null, 'nothing is left behind');
    dom.window.close();
  }
  // Malformed storage falls back to the original.
  {
    const { dom, w, q } = page('{not json');
    run(w, 'reading-settings'); await tick();
    assert.equal(w.document.documentElement.hasAttribute('data-reading-size'), false);
    assert.deepEqual(pressed(q, 'size'), ['1']);
    dom.window.close();
  }
  // Blocked storage: the choice still applies here, and the note says it
  // will not be kept.
  {
    const { dom, w, q } = page();
    run(w, 'reading-settings'); await tick();
    const kept = q('#reading-settings-status').textContent;
    assert.match(kept, /Kept in this browser/);
    Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('blocked', 'SecurityError'); } });
    q('[data-choice="size"][value="1.15"]').click();
    assert.equal(w.document.documentElement.style.getPropertyValue('--reading-scale'), '1.15');
    assert.match(q('#reading-settings-status').textContent, /cannot keep/);
    dom.window.close();
  }
  // Escape closes the menu and returns to its toggle, and is marked handled
  // so puzzle mode does not act on the same key.
  {
    const { dom, w, q } = page();
    run(w, 'reading-settings'); await tick();
    const menu = q('#reading-options');
    menu.open = true;
    const button = q('[data-choice="spacing"][value="2.1"]');
    button.focus();
    const event = new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    assert.equal(menu.open, false);
    assert.equal(event.defaultPrevented, true);
    assert.equal(w.document.activeElement, menu.querySelector('summary'));
    dom.window.close();
  }
  // Another tab's choice is followed here.
  {
    const { dom, w, q } = page();
    run(w, 'reading-settings'); await tick();
    w.localStorage.setItem('olae-reading-v1', JSON.stringify({ size: '1', spacing: '2.1' }));
    w.dispatchEvent(new w.StorageEvent('storage', { key: 'olae-reading-v1' }));
    assert.equal(w.document.documentElement.getAttribute('data-reading-spacing'), '2.1');
    assert.deepEqual(pressed(q, 'spacing'), ['2.1']);
    dom.window.close();
  }
  // The print button prints. Opened from an iPhone's Home Screen, where
  // printing opens nothing, the panel says where it works instead; a Mac's
  // web app, with no touch points, keeps the button.
  for (const [standalone, touchPoints, prints] of [[undefined, 0, true], [true, 5, false], [true, 0, true]]) {
    const { dom, w, q } = page();
    Object.defineProperty(w.navigator, 'standalone', { value: standalone, configurable: true });
    Object.defineProperty(w.navigator, 'maxTouchPoints', { value: touchPoints, configurable: true });
    let printed = 0;
    w.print = () => { printed += 1; };
    run(w, 'reading-settings'); await tick();
    const elsewhere = q('#reading-print-elsewhere');
    if (prints) {
      q('#reading-print').click();
      assert.equal(printed, 1, 'the button prints');
      assert.equal(elsewhere.hidden, true);
    } else {
      assert.equal(q('#reading-print'), null, 'no button that does nothing');
      assert.equal(elsewhere.hidden, false);
      assert.match(elsewhere.textContent, /open it in Safari/);
    }
    dom.window.close();
  }
  // Rain is not in the menu: rain that is falling has to show where it stops.
  assert.equal(/essay-rain/.test(panel), false, 'read with rain stays under the title');
  assert.match(read('_layouts/post.html'), /id="essay-rain"/);

  // The prose is usually out of sight under the cover, so a letter beside the
  // sizes shows the chosen one: the prose's own size times --reading-scale.
  {
    const { dom, q } = page();
    const sample = q('[aria-labelledby="reading-size-label"] .reading-sample');
    assert.ok(sample, 'the sample letter sits with the text size choices');
    assert.equal(sample.getAttribute('aria-hidden'), 'true', 'it is a picture of the size, not a control');
    assert.match(read('css/reading.css'), /\.reading-sample\s*\{[^}]*font-size:\s*calc\(1em \* var\(--reading-scale, 1\)\)/);
    dom.window.close();
  }

  // A printed piece opens with its kind and the site's address, and ends with
  // the site's name and line. The old byline with the full address is gone.
  {
    const built = name => {
      const file = path.join(root, '_site/pieces', name + '.html');
      assert.ok(fs.existsSync(file), 'Build with Jekyll first');
      return new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
    };
    const head = doc => [...doc.querySelectorAll('.essay-header > .print-head > span')].map(s => s.textContent);
    assert.deepEqual(head(built('on-lying')), ['Essay', 'hakanaltun.io']);
    assert.deepEqual(head(built('measured')), ['Short fiction', 'hakanaltun.io']);
    const doc = built('on-lying');
    assert.equal(doc.querySelector('.essay-header').firstElementChild.className, 'print-head', 'the head comes before the title');
    const colophon = doc.querySelector('.essay-card-wrapper > .print-colophon');
    assert.ok(colophon && colophon.previousElementSibling.matches('.essay-body'), 'the colophon follows the prose');
    assert.deepEqual([...colophon.querySelectorAll('p')].map(p => p.textContent), ['On Life & Everything', 'Essays, short fiction, and other writing.']);
    assert.equal(doc.querySelector('.essay-print-byline'), null);
    const print = read('css/reading.css');
    assert.match(print, /\.essay-header > :not\(\.essay-title-block\):not\(\.essay-date-line\):not\(\.print-head\)/, 'print keeps the head');
    assert.match(print, /\.essay-card-wrapper > :not\(\.essay-header\):not\(\.essay-body\):not\(\.print-colophon\)/, 'and the colophon');
  }

  // A backup preserves the saved words and source, merges without erasing
  // existing records, and never restores another browser's House memories.
  {
    const { dom, w } = page(); run(w, 'keep'); await tick();
    const keep = w.OLAE_KEEP;
    keep.toggle({ id: 'text-first', title: 'First', quote: 'The exact saved line.', href: '/pieces/first.html' });
    const copy = JSON.parse(JSON.stringify(keep.backup()));
    keep.remove('text-first');
    keep.toggle({ id: 'text-second', title: 'Second', quote: 'Already here.', href: '/pieces/second.html' });
    keep.update(s => { s.lamp = true; });
    assert.equal(keep.restoreBackup(copy), 1);
    assert.equal(keep.restoreBackup(copy), 0);
    assert.equal(keep.read().kept.length, 2);
    assert.equal(keep.read().lamp, true);
    assert.equal(keep.read().kept[1].quote, 'The exact saved line.');
    assert.equal(keep.read().kept[1].href, '/pieces/first.html');
    const before = JSON.stringify(keep.read());
    assert.throws(() => keep.restoreBackup({ format: 'olae-drawer', version: 1, items: [null] }));
    assert.equal(JSON.stringify(keep.read()), before);
    const malicious = { format: 'olae-drawer', version: 1, items: [{ id: 'text-third', title: '<img onerror="bad()">', quote: '<script>bad()</script>', href: 'javascript:bad()' }] };
    assert.equal(keep.restoreBackup(malicious), 1);
    assert.equal(keep.read().kept[2].href, '/');
    const stored = w.localStorage.getItem('olae-house-v1');
    w.Storage.prototype.setItem = () => { throw new w.DOMException('full', 'QuotaExceededError'); };
    assert.throws(() => keep.restoreBackup({ ...copy, items: [{ id: 'text-fourth', title: 'Fourth', href: '/pieces/fourth.html' }] }));
    assert.equal(w.localStorage.getItem('olae-house-v1'), stored);
    assert.equal(keep.has('text-fourth'), false);
    dom.window.close();
  }
  console.log('Reading checks passed: the original untouched until a choice, choices kept and cleared, blocked and malformed storage, Escape, other tabs, rain under the title, the size sample, the printed head and colophon, and drawer backup recovery.');
}
main().catch(error => { console.error(error); process.exit(1); });
