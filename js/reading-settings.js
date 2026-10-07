/* Reading preferences belong to this browser. This runs in the head so a
   stored choice is on the page before the essay's first paint. Until a
   reader picks something other than "original" it sets nothing at all: the
   piece is exactly as published, and css/reading.css acts only under the
   data-reading-* attributes set here. */
(function () {
  'use strict';
  var KEY = 'olae-reading-v1';
  var DEFAULTS = { size: '1', spacing: '1.85' };
  var CHOICES = { size: ['1', '1.15', '1.3'], spacing: ['1.85', '2.1', '2.4'] };
  var VARIABLES = { size: '--reading-scale', spacing: '--reading-spacing' };
  var root = document.documentElement;
  function clean(value) {
    value = value && typeof value === 'object' ? value : {};
    var out = {};
    Object.keys(DEFAULTS).forEach(function (name) {
      out[name] = CHOICES[name].indexOf(value[name]) >= 0 ? value[name] : DEFAULTS[name];
    });
    return out;
  }
  function original(value) {
    return Object.keys(DEFAULTS).every(function (name) { return value[name] === DEFAULTS[name]; });
  }
  var preferences = clean(null);
  try { preferences = clean(JSON.parse(localStorage.getItem(KEY))); } catch (e) {}
  function apply() {
    Object.keys(DEFAULTS).forEach(function (name) {
      if (preferences[name] === DEFAULTS[name]) {
        root.removeAttribute('data-reading-' + name);
        root.style.removeProperty(VARIABLES[name]);
      } else {
        root.setAttribute('data-reading-' + name, preferences[name]);
        root.style.setProperty(VARIABLES[name], preferences[name]);
      }
    });
  }
  apply();
  function start() {
    var panel = document.getElementById('reading-options');
    if (!panel) return;
    var summary = panel.querySelector('summary');
    var note = document.getElementById('reading-settings-status');
    var kept = note.textContent;
    var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-choice]'));
    function paint() {
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(preferences[button.dataset.choice] === button.value));
      });
    }
    /* A reader back at "original" for both leaves nothing behind. */
    function save() {
      apply(); paint();
      try {
        if (original(preferences)) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, JSON.stringify(preferences));
        if (note.textContent !== kept) note.textContent = kept;
      } catch (e) { note.textContent = 'This applies here, but this browser cannot keep it for your next visit.'; }
    }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        preferences[button.dataset.choice] = button.value;
        preferences = clean(preferences);
        save();
      });
    });
    document.getElementById('reading-print').addEventListener('click', function () { if (typeof window.print === 'function') window.print(); });
    window.addEventListener('beforeprint', function () {
      var puzzle = document.getElementById('essay-puzzle');
      if (puzzle && puzzle.getAttribute('aria-pressed') === 'true') puzzle.click();
    });
    /* Escape closes the menu from anywhere inside it. Marked as handled, so
       puzzle mode, which listens for Escape too, leaves it alone. */
    panel.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !panel.open) return;
      event.preventDefault();
      panel.open = false;
      summary.focus();
    });
    window.addEventListener('storage', function (event) {
      if (event.key !== KEY && event.key !== null) return;
      try { preferences = clean(JSON.parse(localStorage.getItem(KEY))); } catch (e) { preferences = clean(null); }
      apply(); paint();
    });
    paint();
    panel.hidden = false;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
