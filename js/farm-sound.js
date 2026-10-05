/* farm-sound.js — The Farm House, heard. Off until a visitor turns it on
   with the small "listen to the farm" button in the footer, and remembered
   in their own browser after that.

   What plays is the hour, made by js/farm-sound-engine.js. Morning is
   sparse birdsong, midday a soft wind, evening crickets, night fewer and
   quieter crickets. Outdoors it is low; in the rooms (the hall, the
   kitchen, upstairs, the stable aisle) it is lower still and muffled, as if
   heard through the walls. The horses are heard only near them: faintly in
   the garden, close by in the stable yard and in the stable, where they
   share the room and come through no wall.

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
   whether the visitor is indoors through OLAE_FARM_SOUND.setIndoors(), and
   where they are through OLAE_FARM_SOUND.setPlace(). */
(function () {
  'use strict';
  var btn = document.getElementById('farm-sound');
  var AC = window.AudioContext || window.webkitAudioContext;
  var ENGINE = window.OLAE_FARM_ENGINE;
  if (!btn || !AC || !ENGINE || !window.OLAE_RAIN) return;
  btn.hidden = false;

  var KEY = 'olae-farm-sound';
  /* Levels. The bed outdoors sits a little under the essays' "read with
     rain"; indoors it is lower again and loses its top. Each part of the
     day has its own level on top; the balance inside a part (one cricket
     against another, one horse against the next) is the engine's. `near`
     is the level of a place's own sound, the horses. */
  var LEVEL = { outdoor: 0.22, indoor: 0.12, near: 0.22, wallHz: 2000, openHz: 18000 };
  var HOUR_LEVEL = { morning: 1.25, midday: 1, evening: 1, night: 0.55 };
  var FADE = 1.5, HIDE_FADE = 1, ROOM_FADE = 1.2, HOUR_FADE = 6;
  var TITLES = {
    off: 'Quiet sound: the farm at this time of day',
    morning: 'Morning: birdsong. Click to stop the sound',
    midday: 'Midday: a soft wind. Click to stop the sound',
    evening: 'Evening: crickets. Click to stop the sound',
    night: 'Night: crickets, quieter. Click to stop the sound'
  };

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

  /* ---- the graph: the hour passes through the wall into one master, so a
     single fade starts or stops everything. The place's own sound goes to
     the master beside the wall, not through it. ---- */
  var ctx = null, master = null, wall = null, amb = null, close = null, buffers = {};
  var indoor = false, where = null;
  var hour = null, bed = null, spot = null, fading = [];
  var tickT = null, hourT = null, stopT = null;

  function graph() {
    if (ctx) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    wall = ctx.createBiquadFilter(); wall.type = 'lowpass'; wall.Q.value = -3; wall.connect(master);
    amb = ctx.createGain(); amb.connect(wall);
    close = ctx.createGain(); close.gain.value = LEVEL.near; close.connect(master);
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
    ramp(amb.gain, indoor ? LEVEL.indoor : LEVEL.outdoor, seconds);
    ramp(wall.frequency, indoor ? LEVEL.wallHz : LEVEL.openHz, seconds);
  }

  /* A bed or a place's sound that is going: it fades, is still ticked
     while it does, and is let go after. */
  function retire(old, seconds) {
    fading.push(old);
    ramp(old.out.gain, 0, seconds);
    setTimeout(function () {
      old.stop();
      fading = fading.filter(function (b) { return b !== old; });
    }, seconds * 1000 + 500);
  }

  function checkHour() {
    var now = partOfDay(clock());
    if (now === hour && bed) return;
    var first = !bed;
    hour = now;
    if (bed) retire(bed, HOUR_FADE);
    bed = ENGINE.hour(ctx, amb, buffers, hour);
    /* the first bed rides in on the master's own fade */
    ramp(bed.out.gain, HOUR_LEVEL[hour], first ? 0 : HOUR_FADE);
    paint();
  }

  /* The place's own sound, if it has one: the old one fades as the new one
     comes in. */
  function arrive(seconds) {
    if (spot && spot.name === where) return;
    if (spot) retire(spot, seconds);
    spot = ENGINE.place(ctx, close, buffers, where);
    if (spot) ramp(spot.out.gain, 1, seconds);
  }

  /* Every fifth of a second: schedule whatever falls within the next
     moment of audio time. A suspended context does not advance, so nothing
     piles up while the tab is away. */
  function tick() {
    var until = ctx.currentTime + 0.6;
    if (bed) bed.tick(until);
    if (spot) spot.tick(until);
    fading.forEach(function (b) { b.tick(until); });
  }

  function start() {
    clearTimeout(stopT);
    graph();
    unlockSilent();
    if (ctx.state !== 'running') {
      var p = ctx.resume();
      if (p && p.catch) p.catch(function () {});
    }
    walls(0);
    checkHour();
    arrive(0);
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
        if (spot) spot.stop();
        fading.forEach(function (b) { b.stop(); });
        bed = null; spot = null; fading = []; hour = null;
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

  /* Going in or out: the walls close or open over a second or so. Moving
     from place to place: the place's own sound changes over the same time.
     Before the sound starts, both are only remembered for when it does. */
  window.OLAE_FARM_SOUND = {
    setIndoors: function (now) {
      now = !!now;
      if (now === indoor) return;
      indoor = now;
      if (playing()) walls(ROOM_FADE);
    },
    setPlace: function (name) {
      if (name === where) return;
      where = name;
      if (playing()) arrive(ROOM_FADE);
    }
  };
  paint();
})();
