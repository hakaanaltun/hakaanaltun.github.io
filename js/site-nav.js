/* site-nav.js—Shared drawer sidebar for all pages */
(function () {
  'use strict';

  /* ── Header scroll detection + rescue ── */
  var header = document.getElementById('site-header');
  if (header) {
    var lastHeaderScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    var headerTicking = false;
    var HEADER_DELTA = 5;

    function getHeaderScrollY() {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    function showHeader() {
      header.classList.remove('header-hidden');
      header.style.transform = 'translateY(0)';
    }

    function allowHeaderAutoHide() {
      header.style.transform = '';
    }

    function updateHeaderState() {
      var currentY = getHeaderScrollY();
      var delta = currentY - lastHeaderScrollY;

      if (currentY > 20) header.classList.add('scrolled');
      else header.classList.remove('scrolled');

      if (delta < -HEADER_DELTA) {
        showHeader();
      } else if (delta > HEADER_DELTA) {
        allowHeaderAutoHide();
      }

      lastHeaderScrollY = currentY;
      headerTicking = false;
    }

    function requestHeaderUpdate() {
      if (!headerTicking) {
        window.requestAnimationFrame(updateHeaderState);
        headerTicking = true;
      }
    }

    window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
    document.addEventListener('scroll', requestHeaderUpdate, { passive: true, capture: true });

    window.addEventListener('wheel', function (event) {
      if (event.deltaY < -HEADER_DELTA) showHeader();
      else if (event.deltaY > HEADER_DELTA) allowHeaderAutoHide();
    }, { passive: true });

    var lastTouchY = null;
    document.addEventListener('touchstart', function (event) {
      if (event.touches && event.touches.length) lastTouchY = event.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', function (event) {
      if (!event.touches || !event.touches.length || lastTouchY === null) return;
      var currentTouchY = event.touches[0].clientY;
      var touchDelta = currentTouchY - lastTouchY;
      if (touchDelta > HEADER_DELTA) showHeader();
      else if (touchDelta < -HEADER_DELTA) allowHeaderAutoHide();
      lastTouchY = currentTouchY;
    }, { passive: true });

    document.addEventListener('touchend', function () {
      lastTouchY = null;
    }, { passive: true });
  }

  /* ── Share button ── */
  var shareBtn = document.querySelector('.header-share-btn') || document.querySelector('.essay-share-btn');
  if (shareBtn) {
    if (navigator.share) {
      shareBtn.addEventListener('click', function (e) {
        e.preventDefault();
        navigator.share({ title: document.title, url: window.location.href }).catch(function () {});
      });
    } else {
      shareBtn.style.display = 'none';
    }
  }

  /* ── Drawer elements ── */
  var toggleBtn = document.querySelector('.hamburger-btn');
  var drawer = document.getElementById('site-drawer');
  var backdrop = document.getElementById('site-drawer-backdrop');
  var closeBtn = document.getElementById('site-drawer-close');
  var root = document.documentElement;

  if (!toggleBtn || !drawer || !backdrop || !closeBtn) return;

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    root.classList.add('drawer-open');
    document.body.classList.add('drawer-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
  }

  function closeDrawer(restoreFocus) {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    root.classList.remove('drawer-open');
    document.body.classList.remove('drawer-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    if (restoreFocus !== false) toggleBtn.focus();
  }

  toggleBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (drawer.classList.contains('open')) closeDrawer();
    else openDrawer();
  });

  closeBtn.addEventListener('click', function () { closeDrawer(); });
  backdrop.addEventListener('click', function () { closeDrawer(); });

  /* ESC closes drawer */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  /* ── Header & footer logo scroll-to-top on homepage ── */
  document.querySelectorAll('a.nav-home[href="#"], a.footer-home[href="#"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ── Close‑then‑navigate for links inside drawer ── */
  var links = drawer.querySelectorAll('a');
  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href) return;

      /* On-page anchor on same page */
      var isAnchor = href.charAt(0) === '#';
      /* Anchor to homepage section from essay page, e.g. ../#about */
      var isRemoteAnchor = !isAnchor && href.indexOf('#') !== -1;

      if (isAnchor) {
        e.preventDefault();
        closeDrawer(false);
        /* Wait for drawer close transition then scroll */
        setTimeout(function () {
          if (href === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            var target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        /* Normal link or remote anchor – close drawer first, then navigate */
        closeDrawer(false);
        /* Small delay so scroll lock is removed before navigation */
        if (isRemoteAnchor) {
          /* Let browser handle naturally after unlock */
        }
      }
    });
  });
})();
