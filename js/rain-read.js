/* rain-read.js — "read with rain": the /noise/ instrument's rain, played
   quietly behind an essay, and the same rain falling down the window.

   The sound is synthesized by js/rain-engine.js, shared with /noise/ — a
   breathing bed of band-passed pink noise with millisecond droplets cut
   from white noise, no recordings, nothing loaded. The picture is the
   footer's weather, asked for through window.OLAE_WEATHER in
   js/let-it-snow.js, so a page has one rain rather than two of them out of
   step. The button cycles light → heavy → off and each weight carries its
   own sound: a few drops a second under a narrow band, or a wider, lower
   band with a downpour in it.

   The footer's own droplet stays exactly what it was, a picture with no
   sound. But it is the same sky: if it changes the weather while this rain
   is playing, the sound follows it, and stops when the rain does.

   The button lives in the essay header (post.html) and stays hidden unless
   Web Audio (and the engine) exists. */
(function () {
  'use strict';
  var btn = document.getElementById('essay-rain');
  if (!btn) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !window.OLAE_RAIN) return;
  btn.hidden = false;

  /* Reading volume, and the heavier weight only a little above it: a
     downpour is mostly more rain, not more gain. The light level is about
     half of /noise/'s default rain loudness. */
  var LEVELS = [0, 0.13, 0.19];
  var LABELS = ['read with rain', 'heavier rain', 'stop the rain'];
  var TITLES = ['Rain behind the reading — heard and seen',
                'Light rain. Click for heavy rain',
                'Heavy rain. Click to stop it'];
  var ctx = null, master = null, rain = null, stopT = null;
  var level = 0, buffers = {};

  /* iOS: Web Audio runs through the "ambient" session, which the hardware
     ring/silent switch mutes. Playing a short, looped, inaudible clip
     through an <audio> element on the tap promotes the session to
     "playback", so the rain is heard whether or not the switch is on.
     Same trick as /noise/; the WAV is a tiny 8-bit silence. */
  var SILENT_WAV = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  var silentEl = null;
  function unlockSilent() {
    try {
      if (!silentEl) {
        silentEl = new Audio(SILENT_WAV);
        silentEl.loop = true; silentEl.preload = 'auto';
        silentEl.setAttribute('playsinline', '');
      }
      var p = silentEl.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function paint() {
    btn.textContent = LABELS[level];
    btn.title = TITLES[level];
    btn.dataset.rainLevel = String(level);
    btn.setAttribute('aria-pressed', level ? 'true' : 'false');
  }

  /* The sound alone. Starting, changing weight and stopping are all the
     same call: whatever the level now says, make the audio that. */
  function sound() {
    if (!level) { fade(); return; }
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    unlockSilent();
    if (ctx.state === 'suspended') ctx.resume();
    clearTimeout(stopT);
    if (!rain) rain = window.OLAE_RAIN.buildRain(ctx, master, buffers, { intensity: level });
    else if (rain.setIntensity) rain.setIntensity(level);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(LEVELS[level], ctx.currentTime + 2);
  }
  function fade() {
    if (!ctx || !rain) return;
    try { if (silentEl) silentEl.pause(); } catch (e) {}
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    /* silence the graph once the fade has landed */
    stopT = setTimeout(function () {
      if (!level && rain) { rain.stop(); rain = null; }
    }, 1400);
  }

  function sky() { return window.OLAE_WEATHER || null; }

  btn.addEventListener('click', function () {
    var weather = sky(), falling = weather ? weather.state() : null;
    /* Rain already on the window is joined rather than restarted: the first
       click puts the sound to the weight that is falling, and leaves the
       picture alone. Otherwise the plain cycle, light → heavy → off. */
    level = !level && falling && falling.kind === 'rain' && falling.level
      ? falling.level
      : (level + 1) % 3;
    sound();
    paint();
    if (weather) weather.set('rain', level);
  });

  /* The footer's droplet is a picture and stays one — it never starts this
     sound. But once the sound is playing, the sky is the sky: a hand that
     makes the rain heavier there makes it heavier here, and one that turns
     it off, or turns it to snow, ends it. */
  if (sky()) sky().watch(function (kind, falling) {
    if (!level) return;
    var now = kind === 'rain' ? falling : 0;
    if (now === level) return;
    level = now;
    sound();
    paint();
  });
})();
