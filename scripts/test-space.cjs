const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('pictures/space/index.html','utf8'),elements=new Map(),frames=new Map(),classes=new Set(),events={};
let clock=0,frameId=0,reduced=true;
function element(id,tagName='BUTTON'){
 if(elements.has(id))return elements.get(id);
 const e={id,tagName,style:{},dataset:{},hidden:false,disabled:false,clientWidth:1280,clientHeight:900,offsetWidth:60,offsetLeft:100,isConnected:true,children:[],
 setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},replaceChildren(){this.children=[]},append(v){this.children.push(v)},focus(){},scrollTo(){},addEventListener(){},decode:()=>Promise.resolve(),showModal(){this.open=true},close(){this.open=false}};
 elements.set(id,e);return e;
}
for(const m of html.matchAll(/<([\w-]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)){const e=element(m[2],m[1].toUpperCase());e.hidden=/\bhidden\b/.test(m[0]);}
const nav=[...html.matchAll(/data-stop="([^"]+)"/g)].map(m=>{const e=element('nav-'+m[1]);e.dataset.stop=m[1];return e});
const routes=[...html.matchAll(/data-route="([^"]+)"/g)].map(m=>{const e=element('route-'+m[1]);e.dataset.route=m[1];return e});
const location={hash:''},browserEntries=[{state:null,hash:''}];let browserCursor=0;
function browserPop(delta){const index=browserCursor+delta;if(index<0||index>=browserEntries.length)return;browserCursor=index;location.hash=browserEntries[index].hash;events.popstate?.({state:browserEntries[index].state})}
const browserHistory={replaceState(state,unused,hash){browserEntries[browserCursor]={state,hash};location.hash=hash},pushState(state,unused,hash){browserEntries.splice(browserCursor+1);browserEntries.push({state,hash});browserCursor++;location.hash=hash},back(){browserPop(-1)},forward(){browserPop(1)}};
const context=vm.createContext({document:{getElementById:id=>{assert(elements.has(id),'Missing DOM node '+id);return elements.get(id)},createElement:tag=>element('created-'+Math.random(),tag.toUpperCase()),querySelectorAll:q=>q==='[data-stop]'?nav:q==='[data-route]'?routes:[],body:{dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)}},addEventListener:(name,fn)=>events[name]=fn},window:{history:browserHistory,addEventListener:(name,fn)=>events[name]=fn},location,matchMedia:()=>({matches:reduced}),setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId},cancelAnimationFrame:id=>frames.delete(id),performance:{now:()=>clock},URLSearchParams,Promise});
const run=code=>vm.runInContext(code,context),near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve()};
const tick=async ms=>{clock+=ms;const queue=[...frames.values()];frames.clear();queue.forEach(fn=>fn(clock));await flush()};
const finish=async promise=>{await flush();for(let i=0;i<6&&run('!!pendingDestination');i++)await tick(10000);assert.equal(run('pendingDestination'),null,'Navigation did not settle');return promise?await promise:undefined};
run(fs.readFileSync('js/space-field-notes.js','utf8'));
run(fs.readFileSync('js/space-journey.js','utf8'));
(async()=>{
 await run('initialNavigation');
 const intro=html.match(/<dialog id="routeDialog">([\s\S]*?)<\/dialog>/)[1];
 assert(!/Voyager|Mercury|Titan|route-stops/.test(intro),'The introduction reveals the itinerary');
 for(const [hash,expected] of Object.entries({'#scene-vicinity':'system','#scene-moon':'moon','#scene-asteroid-belt':'belt','#scene-kuiper-belt':'kuiper','#scene-voyager-2':'voyager2','#scene-voyager-1':'voyager1','#sun':'sun'})){location.hash=hash;assert.equal(run('sceneFromHash()'),expected)}
 location.hash='#system';
 const slowed=run("flightProfile(localTarget('earth'),localTarget('moon'),false,'earth','moon')");assert(slowed.duration>=700&&slowed.duration<=3900);
 assert.equal(run("flightProfile(localTarget('earth'),localTarget('moon'),true).duration"),500);

 // Every scene is backed by the common camera and a complete, valid navigation graph.
 for(const id of run('Object.keys(scenes)')){
  await run(`go('${id}')`);assert(run('!!systems[localSystemFor()]'));assert(!element('count').textContent.includes('undefined'));
  run('drawHotspots();openInfo(scenes[current].info);closeInfo()');assert(run('!!scenes[scenes[current].next]'));
  if(!run(`!!systems['${id}']`))assert(element('hotspots').children.length>0,id);
  // Main action stays within the current physical body, except overview's approach.
  assert.equal(run('localBodyFor(scenes[current].next)'),run('localBodyFor(current)'),id+' primary leaves its body');
 }
 for(const spots of Object.values(run('hotspots')))for(const spot of spots)assert(run(spot.go?`!!scenes['${spot.go}']`:`!!notes['${spot.note}']`));
 // A single linear route in either direction, also from every surface closeup.
 for(const id of run('Object.keys(scenes)')){
  if(run(`!!systems['${id}']`))continue;
  const body=run(`localBodyFor('${id}')`),next=run(`routeNeighbors('${id}').next`),prev=run(`routeNeighbors('${id}').previous`);
  if(next)assert.equal(run(`routeNeighbors('${next}').previous`),body);
  if(prev)assert.equal(run(`routeNeighbors('${prev}').next`),body);
 }
 await run("go('sun')");assert.equal(element('viewPrevious').disabled,true);
 for(const body of run('journey.slice(1)')){await element('viewNext').onclick();assert.equal(run('current'),body)}
 assert.equal(element('viewNext').disabled,true);assert.equal(element('nextLabel').textContent,'End of route');
 for(const body of run('journey.slice(0,-1).reverse()')){await element('viewPrevious').onclick();assert.equal(run('current'),body)}
 // All fourteen establishing views keep bodies and rings within phone/tablet/desktop bounds.
 for(const key of run('Object.keys(systems)')){
  await run(`go('${key}')`);
  for(const [w,h] of [[320,667],[375,667],[768,1024],[800,620],[800,800],[820,900],[1280,900],[844,480]]){
   element('stage').clientWidth=w;element('stage').clientHeight=h;await run('position(current,false)');
   const pose=run('overviewPose()'),anchor=run('localAnchor()'),[ox,oy]=run('regionOrigin()');
   for(const name of run('systems[localSystemFor()].bodies')){
    const b=run(`localBodies.${name}`),x=anchor.x+(ox+b.cx-pose.x)*pose.scale,y=anchor.y+(oy+b.cy-pose.y)*pose.scale,rx=(b.rx||b.radius)*pose.scale,ry=(b.ry||b.radius)*pose.scale;
    assert(x-rx>0&&x+rx<w&&y-ry>50&&y+ry<h*.65,`${key}/${name} clipped at ${w}`);
    assert(parseFloat(element(name+'Target').style.width)>=44);assert(parseFloat(element(name+'Target').style.height)>=44);
   }
  }
 }
 element('stage').clientWidth=1280;element('stage').clientHeight=900;
 // Every globe can be approached and tapped again to zoom, including all moons.
 for(const body of run('journey')){
  const key=run(`localSystemFor('${body}')`);reduced=true;await run(`go('${key}')`);const wideScale=run('localPose.scale');
  assert.equal(element(body+'Target').hidden,false);await element(body+'Target').onclick();assert.equal(run('current'),body);assert(run('localPose.scale')>wideScale);
  assert.equal(element(body+'Target').hidden,false);assert.equal(element(body+'Target').disabled,false);
  const bodyScale=run('localPose.scale');await element(body+'Target').onclick();assert(run('localPose.scale')>bodyScale,body+' did not zoom');
  await element('zoomOut').onclick();assert.equal(run('current'),body);
 }
 // Plus/minus follow the same inspection route without triggering cross-world travel.
 await run("go('system')");await element('zoomIn').onclick();assert.equal(run('current'),'earth');await element('zoomIn').onclick();assert.equal(run('current'),'near');await element('earthTarget').onclick();assert.equal(run('current'),'atmosphere');assert.equal(element('zoomIn').disabled,true);await element('zoomOut').onclick();assert.equal(run('current'),'earth');
 // Distinct distances give distinct uninterrupted camera paths; no obligatory overview midpoint.
 for(const [wide,first,second] of [['system','earth','moon'],['belt','ceres','vesta'],['jovian','jupiter','io'],['saturnian','saturn','titan'],['uranian','uranus','miranda'],['neptunian','neptune','triton'],['plutonian','pluto','charon']]){
  reduced=true;await run(`go('${first}')`);const from=run('({...localPose})'),target=run(`localTarget('${second}')`),profile=run(`flightProfile(localPose,localTarget('${second}'),false,'${first}','${second}')`);
  const fixed=run(`systems['${wide}'].bodies`).map(n=>[n,element(n).style.left]);
  reduced=false;const moving=run(`go('${second}')`);await flush();near(run('localPose.x'),from.x);near(run('localPose.scale'),from.scale);
  await tick(profile.duration/2);const mid=run('({...localPose})');assert(mid.x>Math.min(from.x,target.x)&&mid.x<Math.max(from.x,target.x));
  await tick(16);assert(Math.abs(run('localPose.x')-mid.x)>.01,'Camera stopped at midpoint');
  for(const [name,left] of fixed){assert.equal(element(name).style.left,left);assert.equal(element(name).style.opacity,'1')}
  await finish(moving);near(run('localPose.x'),target.x);near(run('localPose.scale'),target.scale);
 }
 // Curved routes are distinct, never move the worlds, and retrace exactly in reverse.
 const bends=new Set();
 for(const [index,body] of run('journey').entries()){
  if(!index)continue;const previous=run(`journey[${index-1}]`);
  const from=run(`localTarget('${previous}')`),to=run(`localTarget('${body}')`);
  const forward=run(`flightProfile(localTarget('${previous}'),localTarget('${body}'),false,'${previous}','${body}')`),reverse=run(`flightProfile(localTarget('${body}'),localTarget('${previous}'),false,'${body}','${previous}')`);
  bends.add(run(`travelRoute('${previous}','${body}').bend`));
  for(const t of [0,.2,.5,.8,1]){
   context.routeFrom=from;context.routeTo=to;context.routeForward=forward;context.routeReverse=reverse;context.routeProgress=t;
   const f=run('flightPose(routeFrom,routeTo,routeForward,routeProgress)'),r=run('flightPose(routeTo,routeFrom,routeReverse,1-routeProgress)');near(f.x,r.x);near(f.y,r.y);near(f.scale,r.scale);
   if(t===.5){const dx=to.x-from.x,dy=to.y-from.y;assert(Math.abs(dx*(f.y-from.y)-dy*(f.x-from.x))>1,'Travel remained a straight slide')}
  }
 }
 assert(bends.size>10,'Routes repeat the same bend');
 // Crossing regions starts from the actual outgoing pose; both regions share every camera frame.
 reduced=true;await run("go('moon')");const departure=run('({...localPose})');reduced=false;
 const marsTrip=element('viewNext').onclick();await flush();assert.equal(run('current'),'mars');near(run('localPose.x'),departure.x);near(run('localPose.scale'),departure.scale);
 await tick(500);assert.equal(element('earthMoonSpace').style.opacity,'1');assert.equal(element('marsSpace').style.opacity,'1');assert.notEqual(run('localPose.x'),departure.x);
 await finish(marsTrip);near(run('localPose.scale'),run("localTarget('mars').scale"));
 // A quick second arrow click advances from the pending destination and cancels the first trip.
 const one=element('viewNext').onclick();await flush();await tick(150);
 const two=element('viewNext').onclick();await finish(two);assert.equal(await one,false);assert.equal(run('current'),'vesta');
 // Reverse immediately during a trip; the latest destination always wins.
 const out=element('viewNext').onclick();await flush();await tick(100);
 const reverse=element('viewPrevious').onclick();await finish(reverse);assert.equal(await out,false);assert.equal(run('current'),'vesta');
 // Skip completes both departure and arrival, without leaving a stale camera callback.
 const skipped=run("go('saturn')");await flush();element('skipTravel').onclick();await flush();assert.equal(await skipped,true);assert.equal(frames.size,0);assert.equal(run('current'),'saturn');
 // Interrupted zoom restarts at the actual pose, rather than snapping.
 const rings=run("go('rings')");await flush();await tick(200);const before=run('({...localPose})');
 const backToSaturn=run("go('saturn')");await flush();near(run('localPose.x'),before.x);await finish(backToSaturn);assert.equal(await rings,false);
 // Back/Forward share browser history; going back never pushes another entry.
 reduced=true;await run("go('io')");await run("go('iosurface')");await run("go('europa')");const length=browserEntries.length;
 element('backButton').onclick();await finish();assert.equal(run('current'),'iosurface');assert.equal(location.hash,'#iosurface');assert.equal(browserEntries.length,length);
 browserHistory.back();await finish();assert.equal(run('current'),'io');browserHistory.forward();await finish();assert.equal(run('current'),'iosurface');
 const cursor=run('historyCursor');await run("go('iosurface')");assert.equal(run('historyCursor'),cursor);assert.equal(browserEntries.length,length);
 // Failed decoding leaves current view, history and controls intact.
 const decode=element('marsOverview').decode;element('marsOverview').decode=()=>Promise.reject(Error('offline'));
 const oldHash=location.hash,oldCursor=run('historyCursor');assert.equal(await run("go('mars')"),false);assert.equal(location.hash,oldHash);assert.equal(run('historyCursor'),oldCursor);assert.equal(element('primary').disabled,false);element('marsOverview').decode=decode;
 // A slow, stale load cannot overwrite a more recent selection.
 let release;const slow=element('marsOverview').decode;element('marsOverview').decode=()=>new Promise(r=>release=r);
 const obsolete=run("go('mars')");await flush();await run("go('ceres')");release();await flush();assert.equal(await obsolete,false);assert.equal(run('current'),'ceres');element('marsOverview').decode=slow;
 // Native images reveal after arrival; failed detail retains overview and can retry.
 await run("go('saturnian')");element('enceladusHigh').onerror();await flush();await run("go('saturn')");reduced=false;
 const enceladus=run("go('enceladus')");await flush();await element('enceladusHigh').onload();await flush();assert.notEqual(element('enceladusHigh').style.opacity,'1');await finish(enceladus);assert.equal(element('enceladusHigh').style.opacity,'1');
 // Uranus extends the route and Miranda reveals its registered native mosaic after arrival.
 reduced=true;await run("go('enceladus')");assert.equal(element('nextLabel').textContent,'Uranus');
 await nav.find(b=>b.dataset.stop==='uranus').onclick();assert.equal(run('current'),'uranian');assert.equal(element('count').textContent,'10 / 15');
 await run("go('uranus')");reduced=false;const mirandaTrip=run("go('miranda')");await flush();await element('mirandaHigh').onload();await flush();assert.notEqual(element('mirandaHigh').style.opacity,'1');await finish(mirandaTrip);assert.equal(element('mirandaHigh').style.opacity,'1');
 assert.equal(element('nextLabel').textContent,'Neptune');assert.equal(element('previousLabel').textContent,'Uranus');
 await finish(run("go('mirandaterrain')"));assert.equal(element('mirandaHigh').style.opacity,'1');await finish(element('pullBack').onclick());assert.equal(run('current'),'uranian');
 // Resize finishes the active trip and restores a usable camera and controls.
 const resizeTrip=run("go('mars')");await flush();await tick(100);element('stage').clientWidth=375;element('stage').clientHeight=667;events.resize();await finish(resizeTrip);assert.equal(run('current'),'mars');near(run('localPose.scale'),run("localTarget('mars').scale"));assert.equal(element('travelStatus').hidden,true);
 reduced=true;await run("go('atmosphere')");await element('earthDetail').onload();await flush();assert.equal(element('earthDetail').style.opacity,'1');
 await run("go('farside')");assert.equal(element('earthDetail').style.opacity,'0');assert.equal(element('moon').style.opacity,'0');assert.equal(element('farside').style.opacity,'1');assert.equal(element('earth').style.opacity,'1');
 await run("go('southpole')");assert.equal(element('vesta').style.opacity,'0');assert.equal(element('vestasouth').style.opacity,'1');assert.equal(element('ceres').style.opacity,'1');
 await run("go('belt')");assert.equal(element('vesta').style.opacity,'1');assert.equal(element('vestasouth').style.opacity,'0');
 await nav.find(b=>b.dataset.stop==='mars').onclick();assert.equal(run('current'),'martian');await nav.find(b=>b.dataset.stop==='ceres').onclick();assert.equal(run('current'),'belt');
 // Original long notes keep every paragraph and source, including future-route subjects.
 assert.equal(run('Object.keys(fieldNotes).length'),65);
 for(const key of ['earth','olympus','occator','golden-record']){
  run(`openInfo('${key}')`);assert(element('infoText').children.length>=3);assert(element('infoSources').children.length>=1);
  assert(element('infoSources').children.every(a=>a.href.startsWith('https://')));run('closeInfo()');
 }
 run("openInfo('system')");assert.equal(element('infoTitle').textContent,'The ground, seen from space.');assert(element('infoText').children.some(p=>p.textContent.includes('Blue Marble')));run('closeInfo()');
 // Measured caption bounds at intermediate widths reserve space below every body label.
 element('stage').getBoundingClientRect=()=>({top:0});element('topTools').getBoundingClientRect=()=>({bottom:120});
 for(const [w,h,captionTop] of [[800,620,305],[800,800,470],[820,900,555],[375,667,290]]){
  element('stage').clientWidth=w;element('stage').clientHeight=h;element('caption').getBoundingClientRect=()=>({top:captionTop,right:w*.5});
  for(const key of run('Object.keys(systems)')){
   await run(`go('${key}')`);await run('position(current,false)');const pose=run('localPose'),a=run('localAnchor()'),[ox,oy]=run('regionOrigin()');
   for(const name of run('systems[localSystemFor()].bodies')){const b=run(`localBodies.${name}`);const labelBottom=a.y+(oy+b.cy-pose.y)*pose.scale+Math.max(22,(b.ry||b.radius)*pose.scale)+38;assert(labelBottom<captionTop,`${key}/${name} label overlaps caption at ${w}`)}
  }
 }
 delete element('caption').getBoundingClientRect;delete element('topTools').getBoundingClientRect;delete element('stage').getBoundingClientRect;
 await nav.find(b=>b.dataset.stop==='neptune').onclick();assert.equal(run('current'),'neptunian');await run("go('tritonice')");assert.equal(element('nextLabel').textContent,'Pluto');assert.equal(element('count').textContent,'11 / 15');
 // Pluto's entry and Charon's high-resolution arrival share the established navigation contract.
 await nav.find(b=>b.dataset.stop==='pluto').onclick();assert.equal(run('current'),'plutonian');assert.equal(element('count').textContent,'12 / 15');
 await run("go('pluto')");run("openInfo('sputnik')");assert.equal(element('infoTitle').textContent,'Ice that slowly renews its surface.');run('closeInfo()');
 reduced=false;const charonTrip=run("go('charon')");await flush();await element('charonHigh').onload();await flush();assert.notEqual(element('charonHigh').style.opacity,'1');await finish(charonTrip);assert.equal(element('charonHigh').style.opacity,'1');assert.equal(element('nextLabel').textContent,'Arrokoth');
 await finish(run("go('charonpole')"));run("openInfo('charonpole')");assert.equal(element('infoText').children.length,3);run('closeInfo()');await finish(element('pullBack').onclick());assert.equal(run('current'),'plutonian');reduced=true;
 // Arrokoth preserves the source frame across approach, neck, color and wide return.
 await nav.find(b=>b.dataset.stop==='arrokoth').onclick();assert.equal(run('current'),'kuiper');assert.equal(element('count').textContent,'13 / 15');
 reduced=false;const arrokothTrip=element('arrokothTarget').onclick();await flush();await element('arrokothHigh').onload();await flush();assert.notEqual(element('arrokothHigh').style.opacity,'1');await finish(arrokothTrip);assert.equal(element('arrokothHigh').style.opacity,'1');assert.equal(element('nextLabel').textContent,'Voyager 2');
 await finish(element('zoomIn').onclick());assert.equal(run('current'),'arrokothneck');assert.equal(element('arrokothHigh').style.opacity,'1');
 for(const id of ['kuiper','arrokoth','arrokothneck','arrokothcolor']){run(`openInfo('${id}')`);assert.equal(element('infoText').children.length,3);assert(element('infoSources').children.length>=2);run('closeInfo()')}
 await finish(element('excursion').onclick());assert.equal(run('current'),'arrokothcolor');await finish(element('zoomOut').onclick());assert.equal(run('current'),'arrokoth');await finish(element('pullBack').onclick());assert.equal(run('current'),'kuiper');reduced=true;
 // Voyagers occupy separate regions, retain native detail and share the standard zoom route.
 for(const [body,count,next] of [['voyager2','14 / 15','Voyager 1'],['voyager1','15 / 15','End of route']]){
  await nav.find(b=>b.dataset.stop===body).onclick();assert.equal(run('current'),body+'wide');assert.equal(element('count').textContent,count);
  reduced=false;const arrival=element(body+'Target').onclick();await flush();await element(body+'High').onload();await flush();assert.notEqual(element(body+'High').style.opacity,'1');await finish(arrival);assert.equal(element(body+'High').style.opacity,'1');assert.equal(element('nextLabel').textContent,next);
  assert.equal(element(body+'High').src,'assets/voyager-detail-v20.webp');
  await finish(element('zoomIn').onclick());assert.equal(run('current'),body+'antenna');await finish(element('zoomIn').onclick());assert.equal(run('current'),body+'record');
  run('openInfo(scenes[current].info)');assert.equal(element('infoText').children.length,8);run('closeInfo()');
  await finish(element('primary').onclick());assert.equal(run('current'),body+'power');run('openInfo(scenes[current].info)');assert.equal(element('infoText').children.length,3);run('closeInfo()');
  await finish(element('pullBack').onclick());assert.equal(run('current'),body+'wide');reduced=true;
 }
 assert(run('regionOrigins.voyager2wide[1]>0&&regionOrigins.voyager1wide[1]<0'));
 await run("go('voyager1')");element('excursion').onclick();assert.equal(element('paleBlueFigure').hidden,false);assert.equal(run('current'),'voyager1');
 element('paleBlueZoom').onclick();assert.equal(element('paleBlueImage').style.transform,'scale(2.5)');assert.equal(element('paleBlueZoom')['aria-pressed'],'true');
 run("openInfo('golden-record')");assert.equal(element('paleBlueFigure').hidden,true);assert.equal(element('paleBlueImage').style.transform,'scale(1)');run('closeInfo()');
 assert(fs.existsSync('pictures/space/assets/voyager-detail-v20.webp'));
 // The inner branch leaves Earth to the left and returns along the same route.
 await run("go('earth')");for(const body of ['venus','mercury','sun']){await element('viewPrevious').onclick();assert.equal(run('current'),body)}assert.equal(element('viewPrevious').disabled,true);
 for(const body of ['mercury','venus','earth']){await element('viewNext').onclick();assert.equal(run('current'),body)}
 for(const [body,wide,count] of [['venus','venuswide','03 / 15'],['mercury','mercurywide','02 / 15'],['sun','solar','01 / 15']]){
  await nav.find(b=>b.dataset.stop===body).onclick();assert.equal(run('current'),wide);assert.equal(element('count').textContent,count);reduced=false;
  const arrival=element(body+'Target').onclick();await flush();await element(body+'High').onload();await flush();assert.notEqual(element(body+'High').style.opacity,'1');await finish(arrival);assert.equal(element(body+'High').style.opacity,'1');
  await finish(element('zoomIn').onclick());assert(run('scenes[current].zoom>scenes[localBodyFor(current)].zoom'));reduced=true;
 }
 // The five complete Sun notes replace the old picture's story and detail text in the reader.
 for(const [key,paragraphs] of [['sun-story',5],['sun-photosphere',3],['sun-sunspots',3],['sun-prominence',3],['sun-corona',3]]){run(`openInfo('${key}')`);assert.equal(element('sunTopics').hidden,false);assert.equal(element('infoText').children.length,paragraphs);assert(element('infoSources').children.length>=4)}
 element('sunProminence').onclick();assert.equal(element('solarFigure').hidden,false);assert.equal(element('solarObservation').src,'https://pictures-space-pilot-hakan.exacttulip1.chatgpt.site/assets/sun-prominence.webp');
 element('sunStory').onclick();assert.equal(element('solarFigure').hidden,true);assert.equal(element('infoTitle').textContent,'What the light told us');run("openInfo('earth')");assert.equal(element('sunTopics').hidden,true);run('closeInfo()');
 for(const name of ['sun-detail','mercury-detail','venus-detail','sun-prominence','sun-corona'])assert(JSON.parse(fs.readFileSync('_agents/space-assets.json','utf8'))[name+'.webp']);
 // Keyboard arrows use the same route and respect open information panels.
 await run("go('mars')");events.keydown({key:'ArrowRight',target:{tagName:'BODY'},preventDefault(){}});await finish();assert.equal(run('current'),'ceres');run("openInfo('ceres')");events.keydown({key:'ArrowRight',target:{tagName:'BODY'},preventDefault(){}});await flush();assert.equal(run('current'),'ceres');run('closeInfo()');
 for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!m[1].startsWith('http')&&!m[1].includes('{')&&!m[1].endsWith('/'))assert(fs.existsSync((m[1].startsWith('/')?'.':'pictures/space/')+m[1].split('?')[0]));
 assert.equal(run('Object.keys(scenes).length'),74);
 console.log('Passed: 74 scenes, all fourteen wide views at eight sizes, measured caption clearance, 65 sourced field notes, reversible route and endpoint boundaries, fixed global geometry, direct globe/zoom controls, continuous region travel, distinct reversible curved routes, rapid retarget/reverse, skip, browser Back/Forward, decode failure/stale load, native detail arrival/retry, resize, alternate observations, keyboard routing and asset paths.');
})().catch(e=>{console.error(e);process.exitCode=1});
