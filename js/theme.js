/* theme.js — header light/dark toggle.
   The effective theme is the stored choice if any, else the system
   preference. head.html applies the stored choice to <html data-theme>
   before CSS paints, so this file only has to wire the button. */
(function () {
  'use strict';
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function effective() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return mq.matches ? 'dark' : 'light';
  }
  function label() {
    btn.setAttribute('aria-label', effective() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  btn.hidden = false;
  label();
  btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    label();
  });
  if (mq.addEventListener) mq.addEventListener('change', label);
})();
