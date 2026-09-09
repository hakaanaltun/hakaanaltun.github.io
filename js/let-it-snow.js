/* Local, opt-in weather. Bounded particles and drift, no network or storage. */
(function(){
  'use strict';
  function createDrift(count){
    var heights = new Float32Array(count), limits = new Float32Array(count);
    function setLimit(cap){
      for(var i=0;i<count;i++){
        var x=i/(count-1);
        limits[i]=Math.max(0,cap*(.88+.065*Math.sin(x*11+1.2)+.055*Math.sin(x*23+.4)));
        limits[i]=Math.min(cap,limits[i]);
        heights[i]=Math.min(heights[i],limits[i]);
      }
    }
    function advance(seconds){
      for(var i=0;i<count;i++){
        heights[i]=Math.min(limits[i],heights[i]+seconds*(1.9+.35*Math.sin(i*.17)));
      }
    }
    function heightAt(fraction){
      var p=Math.max(0,Math.min(1,fraction))*(count-1), i=Math.floor(p), next=Math.min(count-1,i+1);
      return heights[i]+(heights[next]-heights[i])*(p-i);
    }
    function brush(fraction,radius,amount){
      for(var i=0;i<count;i++){
        var distance=Math.abs(i/(count-1)-fraction)/radius;
        if(distance<1) heights[i]=Math.max(0,heights[i]-amount*(.5+.5*Math.cos(distance*Math.PI)));
      }
    }
    return {heights:heights,setLimit:setLimit,advance:advance,heightAt:heightAt,brush:brush};
  }
  if(typeof module!=='undefined' && module.exports) module.exports={createDrift:createDrift};
  if(typeof document==='undefined') return;
  var button=document.getElementById('let-it-snow');
  if(!button) return;
  var rainButton=document.getElementById('let-it-rain');
  var footer=button.closest('footer');
  if(!footer) return;
  var canvas, context, bank, bankContext, flakes=[], drift;
  var active=false, frame=0, fadeTimer=0, lastTime=0, bankAge=0;
  var mode='snow', intensity=1, splashes=[];
  var width=0,height=0,density=1,ground=0,footerHeight=0,holes=[];
  var geometryDirty=true, groundDirty=false, bankDirty=true, observer, holeElements=null;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  var MAX_PARTICLES=110;
  function snowLimit(){return intensity===2?height*.5:footerHeight+24;}
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
  /* The layout pass. Which things the drift leaves clear is a property of the
     layout, so the list is gathered here and not on every frame. */
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
    // Leave soft clearings around footer lettering and controls in every theme.
    // Only these small areas are cut out; the drift still reaches above the footer.
    holeElements=footer.querySelectorAll('.footer-home-link, .footer-credit, .footer-contact-links, .footer-actions-wrap, .snow-toggle');
    trackGround();
  }
  /* The scroll pass, and the only one a scroll needs: the footer keeps its
     size and its contents, it just moves. Cheap enough to run per frame. */
  function trackGround(){
    groundDirty=false;
    var rect=footer.getBoundingClientRect();
    ground=rect.bottom;
    footerHeight=rect.height;
    drift.setLimit(snowLimit());
    holes=[];
    // A bank nobody can see needs no clearings cut out of it, and while a
    // reader is still in the essay that is every frame of every scroll.
    if(holeElements && ground>=0 && ground-snowLimit()<=height){
      holeElements.forEach(function(el){
        var r=el.getBoundingClientRect();
        if(r.width && r.height) holes.push({x:r.left-9,y:r.top-5,w:r.width+18,h:r.height+10});
      });
    }
    bankDirty=true;
  }
  function remeasure(){
    if(geometryDirty) measure();
    else if(groundDirty) trackGround();
  }
  function makeFlake(anywhere){
    var depth=Math.random(),heavy=intensity===2;
    if(mode==='rain') return {x:Math.random()*width,y:anywhere?Math.random()*height:-24,
      speed:(340+depth*420)*(heavy?1.8:1),wind:(20+depth*65)*(heavy?2.5:1),length:(7+depth*15)*(heavy?2.4:1),
      thickness:(.55+depth*.65)*(heavy?1.7:1),alpha:heavy?.5+depth*.35:.16+depth*.24};
    return {x:Math.random()*width,y:anywhere?Math.random()*height:-12,
      radius:(.7+depth*2.5)*(heavy?1.6:1),speed:(16+depth*32)*(heavy?2.2:1),phase:Math.random()*Math.PI*2,
      sway:(5+Math.random()*14)*(heavy?2:1),alpha:heavy?.7+depth*.3:.35+depth*.5};
  }
  function paintRain(dt,now){
    var motion=reduce.matches ? .45 : 1;
    var wind=Math.sin(now*.0003)*25;
    context.lineCap='round';
    for(var i=0;i<flakes.length;i++){
      var drop=flakes[i];
      drop.x+=(drop.wind+wind)*dt*motion;
      drop.y+=drop.speed*dt*motion;
      if(drop.x>width+24)drop.x=-20;
      var landed=ground>=0 && ground<=height+1 && drop.y>=ground;
      if(landed || drop.y>height+24){
        if(landed && splashes.length<(intensity===2?60:24) && Math.random()<(intensity===2?.7:.35)){
          splashes.push({x:drop.x,y:ground-2,age:0,lifetime:.35+Math.random()*.2});
        }
        flakes[i]=makeFlake(false);continue;
      }
      var tailX=(drop.wind+wind)/drop.speed*drop.length;
      context.beginPath();context.moveTo(drop.x-tailX,drop.y-drop.length);context.lineTo(drop.x,drop.y);
      context.lineWidth=drop.thickness;
      context.strokeStyle=(intensity===2?'rgba(65,102,133,':'rgba(160,190,211,')+drop.alpha+')';context.stroke();
      // A bright core and blue outer stroke show the downpour on both palettes.
      if(intensity===2){context.lineWidth=drop.thickness*.35;context.strokeStyle='rgba(219,238,252,'+drop.alpha+')';context.stroke();}
    }
    for(var j=splashes.length-1;j>=0;j--){
      var splash=splashes[j];splash.age+=dt;
      if(splash.age>=splash.lifetime){splashes.splice(j,1);continue;}
      var progress=splash.age/splash.lifetime,radius=1+progress*8;
      context.beginPath();context.ellipse(splash.x,splash.y,radius,radius*.28,0,0,Math.PI*2);
      context.lineWidth=intensity===2?1.3:.7;context.strokeStyle=(intensity===2?'rgba(65,102,133,':'rgba(160,190,211,')+((intensity===2?.65:.3)*(1-progress))+')';context.stroke();
    }
  }
  function paintBank(){
    bankDirty=false;
    var ctx=bankContext, h=drift.heights;
    ctx.clearRect(0,0,width,height);
    if(ground<0 || ground-snowLimit()>height) return;
    var tallest=0;
    for(var i=0;i<h.length;i++) tallest=Math.max(tallest,h[i]);
    if(tallest<.5) return;
    var gradient=ctx.createLinearGradient(0,ground-tallest,0,ground);
    gradient.addColorStop(0,'rgba(251,253,255,.98)');
    gradient.addColorStop(.45,'rgba(238,245,251,.97)');
    gradient.addColorStop(1,'rgba(215,229,242,.98)');
    ctx.fillStyle=gradient;
    ctx.beginPath();ctx.moveTo(0,ground);
    for(var j=0;j<h.length;j++) ctx.lineTo(j/(h.length-1)*width,ground-h[j]);
    ctx.lineTo(width,ground);ctx.closePath();ctx.fill();
    // A thin cool lip keeps white snow visible on the light palettes too.
    ctx.beginPath();
    for(var k=0;k<h.length;k++){
      var x=k/(h.length-1)*width,y=ground-h[k];
      if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=intensity===2?'rgba(100,139,170,.65)':'rgba(145,174,198,.28)';ctx.lineWidth=intensity===2?1.5:1;ctx.stroke();
    ctx.save();ctx.globalCompositeOperation='destination-out';
    ctx.fillStyle='#000';ctx.shadowColor='#000';ctx.shadowBlur=18*density;
    holes.forEach(function(r){ctx.fillRect(r.x,r.y,r.w,r.h);});
    ctx.restore();
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
    drift.advance(dt*(intensity===2?7:1));bankAge+=dt;
    if(bankDirty || bankAge>.14){paintBank();bankAge=0;}
    context.drawImage(bank,0,0,bank.width,bank.height,0,0,width,height);
    var breeze=Math.sin(now*.00013)*(intensity===2?24:5);
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
  function trackScroll(){groundDirty=true;}
  function sweep(event){
    if(!active || mode!=='snow' || !width) return;
    if(event.type==='pointermove' && event.pointerType!=='mouse' && !event.buttons) return;
    remeasure();
    var fraction=event.clientX/width, snowTop=ground-drift.heightAt(fraction);
    if(event.clientY<snowTop-10 || event.clientY>ground) return;
    if(event.target.closest && event.target.closest('a,button,input,select,textarea')) return;
    drift.brush(fraction,Math.min(.25,55/width),event.type==='pointerdown'?28:9);
    bankDirty=true;
  }
  function visibility(){
    cancelAnimationFrame(frame);frame=0;lastTime=0;
    if(active && !document.hidden){geometryDirty=true;frame=requestAnimationFrame(step);}
  }
  function removeLayers(){
    if(canvas) canvas.remove();
    if(canvas) canvas.width=canvas.height=1;
    if(bank) bank.width=bank.height=1;
    canvas=context=bank=bankContext=null;flakes=[];splashes=[];drift=null;
  }
  function stop(){
    active=false;cancelAnimationFrame(frame);frame=0;
    if(observer){observer.disconnect();observer=null;}
    window.removeEventListener('resize',invalidate);
    window.removeEventListener('scroll',trackScroll);
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
    mode=kind;intensity=1;
    canvas=document.createElement('canvas');canvas.className='snowfall';
    canvas.setAttribute('aria-hidden','true');
    bank=document.createElement('canvas');
    context=canvas.getContext('2d');bankContext=bank.getContext('2d');
    if(!context || !bankContext){removeLayers();return;}
    document.body.appendChild(canvas);
    drift=createDrift(81);width=height=0;holeElements=null;geometryDirty=true;measure();
    seedWeather();
    active=true;lastTime=0;bankAge=0;
    updateButtons();
    window.addEventListener('resize',invalidate,{passive:true});
    window.addEventListener('scroll',trackScroll,{passive:true});
    document.addEventListener('pointermove',sweep,{passive:true});
    document.addEventListener('pointerdown',sweep,{passive:true});
    document.addEventListener('visibilitychange',visibility);
    if(typeof ResizeObserver!=='undefined'){
      observer=new ResizeObserver(invalidate);observer.observe(footer);
      var main=document.getElementById('main');if(main)observer.observe(main);
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
