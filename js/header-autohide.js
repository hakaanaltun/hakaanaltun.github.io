/* header-autohide.js — Medium-style auto-hide header */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  var lastScrollY = window.scrollY;
  var ticking = false;
  var SCROLL_THRESHOLD = 80;   /* px from top before hide logic activates */
  var DELTA_THRESHOLD  = 40;   /* minimum scroll delta to avoid jitter */

  function update() {
    var currentScrollY = window.scrollY;
    var delta = currentScrollY - lastScrollY;

    if (currentScrollY <= SCROLL_THRESHOLD) {
      /* Always show at the top */
      header.classList.remove('header-hidden');
    } else if (!window.suppressHeaderAutoHide && Math.abs(delta) > DELTA_THRESHOLD) {
      if (delta > 0) {
        /* Scrolling down — hide */
        header.classList.add('header-hidden');
      } else {
        /* Scrolling up — reveal */
        header.classList.remove('header-hidden');
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();
