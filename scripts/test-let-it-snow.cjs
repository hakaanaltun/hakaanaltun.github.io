const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {createDrift}=require('../js/let-it-snow.js');
const root=path.join(__dirname,'..');

// Eight hours of watching still stays inside the window it lies in.
const drift=createDrift(120);
const fill=(seconds,now)=>{for(let t=0;t<seconds;t+=1/30){drift.grow(1/30,8,(now||0)+t*1000,.3);drift.settle(1/30);}};
drift.setLimit(600,1440);fill(8*60*60);
assert(drift.heights.every(h=>h>=0 && h<=600));
assert(Math.max(...drift.heights)>580,'it does reach the cap it is given');

// The surface is a surface, not a bar chart: neighbouring columns stay within
// the angle snow can hold, which is what makes a drift read as a drift.
const step=1440/119*.7;
const roughness=()=>{let worst=0;for(let i=0;i<drift.heights.length-1;i++)worst=Math.max(worst,Math.abs(drift.heights[i]-drift.heights[i+1]));return worst;};
assert.ok(roughness()<=step+.001,'settled within the angle of repose: '+roughness().toFixed(2)+' vs '+step.toFixed(2));

// A hand clears the snow down to itself and no further: it is the depth the
// hand is at that decides how much comes off, not a fixed helping.
const before=drift.heightAt(.5),edge=drift.heightAt(0);
drift.carve(.5,before-120,.08,1);
assert(Math.abs(drift.heightAt(.5)-(before-120))<1,'cleared to the hand, not past it');
assert.equal(drift.heightAt(0),edge,'and nowhere near it stays untouched');
const graze=createDrift(120);graze.setLimit(600,1440);
for(let i=0;i<120;i++)graze.heights[i]=400;
graze.carve(.5,380,.08,1);
assert(Math.abs(graze.heightAt(.5)-380)<1,'a graze takes the crest only');
// The snow that comes off is pushed aside, not deleted: a ridge banks up
// along the shoulders of the stroke.
assert(graze.heightAt(.5+.12)>400,'a berm on one shoulder');
assert(graze.heightAt(.5-.12)>400,'and on the other');
assert.equal(graze.heightAt(0),400,'and none of it lands across the window');
// A cut wall stands. Poured snow slumps to its angle of repose, but a wiped
// stripe that flowed shut again would be water, not snow.
for(let t=0;t<1;t+=1/30)graze.settle(1/30);
assert(graze.heightAt(.5)<390,'the trench is still a trench a second later');
// And the fall closes it over rather than leaving it open for good.
fill(60);assert(drift.heightAt(.5)>before-120);
drift.setLimit(124,1440);assert(drift.heights.every(h=>h<=124),'a smaller window clamps what has already fallen');

// The drift is not the same shape every time: the pattern moves with the hours.
const shapeAt=now=>{const d=createDrift(120);d.setLimit(400,1440);
  for(let t=0;t<40;t+=1/30){d.grow(1/30,8,now+t*1000,.2);d.settle(1/30);}
  const top=Math.max(...d.heights);return [...d.heights].map(h=>h/top);};
const early=shapeAt(0),later=shapeAt(9e5);
let drifted=0;for(let i=0;i<early.length;i++)drifted+=Math.abs(early[i]-later[i]);
assert.ok(drifted/early.length>.01,'the surface changes over time, it is not one fixed wave');

