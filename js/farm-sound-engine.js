/* farm-sound-engine.js — the sounds of The Farm House, played by
   js/farm-sound.js. Pure synthesis, no DOM and no AudioContext of its own,
   the same arrangement as js/rain-engine.js: callers pass their context and
   the node to play into, and keep the toggle, the levels and the fades.
   Nothing is recorded and nothing is loaded; the wind is cut from
   rain-engine's pink noise buffer.

   Two kinds of sound live here.

   THE CREAK is one wooden creak, made fresh every time it is asked for:
   creak(ctx, out, when, kind, level). Everything that creaks goes through
   that one call, and what the creak is made of is decided by one line,
   `var creakSource = synthCreak;` below. To play a recording instead, put a
   short file in farm-house/assets/ and change that line to
     var creakSource = recordedCreak("/farm-house/assets/creak.m4a");
   Nothing else changes: the caller still asks for a creak, the recording is
   fetched once and played at a slightly different speed and level each
   time.

   THE HOURS are four quiet beds, one for each part of the day:
     morning   sparse birdsong
     midday    soft wind, and now and then a distant horse
     evening   crickets
     night     fewer crickets, slower, and a tree cricket
   hour(ctx, out, buffers, name) builds one and returns
   { out, tick(until), stop() }: `out` is the bed's own gain, made at 0 so
   the caller can fade it in; tick() schedules the bed's next events up to
   an audio time, and is called every fraction of a second by whoever plays
   it. */
