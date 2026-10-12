/* İstanbul's modelled current weather, from Open-Meteo. The short showers
   and passing clouds are an illustration of those conditions, not radar. */
(function (root) {
  'use strict';
  var MINUTE = 60000, REFRESH = 15 * MINUTE, MAX_AGE = 90 * MINUTE;
  var URL = 'https://api.open-meteo.com/v1/forecast?latitude=41.015&longitude=28.979&current=precipitation,rain,showers,snowfall,weather_code,cloud_cover&timeformat=unixtime&timezone=Europe%2FIstanbul';
  var KEY = 'olae-istanbul-weather-v1';
  function parse(data, now) {
    var c = data && data.current;
    if (!c || !['time', 'precipitation', 'rain', 'showers', 'snowfall', 'weather_code', 'cloud_cover'].every(function (k) { return typeof c[k] === 'number' && Number.isFinite(c[k]); })) return null;
    if (now - c.time * 1000 > MAX_AGE || c.time * 1000 - now > 15 * MINUTE || c.cloud_cover < 0 || c.cloud_cover > 100 || c.precipitation < 0 || c.rain < 0 || c.showers < 0 || c.snowfall < 0) return null;
    return c;
  }
  function sample(c, now, still) {
    if (!c || !parse({ current: c }, now)) return { available: false, kind: null, level: 0, clouded: false };
    var code = c.weather_code;
    var snow = c.snowfall > 0 || [71, 73, 75, 77, 85, 86].indexOf(code) !== -1;
    var wet = snow || c.precipitation > 0 || [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].indexOf(code) !== -1;
    var heavy = [65, 67, 75, 82, 86, 95, 96, 99].indexOf(code) !== -1 || c.precipitation >= 1;
    // A six-minute spell has a dry pause, even in rainy conditions.
    var falling = wet && (still || now % (6 * MINUTE) < (heavy ? 0.8 : 0.6) * 6 * MINUTE);
    var fog = code === 45 || code === 48;
    var cover = Math.max(c.cloud_cover, code === 3 || fog ? 100 : wet ? 75 : 0);
    // Overcast stays closed; broken cloud crosses in slow nine-minute spells.
    var clouded = falling || cover >= 90 || (cover >= 25 && (still ? cover >= 50 : now % (9 * MINUTE) < cover / 100 * 9 * MINUTE));
    return { available: true, kind: falling ? (snow ? 'snow' : 'rain') : null, level: falling ? (heavy ? 2 : 1) : 0, clouded: clouded,
      summary: fog ? 'Fog' : wet ? (snow ? 'Snow' : 'Rain') : cover >= 90 ? 'Overcast' : cover >= 25 ? 'Partly cloudy' : 'Clear', time: c.time };
  }
  function start(onChange, env) {
    var w = env || root, doc = w.document, current = null, lastFetch = 0, inFlight = false, stopped = false;
    var still = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function now() { return w.Date.now(); }
    try {
      var cached = JSON.parse(w.sessionStorage.getItem(KEY));
      if (cached && cached.saved <= now() && now() - cached.saved < REFRESH) {
        current = parse(cached.data, now());
        if (current) lastFetch = cached.saved;
      }
    } catch (e) { /* A blocked or invalid cache is optional. */ }
    function emit() { if (!stopped) onChange(sample(current, now(), still)); }
    function refresh() {
      if (stopped || doc.hidden || inFlight || (lastFetch && now() - lastFetch < REFRESH)) return;
      lastFetch = now(); inFlight = true;
      var controller = typeof w.AbortController === 'function' ? new w.AbortController() : null;
      var timeout;
      var deadline = new Promise(function (_, reject) {
        timeout = w.setTimeout(function () { if (controller) controller.abort(); reject(new Error('Weather timeout')); }, 10000);
      });
      var request = Promise.resolve().then(function () {
        return w.fetch(URL, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller ? controller.signal : undefined });
      }).then(function (response) { if (!response.ok) throw new Error('Weather unavailable'); return response.json(); });
      Promise.race([request, deadline]).then(function (data) {
        var next = parse(data, now());
        if (!next) throw new Error('Invalid weather');
        current = next;
        try { w.sessionStorage.setItem(KEY, JSON.stringify({ saved: now(), data: data })); } catch (e) { /* optional */ }
      }).catch(function () { /* A recent result can bridge a brief outage. */ }).finally(function () {
        w.clearTimeout(timeout); inFlight = false; emit();
      });
    }
    function tick() { if (!doc.hidden) { emit(); refresh(); } }
    doc.addEventListener('visibilitychange', tick);
    var timer = w.setInterval(tick, 20000);
    tick();
    return function stop() { stopped = true; w.clearInterval(timer); doc.removeEventListener('visibilitychange', tick); };
  }
  var api = { parse: parse, sample: sample, start: start };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OLAE_ISTANBUL_WEATHER = api;
})(typeof window !== 'undefined' ? window : globalThis);
