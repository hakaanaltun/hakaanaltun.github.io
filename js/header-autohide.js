/* header-autohide.js — direction-based auto-hide header */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  var scrollRoot = document.scrollingElement || document.documentElement;
  var lastScrollY = getScrollY();
  var lastTouchY = null;
  var touchTravel = 0;
  var ticking = false;

  /* Above this the header always shows: the top of the page is where it
     belongs, whichever way the reader is going. */
  var SCROLL_THRESHOLD = 80;
  /* Travel in one direction before the band moves. A single delta used to be
     enough (5px), and a trackpad's momentum and jitter cross 5px in both
     directions constantly — so an ordinary downward scroll flashed the header
     in and out every few frames. Accumulating the travel and clearing it on a
     reversal means only a deliberate movement counts, and the reveal is the
     more demanding of the two so a stray upward nudge cannot summon it. */
  var HIDE_TRAVEL = 24;
  var SHOW_TRAVEL = 64;
  /* Same idea for a finger: the drag has to be a real one. */
  var TOUCH_TRAVEL = 40;

  /* Signed distance travelled since the last change of direction. */
  var travel = 0;

  function getScrollY() {
    return scrollRoot.scrollTop || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function setHidden(shouldHide) {
    header.classList.toggle('header-hidden', shouldHide);
    travel = 0;
  }

  function revealHeader() {
    setHidden(false);
  }

  function update() {
    var currentScrollY = getScrollY();
    var delta = currentScrollY - lastScrollY;

    lastScrollY = currentScrollY;
    ticking = false;

    if (currentScrollY <= SCROLL_THRESHOLD) {
      setHidden(false);
      return;
    }

    if (!delta) return;

    /* A reversal starts the count over, so travel is always one gesture's. */
    if ((delta > 0) !== (travel > 0)) travel = 0;
    travel += delta;

    if (travel > HIDE_TRAVEL) setHidden(true);
    else if (travel < -SHOW_TRAVEL) setHidden(false);
  }

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  document.addEventListener('scroll', requestUpdate, { passive: true, capture: true });

  /* Wheel events need no handler of their own: they scroll the page, and the
     scroll accumulator above already reads them — with hysteresis, which a
     per-event reveal here could only undo. */

  document.addEventListener('touchstart', function (event) {
    if (event.touches && event.touches.length) {
      lastTouchY = event.touches[0].clientY;
      touchTravel = 0;
    }
  }, { passive: true });

  document.addEventListener('touchmove', function (event) {
    if (!event.touches || !event.touches.length || lastTouchY === null) return;

    var currentTouchY = event.touches[0].clientY;
    var touchDelta = currentTouchY - lastTouchY;

    /* A finger moving down is the page moving up. Touch is handled here as
       well as through the scroll accumulator because a drag begins before the
       page has moved at all, and during momentum some browsers hold their
       scroll events back until it settles. */
    if ((touchDelta > 0) !== (touchTravel > 0)) touchTravel = 0;
    touchTravel += touchDelta;

    if (touchTravel > TOUCH_TRAVEL) {
      revealHeader();
      touchTravel = 0;
      lastScrollY = getScrollY();
    }

    lastTouchY = currentTouchY;
  }, { passive: true });

  document.addEventListener('touchend', function () {
    lastTouchY = null;
    touchTravel = 0;
  }, { passive: true });

  /* If keyboard focus lands inside the auto-hidden header (Tab, shift-Tab),
     bring it back so the focused control is actually visible. */
  header.addEventListener('focusin', function () {
    if (header.classList.contains('header-hidden')) {
      revealHeader();
      lastScrollY = getScrollY();
    }
  });

  window.addEventListener('pageshow', function () {
    lastScrollY = getScrollY();
    setHidden(false);
  });
})();
