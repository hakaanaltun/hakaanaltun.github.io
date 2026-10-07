/* Exercise the rendered instruments, including the shared observer lookup.
   CI runs this against Jekyll output, as it does the other instruments. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const built=process.env.WINDOW_SITE_ROOT||path.join(root,'_site');
const source=p=>fs.readFileSync(path.join(root,p),'utf8');
const FIXED='2026-10-07T04:08:00Z';
function page(slug,{city='istanbul',zone='Europe/Istanbul',instant=FIXED}={}){
  const dom=new JSDOM(fs.readFileSync(path.join(built,slug,'index.html'),'utf8'),{url:'https://hakanaltun.io/'+slug+'/?city='+city,runScripts:'outside-only'});
  const w=dom.window,NativeDate=w.Date,NativeIntl=w.Intl;
  w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return new NativeDate(instant).getTime();}};
  w.Intl={DateTimeFormat:function(...args){const fmt=new NativeIntl.DateTimeFormat(...args);if(!args.length)fmt.resolvedOptions=()=>({timeZone:zone});return fmt;}};
  w.setInterval=()=>0;
  w.document.querySelectorAll('script:not([src])').forEach(s=>{if(s.textContent.includes('OLAE_OBSERVER'))w.eval(s.textContent);});
  w.eval(source('js/astronomy.js'));
  if(slug==='stars'){w.eval(source('js/vendor/astronomy-engine-2.1.19.min.js'));w.eval(source('js/bright-stars.js'));}
  w.eval(source('js/sky-instruments.js'));
  return {dom,w,q:id=>w.document.getElementById(id)};
}
const rows=(p,id)=>[...p.q(id).querySelectorAll('.object-row')].map(r=>r.textContent);
const labels=p=>[...p.q('sky-map').querySelectorAll(':scope > text:not(.cardinal)')].map(t=>t.textContent);

// The star data: proper designations, IAU names, nothing the sky does not show.
{
  const context={window:{}};vm.createContext(context);
  vm.runInContext(source('js/bright-stars.js'),context);
  const stars=context.window.OLAE_STARS,lines=context.window.OLAE_CONSTELLATION_LINES;
  const byHr=new Map(stars.map(s=>[s[0],s]));
  assert(stars.length>900,'stars to magnitude 4.5');
  for(const s of stars){
    assert(s.length===5||s.length===6,'row shape '+s[0]);
    assert(s[1]>=0&&s[1]<24&&s[2]>=-90&&s[2]<=90,'position '+s[0]);
    assert(s[3]===null||typeof s[3]==='number','magnitude '+s[0]);
    assert.match(s[4],/^([α-ω][¹²³⁴⁵⁶⁷⁸⁹]*|\d+) [A-Z][A-Za-z]{2}$|^HR \d+$/,'designation '+s[4]);
  }
  for(const [hr,designation,name] of [[15,'α And','Alpheratz'],[936,'β Per','Algol'],[1791,'β Tau','Elnath'],[4915,'α² CVn','Cor Caroli'],[603,'γ¹ And','Almach'],[1903,'ε Ori','Alnilam']]){
    assert.equal(byHr.get(hr)[4],designation);assert.equal(byHr.get(hr)[5],name);
  }
  assert(!byHr.has(5958),'T CrB is not a second-magnitude star');
  assert(!byHr.has(7564),'chi Cyg is not drawn');
  assert.equal(byHr.get(681)[3],null,'Mira stays only as a point on its line');
  assert(Object.keys(lines).length===88&&lines.Ser.length===2,'every constellation, Serpens in two parts');
  for(const chain of Object.values(lines).flat())for(const hr of chain)assert(byHr.has(hr),'line star '+hr);
}
// The device's zone chooses a city, and the current instant is the default.
for(const [zone,name,time] of [['Europe/Istanbul','İstanbul','07:08'],['Europe/London','London','05:08'],['Australia/Sydney','Sydney','15:08']]){
  const p=page('sun',{city:'',zone});
  assert(p.q('place').textContent.startsWith(name),zone);
  assert(p.q('moment').textContent.includes(time),zone+' uses the local clock');
  assert.equal(p.q('sun-chart').querySelectorAll('.sun-marker').length,1);
  p.dom.window.close();
}
// URL choices override the device; unknown and inherited keys keep the
// explicitly nominal equatorial fallback rather than inventing a location.
for(const city of ['unlisted','__proto__','constructor']){
  const p=page('sun',{city,zone:'Etc/UTC'});
  assert(p.w.OLAE_OBSERVER.nominal);
  assert(p.q('place').textContent.includes('nominal'));
  p.dom.window.close();
}
// The sun below the horizon reads with a minus sign, and the path below
// is drawn as whole dashed runs either side of the day.
{
  const p=page('sun',{instant:'2026-10-07T20:30:00Z'});
  assert(p.q('height').textContent.startsWith('−'),'a true minus');
  assert([...p.q('sun-chart').querySelectorAll('text')].some(t=>t.textContent==='−90°'));
  assert.equal(p.q('sun-chart').querySelectorAll('.sun-path.below').length,2);
  assert.equal(p.q('sun-chart').querySelectorAll('.sun-path:not(.below)').length,1);
  p.dom.window.close();
}
{
  const p=page('stars');
  assert.equal(p.q('live').getAttribute('aria-pressed'),'true');
  assert(p.q('moment').textContent.includes('07:08'));
  assert.equal(Number(p.q('hour').value),0);
  assert(p.q('sky-map').querySelectorAll('.star').length>200);
  assert(p.q('sky-map').querySelector('path.constellation').getAttribute('d').length>100,'the figures');
  assert(p.q('constellations').children.length>0);
  // The slider looks ahead from now, through midnight if need be.
  p.q('hour').value=840;p.q('hour').dispatchEvent(new p.w.Event('input'));
  assert(p.q('moment').textContent.includes('21:10'));
  assert(p.q('moment').textContent.includes('in 14 h'));
  assert.equal(p.q('live').getAttribute('aria-pressed'),'false');
  assert(!p.q('sky-notice').textContent.includes('Daylight'));
  p.q('hour').value=1200;p.q('hour').dispatchEvent(new p.w.Event('input'));
  assert(p.q('moment').textContent.startsWith('October 8, 2026 · 03:10'),'tomorrow before dawn');
  p.q('hour').value=300;p.q('hour').dispatchEvent(new p.w.Event('input'));
  assert(p.q('sky-notice').textContent.includes('Daylight'));
  assert(p.q('sky-map').querySelector('.sun'),'the sun is drawn by day');
  p.q('live').click();assert(p.q('moment').textContent.includes('07:08'));
  p.dom.window.close();
}
// Before dawn the waning moon is up in the east, lit on the side of the
// sun below the eastern horizon: on a map seen from below, to the left.
{
  const p=page('stars',{instant:'2026-10-07T02:30:00Z'});
  assert.match(rows(p,'planets')[0],/^The MoonWaning crescent, \d+% lit\d+° E/);
  const turn=Number(p.q('sky-map').querySelector('.moon-lit').parentNode.getAttribute('transform').match(/rotate\((-?[\d.]+)\)/)[1]);
  assert(Math.cos(turn*Math.PI/180)<-0.7,'lit toward the east, not '+turn);
  assert(labels(p).includes('Moon'));
  assert(!p.q('sky-map').querySelector('.sun'),'no sun at night');
  assert(p.q('sky-notice').textContent.startsWith('Night'));
  p.dom.window.close();
}
// At midday Mercury and Venus stand close together: every planet keeps its
// label, and Boötes keeps its diaeresis.
{
  const p=page('stars',{instant:'2026-10-07T09:30:00Z'});
  const planets=rows(p,'planets').map(r=>r.match(/^(The Moon|Mercury|Venus|Mars|Jupiter|Saturn)/)[1]).filter(n=>n!=='The Moon');
  assert(planets.includes('Mercury')&&planets.includes('Venus'));
  for(const planet of planets)assert(labels(p).includes(planet),planet+' is labelled');
  assert(rows(p,'constellations').some(r=>r.startsWith('Boötes')));
  p.dom.window.close();
}
// A polar day and night give honest no-event labels and finite readings.
for(const [instant,hours] of [['2026-06-21T12:00:00Z','24 hours'],['2026-12-21T12:00:00Z','0 hours']]){
  const p=page('sun',{instant});
  p.w.OLAE_OBSERVER.city.lat=80;p.w.OLAE_OBSERVER.city.lng=0;
  p.w.eval(source('js/sky-instruments.js'));
  assert.equal(p.q('daylight').textContent,hours);
  assert(p.q('sunrise').textContent.includes('No sunrise'));
  assert(!p.q('height').textContent.includes('NaN'));
  p.dom.window.close();
}
// Compare the new bearing with an independently tested ephemeris. This
// guards hemisphere and north/south reversals in the shared solar math.
const context={window:{},Date,Intl};vm.createContext(context);
vm.runInContext(source('js/astronomy.js'),context);
vm.runInContext(source('js/vendor/astronomy-engine-2.1.19.min.js'),context);
const A=context.window.OLAE_ASTRO,E=context.window.Astronomy;
for(const [lat,lng] of [[41.015,28.979],[-33.869,151.209],[69.65,18.956],[0,0]])
for(const month of [0,3,6,9])for(const hour of [0,6,12,18]){
  const now=new Date(Date.UTC(2026,month,7,hour));
  const pos=A.sunPosition(now,lat,lng),obs=new E.Observer(lat,lng,0);
  const eq=E.Equator('Sun',now,obs,true,true),h=E.Horizon(now,obs,eq.ra,eq.dec,null);
  assert(Math.abs(pos.altitude-h.altitude)<.3);
  if(Math.abs(pos.altitude)<85)assert(Math.abs((pos.azimuth-h.azimuth+540)%360-180)<.3);
  assert.equal(A.sunAltitude(now,lat,lng),pos.altitude);
}
console.log('Window sky checks passed: star data and names, visitor clock, city/fallback, minus signs and dashed runs, a slider through the night, the moon toward the sun, every planet labelled, daylight, polar events and solar bearings.');
