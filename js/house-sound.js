/* house-sound.js — the balcony, heard. Off until the reader asks for it
   with "Listen outside" under the balcony's picture, and remembered in
   their browser after that (olae-balcony-sound). The button stands there
   for as long as the reader is on the balcony, so the sound can always be
   stopped where it is heard. Nothing is heard in the study.

   What is heard is İstanbul's, at this hour and in this month, made by
   js/balcony-sound-engine.js: the city and the sea far off, the gulls,
   which live there all year and call less at night, small birds on the
   roofs by day, busiest in spring and quietest in late summer, field
   crickets on warm evenings from May to July and tree crickets on warm
   nights from July to October, and now and then a ferry's horn while the
   ferries run. Rain, İstanbul's own or the reader's, is the essays' rain
   from js/rain-engine.js; the birds and the insects fall quiet in it.
   Snow falls without a sound and hushes the rest.

   With the glass folded away everything is close and clear. While Moris is
   out and the glass is closed, it comes through the glass: quieter, and
   without its top.

   Every start and stop is a fade; a hidden tab fades out and suspends the
   audio. Sound left on from an earlier visit waits for the first touch,
   click or key, because browsers start audio only from one. js/house.js
   says where the reader is, İstanbul's hour, month, temperature and
   weather, and whether the glass is closed, through
   OLAE_HOUSE_SOUND.update(). */
