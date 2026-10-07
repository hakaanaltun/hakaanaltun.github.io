/* An offline copy is made only on Save. Opening a reading menu never
   downloads the essay collection or registers a new worker. */
(function () {
  'use strict';
  var shelf = document.querySelector('[data-offline-shelf]');
  if (!shelf) return;
  var save = document.getElementById('reading-save');
  var status = shelf.querySelector('[data-offline-status]');
  var list = shelf.querySelector('[data-offline-list]');
  var count = shelf.querySelector('[data-offline-count]');
  var pieces = [], busy = false;
  shelf.hidden = false;
  if (!('serviceWorker' in navigator) || !('caches' in window) || !window.isSecureContext || typeof MessageChannel !== 'function') {
    if (save) save.disabled = true;
    status.textContent = 'Offline reading is unavailable in this browser.';
    return;
  }
  function waiting(worker) {
    return new Promise(function (resolve, reject) {
      if (!worker) { reject(new Error('no worker')); return; }
      if (worker.state === 'activated') { resolve(worker); return; }
      var timer = setTimeout(function () { done(new Error('worker timeout')); }, 30000);
      function done(error) {
        clearTimeout(timer);
        worker.removeEventListener('statechange', changed);
        if (error) reject(error); else resolve(worker);
      }
      function changed() {
        if (worker.state === 'activated') done();
        else if (worker.state === 'redundant') done(new Error('worker failed'));
      }
      worker.addEventListener('statechange', changed);
    });
  }
  async function worker(install) {
    var registration = install ? await navigator.serviceWorker.register('/sw.js', { scope: '/' }) : await navigator.serviceWorker.getRegistration('/');
    if (!registration) return null;
    if (!install && registration.active) return registration.active;
    if (install) await registration.update();
    return waiting(registration.installing || registration.waiting || registration.active);
  }
  function message(target, data) {
    return new Promise(function (resolve, reject) {
      var channel = new MessageChannel();
      var timer = setTimeout(function () { close(); reject(new Error('reply timeout')); }, 30000);
      function close() { clearTimeout(timer); channel.port1.close(); }
      channel.port1.onmessage = function (event) {
        close();
        if (event.data && event.data.ok && Array.isArray(event.data.pieces)) resolve(event.data.pieces);
        else reject(new Error('offline operation failed'));
      };
      try { target.postMessage(data, [channel.port2]); } catch (e) { close(); reject(e); }
    });
  }
  function isSaved() { return pieces.some(function (piece) { return piece.url === location.pathname; }); }
  function render() {
    if (save) { save.textContent = isSaved() ? 'Saved for offline ✓' : 'Save for offline'; save.disabled = busy || isSaved(); }
    if (count) count.textContent = '(' + pieces.length + ')';
    list.replaceChildren();
    pieces.forEach(function (piece) {
      // A worker reply is treated as data, including the source address.
      var address;
      try { address = new URL(piece.url, location.origin); } catch (e) { return; }
      if (address.origin !== location.origin || !address.pathname.startsWith('/pieces/')) return;
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = address.pathname;
      link.textContent = piece.title;
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + piece.title + ' from offline reading');
      remove.disabled = busy;
      remove.addEventListener('click', function () { change('REMOVE_READING', address.pathname); });
      item.appendChild(link); item.appendChild(remove); list.appendChild(item);
    });
    if (!pieces.length) {
      var empty = document.createElement('li');
      empty.textContent = 'No pieces saved in this browser yet.';
      list.appendChild(empty);
    }
  }
  function resources() {
    var urls = [];
    document.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="preload"], link[rel="icon"], link[rel="manifest"], link[rel="apple-touch-icon"], .essay-cover img, [data-reading-body] img').forEach(function (node) {
      var value = node.tagName === 'IMG' ? node.currentSrc || node.src : node.src || node.href;
      if (!value) return;
      var url = new URL(value, location.href);
      if (url.origin === location.origin) urls.push(url.href);
      if (node.tagName === 'IMG') {
        [node.src].concat((node.srcset || '').split(',').map(function (part) { return part.trim().split(/\s+/)[0]; })).forEach(function (src) {
          if (!src) return;
          var variant = new URL(src, location.href);
          if (variant.origin === location.origin) urls.push(variant.href);
        });
      }
    });
    // fonts.css chooses these by glyph and style, so they are not all in
    // the DOM's preload list. Keep the complete local font family.
    ['cormorant-garamond', 'eb-garamond'].forEach(function (font) {
      ['', '-italic'].forEach(function (style) {
        ['-latin', '-latin-ext'].forEach(function (set) { urls.push(location.origin + '/fonts/' + font + style + set + '.woff2'); });
      });
    });
    return Array.from(new Set(urls));
  }
  async function change(type, url) {
    if (busy) return;
    busy = true; render();
    status.textContent = type === 'SAVE_READING' ? 'Saving this piece and what it needs to open offline…' : 'Removing the offline copy…';
    try {
      var target = await worker(type === 'SAVE_READING');
      pieces = await message(target, { type: type, url: url, resources: type === 'SAVE_READING' ? resources() : [] });
      status.textContent = type === 'SAVE_READING' ? 'Saved in this browser for offline reading. Clearing browser data removes saved copies.' : 'Offline copy removed.';
      if (type === 'REMOVE_READING') {
        // The focused Remove button was replaced. Restore a visible focus.
        setTimeout(function () { var next = list.querySelector('button') || save || list.querySelector('a'); if (next) next.focus(); }, 0);
      }
    } catch (e) { status.textContent = 'This change could not be completed. Check your connection and available storage, then try again.'; }
    busy = false; render();
  }
  if (save) save.addEventListener('click', function () { change('SAVE_READING', location.pathname); });
  render();
  async function refresh() {
    if (busy) return;
    try {
      var target = await worker(false);
      if (target) { pieces = await message(target, { type: 'LIST_READING' }); render(); }
    } catch (e) { /* An older worker has no reading shelf yet. Save updates it. */ }
  }
  navigator.serviceWorker.addEventListener('controllerchange', refresh);
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  refresh();
})();
