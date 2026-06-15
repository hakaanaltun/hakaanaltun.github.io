/* site-nav.js — Drawer + share button. Header autohide is handled by header-autohide.js. */
(function () {
  'use strict';

  /* ── Share button ── */
  var shareBtn = document.querySelector('.footer-share-btn');
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

  var siteHeader = document.getElementById('site-header');
  var drawerLogo = drawer.querySelector('.drawer-logo-link');

  /* Drawer'ın yeşil bandını header'ın canlı yüksekliğine eşitler — tüm cihazlarda tam hizalama */
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

  closeBtn.addEventListener('click', function () { closeDrawer(false); });
  backdrop.addEventListener('click', function () { closeDrawer(false); });

  /* Cihaz döndürülünce / pencere yeniden boyutlanınca, drawer açıksa bandı tazele */
  window.addEventListener('resize', function () {
    if (drawer.classList.contains('open')) syncDrawerBand();
  });

  /* ESC closes drawer — keyboard user, restore focus */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer(true);
    }
  });

  /* ── Header & footer logo scroll-to-top on homepage ── */
  document.querySelectorAll('a.nav-home[href="#"], a.footer-home[href="#"], a.footer-home-link[href="#"]').forEach(function (el) {
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