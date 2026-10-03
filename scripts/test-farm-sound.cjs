/* The Farm House, heard. Runs the built page (Jekyll's output, so the sky
   the sound reads is the one _data/cities.yml renders) against a Web Audio
   stub that remembers what was scheduled: off until asked, remembered or
   not, fades rather than cuts, a creak on coming indoors and the house
   creaking on its own after that, the outdoors muffled through the walls,
   the part of the day from the visitor's sky, ?hour for testing, and the
   one-line swap to a recorded creak that AGENTS.md promises.
   Run `bundle exec jekyll build` first; node scripts/test-farm-sound.cjs */
'use strict';
process.env.TZ = 'Europe/Istanbul';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const built = path.join(root, '_site', 'farm-house', 'index.html');
if (!fs.existsSync(built)) {
  console.error('test-farm-sound: run `bundle exec jekyll build` first');
  process.exit(1);
}
const html = fs.readFileSync(built, 'utf8');
const engineSource = fs.readFileSync(path.join(root, 'js', 'farm-sound-engine.js'), 'utf8');

/* The page's scripts in the order it runs them: inline ones as written,
   the others read from the repository by their path. */
const scripts = [...html.matchAll(/<script(?:\s+src="([^"]+)")?>([\s\S]*?)<\/script>/g)]
  .map(([, src, body]) => src ? fs.readFileSync(path.join(root, src.split('?')[0]), 'utf8') : body);
assert.ok(scripts.some((s) => s.includes('window.OLAE_SKY')), 'the page carries the site sky');
assert.ok(scripts.some((s) => s.includes('OLAE_FARM_ENGINE =')), 'the page loads the sound engine');

/* 3 October 2026, 10:00 UTC: an ordinary autumn day in İstanbul. */
const NOW = Date.UTC(2026, 9, 3, 10, 0, 0);

function audioStub(w) {
  const log = { contexts: [], sources: [], silentPlays: 0, silentPauses: 0 };
  function param(value) {
    return {
      value, ramps: [],
      cancelScheduledValues() {},
      setValueAtTime(v, t) { this.ramps.push(['set', v, t]); this.value = v; },
      linearRampToValueAtTime(v, t) { this.ramps.push(['ramp', v, t]); this.value = v; },
      exponentialRampToValueAtTime(v, t) { this.ramps.push(['exp', v, t]); this.value = v; },
      last() { return this.ramps[this.ramps.length - 1]; }
    };
  }
  function node(extra) { return Object.assign({ connect() {}, disconnect() {}, start() {}, stop() {} }, extra); }
  w.AudioContext = function () {
    const ctx = this;
    log.contexts.push(ctx);
    this.sampleRate = 48000; this.currentTime = 0; this.state = 'suspended';
    this.destination = node({});
    this.resume = () => { ctx.state = 'running'; return Promise.resolve(); };
    this.suspend = () => { ctx.state = 'suspended'; return Promise.resolve(); };
    /* every gain and filter is kept, in the order made: the page makes its
       master first, then the creaks' bus, the wall, and the hour's bus */
    this.gains = []; this.filters = [];
    this.createGain = () => { const g = node({ gain: param(1) }); ctx.gains.push(g); return g; };
    this.createBiquadFilter = () => { const f = node({ type: '', frequency: param(350), Q: param(1) }); ctx.filters.push(f); return f; };
    this.createOscillator = () => node({ type: 'sine', frequency: param(440) });
    this.createStereoPanner = () => node({ pan: param(0) });
    this.createBufferSource = () => {
      const s = node({ buffer: null, loop: false, onended: null, playbackRate: param(1) });
      s.start = (when) => { s.when = when; log.sources.push(s); };
      return s;
    };
    this.createBuffer = (channels, length, rate) => {
      const data = new Float32Array(length);
      return { length, sampleRate: rate, duration: length / rate, getChannelData: () => data };
    };
    this.decodeAudioData = (data, ok) => ok({ recorded: true, duration: 0.6 });
  };
  w.Audio = function () {
    this.setAttribute = () => {};
    this.play = () => { log.silentPlays++; return Promise.resolve(); };
    this.pause = () => { log.silentPauses++; };
  };
  return log;
}

function page({ hour, stored, blocked = false, sky = true } = {}) {
  const url = 'https://hakanaltun.io/farm-house/' + (hour === undefined ? '' : '?hour=' + hour);
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  const RealDate = w.Date;
  w.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [NOW])); } static now() { return NOW; } };
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  const timers = new Map(), intervals = new Map();
  let id = 0;
  w.setTimeout = (fn, ms) => { timers.set(++id, fn); return id; };
  w.clearTimeout = (i) => timers.delete(i);
  w.setInterval = (fn, ms) => { intervals.set(++id, { fn, ms }); return id; };
  w.clearInterval = (i) => intervals.delete(i);
  Object.defineProperty(w.navigator, 'geolocation', { get() { throw new Error('the sound asked for a location'); } });
  if (stored !== undefined) w.localStorage.setItem('olae-farm-sound', stored);
  if (blocked) Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('Denied', 'SecurityError'); } });
  const audio = audioStub(w);
  const creaks = [];
  scripts.forEach((s) => {
    if (!sky && s.includes('window.OLAE_SKY =')) return;
    w.eval(s);
    /* the engine is shared by reference, so a spy on it sees every creak */
    if (s.includes('OLAE_FARM_ENGINE =')) {
      const real = w.OLAE_FARM_ENGINE.creak;
      w.OLAE_FARM_ENGINE.creak = (ctx, out, when, kind, level) => { creaks.push({ when, kind, level }); real(ctx, out, when, kind, level); };
    }
  });
  const q = (s) => w.document.querySelector(s);
  const click = (s) => { const n = typeof s === 'string' ? q(s) : s; assert.ok(n, String(s)); n.click(); };
  const ctx = () => audio.contexts[0];
  const runTimers = () => { const all = [...timers.values()]; timers.clear(); all.forEach((fn) => fn()); };
  const tick = () => [...intervals.values()].filter((i) => i.ms < 1000).forEach((i) => i.fn());
  const hide = (hidden) => {
    Object.defineProperty(w.document, 'hidden', { value: hidden, configurable: true });
    w.document.dispatchEvent(new w.Event('visibilitychange'));
  };
  return { w, q, click, audio, creaks, ctx, runTimers, tick, hide, intervals };
}

