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
  if(slug==='stars'){w.eval(source('js/vendor/astronomy-engine-2.1.19.min.js'));w.eval(source('js/bright-stars.js'));w.eval(source('js/sky-map.js'));}
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
// Follow the sky as the site's theme: a light day from sunrise to sunset,
// the night ramp from sunset to sunrise, each with its own contrast floors.
{
  const sky=(hour,instant='2026-10-23T10:00:00Z')=>{
    const dom=new JSDOM(fs.readFileSync(path.join(built,'index.html'),'utf8'),{url:'https://hakanaltun.io/'+(hour===undefined?'':'?hour='+hour),runScripts:'outside-only'});
    const w=dom.window,NativeDate=w.Date,NativeIntl=w.Intl;
    w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return new NativeDate(instant).getTime();}};
    w.Intl={DateTimeFormat:function(...args){const fmt=new NativeIntl.DateTimeFormat(...args);if(!args.length)fmt.resolvedOptions=()=>({timeZone:'Europe/Istanbul'});return fmt;}};
    const inline=[...w.document.querySelectorAll('script:not([src])')].map(s=>s.textContent);
    w.eval(inline.find(s=>s.includes('OLAE_SKY =')));
    w.eval(inline.find(s=>s.includes('OLAE_SITE_SKY =')));
    return {dom,w,root:w.document.documentElement,SITE:w.OLAE_SITE_SKY};
  };
  const parse=c=>c.match(/[\d.]+/g).slice(0,3).map(Number);
  const lum=c=>{const [r,g,b]=parse(c).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*r+0.7152*g+0.0722*b;};
  const ratio=(a,b)=>{const A=lum(a),B=lum(b);return (Math.max(A,B)+0.05)/(Math.min(A,B)+0.05);};
  const s=sky();
  const css=k=>s.root.style.getPropertyValue(k);
  // The day is checked at every share of the way to noon, the night bare,
  // halfway into the evening and at sunset, when the evening is whole.
  for(let alt=-30;alt<=60;alt+=0.5)for(const eve of alt<0?[0,0.5,1]:[0]){
    const share=Math.max(0,Math.min(1,alt/60));
    s.SITE.paint({alt,share,eve});
    const day=alt>=0,at=' at '+alt+'°'+(eve?', evening '+eve:'');
    assert.equal(s.root.getAttribute('data-sky'),day?'day':'night','the half'+at);
    assert.equal(s.root.getAttribute('data-theme'),day?'light':'sky','the path'+at);
    const grounds=['--paper','--surface-soft','--band'];
    assert(ratio(css('--ink'),css('--paper'))>=(day?11:6.5),'ink'+at);
    // every tier clears AA on every ground; on the sheet the night's
    // floors are the ramp's own, which its lightest ground, the evening's
    // slate, just holds
    for(const g of grounds){
      assert(ratio(css('--ink-soft'),css(g))>=(day?8:5),'ink-soft on '+g+at);
      assert(ratio(css('--vizon'),css(g))>=4.5,'vizon on '+g+at);
    }
    assert(ratio(css('--vizon'),css('--paper'))>=(day?5:5.5),'vizon on the sheet'+at);
    // the header's and footer's words, one tone on the chrome in both halves
    const chrome=day?'rgb('+css('--sky-chrome-rgb')+')':css('--band');
    assert(ratio(css('--footer-text'),chrome)>=7,'footer text on the chrome'+at);
    assert.equal(css('--footer-muted'),css('--footer-text'),'one tone in the header and footer'+at);
    if(alt===-30&&eve===0)assert.equal(css('--footer-text'),'rgb(248,235,194)','the full yellow in the deepest night');
    if(alt===0||(alt<0&&eve===1))assert.equal(css('--footer-text'),'rgb(251,243,218)','40% white at sunrise and sunset'+at);
    if(alt===60)assert.equal(css('--footer-text'),'rgb(253,249,237)','70% white at noon');
    if(day){
      assert.equal(css('--note-base'),'','the night\'s tokens are taken off by day'+at);
      assert(+css('--sec-l')>0.4&&+css('--sec-l')<0.52,'the accents\' lightness'+at);
      assert.equal(css('--sky-accent-white'),'','no white in the accents by day'+at);
    }else{
      assert.equal(css('--sky-chrome-rgb'),'','the day\'s tokens are taken off by night'+at);
      assert.notEqual(css('--note-base'),'','the note wall'+at);
      if(eve===1)assert.equal(css('--paper'),'rgb(78,94,106)','the evening\'s slate'+at);
      // the accents' white opens with the night, as the header's words do
      if(alt===-30&&eve===0)assert.equal(css('--sky-accent-white'),'12.0%','the accents\' least white'+at);
      if(eve===1)assert.equal(css('--sky-accent-white'),'40.0%','the accents\' white at the horizon'+at);
    }
    if(alt===0)assert.equal(css('--paper'),'rgb(193,204,213)','the darkest light slate at sunrise and sunset');
    if(alt===60)assert.equal(css('--paper'),'rgb(244,247,250)','the palest slate at noon');
  }
  s.SITE.clear();
  assert.equal(s.root.hasAttribute('data-sky'),false);
  assert.equal(css('--paper'),'');
  s.dom.window.close();
  // The instruments follow the same two halves with their four tokens,
  // keeping data-theme="sky" so their buttons know the choice.
  {
    const dom=new JSDOM(fs.readFileSync(path.join(built,'list','index.html'),'utf8'),{url:'https://hakanaltun.io/list/',runScripts:'outside-only'});
    const w=dom.window,root=w.document.documentElement;
    w.localStorage.setItem('olae-page-theme','sky');
    const inline=[...w.document.querySelectorAll('head script:not([src])')].map(s=>s.textContent);
    w.eval(inline.find(s=>s.includes('OLAE_SKY =')));
    w.eval(inline.find(s=>s.includes('OLAE_PAGE_SKY =')));
    const css=k=>root.style.getPropertyValue(k);
    const solid=k=>{const c=css(k).match(/[\d.]+/g).map(Number),g=parse(css('--paper'));return c.length<4?css(k):'rgb('+[0,1,2].map(i=>Math.round(c[i]*c[3]+g[i]*(1-c[3]))).join(',')+')';};
    for(let alt=-30;alt<=60;alt+=0.5)for(const eve of alt<0?[0,0.5,1]:[0]){
      w.OLAE_PAGE_SKY.paint({alt,share:Math.max(0,Math.min(1,alt/60)),eve});
      const day=alt>=0,at=' on The List at '+alt+'°'+(eve?', evening '+eve:'');
      assert.equal(root.getAttribute('data-theme'),'sky','the choice'+at);
      assert.equal(root.getAttribute('data-sky'),day?'day':'night','the half'+at);
      assert(day?lum(css('--paper'))>0.55:lum(css('--paper'))<0.15,'the paper'+at);
      assert(ratio(css('--ink'),css('--paper'))>=(day?11:6.5),'ink'+at);
      assert(ratio(solid('--muted'),css('--paper'))>=(day?5:4.5),'muted'+at);
    }
    w.OLAE_PAGE_SKY.clear();
    assert.equal(root.hasAttribute('data-sky'),false);
    assert.equal(css('--paper'),'');
    dom.window.close();
  }
  // ?hour= stands the sun where it will be at that hour today, in İstanbul,
  // on the reader's own clock.
  const tz=process.env.TZ;process.env.TZ='Europe/Istanbul';
  for(const [hour,half] of [[2,'night'],[6.5,'night'],[7.5,'day'],[13,'day'],[17.9,'day'],[18.5,'night'],[21,'night'],['25',null],['x',null]]){
    const h=sky(hour);h.SITE.paintNow();
    if(half)assert.equal(h.root.getAttribute('data-sky'),half,'?hour='+hour);
    else assert.equal(h.root.getAttribute('data-sky'),'day','?hour='+hour+' is ignored: 13:00 in İstanbul');
    h.dom.window.close();
  }
  // Every half hour of that day: the paper moves at every step but the
  // darkest of the night; the day is palest at the half hour nearest noon
  // (12:48), and from sunset (18:06) the evening's slate darkens at every
  // step into the night, which is whole at nine.
  {
    const papers=[];
    for(let m=0;m<24*60;m+=30){
      const h=sky(m/60);h.SITE.paintNow();
      papers.push([m/60,h.root.getAttribute('data-sky'),h.root.style.getPropertyValue('--paper')]);
      h.dom.window.close();
    }
    const at=t=>papers.find(p=>p[0]===t);
    assert(lum(at(13)[2])>lum(at(12.5)[2])&&lum(at(13)[2])>lum(at(13.5)[2]),'palest at the half hour nearest noon');
    assert(lum(at(18.5)[2])<lum('rgb(78,94,106)')&&lum(at(18.5)[2])>lum(at(19)[2]),'the slate begins to darken at sunset');
    for(let t=18.5;t<21;t+=0.5)assert(lum(at(t)[2])>lum(at(t+0.5)[2]),'darker at '+(t+0.5)+' than at '+t);
    assert.equal(at(21)[2],'rgb(12,16,24)','the night at nine');
    for(let t=8;t<18;t+=0.5)assert.notEqual(at(t)[2],at(t+0.5)[2],'the day moves at '+t);
  }
  // And every minute of it: measured along the sun's arc, the day's paper,
  // ink, muted tier and rule never stand still for more than a few
  // minutes, noon included, as finely as a screen's shades allow.
  {
    const h=sky(),S=h.w.OLAE_SKY,midnight=Date.parse('2026-10-22T21:00:00Z');
    let prev=null,run=0,longest=0,minutes=0;
    for(let m=0;m<24*60;m++){
      const sun=S.sunAt(new h.w.Date(midnight+m*60000));
      if(sun.alt<0){prev=null;continue;}
      const d=S.dayAt(sun.share),k=[d.paper,d.ink,d.vizon,d.rule].join('|');
      run=k===prev?run+1:1;longest=Math.max(longest,run);prev=k;minutes++;
    }
    assert(minutes>600,'a whole day');
    assert(longest<=10,'the day never holds still for long: '+longest+' minutes');
    h.dom.window.close();
  }
  if(tz===undefined)delete process.env.TZ;else process.env.TZ=tz;
}
// The homepage's Tonight: the sun and the moon at once, then the map and
// the planets from The Stars' own scripts, asked for only for a known city.
async function home(zone,instant){
  const dom=new JSDOM(fs.readFileSync(path.join(built,'index.html'),'utf8'),{url:'https://hakanaltun.io/',runScripts:'outside-only'});
  const w=dom.window,NativeDate=w.Date,NativeIntl=w.Intl;
  w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return new NativeDate(instant).getTime();}};
  w.Intl={DateTimeFormat:function(...args){const fmt=new NativeIntl.DateTimeFormat(...args);if(!args.length)fmt.resolvedOptions=()=>({timeZone:zone});return fmt;}};
  const requested=[];
  const append=w.document.head.appendChild.bind(w.document.head);
  w.document.head.appendChild=el=>{if(el.tagName==='SCRIPT'){requested.push(el.getAttribute('src'));setTimeout(()=>el.onload(),0);return el;}return append(el);};
  const inline=[...w.document.querySelectorAll('script:not([src])')].map(s=>s.textContent);
  w.eval(inline.find(s=>s.includes('OLAE_SKY =')));
  w.eval(source('js/astronomy.js'));
  w.eval(source('js/vendor/astronomy-engine-2.1.19.min.js'));w.eval(source('js/bright-stars.js'));w.eval(source('js/sky-map.js'));
  w.eval(inline.find(s=>s.includes('Tonight —')));
  for(let i=0;i<5;i++)await new Promise(r=>setTimeout(r,0));
  const q=id=>w.document.getElementById(id);
  return {dom,q,requested,rows:[...w.document.querySelectorAll('.tonight-facts li:not([hidden])')].map(li=>li.textContent)};
}
(async()=>{
  {
    const h=await home('Europe/Istanbul','2026-10-07T19:30:00Z');
    assert.equal(h.q('tonight').hidden,false);
    assert.equal(h.q('tonight-meta').textContent,'The sky over İstanbul · now');
    assert.deepEqual(h.rows,['The sunrises at 07:07','The moonwaning crescent, 14% lit; rises at 04:33','PlanetsSaturn in the southeast','Look forDeneb, in Cygnus, high in the west']);
    assert.equal(h.q('tonight-map-link').hidden,false);
    assert(h.q('tonight-map').querySelectorAll('.star').length>200,'the map');
    const yml=source('_data/sky_scripts.yml');
    assert.deepEqual(h.requested,['engine','stars','map'].map(k=>yml.match(new RegExp('^'+k+': (.+)$','m'))[1]),'The Stars\' own scripts, at their versions');
    h.dom.window.close();
  }
  {
    const h=await home('Europe/Istanbul','2026-10-07T07:30:00Z');
    assert.equal(h.q('tonight-meta').textContent,'The sky over İstanbul · after dark, 19:40');
    assert.equal(h.rows[0],'The sunsets at 18:37');
    h.dom.window.close();
  }
  {
    const h=await home('Atlantic/Azores','2026-10-07T19:30:00Z');
    assert.equal(h.q('tonight-meta').textContent,'Times for your time zone');
    assert.deepEqual(h.rows,['The sunrises at 05:44','The moonwaning crescent, 14% lit']);
    assert.equal(h.q('tonight-map-link').hidden,true);
    assert.deepEqual(h.requested,[],'no map without a place');
    h.dom.window.close();
  }
  console.log('Window sky checks passed: star data and names, Follow the sky by day, in the evening and by night on the site and the instruments, with their contrast floors and ?hour=, visitor clock, city/fallback, minus signs and dashed runs, a slider through the night, the moon toward the sun, every planet labelled, Tonight on the homepage, daylight, polar events and solar bearings.');
})().catch(e=>{console.error(e);process.exit(1);});
