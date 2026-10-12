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
 const ids=['earth','oceans','atmosphere','iss','moon','maria','craters','mars','olympus','valles','polar-cap','jupiter','cloud-bands','red-spot','io','europa','saturn','saturn-rings','cassini-division','titan','enceladus','uranus','uranus-tilt','uranus-rings','miranda','neptune','neptune-color','dark-spot','triton','triton-streaks','pluto','sputnik-planitia','charon','charon-pole','venus','venus-clouds','venus-spin','venus-phases','magellan','mercury','caloris','mercury-day','mercury-ice','sun','asteroid-belt','ceres','occator','vesta','kuiper-belt','arrokoth','arrokoth-neck','arrokoth-color','voyager-1','voyager-2','heliopause','golden-record','voyager-power','pale-blue-dot','voyager-distance'];
 {
  const {dom,d}=page(false);
  assert.equal(d.body.classList.contains('picture-ready'),false);
  assert.equal(d.querySelectorAll('[data-scene]').length,16);
  for(const id of ids)assert.ok(d.querySelector('#note-'+id+' a[href^="https://"]'));
  // Shared pages show the opening scene.
  assert.ok(d.querySelector('meta[property="og:image"]').content.endsWith('/pictures/space/assets/earth-vicinity-v2-watercolor.webp'));
  // The note on the picture and its sources reads as paragraphs.
  assert.ok(d.querySelectorAll('.picture-about > p').length>=6);
  assert.match(d.querySelector('.picture-about').textContent,/Both Voyagers continue outward/);
  // Phone offsets for crowded labels live beside each spot, not in the stylesheet.
  const oceans=d.querySelector('#scene-earth .journey-label[data-detail="oceans"]').getAttribute('style');
  assert.match(oceans,/--hint-x:-15px/);assert.match(oceans,/--hint-y:20px/);
  assert.doesNotMatch(fs.readFileSync(path.join(root,'css/space.css'),'utf8'),/#scene-/);
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
  // The outgoing dark image stays opaque while the next scene loads;
  // only after load does it fade, never exposing the pale page beneath.
  const {dom,w,d}=page();
  const old=d.getElementById('scene-vicinity'), nextScene=d.getElementById('scene-earth');
  const image=nextScene.querySelector('img');
  Object.defineProperty(image,'complete',{value:false,configurable:true});
  d.getElementById('journey-next').click();
  assert.ok(old.classList.contains('is-leaving'));
  assert.ok(!old.classList.contains('is-fading'),'old painting remains fully opaque until the next loads');
  assert.ok(nextScene.classList.contains('is-current'));
  image.dispatchEvent(new w.Event('load'));
  assert.ok(old.classList.contains('is-fading'),'fade begins after new picture loads');
  // A label fading inside the old scene, under the pointer that chose the
  // way on, does not cut the fade short.
  old.querySelector('.picture-hotspot-label').dispatchEvent(new w.Event('transitionend',{bubbles:true}));
  assert.ok(old.classList.contains('is-leaving'),'the old painting keeps fading while a label inside it fades');
  old.dispatchEvent(new w.Event('transitionend'));
  assert.ok(!old.classList.contains('is-leaving'),'old picture is removed after crossfade');
  const css=fs.readFileSync(path.join(root,'css/space.css'),'utf8');
  assert.match(css,/\.journey-scene\.is-leaving\.is-fading\s*\{\s*opacity:0/);
  assert.doesNotMatch(css,/keyframes journey-arrive/,'the old fade-through-background is gone');
  dom.window.close();
 }
 {
  const {dom,w,d}=page();const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  assert.equal(frame.dataset.view,'vicinity');
  // Beneath the picture the way on is named beside the way back, so the next
  // world never has to be found by touching it.
  const back=d.getElementById('journey-back'),next=d.getElementById('journey-next');
  assert.equal(back.hidden,true);assert.equal(next.hidden,false);assert.equal(next.getAttribute('href'),'#scene-earth');assert.match(next.textContent,/Earth/);
  for(const [from,to] of [['vicinity','earth'],['earth','moon'],['moon','mars'],['mars','asteroid-belt'],['asteroid-belt','jupiter'],['jupiter','saturn'],['saturn','uranus'],['uranus','neptune'],['neptune','pluto'],['pluto','kuiper-belt'],['kuiper-belt','voyager-2'],['voyager-2','deep-space'],['deep-space','voyager-1']]){
   assert.equal(frame.dataset.view,from);next.click();assert.equal(frame.dataset.view,to);assert.equal(back.hidden,false);
  }
  // Voyager 1 continues outward; Earth remains available behind it.
  assert.equal(next.hidden,false);assert.equal(next.getAttribute('href'),'#scene-deep-space');assert.match(next.textContent,/^Deep space/);
  assert.equal(back.getAttribute('href'),'#scene-earth');
  w.history.back();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'deep-space');assert.equal(next.hidden,false);
  w.history.go(-12);await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'vicinity');
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
  d.querySelector('#scene-mars .journey-destination[data-travel="asteroid-belt"]').click();assert.equal(frame.dataset.view,'asteroid-belt');
  for(const id of ['asteroid-belt','ceres','occator','vesta']){
   const trigger=d.querySelector('#scene-asteroid-belt .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'asteroid-belt');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('asteroid-belt-watercolor'));
   assert.ok(d.querySelector('#picture-detail-content a[href^="https://"]'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.querySelector('#scene-asteroid-belt .journey-destination[data-travel="jupiter"]').click();assert.equal(frame.dataset.view,'jupiter');
  for(const id of ['jupiter','cloud-bands','red-spot','io','europa']){
   const trigger=d.querySelector('#scene-jupiter .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'jupiter');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-jupiter'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'asteroid-belt');
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'mars');
  d.querySelector('#scene-mars .journey-destination[data-travel="asteroid-belt"]').click();
  d.querySelector('#scene-asteroid-belt .journey-destination[data-travel="jupiter"]').click();
  d.querySelector('#scene-jupiter .journey-destination[data-travel="asteroid-belt"]').click();assert.equal(frame.dataset.view,'asteroid-belt');
  d.querySelector('#scene-asteroid-belt .journey-destination[data-travel="mars"]').click();assert.equal(frame.dataset.view,'mars');
  dom.window.close();
 }
 {
  const {dom,d}=page(true,'#scene-jupiter');const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  d.querySelector('#scene-jupiter .journey-destination[data-travel="saturn"]').click();assert.equal(frame.dataset.view,'saturn');
  for(const id of ['saturn','saturn-rings','cassini-division','titan','enceladus']){
   const trigger=d.querySelector('#scene-saturn .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'saturn');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-saturn'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.querySelector('#scene-saturn .journey-destination[data-travel="jupiter"]').click();assert.equal(frame.dataset.view,'jupiter');
  dom.window.close();
 }
 {
  const {dom,d}=page(true,'#scene-saturn');const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  d.querySelector('#scene-saturn .journey-destination[data-travel="uranus"]').click();assert.equal(frame.dataset.view,'uranus');
  for(const id of ['uranus','uranus-tilt','uranus-rings','miranda']){
   const trigger=d.querySelector('#scene-uranus .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'uranus');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-uranus'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.querySelector('#scene-uranus .journey-destination[data-travel="saturn"]').click();assert.equal(frame.dataset.view,'saturn');
  dom.window.close();
 }
 {
  const {dom,d}=page(true,'#scene-uranus');const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  d.querySelector('#scene-uranus .journey-destination[data-travel="neptune"]').click();assert.equal(frame.dataset.view,'neptune');
  for(const id of ['neptune','neptune-color','dark-spot','triton','triton-streaks']){
   const trigger=d.querySelector('#scene-neptune .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'neptune');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-neptune'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.querySelector('#scene-neptune .journey-destination[data-travel="uranus"]').click();assert.equal(frame.dataset.view,'uranus');
  dom.window.close();
 }
 {
  const {dom,d}=page(true,'#scene-neptune');const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  d.querySelector('#scene-neptune .journey-destination[data-travel="pluto"]').click();assert.equal(frame.dataset.view,'pluto');
  for(const id of ['pluto','sputnik-planitia','charon','charon-pole']){
   const trigger=d.querySelector('#scene-pluto .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'pluto');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-pluto'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.querySelector('#scene-pluto .journey-destination[data-travel="neptune"]').click();assert.equal(frame.dataset.view,'neptune');
  dom.window.close();
 }
 {
  const {dom,d}=page(true,'#scene-pluto');const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  d.querySelector('#scene-pluto .journey-destination[data-travel="kuiper-belt"]').click();assert.equal(frame.dataset.view,'kuiper-belt');
  for(const id of ['kuiper-belt','arrokoth','arrokoth-neck','arrokoth-color']){
   const trigger=d.querySelector('#scene-kuiper-belt .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'kuiper-belt');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('kuiper-belt-watercolor'));
   assert.ok(d.querySelector('#picture-detail-content a[href^="https://"]'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'pluto');
  d.getElementById('journey-next').click();assert.equal(frame.dataset.view,'kuiper-belt');
  d.querySelector('#scene-kuiper-belt .journey-destination[data-travel="pluto"]').click();assert.equal(frame.dataset.view,'pluto');
  dom.window.close();
 }
 {
  const {dom,d}=page(true,'#scene-kuiper-belt');const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  d.querySelector('#scene-kuiper-belt .journey-destination[data-travel="voyager-2"]').click();assert.equal(frame.dataset.view,'voyager-2');
  const scenes=[['voyager-2',['voyager-2']],['deep-space',['voyager-distance','heliopause']],['voyager-1',['voyager-1','golden-record','voyager-power','pale-blue-dot']]];
  for(const [scene,notes] of scenes){
   assert.equal(frame.dataset.view,scene);
   for(const id of notes){
    const trigger=d.querySelector('#scene-'+scene+' .journey-label[data-detail="'+id+'"]');trigger.click();
    assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,scene);
    assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes(scene+'-watercolor'));
    assert.ok(d.querySelector('#picture-detail-content a[href^="https://"]'));
    dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
   }
   if(scene!=='voyager-1')d.getElementById('journey-next').click();
  }
  // Each spacecraft keeps its own painting; the passage has two small navigation portraits.
  assert.notEqual(d.querySelector('#scene-voyager-1 img').src,d.querySelector('#scene-voyager-2 img').src);
  assert.equal(d.querySelectorAll('#scene-deep-space .journey-painted-world').length,2);
  d.querySelector('#scene-voyager-1 .journey-destination[data-travel="deep-space"]').click();assert.equal(frame.dataset.view,'deep-space');
  for(const id of ['voyager-2','voyager-1']){
   const label=d.querySelector('#scene-deep-space .journey-label[data-detail="'+id+'"]');label.click();
   assert.equal(dialog.open,true);assert.equal(frame.dataset.view,'deep-space');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes(id+'-watercolor'));
   d.getElementById('picture-return').click();assert.equal(d.activeElement,label);
   d.querySelector('#scene-deep-space .journey-destination[data-travel="'+id+'"]').click();assert.equal(frame.dataset.view,id);
   d.getElementById('journey-next').click();assert.equal(frame.dataset.view,'deep-space');
  }
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'voyager-2');
  d.querySelector('#scene-voyager-2 .journey-destination[data-travel="deep-space"]').click();assert.equal(frame.dataset.view,'deep-space');
  d.getElementById('journey-back').click();
  d.querySelector('#scene-voyager-2 .journey-destination[data-travel="kuiper-belt"]').click();assert.equal(frame.dataset.view,'kuiper-belt');
  dom.window.close();
 }
 {
  // From Voyager 1 the back link and small Earth portrait lead home; forward leads outward.
  const {dom,w,d}=page(true,'#scene-voyager-1');const frame=d.getElementById('journey-frame'),next=d.getElementById('journey-next');
  assert.match(d.getElementById('journey-caption').textContent,/Earth behind it/);
  assert.equal(next.hidden,false);next.click();assert.equal(frame.dataset.view,'deep-space');
  w.history.back();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'voyager-1');
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'earth');
  assert.equal(d.getElementById('journey-branch').hidden,false,'home again, the inner branch is offered');
  w.history.back();await new Promise(r=>setTimeout(r,25));assert.equal(frame.dataset.view,'voyager-1');
  const home=d.querySelector('#scene-voyager-1 .journey-destination[data-travel="earth"]');
  assert.ok(home);assert.ok(d.querySelector('#scene-voyager-1 .journey-painted-world').getAttribute('style').includes('near-earth'));
  home.click();assert.equal(frame.dataset.view,'earth');
  dom.window.close();
 }
 {
  // A spacecraft's arrow and Deep space name are one link, never a modal.
  for(const id of ['voyager-1','voyager-2'])for(const part of ['span[aria-hidden]','span:not([aria-hidden])']){
   const {dom,d}=page(true,'#scene-'+id);
   const link=d.querySelector('#scene-'+id+' .journey-travel-link');
   assert.ok(link);assert.equal(link.getAttribute('href'),'#scene-deep-space');
   assert.equal(d.querySelector('#scene-'+id+' .journey-label[data-detail="voyager-distance"]'),null);
   const label=link.querySelector('.picture-hotspot-label');
   assert.match(label.textContent,/→\s*Deep space/);
   label.querySelector(part).click();
   assert.equal(d.getElementById('journey-frame').dataset.view,'deep-space');
   assert.equal(d.getElementById('picture-detail').open,false);
   dom.window.close();
  }
 }
 {
  // A note taller than the window keeps its close view at the top; a short one stays centered.
  const {dom,d}=page(true,'#scene-voyager-1');const dialog=d.getElementById('picture-detail');
  let tall=true;
  Object.defineProperty(dialog,'scrollHeight',{get:()=>tall?1400:600});Object.defineProperty(dialog,'clientHeight',{get:()=>850});
  d.querySelector('#scene-voyager-1 .journey-label[data-detail="golden-record"]').click();assert.equal(dialog.classList.contains('is-long'),true);
  d.getElementById('picture-return').click();tall=false;
  d.querySelector('#scene-voyager-1 .journey-label[data-detail="voyager-power"]').click();assert.equal(dialog.classList.contains('is-long'),false);
  // The close view waits at the top only beside the text. On a phone it sits above the text and must scroll away with it.
  const css=fs.readFileSync(path.join(root,'css/space.css'),'utf8');
  const sticky=css.indexOf('.picture-dialog.is-long .picture-detail-image');
  assert.ok(sticky>0);assert.match(css.slice(css.lastIndexOf('@media',sticky),sticky),/^@media\(min-width:651px\) \{[^}]*$/);
  dom.window.close();
 }
 {
  // A browser's Back can blur the caption after the scene changes; focus comes back to it.
  const {dom,w,d}=page(true,'#scene-voyager-1');const caption=d.getElementById('journey-caption');
  d.getElementById('journey-next').click();assert.equal(d.activeElement,caption);
  caption.blur();assert.equal(d.activeElement,d.body);
  w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(d.activeElement,caption);
  dom.window.close();
 }
 {
  const {dom,d}=page(true,'#scene-earth');const frame=d.getElementById('journey-frame'),dialog=d.getElementById('picture-detail');
  assert.equal(d.getElementById('journey-branch').hidden,false);
  d.getElementById('journey-branch').click();assert.equal(frame.dataset.view,'venus');
  assert.equal(d.getElementById('journey-branch').hidden,true);
  for(const id of ['venus','venus-clouds','venus-spin','venus-phases','magellan']){
   const trigger=d.querySelector('#scene-venus .journey-label[data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'venus');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes('near-venus'));
   assert.ok(d.querySelector('#picture-detail-content a[href^="https://"]'));
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  d.querySelector('#scene-venus .journey-destination[data-travel="earth"]').click();assert.equal(frame.dataset.view,'earth');
  d.querySelector('#scene-earth .journey-destination[data-travel="venus"]').click();assert.equal(frame.dataset.view,'venus');
  d.getElementById('journey-next').click();assert.equal(frame.dataset.view,'mercury');
  for(const id of ['mercury','caloris','mercury-day','mercury-ice','sun']){
   const trigger=d.querySelector('#scene-mercury [data-detail="'+id+'"]');trigger.click();
   assert.equal(dialog.open,true);assert.equal(dialog.scrollTop,0);assert.equal(frame.dataset.view,'mercury');
   assert.ok(d.getElementById('picture-detail-image').style.backgroundImage.includes(id==='sun'?'sun-watercolor':'near-mercury'));
   assert.ok(d.querySelector('#picture-detail-content a[href^="https://"]'));
   if(id==='sun')assert.equal(d.querySelector('#picture-detail-content a[href="/pictures/sun/"]').textContent,'Go to The Sun');
   dialog.scrollTop=200;d.getElementById('picture-return').click();assert.equal(d.activeElement,trigger);
  }
  // A page destination must keep normal browser navigation, not enter the scene router.
  const sun=d.querySelector('#scene-mercury .journey-destination[href="/pictures/sun/"]');
  assert.equal(sun.hasAttribute('data-travel'),false);
  assert.equal(d.getElementById('journey-next').getAttribute('href'),'/pictures/sun/');
  for(const link of [sun,d.getElementById('journey-next')]){
   let clicked=false;
   link.addEventListener('click',e=>{clicked=true;assert.equal(e.defaultPrevented,false);e.preventDefault();});
   link.click();assert.equal(clicked,true);assert.equal(frame.dataset.view,'mercury');
  }
  d.getElementById('journey-back').click();assert.equal(frame.dataset.view,'venus');
  assert.equal(d.querySelector('#scene-pluto [data-travel="venus"]'),null);
  assert.equal(d.querySelector('#scene-venus [data-travel="pluto"]'),null);
  dom.window.close();
 }
 for(const id of ['earth','moon','mars','asteroid-belt','jupiter','saturn','uranus','neptune','pluto','kuiper-belt','voyager-2','deep-space','voyager-1','venus','mercury']){const {dom,d}=page(true,'#scene-'+id);assert.equal(d.getElementById('journey-frame').dataset.view,id);dom.window.close();}
 // Full screen and the places to look go along to the Sun's page and come back
 // with the way to Mercury; the address loses them on arrival.
 {
  const {dom,w,d}=page(true,'?screen=full&places=shown#scene-mercury');const visit=d.getElementById('picture-visit');
  assert.equal(d.getElementById('journey-frame').dataset.view,'mercury');
  assert.equal(visit.classList.contains('is-fullscreen'),true);assert.equal(visit.classList.contains('show-places'),true);
  assert.equal(w.location.pathname+w.location.search+w.location.hash,'/pictures/space/#scene-mercury');
  let carried=null;w.addEventListener('click',e=>{const link=e.target.closest('a');if(link){carried=link.getAttribute('href');e.preventDefault();}});
  for(const link of [d.querySelector('#scene-mercury .journey-destination[href="/pictures/sun/"]'),d.getElementById('journey-next')]){
   link.click();assert.equal(carried,'https://hakanaltun.io/pictures/sun/?screen=full&places=shown');
   await new Promise(r=>setTimeout(r,0));assert.equal(link.getAttribute('href'),'/pictures/sun/','the link keeps its own address');
  }
  // Travel inside the journey stays in the page.
  d.getElementById('journey-back').click();assert.equal(d.getElementById('journey-frame').dataset.view,'venus');assert.equal(visit.classList.contains('is-fullscreen'),true);
  dom.window.close();
 }
 console.log('Connected space scenes passed: separate travel and information, scene-specific crops, sourced fallback, the way back and the way on, the way home from Voyager 1, phone offsets beside their spots, long notes beside the text only, focus after Back, fresh notes, focus and history, and full screen carried to the Sun and back.');
})().catch(e=>{console.error(e);process.exitCode=1});