/* ---- off by default; one quiet toggle in the footer ---- */
{
  const p = page();
  const btn = p.q('#farm-sound');
  assert.equal(btn.hidden, false, 'the toggle shows where Web Audio exists');
  assert.equal(btn.closest('footer') !== null, true, 'the toggle lives in the footer');
  assert.equal(btn.textContent, 'listen to the farm');
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  assert.equal(p.audio.contexts.length, 0, 'nothing is made until the visitor asks');
  p.click('#begin');
  p.click('[data-object="door"]');
  assert.equal(p.audio.contexts.length, 0, 'walking the house makes no sound while it is off');
  assert.equal(p.w.localStorage.getItem('olae-farm-sound'), null, 'nothing is stored until the visitor chooses');
}

/* ---- turning it on: a fade in, the iOS unlock, the choice remembered ---- */
{
  const p = page({ hour: 13 });
  p.click('#begin');
  const btn = p.q('#farm-sound');
  p.click(btn);
  const ctx = p.ctx();
  assert.ok(ctx, 'the toggle makes the audio');
  assert.equal(ctx.state, 'running');
  assert.ok(p.audio.silentPlays >= 1, 'the silent clip plays on the tap, for the iPhone switch');
  assert.equal(btn.textContent, 'stop the sound');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  assert.match(btn.title, /^Midday/, '?hour=13 on an October day in İstanbul is midday');
  assert.equal(p.w.localStorage.getItem('olae-farm-sound'), 'on');
  assert.equal(p.creaks.length, 0, 'the veranda does not creak');
}

