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
  const frames=new Map(),timers=new Map();let id=0,arcs=0,observing=0,strokes=0,ripples=0;
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
  const ctx={setTransform(){},clearRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){strokes++;},save(){},restore(){},fillRect(){},arc(){arcs++;},ellipse(){ripples++;},createLinearGradient(){return {addColorStop(){}};}};
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
  rainButton.click();assert.equal(frames.size,0);assert.equal(rainButton.getAttribute('aria-pressed'),'false');
  // A restart during the fade cannot leave a stale canvas, listener or timer.
  rainButton.click();button.click();
  assert.equal(frames.size,1);assert.equal(timers.size,0);assert.equal(w.document.querySelectorAll('canvas').length,1);
  assert.equal(button.getAttribute('aria-pressed'),'true');assert.equal(rainButton.getAttribute('aria-pressed'),'false');
  button.click();for(const callback of timers.values())callback();timers.clear();
  assert.equal(w.document.querySelectorAll('canvas').length,0);
  assert.equal(frames.size,0);assert.equal(observing,0);
  dom.window.close();
}
check(false,1440);check(false,390);check(true,390);
console.log('Weather checks passed: snow limits, brushing, rain/splash limits, exclusive switching, mobile bounds, reduced motion and cleanup.');
