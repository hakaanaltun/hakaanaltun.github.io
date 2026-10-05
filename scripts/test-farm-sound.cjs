/* The Farm House, heard. Runs the built page (Jekyll's output, so the sky
   the sound reads is the one _data/cities.yml renders) against a Web Audio
   stub that remembers what was scheduled: off until asked, remembered or
   not, fades rather than cuts, the hour muffled through the walls indoors
   and open again outside, the horses heard only near them, the part of the
   day from the visitor's sky, and ?hour for testing. Nothing creaks: the
   creaks were tried and taken out.
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

/* The page's scripts in the order it runs them: inline ones as written,
   the others read from the repository by their path. */
const scripts = [...html.matchAll(/<script(?:\s+src="([^"]+)")?>([\s\S]*?)<\/script>/g)]
  .map(([, src, body]) => src ? fs.readFileSync(path.join(root, src.split('?')[0]), 'utf8') : body);
assert.ok(scripts.some((s) => s.includes('window.OLAE_SKY')), 'the page carries the site sky');
assert.ok(scripts.some((s) => s.includes('OLAE_FARM_ENGINE =')), 'the page loads the sound engine');

/* 3 October 2026, 10:00 UTC: an ordinary autumn day in İstanbul. */
const NOW = Date.UTC(2026, 9, 3, 10, 0, 0);

function audioStub(w) {
  const log = { contexts: [], silentPlays: 0, silentPauses: 0 };
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
  /* a node remembers what it was connected to */
  function node(extra) {
    return Object.assign({ to: [], connect(d) { this.to.push(d); return d; }, disconnect() {}, start() {}, stop() {} }, extra);
  }
  w.AudioContext = function () {
    const ctx = this;
    log.contexts.push(ctx);
    this.sampleRate = 48000; this.currentTime = 0; this.state = 'suspended';
    this.destination = node({});
    this.resume = () => { ctx.state = 'running'; return Promise.resolve(); };
    this.suspend = () => { ctx.state = 'suspended'; return Promise.resolve(); };
    /* every gain and filter is kept, in the order made: the page makes its
       master first, then the wall, then the hour's bus behind it */
    this.gains = []; this.filters = [];
    this.createGain = () => { const g = node({ gain: param(1) }); ctx.gains.push(g); return g; };
    this.createBiquadFilter = () => { const f = node({ type: '', frequency: param(350), Q: param(1) }); ctx.filters.push(f); return f; };
    this.createOscillator = () => node({ type: 'sine', frequency: param(440) });
    this.createStereoPanner = () => node({ pan: param(0) });
    this.createBufferSource = () => node({ buffer: null, loop: false, onended: null, playbackRate: param(1) });
    this.createBuffer = (channels, length, rate) => {
      const data = new Float32Array(length);
      return { length, sampleRate: rate, duration: length / rate, getChannelData: () => data };
    };
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
  w.setTimeout = (fn) => { timers.set(++id, fn); return id; };
  w.clearTimeout = (i) => timers.delete(i);
  w.setInterval = (fn, ms) => { intervals.set(++id, { fn, ms }); return id; };
  w.clearInterval = (i) => intervals.delete(i);
  Object.defineProperty(w.navigator, 'geolocation', { get() { throw new Error('the sound asked for a location'); } });
  if (stored !== undefined) w.localStorage.setItem('olae-farm-sound', stored);
  if (blocked) Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('Denied', 'SecurityError'); } });
  const audio = audioStub(w);
  scripts.forEach((s) => {
    if (!sky && s.includes('window.OLAE_SKY =')) return;
    w.eval(s);
  });
  const q = (s) => w.document.querySelector(s);
  const click = (s) => { const n = typeof s === 'string' ? q(s) : s; assert.ok(n, String(s)); n.click(); };
  const ctx = () => audio.contexts[0];
  const runTimers = () => { const all = [...timers.values()]; timers.clear(); all.forEach((fn) => fn()); };
  const hide = (hidden) => {
    Object.defineProperty(w.document, 'hidden', { value: hidden, configurable: true });
    w.document.dispatchEvent(new w.Event('visibilitychange'));
  };
  return { w, q, click, audio, ctx, runTimers, hide, intervals };
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
  assert.deepEqual(Object.keys(p.w.OLAE_FARM_ENGINE), ['hour', 'place'], 'the engine makes the hours and the places and nothing else: no creaks');
}

/* ---- turning it on: the iOS unlock, the hour named, the choice remembered ---- */
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

/* ---- indoors the hour comes through the walls; outside it is open ---- */
{
  const p = page({ hour: 19 });
  p.click('#begin');
  p.click('#farm-sound');
  const ctx = p.ctx();
  const wall = ctx.filters[0], bus = ctx.gains[1];
  assert.ok(wall.frequency.value > 10000, 'outdoors the wall lets everything through');
  const outside = bus.gain.value;

  ctx.currentTime = 5;
  p.click('[data-object="door"]');
  const shut = wall.frequency.last();
  assert.equal(shut[0], 'ramp');
  assert.ok(shut[1] <= 2500, 'indoors the hour is muffled');
  assert.ok(shut[2] - 5 >= 1 && shut[2] - 5 <= 2, 'over a second or so, not at once');
  assert.ok(bus.gain.value < outside, 'and quieter');

  const steps = wall.frequency.ramps.length;
  p.click('[data-object="kitchen"]');
  assert.equal(wall.frequency.ramps.length, steps, 'room to room, nothing changes');

  ctx.currentTime = 20;
  p.click('#back'); p.click('#back');
  assert.equal(p.q('#scene-name').textContent, 'THE VERANDA');
  const open = wall.frequency.last();
  assert.ok(open[1] > 10000, 'back outdoors the wall opens again');
  assert.equal(bus.gain.value, outside, 'at the outdoor level');

  p.click('[data-object="door"]');
  p.click('#leave');
  assert.ok(wall.frequency.last()[1] > 10000, 'leaving the house is heard from outside');
}