function check(reduced,width){
  const height=800;   // the viewport the harness runs in
  const html='<main id="main"></main>'+fs.readFileSync(path.join(root,'_includes/footer.html'),'utf8').replace(/\{%[\s\S]*?%\}/g,'');
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  const frames=new Map(),timers=new Map();let id=0,arcs=0,observing=0,strokes=0,ripples=0,bankTop=800,bankPath=[],pen=[];
  w.innerWidth=width;w.innerHeight=800;w.devicePixelRatio=3;
  w.matchMedia=()=>({matches:reduced});
  w.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
  w.cancelAnimationFrame=id=>frames.delete(id);
  w.setTimeout=fn=>{timers.set(++id,fn);return id;};
  w.clearTimeout=id=>timers.delete(id);
  w.ResizeObserver=class{observe(){observing++;}disconnect(){observing=0;}};
  w.HTMLElement.prototype.getBoundingClientRect=function(){
    if(this.tagName==='FOOTER')return {left:0,right:width,top:560,bottom:800,width,height:240};
    return {left:width*.25,right:width*.75,top:630,bottom:660,width:width*.5,height:30};
  };
  const ctx={setTransform(){},clearRect(){},drawImage(){},closePath(){},save(){},restore(){},fillRect(){},
    beginPath(){pen=[];},moveTo(x,y){pen.push([x,y]);},lineTo(x,y){pen.push([x,y]);},
    // Only the drift's own outline has points in it; a flake is a bare arc.
    fill(){if(pen.length>2)bankPath=pen.slice();},
    stroke(){strokes++;},arc(){arcs++;},ellipse(){ripples++;},
    createLinearGradient(x,y){bankTop=y;return {addColorStop(){}};}};
  // How deep the snow lies at a given fraction across the window.
  const depthAt=(fraction,ground)=>{
    let best=null;
    for(const [x,y] of bankPath){if(best===null||Math.abs(x-fraction*width)<Math.abs(best[0]-fraction*width))best=[x,y];}
    return best?ground-best[1]:0;
  };
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.eval(fs.readFileSync(path.join(root,'js/let-it-snow.js'),'utf8'));
  const button=w.document.getElementById('let-it-snow');
  const rainButton=w.document.getElementById('let-it-rain');
  assert.equal(button.hidden,false);
  assert.equal(rainButton.hidden,false);
  assert.equal(frames.size,0);assert.equal(w.document.querySelectorAll('canvas').length,0);
  button.click();assert.equal(button.getAttribute('aria-pressed'),'true');
  assert.equal(frames.size,1);assert.equal(w.document.querySelectorAll('canvas').length,1);
  function paint(now){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}
  paint(100);const particleCount=arcs;assert(particleCount>0 && particleCount<=110);
  if(reduced)assert(particleCount<=50);
  for(let i=1;i<=500;i++){paint(100+i*80);assert.equal(frames.size,1);}
  const canvas=w.document.querySelector('canvas');assert(canvas.width*canvas.height<=3010000);
  Object.defineProperty(w.document,'hidden',{configurable:true,value:true});
  w.document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(frames.size,0);
  Object.defineProperty(w.document,'hidden',{configurable:true,value:false});
  w.document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(frames.size,1);
  const touch=new w.MouseEvent('pointerdown',{bubbles:true,cancelable:true,clientX:width*.5,clientY:795});
  w.document.body.dispatchEvent(touch);assert.equal(touch.defaultPrevented,false);
  paint(40500);const lightTop=bankTop,lightSide=depthAt(.05,height);
  // Light snow lies along the foot of the window and leaves the page readable.
  assert(lightTop>height*.8 && lightTop<height,'light snow keeps to the foot: '+lightTop.toFixed(1));
  assert(height-lightTop<=height*.18+1,'and within the depth it is allowed');
  button.click();assert.equal(button.dataset.weatherLevel,'2');assert.match(button.title,/Heavy snow/);
  assert.equal(frames.size,1);assert.equal(timers.size,0);
  assert.equal(w.document.querySelector('canvas'),canvas);
  const lightArcs=arcs;paint(41000);
  assert(arcs-lightArcs>particleCount);assert(arcs-lightArcs<=360);
  // Escalation preserves the existing snow bank. Read where no hand has been:
  // a berm one has just pushed up is still finding its own level.
  assert(depthAt(.05,height)>=lightSide-1);
  /* Heavy snow is allowed the whole window and now takes its time over it:
     at 3.5px a second that is a few minutes of watching rather than a minute
     and a half, so this is the same watching, run for as long as it takes. */
  const buried=41000+2400*80;
  for(let i=1;i<=2400;i++){paint(41000+i*80);assert.equal(frames.size,1);}
  // And it still gets there: writing included.
  assert(bankTop<height*.15,'heavy snow buries the page: '+bankTop.toFixed(1));
  // And a finger takes it off wherever it lies, not only down by the footer.
  const middle=depthAt(.5,height),side=depthAt(.05,height);
  const wipe=new w.MouseEvent('pointerdown',{bubbles:true,cancelable:true,clientX:width*.5,clientY:height*.4});
  w.document.body.dispatchEvent(wipe);paint(buried+1000);
  assert(depthAt(.5,height)<middle-5,'a touch high up in the drift clears it there too');
  assert(depthAt(.05,height)>=side-1,'and only where the finger went');
  assert.equal(wipe.defaultPrevented,false,'and never swallows the page\'s own clicks');
  // A drag is one stroke, not the two dots the browser happened to report:
  // the snow between where the hand was and where it now is goes too. A hand
  // is about 55px across, and this jump is far wider than that.
  const midway=depthAt(.28,height);
  const drag=new w.MouseEvent('pointermove',{bubbles:true,cancelable:true,
    clientX:width*.06,clientY:height*.4,buttons:1});
  Object.defineProperty(drag,'pointerType',{value:'mouse'});
  w.document.body.dispatchEvent(drag);paint(buried+1100);
  assert(depthAt(.28,height)<midway-5,'the whole stroke is wiped, not its ends: '+
    depthAt(.28,height).toFixed(1)+' from '+midway.toFixed(1));
  w.innerHeight=600;w.dispatchEvent(new w.Event('resize'));paint(buried+1900);
  assert(bankTop<=1); // A smaller window clamps what has already fallen.
  w.innerHeight=800;w.dispatchEvent(new w.Event('resize'));paint(buried+2000);
  /* A finger. The browser hands a touch that starts on the page to the
     page, as a scroll, and stops reporting where it went, so a sweep driven
     from pointer events alone kept the dab it began with and lost the rest.
     The snow takes the touch itself, and asks the browser to let it. */
  const finger=(type,points,target)=>{
    const event=new w.Event(type,{bubbles:true,cancelable:true});
    const list=points.map(point=>({identifier:point.id,clientX:point.x,clientY:point.y,
      target:target||w.document.body}));
    Object.defineProperty(event,'changedTouches',{value:list});
    Object.defineProperty(event,'touches',{value:list});
    return event;
  };
  const dabbed=depthAt(.7,height);
  w.document.body.dispatchEvent(finger('touchstart',[{id:1,x:width*.7,y:height*.45}]));
  paint(buried+2100);
  assert(depthAt(.7,height)<dabbed-5,'a finger put down in the drift clears it there');
  const swept=depthAt(.9,height);
  const across=finger('touchmove',[{id:1,x:width*.95,y:height*.45}]);
  w.document.body.dispatchEvent(across);paint(buried+2200);
  assert.equal(across.defaultPrevented,true,'and the page is asked not to scroll away under it');
  assert(depthAt(.9,height)<swept-5,'the whole sweep goes, not the ends of it: '+
    depthAt(.9,height).toFixed(1)+' from '+swept.toFixed(1));
  w.document.body.dispatchEvent(finger('touchend',[{id:1,x:width*.95,y:height*.45}]));
  // Up and down is a read, not a sweep: a page under heavy snow still scrolls.
  const standing=depthAt(.62,height);
  w.document.body.dispatchEvent(finger('touchstart',[{id:2,x:width*.62,y:height*.6}]));
  paint(buried+2300);
  const held=depthAt(.62,height);
  assert(held<standing-5,'the finger is on snow to begin with, and takes what it lands on');
  const down=finger('touchmove',[{id:2,x:width*.62,y:height*.9}]);
  w.document.body.dispatchEvent(down);paint(buried+2400);
  assert.equal(down.defaultPrevented,false,'a drag down the window is the page\'s own');
  assert(depthAt(.62,height)>=held-1,'and the drift keeps what it had');
  w.document.body.dispatchEvent(finger('touchend',[{id:2,x:width*.62,y:height*.9}]));
  // A hand on the glass is several fingers, and each carries its own stroke.
  const leftLanded=depthAt(.12,height),rightLanded=depthAt(.58,height);
  w.document.body.dispatchEvent(finger('touchstart',
    [{id:3,x:width*.12,y:height*.7},{id:4,x:width*.58,y:height*.7}]));
  paint(buried+2500);
  assert(depthAt(.12,height)<leftLanded-5 && depthAt(.58,height)<rightLanded-5,
    'two fingers, two places');
  const leftAhead=depthAt(.28,height),rightAhead=depthAt(.74,height);
  const pair=finger('touchmove',[{id:3,x:width*.38,y:height*.7},{id:4,x:width*.84,y:height*.7}]);
  w.document.body.dispatchEvent(pair);paint(buried+2600);
  assert.equal(pair.defaultPrevented,true);
  assert(depthAt(.28,height)<leftAhead-5,'the first hand takes its own line');
  assert(depthAt(.74,height)<rightAhead-5,'and the second takes its');
  /* A browser kept from scrolling a touch finishes the gesture the way it
     finishes a tap: with a click where the hand came up. A sweep is not a
     tap, and the page under the snow is full of links. */
  const aimed=new w.MouseEvent('click',{bubbles:true,cancelable:true,clientX:width*.1,clientY:height*.1});
  w.document.getElementById('main').dispatchEvent(aimed);
  assert.equal(aimed.defaultPrevented,false,'a click away from the hand is somebody aiming');
  const tail=new w.MouseEvent('click',{bubbles:true,cancelable:true,clientX:width*.84,clientY:height*.7});
  w.document.getElementById('main').dispatchEvent(tail);
  assert.equal(tail.defaultPrevented,true,'the click trailing a sweep never reaches the page');
  const second=new w.MouseEvent('click',{bubbles:true,cancelable:true,clientX:width*.84,clientY:height*.7});
  w.document.getElementById('main').dispatchEvent(second);
  assert.equal(second.defaultPrevented,false,'and only that one');
  w.document.body.dispatchEvent(finger('touchcancel',
    [{id:3,x:width*.38,y:height*.7},{id:4,x:width*.84,y:height*.7}]));
  /* A finger that lands on a control leaves it alone: heavy snow buries the
     page, and neither a link nor the way out of the snow is ever dug for.
     The dab is what a tap would have been, so the dab is what it gives up —
     a hand that goes on to sweep still sweeps, since a page that is mostly
     links would otherwise be a page with nowhere to wipe. */
  const tapped=depthAt(.5,height);
  w.document.body.dispatchEvent(finger('touchstart',[{id:5,x:width*.5,y:height*.92}],button));
  paint(buried+2700);
  assert(depthAt(.5,height)>=tapped-1,'a finger put on a control takes no snow with it');
  const sweptOn=depthAt(.3,height);
  const offButton=finger('touchmove',[{id:5,x:width*.2,y:height*.92}]);
  w.document.body.dispatchEvent(offButton);paint(buried+2800);
  assert.equal(offButton.defaultPrevented,true,'but a hand drawn off one is still a hand');
  assert(depthAt(.3,height)<sweptOn-5,'and it sweeps from where it started');
  w.document.body.dispatchEvent(finger('touchend',[{id:5,x:width*.2,y:height*.92}]));
  button.click();assert.equal(frames.size,0);assert.equal(observing,0);
  assert.equal(button.getAttribute('aria-pressed'),'false');assert.equal(timers.size,1);
  button.click();assert.equal(frames.size,1);assert.equal(timers.size,0);
  assert.equal(w.document.querySelectorAll('canvas').length,1);
  rainButton.click();
  assert.equal(button.getAttribute('aria-pressed'),'false');assert.equal(rainButton.getAttribute('aria-pressed'),'true');
  assert.equal(frames.size,1);assert.equal(timers.size,0);assert.equal(w.document.querySelectorAll('canvas').length,1);
  const previousArcs=arcs,previousStrokes=strokes;
  for(let i=0;i<500;i++){
    const previousRipples=ripples,oldStrokes=strokes;
    paint(50000+i*80);
    assert.equal(frames.size,1);assert(ripples-previousRipples<=40);assert(strokes-oldStrokes<=150);
  }
  assert(strokes>previousStrokes);assert.equal(arcs,previousArcs);
  rainButton.click();assert.equal(rainButton.dataset.weatherLevel,'2');assert.match(rainButton.title,/Heavy rain/);
  assert.equal(frames.size,1);assert.equal(timers.size,0);
  const lightStrokes=strokes;paint(115000);
  assert(strokes-lightStrokes>particleCount*2);assert(strokes-lightStrokes<=1020);
  for(let i=1;i<300;i++){
    const previousRipples=ripples,oldStrokes=strokes;paint(115000+i*80);
    assert.equal(frames.size,1);assert(ripples-previousRipples<=90);assert(strokes-oldStrokes<=1020);
  }
  /* Rain falls to the ground, and the ground is the end of the page rather
     than the foot of the window. Read from the middle of a long one and the
     drops go on down past the sill with nothing yet to hit; come to the end
     of it and they land. Heavy rain splashes on four drops in five, so a
     hundred frames without a single ring is the page held away, not a lull. */
  const longPage=(where)=>{
    Object.defineProperty(w.document.documentElement,'scrollHeight',{value:4000,configurable:true});
    Object.defineProperty(w,'pageYOffset',{value:where,configurable:true});
  };
  longPage(1200);
  const midPage=ripples,midStrokes=strokes;
  for(let i=0;i<100;i++)paint(140000+i*80);
  assert.equal(ripples,midPage,'halfway down a page the ground is still below the window');
  assert(strokes>midStrokes,'and the rain itself keeps falling past it');
  longPage(3200);   // 4000 of page, 800 of window: the end of it is in view
  for(let i=0;i<100;i++)paint(148000+i*80);
  assert(ripples>midPage,'at the end of the page the drops have something to land on');
  rainButton.click();assert.equal(frames.size,0);assert.equal(rainButton.getAttribute('aria-pressed'),'false');
  for(const callback of timers.values())callback();timers.clear();
  /* One sky, asked for directly. The essays' "read with rain" drives this
     same weather so a reading page has one rain and not two out of step, and
     it hears back about every change the footer makes — but never about a
     restart, which is a change of weather and not a moment of clear sky. */
  const heard=[];
  w.OLAE_WEATHER.watch((kind,level)=>heard.push((kind||'none')+':'+level));
  const sky=()=>{const s=w.OLAE_WEATHER.state();return (s.kind||'none')+':'+s.level;};
  assert.equal(sky(),'none:0');
  w.OLAE_WEATHER.set('rain',2);
  assert.equal(sky(),'rain:2');
  assert.equal(rainButton.dataset.weatherLevel,'2');
  assert.equal(w.document.querySelector('canvas').className,'snowfall weather-rain');
  w.OLAE_WEATHER.set('rain',1);
  assert.equal(sky(),'rain:1');
  assert.equal(rainButton.dataset.weatherLevel,'1');
  assert.equal(w.document.querySelectorAll('canvas').length,1,'a weight change is not a new canvas');
  button.click();   // snow, straight from rain: one restart, announced once
  assert.equal(w.document.querySelector('canvas').className,'snowfall');
  w.OLAE_WEATHER.set('rain',0);
  assert.equal(sky(),'none:0');
  assert.deepEqual(heard,['rain:2','rain:1','snow:1','none:0']);
  for(const callback of timers.values())callback();timers.clear();
  assert.equal(w.document.querySelectorAll('canvas').length,0);
  // A restart during the fade cannot leave a stale canvas, listener or timer.
  rainButton.click();button.click();
  assert.equal(frames.size,1);assert.equal(timers.size,0);assert.equal(w.document.querySelectorAll('canvas').length,1);
  assert.equal(button.getAttribute('aria-pressed'),'true');assert.equal(rainButton.getAttribute('aria-pressed'),'false');
  button.click();button.click();for(const callback of timers.values())callback();timers.clear();
  assert.equal(w.document.querySelectorAll('canvas').length,0);
  assert.equal(frames.size,0);assert.equal(observing,0);
  dom.window.close();
}
check(false,1440);check(false,390);check(true,390);

