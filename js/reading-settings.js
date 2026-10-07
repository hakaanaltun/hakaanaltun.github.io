/* Reading preferences belong to this browser. Run in the head so stored
   typography is present before the essay's first paint. */
(function () {
  'use strict';
  var KEY = 'olae-reading-v1';
  var DEFAULTS = { size: '1', spacing: '1.85' };
  function clean(value) {
    value = value && typeof value === 'object' ? value : {};
    return {
      size: ['1', '1.15', '1.3'].indexOf(value.size) >= 0 ? value.size : DEFAULTS.size,
      spacing: ['1.85', '2.1', '2.4'].indexOf(value.spacing) >= 0 ? value.spacing : DEFAULTS.spacing
    };
  }
  var preferences = clean(null);
  try { preferences = clean(JSON.parse(localStorage.getItem(KEY))); } catch (e) {}
  function apply() {
    var root = document.documentElement;
    root.style.setProperty('--reading-scale', preferences.size);
    root.style.setProperty('--reading-spacing', preferences.spacing);
  }
  apply();
  function start() {
    var panel = document.getElementById('reading-options');
    if (!panel) return;
    var status = document.getElementById('reading-settings-status');
    function save() {
      apply();
      try {
        localStorage.setItem(KEY, JSON.stringify(preferences));
        status.textContent = 'Reading settings saved on this device.';
      } catch (e) { status.textContent = 'Settings apply here. This browser cannot keep them for your next visit.'; }
    }
    function sync() {
      Object.keys(DEFAULTS).forEach(function (name) { document.getElementById('reading-' + name).value = preferences[name]; });
    }
    Object.keys(DEFAULTS).forEach(function (name) {
      document.getElementById('reading-' + name).addEventListener('change', function () {
        preferences[name] = this.value;
        preferences = clean(preferences);
        save();
      });
    });
    document.getElementById('reading-reset').addEventListener('click', function () { preferences = clean(null); sync(); save(); });
    document.getElementById('reading-print').addEventListener('click', function () { if (typeof window.print === 'function') window.print(); });
    window.addEventListener('beforeprint', function () {
      var puzzle = document.getElementById('essay-puzzle');
      if (puzzle && puzzle.getAttribute('aria-pressed') === 'true') puzzle.click();
    });
    window.addEventListener('storage', function (event) {
      if (event.key !== KEY && event.key !== null) return;
      try { preferences = clean(JSON.parse(localStorage.getItem(KEY))); } catch (e) { preferences = clean(null); }
      apply(); sync();
    });
    sync();
    panel.hidden = false;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
