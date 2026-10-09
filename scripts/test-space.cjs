'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'_site/pictures/space/index.html'),'utf8');
function page(modal=true,hash='') {
 const dom=new JSDOM(html,{url:'https://hakanaltun.io/pictures/space/'+hash,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=modal?function(){this.open=true}:undefined;
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 w.eval(fs.readFileSync(path.join(root,'js/pictures.js'),'utf8'));w.eval(fs.readFileSync(path.join(root,'js/space.js'),'utf8'));
 return {dom,w,d};
}
(async()=>{
 const ids=['earth','oceans','atmosphere','iss','moon','maria','craters','mars','olympus','valles','polar-cap','jupiter','cloud-bands','red-spot','io','europa'];
 {
  const {dom,d}=page(false);
  assert.equal(d.body.classList.contains('picture-ready'),false);
  assert.equal(d.querySelectorAll('[data-scene]').length,5);
  for(const id of ids)assert.ok(d.querySelector('#note-'+id+' a[href^="https://"]'));
  // A world that can be visited is named once in its list; "go there" travels.
  for(const li of d.querySelectorAll('.journey-choices li'))assert.ok(li.querySelectorAll('[data-detail]').length<=1&&!/Travel to/.test(li.textContent));
  assert.equal(d.querySelectorAll('.journey-choices .journey-choice-travel').length,d.querySelectorAll('.journey-destination').length);
  // Inside a sentence a name keeps a lower-case "the".
  for(const el of d.querySelectorAll('[aria-label]'))assert.doesNotMatch(el.getAttribute('aria-label'),/ The /);
  // The Great Red Spot's label sits beside the storm, clear of it at every width.
  assert.ok(d.querySelector('#scene-jupiter [data-detail="red-spot"]').hasAttribute('data-label-gap'));
  dom.window.close();
 }
 {
  const {dom,w,d}=page();const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  assert.equal(frame.dataset.view,'vicinity');
  // The label opens information without travelling; its larger sibling travels.
  d.querySelector('#scene-vicinity .journey-label[data-detail="earth"]').click();
  assert.equal(dialog.open,true);assert.equal(frame.dataset.view,'vicinity');d.getElementById('picture-return').click();
  d.querySelector('#scene-vicinity .journey-destination[data-travel="earth"]').click();
  assert.equal(frame.dataset.view,'earth');assert.equal(dialog.open,false);
  assert.equal(d.getElementById('scene-vicinity').inert,true);
  assert.ok(d.querySelector('#scene-earth img').src.includes('near-earth'));
  for(const id of ['earth','oceans','atmosphere','iss']) {
   const trigger=d.querySelector('#scene-earth [data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-earth'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.querySelector('#scene-earth .journey-destination[data-travel="moon"]').click();
  assert.equal(frame.dataset.view,'moon');
  assert.equal(d.querySelectorAll('.journey-scene.is-current').length,1);
  for(const id of ['moon','maria','craters']) {
   d.querySelector('#scene-moon [data-detail="'+id+'"]').click();assert.equal(dialog.open,true);
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-moon'));
   d.getElementById('picture-return').click();
  }
  d.querySelector('#scene-moon .journey-destination[data-travel="mars"]').click();
  assert.equal(frame.dataset.view,'mars');
  for(const id of ['mars','olympus','valles','polar-cap']) {
   const trigger=d.querySelector('#scene-mars [data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'mars');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-mars'));
   assert.ok(d.querySelector('#picture-detail-content a[href^="https://"]'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  w.history.back();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'moon');
  w.history.forward();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'mars');
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'moon');
  d.querySelector('#scene-moon .journey-destination[data-travel="mars"]').click();
  d.querySelector('#scene-mars .journey-destination[data-travel="earth"]').click();assert.equal(frame.dataset.view,'earth');
  d.querySelector('#scene-earth .journey-destination[data-travel="moon"]').click();
  w.history.back();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'earth');
  w.history.forward();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'moon');
  d.querySelector('#scene-moon .journey-destination[data-travel="earth"]').click();assert.equal(frame.dataset.view,'earth');
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'vicinity');
  dom.window.close();
 }
 {
  const {dom,d}=page(true,'#scene-mars');const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  d.querySelector('#scene-mars .journey-destination[data-travel="jupiter"]').click();assert.equal(frame.dataset.view,'jupiter');
  for(const id of ['jupiter','cloud-bands','red-spot','io','europa']){
   const trigger=d.querySelector('#scene-jupiter .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'jupiter');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-jupiter'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'mars');
  d.querySelector('#scene-mars .journey-destination[data-travel="jupiter"]').click();
  d.querySelector('#scene-jupiter .journey-destination[data-travel="mars"]').click();assert.equal(frame.dataset.view,'mars');
  dom.window.close();
 }
 for(const id of ['earth','moon','mars','jupiter']){const {dom,d}=page(true,'#scene-'+id);assert.equal(d.getElementById('journey-frame').dataset.view,id);dom.window.close();}
 console.log('Connected space scenes passed: separate travel and information, scene-specific crops, sourced fallback, return routes, fresh notes, focus and history.');
})().catch(e=>{console.error(e);process.exitCode=1});
