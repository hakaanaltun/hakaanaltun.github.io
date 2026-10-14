/* site-nav.js — The site's menu (its drawer), The House's menu in the header, the reader's drawer over the page, the share button, and horizontal scrollers. Header autohide is handled by header-autohide.js. */
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

        /* Only a sideways gesture pages the strip. Reading the larger of the
           two axes meant a plain downward wheel over one of these — the
           retailer row sits mid-page, the nav strip is stuck to the top of
           every narrow window — was swallowed by preventDefault below and
           spent scrolling the strip instead. The page simply stopped moving
           wherever the pointer happened to rest. A mouse without a sideways
           wheel still has the drag below. */
        var delta = e.deltaX;
        if (Math.abs(delta) <= Math.abs(e.deltaY)) return;
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

  /* ── Your drawer, over the page ──
     "Your drawer" under The House in the header and in the site's menu,
     and the drawer in the footer, open the reader's drawer over the page
     they are on, and closing it leaves them there (js/drawer.js). In The
     House it is the room's own drawer, opened over whichever room or door
     is showing. What a page lacks of the drawer's scripts and styles
     (_data/drawer_assets.yml) is fetched the first time it is asked for;
     if that fails, the link goes on to the drawer in The House. */
  var drawerLoading = null;
  function addStyle(href) {
    return new Promise(function (resolve) {
      if (!href || document.querySelector('link[href^="' + href.split('?')[0] + '"]')) { resolve(); return; }
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = link.onerror = function () { resolve(); };
      document.head.appendChild(link);
    });
  }
  function addScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = function () { resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  function loadDrawer() {
    if (window.OLAE_DRAWER && window.OLAE_KEEP) return Promise.resolve();
    if (drawerLoading) return drawerLoading;
    var assets = window.OLAE_DRAWER_ASSETS || {};
    var scripts = (window.OLAE_KEEP ? Promise.resolve() : addScript(assets.keep_js))
      .then(function () { return window.OLAE_DRAWER ? null : addScript(assets.drawer_js); });
    drawerLoading = Promise.all([addStyle(assets.keep_css), addStyle(assets.drawer_css), scripts]).then(function () {
      if (!window.OLAE_DRAWER) throw new Error('No drawer');
    });
    drawerLoading.catch(function () { drawerLoading = null; });
    return drawerLoading;
  }
  function openYourDrawer(link, from) {
    if (window.OLAE_HOUSE && window.OLAE_HOUSE.openDrawer) { window.OLAE_HOUSE.openDrawer(from); return; }
    loadDrawer().then(function () { window.OLAE_DRAWER.open(from); }, function () { location.href = link.href; });
  }
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[data-open-drawer]');
    if (!link || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    // Focus comes back, once the drawer closes, to what is still there to
    // hold it: the menu's button when the drawer was opened from a menu.
    var from = link;
    if (link.closest('#site-drawer')) from = document.querySelector('.hamburger-btn');
    else if (link.closest('#nav-house-menu')) from = houseLink || document.querySelector('.nav-house-toggle');
    closeHouseMenu(false);
    openYourDrawer(link, from);
  });
  /* An address that ends in #drawer opens the drawer over its page: it is
     the way back from The Page or an instrument the drawer led to
     (js/drawer.js). The House opens its own. */
  if (location.hash === '#drawer' && location.pathname !== '/house/') {
    loadDrawer().then(function () { window.OLAE_DRAWER.open(null); }, function () {});
  }

  /* ── The House's menu in the header ──
     A pointer over The House opens it. A click or a tap on the name opens
     it too, as the chevron does, and no longer goes to the door: "To the
     door" in the menu does that (the author asked on 14 October 2026). A
     click that opens a new tab or window still goes there. The name is the
     menu's one control for the keyboard; the chevron beside it is a second
     place to tap, out of the tab order. Without this script the name stays
     the plain link to the door. The menu stands outside the strip, which
     scrolls on a phone and would cut it off, so it is placed under The
     House each time it opens. */
  var houseItem = document.querySelector('.nav-house');
  var houseLink = houseItem && houseItem.querySelector('a');
  var houseToggle = houseItem && houseItem.querySelector('.nav-house-toggle');
  var houseMenu = document.getElementById('nav-house-menu');
  var houseNav = houseMenu && houseMenu.parentNode;
  var houseTimer = 0;
  // Whether a mouse's hover opened the menu: the click that follows it then
  // leaves it open. A finger's tap leaves :hover on what it touched, so
  // :hover itself cannot say this, and a second tap must fold the menu.
  var houseByHover = false;
  function setHouseExpanded(open) {
    houseToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (houseLink) houseLink.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function placeHouseMenu() {
    var at = houseItem.getBoundingClientRect(), box = houseNav.getBoundingClientRect();
    var left = Math.max(8, Math.min(at.left - box.left - 10, box.width - houseMenu.offsetWidth - 8));
    houseMenu.style.left = left + 'px';
    houseMenu.style.top = (at.bottom - box.top + 6) + 'px';
  }
  function openHouseMenu(focusFirst, byHover) {
    clearTimeout(houseTimer);
    if (!houseMenu.hidden) { if (focusFirst) houseMenu.querySelector('a').focus(); return; }
    houseByHover = !!byHover;
    houseMenu.hidden = false;
    setHouseExpanded(true);
    placeHouseMenu();
    if (focusFirst) houseMenu.querySelector('a').focus();
  }
  function closeHouseMenu(back) {
    clearTimeout(houseTimer);
    if (!houseMenu || houseMenu.hidden) return;
    houseMenu.hidden = true;
    setHouseExpanded(false);
    if (back) (houseLink || houseToggle).focus();
  }
  function toggleHouseMenu(e) {
    // A click that only follows the mouse's hover leaves it open.
    if (!houseMenu.hidden && houseByHover && e.detail) { houseByHover = false; return; }
    if (houseMenu.hidden) openHouseMenu(e.detail === 0); else closeHouseMenu(false);
  }
  if (houseItem && houseLink && houseToggle && houseMenu) {
    houseToggle.hidden = false;
    houseToggle.tabIndex = -1;
    houseToggle.addEventListener('click', toggleHouseMenu);
    houseLink.setAttribute('role', 'button');
    houseLink.setAttribute('aria-controls', houseMenu.id);
    houseLink.setAttribute('aria-expanded', 'false');
    houseLink.addEventListener('click', function (e) {
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      toggleHouseMenu(e);
    });
    // A button answers Space as well as Enter.
    houseLink.addEventListener('keydown', function (e) {
      if (e.key !== ' ' || e.repeat) return;
      e.preventDefault();
      houseLink.click();
    });
    var hovering = window.matchMedia && window.matchMedia('(hover: hover)');
    [houseItem, houseMenu].forEach(function (el) {
      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse' && hovering && hovering.matches) openHouseMenu(false, true);
      });
      el.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(houseTimer);
        houseTimer = setTimeout(function () {
          if (!houseItem.matches(':hover') && !houseMenu.matches(':hover') && !houseMenu.contains(document.activeElement)) closeHouseMenu(false);
        }, 220);
      });
    });
    document.addEventListener('click', function (e) {
      if (!houseMenu.hidden && !houseItem.contains(e.target) && !houseMenu.contains(e.target)) closeHouseMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !houseMenu.hidden) closeHouseMenu(houseMenu.contains(document.activeElement) || document.activeElement === houseLink || document.activeElement === houseToggle);
    });
    houseMenu.addEventListener('focusout', function (e) {
      if (!houseMenu.contains(e.relatedTarget) && e.relatedTarget !== houseLink && e.relatedTarget !== houseToggle) closeHouseMenu(false);
    });
    window.addEventListener('resize', function () { if (!houseMenu.hidden) placeHouseMenu(); });
    var strip = houseItem.closest('.header-nav-bar');
    if (strip) strip.addEventListener('scroll', function () { closeHouseMenu(false); }, { passive: true });
  }

  /* ── Drawer elements ── */
  var toggleBtn = document.querySelector('.hamburger-btn');
  var drawer = document.getElementById('site-drawer');
  var backdrop = document.getElementById('site-drawer-backdrop');
  var closeBtn = document.getElementById('site-drawer-close');
  var root = document.documentElement;

  if (!toggleBtn || !drawer || !backdrop || !closeBtn) return;

  var siteHeader = document.getElementById('site-header');
  var drawerLogo = drawer.querySelector('.drawer-logo-link');

  /* --head-band is the site's one record of how tall the sticky header is
     (declared in style.css, which explains what reads it). CSS can only
     guess the number; the header's real height moves with the breakpoints,
     with the nav strip disappearing in landscape, and with the fonts as they
     load. So it is measured here and written back.

     This used to run only when the drawer opened, which made the variable a
     half-truth: correct after the reader had opened the menu once, the CSS
     guess before that, and never corrected on a resize unless the drawer
     happened to be open at the time. Anything derived from it — the anchor
     offset, the drawer's own band — inherited that. It runs on load, on
     resize and on drawer-open now, so there is one number and it is true. */
  function syncHeadBand() {
    if (!siteHeader) return;
    var h = siteHeader.offsetHeight;
    root.style.setProperty('--head-band', h + 'px');
    if (drawerLogo) {
      /* Measured against the drawer, not against whatever happens to be the
         logo's offsetParent: the brand sits inside .drawer-head now, and a
         positioned wrapper would have made offsetTop count from there and
         quietly drop the head's own padding out of the sum. */
      var logoBottom = drawerLogo.getBoundingClientRect().bottom - drawer.getBoundingClientRect().top;
      root.style.setProperty('--drawer-logo-mb', Math.max(16, Math.round(h - logoBottom + 6)) + 'px');
    }
  }

  syncHeadBand();
  /* The header is set in EB Garamond; until it arrives the band is a
     fallback face's height. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncHeadBand).catch(function () {});
  }

  function openDrawer() {
    if (siteHeader) siteHeader.classList.remove('header-hidden');
    drawer.classList.add('open');
    backdrop.classList.add('open');
    root.classList.add('drawer-open');
    document.body.classList.add('drawer-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    syncHeadBand();
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

  /* offsetHeight forces layout, and resize fires all through a window drag,
     so the measurement is held to one per frame. */
  var bandTicking = false;
  window.addEventListener('resize', function () {
    if (bandTicking) return;
    bandTicking = true;
    window.requestAnimationFrame(function () {
      bandTicking = false;
      syncHeadBand();
    });
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