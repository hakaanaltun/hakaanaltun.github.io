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
{
  const p=page('stars');
  assert.equal(p.q('live').getAttribute('aria-pressed'),'true');
  assert(p.q('moment').textContent.includes('07:08'));
  assert.equal(Number(p.q('hour').value),428);
  assert(p.q('sky-map').querySelectorAll('.star').length>0);
  assert(p.q('constellations').children.length>0);
  p.q('hour').value=21*60;p.q('hour').dispatchEvent(new p.w.Event('input'));
  assert(p.q('moment').textContent.includes('21:00'));
  assert.equal(p.q('live').getAttribute('aria-pressed'),'false');
  assert(!p.q('sky-notice').textContent.includes('Daylight'));
  p.q('hour').value=12*60;p.q('hour').dispatchEvent(new p.w.Event('input'));
  assert(p.q('sky-notice').textContent.includes('Daylight'));
  p.q('live').click();assert(p.q('moment').textContent.includes('07:08'));
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
console.log('Window sky checks passed: visitor clock, city/fallback, live time and slider, daylight, polar events and solar bearings.');
