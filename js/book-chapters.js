/* Close the book's native contents panel after navigation or dismissal. */
(function () {
  'use strict';
  var chapters = document.querySelector('.book-chapters');
  if (!chapters) return;

  chapters.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () { chapters.open = false; });
  });

  document.addEventListener('click', function (event) {
    if (chapters.open && !chapters.contains(event.target)) chapters.open = false;
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !chapters.open) return;
    chapters.open = false;
    chapters.querySelector('summary').focus();
  });
})();
