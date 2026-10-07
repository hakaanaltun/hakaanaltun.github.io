/* Reading controls, portable drawer data and the opt-in offline worker.
   These exercise loss and recovery, rather than copying the implementation. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const panel = read('_includes/reading-options.html');
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function page() {
  const dom = new JSDOM('<html lang="en"><body>' + panel + '<article data-reading-body><p>First paragraph, with a few words.</p><p>Second paragraph.</p></article></body></html>', { url: 'https://hakanaltun.io/pieces/on-lying.html', runScripts: 'outside-only' });
  return { dom, w: dom.window, q: s => dom.window.document.querySelector(s) };
}
function run(w, name) { w.eval(read('js/' + name + '.js')); }

async function main() {
  // Settings persist, validate old/malformed values, reset, and stay usable
  // when storage is blocked.
  {
    const { dom, w, q } = page();
    w.localStorage.setItem('olae-reading-v1', JSON.stringify({ size: '1.3', spacing: '2.4', font: 'sans' }));
    run(w, 'reading-settings'); await tick();
    assert.equal(q('#reading-options').hidden, false);
    assert.equal(w.document.documentElement.style.getPropertyValue('--reading-scale'), '1.3');
    assert.equal(q('#reading-font'), null);
    assert.equal(w.document.documentElement.hasAttribute('data-reading-font'), false, 'old font preferences are ignored');
    assert.equal(w.document.documentElement.style.getPropertyValue('--reading-spacing'), '2.4');
    q('#reading-reset').click();
    assert.deepEqual(JSON.parse(w.localStorage.getItem('olae-reading-v1')), { size: '1', spacing: '1.85' });
    assert.equal(q('#reading-size').value, '1');
    Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('blocked', 'SecurityError'); } });
    q('#reading-size').value = '1.15'; q('#reading-size').dispatchEvent(new w.Event('change'));
    assert.equal(w.document.documentElement.style.getPropertyValue('--reading-scale'), '1.15');
    assert.match(q('#reading-settings-status').textContent, /cannot keep/);
    dom.window.close();
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
  // No sound at load; remote voices are excluded even if they are default.
  // Pause/resume, speed changes and leaving invalidate cancelled callbacks.
  {
    const { dom, w, q } = page();
    const spoken = []; let cancelled = 0;
    const local = { name: 'Device English', voiceURI: 'local-en', lang: 'en-US', localService: true };
    w.speechSynthesis = { getVoices: () => [{ name: 'Cloud', voiceURI: 'cloud', lang: 'en-US', localService: false, default: true }, local], cancel: () => cancelled++, speak: u => spoken.push(u), addEventListener() {} };
    w.SpeechSynthesisUtterance = function (text) { this.text = text; };
    run(w, 'reading-listen');
    assert.equal(spoken.length, 0);
    assert.equal(q('#reading-voice').options.length, 1);
    q('#reading-play').click();
    assert.equal(spoken[0].voice, local);
    spoken[0].onboundary({ name: 'word', charIndex: 6 });
    q('#reading-play').click();
    assert.equal(q('#reading-play').textContent, 'Resume');
    spoken[0].onend(); assert.equal(spoken.length, 1);
    q('#reading-play').click(); assert.equal(spoken[1].text, 'paragraph, with a few words.');
    q('#reading-speed').value = '1.3'; q('#reading-speed').dispatchEvent(new w.Event('change'));
    assert.equal(spoken[2].rate, 1.3);
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(q('#reading-play').textContent, 'Listen');
    assert.ok(cancelled >= 4);
    dom.window.close();
    const other = page();
    other.w.speechSynthesis = { getVoices: () => [{ ...local, localService: false }], cancel() {}, speak() { throw Error('remote speech'); }, addEventListener() {} };
    other.w.SpeechSynthesisUtterance = function () {};
    run(other.w, 'reading-listen'); other.q('#reading-play').click();
    assert.match(other.q('#reading-listen-status').textContent, /No local English voice/);
    other.dom.window.close();
  }
  // Use distinct named caches and native Response objects: a selection must
  // survive activation, navigation, a shell version change and no network.
  {
    const built = read('_site/sw.js');
    assert.ok(!built.includes('{%'), 'Build with Jekyll first');
    const stores = new Map(); let offline = false, failAsset = false;
    const origin = 'https://hakanaltun.io';
    function cache(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      const key = raw => new URL(typeof raw === 'string' ? raw : raw.url, origin).href;
      return {
        match: async raw => { const r = data.get(key(raw)); return r && r.clone(); },
        put: async (raw, response) => data.set(key(raw), response.clone()),
        delete: async raw => data.delete(key(raw)),
        keys: async () => [...data.keys()].map(url => ({ url })),
        addAll: async urls => { for (const url of urls) data.set(key(url), new Response(url)); }
      };
    }
    const events = {};
    const scope = { URL, Headers, Response, Request, console,
      location: { origin }, clients: { claim: async () => {} }, skipWaiting: async () => {},
      addEventListener(type, callback) { events[type] = callback; },
      caches: { open: async name => cache(name), keys: async () => [...stores.keys()], delete: async name => stores.delete(name) },
      fetch: async raw => {
        if (offline || failAsset && String(raw).includes('/css/reading.css')) throw Error('offline');
        const url = typeof raw === 'string' ? raw : raw.url;
        return new Response('network:' + url, { headers: { 'Content-Type': String(url).includes('/pieces/') ? 'text/html' : 'text/plain' } });
      }
    };
    scope.self = scope; vm.createContext(scope); vm.runInContext(built, scope);
    const send = async data => {
      let reply, done;
      events.message({ data, ports: [{ postMessage: r => { reply = r; } }], waitUntil: p => { done = p; } });
      await done; return reply;
    };
    const request = async (pathname, mode = 'navigate') => {
      let result;
      events.fetch({ request: { method: 'GET', url: origin + pathname, mode }, respondWith: p => { result = p; } });
      return result === undefined ? null : await result;
    };
    let done; events.install({ waitUntil: p => { done = p; } }); await done;
    assert.equal(stores.has('olae-reading-pages-v1'), false, 'install selects no essays');
    const urls = Array.from(scope.ESSAY_PAGES, p => p.url).slice(0, 2);
    assert.equal(urls.length, 2);
    const resources = ['/css/reading.css?v=reading-test', '/js/reading-settings.js?v=reading-test', '/fonts/eb-garamond-latin.woff2'];
    assert.equal((await send({ type: 'SAVE_READING', url: urls[0], resources })).ok, true);
    assert.equal((await send({ type: 'LIST_READING' })).pieces.length, 1);
    await request(urls[1]);
    assert.equal((await send({ type: 'LIST_READING' })).pieces.length, 1, 'visiting does not save');
    stores.set('olae-tools-v0', new Map());
    events.activate({ waitUntil: p => { done = p; } }); await done;
    assert.equal(stores.has('olae-tools-v0'), false);
    assert.equal(stores.has('olae-reading-pages-v1'), true);
    offline = true;
    assert.equal(await (await request(urls[0])).text(), 'network:' + urls[0]);
    assert.equal(await (await request('/css/reading.css?v=reading-test', 'cors')).text(), 'network:/css/reading.css?v=reading-test');
    assert.equal(await (await request('/not-saved/')).text(), '/offline/');
    offline = false; failAsset = true;
    assert.equal((await send({ type: 'SAVE_READING', url: urls[1], resources })).ok, false);
    assert.equal((await send({ type: 'LIST_READING' })).pieces.length, 1, 'failed assets do not create a saved page');
    failAsset = false;
    assert.equal((await send({ type: 'SAVE_READING', url: 'https://other.test/pieces/no.html', resources })).ok, false);
    assert.equal((await send({ type: 'SAVE_READING', url: urls[1], resources: ['https://other.test/script.js'] })).ok, false);
    await send({ type: 'SAVE_READING', url: urls[1], resources });
    offline = true;
    await send({ type: 'REMOVE_READING', url: urls[0] });
    assert.equal(stores.has('olae-reading-assets-v1'), true, 'remaining pieces keep their assets');
    await send({ type: 'REMOVE_READING', url: urls[1] });
    assert.equal((await send({ type: 'LIST_READING' })).pieces.length, 0);
    assert.equal(stores.has('olae-reading-assets-v1'), false);
  }
  console.log('Reading checks passed: preferences, backup recovery, local-only speech and opt-in offline snapshots.');
}
main().catch(error => { console.error(error); process.exit(1); });
