/* Close the contents panel at the right edge (the book's parts, Writing and
   a word's collection) after navigation or dismissal. */
(function () {
  'use strict';
  var chapters = document.querySelector('.book-chapters');
  if (!chapters) return;

  chapters.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () { chapters.open = false; });
  });

  /* A word's panel lists its collection, and the word being read may be
     below the frame's fold. The frame scrolls itself; scrollIntoView would
     move the page as well. */
  chapters.addEventListener('toggle', function () {
    var current = chapters.querySelector('[aria-current="page"]');
    var frame = chapters.querySelector('.book-chapters-frame');
    if (!chapters.open || !current || !frame) return;
    var f = frame.getBoundingClientRect();
    var c = current.getBoundingClientRect();
    if (c.top < f.top || c.bottom > f.bottom) {
      frame.scrollTop += c.top - f.top - (f.height - c.height) / 2;
    }
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
