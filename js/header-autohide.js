/* header-autohide.js — direction-based sticky header */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  var scrollRoot = document.scrollingElement || document.documentElement;
  var lastScrollY = scrollRoot.scrollTop || window.pageYOffset || 0;
  var ticking = false;
  var SCROLL_THRESHOLD = 80;
  var DELTA_THRESHOLD = 5;

  function getScrollY() {
    return scrollRoot.scrollTop || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function setHidden(shouldHide) {
    header.classList.toggle('header-hidden', shouldHide);
  }

  function updateHeader() {
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

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('pageshow', function () {
    lastScrollY = getScrollY();
    setHidden(false);
  });
})();