(function(){
  "use strict";

  function rand(a, b){ return a + Math.random() * (b - a); }
  function pick(list){ return list[Math.floor(Math.random() * list.length)]; }
  function done(nodes){
    return function(){ nodes.forEach(function(n){ try{ n.disconnect(); }catch(e){} }); };
  }
  /* A pan where the browser has one; elsewhere the sound is simply central. */
  function place(ctx, node, out, pan){
    if(ctx.createStereoPanner){
      var p = ctx.createStereoPanner();
      p.pan.value = pan;
      node.connect(p); p.connect(out);
      return p;
    }
    node.connect(out);
    return null;
  }

  /* Buffers drawn here are made at a lower rate than the context's own:
     nothing in them is above six kilohertz, and half the samples is half
     the work on a phone. The context resamples them as they play. */
  var SR = 22050;

  /* A two-pole resonator (the constant-peak band-pass from the Audio EQ
     Cookbook), run over a block of samples and added into `out`. */
  function resonate(src, out, f, q, gain){
    var w = 2 * Math.PI * f / SR, alpha = Math.sin(w) / (2 * q), a0 = 1 + alpha;
    var b0 = alpha / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - alpha) / a0;
    var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for(var i = 0; i < src.length; i++){
      var x = src[i];
      var y = b0 * (x - x2) - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      out[i] += y * gain;
    }
  }
  function peakOf(data){
    var p = 0;
    for(var i = 0; i < data.length; i++){ var a = Math.abs(data[i]); if(a > p) p = a; }
    return p;
  }
  function toBuffer(ctx, data){
    var buf = ctx.createBuffer(1, data.length, SR);
    buf.getChannelData(0).set(data);
    return buf;
  }

  /* ================= THE CREAK =================
     Wood creaks by stick-slip: two surfaces catch and let go many times a
     second, and each release knocks the board into ringing. So a creak here
     is a train of small, irregular knocks, rung through a handful of the
     board's resonances. The rate of the train is what the ear hears as the
     creak's pitch; its unevenness is the grain. Every creak draws its own
     rate and contour, length, roughness and wood, so no two are alike.

     'step' is a foot coming down on an old floorboard: a soft low knock,
     then a short creak as the board takes the weight. 'settle' is the
     house on its own: a groan, a slow tick, or a thinner squeak, sometimes
     broken into pieces. */
  var CONTOURS = [
    function(x){ return x; },
    function(x){ return x * x; },
    function(x){ return 1 - (1 - x) * (1 - x); },
    function(x){ return Math.sin(Math.PI * x); }
  ];
  function synthCreak(ctx, kind){
    var step = kind === "step";
    var voice = step ? "groan" : pick(["groan", "groan", "tick", "tick", "squeak"]);
    var dur = step ? rand(0.22, 0.5)
            : voice === "tick" ? rand(0.5, 1.3)
            : voice === "squeak" ? rand(0.25, 0.6)
            : rand(0.4, 1.1);
    var rate0 = voice === "tick" ? rand(9, 22) : voice === "squeak" ? rand(85, 150) : rand(28, 75);
    var rate1 = rate0 * rand(0.6, 1.7);
    var contour = pick(CONTOURS);
    var jitter = voice === "tick" ? 0.35 : rand(0.08, 0.22);
    var wobHz = rand(2, 6), wobDepth = rand(0, 0.15);
    var attack = rand(0.03, 0.12), release = rand(0.08, 0.25);
    /* the foot lands a moment before the board answers it */
    var lead = step ? rand(0.02, 0.06) : 0;
    var len = Math.ceil((lead + dur + 0.3) * SR);
    var knocks = new Float32Array(len);

    /* a broken creak lets go for a few hundredths of a second, once or twice */
    var gaps = [];
    if(voice === "groan" && !step && Math.random() < 0.4){
      for(var g = 1 + Math.floor(Math.random() * 2); g > 0; g--){
        var at = rand(0.2, 0.75) * dur;
        gaps.push([at, at + rand(0.03, 0.09)]);
      }
    }
    function inGap(t){
      for(var i = 0; i < gaps.length; i++){ if(t > gaps[i][0] && t < gaps[i][1]) return true; }
      return false;
    }

    var t = rand(0, 0.01);
    while(t < dur){
      var x = t / dur;
      var env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
      var rate = (rate0 + (rate1 - rate0) * contour(x)) * (1 + wobDepth * Math.sin(2 * Math.PI * wobHz * t));
      if(!inGap(t)){
        var amp = env * rand(0.5, 1);
        var i0 = Math.floor((lead + t) * SR);
        knocks[i0] += amp;
        /* a few samples of friction after each release */
        var scratch = 4 + Math.floor(Math.random() * 10);
        for(var k = 1; k < scratch && i0 + k < len; k++){
          knocks[i0 + k] += amp * 0.35 * (Math.random() * 2 - 1) * (1 - k / scratch);
        }
      }
      t += (1 / Math.max(rate, 4)) * (1 + jitter * (Math.random() * 2 - 1));
    }

    /* the board: a low body and three higher modes, none of them harmonic */
    var base = voice === "squeak" ? rand(480, 820) : step ? rand(150, 280) : rand(190, 420);
    var out = new Float32Array(len);
    resonate(knocks, out, base, rand(7, 13), 1);
    resonate(knocks, out, base * rand(2.1, 2.7), rand(9, 16), 0.7);
    resonate(knocks, out, base * rand(3.6, 4.6), rand(10, 18), 0.45);
    resonate(knocks, out, base * rand(5.8, 7.5), rand(10, 18), 0.25);

    /* soften the top: old wood, heard across a room */
    var a = 1 - Math.exp(-2 * Math.PI * rand(2800, 4200) / SR), y = 0, i;
    for(i = 0; i < len; i++){ y += a * (out[i] - y); out[i] = y; }
    var p = peakOf(out) || 1;
    for(i = 0; i < len; i++) out[i] /= p;

    /* the foot itself: a short, damped knock low in the floor */
    if(step){
      var f = rand(70, 120), tau = rand(0.03, 0.06), thud = rand(0.45, 0.7);
      var n = Math.min(len, Math.ceil(tau * 6 * SR));
      for(i = 0; i < n; i++){
        var s = i / SR;
        out[i] += thud * Math.min(1, s / 0.003) * Math.exp(-s / tau) * Math.sin(2 * Math.PI * f * s);
      }
      p = peakOf(out);
      if(p > 1) for(i = 0; i < len; i++) out[i] /= p;
    }
    return toBuffer(ctx, out);
  }

  /* A recorded creak, for the day there is one: a short file, fetched and
     decoded once. Until it has arrived a creak asked for is not heard. */
  function recordedCreak(url){
    var buffer = null, asked = false;
    function load(ctx){
      if(asked) return;
      asked = true;
      fetch(url).then(function(r){ return r.arrayBuffer(); }).then(function(data){
        return new Promise(function(ok, fail){ ctx.decodeAudioData(data, ok, fail); });
      }).then(function(b){ buffer = b; }, function(){});
    }
    function source(ctx){ load(ctx); return buffer; }
    source.warm = load;
    return source;
  }

  /* THE ONE LINE. Whatever makes the creak is chosen here; see the top. */
  var creakSource = synthCreak;

  /* Fetch anything the creak needs before the first one is asked for. */
  function warm(ctx){ if(creakSource.warm) creakSource.warm(ctx); }

  /* Play a creak at `when`, a little to one side, at about `level`. The
     speed varies by a few per cent each time, which is what keeps a
     recording from sounding like the same board twice. */
  function creak(ctx, out, when, kind, level){
    var buf = creakSource(ctx, kind);
    if(!buf) return;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rand(0.9, 1.1);
    var g = ctx.createGain();
    g.gain.value = level * rand(0.7, 1);
    src.connect(g);
    var p = place(ctx, g, out, rand(-0.35, 0.35));
    src.onended = done([src, g, p].filter(Boolean));
    src.start(when);
  }

  /* ================= THE HOURS ================= */

  /* ---- birds: three of them, at different distances and on different
     sides, each keeping to its own kind of phrase and its own pitch, so
     the morning sounds like neighbours rather than a random chirping. They
     are not any one species; nothing on the page names them. ---- */
  var PHRASES = {
    /* two to four clear notes, each sliding a little */
    whistle: function(p){
      var notes = [], at = 0;
      for(var n = 2 + Math.floor(Math.random() * 3); n > 0; n--){
        var d = rand(0.12, 0.32), f = rand(2000, 3200) * p;
        notes.push([at, d, f, f * rand(0.85, 1.2), rand(0.6, 1)]);
        at += d + rand(0.06, 0.16);
      }
      return { notes: notes };
    },
    /* short falling chips */
    chip: function(p){
      var notes = [], at = 0;
      for(var n = 2 + Math.floor(Math.random() * 4); n > 0; n--){
        var d = rand(0.025, 0.05), f = rand(5000, 6500) * p;
        notes.push([at, d, f, f * rand(0.55, 0.7), rand(0.5, 0.9)]);
        at += d + rand(0.07, 0.16);
      }
      return { notes: notes };
    },
    /* one fast trill */
    trill: function(p){
      var d = rand(0.45, 1), f = rand(3800, 5200) * p;
      return { notes: [[0, d, f, f * rand(0.9, 1.05), rand(0.5, 0.8)]],
               shake: [rand(18, 28), f * rand(0.06, 0.12)] };
    },
    /* a quick run of linked notes */
    warble: function(p){
      var notes = [], at = 0, f = rand(2600, 4800) * p;
      for(var n = 5 + Math.floor(Math.random() * 5); n > 0; n--){
        var d = rand(0.05, 0.09), next = rand(2600, 4800) * p;
        notes.push([at, d, f, next, rand(0.4, 0.9)]);
        at += d + rand(0.01, 0.04);
        f = next;
      }
      return { notes: notes };
    }
  };
  function phrase(ctx, out, t, shape){
    var o = ctx.createOscillator(), g = ctx.createGain(), nodes = [o, g];
    o.type = "sine";
    g.gain.value = 0;
    o.connect(g); g.connect(out);
    shape.notes.forEach(function(n){
      var s = t + n[0], d = n[1];
      o.frequency.setValueAtTime(n[2], s);
      o.frequency.exponentialRampToValueAtTime(n[3], s + d);
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(n[4], s + Math.min(0.012, d * 0.3));
      g.gain.linearRampToValueAtTime(n[4] * 0.6, s + d * 0.75);
      g.gain.linearRampToValueAtTime(0, s + d);
    });
    var last = shape.notes[shape.notes.length - 1], end = t + last[0] + last[1];
    if(shape.shake){
      var lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = shape.shake[0];
      depth.gain.value = shape.shake[1];
      lfo.connect(depth); depth.connect(o.frequency);
      lfo.start(t); lfo.stop(end + 0.02);
      nodes.push(lfo, depth);
    }
    o.onended = done(nodes);
    o.start(t); o.stop(end + 0.02);
    return end - t;
  }
  function birds(ctx, out){
    var kinds = Object.keys(PHRASES).sort(function(){ return Math.random() - 0.5; });
    var singers = [0, 1, 2].map(function(i){
      var g = ctx.createGain();
      g.gain.value = [1, 0.55, 0.3][i] * 0.5;
      return { kind: kinds[i], pitch: rand(0.88, 1.15), gain: g,
               pan: place(ctx, g, out, rand(-0.8, 0.8)),
               next: ctx.currentTime + rand(0.5, 6) };
    });
    return {
      tick: function(until){
        singers.forEach(function(s){
          while(s.next < until){
            var length = phrase(ctx, s.gain, s.next, PHRASES[s.kind](s.pitch));
            s.next += length + rand(3.5, 12);
          }
        });
      },
      stop: function(){
        singers.forEach(function(s){ done([s.gain, s.pan].filter(Boolean))(); });
      }
    };
  }

  /* ---- wind: pink noise in a low band, swelled by two slow waves whose
     sum does not repeat within a visit, and the same noise higher up for
     the leaves, which answer the gusts more than the air does ---- */
  function wind(ctx, out, buffers){
    var air = ctx.createBufferSource();
    air.buffer = buffers.pink; air.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 140; hp.Q.value = -3;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 650; lp.Q.value = -3;
    var body = ctx.createGain(); body.gain.value = 0.55;
    air.connect(hp); hp.connect(lp); lp.connect(body); body.connect(out);

    var rustle = ctx.createBufferSource();
    rustle.buffer = buffers.pink; rustle.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 0.8;
    var leaves = ctx.createGain(); leaves.gain.value = 0.09;
    rustle.connect(bp); bp.connect(leaves); leaves.connect(out);

    var slow = ctx.createOscillator(); slow.frequency.value = rand(0.04, 0.06);
    var quick = ctx.createOscillator(); quick.frequency.value = rand(0.09, 0.13);
    var links = [
      [slow, body.gain, 0.22], [quick, body.gain, 0.14], [slow, lp.frequency, 260],
      [slow, leaves.gain, 0.05], [quick, leaves.gain, 0.03]
    ].map(function(l){
      var d = ctx.createGain(); d.gain.value = l[2];
      l[0].connect(d); d.connect(l[1]);
      return d;
    });
    air.start(0, rand(0, 11)); rustle.start(0, rand(0, 11));
    slow.start(); quick.start();
    return {
      stop: function(){
        [air, rustle, slow, quick].forEach(function(n){ try{ n.stop(); }catch(e){} });
        done([air, hp, lp, body, rustle, bp, leaves, slow, quick].concat(links))();
      }
    };
  }

  /* ---- a distant horse: a whinny across the field every minute or two.
     A whinny carries two voices at once, a lower one near 400 Hz and a
     whistle near 1.5 kHz, both shaken harder towards the end (Briefer et
     al., Scientific Reports, 2015). Heard from far off, the top is gone. */
  function whinny(ctx, out, t){
    var dur = rand(1.1, 1.6), end = t + dur;
    var low = ctx.createOscillator(), high = ctx.createOscillator();
    low.type = "sawtooth"; high.type = "sine";
    var f0 = rand(420, 560), g0 = rand(1400, 1700);
    low.frequency.setValueAtTime(f0, t);
    low.frequency.linearRampToValueAtTime(f0 * rand(1.15, 1.3), t + 0.12);
    low.frequency.exponentialRampToValueAtTime(rand(260, 330), end);
    high.frequency.setValueAtTime(g0, t);
    high.frequency.linearRampToValueAtTime(g0 * 1.12, t + 0.15);
    high.frequency.exponentialRampToValueAtTime(rand(900, 1150), end);

    /* the shake: about ten times a second, deepening as the call falls */
    var shake = ctx.createOscillator(); shake.frequency.value = rand(8.5, 11.5);
    var lowShake = ctx.createGain(), highShake = ctx.createGain(), ampShake = ctx.createGain();
    lowShake.gain.setValueAtTime(f0 * 0.02, t); lowShake.gain.linearRampToValueAtTime(40, end);
    highShake.gain.setValueAtTime(30, t); highShake.gain.linearRampToValueAtTime(120, end);
    ampShake.gain.setValueAtTime(0, t); ampShake.gain.linearRampToValueAtTime(0.35, end);
    shake.connect(lowShake); lowShake.connect(low.frequency);
    shake.connect(highShake); highShake.connect(high.frequency);

    var lowTone = ctx.createBiquadFilter(); lowTone.type = "lowpass"; lowTone.frequency.value = 1800;
    var lowMix = ctx.createGain(); lowMix.gain.value = 0.5;
    var highMix = ctx.createGain(); highMix.gain.value = 0.2;
    var pulse = ctx.createGain(); pulse.gain.value = 0.65;
    shake.connect(ampShake); ampShake.connect(pulse.gain);
    var env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 0.06);
    env.gain.linearRampToValueAtTime(0.8, t + dur * 0.6);
    env.gain.linearRampToValueAtTime(0, end);
    var far = ctx.createBiquadFilter(); far.type = "lowpass"; far.frequency.value = rand(1300, 1700); far.Q.value = -3;
    var level = ctx.createGain(); level.gain.value = rand(0.3, 0.45);
    low.connect(lowTone); lowTone.connect(lowMix); lowMix.connect(pulse);
    high.connect(highMix); highMix.connect(pulse);
    pulse.connect(env); env.connect(far); far.connect(level);
    var pan = place(ctx, level, out, pick([-1, 1]) * rand(0.4, 0.8));
    low.onended = done([low, high, shake, lowShake, highShake, ampShake, lowTone, lowMix,
                        highMix, pulse, env, far, level, pan].filter(Boolean));
    [low, high, shake].forEach(function(o){ o.start(t); o.stop(end + 0.05); });
  }
  function horse(ctx, out){
    var next = ctx.currentTime + rand(12, 35);
    return {
      tick: function(until){
        while(next < until){
          whinny(ctx, out, next);
          next += rand(50, 120);
        }
      },
      stop: function(){}
    };
  }

  /* ---- crickets. A field cricket's chirp is three to five pulses of about
     20 ms near 4.7 kHz, some thirty pulses a second, two to four chirps a
     second (Hedwig, J Comp Physiol A, 2006). Each voice draws its chirp
     once and repeats it with a little drift, rests now and then, and
     starts again. A tree cricket's trill sits lower, near 2.8 kHz, in
     phrases of a second or two. At night everything slows a little, as
     crickets do in the cool, and the bed is quieter. ---- */
  function chirpBuffer(ctx, fc, pulses, pulseLen, period){
    var len = Math.ceil((pulses * period + 0.02) * SR), data = new Float32Array(len), phase = 0;
    for(var n = 0; n < pulses; n++){
      var start = Math.floor(n * period * SR), count = Math.floor(pulseLen * SR);
      var peak = n === 0 ? 0.7 : 1;
      for(var i = 0; i < count && start + i < len; i++){
        var x = i / count;
        /* each pulse falls slightly in pitch and swells then fades */
        phase += 2 * Math.PI * fc * (1 - 0.03 * x) / SR;
        var env = x < 0.3 ? Math.sin(Math.PI * x / 0.6) : Math.cos(Math.PI * (x - 0.3) / 1.4);
        data[start + i] = peak * env * env * Math.sin(phase);
      }
    }
    return toBuffer(ctx, data);
  }
  function trillBuffer(ctx, fc, length, rate){
    var len = Math.ceil(length * SR), data = new Float32Array(len);
    for(var i = 0; i < len; i++){
      var s = i / SR, beat = (s * rate) % 1;
      var edge = Math.min(1, s / 0.12, (length - s) / 0.2);
      var pulse = beat < 0.55 ? Math.sin(Math.PI * beat / 0.55) : 0;
      data[i] = edge * pulse * Math.sin(2 * Math.PI * fc * s);
    }
    return toBuffer(ctx, data);
  }
  function crickets(ctx, out, night){
    var slow = night ? 1.3 : 1;
    var levels = night ? [0.3, 0.15] : [0.35, 0.2, 0.11];
    var voices = levels.map(function(level){
      var g = ctx.createGain(); g.gain.value = level;
      return {
        buffer: chirpBuffer(ctx, rand(4400, 4900), pick([3, 4, 4, 5]), rand(0.016, 0.021), rand(0.031, 0.036) * slow),
        gain: g, pan: place(ctx, g, out, rand(-0.8, 0.8)),
        every: rand(0.32, 0.45) * slow, next: ctx.currentTime + rand(0, 1.5),
        left: 15 + Math.floor(Math.random() * 55)
      };
    });
    var treeGain = ctx.createGain(); treeGain.gain.value = night ? 0.14 : 0.08;
    var tree = { buffer: trillBuffer(ctx, rand(2600, 3000), rand(1.2, 2.2), rand(38, 48) / slow),
                 gain: treeGain, pan: place(ctx, treeGain, out, rand(-0.6, 0.6)),
                 next: ctx.currentTime + rand(1, 4) };
    function play(v, when){
      var src = ctx.createBufferSource();
      src.buffer = v.buffer;
      src.playbackRate.value = rand(0.995, 1.005);
      src.connect(v.gain);
      src.onended = done([src]);
      src.start(when);
    }
    return {
      tick: function(until){
        voices.forEach(function(v){
          while(v.next < until){
            play(v, v.next);
            v.next += v.every * rand(0.96, 1.04);
            if(--v.left <= 0){
              v.next += rand(1.5, 7);
              v.left = 15 + Math.floor(Math.random() * 55);
            }
          }
        });
        while(tree.next < until){
          play(tree, tree.next);
          tree.next += tree.buffer.duration + rand(0.5, 1.6);
        }
      },
      stop: function(){
        voices.concat([tree]).forEach(function(v){ done([v.gain, v.pan].filter(Boolean))(); });
      }
    };
  }

  /* ---- one bed per part of the day ---- */
  function hour(ctx, out, buffers, name){
    if(name === "midday" && !buffers.pink) buffers.pink = window.OLAE_RAIN.makeNoiseBuffer(ctx, "pink");
    var bed = ctx.createGain();
    bed.gain.value = 0;
    bed.connect(out);
    var parts = name === "morning" ? [birds(ctx, bed)]
              : name === "midday" ? [wind(ctx, bed, buffers), horse(ctx, bed)]
              : [crickets(ctx, bed, name === "night")];
    return {
      out: bed,
      tick: function(until){ parts.forEach(function(p){ if(p.tick) p.tick(until); }); },
      stop: function(){
        parts.forEach(function(p){ p.stop(); });
        try{ bed.disconnect(); }catch(e){}
      }
    };
  }

  window.OLAE_FARM_ENGINE = { creak: creak, warm: warm, hour: hour };
})();
