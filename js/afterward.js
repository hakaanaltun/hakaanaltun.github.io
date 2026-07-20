/* afterward.js — fills the .essay-afterward placeholder (essay-afterward.html)
   with one quiet line from the essay to an instrument, or leaves the essay
   to end plain. The draw happens per reading, in the browser, so the line
   never settles into furniture: for the newest and the oldest essays
   roughly half of readings get no line at all, while the quieter middle of
   the catalogue always ends on one; when a line appears it is a different
   instrument than the reader saw last (remembered per tab). The essay's
   place in the date-ordered list arrives from Liquid at build time
   (data-position, 1 = newest, with data-total). Front matter can pin a
   specific instrument via data-afterward; "none" never renders the
   placeholder. */
(function () {
  'use strict';
  var el = document.querySelector('.essay-afterward');
  if (!el) return;

  var LINES = {
    breathe: 'No need to rush off&mdash;<a href="/breathe/">three minutes of The Breath</a>, and then the day.',
    noise: 'If it is loud where you are, <a href="/noise/">The Noise</a> can hold the room for a while.',
    twilight: 'When you look up from the page, <a href="/twilight/">the sky is kept in real time</a>.',
    moon: 'Somewhere above the roofline, <a href="/moon/">tonight&rsquo;s moon</a> is keeping its phase.',
    season: 'The year is turning as you read&mdash;<a href="/season/">The Season</a> keeps the count.',
    write: 'If the essay left you with a thought, <a href="/write/">a blank page</a> is waiting.'
  };
  var SHOW_CHANCE = 0.55;
  /* the newest FIRST_N and the oldest LAST_N essays keep the coin flip;
     everything in between always shows an afterward */
  var FIRST_N = 8;
  var LAST_N = 5;

  var pick = el.getAttribute('data-afterward');
  if (!LINES[pick]) {
    var pos = parseInt(el.getAttribute('data-position'), 10) || 0;
    var total = parseInt(el.getAttribute('data-total'), 10) || 0;
    var middle = pos > FIRST_N && pos <= total - LAST_N;
    if (!middle && Math.random() > SHOW_CHANCE) return;
    var last = null;
    try { last = sessionStorage.getItem('olae-afterward'); } catch (e) {}
    var keys = Object.keys(LINES).filter(function (k) { return k !== last; });
    pick = keys[Math.floor(Math.random() * keys.length)];
    try { sessionStorage.setItem('olae-afterward', pick); } catch (e) {}
  }
  el.innerHTML = LINES[pick];
  el.hidden = false;
})();