/* ---- fades, a hidden tab, and turning it off ---- */
{
  const p = page({ hour: 19 });
  p.click('#begin');
  p.click('#farm-sound');
  const ctx = p.ctx();
  const master = ctx.gains[0];
  const rise = master.gain.last();
  assert.equal(rise[0], 'ramp');
  assert.equal(rise[1], 1);
  assert.ok(rise[2] - ctx.currentTime >= 1 && rise[2] - ctx.currentTime <= 2, 'the sound fades in over one to two seconds');

  ctx.currentTime = 10;
  p.hide(true);
  const dip = master.gain.last();
  assert.deepEqual([dip[0], dip[1]], ['ramp', 0], 'a hidden tab fades out');
  assert.ok(dip[2] - 10 >= 1 && dip[2] - 10 <= 2);
  assert.equal(ctx.state, 'running', 'and is not cut while it fades');
  p.runTimers();
  assert.equal(ctx.state, 'suspended', 'then the audio is suspended');
  assert.equal(p.intervals.size, 0, 'and nothing is scheduled while the tab is away');

  p.hide(false);
  assert.equal(ctx.state, 'running', 'the tab coming back resumes it');
  const back = master.gain.last();
  assert.deepEqual([back[0], back[1]], ['ramp', 1], 'with a fade in');

  p.click('#farm-sound');
  const out = master.gain.last();
  assert.deepEqual([out[0], out[1]], ['ramp', 0], 'turning it off fades out');
  assert.ok(out[2] - ctx.currentTime >= 1 && out[2] - ctx.currentTime <= 2);
  assert.equal(p.q('#farm-sound').textContent, 'listen to the farm');
  assert.equal(p.w.localStorage.getItem('olae-farm-sound'), 'off');
  p.runTimers();
  assert.equal(ctx.state, 'suspended');
  assert.ok(p.audio.silentPauses >= 1, 'the silent clip stops with it');
  p.hide(true); p.hide(false);
  assert.equal(ctx.state, 'suspended', 'a tab coming back does not restart sound that was turned off');
}

/* ---- creaks: one on coming indoors, then the room on its own ---- */
{
  const p = page({ hour: 19 });
  p.click('#begin');
  p.click('#farm-sound');
  const ctx = p.ctx();
  const wall = ctx.filters[0];
  assert.ok(wall.frequency.value > 10000, 'outdoors the wall lets everything through');

  ctx.currentTime = 5;
  p.click('[data-object="door"]');
  assert.equal(p.creaks.length, 1, 'stepping into the hall creaks once');
  assert.equal(p.creaks[0].kind, 'step');
  assert.ok(p.creaks[0].when > 5 && p.creaks[0].when < 5.5, 'as the foot comes down');
  const shut = wall.frequency.last();
  assert.equal(shut[0], 'ramp');
  assert.ok(shut[1] <= 2500, 'indoors the hour is muffled');
  assert.ok(shut[2] - 5 >= 1 && shut[2] - 5 <= 2, 'over a second or so, not at once');
  const step = p.audio.sources.find((s) => s.buffer && s.buffer.sampleRate === 22050);
  assert.ok(step, 'the creak is synthesised into a buffer and played');

  /* the house on its own: nothing for 25 seconds, then one creak within 70 */
  let first = null;
  for (let t = 5; t <= 80; t += 0.2) {
    ctx.currentTime = t;
    p.tick();
    if (p.creaks.length > 1 && first === null) first = p.creaks[1];
  }
  assert.ok(first, 'a room left alone creaks on its own');
  assert.equal(first.kind, 'settle');
  assert.ok(first.when - 5 >= 25 && first.when - 5 <= 70.6, `after 25 to 70 seconds (${(first.when - 5).toFixed(1)})`);
  assert.ok(first.level < p.creaks[0].level, 'and more quietly than a footstep');

  /* many visits: the gaps vary, all within 25–70 s */
  const gaps = [];
  for (let t = 80; t <= 2000; t += 0.25) { ctx.currentTime = t; p.tick(); }
  const settles = p.creaks.filter((c) => c.kind === 'settle').map((c) => c.when);
  for (let i = 1; i < settles.length; i++) gaps.push(settles[i] - settles[i - 1]);
  assert.ok(gaps.length >= 20, 'the house keeps creaking while the visitor stays');
  assert.ok(gaps.every((g) => g >= 24.9 && g <= 70.6), 'every gap is between 25 and 70 seconds');
  assert.ok(Math.max(...gaps) - Math.min(...gaps) > 15, 'and the gaps are not a loop');

  const before = p.creaks.length;
  p.click('[data-object="kitchen"]');
  assert.equal(p.creaks.length, before + 1, 'the kitchen is another step on the boards');
  p.click('#back'); p.click('#back');
  const after = p.creaks.length;
  assert.equal(p.q('#scene-name').textContent, 'THE VERANDA');
  const open = wall.frequency.last();
  assert.ok(open[1] > 10000, 'back outdoors the wall opens again');
  for (let t = 2000; t <= 2200; t += 0.25) { ctx.currentTime = t; p.tick(); }
  assert.equal(p.creaks.length, after, 'and the veranda never creaks');
}