/* Snow lies on the window, not on the page under it, so scrolling costs it
   nothing at all: no box to read, no selector to match, no clearings to cut
   around footer lettering. It used to re-run the whole layout pass per frame. */
function scrollCost(footerTop){
  const dom=new JSDOM('<footer><a class="footer-home-link">h</a><p class="footer-credit">c</p><div class="footer-contact-links">l</div><div class="footer-actions-wrap">a</div><div class="footer-weather"><button id="let-it-snow" hidden></button><button id="let-it-rain" hidden></button></div></footer>',{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;let id=0,rects=0,queries=0;
  const frames=new Map(),timers=new Map();
  w.matchMedia=()=>({matches:false});
  w.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
  w.cancelAnimationFrame=i=>frames.delete(i);
  w.setTimeout=fn=>{timers.set(++id,fn);return id;};
  w.clearTimeout=i=>timers.delete(i);
  w.innerWidth=1200;w.innerHeight=800;
  Object.defineProperty(w.document.documentElement,'clientWidth',{value:1200});
  w.HTMLElement.prototype.getBoundingClientRect=function(){
    rects++;
    if(this.tagName==='FOOTER')return {left:0,right:1200,top:footerTop,bottom:footerTop+240,width:1200,height:240};
    return {left:300,right:900,top:footerTop+70,bottom:footerTop+100,width:600,height:30};
  };
  const all=w.Element.prototype.querySelectorAll;
  w.Element.prototype.querySelectorAll=function(){queries++;return all.apply(this,arguments);};
  const ctx={setTransform(){},clearRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},save(){},restore(){},fillRect(){},arc(){},ellipse(){},createLinearGradient(){return{addColorStop(){}};}};
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.eval(fs.readFileSync(path.join(root,'js/let-it-snow.js'),'utf8'));
  w.document.getElementById('let-it-snow').click();
  const paint=n=>{const cbs=[...frames.values()];frames.clear();cbs.forEach(fn=>fn(n));};
  paint(100);rects=0;queries=0;
  for(let i=1;i<=60;i++){w.dispatchEvent(new w.Event('scroll'));paint(100+i*40);}
  dom.window.close();
  return {rects,queries};
}
const away=scrollCost(2000),near=scrollCost(560);
assert.equal(away.rects,0,'a scrolled frame reads no layout at all');
assert.equal(away.queries,0,'and matches no selectors');
assert.equal(near.rects,0,'the same with the footer in view: the snow is on the window');
assert.equal(near.queries,0);
console.log('Weather checks passed: three-stage cycles, one shared sky for the footer and the essays, preserved snow, drift that covers the page and is wiped to the depth of the hand along a whole stroke by mouse or by finger, several fingers at once, a page that still scrolls under heavy snow, snow banked into berms rather than deleted, cut walls that stand and fill in, rain/splash limits, exclusive switching, mobile bounds, reduced motion, unbroken heavy rain, free scrolling and cleanup.');
