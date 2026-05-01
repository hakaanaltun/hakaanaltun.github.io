/* js/nav-scrollspy.js — Nav carousel: right-edge fade + homepage scroll-spy */
(function () {
  'use strict';

  var navBar = document.querySelector('.header-nav-bar');
  if (!navBar) return;

  /* ── Right-edge gradient fade: hide mask when scrolled to end ── */
  function updateFade() {
    /* -2 tolerance accounts for sub-pixel rounding in browsers */
    var atEnd = navBar.scrollLeft + navBar.clientWidth >= navBar.scrollWidth - 2;
    navBar.classList.toggle('at-end', atEnd);
  }
  navBar.addEventListener('scroll', updateFade, { passive: true });
  window.addEventListener('resize', updateFade, { passive: true });
  updateFade();

  /* ── Scroll-spy: only active on the homepage ── */
  /* The homepage has a #quotes hero; essay pages do not. */
  var sections = document.querySelectorAll(
    '#quotes, #essays, #fragments, #on-series, #book, #moris, #about, #subscribe, #connect'
  );
  if (!sections.length) return;

  if (!('IntersectionObserver' in window)) return;

  /* Map section IDs → the href used in the nav bar */
  var hrefMap = {
    'quotes':    '/#quotes',
    'essays':    '/#essays',
    'fragments': '/#fragments',
    'on-series': '/#on-series',
    'book':      '/#book',
    'moris':     '/#moris',
    'about':     '/#about',
    'subscribe': '/#subscribe',
    'connect':   '/#connect'
  };

  function getLinkForId(id) {
    var href = hrefMap[id];
    return href ? navBar.querySelector('a[href="' + href + '"]') : null;
  }

  /* Track intersecting state per section (in DOM order) */
  var intersecting = [];
  for (var k = 0; k < sections.length; k++) intersecting[k] = false;

  var currentActive = null;

  function updateActive() {
    /* Activate the topmost (first in DOM order) currently-intersecting section */
    for (var i = 0; i < sections.length; i++) {
      if (!intersecting[i]) continue;
      var link = getLinkForId(sections[i].id);
      if (!link || link === currentActive) return;
      currentActive = link;
      /* currentActive.classList.add('nav-active'); */
      try {
        /* scrollIntoView with options is widely supported; no-op fallback on very old Safari */
        currentActive.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (e) { /* ignore */ }
      return;
    }
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      for (var i = 0; i < sections.length; i++) {
        if (sections[i] === entry.target) {
          intersecting[i] = entry.isIntersecting;
          break;
        }
      }
    });
    updateActive();
  }, {
    /* Section is "active" when its top has passed ~28% from the top of the viewport
       and the section occupies the upper-middle band (28%–50%). */
    rootMargin: '-28% 0px -50% 0px',
    threshold: 0
  });

  for (var j = 0; j < sections.length; j++) {
    observer.observe(sections[j]);
  }

  /* ── Suppress auto-hide during anchor-link navigation ── */
  /* Keep suppression active until scrolling actually stops (debounced 150ms),
     instead of a fixed timeout that may expire before a long smooth-scroll finishes. */
  function suppressUntilScrollStops() {
    window.suppressHeaderAutoHide = true;
    clearTimeout(window.__autoHideResumeTimer);
    function onScroll() {
      clearTimeout(window.__autoHideResumeTimer);
      window.__autoHideResumeTimer = setTimeout(function () {
        window.suppressHeaderAutoHide = false;
        window.removeEventListener('scroll', onScroll);
      }, 150);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var navLinks = navBar.querySelectorAll('a');
  for (var n = 0; n < navLinks.length; n++) {
    navLinks[n].addEventListener('click', suppressUntilScrollStops);
  }

})();