/* ---- the creak buffers are never the same twice ---- */
{
  const w = new JSDOM('', { runScripts: 'outside-only' }).window;
  audioStub(w);
  w.OLAE_RAIN = {};
  w.eval(engineSource);
  const ctx = new w.AudioContext();
  const made = [];
  ctx.createBufferSource = () => {
    const s = { connect() {}, disconnect() {}, playbackRate: { value: 1 }, start() { made.push(s.buffer); } };
    return s;
  };
  for (let i = 0; i < 12; i++) w.OLAE_FARM_ENGINE.creak(ctx, { connect() {} }, 0, i % 3 ? 'settle' : 'step', 0.1);
  const lengths = new Set(made.map((b) => b.length));
  assert.ok(lengths.size >= 10, 'twelve creaks, twelve lengths');
  for (const b of made) {
    const d = b.getChannelData(0);
    let peak = 0;
    for (const x of d) peak = Math.max(peak, Math.abs(x));
    assert.ok(peak > 0.5 && peak <= 1.0001, 'each creak is normalised, never clipped');
    assert.ok(d.length / b.sampleRate < 2, 'and short');
  }
}

/* ---- the part of the day: the visitor's sky, or ?hour= for testing ---- */
for (const [hour, part] of [[8, 'Morning'], [13, 'Midday'], [19, 'Evening'], [23, 'Night'], [3, 'Night']]) {
  const p = page({ hour, stored: 'on' });
  assert.match(p.q('#farm-sound').title, new RegExp('^' + part), `?hour=${hour} in İstanbul on 3 October is ${part.toLowerCase()}`);
}
for (const [hour, part] of [[7, 'Morning'], [12, 'Midday'], [20, 'Evening'], [23, 'Night']]) {
  const p = page({ hour, stored: 'on', sky: false });
  assert.match(p.q('#farm-sound').title, new RegExp('^' + part), `without the sky, the clock decides: ${hour}:00 is ${part.toLowerCase()}`);
}
{
  const p = page({ hour: 'noon', stored: 'on' });
  assert.match(p.q('#farm-sound').title, /^Midday/, 'a malformed ?hour is ignored: the real clock (13:00 in İstanbul) decides');
  assert.equal([...p.w.document.querySelectorAll('a[href]')].filter((a) => /[?&]hour=/.test(a.getAttribute('href'))).length, 0,
    'no link on the page carries ?hour');
  assert.doesNotMatch(html, /href="[^"]*[?&]hour=/, 'nor does the built page');
}

