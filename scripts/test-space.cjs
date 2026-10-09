/* Exercise the reader's travel, not a sequence of swapped illustrations. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'_site/pictures/space/index.html'),'utf8');
const pictures=fs.readFileSync(path.join(root,'js/pictures.js'),'utf8');
const camera=fs.readFileSync(path.join(root,'js/space.js'),'utf8');
function page(modal=true,hash='') {
 const dom=new JSDOM(html,{url:'https://hakanaltun.io/pictures/space/'+hash,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;
 w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=modal?function(){this.open=true}:undefined;
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 const frame=d.getElementById('journey-frame');
 Object.defineProperties(frame,{clientWidth:{value:900},clientHeight:{value:600}});
 w.eval(pictures);w.eval(camera);
 return {dom,w,d,frame};
}
(async()=>{
 {
  const {dom,d}=page(false);
  assert.equal(d.body.classList.contains('picture-ready'),false);
  for(const id of ['earth','moon','mars']) {
   const note=d.getElementById('note-'+id);
   assert.ok(note.querySelector('.picture-detail-body').textContent.trim());
   assert.ok(note.querySelector('a[href^="https://science.nasa.gov/"]'));
  }
  assert.equal(d.querySelector('.journey-navigation').hidden,true);
  dom.window.close();
 }
 {
  const {dom,w,d,frame}=page();
  const image=d.querySelector('.picture-image'),canvas=d.getElementById('journey-canvas');
  const source=image.src;
  assert.equal(frame.dataset.view,'overview');
  for(const id of ['earth','moon','mars']) {
   d.getElementById('journey-next').click();
   assert.equal(frame.dataset.view,id);
   assert.equal(w.location.hash,'#note-'+id);
   assert.equal(d.querySelector('.picture-image'),image,'the same painted image remains mounted');
   assert.equal(image.src,source);
   assert.notEqual(canvas.style.transform,'translate(0px,0px) scale(1)');
   assert.equal(canvas.querySelectorAll('[data-travel]:not([hidden])').length,1);
   d.getElementById('journey-read').click();
   const dialog=d.getElementById('picture-detail');
   assert.equal(dialog.open,true);
   assert.equal(dialog.scrollTop,0);
   assert.equal(dialog.querySelector('h2').textContent,d.querySelector('#note-'+id+' h2').textContent);
   dialog.scrollTop=200;d.getElementById('picture-return').click();
   assert.equal(d.activeElement,d.getElementById('journey-read'));
  }
  w.history.back();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'moon');
  w.history.forward();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'mars');
  d.getElementById('journey-next').click();assert.equal(frame.dataset.view,'overview');
  assert.equal(canvas.querySelectorAll('[data-travel]:not([hidden])').length,3);
  dom.window.close();
 }
 {
  const {dom,frame}=page(true,'#note-mars');assert.equal(frame.dataset.view,'mars');dom.window.close();
 }
 console.log('Watercolor journey passed: one unchanged painting, three viewpoints, sourced fallback, continuous camera, fresh notes, return focus, shared addresses and browser history.');
})().catch(e=>{console.error(e);process.exitCode=1});
