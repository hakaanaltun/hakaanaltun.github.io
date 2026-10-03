/* farm-sound.js — The Farm House, heard. Off until a visitor turns it on
   with the small "listen to the farm" button in the footer, and remembered
   in their own browser after that.

   Two layers, both made by js/farm-sound-engine.js:
   - the creak. Moving into a room (the hall, the kitchen, upstairs, the
     stable aisle) is a foot on an old floorboard; staying in one, the
     house creaks on its own every 25 to 70 seconds, quietly, never the
     same creak twice. Outdoors there is no creak.
   - the hour, underneath. Morning is sparse birdsong, midday a soft wind
     and now and then a horse across the field, evening crickets, night
     fewer and quieter crickets. Outdoors it is low; in the rooms it is
     lower still and muffled, as if heard through the walls.

   The hour is the visitor's own, worked out the way the site's Follow the
   sky works it out: the browser's time zone gives a city from
   _data/cities.yml (window.OLAE_SKY, from _includes/sky-ramp.html), and
   the sun's height over it decides the part of the day. No location is
   ever asked for. Without OLAE_SKY the clock decides instead.

   For testing only, ?hour=19 (any hour from 0 to 23.99) stands the clock
   at that time today, so every part of the day can be heard at any
   moment. Nothing on the page links to it.

   Every start and stop is a fade; a hidden tab fades out and suspends the
   audio, and fades back in when the tab returns. The page tells this file
   where the visitor is through OLAE_FARM_SOUND.scene(name, indoor). */
