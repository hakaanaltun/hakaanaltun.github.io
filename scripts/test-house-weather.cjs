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
assert.equal(weather.sample(rain, base).kind, 'rain');
assert.equal(weather.sample(rain, base + 5 * M).kind, null, 'rain takes a dry pause');
assert.equal(weather.sample(rain, base + 6 * M).kind, 'rain', 'rain returns');
assert.equal(weather.sample(current({ snowfall: 0.3, weather_code: 71 }), base).kind, 'snow');
assert.equal(weather.sample(current({ weather_code: 65 }), base).level, 2);
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
      assert.equal(options.credentials, 'omit');
      assert.equal(options.referrerPolicy, 'no-referrer');
      if (hold) return new Promise(() => {});
      if (fail) return Promise.reject(new Error('offline'));
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ current: current({ time: time / 1000, cloud_cover: 100 }) }) });
    }
  };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  let stop = weather.start(value => values.push(value), env);
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
  stop = weather.start(value => values.push(value), env);
  await settle(); deadline(); await settle();
  assert.equal(values.at(-1).available, false, 'a hanging endpoint times out');
  stop(); assert.equal(interval, null); assert.equal(listeners.visibilitychange, undefined);
  console.log('House weather: conditions, rain pauses, clouds, reduced motion, cache, refresh, hidden tabs, outages and timeout passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