/* ---- remembered on: it waits for the first touch, as browsers require ---- */
{
  const p = page({ hour: 19, stored: 'on' });
  assert.equal(p.q('#farm-sound').textContent, 'stop the sound', 'the remembered choice is shown');
  assert.equal(p.audio.contexts.length, 0, 'but no audio starts before the visitor does anything');
  p.click('#begin');
  assert.equal(p.ctx().state, 'running', 'the first click brings it in');
  p.ctx().currentTime = 3;
  p.click('[data-object="door"]');
  assert.equal(p.creaks.length, 1, 'and the hall creaks');
}
{
  const p = page({ hour: 19, stored: 'on' });
  p.click('#farm-sound');
  assert.equal(p.audio.contexts.length, 0, 'clicking the toggle first turns the remembered sound off without starting it');
  assert.equal(p.w.localStorage.getItem('olae-farm-sound'), 'off');
}

/* ---- storage that cannot be reached ---- */
{
  const p = page({ hour: 19, blocked: true });
  assert.equal(p.q('#farm-sound').textContent, 'listen to the farm', 'blocked storage starts off');
  p.click('#begin');
  p.click('#farm-sound');
  assert.equal(p.ctx().state, 'running', 'and the toggle still works');
  p.click('[data-object="door"]');
  assert.equal(p.creaks.length, 1);
  p.click('#farm-sound');
  assert.equal(p.q('#farm-sound').textContent, 'listen to the farm');
}

/* ---- no Web Audio: no toggle, and the house works as before ---- */
{
  const dom = new JSDOM(html, { url: 'https://hakanaltun.io/farm-house/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  scripts.forEach((s) => w.eval(s));
  assert.equal(w.document.getElementById('farm-sound').hidden, true, 'without Web Audio the toggle stays hidden');
  assert.equal(w.OLAE_FARM_SOUND, undefined);
  w.document.getElementById('begin').click();
  w.document.querySelector('[data-object="door"]').click();
  assert.equal(w.document.getElementById('scene-name').textContent, 'THE ENTRANCE', 'and the visit goes on');
}

/* ---- the one-line swap to a recorded creak ---- */
{
  const line = /^(\s*)var creakSource = synthCreak;\s*$/m;
  assert.equal(engineSource.split('\n').filter((l) => line.test(l)).length, 1, 'the creak is chosen on exactly one line');
  const swapped = engineSource.replace(line, '$1var creakSource = recordedCreak("/farm-house/assets/creak.m4a");');
  const w = new JSDOM('', { runScripts: 'outside-only' }).window;
  audioStub(w);
  w.OLAE_RAIN = {};
  const asked = [];
  w.fetch = (url) => { asked.push(url); return Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }); };
  w.eval(swapped);
  const ctx = new w.AudioContext();
  const played = [];
  ctx.createBufferSource = () => {
    const s = { connect() {}, disconnect() {}, playbackRate: { value: 1 }, start() { played.push(s); } };
    return s;
  };
  w.OLAE_FARM_ENGINE.creak(ctx, { connect() {} }, 0, 'step', 0.1);
  assert.equal(played.length, 0, 'until the file has arrived, a creak is simply not heard');
  w.OLAE_FARM_ENGINE.warm(ctx);
  setTimeout(() => {
    assert.deepEqual(asked, ['/farm-house/assets/creak.m4a'], 'the file is fetched once');
    w.OLAE_FARM_ENGINE.creak(ctx, { connect() {} }, 1, 'settle', 0.1);
    w.OLAE_FARM_ENGINE.creak(ctx, { connect() {} }, 2, 'step', 0.1);
    assert.equal(played.length, 2, 'then every creak is the recording');
    assert.ok(played.every((s) => s.buffer && s.buffer.recorded));
    assert.ok(played.some((s) => s.playbackRate.value !== 1), 'played at a slightly different speed each time');
    console.log('Farm sound passed: off by default and remembered, fades in, out and across a hidden tab, a creak on coming indoors and every 25–70 s after, the hour muffled indoors, the part of the day from the sky or ?hour, and the one-line swap to a recording.');
  }, 20);
}
