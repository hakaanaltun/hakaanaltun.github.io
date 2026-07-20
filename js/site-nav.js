/* site-nav.js — Drawer, share button, and horizontal scrollers. Header autohide is handled by header-autohide.js. */
(function () {
  'use strict';

  /* ── Footer share button: native share sheet, or copy the link ── */
  var shareBtn = document.querySelector('.footer-share-btn');

  if (shareBtn) {
    /* The button is icon-only, so the "copied" feedback swaps the share icon
       for a checkmark and restores it — the original markup is captured once
       so repeated clicks can't lose it. */
    var shareIconHtml = shareBtn.innerHTML;
    var shareIconLabel = shareBtn.getAttribute('aria-label');
    var shareRestoreT;
    var checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

    shareBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (navigator.share) {
        navigator.share({ title: document.title, url: window.location.href }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(function () {
          shareBtn.innerHTML = checkSvg;
          shareBtn.setAttribute('aria-label', 'Link copied');
          clearTimeout(shareRestoreT);
          shareRestoreT = setTimeout(function () {
            shareBtn.innerHTML = shareIconHtml;
            if (shareIconLabel) shareBtn.setAttribute('aria-label', shareIconLabel);
          }, 1600);
        }).catch(function () {});
      }
    });
  }

  /* ── Footer actions dropdown (phone portrait): the chevron toggles the
     strip's icon controls. Elsewhere the chevron is display:none and the
     controls sit inline, so this wiring is inert. ── */
  var actionsWrap = document.querySelector('.footer-actions-wrap');
  var actionsToggle = document.querySelector('.footer-actions-toggle');

  if (actionsWrap && actionsToggle) {
    var closeActions = function () {
      actionsWrap.classList.remove('open');
      actionsToggle.setAttribute('aria-expanded', 'false');
    };

    actionsToggle.addEventListener('click', function () {
      var open = actionsWrap.classList.toggle('open');
      actionsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (actionsWrap.classList.contains('open') && !actionsWrap.contains(e.target)) {
        closeActions();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeActions();
    });
  }

  /* ── Horizontal scrollers: hidden scrollbar, paged wheel + drag support ── */
  function enableHorizontalScroller(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      var wheelLocked = false;

      el.addEventListener('wheel', function (e) {
        if (el.scrollWidth <= el.clientWidth) return;

        var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (!delta) return;

        e.preventDefault();

        if (wheelLocked) return;
        wheelLocked = true;

        var firstChild = el.firstElementChild;
        var gap = parseFloat(getComputedStyle(el).columnGap) || 0;
        var stride = firstChild ? firstChild.offsetWidth + gap : el.clientWidth;
        var currentIndex = Math.round(el.scrollLeft / stride);
        var targetLeft = (delta > 0 ? currentIndex + 1 : currentIndex - 1) * stride;

        el.scrollTo({ left: targetLeft, behavior: 'smooth' });

        var unlockTimer = window.setTimeout(function () { wheelLocked = false; }, 700);
        el.addEventListener('scrollend', function () {
          wheelLocked = false;
          clearTimeout(unlockTimer);
        }, { once: true });
      }, { passive: false });

      var isDown = false;
      var startX = 0;
      var startScrollLeft = 0;
      var moved = false;

      el.addEventListener('pointerdown', function (e) {
        /* Touch (and pen) devices already get native scrolling and tap
           handling from CSS overflow-x/-webkit-overflow-scrolling; running
           the custom drag detection for them too caused normal taps to be
           misread as drags (any >5px finger jitter cancelled the click),
           making links intermittently unresponsive on mobile. Only mice
           need the manual drag-to-scroll behaviour. */
        if (e.pointerType !== 'mouse') return;
        if (el.scrollWidth <= el.clientWidth) return;
        isDown = true;
        moved = false;
        startX = e.clientX;
        startScrollLeft = el.scrollLeft;
        /* setPointerCapture is intentionally deferred to pointermove after the
           movement threshold so that anchor clicks fire naturally. */
      });

      el.addEventListener('pointermove', function (e) {
        if (!isDown) return;
        var distance = e.clientX - startX;
        if (Math.abs(distance) > 5) {
          if (!moved) {
            moved = true;
            el.classList.add('is-dragging');
            try { el.setPointerCapture(e.pointerId); } catch (err) {}
          }
          el.scrollLeft = startScrollLeft - distance;
        }
      });

      function endDrag(e) {
        if (!isDown) return;
        isDown = false;
        el.classList.remove('is-dragging');
        try { el.releasePointerCapture(e.pointerId); } catch (err) {}
      }

      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
      el.addEventListener('mouseleave', function () {
        isDown = false;
        el.classList.remove('is-dragging');
      });

      el.addEventListener('click', function (e) {
        if (!moved) return;
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }, true);
    });
  }

  /* Edge fades for horizontal strips: the fade only appears on a side
     that still has content beyond it. */
  function trackEdgeFades(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      function update() {
        var max = el.scrollWidth - el.clientWidth;
        el.classList.remove('fade-l', 'fade-r', 'fade-lr');
        if (max <= 1) return;
        var x = el.scrollLeft;
        if (x <= 1) el.classList.add('fade-r');
        else if (x >= max - 1) el.classList.add('fade-l');
        else el.classList.add('fade-lr');
      }
      el.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  /* Book retailer strip and the phone header nav are the only horizontal
     scrollers left — Further back went back to a plain grid. */
  enableHorizontalScroller('#book .book-retailers');
  trackEdgeFades('#book .book-retailers');
  enableHorizontalScroller('.header-nav-bar');
  trackEdgeFades('.header-nav-bar');

  /* ── Drawer elements ── */
  var toggleBtn = document.querySelector('.hamburger-btn');
  var drawer = document.getElementById('site-drawer');
  var backdrop = document.getElementById('site-drawer-backdrop');
  var closeBtn = document.getElementById('site-drawer-close');
  var root = document.documentElement;

  if (!toggleBtn || !drawer || !backdrop || !closeBtn) return;

  var siteHeader = document.getElementById('site-header');
  var drawerLogo = drawer.querySelector('.drawer-logo-link');

  function syncDrawerBand() {
    if (!siteHeader) return;
    var h = siteHeader.offsetHeight;
    root.style.setProperty('--head-band', h + 'px');
    if (drawerLogo) {
      var logoBottom = drawerLogo.offsetTop + drawerLogo.offsetHeight;
      root.style.setProperty('--drawer-logo-mb', Math.max(16, h - logoBottom + 6) + 'px');
    }
  }

  function openDrawer() {
    if (siteHeader) siteHeader.classList.remove('header-hidden');
    drawer.classList.add('open');
    backdrop.classList.add('open');
    root.classList.add('drawer-open');
    document.body.classList.add('drawer-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    syncDrawerBand();
    closeBtn.focus({ preventScroll: true });
  }

  function closeDrawer(restoreFocus) {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    root.classList.remove('drawer-open');
    document.body.classList.remove('drawer-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    if (restoreFocus === true) toggleBtn.focus({ preventScroll: true });
  }

  toggleBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (drawer.classList.contains('open')) closeDrawer(false);
    else openDrawer();
  });

  /* Focus returns to the hamburger on every close, so keyboard users are
     never stranded inside the hidden drawer. */
  closeBtn.addEventListener('click', function () { closeDrawer(true); });
  backdrop.addEventListener('click', function () { closeDrawer(true); });

  /* Focus trap: while the drawer is open, Tab cycles inside it. */
  drawer.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !drawer.classList.contains('open')) return;
    var focusables = drawer.querySelectorAll(
      'a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    var list = Array.prototype.filter.call(focusables, function (el) {
      return el.getClientRects().length > 0;   /* skip links inside closed <details> */
    });
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (drawer.classList.contains('open')) syncDrawerBand();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer(true);
    }
  });

  document.querySelectorAll('a.nav-home[href="#"], a.footer-home[href="#"], a.footer-home-link[href="#"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  var links = drawer.querySelectorAll('a');
  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href) return;

      var isAnchor = href.charAt(0) === '#';
      var isRemoteAnchor = !isAnchor && href.indexOf('#') !== -1;

      if (isAnchor) {
        e.preventDefault();
        closeDrawer(false);
        setTimeout(function () {
          if (href === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            var target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        closeDrawer(false);
        if (isRemoteAnchor) {
          /* Let browser handle naturally after unlock. */
        }
      }
    });
  });
})();