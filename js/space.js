/* Connected scenes use the Farm House's model. Worlds travel; separate
   information labels open the existing sourced picture dialog. */
(function () {
 'use strict';
 if (!document.body.classList.contains('picture-ready')) return;
 var frame = document.getElementById('journey-frame');
 if (!frame) return;
 var scenes = Array.from(frame.querySelectorAll('[data-scene]'));
 var caption = document.getElementById('journey-caption');
 var back = document.getElementById('journey-back');
 var next = document.getElementById('journey-next');
 var branch = document.getElementById('journey-branch');
 var nav = document.querySelector('.journey-navigation');
 var current = null;
 var loaded = new Set();
 var leaving = null;
 var transitionId = 0;
 var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function clearLeaving() {
  if (!leaving) return;
  leaving.classList.remove('is-leaving', 'is-fading');
  leaving = null;
 }
 function crossfade(oldScene, newScene) {
  var visible = leaving || oldScene;
  transitionId++;
  var id = transitionId;
  clearLeaving();
  if (!visible || visible === newScene || still) return;
  leaving = visible;
  leaving.classList.add('is-leaving');
  var picture = newScene.querySelector('img');
  picture.loading = 'eager';
  function fade() {
   if (id !== transitionId || leaving !== visible) return;
   // The outgoing scene stays opaque until the new bitmap is ready.
   void visible.offsetWidth;
   visible.classList.add('is-fading');
   var done = function () { if (id === transitionId) clearLeaving(); };
   visible.addEventListener('transitionend', done, { once:true });
   window.setTimeout(done, 750);
  }
  function ready() {
   if (id !== transitionId) return;
   if (picture.decode && picture.naturalWidth) picture.decode().then(fade, fade);
   else fade();
  }
  if (picture.complete) ready();
  else {
   picture.addEventListener('load', ready, { once:true });
   picture.addEventListener('error', ready, { once:true });
  }
 }
 function selected() {
  var id = location.hash.replace('#scene-', '');
  return scenes.find(function (scene) { return scene.dataset.scene === id; }) || scenes[0];
 }
 function show(focus) {
  var scene = selected();
  if (scene === current) return;
  var detail = document.getElementById('picture-detail');
  if (detail.open) detail.close();
  var previous = current;
  crossfade(previous, scene);
  scenes.forEach(function (item) { item.classList.toggle('is-current', item === scene); item.inert = item !== scene; });
  current = scene;
  frame.dataset.view = scene.dataset.scene;
  caption.textContent = scene.dataset.caption;
  caption.tabIndex = -1;
  // The way back and the way on sit together beneath the picture, so the
  // next world never has to be found by touching it.
  back.href = '#scene-' + scene.dataset.back;
  back.textContent = '← ' + scene.dataset.backLabel;
  back.hidden = !scene.dataset.back;
  next.href = scene.dataset.nextHref || '#scene-' + scene.dataset.next;
  next.textContent = scene.dataset.nextLabel + ' →';
  next.hidden = !scene.dataset.next && !scene.dataset.nextHref;
  branch.href = '#scene-' + scene.dataset.branch;
  branch.textContent = scene.dataset.branchLabel + ' →';
  branch.hidden = !scene.dataset.branch;
  nav.hidden = back.hidden && next.hidden && branch.hidden;
  document.querySelectorAll('[data-choices]').forEach(function (list) { list.hidden = list.dataset.choices !== scene.dataset.scene; });
  // Keep the next scene ready while the visitor looks at this one.
  scene.querySelectorAll('[data-travel]').forEach(function (link) {
   var next = scenes.find(function (item) { return item.dataset.scene === link.dataset.travel; });
   if (!next || loaded.has(next.dataset.scene)) return;
   loaded.add(next.dataset.scene);
   next.querySelector('img').loading = 'eager';
  });
  if (focus) {
   caption.focus({ preventScroll: true });
   // The new scene opens where its picture can be seen.
   if (!document.getElementById('picture-visit').classList.contains('is-fullscreen') && frame.scrollIntoView)
    frame.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
 }
 function travel(id) {
  if (!scenes.some(function (scene) { return scene.dataset.scene === id; })) return;
  if (current && id === current.dataset.scene) return;
  history.pushState(null, '', '#scene-' + id);
  show(true);
 }
 document.querySelectorAll('[data-travel]').forEach(function (link) {
  link.addEventListener('click', function (event) {
   if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
   event.preventDefault(); travel(link.dataset.travel);
  });
 });
 [back, next, branch].forEach(function (link) {
  link.addEventListener('click', function (event) {
   if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
   if (!link.getAttribute('href').startsWith('#scene-')) return;
   event.preventDefault(); travel(link.hash.replace('#scene-', ''));
  });
 });
 // A browser's Back can blur the caption after the scene has changed, so
 // focus returns to it whenever it is left on the page itself.
 function arrive() {
  show(true);
  if (document.activeElement === document.body) caption.focus({ preventScroll: true });
 }
 window.addEventListener('hashchange', arrive);
 window.addEventListener('popstate', arrive);
 show(false);
 // A linked scene is shown at the painting, while reloads keep their position.
 if (location.hash.startsWith('#scene-')) window.addEventListener('load', function () {
  var entries = performance.getEntriesByType && performance.getEntriesByType('navigation');
  if ((!entries || !entries[0] || entries[0].type === 'navigate') && !document.getElementById('picture-visit').classList.contains('is-fullscreen') && frame.scrollIntoView)
   frame.scrollIntoView({ block: 'center', behavior: 'instant' });
 }, { once: true });
})();
