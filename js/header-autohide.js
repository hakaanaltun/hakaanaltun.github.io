/* header-autohide.js — direction-based auto-hide header */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  var scrollRoot = document.scrollingElement || document.documentElement;
  var lastScrollY = getScrollY();
  var lastTouchY = null;
  var ticking = false;
  var SCROLL_THRESHOLD = 80;
  var DELTA_THRESHOLD = 5;

  function getScrollY() {
    return scrollRoot.scrollTop || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function setHidden(shouldHide) {
    header.classList.toggle('header-hidden', shouldHide);
  }

  function revealHeader() {
    setHidden(false);
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

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  document.addEventListener('scroll', requestUpdate, { passive: true, capture: true });

  window.addEventListener('wheel', function (event) {
    if (event.deltaY < -DELTA_THRESHOLD) {
      revealHeader();
      lastScrollY = getScrollY();
    }
  }, { passive: true });

  document.addEventListener('touchstart', function (event) {
    if (event.touches && event.touches.length) {
      lastTouchY = event.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchmove', function (event) {
    if (!event.touches || !event.touches.length || lastTouchY === null) return;

    var currentTouchY = event.touches[0].clientY;
    var touchDelta = currentTouchY - lastTouchY;

    if (touchDelta > DELTA_THRESHOLD) {
      revealHeader();
      lastScrollY = getScrollY();
    }

    lastTouchY = currentTouchY;
  }, { passive: true });

  document.addEventListener('touchend', function () {
    lastTouchY = null;
  }, { passive: true });

  window.addEventListener('pageshow', function () {
    lastScrollY = getScrollY();
    setHidden(false);
  });
})();