/* ---- the horses: heard only in the garden, the stable yard and the
   stable, and in the stable not through the walls ---- */
{
  const p = page({ hour: 13 });
  const E = p.w.OLAE_FARM_ENGINE, real = E.place, made = [];
  E.place = (...a) => { const s = real(...a); made.push({ name: a[3], sound: s }); return s; };
  p.click('#begin');
  p.click('#farm-sound');
  const ctx = p.ctx();
  const master = ctx.gains[0], wall = ctx.filters[0];
  assert.doesNotMatch(p.q('#farm-sound').title, /horse/i, 'midday is the wind; the horses belong to their places');
  assert.equal(made.length, 1);
  assert.deepEqual([made[0].name, made[0].sound], ['exterior', null], 'nothing of the horses on the veranda');
  const heard = (name) => made.some((m) => m.name === name && m.sound);

  ctx.currentTime = 5;
  p.click('[data-object="garden"]');
  const garden = made[made.length - 1].sound;
  assert.ok(garden, 'the garden hears them from afar');
  const gin = garden.out.gain.last();
  assert.deepEqual([gin[0], gin[1]], ['ramp', 1], 'coming in with a fade');
  assert.ok(gin[2] - 5 >= 1 && gin[2] - 5 <= 2, 'over a second or so');
  const close = garden.out.to[0];
  assert.ok(close !== wall && close.to[0] === master, "a place's own sound goes to the master beside the wall");

  ctx.currentTime = 10;
  p.click('[data-object="stable-path"]');
  const yard = made[made.length - 1];
  assert.equal(yard.name, 'stableYard');
  assert.ok(yard.sound, 'the stable yard hears them close by');
  assert.deepEqual(garden.out.gain.last().slice(0, 2), ['ramp', 0], 'and the garden fades as the yard comes in');

  p.click('[data-object="stable-door"]');
  const stable = made[made.length - 1];
  assert.equal(stable.name, 'stable');
  assert.ok(stable.sound, 'the stable has its horses');
  assert.ok(wall.frequency.last()[1] <= 2500, 'the hour is muffled in the stable');
  assert.equal(stable.sound.out.to[0], close, 'but the horses in it are not');
  let played = 0;
  const make = ctx.createBufferSource;
  ctx.createBufferSource = () => { played++; return make(); };
  stable.sound.tick(ctx.currentTime + 120);
  assert.ok(played >= 2, 'over two minutes the stable horses are heard more than once');

  p.click('#back'); p.click('#back'); p.click('#back');
  assert.equal(p.q('#scene-name').textContent, 'THE VERANDA');
  assert.deepEqual(stable.sound.out.gain.last().slice(0, 2), ['ramp', 0], 'leaving them, they fade');
  p.click('[data-object="door"]');
  p.click('[data-object="kitchen"]');
  p.click('#back');
  p.click('[data-object="stairs"]');
  for (const room of ['exterior', 'hall', 'kitchen', 'upstairs']) {
    assert.ok(made.some((m) => m.name === room), `${room} was visited`);
    assert.equal(heard(room), false, `no horses in ${room}`);
  }
}
{
  const p = page({ hour: 23 });
  p.click('#begin');
  p.click('[data-object="garden"]');
  p.click('[data-object="stable-path"]');
  const E = p.w.OLAE_FARM_ENGINE, real = E.place, made = [];
  E.place = (...a) => { const s = real(...a); made.push(s); return s; };
  p.click('#farm-sound');
  assert.equal(made.length, 1, 'sound turned on in the stable yard brings its horses');
  assert.ok(made[0], 'at night as well');
  assert.deepEqual(made[0].out.gain.last().slice(0, 2), ['set', 1], 'at once, riding in on the master fade');
  p.click('#farm-sound');
  p.runTimers();
  p.click('[data-object="stable-door"]');
  assert.equal(made.length, 1, 'with the sound off, walking on makes nothing');
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
  p.click('[data-object="door"]');
  assert.ok(p.ctx().filters[0].frequency.last()[1] <= 2500, 'and the hall is heard through its walls');
}
{
  const p = page({ hour: 19 });
  p.click('#begin');
  p.click('[data-object="door"]');
  p.click('#farm-sound');
  const wall = p.ctx().filters[0];
  assert.ok(wall.frequency.value <= 2500, 'sound turned on in a room starts muffled');
  assert.equal(wall.frequency.ramps.filter((r) => r[0] === 'ramp').length, 0, 'at once, with no sweep from outside');
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

console.log('Farm sound passed: off by default and remembered, fades in, out and across a hidden tab, the hour muffled indoors and open outside, the horses only near them, no creaks, and the part of the day from the sky or ?hour.');
