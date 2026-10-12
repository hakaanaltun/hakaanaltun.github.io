/* balcony-sound-engine.js — what is heard from The House's balcony, played
   by js/house-sound.js. Pure synthesis, no DOM and no AudioContext of its
   own, the same arrangement as js/rain-engine.js and
   js/farm-sound-engine.js: callers pass their context and the node to play
   into, and keep the button, the levels and the fades. Nothing is recorded
   and nothing is loaded; the air is cut from rain-engine's pink noise.

   The voices, each of which house-sound.js starts and stops by İstanbul's
   hour, month and weather:
     air        the city and the sea far off, a low hush that never stops
     birds      small birds chirping on the roofs, in short bouts
     gulls      İstanbul's gulls, a call now and then, sometimes a long call
     crickets   field crickets, a chirp of a few pulses
     treeCrickets  tree crickets, short trills that slow in the cool
     ferry      a ferry's horn from the water, now and then
   Each takes (ctx, out, buffers, options) and returns
   { out, tick(until), set(options), stop() }: `out` is the voice's own
   gain, made at 0 so the caller can fade it in; tick() schedules the
   voice's next events up to an audio time; set() takes new options, such
   as how busy the birds are or the temperature. Nothing on the page names
   a species. */
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
  /* The ferry and the insects need nothing near ten kilohertz and are drawn
     at half rate, as the farm's sounds are; the birds and the gulls carry
     harmonics above that and are drawn at full rate. */
  var LOW = 22050, HIGH = 44100;
  function normalise(ctx, data, rate){
    var peak = 0, i;
    for(i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    if(peak) for(i = 0; i < data.length; i++) data[i] /= peak;
    var buf = ctx.createBuffer(1, data.length, rate);
    buf.getChannelData(0).set(data);
    return buf;
  }
  function playBuffer(ctx, buffer, into, when, rate, level){
    var g = ctx.createGain();
    g.gain.value = level === undefined ? 1 : level;
    g.connect(into);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate || 1;
    src.connect(g);
    src.onended = done([src, g]);
    src.start(when);
    return src;
  }
  /* Every voice has a gain of its own, made silent, for the caller's fade. */
  function bus(ctx, out){
    var g = ctx.createGain();
    g.gain.value = 0;
    g.connect(out);
    return g;
  }

  /* ---- air: the city and the sea far off. Pink noise in a low band,
     swelled by two slow waves that do not line up within a visit. It is
     the floor everything else stands on, and it is kept low. ---- */
  function air(ctx, out, buffers){
    if(!buffers.pink) buffers.pink = window.OLAE_RAIN.makeNoiseBuffer(ctx, "pink");
    var level = bus(ctx, out);
    var src = ctx.createBufferSource();
    src.buffer = buffers.pink; src.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 90; hp.Q.value = -3;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = -3;
    var body = ctx.createGain(); body.gain.value = 0.5;
    src.connect(hp); hp.connect(lp); lp.connect(body); body.connect(level);
    var slow = ctx.createOscillator(); slow.frequency.value = rand(0.03, 0.05);
    var quick = ctx.createOscillator(); quick.frequency.value = rand(0.08, 0.11);
    var links = [[slow, body.gain, 0.12], [quick, body.gain, 0.07], [slow, lp.frequency, 140]].map(function(l){
      var d = ctx.createGain(); d.gain.value = l[2];
      l[0].connect(d); d.connect(l[1]);
      return d;
    });
    src.start(0, rand(0, 11)); slow.start(); quick.start();
    return {
      out: level,
      tick: function(){},
      set: function(){},
      stop: function(){
        [src, slow, quick].forEach(function(n){ try{ n.stop(); }catch(e){} });
        done([src, hp, lp, body, slow, quick, level].concat(links))();
      }
    };
  }

  /* ---- birds: small birds on the roofs, chirping in short bouts. A chirp
     here is a two-part note, up and then down, near three to four
     kilohertz, with its overtones. Three birds at different distances and
     on different sides, each with a few chirps of its own. They are not any
     one species. `busy` (0 to 1) sets how long they rest between bouts:
     the caller makes them busiest in spring, quieter in late summer, and
     few in rain or snow. ---- */
  function chirpBuffer(ctx, f, length, lift){
    var len = Math.ceil(length * HIGH), data = new Float32Array(len), phase = 0;
    for(var i = 0; i < len; i++){
      var x = i / len, s = i / HIGH;
      /* up through the first part, a slight dip, and down through the
         second */
      var bend = x < 0.42 ? 0.9 + lift * x / 0.42 : 0.9 + lift - (lift + 0.12) * (x - 0.42) / 0.58;
      phase += 2 * Math.PI * f * bend / HIGH;
      var env = Math.min(1, s / 0.005) * Math.min(1, (length - s) / 0.02);
      env *= x > 0.38 && x < 0.48 ? 0.55 : 1;
      data[i] = env * (Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase));
    }
    return normalise(ctx, data, HIGH);
  }
  function birds(ctx, out, buffers, options){
    var level = bus(ctx, out), busy = options && options.busy !== undefined ? options.busy : 1;
    var flock = [0, 1, 2].map(function(i){
      var g = ctx.createGain(); g.gain.value = [0.5, 0.3, 0.17][i];
      var f = rand(2900, 3700);
      return {
        gain: g, pan: place(ctx, g, level, rand(-0.85, 0.85)),
        chirps: [0, 1, 2].map(function(){ return chirpBuffer(ctx, f * rand(0.92, 1.08), rand(0.08, 0.13), rand(0.25, 0.4)); }),
        next: ctx.currentTime + rand(0.5, 8)
      };
    });
    function rest(){ return rand(3, 14) / Math.max(0.12, busy); }
    return {
      out: level,
      tick: function(until){
        flock.forEach(function(b){
          while(b.next < until){
            var at = b.next;
            for(var n = 3 + Math.floor(Math.random() * 7); n > 0; n--){
              playBuffer(ctx, pick(b.chirps), b.gain, at, rand(0.96, 1.04), rand(0.6, 1));
              at += rand(0.14, 0.32);
            }
            b.next = at + rest();
          }
        });
      },
      set: function(o){
        if(o && o.busy !== undefined) busy = o.busy;
      },
      stop: function(){
        flock.forEach(function(b){ done([b.gain, b.pan].filter(Boolean))(); });
        done([level])();
      }
    };
  }

  /* ---- gulls. The gulls that live in Türkiye do not migrate (Bilim ve
     Teknik, July 2016), and in the city they nest on rooftops and are
     heard a long way off (Bilim Çocuk). The call is a loud laugh, deeper and
     more nasal than a herring gull's (Wikipedia, Yellow-legged gull). A
     note here is a harmonic tone with its middle overtones raised, which
     gives it the nasal edge, and a little roughness. Most often a gull
     gives one to three calls that rise and fall; now and then the long
     call: a low note or two, loud high squeals, then a run of short notes
     falling away. They call less at night, and the caller says so with
     `busy`. ---- */
  function gullBuffer(ctx, f, length, shape){
    var len = Math.ceil(length * HIGH), data = new Float32Array(len), phase = 0;
    var rough = rand(55, 80), wander = 0, grit = 0;
    for(var i = 0; i < len; i++){
      var x = i / len, s = i / HIGH;
      var bend = shape === "squeal" ? (x < 0.3 ? 0.8 + 0.45 * x / 0.3 : 1.25 - 0.5 * (x - 0.3) / 0.7)
        : shape === "ha" ? 1.05 - 0.25 * x : 0.9 + 0.1 * x;
      /* a voice is never quite steady: the pitch wanders by a few parts in
         a hundred, and the note is hoarse */
      wander += (Math.random() * 2 - 1 - wander) * 0.002;
      var fi = f * bend * (1 + 0.6 * wander * 0.05);
      phase += 2 * Math.PI * fi / HIGH;
      var v = 0;
      for(var k = 1; k <= 10 && k * fi < 9000; k++){
        var band = (k * fi - 2300) / 800;
        v += Math.sin(k * phase) * Math.pow(k, -0.7) * (0.4 + 1.6 * Math.exp(-band * band));
      }
      var env = Math.min(1, s / 0.02) * Math.min(1, (length - s) / 0.06);
      if(shape === "squeal") env *= 0.75 + 0.25 * Math.sin(Math.PI * x);
      v *= env * (1 - 0.35 * (0.5 + 0.5 * Math.sin(2 * Math.PI * rough * s)));
      /* the breath in it, darkened a little, louder in the loud middle */
      grit += (Math.random() * 2 - 1 - grit) * 0.45;
      data[i] = v + env * 0.35 * grit * (0.6 + 0.4 * Math.abs(Math.sin(phase)));
    }
    return normalise(ctx, data, HIGH);
  }
  function gulls(ctx, out, buffers, options){
    var level = bus(ctx, out), busy = options && options.busy !== undefined ? options.busy : 1;
    /* far off over the roofs: the top of the call does not carry */
    var far = ctx.createBiquadFilter(); far.type = "lowpass"; far.frequency.value = 3800; far.Q.value = -3;
    far.connect(level);
    var flock = [0, 1].map(function(i){
      var g = ctx.createGain(); g.gain.value = [0.42, 0.24][i];
      var f = rand(640, 820);
      return {
        gain: g, pan: place(ctx, g, far, rand(-0.8, 0.8)),
        squeals: [gullBuffer(ctx, f, rand(0.3, 0.42), "squeal"), gullBuffer(ctx, f * 1.06, rand(0.34, 0.46), "squeal")],
        intro: gullBuffer(ctx, f * 0.75, rand(0.16, 0.22), "intro"),
        ha: gullBuffer(ctx, f * 0.95, rand(0.11, 0.15), "ha"),
        next: ctx.currentTime + rand(6, 30) / Math.max(0.15, busy)
      };
    });
    function call(gull, t){
      if(Math.random() < 0.3){
        for(var n = 1 + Math.floor(Math.random() * 2); n > 0; n--){
          playBuffer(ctx, gull.intro, gull.gain, t, rand(0.97, 1.03), 0.55); t += rand(0.24, 0.32);
        }
        for(n = 2 + Math.floor(Math.random() * 2); n > 0; n--){
          playBuffer(ctx, pick(gull.squeals), gull.gain, t, rand(0.97, 1.04), 1); t += rand(0.48, 0.6);
        }
        var fade = 0.8, rate = 1.02;
        for(n = 4 + Math.floor(Math.random() * 5); n > 0; n--){
          playBuffer(ctx, gull.ha, gull.gain, t, rate, fade); t += rand(0.17, 0.23);
          fade *= 0.86; rate *= 0.985;
        }
      } else {
        for(var c = 1 + Math.floor(Math.random() * 3); c > 0; c--){
          playBuffer(ctx, pick(gull.squeals), gull.gain, t, rand(0.95, 1.05), rand(0.7, 1)); t += rand(0.55, 0.9);
        }
      }
      return t;
    }
    return {
      out: level,
      tick: function(until){
        flock.forEach(function(gull){
          while(gull.next < until) gull.next = call(gull, gull.next) + rand(20, 80) / Math.max(0.15, busy);
        });
      },
      set: function(o){
        if(o && o.busy !== undefined) busy = o.busy;
      },
      stop: function(){
        flock.forEach(function(gull){ done([gull.gain, gull.pan].filter(Boolean))(); });
        done([far, level])();
      }
    };
  }

  /* ---- field crickets. A field cricket's chirp is three to five pulses of
     about 20 ms near 4.7 kHz, some thirty pulses a second (Hedwig, J Comp
     Physiol A, 2006), drawn as the farm's are. Adults sing from May to
     July, by day and in the first part of the night, and only when it is
     well above 13 °C (Wikipedia, Gryllus campestris); the caller keeps to
     that. In the cool they chirp more slowly. ---- */
  function chirpPulses(ctx, fc, pulses, pulseLen, period){
    var len = Math.ceil((pulses * period + 0.02) * LOW), data = new Float32Array(len), phase = 0;
    for(var n = 0; n < pulses; n++){
      var start = Math.floor(n * period * LOW), count = Math.floor(pulseLen * LOW);
      var peak = n === 0 ? 0.7 : 1;
      for(var i = 0; i < count && start + i < len; i++){
        var x = i / count;
        phase += 2 * Math.PI * fc * (1 - 0.03 * x) / LOW;
        var env = x < 0.3 ? Math.sin(Math.PI * x / 0.6) : Math.cos(Math.PI * (x - 0.3) / 1.4);
        data[start + i] = peak * env * env * Math.sin(phase);
      }
    }
    return normalise(ctx, data, LOW);
  }
  /* How much slower than on a warm night: 1 at 22 °C and above, more as it
     cools, and plain when the temperature is not known. */
  function coolness(temp){
    if(temp === null || temp === undefined) return 1.1;
    return Math.max(1, Math.min(1.8, 1 + (22 - temp) * 0.08));
  }
  function crickets(ctx, out, buffers, options){
    var level = bus(ctx, out), slow = coolness(options && options.temp);
    var voices = [0.35, 0.2, 0.11].map(function(l){
      var g = ctx.createGain(); g.gain.value = l;
      return {
        buffer: chirpPulses(ctx, rand(4400, 4900), pick([3, 4, 4, 5]), rand(0.016, 0.021), rand(0.031, 0.036)),
        gain: g, pan: place(ctx, g, level, rand(-0.8, 0.8)),
        every: rand(0.32, 0.45), next: ctx.currentTime + rand(0, 2),
        left: 15 + Math.floor(Math.random() * 55)
      };
    });
    return {
      out: level,
      tick: function(until){
        voices.forEach(function(v){
          while(v.next < until){
            playBuffer(ctx, v.buffer, v.gain, v.next, rand(0.995, 1.005));
            v.next += v.every * slow * rand(0.96, 1.04);
            if(--v.left <= 0){
              v.next += rand(1.5, 7) * slow;
              v.left = 15 + Math.floor(Math.random() * 55);
            }
          }
        });
      },
      set: function(o){
        if(o && "temp" in o) slow = coolness(o.temp);
      },
      stop: function(){
        voices.forEach(function(v){ done([v.gain, v.pan].filter(Boolean))(); });
        done([level])();
      }
    };
  }

  /* ---- tree crickets: short trills near 2.6 kHz, each a third of a second
     to three quarters of one, about sixty a minute at 22 °C (FSS Birding,
     European tree cricket, Kent, 2023). Adults sing from July to October,
     mostly at night (Wikipedia, Oecanthus pellucens), and on cooler autumn
     nights they rest longer between runs. ---- */
  function trillBuffer(ctx, fc, length, rate){
    var len = Math.ceil(length * LOW), data = new Float32Array(len);
    for(var i = 0; i < len; i++){
      var s = i / LOW, beat = (s * rate) % 1;
      var edge = Math.min(1, s / 0.04, (length - s) / 0.06);
      var pulse = beat < 0.55 ? Math.sin(Math.PI * beat / 0.55) : 0;
      data[i] = edge * pulse * Math.sin(2 * Math.PI * fc * s);
    }
    return normalise(ctx, data, LOW);
  }
  function treeCrickets(ctx, out, buffers, options){
    var level = bus(ctx, out), slow = coolness(options && options.temp);
    /* The cool slows the pulses inside a trill and the trills themselves;
       the pitch stays where it is. */
    function draw(v){
      v.drawn = slow;
      v.trill = trillBuffer(ctx, v.fc, v.length, v.rate / slow);
    }
    var voices = [0.3, 0.16].map(function(l){
      var g = ctx.createGain(); g.gain.value = l;
      var v = {
        fc: rand(2500, 2800), length: rand(0.3, 0.7), rate: rand(38, 48),
        gain: g, pan: place(ctx, g, level, rand(-0.7, 0.7)),
        next: ctx.currentTime + rand(0.5, 4), left: 20 + Math.floor(Math.random() * 60)
      };
      draw(v);
      return v;
    });
    return {
      out: level,
      tick: function(until){
        voices.forEach(function(v){
          if(Math.abs(v.drawn - slow) > 0.1) draw(v);
          while(v.next < until){
            playBuffer(ctx, v.trill, v.gain, v.next, rand(0.995, 1.005));
            v.next += rand(0.95, 1.05) * slow;
            if(--v.left <= 0){
              /* the cooler the night, the longer the rest */
              v.next += rand(3, 12) * slow * slow * slow;
              v.left = 20 + Math.floor(Math.random() * 60);
            }
          }
        });
      },
      set: function(o){
        if(o && "temp" in o) slow = coolness(o.temp);
      },
      stop: function(){
        voices.forEach(function(v){ done([v.gain, v.pan].filter(Boolean))(); });
        done([level])();
      }
    };
  }

  /* ---- a ferry's horn from the water. The rules of the road give a
     ship's whistle its pitch by the ship's size, between 130 and 350 Hz
     for one of 75 to 200 metres and between 250 and 700 Hz below that
     (COLREGS, Annex III), and call a blast of four to six seconds a
     prolonged one (Rule 32). The horn here is one prolonged blast near
     the foot of the smaller range, a little sharp as it starts and a
     little flat as the air runs out, heard across the water: its top is
     lost on the way, and the city gives back a fainter echo. İstanbul's
     ferries run from about a quarter to seven in the morning until about
     half past eleven at night; the caller keeps the horn to those hours.
     The first comes within a couple of minutes, so a reader who listens
     for a while hears one. ---- */
  function hornBuffer(ctx, f, length){
    var len = Math.ceil(length * LOW), data = new Float32Array(len), phase = 0;
    for(var i = 0; i < len; i++){
      var s = i / LOW;
      var bend = s < 0.3 ? 0.965 + 0.035 * s / 0.3 : s > length - 0.45 ? 1 - 0.03 * (s - length + 0.45) / 0.45 : 1;
      var fi = f * bend * (1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * s));
      phase += 2 * Math.PI * fi / LOW;
      var v = 0;
      for(var k = 1; k <= 14 && k * fi < 4200; k++){
        var band = (k * fi - 750) / 450;
        v += Math.sin(k * phase) / k * (0.6 + 1.2 * Math.exp(-band * band));
      }
      data[i] = v * Math.min(1, s / 0.28, (length - s) / 0.5);
    }
    return normalise(ctx, data, LOW);
  }
  function ferry(ctx, out, buffers, options){
    var level = bus(ctx, out);
    var water = ctx.createBiquadFilter(); water.type = "lowpass"; water.frequency.value = 950; water.Q.value = -3;
    var echo = ctx.createBiquadFilter(); echo.type = "lowpass"; echo.frequency.value = 480; echo.Q.value = -3;
    var g = ctx.createGain(); g.gain.value = 0.55;
    water.connect(g); echo.connect(g);
    var pan = place(ctx, g, level, rand(-0.35, 0.35));
    var horns = [hornBuffer(ctx, rand(255, 300), rand(4.2, 5.6)), hornBuffer(ctx, rand(255, 300), rand(4.2, 5.6))];
    var next = ctx.currentTime + rand(40, 140);
    return {
      out: level,
      tick: function(until){
        while(next < until){
          var horn = pick(horns), rate = rand(0.98, 1.02), loud = rand(0.6, 1);
          playBuffer(ctx, horn, water, next, rate, loud);
          playBuffer(ctx, horn, echo, next + rand(0.7, 1.2), rate, loud * 0.3);
          next += rand(240, 600);
        }
      },
      set: function(){},
      stop: function(){ done([water, echo, g, pan, level].filter(Boolean))(); }
    };
  }

  window.OLAE_BALCONY_ENGINE = { air: air, birds: birds, gulls: gulls, crickets: crickets, treeCrickets: treeCrickets, ferry: ferry };
})();
