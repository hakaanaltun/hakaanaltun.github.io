/* theme.js — footer theme menu (light / dark / midnight).
   The effective theme is the stored choice if any, else the system
   preference. head.html applies the stored choice to <html data-theme>
   (and points the theme-color metas at it) before CSS paints, so this
   file only has to wire the menu and keep the metas in step. */
(function () {
  'use strict';
  var btn = document.getElementById('theme-toggle');
  var menu = document.getElementById('theme-menu');
  if (!btn || !menu) return;
  var THEMES = ['light', 'dark', 'midnight'];
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function stored() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }
  function effective() {
    var t = document.documentElement.getAttribute('data-theme');
    if (THEMES.indexOf(t) !== -1) return t;
    return mq.matches ? 'dark' : 'light';
  }
  /* Keep <meta name="theme-color"> on the active palette. A manual choice
     pins both metas to the chosen colour (data-light/data-dark/data-midnight,
     written by head.html); without one they fall back to their per-media
     defaults so the system preference keeps working on its own. */
  function syncThemeColor() {
    var t = stored();
    var manual = THEMES.indexOf(t) !== -1;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      var next = manual ? m.getAttribute('data-' + t) : m.getAttribute('data-default');
      if (next) m.setAttribute('content', next);
    });
  }
  function syncMenu() {
    var t = effective();
    menu.querySelectorAll('[data-set-theme]').forEach(function (item) {
      item.setAttribute('aria-checked', item.getAttribute('data-set-theme') === t ? 'true' : 'false');
    });
  }
  function openMenu() {
    syncMenu();
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu(refocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (refocus) btn.focus();
  }
  btn.hidden = false;
  syncThemeColor();
  btn.addEventListener('click', function () {
    if (menu.hidden) openMenu(); else closeMenu();
  });
  menu.addEventListener('click', function (e) {
    var item = e.target.closest('[data-set-theme]');
    if (!item) return;
    var t = item.getAttribute('data-set-theme');
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e2) { /* private mode */ }
    syncThemeColor();
    syncMenu();
    closeMenu(true);
  });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu(true);
  });
  if (mq.addEventListener) mq.addEventListener('change', function () { syncThemeColor(); syncMenu(); });
})();
