/* Local, opt-in weather. Bounded particles and drift, no network or storage. */
(function(){
  'use strict';
  function createDrift(count){
    var heights=new Float32Array(count), packed=new Float32Array(count), cap=0, step=8;
    /* How much steeper a face packed snow holds than poured snow does, and
       how much fresh fall it takes to bury that packing and give the loose
       angle back. Snow a hand has pressed is not the snow that fell. */
    var CUT_HOLD=7, BURY=40;
    function setLimit(limit,span){
      cap=Math.max(0,limit);
      /* Snow will not stand in a spike: past its angle of repose it slides.
         The step allowed between neighbouring columns is what makes a drift
         read as a drift and not as a bar chart, so it follows the column
         width — about 35 degrees of it. */
      step=Math.max(1,span/Math.max(1,count-1)*.7);
      for(var i=0;i<count;i++)if(heights[i]>cap)heights[i]=cap;
    }
    /* Snowfall is not even across a window and does not stay where it was:
       two slow waves drift against each other so the pattern keeps changing,
       and a lean tips the fall the way the wind is going. */
    function grow(seconds,rate,now,lean){
      for(var i=0;i<count;i++){
        var x=i/(count-1);
        var local=1+.55*Math.sin(x*7.3+now*.00013)+.35*Math.sin(x*17.1-now*.00021)+lean*(x-.5)*1.2;
        if(local<.05)local=.05;
        var was=heights[i], next=was+seconds*rate*local;
        heights[i]=next>cap?cap:next;
        // What falls on a packed column is loose again, and buries the face
        // that was holding, so a wiped stripe closes over instead of lasting.
        if(packed[i]>0 && heights[i]>was){
          packed[i]-=(heights[i]-was)/BURY;
          if(packed[i]<0)packed[i]=0;
        }
      }
    }
    /* The slump. Run in both directions so neither edge is favoured. */
    function settle(seconds){
      var relax=Math.min(1,seconds*8);
      for(var pass=0;pass<2;pass++){
        for(var k=0;k<count-1;k++){
          var i=pass===0?k:count-2-k, j=i+1;
          // Poured snow slides at its angle of repose; snow a hand has packed
          // stands in a wall. Without that the trench a finger cut would flow
          // shut like water, which is the one thing snow never does.
          var hold=step*(1+CUT_HOLD*Math.max(packed[i],packed[j]));
          var diff=heights[i]-heights[j], move;
          if(diff>hold){move=(diff-hold)*.5*relax;heights[i]-=move;heights[j]+=move;}
          else if(-diff>hold){move=(-diff-hold)*.5*relax;heights[j]-=move;heights[i]+=move;}
        }
      }
      for(var n=0;n<count;n++){if(heights[n]>cap)heights[n]=cap;else if(heights[n]<0)heights[n]=0;}
    }
    function heightAt(fraction){
      var p=Math.max(0,Math.min(1,fraction))*(count-1), i=Math.floor(p), next=Math.min(count-1,i+1);
      return heights[i]+(heights[next]-heights[i])*(p-i);
    }
    /* A hand does not delete snow, it moves it. What it passes through is
       pressed down to the depth the hand is at — a graze takes the crest, a
       plunge takes the lot — and what comes off is pushed the way the hand is
       going, to bank where it stops. The depth and the bank together are what
       tell the eye the snow was wiped rather than switched off; taking a
       fixed amount wherever the pointer happened to be tells it nothing. */
    function carve(fraction,level,radius,strength,lead){
      var span=Math.max(1e-6,radius), floor=Math.max(0,level), moved=0, weight=0, i, distance, target;
      // The hand and its two shoulders, and no more of the window than that:
      // a stroke across a wide one is a great many of these in a row.
      var last=count-1, reach=span*2*last;
      var lo=Math.max(0,Math.ceil(fraction*last-reach)), hi=Math.min(last,Math.floor(fraction*last+reach));
      for(i=lo;i<=hi;i++){
        distance=Math.abs(i/last-fraction)/span;
        if(distance>=1)continue;
        /* Flat under the hand and tapered at its edges, because that is the
           shape of a hand. A dome that fell away from its centre left the
           floor of a stroke rippled at whatever spacing the browser happened
           to report the pointer at, since a column near one of those centres
           was pressed harder than a column between two. */
        var bite=distance<.5?1:.5+.5*Math.cos((distance-.5)*2*Math.PI);
        target=heights[i]+(floor-heights[i])*bite*strength;
        if(target>=heights[i])continue;
        moved+=heights[i]-target;heights[i]=target;packed[i]=1;
      }
      if(moved<=0)return 0;
      /* The snow goes the way the hand is going. A hand crossing the window
         is a plough: what it takes up is carried in front of it, taken up
         again by its next step and carried on, until what is left of it banks
         at the end of the stroke. Sharing it evenly to both sides instead
         dropped a load into the groove just cleared, five steps behind — and
         since the ring lands on whole columns, the load fell on every third
         or fourth of them, which is the sawtooth a quick swipe used to leave.
         A hand pressed straight down is going nowhere and squeezes the snow
         out to both sides, which is what a lean of nought gives. */
      var tip=Math.max(-1,Math.min(1,lead||0));
      for(i=lo;i<=hi;i++){
        distance=Math.abs(i/last-fraction)/span;
        if(distance>=1)weight+=(.5+.5*Math.cos((distance-1)*Math.PI))*(1+(i/last>=fraction?tip:-tip));
      }
      if(weight<=0)return moved;
      /* Only a fifth of it banks: snow wiped off a pane mostly leaves the
         pane, and a plough takes its load up and drops it again at every
         step, so keeping much of it built a tower rather than a bank.
         The bank is loose — only the face the hand cut is packed. Marking the
         ridge packed too froze the peaks and pits that overlapping passes
         leave in it, and a sawtooth is not a bank of snow; left loose it
         slumps into one within a frame or two, while the trench beneath it
         still holds, because the pair either side of that edge is packed. */
      for(i=lo;i<=hi;i++){
        distance=Math.abs(i/last-fraction)/span;
        if(distance<1)continue;
        heights[i]=Math.min(cap,heights[i]+moved*.2*
          (.5+.5*Math.cos((distance-1)*Math.PI))*(1+(i/last>=fraction?tip:-tip))/weight);
      }
      return moved;
    }
    function deepest(){
      var most=0;
      for(var i=0;i<count;i++)if(heights[i]>most)most=heights[i];
      return most;
    }
    return {heights:heights,setLimit:setLimit,grow:grow,settle:settle,
      heightAt:heightAt,carve:carve,deepest:deepest};
  }
  if(typeof module!=='undefined' && module.exports) module.exports={createDrift:createDrift};
  if(typeof document==='undefined') return;
  var button=document.getElementById('let-it-snow');
  if(!button) return;
  var rainButton=document.getElementById('let-it-rain');
  var canvas, context, bank, bankContext, flakes=[], drift;
  var active=false, frame=0, fadeTimer=0, lastTime=0, bankAge=0;
  var mode='snow', intensity=1, splashes=[];
  var width=0,height=0,density=1,ground=0;
  var geometryDirty=true, bankDirty=true, observer;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  var MAX_PARTICLES=110;
  /* Light snow settles along the foot of the window; heavy snow is allowed
     the whole of it, writing included. Whoever wants the words back wipes
     them clear with a finger or the mouse. */
  function snowLimit(){return intensity===2?height:height*.18;}
  function snowRate(){return intensity===2?8:1.8;}
  function seedWeather(){
    var count=Math.min(MAX_PARTICLES,Math.max(36,Math.round(width*.075)));
    if(intensity===2)count=Math.min(mode==='rain'?480:360,Math.max(160,Math.round(width*.32)));
    if(reduce.matches)count=Math.round(count*.45);
    flakes=[];
    for(var i=0;i<count;i++)flakes.push(makeFlake(true));
  }
  function updateButtons(){
    [[button,'snow'],[rainButton,'rain']].forEach(function(pair){
      var control=pair[0],kind=pair[1];if(!control)return;
      var level=active && mode===kind?intensity:0;
      var label=level===0?'Let it '+kind:level===1?'Light '+kind+'. Click for heavy '+kind:
        'Heavy '+kind+'. Click to '+(kind==='snow'?'let it melt':'stop the rain');
      control.dataset.weatherLevel=String(level);
      control.setAttribute('aria-pressed',String(level>0));
      control.setAttribute('aria-label',label);control.title=label;
    });
  }
  function cycle(kind){
    if(!active || mode!==kind){start(kind);return;}
    if(intensity===2){stop();return;}
    intensity=2;geometryDirty=true;seedWeather();updateButtons();
  }
  /* The snow lies on the window, not on the page under it, so nothing here
     depends on where anything has scrolled to: one pass, on a resize only.
     The footer's own controls stay above the canvas by z-index instead of by
     cutting holes in the drift, which is what a reader's finger is for now. */
  function measure(){
    geometryDirty=false;
    var nextWidth=document.documentElement.clientWidth || window.innerWidth;
    var nextHeight=window.innerHeight;
    if(nextWidth!==width || nextHeight!==height){
      width=nextWidth; height=nextHeight;
      density=Math.min(window.devicePixelRatio || 1,2,Math.sqrt(3000000/Math.max(1,width*height)));
      [canvas,bank].forEach(function(layer){
        layer.width=Math.max(1,Math.round(width*density));
        layer.height=Math.max(1,Math.round(height*density));
      });
      context.setTransform(density,0,0,density,0,0);
      bankContext.setTransform(density,0,0,density,0,0);
      // Resizing never creates more particles; a new page still has one loop.
      flakes.forEach(function(flake){ if(flake.x>width) flake.x=Math.random()*width; });
    }
    ground=height;
    drift.setLimit(snowLimit(),width);
    bankDirty=true;
  }
  function remeasure(){ if(geometryDirty) measure(); }
  function makeFlake(anywhere){
    var depth=Math.random(),heavy=intensity===2;
    if(mode==='rain'){
      /* Squaring depth puts most of the rain far away, where real rain mostly
         is. The three jitters are what keep it from looking drawn: drops at
         one depth no longer fall in lockstep, no two hold the light for the
         same length, and a gust moves each of them by its own amount, so the
         sheet leans instead of sliding. */
      var near=depth*depth;
      return {x:Math.random()*width,y:anywhere?Math.random()*height:-24,
        speed:(300+near*520)*(heavy?1.75:1)*(.85+Math.random()*.3),
        wind:(18+near*70)*(heavy?2.4:1)*(.8+Math.random()*.4),
        gust:.55+Math.random()*.9, blur:1.05+Math.random()*.35,
        thickness:(.5+near*.7)*(heavy?1.6:1),
        alpha:heavy?.22+near*.3:.16+depth*.24};
    }
    return {x:Math.random()*width,y:anywhere?Math.random()*height:-12,
      radius:(.7+depth*2.5)*(heavy?1.6:1),speed:(16+depth*32)*(heavy?2.2:1),phase:Math.random()*Math.PI*2,
      sway:(5+Math.random()*14)*(heavy?2:1),alpha:heavy?.7+depth*.3:.35+depth*.5};
  }
  function paintRain(dt,now){
    var motion=reduce.matches ? .45 : 1, heavy=intensity===2;
    /* Two gusts whose periods do not divide each other, so the wind wanders
       instead of returning on a count the eye can learn. */
    var swell=heavy?46:18;
    var wind=Math.sin(now*.00031)*swell+Math.sin(now*.00097+1.7)*swell*.45;
    context.lineCap='round';
    for(var i=0;i<flakes.length;i++){
      var drop=flakes[i];
      var dx=(drop.wind+wind*drop.gust)*dt*motion, dy=drop.speed*dt*motion;
      drop.x+=dx; drop.y+=dy;
      // Rain leaning hard enough to leave the frame re-enters from the far
      // side at the same height, which is what a continuous sheet does.
      if(drop.x>width+28)drop.x=-24; else if(drop.x<-28)drop.x=width+24;
      var landed=ground>=0 && ground<=height+1 && drop.y>=ground;
      if(landed || drop.y>height+24){
        if(landed && splashes.length<(heavy?60:24) && Math.random()<(heavy?.7:.35)){
          splashes.push({x:drop.x,y:ground-2,age:0,lifetime:.3+Math.random()*.25,
            reach:4+drop.thickness*3.5});
        }
        flakes[i]=makeFlake(false);continue;
      }
      /* The streak is the ground this drop just covered, held open a little
         the way a shutter holds it. It used to be a random length unrelated
         to the drop's speed, and at 30 fps a fast one crosses more than that
         between frames — which is why heavy rain arrived as dashes with gaps
         in them rather than as rain. Tying it to the step closes the gaps at
         any speed and any frame rate; the clamp keeps a stalled tab from
         drawing one long smear when it comes back. */
      var travel=Math.sqrt(dx*dx+dy*dy);
      var stretch=travel>0?Math.min(drop.blur,90/travel):0;
      context.beginPath();
      context.moveTo(drop.x-dx*stretch,drop.y-dy*stretch);context.lineTo(drop.x,drop.y);
      context.lineWidth=drop.thickness;
      context.strokeStyle=(heavy?'rgba(96,132,164,':'rgba(160,190,211,')+drop.alpha+')';context.stroke();
      // A brighter spine on the nearest drops only — enough to carry the
      // downpour on a light palette without painting every streak white.
      if(heavy && drop.thickness>1.35){
        context.lineWidth=drop.thickness*.4;
        context.strokeStyle='rgba(226,241,253,'+(drop.alpha*.85)+')';context.stroke();
      }
    }
    for(var j=splashes.length-1;j>=0;j--){
      var splash=splashes[j];splash.age+=dt;
      if(splash.age>=splash.lifetime){splashes.splice(j,1);continue;}
      var progress=splash.age/splash.lifetime,radius=1+progress*(splash.reach||8);
      context.beginPath();context.ellipse(splash.x,splash.y,radius,radius*.28,0,0,Math.PI*2);
      context.lineWidth=heavy?1.1:.7;
      context.strokeStyle=(heavy?'rgba(96,132,164,':'rgba(160,190,211,')+((heavy?.5:.3)*(1-progress))+')';context.stroke();
    }
  }
  function paintBank(){
    bankDirty=false;
    var ctx=bankContext, h=drift.heights, tallest=drift.deepest();
    ctx.clearRect(0,0,width,height);
    if(tallest<.5) return;
    var gradient=ctx.createLinearGradient(0,ground-tallest,0,ground);
    gradient.addColorStop(0,'rgba(251,253,255,.98)');
    gradient.addColorStop(.45,'rgba(238,245,251,.97)');
    gradient.addColorStop(1,'rgba(215,229,242,.98)');
    ctx.fillStyle=gradient;
    ctx.beginPath();ctx.moveTo(0,ground);
    for(var j=0;j<h.length;j++) ctx.lineTo(j/(h.length-1)*width,ground-h[j]);
    ctx.lineTo(width,ground);ctx.closePath();ctx.fill();
    // A thin cool lip keeps the surface legible against pale writing too.
    ctx.beginPath();
    for(var k=0;k<h.length;k++){
      var x=k/(h.length-1)*width,y=ground-h[k];
      if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=intensity===2?'rgba(100,139,170,.65)':'rgba(145,174,198,.4)';
    ctx.lineWidth=intensity===2?1.5:1;ctx.stroke();
  }
  function step(now){
    frame=0;
    if(!active || document.hidden) return;
    // 30 fps; reduced-motion uses fewer, slower flakes at 15 fps after opt-in.
    var interval=reduce.matches?1000/15:1000/30;
    if(lastTime && now-lastTime<interval){ frame=requestAnimationFrame(step);return; }
    var dt=lastTime?Math.min((now-lastTime)/1000,.1):0;
    lastTime=now;
    remeasure();
    context.clearRect(0,0,width,height);
    if(mode==='rain'){
      paintRain(dt,now);frame=requestAnimationFrame(step);return;
    }
    var breezeNow=Math.sin(now*.00013)*(intensity===2?24:5);
    drift.grow(dt,snowRate(),now,Math.max(-1,Math.min(1,breezeNow/26)));
    drift.settle(dt);
    bankAge+=dt;
    if(bankDirty || bankAge>.1){paintBank();bankAge=0;}
    context.drawImage(bank,0,0,bank.width,bank.height,0,0,width,height);
    var breeze=breezeNow;
    for(var i=0;i<flakes.length;i++){
      var flake=flakes[i], motion=reduce.matches ? .45 : 1;
      flake.phase+=dt*.7;
      flake.x+=(breeze+Math.sin(flake.phase)*flake.sway)*dt*motion;
      flake.y+=flake.speed*dt*motion;
      if(flake.x < -12) flake.x=width+10;
      if(flake.x > width+12) flake.x=-10;
      var snowTop=ground-drift.heightAt(flake.x/Math.max(1,width));
      if(flake.y>height+12 || (snowTop<=height && ground>=0 && flake.y+flake.radius>=snowTop)){
        flakes[i]=makeFlake(false);continue;
      }
      context.beginPath();context.arc(flake.x,flake.y,flake.radius,0,Math.PI*2);
      context.fillStyle='rgba(248,252,255,'+flake.alpha+')';context.fill();
      if(flake.radius>1.4 || intensity===2){context.lineWidth=intensity===2?1:.65;context.strokeStyle=intensity===2?'rgba(93,130,161,.65)':'rgba(138,165,188,.26)';context.stroke();}
    }
    frame=requestAnimationFrame(step);
  }
  function invalidate(){geometryDirty=true;}
  /* Where the hand was last seen, so a stroke can be a stroke. Dropped when
     the pointer has been away long enough that the next place it turns up is
     somewhere it went to rather than somewhere it passed through. */
  var trail=null, STROKE_GAP=260;
  function press(x,y,radius,strength,lead){
    /* Only a hand that has gone under the sill is dropped outright. Whether
       there is anything to take is the carve's question, column by column: a
       single test against the surface at the hand's own x used to answer it
       for the whole width of the hand, so a hand skimming a wavy drift bit in
       and out of it — and the lip each bite raised put the next one out of
       reach, which is what made a wipe come back a sawtooth. The 6px is the
       hand's own thickness: a graze takes the crest rather than nothing. */
    if(y>ground+40) return;
    if(drift.carve(x/width,ground-y-6,radius,strength,lead)>0) bankDirty=true;
  }
  function sweep(event){
    if(!active || mode!=='snow' || !width) return;
    var pressing=event.type==='pointerdown' || !!event.buttons;
    if(event.type==='pointermove' && event.pointerType!=='mouse' && !pressing) return;
    // A press aimed at a control is aimed at the control, not at the snow.
    if(event.type==='pointerdown' && event.target.closest &&
       event.target.closest('a,button,input,select,textarea')){trail=null;return;}
    remeasure();
    var now=event.timeStamp || Date.now(), x=event.clientX, y=event.clientY;
    var from=event.type!=='pointerdown' && trail && trail.id===event.pointerId &&
      now-trail.at<STROKE_GAP ? trail : null;
    trail={x:x,y:y,id:event.pointerId,at:now};
    /* A hand is not a series of dots. Pointer events arrive far apart when it
       moves quickly — further apart than the hand is wide — and wiping only
       where they landed left the row of scallops this used to draw. The whole
       segment between two of them is wiped instead, at the depth the hand was
       passing through along the way. */
    var radius=Math.min(.25,55/width), reach=Math.max(6,radius*width*.2);
    var dx=from?x-from.x:0, dy=from?y-from.y:0, gone=Math.sqrt(dx*dx+dy*dy);
    var steps=from?Math.min(128,Math.max(1,Math.ceil(gone/reach))):1;
    // A press clears to the hand at once; a mouse merely passing over takes
    // the snow off in the couple of strokes a sleeve would.
    var strength=pressing?1:.6, lead=gone>0?dx/gone:0;
    for(var i=1;i<=steps;i++){
      var t=i/steps;
      press(from?from.x+dx*t:x,from?from.y+dy*t:y,radius,strength,lead);
    }
  }
  function visibility(){
    cancelAnimationFrame(frame);frame=0;lastTime=0;
    if(active && !document.hidden){geometryDirty=true;frame=requestAnimationFrame(step);}
  }
  function removeLayers(){
    if(canvas) canvas.remove();
    if(canvas) canvas.width=canvas.height=1;
    if(bank) bank.width=bank.height=1;
    canvas=context=bank=bankContext=null;flakes=[];splashes=[];drift=null;trail=null;
  }
  function stop(){
    active=false;cancelAnimationFrame(frame);frame=0;
    if(observer){observer.disconnect();observer=null;}
    window.removeEventListener('resize',invalidate);
    document.removeEventListener('pointermove',sweep);
    document.removeEventListener('pointerdown',sweep);
    document.removeEventListener('visibilitychange',visibility);
    updateButtons();
    canvas.classList.add('snow-melting');
    fadeTimer=setTimeout(removeLayers,reduce.matches?100:1400);
  }
  function start(kind){
    if(active)stop();
    clearTimeout(fadeTimer);removeLayers();
    mode=kind;intensity=1;trail=null;
    canvas=document.createElement('canvas');canvas.className='snowfall';
    canvas.setAttribute('aria-hidden','true');
    bank=document.createElement('canvas');
    context=canvas.getContext('2d');bankContext=bank.getContext('2d');
    if(!context || !bankContext){removeLayers();return;}
    document.body.appendChild(canvas);
    /* Enough columns that a drift has a shape, few enough that slumping it
       every frame is nothing. */
    drift=createDrift(Math.max(64,Math.min(220,Math.round((document.documentElement.clientWidth||window.innerWidth||960)/8))));
    width=height=0;geometryDirty=true;measure();
    seedWeather();
    active=true;lastTime=0;bankAge=0;
    updateButtons();
    window.addEventListener('resize',invalidate,{passive:true});
    document.addEventListener('pointermove',sweep,{passive:true});
    document.addEventListener('pointerdown',sweep,{passive:true});
    document.addEventListener('visibilitychange',visibility);
    if(typeof ResizeObserver!=='undefined'){
      observer=new ResizeObserver(invalidate);observer.observe(document.documentElement);
    }
    if(!document.hidden)frame=requestAnimationFrame(step);
  }
  button.addEventListener('click',function(){cycle('snow');});
  if(rainButton){
    rainButton.addEventListener('click',function(){cycle('rain');});
    rainButton.hidden=false;
  }
  button.hidden=false;
})();
