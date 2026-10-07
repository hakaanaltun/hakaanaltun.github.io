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
  var opener = null;
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
    dialog.scrollTop = 0;
    dialog.showModal();
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
  });
  var how = document.getElementById('picture-how');
  how.hidden = false;
  how.addEventListener('click', function () { help.showModal(); });
  document.getElementById('picture-help-close').addEventListener('click', function () { help.close(); });
  help.addEventListener('close', function () { how.focus({ preventScroll: true }); });
  document.body.classList.add('picture-ready');
})();
