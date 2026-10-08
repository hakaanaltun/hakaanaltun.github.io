/* Scene addresses live in the hash, so reload, Back and returning from a
   picture keep the reader's place. No tracking or persistent storage. */
(function () {
  'use strict';
  var visit = document.getElementById('space-visit');
  if (!visit) return;
  var scenes = Array.from(visit.querySelectorAll('.space-scene'));
  var places = document.getElementById('space-places');
  var fullscreen = document.getElementById('space-fullscreen');
  var dialog = document.getElementById('space-detail');
  if (!scenes.length || typeof dialog.showModal !== 'function') return;
  var current;
  var opener;
  var screenMode;
  var outside = [];
  var overflow;
  var position;
  function fitScreen() {
    if (!screenMode || !current) return;
    var stage = current.querySelector('.space-stage');
    visit.style.setProperty('--fullscreen-frame-width', Math.max(0, stage.clientHeight) * 1.5 + 'px');
  }
  function sceneFromHash() {
    return scenes.find(function (scene) { return '#' + scene.id === location.hash; }) || scenes[0];
  }
  function showScene(focus) {
    var scene = sceneFromHash();
    if (scene === current) return;
    if (dialog.open) dialog.close();
    scenes.forEach(function (item) { item.hidden = item !== scene; });
    current = scene;
    visit.dataset.scene = scene.id;
    document.title = scene.querySelector('h2').textContent + ' · The Space · Pictures with Stories';
    if (focus) scene.querySelector('h2').focus({ preventScroll: true });
    requestAnimationFrame(fitScreen);
  }
  document.body.classList.add('space-ready');
  showScene(false);
  // Prevent fragment scrolling past the frame; still add normal history
  // entries so the browser's own Back and Forward follow the journey.
  visit.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var target = scenes.find(function (scene) { return '#' + scene.id === link.getAttribute('href'); });
    if (!target) return;
    event.preventDefault();
    if (target === current) return;
    history.pushState(null, '', '#' + target.id);
    showScene(true);
  });
  window.addEventListener('hashchange', function () { showScene(true); });
  window.addEventListener('popstate', function () { showScene(true); });
  places.hidden = false;
  places.addEventListener('click', function () {
    var show = document.body.classList.toggle('show-places');
    places.setAttribute('aria-pressed', String(show));
    places.textContent = show ? 'Hide places' : 'Show places';
    requestAnimationFrame(fitScreen);
  });
  if (typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-space-detail]').forEach(function (trigger) {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.addEventListener('click', function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        var note = document.getElementById('space-note-' + trigger.dataset.spaceDetail);
        if (!note) return;
        opener = trigger;
        var article = note.querySelector('article').cloneNode(true);
        var title = article.querySelector('h2');
        title.id = 'space-detail-title';
        title.tabIndex = -1;
        document.getElementById('space-detail-content').replaceChildren(article);
        var crop = document.getElementById('space-detail-image');
        crop.style.backgroundImage = 'url("' + note.dataset.image + '")';
        crop.style.setProperty('--detail-position', note.dataset.position);
        crop.style.backgroundSize = note.dataset.size;
        crop.setAttribute('aria-label', note.dataset.alt);
        dialog.showModal();
        dialog.scrollTop = 0;
        title.focus({ preventScroll: true });
      });
    });
    document.getElementById('space-close').addEventListener('click', function () { dialog.close(); });
    document.getElementById('space-return').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', function () { if (opener && !opener.closest('[hidden]')) opener.focus({ preventScroll: true }); });
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  } else {
    // Keep every sourced explanation available on older browsers.
    document.body.classList.remove('space-ready');
    scenes.forEach(function (scene) { scene.hidden = false; });
    places.hidden = true;
    return;
  }
  function endScreen() {
    if (!screenMode) return;
    screenMode = null;
    visit.classList.remove('is-fullscreen');
    visit.style.removeProperty('--fullscreen-frame-width');
    ['role', 'aria-modal', 'aria-label'].forEach(function (key) { visit.removeAttribute(key); });
    outside.forEach(function (node) { node.removeAttribute('inert'); });
    outside = [];
    document.body.style.overflow = overflow;
    fullscreen.setAttribute('aria-pressed', 'false');
    fullscreen.textContent = 'Full screen';
    window.scrollTo(position.x, position.y);
    fullscreen.focus({ preventScroll: true });
    requestAnimationFrame(fitScreen);
  }
  function startScreen(mode) {
    if (screenMode) return;
    screenMode = mode;
    overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    for (var node = visit; node !== document.body; node = node.parentElement) {
      Array.from(node.parentElement.children).forEach(function (sibling) {
        if (sibling === node || sibling.hasAttribute('inert')) return;
        outside.push(sibling);
        sibling.setAttribute('inert', '');
      });
    }
    visit.classList.add('is-fullscreen');
    visit.setAttribute('role', 'dialog');
    visit.setAttribute('aria-modal', 'true');
    visit.setAttribute('aria-label', 'The Space · full screen');
    fullscreen.setAttribute('aria-pressed', 'true');
    fullscreen.textContent = 'Exit full screen';
    fullscreen.focus({ preventScroll: true });
    requestAnimationFrame(fitScreen);
  }
  function leaveScreen() {
    if (document.fullscreenElement === visit && typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().then(endScreen).catch(function () { if (document.fullscreenElement !== visit) endScreen(); });
    } else endScreen();
  }
  fullscreen.hidden = false;
  fullscreen.addEventListener('click', function () {
    if (screenMode) { leaveScreen(); return; }
    position = { x: window.scrollX, y: window.scrollY };
    if (!document.fullscreenEnabled || typeof visit.requestFullscreen !== 'function') { startScreen('window'); return; }
    try {
      visit.requestFullscreen().then(function () { if (document.fullscreenElement === visit) startScreen('native'); }).catch(function () { startScreen('window'); });
    } catch (error) { startScreen('window'); }
  });
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement === visit) startScreen('native');
    else if (screenMode === 'native') endScreen();
  });
  window.addEventListener('resize', fitScreen);
  if (typeof ResizeObserver === 'function') {
    var screenObserver = new ResizeObserver(fitScreen);
    scenes.forEach(function (scene) { screenObserver.observe(scene.querySelector('.space-stage')); });
  }
  document.addEventListener('keydown', function (event) {
    if (!screenMode || dialog.open) return;
    if (event.key === 'Escape') { event.preventDefault(); leaveScreen(); return; }
    if (event.key !== 'Tab') return;
    var stops = Array.from(visit.querySelectorAll('button,a[href]')).filter(function (element) {
      return !element.disabled && element.getClientRects().length && !element.closest('dialog:not([open])');
    });
    var index = stops.indexOf(document.activeElement);
    if ((event.shiftKey && index <= 0) || (!event.shiftKey && (index < 0 || index === stops.length - 1))) {
      event.preventDefault();
      (event.shiftKey ? stops[stops.length - 1] : stops[0]).focus({ preventScroll: true });
    }
  });
})();
