/* reading-line.js — a thin line along the top of the window that grows as a
   long piece is read (5 November 2026). It says how far the reader has come
   and how much is left, with no number: a reading time judges the reader's
   pace, a line only shows the way. It appears only on a piece several
   screens long, starts when the prose reaches the top of the window and is
   full when its last line reaches the bottom. Nothing is stored. */
(function () {
  'use strict';

  var body = document.querySelector('[data-reading-body]');
  if (!body) return;

  var line = document.createElement('div');
  line.className = 'reading-line';
  line.setAttribute('aria-hidden', 'true');
  document.body.appendChild(line);

  /* Shorter than this, the whole piece is in reach and a line says nothing. */
  var LONG = 3;
  var ticking = false;

  function update() {
    ticking = false;
    var view = window.innerHeight || document.documentElement.clientHeight;
    var box = body.getBoundingClientRect();
    var long = box.height > view * LONG;
    line.hidden = !long;
    if (!long) return;
    var travel = box.height - view;
    var read = Math.min(1, Math.max(0, -box.top / (travel || 1)));
    line.style.transform = 'scaleX(' + read.toFixed(4) + ')';
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(body);
  update();
})();