(function () {
  'use strict';
  var btn = document.getElementById('farm-sound');
  var AC = window.AudioContext || window.webkitAudioContext;
  var ENGINE = window.OLAE_FARM_ENGINE;
  if (!btn || !AC || !ENGINE || !window.OLAE_RAIN) return;
  btn.hidden = false;

  var KEY = 'olae-farm-sound';
  /* Levels, all in one place. The ambience outdoors sits a little under the
     essays' "read with rain"; indoors it is lower again and loses its top.
     Creaks peak well below full scale, the settling ones at half a step. */
  var LEVEL = { outdoor: 0.22, indoor: 0.12, wallHz: 2000, openHz: 18000, step: 0.16, settle: 0.08 };
  var HOUR_LEVEL = { morning: 1, midday: 1, evening: 1, night: 0.55 };
  var FADE = 1.5, HIDE_FADE = 1, ROOM_FADE = 1.2, HOUR_FADE = 6;
  var CREAK_GAP = [25, 70];
  var TITLES = {
    off: 'Quiet sound: the floorboards inside, and the time of day outside',
    morning: 'Morning: birdsong. Click to stop the sound',
    midday: 'Midday: wind, and a horse now and then. Click to stop the sound',
    evening: 'Evening: crickets. Click to stop the sound',
    night: 'Night: crickets, quieter. Click to stop the sound'
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---- the time of day ---- */
  var forced = (function () {
    try {
      var v = new URLSearchParams(window.location.search).get('hour');
      if (v === null || v.trim() === '') return null;
      var h = Number(v);
      return h >= 0 && h < 24 ? h : null;
    } catch (e) { return null; }
  })();
  function clock() {
    var d = new Date();
    if (forced !== null) d.setHours(Math.floor(forced), Math.round((forced % 1) * 60), 0, 0);
    return d;
  }
  /* The sun's height and whether it is still climbing place the moment:
     night once it is well down (or until civil dawn), morning while it
     climbs to half its noon height, evening once it is low in the west,
     midday between. Thresholds scale with the day's own peak, so a short
     northern winter day still has all four. */
  function partOfDay(date) {
    var S = window.OLAE_SKY;
    if (!S) {
      var h = date.getHours();
      return h >= 5 && h < 10 ? 'morning' : h >= 10 && h < 18 ? 'midday' : h >= 18 && h < 22 ? 'evening' : 'night';
    }
    var c = S.pickCity(), t = date.getTime();
    var alt = S.sunAltitude(date, c.lat, c.lng);
    var rising = S.sunAltitude(new Date(t + 600000), c.lat, c.lng) > alt;
    var peak = -90;
    for (var m = -720; m <= 720; m += 20) peak = Math.max(peak, S.sunAltitude(new Date(t + m * 60000), c.lat, c.lng));
    if (alt < -12 || (rising && alt < -6)) return 'night';
    if (!rising && alt < Math.min(10, peak * 0.3)) return 'evening';
    if (rising && alt < peak * 0.5) return 'morning';
    return 'midday';
  }

  /* ---- the visitor's choice, kept in their browser if it can be ---- */
  var wanted = false;
  try { wanted = localStorage.getItem(KEY) === 'on'; } catch (e) {}
  function save() {
    try { localStorage.setItem(KEY, wanted ? 'on' : 'off'); } catch (e) {}
  }
  function paint() {
    btn.textContent = wanted ? 'stop the sound' : 'listen to the farm';
    btn.title = wanted ? TITLES[hour || partOfDay(clock())] : TITLES.off;
    btn.setAttribute('aria-pressed', wanted ? 'true' : 'false');
  }

  /* iOS: Web Audio runs through the "ambient" session, which the ring/silent
     switch mutes. A short, looped, inaudible clip played through an <audio>
     element on the tap promotes the session to "playback". The same unlock
     as js/rain-read.js and /noise/. */
  var SILENT_WAV = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
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

  /* ---- the graph: creaks and the hour meet in one master, so a single
     fade starts or stops everything; the hour passes through the wall ---- */
  var ctx = null, master = null, creaks = null, wall = null, amb = null, buffers = {};
  var place = { name: 'intro', indoor: false };
  var hour = null, bed = null, fading = [];
  var nextCreak = null, tickT = null, hourT = null, stopT = null;

  function graph() {
    if (ctx) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    creaks = ctx.createGain(); creaks.connect(master);
    wall = ctx.createBiquadFilter(); wall.type = 'lowpass'; wall.Q.value = -3; wall.connect(master);
    amb = ctx.createGain(); amb.connect(wall);
  }
  function ramp(param, value, seconds) {
    var t = ctx.currentTime;
    param.cancelScheduledValues(t);
    if (!seconds) { param.setValueAtTime(value, t); return; }
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + seconds);
  }
  /* Indoors or out: the hour's level and how much of its top gets through. */
  function walls(seconds) {
    ramp(amb.gain, place.indoor ? LEVEL.indoor : LEVEL.outdoor, seconds);
    ramp(wall.frequency, place.indoor ? LEVEL.wallHz : LEVEL.openHz, seconds);
  }

  function checkHour() {
    var now = partOfDay(clock());
    if (now === hour && bed) return;
    var first = !bed;
    hour = now;
    if (bed) {
      var old = bed;
      fading.push(old);
      ramp(old.out.gain, 0, HOUR_FADE);
      setTimeout(function () {
        old.stop();
        fading = fading.filter(function (b) { return b !== old; });
      }, HOUR_FADE * 1000 + 500);
    }
    bed = ENGINE.hour(ctx, amb, buffers, hour);
    /* the first bed rides in on the master's own fade */
    ramp(bed.out.gain, HOUR_LEVEL[hour], first ? 0 : HOUR_FADE);
    paint();
  }

  /* Every fifth of a second: schedule whatever falls within the next
     moment of audio time. A suspended context does not advance, so nothing
     piles up while the tab is away. */
  function tick() {
    var until = ctx.currentTime + 0.6;
    if (bed) bed.tick(until);
    fading.forEach(function (b) { b.tick(until); });
    if (place.indoor && nextCreak !== null && nextCreak < until) {
      ENGINE.creak(ctx, creaks, Math.max(nextCreak, ctx.currentTime + 0.05), 'settle', LEVEL.settle);
      nextCreak += rand(CREAK_GAP[0], CREAK_GAP[1]);
    }
  }

  function start() {
    clearTimeout(stopT);
    graph();
    unlockSilent();
    if (ctx.state !== 'running') {
      var p = ctx.resume();
      if (p && p.catch) p.catch(function () {});
    }
    ENGINE.warm(ctx);
    walls(0);
    if (place.indoor && nextCreak === null) nextCreak = ctx.currentTime + rand(CREAK_GAP[0], CREAK_GAP[1]);
    checkHour();
    ramp(master.gain, 1, FADE);
    if (!tickT) tickT = setInterval(tick, 200);
    if (!hourT) hourT = setInterval(checkHour, 60000);
    tick();
  }
  /* Fade out, then stop scheduling and suspend. Turned off, the beds are
     let go as well; hidden, they wait for the tab to come back. */
  function quiet(seconds) {
    if (!ctx) return;
    ramp(master.gain, 0, seconds);
    clearTimeout(stopT);
    stopT = setTimeout(function () {
      clearInterval(tickT); tickT = null;
      clearInterval(hourT); hourT = null;
      if (!wanted) {
        if (bed) bed.stop();
        fading.forEach(function (b) { b.stop(); });
        bed = null; fading = []; hour = null; nextCreak = null;
      }
      try { if (silentEl) silentEl.pause(); } catch (e) {}
      var p = ctx.suspend();
      if (p && p.catch) p.catch(function () {});
    }, seconds * 1000 + 150);
  }
  function playing() {
    return wanted && ctx && tickT && !document.hidden;
  }

  btn.addEventListener('click', function () {
    wanted = !wanted;
    save();
    if (wanted) start(); else quiet(FADE);
    paint();
  });

  /* Sound left on from an earlier visit waits for the first touch, click or
     key: browsers start audio only from one. The toggle's own click is its
     own business. */
  function nudge(event) {
    if (!wanted || document.hidden || btn.contains(event.target)) return;
    if (!ctx || !tickT || ctx.state !== 'running') start();
  }
  ['click', 'touchend', 'keydown'].forEach(function (type) {
    document.addEventListener(type, nudge, true);
  });

  document.addEventListener('visibilitychange', function () {
    if (!wanted || !ctx) return;
    if (document.hidden) quiet(HIDE_FADE);
    else start();
  });

  window.OLAE_FARM_SOUND = {
    scene: function (name, indoor) {
      var was = place;
      place = { name: name, indoor: !!indoor };
      if (!playing()) {
        if (!place.indoor) nextCreak = null;
        return;
      }
      if (was.indoor !== place.indoor) walls(ROOM_FADE);
      if (!place.indoor) { nextCreak = null; return; }
      if (name !== was.name) {
        /* a footstep as the visitor comes in, then the room on its own */
        ENGINE.creak(ctx, creaks, ctx.currentTime + rand(0.1, 0.25), 'step', LEVEL.step);
        nextCreak = ctx.currentTime + rand(CREAK_GAP[0], CREAK_GAP[1]);
      }
    }
  };
  paint();
})();
