/* rain-engine.js — the Web Audio rain generator shared by /noise/ and the
   essays' "read with rain" button (js/rain-read.js). Pure synthesis, no
   DOM and no AudioContext of its own: callers pass their context, their
   master gain and their buffer cache, and keep their own UI, volume and
   fades. The sound is a breathing bed of band-passed pink noise with
   millisecond droplets cut from white noise — no recordings, nothing
   loaded. */
(function(){
  "use strict";

  /* ---- a 12 s noise buffer per color, seam crossfaded so the loop is
     silent. white/pink feed the rain; brown is /noise/'s third color ---- */
  function makeNoiseBuffer(ctx, kind){
    var sr = ctx.sampleRate, len = sr * 12, fade = Math.floor(sr / 2);
    var raw = new Float32Array(len + fade);
    var i, w;
    if(kind === "white"){
      for(i = 0; i < raw.length; i++) raw[i] = Math.random() * 2 - 1;
    } else if(kind === "pink"){
      var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for(i = 0; i < raw.length; i++){
        w = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + w*0.0555179;
        b1 = 0.99332*b1 + w*0.0750759;
        b2 = 0.96900*b2 + w*0.1538520;
        b3 = 0.86650*b3 + w*0.3104856;
        b4 = 0.55000*b4 + w*0.5329522;
        b5 = -0.7616*b5 - w*0.0168980;
        raw[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      var last = 0;
      for(i = 0; i < raw.length; i++){
        w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        raw[i] = last * 3.5;
      }
    }
    var buf = ctx.createBuffer(1, len, sr);
    var data = buf.getChannelData(0);
    for(i = 0; i < len; i++){
      data[i] = i < fade
        ? raw[i] * (i / fade) + raw[len + i] * (1 - i / fade)
        : raw[i];
    }
    return buf;
  }

  /* ---- rain: a breathing bed of filtered noise, with droplets on top ----
     The bed is the pink buffer shaped into a band and swelled gently by a
     very slow LFO; the droplets are millisecond bursts cut at random from
     the white buffer, each through its own band-pass at a random center,
     quiet enough to sit inside the bed rather than on top of it.

     Two weights of it, and what separates them is not the volume knob: a
     downpour is a wider, lower band with several times the rain in it, and
     turning one up only gives a loud drizzle. Weight 1 is the sound this
     has always made and stays the default, so /noise/ is untouched; the
     essays' "read with rain" asks for a weight and may change its mind
     while the rain is playing. Returns { stop, setIntensity } — everything
     hangs off the caller's master. */
  var WEIGHTS = {
    /* hp/lp: the band. bed/drops/lfo: the levels. gap/spread: the seconds
       between droplets. peak/lift: how loud one lands — heavy rain's drops
       are slightly quieter each, because there are five times as many. */
    1: { hp:400, lp:2500, bed:0.85, drops:0.50, lfo:0.12, gap:0.060, spread:0.50, peak:0.05, lift:0.25 },
    2: { hp:250, lp:3900, bed:1.15, drops:0.75, lfo:0.18, gap:0.014, spread:0.10, peak:0.04, lift:0.22 }
  };
  function buildRain(ctx, master, buffers, options){
    var weight = WEIGHTS[(options && options.intensity) === 2 ? 2 : 1];
    if(!buffers.pink)  buffers.pink  = makeNoiseBuffer(ctx, "pink");
    if(!buffers.white) buffers.white = makeNoiseBuffer(ctx, "white");

    var bed = ctx.createBufferSource();
    bed.buffer = buffers.pink; bed.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = weight.hp; hp.Q.value = 0.7;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass";  lp.frequency.value = weight.lp; lp.Q.value = 0.7;
    var bedGain = ctx.createGain(); bedGain.gain.value = weight.bed;
    var lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.09;
    var lfoDepth = ctx.createGain(); lfoDepth.gain.value = weight.lfo;
    lfo.connect(lfoDepth); lfoDepth.connect(bedGain.gain);
    bed.connect(hp); hp.connect(lp); lp.connect(bedGain); bedGain.connect(master);
    bed.start(); lfo.start();

    var dropBus = ctx.createGain(); dropBus.gain.value = weight.drops; dropBus.connect(master);
    function scheduleDrop(t){
      var src = ctx.createBufferSource();
      src.buffer = buffers.white;
      var dur = 0.005 + Math.random() * 0.015;                    /* 5–20 ms  */
      var offset = Math.random() * (buffers.white.duration - 0.1);
      var bp = ctx.createBiquadFilter(); bp.type = "bandpass";
      bp.frequency.value = 1000 + Math.random() * 5000;           /* ~1–6 kHz */
      bp.Q.value = 6;
      var g = ctx.createGain();
      var peak = weight.peak + Math.random() * weight.lift;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.03);
      src.connect(bp); bp.connect(g); g.connect(dropBus);
      src.start(t, offset, dur + 0.05);
      src.onended = function(){ try{ src.disconnect(); bp.disconnect(); g.disconnect(); }catch(e){} };
    }
    /* lookahead scheduling against the audio clock: a few drops a second at
       the lighter weight, some fifteen at the heavier one */
    var nextDrop = ctx.currentTime + 0.05;
    var timer = setInterval(function(){
      var horizon = ctx.currentTime + 0.25;
      while(nextDrop < horizon){
        scheduleDrop(nextDrop);
        nextDrop += weight.gap + Math.random() * weight.spread;
      }
    }, 100);

    /* Changing weight mid-rain: the levels and the band ramp across a
       second and a half so the sky thickens rather than switches, and the
       droplet spacing is simply read fresh at the next scheduling pass. */
    function setIntensity(level, seconds){
      var next = WEIGHTS[level === 2 ? 2 : 1];
      if(next === weight) return;
      weight = next;
      var t = ctx.currentTime, over = seconds === undefined ? 1.5 : seconds;
      [[hp.frequency, next.hp], [lp.frequency, next.lp], [bedGain.gain, next.bed],
       [lfoDepth.gain, next.lfo], [dropBus.gain, next.drops]].forEach(function(pair){
        var param = pair[0];
        param.cancelScheduledValues(t);
        param.setValueAtTime(param.value, t);
        param.linearRampToValueAtTime(pair[1], t + over);
      });
    }

    return {
      setIntensity: setIntensity,
      stop: function(){
        clearInterval(timer);
        try{ bed.stop(); }catch(e){}
        try{ lfo.stop(); }catch(e){}
        [bed, hp, lp, bedGain, lfo, lfoDepth, dropBus].forEach(function(n){
          try{ n.disconnect(); }catch(e){}
        });
      }
    };
  }

  window.OLAE_RAIN = { makeNoiseBuffer: makeNoiseBuffer, buildRain: buildRain };
})();
