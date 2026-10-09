/* Travel inside one painting; the existing picture controls own the notes,
   hints and fullscreen. A hash shares the viewpoint without storing visits. */
(function () {
 'use strict';
 var canvas = document.getElementById('journey-canvas');
 if (!canvas || !document.body.classList.contains('picture-ready')) return;
 var frame = document.getElementById('journey-frame');
 var read = document.getElementById('journey-read');
 var caption = document.getElementById('journey-caption');
 var back = document.getElementById('journey-back');
 var next = document.getElementById('journey-next');
 var nav = document.querySelector('.journey-navigation');
 var worlds = Array.from(canvas.querySelectorAll('[data-travel]'));
 var ids = worlds.map(function (world) { return world.dataset.travel; });
 var current = 'overview';
 function address(id) { return id === 'overview' ? '#picture-main' : '#note-' + id; }
 function fromHash() { var id = location.hash.replace('#note-', ''); return ids.includes(id) ? id : 'overview'; }
 function paintCamera() {
  var world = worlds.find(function (item) { return item.dataset.travel === current; });
  var scale = world ? Number(world.dataset.scale) : 1;
  var x = world ? frame.clientWidth * (.5 - Number(world.dataset.x) / 100 * scale) : 0;
  var y = world ? frame.clientHeight * (.5 - Number(world.dataset.y) / 100 * scale) : 0;
  x = Math.max(frame.clientWidth * (1 - scale), Math.min(0, x));
  y = Math.max(frame.clientHeight * (1 - scale), Math.min(0, y));
  canvas.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  canvas.style.setProperty('--marker-scale', 1 / scale);
 }
 function show(focus) {
  var dialog = document.getElementById('picture-detail');
  if (dialog.open) dialog.close();
  current = fromHash();
  frame.dataset.view = current;
  var at = ids.indexOf(current);
  var world = worlds[at];
  caption.textContent = world ? world.dataset.heading : 'Touch a world to travel closer.';
  read.hidden = !world;
  if (world) { read.dataset.detail = current; read.textContent = 'About ' + world.getAttribute('aria-label'); }
  back.href = address(at > 0 ? ids[at - 1] : 'overview');
  back.textContent = at > 0 ? '← ' + worlds[at - 1].getAttribute('aria-label') : '← Whole picture';
  back.hidden = !world;
  next.href = address(at < ids.length - 1 ? ids[at + 1] : 'overview');
  next.textContent = at === -1 ? 'Begin the journey →' : at < ids.length - 1 ? worlds[at + 1].getAttribute('aria-label') + ' →' : 'Whole picture ↶';
  worlds.forEach(function (item) { item.hidden = current !== 'overview' && item !== world; });
  document.querySelectorAll('.picture-choices [data-travel]').forEach(function (link) {
   if (link.dataset.travel === current) link.setAttribute('aria-current','location');
   else link.removeAttribute('aria-current');
  });
  paintCamera();
  if (focus) { caption.tabIndex = -1; caption.focus({ preventScroll:true }); }
 }
 function travel(id) {
  if (id === current && id !== 'overview') { read.click(); return; }
  history.pushState(null,'',address(id));
  show(true);
 }
 document.querySelectorAll('[data-travel]').forEach(function (trigger) {
  trigger.addEventListener('click',function (event) {
   if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
   event.preventDefault(); travel(trigger.dataset.travel);
  });
 });
 [back,next].forEach(function (link) {
  link.addEventListener('click',function (event) {
   if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
   event.preventDefault(); travel(link.hash.replace('#note-','') === '#picture-main' ? 'overview' : link.hash.replace('#note-',''));
  });
 });
 nav.hidden = false;
 window.addEventListener('hashchange',function () { show(true); });
 window.addEventListener('popstate',function () { show(true); });
 window.addEventListener('resize',paintCamera);
 if (typeof ResizeObserver === 'function') new ResizeObserver(paintCamera).observe(frame);
 show(false);
})();
