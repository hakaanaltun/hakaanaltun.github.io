/* farm-sound-engine.js — the sounds of The Farm House, played by
   js/farm-sound.js. Pure synthesis, no DOM and no AudioContext of its own,
   the same arrangement as js/rain-engine.js: callers pass their context and
   the node to play into, and keep the toggle, the levels and the fades.
   Nothing is recorded and nothing is loaded; the wind is cut from
   rain-engine's pink noise buffer.

   Four quiet beds live here, one for each part of the day:
     morning   sparse birdsong, and a collared dove
     midday    soft wind, cicadas in waves, the dove now and then
     evening   crickets
     night     fewer crickets, slower, a tree cricket, and a scops owl
   hour(ctx, out, buffers, name) builds one and returns
   { out, tick(until), stop() }: `out` is the bed's own gain, made at 0 so
   the caller can fade it in; tick() schedules the bed's next events up to
   an audio time, and is called every fraction of a second by whoever plays
   it.

   Some places also have a sound of their own, heard only there: the
   horses, in the garden from afar, in the stable yard and in the stable,
   and the bees in the garden by day. place(ctx, out, buffers, name, hour)
   builds it in the same shape, with setHour(name) besides, or returns
   null for a place without one. */
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
     nothing in them needs to reach ten kilohertz, and half the samples is
     half the work on a phone. The context resamples them as they play. */
  var SR = 22050;

  function toBuffer(ctx, data){
    var buf = ctx.createBuffer(1, data.length, SR);
    buf.getChannelData(0).set(data);
    return buf;
  }

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
     the leaves, which answer the gusts more than the air does. The whole
     of it sits under one level, kept low. ---- */
  function wind(ctx, out, buffers){
    var level = ctx.createGain(); level.gain.value = 0.6;
    level.connect(out);
    var air = ctx.createBufferSource();
    air.buffer = buffers.pink; air.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 140; hp.Q.value = -3;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 650; lp.Q.value = -3;
    var body = ctx.createGain(); body.gain.value = 0.55;
    air.connect(hp); hp.connect(lp); lp.connect(body); body.connect(level);

    var rustle = ctx.createBufferSource();
    rustle.buffer = buffers.pink; rustle.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 0.8;
    var leaves = ctx.createGain(); leaves.gain.value = 0.09;
    rustle.connect(bp); bp.connect(leaves); leaves.connect(level);

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
        done([air, hp, lp, body, rustle, bp, leaves, slow, quick, level].concat(links))();
      }
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

  /* A buffer that has been drawn is played the same way everywhere: once,
     at a time, into a node, a hair faster or slower than drawn. */
  function playBuffer(ctx, buffer, into, when, rate){
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate || 1;
    src.connect(into);
    src.onended = done([src]);
    src.start(when);
    return src;
  }
  function normalise(ctx, data){
    var peak = 0, i;
    for(i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    for(i = 0; i < data.length; i++) data[i] /= peak;
    return toBuffer(ctx, data);
  }

  /* ---- a scops owl, the night's one whistle. A male repeats a single
     soft note, about a quarter to a third of a second long and near
     1.3 kHz, up to some twenty-six times a minute, and each bird keeps
     its own pitch (Mikkola & Mikkola, Ornis Hungarica, 2015). He sings in
     long runs with rests between. A summer visitor: the farm is painted in
     summer, so he is there. ---- */
  function owlNote(ctx, f, length){
    var len = Math.ceil(length * SR), data = new Float32Array(len), phase = 0;
    for(var i = 0; i < len; i++){
      var s = i / SR, x = s / length;
      /* a slight rise into the note and a slighter fall out of it */
      var bend = x < 0.25 ? 0.94 + 0.24 * x : 1 - 0.04 * (x - 0.25);
      phase += 2 * Math.PI * f * bend / SR;
      var env = Math.min(1, s / 0.05, (length - s) / 0.09);
      data[i] = env * env * (1 - 0.25 * x) * (Math.sin(phase) + 0.07 * Math.sin(2 * phase) + 0.03 * (Math.random() * 2 - 1));
    }
    return normalise(ctx, data);
  }
  function owl(ctx, out){
    var g = ctx.createGain(); g.gain.value = 0.22;
    var pan = place(ctx, g, out, rand(-0.7, 0.7));
    var note = owlNote(ctx, rand(1200, 1450), rand(0.24, 0.34));
    var every = rand(2.3, 3.1), next = ctx.currentTime + rand(3, 12);
    var left = 20 + Math.floor(Math.random() * 60);
    return {
      tick: function(until){
        while(next < until){
          playBuffer(ctx, note, g, next, rand(0.995, 1.005));
          next += every * rand(0.96, 1.04);
          if(--left <= 0){
            next += rand(20, 90);
            left = 20 + Math.floor(Math.random() * 60);
          }
        }
      },
      stop: function(){ done([g, pan].filter(Boolean))(); }
    };
  }

  /* ---- a collared dove: three notes, the middle one long and stressed,
     each rising and then falling, all between about 400 and 650 Hz. A song
     repeats the phrase about twice in three seconds, several times over
     (Verboom & Heij, Juno memo 202003, 2020). It sings more in the
     morning; at midday less often. ---- */
  function cooBuffer(ctx, p){
    /* [start, length, low, high, end, loudness] for each note */
    var notes = [[0, 0.2, 470, 560, 500, 1], [0.3, 0.55, 500, 610, 520, 0.85], [0.95, 0.26, 520, 540, 430, 0.7]];
    var length = 1.25, len = Math.ceil(length * SR), data = new Float32Array(len), phase = 0;
    notes.forEach(function(n){
      var from = Math.floor(n[0] * SR), count = Math.floor(n[1] * SR);
      for(var i = 0; i < count && from + i < len; i++){
        var x = i / count, s = i / SR;
        var f = (x < 0.4 ? n[2] + (n[3] - n[2]) * x / 0.4 : n[3] + (n[4] - n[3]) * (x - 0.4) / 0.6) * p;
        phase += 2 * Math.PI * f / SR;
        var env = Math.min(1, s / 0.04, (n[1] - s) / 0.08);
        env = n[5] * Math.sin(Math.PI / 2 * Math.max(0, env));
        /* a little of the octave and the twelfth, so the hoot carries on a
           phone's small speaker as well */
        data[from + i] = env * (Math.sin(phase) + 0.3 * Math.sin(2 * phase) + 0.08 * Math.sin(3 * phase));
      }
    });
    return normalise(ctx, data);
  }
  function dove(ctx, out, often){
    var g = ctx.createGain(); g.gain.value = 0.2;
    var pan = place(ctx, g, out, rand(-0.8, 0.8));
    var coo = cooBuffer(ctx, rand(0.94, 1.06));
    var rest = often ? [25, 70] : [50, 140];
    var next = ctx.currentTime + rand(often ? 4 : 10, often ? 20 : 45);
    var left = 3 + Math.floor(Math.random() * 7);
    return {
      tick: function(until){
        while(next < until){
          playBuffer(ctx, coo, g, next, rand(0.99, 1.01));
          next += rand(1.45, 1.65);
          if(--left <= 0){
            next += rand(rest[0], rest[1]);
            left = 3 + Math.floor(Math.random() * 7);
          }
        }
      },
      stop: function(){ done([g, pan].filter(Boolean))(); }
    };
  }

  /* ---- cicadas in the olive trees at midday. The song here follows
     Cicada orni, a common cicada of Mediterranean olive groves: echemes of
     about 0.08 s, each a few groups of pulses, some five a second, peaking
     near 4.8 kHz, from males that sing through the hot hours of summer
     days, often in chorus (Pinto-Juma et al., Zoological Studies, 2005).
     Heard from a little way off, they come in waves. ---- */
  function cicadaBuffer(ctx, fc, length){
    var len = Math.ceil(length * SR), data = new Float32Array(len);
    var at = 0;
    while(at < length - 0.15){
      /* one echeme: a few groups of rapid clicks, each click a short ring
         at the body's pitch */
      var echeme = rand(0.06, 0.1), groups = 3 + Math.floor(Math.random() * 2);
      for(var k = 0; k < groups; k++){
        var gStart = at + k * echeme / groups;
        for(var c = 0; c < 6; c++){
          var start = Math.floor((gStart + c * 0.0028) * SR), amp = 1 - c * 0.08;
          for(var i = 0; i < 0.003 * SR && start + i < len; i++){
            var s = i / SR;
            data[start + i] += amp * Math.exp(-s / 0.0012) * (Math.sin(2 * Math.PI * fc * s) + 0.5 * (Math.random() * 2 - 1));
          }
        }
      }
      at += echeme + rand(0.1, 0.18);
    }
    return normalise(ctx, data);
  }
  function cicadas(ctx, out){
    var voices = [0, 1, 2].map(function(i){
      var g = ctx.createGain(); g.gain.value = [0.2, 0.14, 0.09][i];
      return { gain: g, pan: place(ctx, g, out, rand(-0.9, 0.9)),
               buffer: cicadaBuffer(ctx, rand(4400, 5200), rand(2.6, 3.4)),
               next: ctx.currentTime + rand(2, 25) };
    });
    function chorus(v, t){
      var length = rand(10, 30), rise = rand(1.5, 3), fall = rand(1, 2);
      var src = ctx.createBufferSource(), env = ctx.createGain();
      src.buffer = v.buffer; src.loop = true;
      src.playbackRate.value = rand(0.98, 1.02);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(1, t + rise);
      env.gain.setValueAtTime(1, t + length - fall);
      env.gain.linearRampToValueAtTime(0, t + length);
      src.connect(env); env.connect(v.gain);
      src.onended = done([src, env]);
      src.start(t, rand(0, v.buffer.duration)); src.stop(t + length + 0.05);
      return length;
    }
    return {
      tick: function(until){
        voices.forEach(function(v){
          while(v.next < until) v.next += chorus(v, v.next) + rand(10, 40);
        });
      },
      stop: function(){
        voices.forEach(function(v){ done([v.gain, v.pan].filter(Boolean))(); });
      }
    };
  }

  /* ---- bees in the garden, by day: one at a time crossing in front of
     the hydrangeas and the lavender, now and then a bumblebee. A honeybee
     beats its wings about 234 times a second (Clark et al., J Exp Biol,
     2017); a bumblebee's flight buzz is lower, near 140 Hz (Pritchard &
     Vallejo-Marín, J Exp Biol, 2020). As one passes, its tone rises a
     little on the way in and falls on the way out. ---- */
  function beePass(ctx, out, t){
    var bumble = Math.random() < 0.25;
    var f = bumble ? rand(135, 170) : rand(220, 250), length = rand(1.6, 4);
    var mid = t + length * rand(0.35, 0.65), end = t + length;
    var o = ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(f * 1.02, t);
    o.frequency.linearRampToValueAtTime(f * 1.015, mid - 0.15);
    o.frequency.linearRampToValueAtTime(f * 0.985, mid + 0.15);
    o.frequency.linearRampToValueAtTime(f * 0.98, end);
    /* the wings never quite hold one speed */
    var wobble = ctx.createOscillator(), depth = ctx.createGain();
    wobble.frequency.value = rand(5, 11); depth.gain.value = f * 0.012;
    wobble.connect(depth); depth.connect(o.frequency);
    var tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = bumble ? 1400 : 2200; tone.Q.value = 0.5;
    var env = ctx.createGain(), peak = (bumble ? 0.28 : 0.2) * rand(0.6, 1);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak * 0.25, t + length * 0.15);
    env.gain.linearRampToValueAtTime(peak, mid);
    env.gain.linearRampToValueAtTime(peak * 0.2, end - length * 0.1);
    env.gain.linearRampToValueAtTime(0, end);
    o.connect(tone); tone.connect(env);
    var nodes = [o, wobble, depth, tone, env];
    if(ctx.createStereoPanner){
      var p = ctx.createStereoPanner(), side = pick([-1, 1]);
      p.pan.setValueAtTime(side * rand(0.5, 0.9), t);
      p.pan.linearRampToValueAtTime(-side * rand(0.2, 0.8), end);
      env.connect(p); p.connect(out); nodes.push(p);
    } else env.connect(out);
    o.onended = done(nodes);
    [o, wobble].forEach(function(n){ n.start(t); n.stop(end + 0.05); });
  }
  function bees(ctx, out, hour){
    var day = false, next = 0;
    function setHour(name){
      var was = day;
      day = name === "morning" || name === "midday";
      if(day && !was) next = ctx.currentTime + rand(3, 10);
    }
    setHour(hour);
    return {
      setHour: setHour,
      tick: function(until){
        while(day && next < until){
          beePass(ctx, out, next);
          next += rand(6, 18);
        }
      },
      stop: function(){}
    };
  }

  /* ---- the horses, heard only near them. A snort is "a more or less
     pulsed broad-band sound of forceful exhalation through the nostrils,
     produced mouth closed", and horses give more of them when at ease, out
     at pasture or feeding (Stomp et al., PLOS ONE, 2018). A blow is the
     same breath, shorter and without the flutter. Between them a horse
     shifts its weight: a hoof lifted and set down on the yard's earth, or
     in the straw of a stall. A whinny drawn from oscillators was tried
     first and taken out; it did not sound like a horse. ---- */
  function breathBuffer(ctx, length, flutter, depth){
    var len = Math.ceil(length * SR), data = new Float32Array(len);
    var phase = 0, rate = flutter, dark = 0, peak = 0;
    for(var i = 0; i < len; i++){
      var s = i / SR, x = s / length;
      /* a quick push, then a long fall as the air runs out */
      var env = Math.min(1, s / 0.03) * Math.pow(1 - x, 1.4);
      /* the nostrils flap a little slower and less evenly as it falls,
         and stop before the breath does */
      rate += (flutter * (1 - 0.3 * x) * rand(0.6, 1.4) - rate) * 0.01;
      phase = (phase + rate / SR) % 1;
      var flap = Math.pow(1 - phase, 3);
      var d = depth * Math.min(1, x * 6) * Math.min(1, (1 - x) / 0.3);
      /* the breath itself is a darkened noise, not a hiss */
      dark += (Math.random() * 2 - 1 - dark) * 0.35;
      var v = env * (dark * (1 - d + d * 1.8 * flap) + d * 0.5 * (flap - 0.25));
      data[i] = v;
      peak = Math.max(peak, Math.abs(v));
    }
    for(i = 0; i < len; i++) data[i] /= peak;
    return toBuffer(ctx, data);
  }
  /* A hoof set down: a short knock that drops in pitch, a little grit,
     and in a stall the straw giving under it. */
  function hoofBuffer(ctx, size, straw){
    var length = straw ? rand(0.35, 0.5) : rand(0.16, 0.22);
    var len = Math.ceil(length * SR), data = new Float32Array(len);
    var f = rand(120, 170) / size, phase = 0, grit = 0, peak = 0;
    for(var i = 0; i < len; i++){
      var s = i / SR;
      phase += 2 * Math.PI * f * (1 + Math.exp(-s / 0.012)) / SR;
      var knock = Math.sin(phase) * Math.exp(-s / (straw ? 0.03 : 0.045)) * (straw ? 0.6 : 1);
      grit += (Math.random() * 2 - 1 - grit) * 0.5;
      var v = knock + grit * Math.exp(-s / 0.01) * 0.5;
      if(straw && s > 0.01){
        var crackle = Math.random() < 0.12 ? 1 : 0.15;
        v += (Math.random() * 2 - 1) * crackle * 0.35 * Math.exp(-(s - 0.01) / 0.12);
      }
      data[i] = v;
      peak = Math.max(peak, Math.abs(v));
    }
    for(i = 0; i < len; i++) data[i] /= peak;
    return toBuffer(ctx, data);
  }
  /* Where each horse stands in the picture, so the sound agrees with it.
     In the garden the stable is off to the left and only a snort carries;
     in the yard Pamuk and Bal are on the left and Gece on the right; in
     the stable Doru and Tarçın look out from the left-hand stalls, Tarçın
     further back. `size` sets the voice: the Haflinger's is the lightest,
     the Friesian's the deepest. */
  var PLACES = {
    garden: { tone: 1300, hooves: false, first: [6, 14], horses: [
      { pan: -0.75, size: 1.05, level: 0.3 }, { pan: -0.6, size: 0.95, level: 0.22 } ] },
    stableYard: { tone: 5000, hooves: true, first: [2, 6], horses: [
      { pan: -0.6, size: 1, level: 0.4 }, { pan: -0.25, size: 0.85, level: 0.36 },
      { pan: 0.6, size: 1.2, level: 0.45 } ] },
    stable: { tone: 4000, hooves: true, straw: true, first: [2, 6], horses: [
      { pan: -0.6, size: 1, level: 0.45 }, { pan: -0.3, size: 1.05, level: 0.28 } ] }
  };
  function horses(ctx, out, spot){
    var now = ctx.currentTime;
    var herd = spot.horses.map(function(h){
      var g = ctx.createGain(); g.gain.value = h.level;
      var tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = spot.tone; tone.Q.value = -3;
      tone.connect(g);
      var flutter = rand(28, 38) / h.size;
      return {
        input: tone, gain: g, pan: place(ctx, g, out, h.pan),
        snorts: [0, 1, 2].map(function(){ return breathBuffer(ctx, rand(0.6, 1.1) * h.size, flutter * rand(0.9, 1.1), rand(0.6, 0.85)); }),
        blow: breathBuffer(ctx, rand(0.3, 0.45) * h.size, flutter, 0.1),
        hooves: spot.hooves ? [0, 1, 2].map(function(){ return hoofBuffer(ctx, h.size, spot.straw); }) : null,
        breath: now + rand(12, 45), step: now + rand(6, 30)
      };
    });
    /* one of them is heard soon after arriving */
    pick(herd).breath = now + rand(spot.first[0], spot.first[1]);
    function play(h, buffer, when, level){
      var g = ctx.createGain();
      g.gain.value = level;
      g.connect(h.input);
      var src = playBuffer(ctx, buffer, g, when, rand(0.95, 1.05));
      src.onended = done([src, g]);
    }
    return {
      tick: function(until){
        herd.forEach(function(h){
          while(h.breath < until){
            if(Math.random() < 0.7) play(h, pick(h.snorts), h.breath, rand(0.75, 1));
            else play(h, h.blow, h.breath, rand(0.5, 0.75));
            h.breath += rand(40, 100);
          }
          while(h.hooves && h.step < until){
            /* a shift of weight: one hoof, sometimes a second after it */
            play(h, pick(h.hooves), h.step, rand(0.6, 0.9));
            if(Math.random() < 0.5) play(h, pick(h.hooves), h.step + rand(0.3, 0.7), rand(0.35, 0.6));
            h.step += rand(25, 70);
          }
        });
      },
      stop: function(){
        herd.forEach(function(h){ done([h.input, h.gain, h.pan].filter(Boolean))(); });
      }
    };
  }
  /* The sound of a place, for the places that have one of their own. It
     is heard as it is, without the walls: in the stable the horses share
     the room. The garden also has its bees, which keep to the day; the
     caller passes the part of the day and tells it when that changes.
     Returns null where there is nothing. */
  function placeSound(ctx, out, buffers, name, hourName){
    var spot = PLACES[name];
    if(!spot) return null;
    var bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(out);
    var parts = [horses(ctx, bus, spot)];
    if(name === "garden") parts.push(bees(ctx, bus, hourName));
    return {
      name: name, out: bus,
      tick: function(until){ parts.forEach(function(p){ p.tick(until); }); },
      setHour: function(h){ parts.forEach(function(p){ if(p.setHour) p.setHour(h); }); },
      stop: function(){
        parts.forEach(function(p){ p.stop(); });
        try{ bus.disconnect(); }catch(e){}
      }
    };
  }

  /* ---- one bed per part of the day ---- */
  function hour(ctx, out, buffers, name){
    if(name === "midday" && !buffers.pink) buffers.pink = window.OLAE_RAIN.makeNoiseBuffer(ctx, "pink");
    var bed = ctx.createGain();
    bed.gain.value = 0;
    bed.connect(out);
    var parts = name === "morning" ? [birds(ctx, bed), dove(ctx, bed, true)]
              : name === "midday" ? [wind(ctx, bed, buffers), cicadas(ctx, bed), dove(ctx, bed, false)]
              : name === "evening" ? [crickets(ctx, bed, false)]
              : [crickets(ctx, bed, true), owl(ctx, bed)];
    return {
      out: bed,
      tick: function(until){ parts.forEach(function(p){ if(p.tick) p.tick(until); }); },
      stop: function(){
        parts.forEach(function(p){ p.stop(); });
        try{ bed.disconnect(); }catch(e){}
      }
    };
  }

  window.OLAE_FARM_ENGINE = { hour: hour, place: placeSound };
})();
