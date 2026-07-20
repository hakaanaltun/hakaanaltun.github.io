/* rain-read.js — "read with rain": the /noise/ instrument's rain, played
   quietly behind an essay. The synthesis is the same — a breathing bed of
   band-passed pink noise with millisecond droplets cut from white noise,
   no recordings, nothing loaded — held at reading volume, with gentle
   fades in and out. The button lives in the essay header (post.html) and
   stays hidden unless Web Audio exists. */
(function () {
  'use strict';
  var btn = document.getElementById('essay-rain');
  if (!btn) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  btn.hidden = false;

  var LEVEL = 0.13;           /* ≈ half of /noise/'s default rain loudness */
  var ctx = null, master = null, rain = null, playing = false, stopT = null;
  var buffers = {};

  /* ---- a 12 s noise buffer, seam crossfaded so the loop is silent ----
     (white and pink only — the two the rain is built from; as on /noise/) */
  function makeBuffer(kind) {
    var sr = ctx.sampleRate, len = sr * 12, fade = Math.floor(sr / 2);
    var raw = new Float32Array(len + fade);
    var i, w;
    if (kind === 'white') {
      for (i = 0; i < raw.length; i++) raw[i] = Math.random() * 2 - 1;
    } else {
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (i = 0; i < raw.length; i++) {
        w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    var buf = ctx.createBuffer(1, len, sr);
    var data = buf.getChannelData(0);
    for (i = 0; i < len; i++) {
      data[i] = i < fade
        ? raw[i] * (i / fade) + raw[len + i] * (1 - i / fade)
        : raw[i];
    }
    return buf;
  }

  /* ---- rain: the bed swells slowly under randomly falling droplets ---- */
  function buildRain() {
    if (!buffers.pink) buffers.pink = makeBuffer('pink');
    if (!buffers.white) buffers.white = makeBuffer('white');

    var bed = ctx.createBufferSource();
    bed.buffer = buffers.pink; bed.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400; hp.Q.value = 0.7;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500; lp.Q.value = 0.7;
    var bedGain = ctx.createGain(); bedGain.gain.value = 0.85;
    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.09;
    var lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0.12;
    lfo.connect(lfoDepth); lfoDepth.connect(bedGain.gain);
    bed.connect(hp); hp.connect(lp); lp.connect(bedGain); bedGain.connect(master);
    bed.start(); lfo.start();

    var dropBus = ctx.createGain(); dropBus.gain.value = 0.5; dropBus.connect(master);
    function scheduleDrop(t) {
      var src = ctx.createBufferSource();
      src.buffer = buffers.white;
      var dur = 0.005 + Math.random() * 0.015;                    /* 5–20 ms  */
      var offset = Math.random() * (buffers.white.duration - 0.1);
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 1000 + Math.random() * 5000;           /* ~1–6 kHz */
      bp.Q.value = 6;
      var g = ctx.createGain();
      var peak = 0.05 + Math.random() * 0.25;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.03);
      src.connect(bp); bp.connect(g); g.connect(dropBus);
      src.start(t, offset, dur + 0.05);
      src.onended = function () { try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (e) {} };
    }
    /* lookahead scheduling against the audio clock, a few drops per second */
    var nextDrop = ctx.currentTime + 0.05;
    var timer = setInterval(function () {
      var horizon = ctx.currentTime + 0.25;
      while (nextDrop < horizon) {
        scheduleDrop(nextDrop);
        nextDrop += 0.06 + Math.random() * 0.5;
      }
    }, 100);

    return {
      stop: function () {
        clearInterval(timer);
        try { bed.stop(); } catch (e) {}
        try { lfo.stop(); } catch (e) {}
        [bed, hp, lp, bedGain, lfo, lfoDepth, dropBus].forEach(function (n) {
          try { n.disconnect(); } catch (e) {}
        });
      }
    };
  }

  function start() {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    clearTimeout(stopT);
    if (!rain) rain = buildRain();
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
