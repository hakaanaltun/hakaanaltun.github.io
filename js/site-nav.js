/* site-nav.js — Drawer, share button, and horizontal scrollers. Header autohide is handled by header-autohide.js. */
(function () {
  'use strict';

  /* ── Footer share button ── */
  var findMe = document.querySelector('.footer-findme');
  var shareBtn = document.querySelector('.footer-share-btn');

  if (!shareBtn && findMe && navigator.share) {
    var shareWrap = document.createElement('div');
    shareWrap.className = 'footer-share-wrap';

    shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'footer-share-btn';
    shareBtn.setAttribute('aria-label', 'Share this page');
    shareBtn.textContent = 'Share';

    shareWrap.appendChild(shareBtn);
    findMe.appendChild(shareWrap);
  }

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

  /* ── Horizontal scrollers: hidden scrollbar, paged wheel + drag support ── */
  function enableHorizontalScroller(selector) {
    var els = document.querySelectorAll(selector);
    Array.prototype.forEach.call(els, function (el) {
      if (!el) return;

      /* wheel/trackpad: jest başına bir görüntü kadar ilerle, momentumu yut */
      var wheelLocked = false, unlockTimer = null;
      el.addEventListener('wheel', function (e) {
        var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (!delta) return;
        e.preventDefault();
        if (unlockTimer) clearTimeout(unlockTimer);
        unlockTimer = setTimeout(function () { wheelLocked = false; }, 260); // flick durunca aç
        if (wheelLocked) return;
        wheelLocked = true;
        el.scrollBy({ left: delta > 0 ? el.clientWidth : -el.clientWidth, behavior: 'smooth' });
      }, { passive: false });

      /* drag: capture SADECE gerçek sürüklemede → düz tık anchor'a gider */
      var isDown = false, moved = false, captured = false;
      var startX = 0, startScrollLeft = 0, activeId = null;

      el.addEventListener('pointerdown', function (e) {
        if (el.scrollWidth <= el.clientWidth) return; // kaydıracak bir şey yoksa tıka karışma
        isDown = true; moved = false; captured = false;
        activeId = e.pointerId; startX = e.clientX; startScrollLeft = el.scrollLeft;
      });

      el.addEventListener('pointermove', function (e) {
        if (!isDown) return;
        var distance = e.clientX - startX;
        if (!moved && Math.abs(distance) > 5) {
          moved = true; captured = true;
          el.classList.add('is-dragging');
          try { el.setPointerCapture(activeId); } catch (err) {}
        }
        if (moved) el.scrollLeft = startScrollLeft - distance;
      });

      function endDrag() {
        if (!isDown) return;
        isDown = false;
        el.classList.remove('is-dragging');
        if (captured) { try { el.releasePointerCapture(activeId); } catch (err) {} }
        captured = false;
      }
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
      el.addEventListener('mouseleave', function () {
        if (!isDown) return;
        isDown = false; el.classList.remove('is-dragging');
      });

      /* sürüklemeyi bitiren tık'ı yut, gerçek tık'ı geçir */
      el.addEventListener('click', function (e) {
        if (!moved) return;
        e.preventDefault(); e.stopPropagation(); moved = false;
      }, true);
    });
  }

  enableHorizontalScroller('#book .book-links-grid');
  enableHorizontalScroller('#further-back .further-back-grid');

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

  closeBtn.addEventListener('click', function () { closeDrawer(false); });
  backdrop.addEventListener('click', function () { closeDrawer(false); });

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