/* theme.js — footer theme menu (system / light / dark / midnight / dusk).
   The effective theme is the stored choice if any, else the system
   preference ("System", the state for first-time visitors: no stored
   key, no data-theme attribute, CSS follows prefers-color-scheme and
   tracks it live). head.html applies the stored choice to
   <html data-theme> (and points the theme-color metas at it) before
   CSS paints, so this file only has to wire the menu and keep the
   metas in step.

   "Dusk" is not a fourth palette but a rule: roughly follow local
   dusk — light while the sun is up, dark through civil twilight,
   midnight once the sun is more than 6° down. The sun's altitude is
   computed from the clock and the IANA time zone (a rough coordinate
   guess — this sets an ambience, it is not an almanac), so no location
   permission is ever asked. The stored value stays "dusk"; only the
   resolved palette lands on <html data-theme>. */
(function () {
  'use strict';
  var btn = document.getElementById('theme-toggle');
  var menu = document.getElementById('theme-menu');
  if (!btn || !menu) return;
  var THEMES = ['light', 'dark', 'midnight', 'dusk'];
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function stored() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  /* ---- dusk: where the sun stands, roughly ----
     A compact copy of this lives in head.html's pre-paint script — keep
     the two in sync. The ephemeris is the one /twilight/ uses (±0.3°);
     coordinates come from a short city table keyed on the time zone's
     last segment, falling back to a per-region latitude and a longitude
     read off the UTC offset (solar time). */
  var CITY_COORDS = {
    Istanbul: [41, 29], London: [51.5, -0.1], Paris: [48.9, 2.4],
    Berlin: [52.5, 13.4], Madrid: [40.4, -3.7], Rome: [41.9, 12.5],
    Athens: [38, 23.7], Moscow: [55.8, 37.6], New_York: [40.7, -74],
    Chicago: [41.9, -87.6], Denver: [39.7, -105], Los_Angeles: [34.1, -118.2],
    Toronto: [43.7, -79.4], Mexico_City: [19.4, -99.1], Sao_Paulo: [-23.5, -46.6],
    Buenos_Aires: [-34.6, -58.4], Cairo: [30.1, 31.2], Johannesburg: [-26.2, 28],
    Dubai: [25.3, 55.3], Kolkata: [22.6, 88.4], Bangkok: [13.8, 100.5],
    Singapore: [1.4, 103.8], Shanghai: [31.2, 121.5], Tokyo: [35.7, 139.7],
    Seoul: [37.6, 127], Sydney: [-33.9, 151.2], Auckland: [-36.8, 174.8]
  };
  var REGION_LAT = { Europe: 48, America: 40, Asia: 30, Africa: 9, Australia: -27, Pacific: -10, Atlantic: 35, Indian: -10 };
  function guessCoords() {
    var z = '';
    try { z = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var city = CITY_COORDS[z.split('/').pop()];
    if (city) return city;
    var lat = REGION_LAT[z.split('/')[0]];
    return [lat == null ? 41 : lat, -new Date().getTimezoneOffset() / 4];
  }
  function skyPhase() {
    var RAD = Math.PI / 180;
    var co = guessCoords(), lat = co[0], lng = co[1];
    var d = Date.now() / 864e5 - 10957.5;                    /* days since J2000 */
    var g = (357.529 + 0.98560028 * d) * RAD;
    var L = (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
    var e = 23.439 * RAD;
    var sinDec = Math.sin(e) * Math.sin(L);
    var RAh = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD / 15;
    var GMST = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
    var lst = ((GMST + lng / 15) % 24 + 24) % 24;
    var H = ((lst - RAh) * 15 + 540) % 360 - 180;
    var alt = Math.asin(Math.sin(lat * RAD) * sinDec + Math.cos(lat * RAD) * Math.cos(Math.asin(sinDec)) * Math.cos(H * RAD)) / RAD;
    return alt >= -0.8 ? 'light' : alt >= -6 ? 'dark' : 'midnight';
  }
  function resolve(t) { return t === 'dusk' ? skyPhase() : t; }

  function effective() {
    var t = stored();
    if (THEMES.indexOf(t) !== -1) return t;
    return 'system';
  }
  function apply(t) {
    /* System = no attribute at all: CSS falls back to prefers-color-scheme
       and keeps following it live when the OS preference changes. */
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', resolve(t));
  }
  /* Keep <meta name="theme-color"> on the active palette. A manual choice
     pins both metas to the chosen colour (data-light/data-dark/data-midnight,
     written by head.html; dusk pins them to its resolved palette); without
     one they fall back to their per-media defaults so the system preference
     keeps working on its own. */
  function syncThemeColor() {
    var t = stored();
    var manual = THEMES.indexOf(t) !== -1;
    var key = manual ? resolve(t) : null;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      var next = manual ? m.getAttribute('data-' + key) : m.getAttribute('data-default');
      if (next) m.setAttribute('content', next);
    });
  }
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

  /* Dusk follows the sky while the page stays open: re-resolve once a
     minute, and on return to a tab that sat in the background. */
  function refreshDusk() {
    if (stored() !== 'dusk') return;
    apply('dusk');
    syncThemeColor();
  }
  setInterval(refreshDusk, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshDusk(); });
})();
