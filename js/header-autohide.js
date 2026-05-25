/* header-autohide.js — direction-based sticky header (essay pages only) */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  /* Only enable autohide on essay/post pages (pages with .essay-article) */
  if (!document.querySelector('.essay-article')) return;

  var lastScrollY = window.scrollY || 0;
  var SCROLL_THRESHOLD = 80;
  var DELTA_THRESHOLD = 5;

  window.addEventListener('scroll', function () {
    var sy = window.scrollY;
    var delta = sy - lastScrollY;

    if (sy <= SCROLL_THRESHOLD) {
      header.classList.remove('header-hidden');
    } else if (delta > DELTA_THRESHOLD) {
      header.classList.add('header-hidden');
    } else if (delta < -DELTA_THRESHOLD) {
      header.classList.remove('header-hidden');
    }

    lastScrollY = sy;
  }, { passive: true });

  window.addEventListener('pageshow', function () {
    lastScrollY = window.scrollY || 0;
    header.classList.remove('header-hidden');
  });
})();
