/* rain-read.js — "read with rain": the /noise/ instrument's rain, played
   quietly behind an essay. The synthesis lives in js/rain-engine.js and
   is shared with /noise/ — a breathing bed of band-passed pink noise with
   millisecond droplets cut from white noise, no recordings, nothing
   loaded — held here at reading volume, with gentle fades in and out.
   The button lives in the essay header (post.html) and stays hidden
   unless Web Audio (and the engine) exists. */
(function () {
  'use strict';
  var btn = document.getElementById('essay-rain');
  if (!btn) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !window.OLAE_RAIN) return;
  btn.hidden = false;

  var LEVEL = 0.13;           /* ≈ half of /noise/'s default rain loudness */
  var ctx = null, master = null, rain = null, playing = false, stopT = null;
  var buffers = {};

  function start() {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    clearTimeout(stopT);
    if (!rain) rain = window.OLAE_RAIN.buildRain(ctx, master, buffers);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(LEVEL, ctx.currentTime + 2);
    playing = true;
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = 'stop the rain';
  }
  function stop() {
    if (!ctx || !rain) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    playing = false;
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'read with rain';
    /* silence the graph once the fade has landed */
    stopT = setTimeout(function () {
      if (!playing && rain) { rain.stop(); rain = null; }
    }, 1400);
  }
  btn.addEventListener('click', function () { playing ? stop() : start(); });
})();
