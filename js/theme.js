/* theme.js — footer theme menu (system / light / dark / midnight / sky).
   The effective theme is the stored choice if any, else the system
   preference ("System", the state for first-time visitors: no stored
   key, no data-theme attribute, CSS follows prefers-color-scheme and
   tracks it live). head.html applies the stored choice to
   <html data-theme> (and points the theme-color metas at it) before
   CSS paints, so this file only has to wire the menu and keep the
   metas in step.

   "Follow the sky" is not a fourth palette but a rule, and the one
   theme whose colours are computed rather than written: the paper is
   the sky at the reader's own hour, from midnight navy to a daytime
   slate, moving with the sun instead of snapping between palettes. It
   replaced "Dusk", which resolved the same sun into whichever of
   light/dark/midnight it stood nearest — three snaps a day, the worst
   of them at sunset.

   The sun is _includes/sky-ramp.html, shared with the instrument pages;
   the token block is _includes/site-sky.html, which head.html has
   already run once before first paint. This file only re-paints it,
   every minute and on return to a backgrounded tab. Unlike the other
   four, "sky" lands on <html data-theme> as itself. */
(function () {
  'use strict';
  var btn = document.getElementById('theme-toggle');
  var menu = document.getElementById('theme-menu');
  if (!btn || !menu) return;
  var THEMES = ['light', 'dark', 'midnight', 'sky'];
  /* head.html loads site-sky.html above this file, so the painter is here.
     The no-op stands in only if it is ever not: the menu still works and
     Sky simply lands on the attribute without colours, rather than the
     whole footer menu dying on a missing global. */
  var sky = window.OLAE_SITE_SKY || { paint: function () {}, paintNow: function () {}, clear: function () {} };
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function stored() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }


  function effective() {
    var t = stored();
    if (THEMES.indexOf(t) !== -1) return t;
    return 'system';
  }
  function apply(t) {
    /* System = no attribute at all: CSS falls back to prefers-color-scheme
       and keeps following it live when the OS preference changes. */
    if (t === 'system') { sky.clear(); document.documentElement.removeAttribute('data-theme'); return; }
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'sky') sky.paintNow(); else sky.clear();
  }
  /* Keep <meta name="theme-color"> on the active palette. A manual choice
     pins both metas to the chosen colour (data-light/data-dark/data-midnight,
     written by head.html); without one they fall back to their per-media
     defaults so the system preference keeps working on its own. Sky has no
     fixed colour to pin — site-sky.html points the metas at the ground it
     just painted, so this leaves them where that put them. */
  function syncThemeColor() {
    var t = stored();
    if (t === 'sky') return;
    var manual = THEMES.indexOf(t) !== -1;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      var next = manual ? m.getAttribute('data-' + t) : m.getAttribute('data-default');
      if (next) m.setAttribute('content', next);
    });
    /* A chosen light palette re-points the light meta to its own chrome —
       palettes.js listens in on every call here. */
    if (window.__paletteMetaSync) window.__paletteMetaSync();
  }
  /* /themes/ offers Dark, Midnight and Follow the sky beside the twelve
     palettes, and writes the same key this file reads. Publishing the sync
     lets it hand the metas back here rather than keep a second copy of the
     rules. */
  window.__themeColorSync = syncThemeColor;
  function syncMenu() {
    var t = effective();
    menu.querySelectorAll('[data-set-theme]').forEach(function (item) {
      item.setAttribute('aria-checked', item.getAttribute('data-set-theme') === t ? 'true' : 'false');
    });
  }
  function items() {
    return Array.prototype.slice.call(menu.querySelectorAll('[data-set-theme]'));
  }
  function openMenu() {
    syncMenu();
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    /* menuitemradio pattern: focus lands on the checked item */
    var list = items();
    var sel = list.filter(function (i) { return i.getAttribute('aria-checked') === 'true'; })[0];
    (sel || list[0]).focus();
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
    apply(t);
    try {
      if (t === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', t);
    } catch (e2) { /* private mode */ }
    syncThemeColor();
    syncMenu();
    closeMenu(true);
  });
  menu.addEventListener('keydown', function (e) {
    var list = items();
    var i = list.indexOf(document.activeElement);
    var next = null;
    if (e.key === 'ArrowDown') next = list[(i + 1) % list.length];
    else if (e.key === 'ArrowUp') next = list[(i - 1 + list.length) % list.length];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    else return;
    e.preventDefault();
    next.focus();
  });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu(true);
  });
  if (mq.addEventListener) mq.addEventListener('change', function () { syncThemeColor(); syncMenu(); });

  /* The sky keeps moving while the page stays open: re-paint once a
     minute, and on return to a tab that sat in the background. */
  function refreshSky() {
    if (stored() !== 'sky') return;
    sky.paintNow();
  }
  setInterval(refreshSky, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshSky(); });
})();
