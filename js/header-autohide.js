/* header-autohide.js — direction-based auto-hide header */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  var lastScrollY = getScrollY();
  var ticking = false;
  var SCROLL_THRESHOLD = 80;
  var DELTA_THRESHOLD = 5;

  function getScrollY() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function setHidden(shouldHide) {
    if (shouldHide) header.classList.add('header-hidden');
    else header.classList.remove('header-hidden');
  }

  function update() {
    var currentScrollY = getScrollY();
    var delta = currentScrollY - lastScrollY;

    if (currentScrollY <= SCROLL_THRESHOLD) {
      setHidden(false);
    } else if (delta > DELTA_THRESHOLD) {
      setHidden(true);
    } else if (delta < -DELTA_THRESHOLD) {
      setHidden(false);
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

  window.addEventListener('pageshow', function () {
    lastScrollY = getScrollY();
    setHidden(false);
  });
})();
