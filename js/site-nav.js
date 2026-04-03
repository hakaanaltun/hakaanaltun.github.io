/* site-nav.js — Shared drawer sidebar for all pages */
(function () {
  'use strict';

  /* ── Header scroll detection ── */
  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
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

  if (!toggleBtn || !drawer || !backdrop || !closeBtn) return;

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('drawer-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
  }

  function closeDrawer(restoreFocus) {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
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
          var target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
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
