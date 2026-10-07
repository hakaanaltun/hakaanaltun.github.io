/* Farm House-style details, sourced in the document. Native details remain
   readable if JavaScript or modal dialogs are unavailable. No saved state. */
(function () {
  'use strict';
  var dialog = document.getElementById('picture-detail');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var visit = document.getElementById('picture-visit');
  var image = document.querySelector('.picture-image');
  var crop = document.getElementById('picture-detail-image');
  var content = document.getElementById('picture-detail-content');
  var places = document.getElementById('picture-places');
  var help = document.getElementById('picture-help');
  var fullscreen = document.getElementById('picture-fullscreen');
  var stage = visit.querySelector('.picture-stage');
  var frame = visit.querySelector('.picture-frame');
  var screenMode = null;
  var pagePosition;
  var pageOverflow;
  var outside = [];
  var opener = null;
  function fitPicture() {
    if (!screenMode) return;
    var ratio = (image.naturalWidth || image.width) / (image.naturalHeight || image.height);
    frame.style.width = Math.min(stage.clientWidth, stage.clientHeight * ratio) + 'px';
  }
  function startScreen(mode) {
    if (screenMode) return;
    screenMode = mode;
    fullscreen.disabled = false;
    pageOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Hide each sibling on the route to the body, never an ancestor of the
    // picture. The detail dialogs belong to the same fullscreen element.
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
    visit.setAttribute('aria-label', document.querySelector('.picture-title').textContent + ' — full screen');
    fullscreen.setAttribute('aria-pressed', 'true');
    fullscreen.textContent = 'Exit full screen';
    fitPicture();
    fullscreen.focus({ preventScroll: true });
  }
  function endScreen() {
    if (!screenMode) return;
    screenMode = null;
    visit.classList.remove('is-fullscreen');
    ['role', 'aria-modal', 'aria-label'].forEach(function (attribute) { visit.removeAttribute(attribute); });
    frame.style.removeProperty('width');
    outside.forEach(function (sibling) { sibling.removeAttribute('inert'); });
    outside = [];
    document.body.style.overflow = pageOverflow;
    fullscreen.setAttribute('aria-pressed', 'false');
    fullscreen.textContent = 'Full screen';
    if (!dialog.open && !help.open) fullscreen.focus({ preventScroll: true });
    window.scrollTo(pagePosition.x, pagePosition.y);
  }
  function leaveScreen() {
    if (document.fullscreenElement === visit && typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().then(endScreen).catch(function () {
        // A browser-driven exit can win the race with the button.
        if (document.fullscreenElement !== visit) endScreen();
      });
    } else { endScreen(); }
  }
  fullscreen.hidden = false;
  fullscreen.addEventListener('click', function () {
    if (screenMode) { leaveScreen(); return; }
    pagePosition = { x: window.scrollX, y: window.scrollY };
    if (!document.fullscreenEnabled || typeof visit.requestFullscreen !== 'function') {
      startScreen('window');
      return;
    }
    fullscreen.disabled = true;
    try {
      visit.requestFullscreen().then(function () {
        if (document.fullscreenElement === visit) startScreen('native');
      }).catch(function () { startScreen('window'); }).finally(function () { fullscreen.disabled = false; });
    } catch (error) {
      fullscreen.disabled = false;
      startScreen('window');
    }
  });
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement === visit) startScreen('native');
    else if (screenMode === 'native') endScreen();
  });
  document.addEventListener('keydown', function (event) {
    if (!screenMode || dialog.open || help.open) return;
    if (event.key === 'Escape') { event.preventDefault(); leaveScreen(); }
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
  window.addEventListener('resize', fitPicture);
  image.addEventListener('load', fitPicture);
  if (typeof ResizeObserver === 'function') new ResizeObserver(fitPicture).observe(stage);
  function openDetail(id, trigger) {
    var note = document.getElementById('note-' + id);
    if (!note) return;
    opener = trigger;
    var article = note.querySelector('article').cloneNode(true);
    var title = article.querySelector('h2');
    title.id = 'picture-detail-title';
    title.tabIndex = -1;
    content.replaceChildren(article);
    crop.style.backgroundImage = 'url("' + image.getAttribute('src') + '")';
    crop.style.setProperty('--detail-position', note.dataset.position);
    crop.style.setProperty('--detail-zoom', note.dataset.zoom);
    crop.setAttribute('aria-label', note.dataset.alt);
    dialog.showModal();
    // Only an open dialog can be scrolled, so the reset comes after showing
    // it. Before, a phone reader who had scrolled down to "Back to the
    // picture" met every later detail scrolled the same way, its close view
    // pushed up out of sight.
    dialog.scrollTop = 0;
    title.focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-detail]').forEach(function (trigger) {
    trigger.hidden = false;
    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      openDetail(trigger.dataset.detail, trigger);
    });
  });
  function close() { dialog.close(); }
  document.getElementById('picture-close').addEventListener('click', close);
  document.getElementById('picture-return').addEventListener('click', close);
  dialog.addEventListener('close', function () { if (opener) opener.focus({ preventScroll: true }); });
  function backdrop(modal) {
    modal.addEventListener('click', function (event) {
      if (event.target !== modal) return;
      var box = modal.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) modal.close();
    });
  }
  backdrop(dialog); backdrop(help);
  places.hidden = false;
  places.addEventListener('click', function () {
    var show = visit.classList.toggle('show-places');
    places.setAttribute('aria-pressed', String(show));
    places.textContent = show ? 'Hide places to look' : 'Show places to look';
    fitPicture();
  });
  var how = document.getElementById('picture-how');
  how.hidden = false;
  how.addEventListener('click', function () { help.showModal(); });
  document.getElementById('picture-help-close').addEventListener('click', function () { help.close(); });
  help.addEventListener('close', function () { how.focus({ preventScroll: true }); });
  document.body.classList.add('picture-ready');
})();
