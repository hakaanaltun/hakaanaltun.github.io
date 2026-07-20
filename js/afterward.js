/* afterward.js — fills the .essay-afterward placeholder (essay-afterward.html)
   with one quiet line from the essay to an instrument, or leaves the essay
   to end plain. The draw happens per reading, in the browser, so the line
   never settles into furniture: roughly half of readings get no line at
   all, and when one appears it is a different instrument than the reader
   saw last (remembered per tab). Front matter can pin a specific
   instrument via data-afterward; "none" never renders the placeholder. */
(function () {
  'use strict';
  var el = document.querySelector('.essay-afterward');
  if (!el) return;

  var LINES = {
    breathe: 'No need to rush off&mdash;<a href="/breathe/">three minutes of The Breath</a>, and then the day.',
    noise: 'If it is loud where you are, <a href="/noise/">The Noise</a> can hold the room for a while.',
    twilight: 'When you look up from the page, <a href="/twilight/">the sky is kept in real time</a>.'
  };
  var SHOW_CHANCE = 0.55;

  var pick = el.getAttribute('data-afterward');
  if (!LINES[pick]) {
    if (Math.random() > SHOW_CHANCE) return;
    var last = null;
    try { last = sessionStorage.getItem('olae-afterward'); } catch (e) {}
    var keys = Object.keys(LINES).filter(function (k) { return k !== last; });
    pick = keys[Math.floor(Math.random() * keys.length)];
    try { sessionStorage.setItem('olae-afterward', pick); } catch (e) {}
  }
  el.innerHTML = LINES[pick];
  el.hidden = false;
})();
