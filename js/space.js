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
 var nav = document.querySelector('.journey-navigation');
 var current = null;
 var loaded = new Set();
 function selected() {
  var id = location.hash.replace('#scene-', '');
  return scenes.find(function (scene) { return scene.dataset.scene === id; }) || scenes[0];
 }
 function show(focus) {
  var scene = selected();
  if (scene === current) return;
  var detail = document.getElementById('picture-detail');
  if (detail.open) detail.close();
  scenes.forEach(function (item) { item.classList.toggle('is-current', item === scene); item.inert = item !== scene; });
  current = scene;
  frame.dataset.view = scene.dataset.scene;
  scene.classList.remove('arrive');
  void scene.offsetWidth;
  scene.classList.add('arrive');
  caption.textContent = scene.dataset.caption;
  caption.tabIndex = -1;
  back.href = '#scene-' + scene.dataset.back;
  back.textContent = '← ' + scene.dataset.backLabel;
  nav.hidden = !scene.dataset.back;
  document.querySelectorAll('[data-choices]').forEach(function (list) { list.hidden = list.dataset.choices !== scene.dataset.scene; });
  // Keep the next scene ready while the visitor looks at this one.
  scene.querySelectorAll('[data-travel]').forEach(function (link) {
   var next = scenes.find(function (item) { return item.dataset.scene === link.dataset.travel; });
   if (!next || loaded.has(next.dataset.scene)) return;
   loaded.add(next.dataset.scene);
   next.querySelector('img').loading = 'eager';
  });
  if (focus) caption.focus({ preventScroll: true });
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
 back.addEventListener('click', function (event) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  event.preventDefault(); travel(back.hash.replace('#scene-', ''));
 });
 window.addEventListener('hashchange', function () { show(true); });
 window.addEventListener('popstate', function () { show(true); });
 show(false);
})();