(function () {
  'use strict';
  var btn = document.getElementById('house-listen');
  var AC = window.AudioContext || window.webkitAudioContext;
  var ENGINE = window.OLAE_BALCONY_ENGINE;
  if (!btn || !AC || !ENGINE || !window.OLAE_RAIN) return;

  var KEY = 'olae-balcony-sound';
  /* Levels. `world` is everything but the rain, a little under the
     essays' reading volume, as the farm's beds are; each part of the day
     has its own share of it, and snow takes some away. The rain is at the
     essays' reading levels, light and heavy. Through the closed glass
     everything is about half as loud, with nothing above glassHz. VOICE is
     each voice's share of the world; the balance inside a voice is the
     engine's. */
  var LEVEL = { world: 0.22, snow: 0.6, rain: [0, 0.13, 0.19], glass: 0.5, glassHz: 1500, openHz: 18000 };
  var PART = { morning: 1.1, day: 1, evening: 1, night: 0.65 };
  var VOICE = { air: 0.5, birds: 1, gulls: 0.9, crickets: 0.8, treeCrickets: 0.8, ferry: 1 };
  var FADE = 1.5, HIDE_FADE = 1, CHANGE = 4;
  var label = btn.querySelector('[data-listen-label]');

  var where = { outside: false, glass: 'open', weather: null, level: 0, period: 'day', hour: 12, month: 1, temp: null };
  var wanted = false;
  try { wanted = localStorage.getItem(KEY) === 'on'; } catch (e) {}
  function save() {
    try { localStorage.setItem(KEY, wanted ? 'on' : 'off'); } catch (e) {}
  }
  function paint() {
    btn.hidden = !where.outside;
    label.textContent = wanted ? 'Stop the sound' : 'Listen outside';
    btn.setAttribute('aria-pressed', String(wanted));
  }

  /* What is heard now, voice by voice, with each voice's options. */
  function plan(w) {
    var wet = w.weather === 'rain', snow = w.weather === 'snow';
    var want = { air: {} };
    /* Birdsong is at its height from March to June and goes quiet after,
       through the late summer moult (RSPB); some birds, robins among them,
       sing again through autumn and winter. */
    var season = w.month >= 3 && w.month <= 6 ? 1 : w.month === 7 || w.month === 8 ? 0.35 : 0.6;
    var song = { morning: 1, day: 0.45, evening: 0.3, night: 0 }[w.period] || 0;
    if (song) want.birds = { busy: song * season * (wet || snow ? 0.3 : 1) };
    var calls = { morning: 1, day: 1, evening: 0.7, night: 0.25 }[w.period] || 1;
    want.gulls = { busy: calls * (wet || snow ? 0.6 : 1) };
    /* The insects keep to their months and to warm, dry evenings and
       nights: field crickets only well above 13 °C. Without İstanbul's
       temperature the months decide. */
    var warm = w.temp === null || w.temp >= 14;
    if (warm && !wet && !snow) {
      var night = w.period === 'night';
      if (w.month >= 5 && w.month <= 7 && (w.period === 'day' || w.period === 'evening' || (night && w.hour >= 18)))
        want.crickets = { temp: w.temp };
      if (w.month >= 7 && w.month <= 10 && (w.period === 'evening' || (night && (w.hour >= 17 || w.hour < 3))))
        want.treeCrickets = { temp: w.temp };
    }
    if (w.hour >= 7) want.ferry = {};
    return want;
  }

  /* iOS: Web Audio runs through the "ambient" session, which the ring/silent
     switch mutes. A short, looped, inaudible clip played through an <audio>
     element on the tap promotes the session to "playback". The same unlock
     as js/rain-read.js, js/farm-sound.js and /noise/. */
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

  /* ---- the graph: the world and the rain both pass through the glass
     into one master, so a single fade starts or stops everything. ---- */
  var ctx = null, master = null, glass = null, pane = null, world = null, rainGain = null;
  var buffers = {}, voices = {}, rain = null;
  var live = false, stopT = null, tickT = null, touched = false;
  /* Browsers start audio only after a touch, a click or a key. Until one
     has come, nothing is made at all. */
  function mayStart() {
    return !!ctx || touched || !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
  }
  function graph() {
    if (ctx) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    glass = ctx.createBiquadFilter(); glass.type = 'lowpass'; glass.Q.value = -3; glass.connect(master);
    pane = ctx.createGain(); pane.connect(glass);
    world = ctx.createGain(); world.gain.value = 0; world.connect(pane);
    rainGain = ctx.createGain(); rainGain.gain.value = 0; rainGain.connect(pane);
  }
  function ramp(param, value, seconds) {
    var t = ctx.currentTime;
    param.cancelScheduledValues(t);
    if (!seconds) { param.setValueAtTime(value, t); return; }
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + seconds);
  }

  /* Bring what is playing into line with what should be: voices come and
     go over `seconds`, the rain over a fade of its own, and the glass
     opens or closes. */
  function arrange(seconds) {
    var want = plan(where);
    Object.keys(VOICE).forEach(function (name) {
      var v = voices[name], options = want[name];
      if (options && !v) {
        v = voices[name] = ENGINE[name](ctx, world, buffers, options);
        ramp(v.out.gain, VOICE[name], seconds);
      } else if (options) {
        v.set(options);
      } else if (v) {
        delete voices[name];
        ramp(v.out.gain, 0, seconds || 0.05);
        setTimeout(function () { v.stop(); }, (seconds || 0.05) * 1000 + 500);
      }
    });
    ramp(world.gain, LEVEL.world * (PART[where.period] || 1) * (where.weather === 'snow' ? LEVEL.snow : 1), seconds);
    var heavy = where.weather === 'rain' ? where.level : 0;
    if (heavy) {
      if (!rain) rain = window.OLAE_RAIN.buildRain(ctx, rainGain, buffers, { intensity: heavy });
      else rain.setIntensity(heavy);
      ramp(rainGain.gain, LEVEL.rain[heavy], seconds && FADE);
    } else if (rain) {
      var old = rain;
      rain = null;
      ramp(rainGain.gain, 0, seconds && FADE);
      setTimeout(function () { old.stop(); }, FADE * 1000 + 300);
    }
    var shut = where.glass === 'closed';
    ramp(pane.gain, shut ? LEVEL.glass : 1, seconds && FADE);
    ramp(glass.frequency, shut ? LEVEL.glassHz : LEVEL.openHz, seconds && FADE);
  }

  /* Every fifth of a second: schedule whatever falls within the next
     moment of audio time. A suspended context does not advance, so nothing
     piles up while the tab is away. */
  function tick() {
    var until = ctx.currentTime + 0.6;
    Object.keys(voices).forEach(function (name) { voices[name].tick(until); });
  }

  function start() {
    if (!wanted || !where.outside || document.hidden || !mayStart()) return;
    clearTimeout(stopT); stopT = null;
    graph();
    unlockSilent();
    if (ctx.state !== 'running') {
      var p = ctx.resume();
      if (p && p.catch) p.catch(function () {});
    }
    arrange(live ? CHANGE : 0);
    if (!live) ramp(master.gain, 1, FADE);
    live = true;
    if (!tickT) tickT = setInterval(tick, 200);
    tick();
  }
  /* Fade out, then stop scheduling and suspend. Turned off, the voices and
     the rain are let go as well; in the study or a hidden tab, they wait. */
  function quiet(seconds) {
    if (!ctx || !live) return;
    live = false;
    ramp(master.gain, 0, seconds);
    clearTimeout(stopT);
    stopT = setTimeout(function () {
      stopT = null;
      clearInterval(tickT); tickT = null;
      if (!wanted) {
        Object.keys(voices).forEach(function (name) { voices[name].stop(); });
        voices = {};
        if (rain) { rain.stop(); rain = null; }
        ramp(rainGain.gain, 0, 0);
      }
      try { if (silentEl) silentEl.pause(); } catch (e) {}
      var p = ctx.suspend();
      if (p && p.catch) p.catch(function () {});
    }, seconds * 1000 + 150);
  }
  function follow() {
    if (wanted && where.outside && !document.hidden) start();
    else quiet(document.hidden ? HIDE_FADE : FADE);
  }

  btn.addEventListener('click', function () {
    wanted = !wanted;
    save();
    follow();
    paint();
  });

  /* Sound left on from an earlier visit waits for the first touch, click or
     key: browsers start audio only from one. The button's own click is its
     own business. */
  function nudge(event) {
    touched = true;
    if (!wanted || !where.outside || document.hidden || btn.contains(event.target)) return;
    if (!ctx || !live || ctx.state !== 'running') start();
  }
  ['click', 'touchend', 'keydown'].forEach(function (type) {
    document.addEventListener(type, nudge, true);
  });
  document.addEventListener('visibilitychange', follow);

  window.OLAE_HOUSE_SOUND = {
    update: function (next) {
      var now = {
        outside: !!next.outside,
        glass: next.glass === 'closed' ? 'closed' : 'open',
        weather: next.weather === 'rain' || next.weather === 'snow' ? next.weather : null,
        level: next.level === 2 ? 2 : next.level ? 1 : 0,
        period: PART[next.period] ? next.period : 'day',
        hour: typeof next.hour === 'number' ? next.hour : 12,
        month: typeof next.month === 'number' ? next.month : 1,
        temp: typeof next.temp === 'number' && isFinite(next.temp) ? next.temp : null
      };
      if (!now.weather) now.level = 0;
      var same = Object.keys(now).every(function (k) { return now[k] === where[k]; });
      where = now;
      paint();
      if (!same) follow();
    }
  };
  paint();
})();
