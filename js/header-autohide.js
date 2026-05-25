/* header-autohide.js — Medium-style auto-hide header */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  var lastScrollY = window.scrollY;
  var lastTouchY = null;
  var ticking = false;
  var SCROLL_THRESHOLD = 80;
  var DELTA_THRESHOLD = 5;

  function setHidden(shouldHide) {
    if (shouldHide) header.classList.add('header-hidden');
    else header.classList.remove('header-hidden');
  }

  function drawerIsOpen() {
    return document.body.classList.contains('drawer-open') || document.documentElement.classList.contains('drawer-open');
  }

  function revealHeader() {
    if (!drawerIsOpen()) setHidden(false);
  }

  function update() {
    var currentScrollY = window.scrollY;
    var delta = currentScrollY - lastScrollY;

    if (drawerIsOpen()) {
      lastScrollY = currentScrollY;
      ticking = false;
      return;
    }

    if (currentScrollY <= SCROLL_THRESHOLD) {
      setHidden(false);
    } else if (Math.abs(delta) > DELTA_THRESHOLD) {
      setHidden(delta > 0);
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  document.addEventListener('scroll', requestUpdate, { passive: true, capture: true });

  window.addEventListener('wheel', function (e) {
    if (e.deltaY < -DELTA_THRESHOLD) revealHeader();
  }, { passive: true });

  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length) lastTouchY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (!e.touches || !e.touches.length || lastTouchY === null) return;
    var currentTouchY = e.touches[0].clientY;
    if (currentTouchY - lastTouchY > DELTA_THRESHOLD) revealHeader();
    lastTouchY = currentTouchY;
  }, { passive: true });

  document.addEventListener('touchend', function () {
    lastTouchY = null;
  }, { passive: true });
})();
