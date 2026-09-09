const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {createDrift}=require('../js/let-it-snow.js');
const root=path.join(__dirname,'..');

// Eight hours of watching still fits within the footer plus 24 px.
const drift=createDrift(81);
drift.setLimit(264);drift.advance(8*60*60);
assert(drift.heights.every(h=>h>=0 && h<=264));
assert(Math.max(...drift.heights)>240);
const before=drift.heightAt(.5),edge=drift.heightAt(0);
drift.brush(.5,.08,40);
assert(drift.heightAt(.5)<before);assert.equal(drift.heightAt(0),edge);
drift.advance(30);assert(drift.heightAt(.5)>before-40);
drift.setLimit(124);assert(drift.heights.every(h=>h<=124));

function check(reduced,width){
  const html='<main id="main"></main>'+fs.readFileSync(path.join(root,'_includes/footer.html'),'utf8').replace(/\{%[\s\S]*?%\}/g,'');
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  const frames=new Map(),timers=new Map();let id=0,arcs=0,observing=0,strokes=0,ripples=0,bankTop=800;
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
  const ctx={setTransform(){},clearRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){strokes++;},save(){},restore(){},fillRect(){},arc(){arcs++;},ellipse(){ripples++;},createLinearGradient(x,y){bankTop=y;return {addColorStop(){}};}};
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
  paint(40500);const lightTop=bankTop;
  button.click();assert.equal(button.dataset.weatherLevel,'2');assert.match(button.title,/Heavy snow/);
  assert.equal(frames.size,1);assert.equal(timers.size,0);
  assert.equal(w.document.querySelector('canvas'),canvas);
  const lightArcs=arcs;paint(41000);
  assert(arcs-lightArcs>particleCount);assert(arcs-lightArcs<=360);
  assert(bankTop<=lightTop); // Escalation preserves the existing snow bank.
  for(let i=1;i<=900;i++){paint(41000+i*80);assert.equal(frames.size,1);}
  assert(bankTop>=400 && bankTop<410); // Heavy snow settles at half the viewport.
  w.innerHeight=600;w.dispatchEvent(new w.Event('resize'));paint(114000);
  assert(bankTop>=500); // A smaller viewport immediately lowers the cap.
  w.innerHeight=800;w.dispatchEvent(new w.Event('resize'));
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
    assert.equal(frames.size,1);assert(ripples-previousRipples<=24);assert(strokes-oldStrokes<=134);
  }
  assert(strokes>previousStrokes);assert.equal(arcs,previousArcs);
  rainButton.click();assert.equal(rainButton.dataset.weatherLevel,'2');assert.match(rainButton.title,/Heavy rain/);
  assert.equal(frames.size,1);assert.equal(timers.size,0);
  const lightStrokes=strokes;paint(115000);
  assert(strokes-lightStrokes>particleCount*2);assert(strokes-lightStrokes<=1020);
  for(let i=1;i<300;i++){
    const previousRipples=ripples,oldStrokes=strokes;paint(115000+i*80);
    assert.equal(frames.size,1);assert(ripples-previousRipples<=60);assert(strokes-oldStrokes<=1020);
  }
  rainButton.click();assert.equal(frames.size,0);assert.equal(rainButton.getAttribute('aria-pressed'),'false');
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

/* Scrolling must not cost a layout pass. The footer moves under the snow, so
   its own box is read every frame; its contents keep their sizes and their
   selectors, and while the footer is off screen there is no bank to cut them
   out of at all. */
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
assert.equal(away.rects,60,'off screen, a scrolled frame reads the footer box and nothing else');
assert.equal(away.queries,0,'and matches no selectors at all');
assert.equal(near.queries,0,'on screen the clearings still move, but the list of them is not rebuilt');
assert.ok(near.rects<=300,'and each one is read once per frame');
console.log('Weather checks passed: three-stage cycles, preserved snow, half-screen cap and resize, rain/splash limits, exclusive switching, mobile bounds, reduced motion, scroll cost and cleanup.');
