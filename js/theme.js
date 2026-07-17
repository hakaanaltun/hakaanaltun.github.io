/* theme.js — footer light/dark toggle.
   The effective theme is the stored choice if any, else the system
   preference. head.html applies the stored choice to <html data-theme>
   (and points the theme-color metas at it) before CSS paints, so this
   file only has to wire the button and keep the metas in step. */
(function () {
  'use strict';
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function stored() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }
  function effective() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return mq.matches ? 'dark' : 'light';
  }
  /* Keep <meta name="theme-color"> on the active palette. A manual choice
     pins both metas to the chosen colour (data-light/data-dark, written by
     head.html); without one they fall back to their per-media defaults so
     the system preference keeps working on its own. */
  function syncThemeColor() {
    var t = stored();
    var manual = t === 'dark' || t === 'light';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      var next = manual ? m.getAttribute(t === 'dark' ? 'data-dark' : 'data-light') : m.getAttribute('data-default');
      if (next) m.setAttribute('content', next);
    });
  }
  function label() {
    var next = effective() === 'dark' ? 'light' : 'dark';
    btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }
  btn.hidden = false;
  label();
  syncThemeColor();
  btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    label();
    syncThemeColor();
  });
  if (mq.addEventListener) mq.addEventListener('change', function () { label(); syncThemeColor(); });
})();
