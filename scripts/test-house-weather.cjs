'use strict';
const assert = require('node:assert/strict');
const weather = require('../js/house-weather.js');
const M = 60000;
const base = Math.floor(Date.now() / (18 * M)) * 18 * M;
const current = (more = {}) => ({ time: base / 1000, precipitation: 0, rain: 0, showers: 0, snowfall: 0, weather_code: 0, cloud_cover: 0, ...more });
assert.equal(weather.parse({ current: current() }, base).cloud_cover, 0);
for (const bad of [null, { current: current({ cloud_cover: null }) }, { current: current({ precipitation: -1 }) }, { current: current({ cloud_cover: 101 }) }]) assert.equal(weather.parse(bad, base), null);
assert.equal(weather.parse({ current: current() }, base + 91 * M), null);
assert.equal(weather.parse({ current: current({ time: (base + 16 * M) / 1000 }) }, base), null);
assert.equal(weather.sample(current(), base).kind, null);
assert.equal(weather.sample(current(), base).clouded, false);
const rain = current({ rain: 0.2, precipitation: 0.2, weather_code: 61, cloud_cover: 80 });
const snow = current({ snowfall: 0.3, precipitation: 0.3, weather_code: 71, cloud_cover: 80 });
// Rain and snow fall for as long as the report has them, under a closed sky.
for (let t = 0; t < 18 * M; t += M / 4) {
  assert.deepEqual([weather.sample(rain, base + t).kind, weather.sample(rain, base + t).clouded], ['rain', true], 'rain without a pause at ' + t / M + ' min');
  assert.deepEqual([weather.sample(snow, base + t).kind, weather.sample(snow, base + t).clouded], ['snow', true], 'snow without a pause at ' + t / M + ' min');
}
assert.equal(weather.sample(current({ weather_code: 65 }), base).level, 2);
// İstanbul's temperature in whole degrees; a report without one keeps its sky.
assert.equal(weather.sample(current({ temperature_2m: 17.6 }), base).temperature, 18);
assert.ok(Object.is(weather.sample(current({ temperature_2m: -0.4 }), base).temperature, 0), 'never a minus zero');
assert.equal(weather.sample(current({ temperature_2m: -2.6 }), base).temperature, -3);
assert.equal(weather.sample(current(), base).temperature, null);
assert.equal(weather.sample(current({ temperature_2m: null, weather_code: 3 }), base).clouded, true);
for (const code of [3, 45, 48]) assert.equal(weather.sample(current({ weather_code: code }), base + 8 * M).clouded, true);
assert.equal(weather.sample(current({ cloud_cover: 60 }), base).clouded, true);
assert.equal(weather.sample(current({ cloud_cover: 60 }), base + 8 * M).clouded, false);
assert.equal(weather.sample(current({ cloud_cover: 60 }), base + 8 * M, true).clouded, true);
assert.equal(weather.sample(rain, base + 5 * M, true).kind, 'rain');
assert.equal(weather.sample(rain, base + 91 * M).available, false);

async function run() {
  let time = base, calls = 0, fail = false, hold = false, interval, deadline;
  const values = [], listeners = {}, cache = new Map();
  const env = {
    Date: { now: () => time },
    document: { hidden: false, addEventListener: (key, fn) => { listeners[key] = fn; }, removeEventListener: key => { delete listeners[key]; } },
    matchMedia: () => ({ matches: false }),
    sessionStorage: { getItem: key => cache.get(key) || null, setItem: (key, val) => cache.set(key, val) },
    setInterval: fn => { interval = fn; return 1; }, clearInterval: () => { interval = null; },
    setTimeout: fn => { deadline = fn; return 2; }, clearTimeout: () => {},
    fetch: (url, options) => {
      calls++;
      assert.match(url, /latitude=41.015&longitude=28.979/);
      assert.match(url, /current=temperature_2m,/);
      assert.equal(options.credentials, 'omit');
      assert.equal(options.referrerPolicy, 'no-referrer');
      if (hold) return new Promise(() => {});
      if (fail) return Promise.reject(new Error('offline'));
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ current: current({ time: time / 1000, cloud_cover: 100 }) }) });
    }
  };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  let stop = weather.start(value => values.push(value), env);
  assert.equal(values.length, 0, 'nothing is said before the first answer');
  await settle();
  assert.equal(calls, 1);
  assert.equal(values.at(-1).clouded, true);
  interval(); await settle(); assert.equal(calls, 1, 'no request before fifteen minutes');
  stop();
  stop = weather.start(value => values.push(value), env);
  await settle(); assert.equal(calls, 1, 'return visits reuse the fresh cache');
  env.document.hidden = true; time += 16 * M; interval(); await settle(); assert.equal(calls, 1);
  env.document.hidden = false; listeners.visibilitychange(); await settle(); assert.equal(calls, 2);
  fail = true; time += 16 * M; interval(); await settle();
  assert.equal(values.at(-1).available, true, 'recent data bridges an outage');
  time += 91 * M; interval(); await settle();
  assert.equal(values.at(-1).available, false, 'stale weather is never replayed');
  stop();
  fail = false; hold = true; cache.clear();
  const said = values.length;
  stop = weather.start(value => values.push(value), env);
  await settle(); assert.equal(values.length, said, 'still checking while the request hangs');
  deadline(); await settle();
  assert.equal(values.at(-1).available, false, 'a hanging endpoint times out');
  stop(); assert.equal(interval, null); assert.equal(listeners.visibilitychange, undefined);
  console.log('House weather: conditions, temperature, unbroken rain and snow, clouds, reduced motion, checking until the first answer, cache, refresh, hidden tabs, outages and timeout passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
