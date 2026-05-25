/* header-autohide.js — Medium-style auto-hide header, with footer guard */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  if (!header) return;

  var footer = document.querySelector('footer');
  var lastScrollY = window.scrollY;
  var ticking = false;
  var SCROLL_THRESHOLD = 80;
  var DELTA_THRESHOLD  = 5;
  var footerVisible = false;

  function setHidden(shouldHide) {
    if (shouldHide) header.classList.add('header-hidden');
    else header.classList.remove('header-hidden');
  }

  function drawerIsOpen() {
    return document.body.classList.contains('drawer-open') || document.documentElement.classList.contains('drawer-open');
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
      if (delta < 0) {
        setHidden(false);
      } else if (footerVisible || delta > 0) {
        setHidden(true);
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

  if (footer && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      footerVisible = entries.some(function (entry) { return entry.isIntersecting; });
      update();
    }, { root: null, threshold: 0, rootMargin: '-1px 0px 0px 0px' });
    observer.observe(footer);
  }
})();
