/* The balcony, heard. Runs js/balcony-sound-engine.js and js/house-sound.js
   on the built House against a Web Audio stub that remembers what was
   scheduled: off until asked and remembered after, the button under the
   balcony's picture for as long as the reader is out there, İstanbul's
   hour, month and temperature choosing the voices, the rain louder with
   the glass open than through it, quiet in the study, snow hushing the
   rest, fades rather than cuts, a hidden tab, a first touch before any
   audio, and storage that cannot be reached. js/house.js tells it where
   the reader is; scripts/test-house.cjs checks that side. Only listening
   can check the sound itself. Run `bundle exec jekyll build` first;
   node scripts/test-house-sound.cjs */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const built = path.join(root, '_site', 'house', 'index.html');
if (!fs.existsSync(built)) {
  console.error('test-house-sound: run `bundle exec jekyll build` first');
  process.exit(1);
}
const html = fs.readFileSync(built, 'utf8');
const read = (file) => fs.readFileSync(path.join(root, 'js', file), 'utf8');
const sources = { rain: read('rain-engine.js'), engine: read('balcony-sound-engine.js'), sound: read('house-sound.js') };

/* The page loads the rain, the voices and the sound before the House,
   which tells the sound where the reader is as soon as it runs. */
const order = [...html.matchAll(/<script src="\/js\/([^"?]+)/g)].map((m) => m[1]);
for (const [a, b] of [['rain-engine.js', 'balcony-sound-engine.js'], ['balcony-sound-engine.js', 'house-sound.js'], ['house-sound.js', 'house.js']]) {
  assert.ok(order.indexOf(a) !== -1 && order.indexOf(a) < order.indexOf(b), a + ' loads before ' + b);
}
const listen = new JSDOM(html).window.document.getElementById('house-listen');
assert.ok(listen.closest('#balcony .house-room-footer'), 'the button stands under the balcony’s picture, beside the way back');
assert.equal(listen.textContent.trim(), 'Listen outside');
assert.equal(listen.hidden, true, 'and waits hidden until the reader is out there');

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
  function node(extra) {
    return Object.assign({ to: [], connect(d) { this.to.push(d); return d; }, disconnect() {}, start() {}, stop() { this.stopped = true; } }, extra);
  }
  w.AudioContext = function () {
    const ctx = this;
    log.contexts.push(ctx);
    this.sampleRate = 8000; this.currentTime = 0; this.state = 'suspended';
    this.destination = node({});
    this.resume = () => { ctx.state = 'running'; return Promise.resolve(); };
    this.suspend = () => { ctx.state = 'suspended'; return Promise.resolve(); };
    /* every gain, filter and source is kept, in the order made: the page
       makes its master, the glass, the pane, the world and the rain's own
       gain first */
    this.gains = []; this.filters = []; this.sources = [];
    this.createGain = () => { const g = node({ gain: param(1) }); ctx.gains.push(g); return g; };
    this.createBiquadFilter = () => { const f = node({ type: '', frequency: param(350), Q: param(1) }); ctx.filters.push(f); return f; };
    this.createOscillator = () => node({ type: 'sine', frequency: param(440) });
    this.createBufferSource = () => { const s = node({ buffer: null, loop: false, onended: null, playbackRate: param(1) }); ctx.sources.push(s); return s; };
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

/* An evening in İstanbul in mid-October, dry and mild, the glass folded away. */
const OCTOBER_EVENING = { outside: true, glass: 'open', weather: null, level: 0, period: 'evening', hour: 19, month: 10, temp: 17 };

function page({ stored, blocked = false, audio = true } = {}) {
  const dom = new JSDOM(html, { url: 'https://hakanaltun.io/house/#balcony', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  const timers = new Map(), intervals = new Map();
  let id = 0;
  w.setTimeout = (fn) => { timers.set(++id, fn); return id; };
  w.clearTimeout = (i) => timers.delete(i);
  w.setInterval = (fn, ms) => { intervals.set(++id, { fn, ms }); return id; };
  w.clearInterval = (i) => intervals.delete(i);
  if (stored !== undefined) w.localStorage.setItem('olae-balcony-sound', stored);
  if (blocked) Object.defineProperty(w, 'localStorage', { get() { throw new w.DOMException('Denied', 'SecurityError'); } });
  const log = audio ? audioStub(w) : null;
  w.eval(sources.rain);
  /* Each rain made, and whether it has been let go. */
  const rains = [];
  const build = w.OLAE_RAIN.buildRain;
  w.OLAE_RAIN.buildRain = (ctx, out, buffers, options) => {
    const r = build(ctx, out, buffers, options), entry = { level: options.intensity, stopped: false };
    rains.push(entry);
    const setIntensity = r.setIntensity, stop = r.stop;
    r.setIntensity = (level, seconds) => { entry.level = level; setIntensity(level, seconds); };
    r.stop = () => { entry.stopped = true; stop(); };
    return r;
  };
  w.eval(sources.engine);
  /* Which voices are playing, with the options they were last given. */
  const playing = {};
  const engine = w.OLAE_BALCONY_ENGINE;
  for (const name of Object.keys(engine)) {
    const real = engine[name];
    engine[name] = (ctx, out, buffers, options) => {
      const v = real(ctx, out, buffers, options);
      const entry = playing[name] = { options: { ...options }, out: v.out };
      const set = v.set, stop = v.stop;
      v.set = (o) => { entry.options = { ...o }; set(o); };
      v.stop = () => { if (playing[name] === entry) delete playing[name]; stop(); };
      return v;
    };
  }
  w.eval(sources.sound);
  const q = (s) => w.document.querySelector(s);
  const btn = q('#house-listen');
  const ctx = () => log.contexts[0];
  const master = () => ctx().gains[0];
  const pane = () => ctx().gains[1];
  const world = () => ctx().gains[2];
  const rainGain = () => ctx().gains[3];
  const glass = () => ctx().filters[0];
  let where = { ...OCTOBER_EVENING };
  const update = (change) => { where = { ...where, ...change }; w.OLAE_HOUSE_SOUND.update(where); };
  const runTimers = () => { const all = [...timers.values()]; timers.clear(); all.forEach((fn) => fn()); };
  // A change, and the voices that fade out with it let go.
  const become = (change) => { update(change); runTimers(); };
  const tick = () => [...intervals.values()].forEach((t) => t.fn());
  const hide = (hidden) => {
    Object.defineProperty(w.document, 'hidden', { value: hidden, configurable: true });
    w.document.dispatchEvent(new w.Event('visibilitychange'));
  };
  const touch = () => w.document.querySelector('#balcony h2').click();
  const voices = () => Object.keys(playing).sort();
  return { dom, w, q, btn, log, ctx, master, pane, world, rainGain, glass, update, become, runTimers, tick, hide, touch, playing, voices, rains };
}
const label = (p) => p.btn.textContent.trim();
const to = (param) => param.last().slice(0, 2);

/* ---- off by default; the button for as long as the reader is out there ---- */
{
  const p = page();
  assert.equal(p.btn.hidden, true, 'nothing is offered before the reader is out');
  p.update({ outside: false });
  assert.equal(p.btn.hidden, true, 'nothing is heard in the study');
  p.update({ outside: true });
  assert.equal(p.btn.hidden, false, 'out on the balcony the button is there');
  assert.equal(label(p), 'Listen outside');
  assert.equal(p.btn.getAttribute('aria-pressed'), 'false');
  p.update({ weather: 'rain', level: 1 });
  assert.equal(label(p), 'Listen outside', 'rain or not, the same words');
  p.touch();
  assert.equal(p.log.contexts.length, 0, 'nothing is made until the reader asks');
  assert.equal(p.w.localStorage.getItem('olae-balcony-sound'), null, 'nor stored');
  p.dom.window.close();
}

/* ---- turned on: İstanbul's hour and month choose what is heard ---- */
{
  const p = page();
  p.update({});
  p.btn.click();
  assert.equal(p.ctx().state, 'running', 'the click starts the audio');
  assert.equal(p.log.silentPlays, 1, 'with the iOS unlock');
  assert.equal(p.w.localStorage.getItem('olae-balcony-sound'), 'on', 'the choice is remembered');
  assert.equal(label(p), 'Stop the sound');
  assert.equal(p.btn.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(to(p.master().gain), ['ramp', 1], 'it fades in');
  assert.equal(p.master().gain.last()[2], 1.5, 'over a second and a half');
  // An October evening, mild and dry: the air, a few birds before dark,
  // the gulls, tree crickets and the ferries.
  assert.deepEqual(p.voices(), ['air', 'birds', 'ferry', 'gulls', 'treeCrickets']);
  assert.equal(p.playing.treeCrickets.options.temp, 17, 'the insects know İstanbul’s temperature');
  assert.ok(p.playing.birds.options.busy < 0.3, 'autumn evening birds are few');
  assert.equal(p.world().gain.value, 0.22, 'the world at its level');
  assert.equal(p.rainGain().gain.value, 0, 'no rain');
  assert.equal(p.pane().gain.value, 1, 'the glass is folded away');
  assert.equal(p.glass().frequency.value, 18000);
  // Night: the birds stop, the gulls are rarer, and it is quieter.
  p.update({ period: 'night', hour: 23 });
  assert.deepEqual(to(p.playing.birds.out.gain), ['ramp', 0], 'the birds fade out');
  assert.deepEqual(to(p.world().gain), ['ramp', 0.22 * 0.65]);
  assert.equal(p.world().gain.last()[2], 4, 'changes come over a few seconds');
  p.runTimers();
  assert.deepEqual(p.voices(), ['air', 'ferry', 'gulls', 'treeCrickets']);
  assert.equal(p.playing.gulls.options.busy, 0.25);
  // The last ferry has gone by one; the tree crickets stop before three.
  p.become({ hour: 1 });
  assert.deepEqual(p.voices(), ['air', 'gulls', 'treeCrickets']);
  p.become({ hour: 4 });
  assert.deepEqual(p.voices(), ['air', 'gulls']);
  // A cold night: no insects.
  p.become({ hour: 23, temp: 12 });
  assert.deepEqual(p.voices(), ['air', 'ferry', 'gulls']);
  // A spring morning: the birds at their busiest, no insects.
  p.become({ period: 'morning', hour: 8, month: 4, temp: 14 });
  assert.equal(p.playing.birds.options.busy, 1);
  assert.deepEqual(p.voices(), ['air', 'birds', 'ferry', 'gulls']);
  // Late summer is quiet for birds.
  p.become({ month: 8 });
  assert.equal(p.playing.birds.options.busy, 0.35);
  // Field crickets on a warm June evening, tree crickets from July.
  p.become({ period: 'evening', hour: 20, month: 6, temp: 22 });
  assert.deepEqual(p.voices(), ['air', 'birds', 'crickets', 'ferry', 'gulls']);
  p.become({ month: 7 });
  assert.deepEqual(p.voices(), ['air', 'birds', 'crickets', 'ferry', 'gulls', 'treeCrickets']);
  // Without İstanbul's temperature the months decide.
  p.become({ month: 9, temp: null });
  assert.deepEqual(p.voices(), ['air', 'birds', 'ferry', 'gulls', 'treeCrickets']);
  assert.equal(p.playing.treeCrickets.options.temp, null);
  // No ferry before seven in the morning.
  p.become({ period: 'morning', hour: 6 });
  assert.ok(!p.playing.ferry);
  p.dom.window.close();
}

/* ---- the rain, through the glass or not, and the snow ---- */
{
  const p = page();
  p.update({});
  p.btn.click();
  p.become({ weather: 'rain', level: 1 });
  assert.deepEqual(to(p.rainGain().gain), ['ramp', 0.13], 'light rain at the essays’ reading level');
  assert.deepEqual(p.rains.map((r) => [r.level, r.stopped]), [[1, false]], 'the essays’ rain is playing');
  assert.ok(!p.playing.treeCrickets, 'the insects fall quiet in the rain');
  assert.ok(p.playing.birds.options.busy < 0.1, 'and the birds nearly so');
  p.update({ level: 2 });
  assert.deepEqual(to(p.rainGain().gain), ['ramp', 0.19], 'heavy rain is a little louder');
  p.update({ glass: 'closed' });
  assert.deepEqual(p.rains.map((r) => [r.level, r.stopped]), [[2, false]], 'the same rain goes on, heavier');
  assert.deepEqual(to(p.pane().gain), ['ramp', 0.5], 'through the closed glass it is quieter');
  assert.deepEqual(to(p.glass().frequency), ['ramp', 1500], 'and loses its top');
  p.update({ glass: 'open' });
  assert.deepEqual(to(p.pane().gain), ['ramp', 1], 'the glass folded away again');
  // Snow falls without a sound and hushes the rest.
  p.become({ weather: 'snow', level: 1 });
  assert.deepEqual(to(p.rainGain().gain), ['ramp', 0]);
  assert.equal(p.rains[0].stopped, true, 'the rain is let go once it has faded');
  assert.deepEqual(to(p.world().gain), ['ramp', 0.22 * 0.6]);
  assert.ok(!p.playing.treeCrickets);
  p.dom.window.close();
}

/* ---- the study, a hidden tab, and stopping it ---- */
{
  const p = page();
  p.update({});
  p.btn.click();
  p.update({ outside: false });
  assert.equal(p.btn.hidden, true);
  assert.deepEqual(to(p.master().gain), ['ramp', 0], 'in the study it fades');
  p.runTimers();
  assert.equal(p.ctx().state, 'suspended', 'and the audio rests');
  assert.ok(p.voices().length, 'what was playing waits for the reader');
  assert.equal(p.w.localStorage.getItem('olae-balcony-sound'), 'on', 'the choice stays');
  p.update({ outside: true });
  assert.equal(p.ctx().state, 'running', 'back out, it is heard again');
  assert.deepEqual(to(p.master().gain), ['ramp', 1]);

  p.hide(true);
  assert.deepEqual(to(p.master().gain), ['ramp', 0], 'a hidden tab fades out');
  assert.equal(p.master().gain.last()[2], 1);
  p.runTimers();
  assert.equal(p.ctx().state, 'suspended');
  p.hide(false);
  assert.equal(p.ctx().state, 'running', 'and returns with the tab');

  p.btn.click();
  assert.equal(label(p), 'Listen outside');
  assert.equal(p.btn.hidden, false, 'the button stays while the reader is out');
  assert.equal(p.w.localStorage.getItem('olae-balcony-sound'), 'off');
  assert.deepEqual(to(p.master().gain), ['ramp', 0]);
  p.runTimers();
  assert.equal(p.ctx().state, 'suspended');
  assert.deepEqual(p.voices(), [], 'turned off, the voices are let go');
  assert.ok(p.log.silentPauses > 0, 'and the iOS unlock too');
  p.update({ outside: false });
  p.update({ outside: true });
  assert.equal(p.ctx().state, 'suspended', 'it stays off when the reader comes out again');
  p.dom.window.close();
}

/* ---- remembered on: it waits for the first touch, as browsers require ---- */
{
  const p = page({ stored: 'on' });
  p.update({});
  assert.equal(label(p), 'Stop the sound', 'the remembered choice is shown, so it can be stopped');
  assert.equal(p.log.contexts.length, 0, 'but no audio is made before the reader does anything');
  p.touch();
  assert.equal(p.ctx().state, 'running', 'the first touch brings it in');
  p.dom.window.close();
}
{
  const p = page({ stored: 'on' });
  p.update({});
  p.btn.click();
  assert.equal(p.log.contexts.length, 0, 'the button first turns the remembered sound off without starting it');
  assert.equal(p.w.localStorage.getItem('olae-balcony-sound'), 'off');
  p.dom.window.close();
}
{
  // Out to the balcony after touching the page in the study.
  const p = page({ stored: 'on' });
  p.update({ outside: false });
  p.touch();
  assert.equal(p.log.contexts.length, 0, 'a touch in the study makes nothing');
  p.update({ outside: true });
  assert.equal(p.ctx().state, 'running', 'the balcony is heard as the reader steps out');
  p.dom.window.close();
}

/* ---- storage that cannot be reached, and no Web Audio ---- */
{
  const p = page({ blocked: true });
  p.update({});
  assert.equal(label(p), 'Listen outside', 'blocked storage starts off');
  p.btn.click();
  assert.equal(p.ctx().state, 'running', 'and the button still works');
  p.btn.click();
  assert.equal(label(p), 'Listen outside');
  p.dom.window.close();
}
{
  const p = page({ audio: false });
  assert.equal(p.w.OLAE_HOUSE_SOUND, undefined, 'without Web Audio there is no sound');
  assert.equal(p.btn.hidden, true, 'and no button');
  p.dom.window.close();
}

console.log('Balcony sound passed: off by default and remembered, the button under the balcony while the reader is there, İstanbul’s hour, month and temperature choosing the birds, gulls, insects and ferries, the rain louder with the glass open than through it, snow hushing the rest, silence in the study, fades, a hidden tab, a first touch before any audio, and blocked storage.');
