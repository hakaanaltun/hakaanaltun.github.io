/* "Read with rain": one button, one sky. The essay header drives both the
   sound (js/rain-engine.js) and the picture (js/let-it-snow.js), and the
   footer's droplet stays the silent picture it has always been.
   Run with Node 22+ from the repository root: node scripts/test-rain-read.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const liquid=html=>html.replace(/\{%[\s\S]*?%\}/g,'');

/* A page is the essay header's two buttons and the real footer, so the ids
   these scripts reach for are the ids the site actually ships. */
const essayButtons=liquid(source('_layouts/post.html'))
  .match(/<button[^>]*id="essay-rain"[\s\S]*?<\/button>/)[0];
const page='<main id="main">'+essayButtons+'</main>'+liquid(source('_includes/footer.html'));

function harness(){
  const dom=new JSDOM(page,{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  const frames=new Map(),timers=new Map(),intervals=new Set();
  let id=0;
  w.innerWidth=1200;w.innerHeight=800;w.devicePixelRatio=2;
  w.matchMedia=()=>({matches:false});
  w.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
  w.cancelAnimationFrame=i=>frames.delete(i);
  w.setTimeout=fn=>{timers.set(++id,fn);return id;};
  w.clearTimeout=i=>timers.delete(i);
  w.setInterval=()=>{const i=++id;intervals.add(i);return i;};
  w.clearInterval=i=>intervals.delete(i);
  w.ResizeObserver=class{observe(){}disconnect(){}};
  const ctx2d={setTransform(){},clearRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},
    closePath(){},fill(){},stroke(){},save(){},restore(){},fillRect(){},arc(){},ellipse(){},
    createLinearGradient(){return {addColorStop(){}};}};
  w.HTMLCanvasElement.prototype.getContext=()=>ctx2d;

  /* Web Audio, stubbed down to what the engine touches. A parameter keeps
     the value it was last ramped to, which is all the assertions read. */
  let plays=0;
  function param(value){
    return {value:value,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},
      linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},
      connect(){},disconnect(){}};
  }
  const audio={contexts:0,master:null,nodes:[]};
  function node(extra){
    const n=Object.assign({connect(){},disconnect(){},start(){},stop(){}},extra);
    audio.nodes.push(n);return n;
  }
  w.AudioContext=function(){
    audio.contexts++;
    this.sampleRate=8000;this.currentTime=0;this.state='running';
    this.destination=node({});
    this.resume=function(){this.state='running';};
    this.createGain=function(){
      const g=node({gain:param(1)});
      if(!audio.master)audio.master=g;   /* the first gain made is the master */
      return g;
    };
    this.createBiquadFilter=function(){return node({type:'',frequency:param(0),Q:param(0)});};
    this.createOscillator=function(){return node({type:'',frequency:param(0)});};
    this.createBufferSource=function(){return node({buffer:null,loop:false,onended:null});};
    this.createBuffer=function(channels,length,rate){
      const data=new Float32Array(length);
      return {duration:length/rate,getChannelData:()=>data};
    };
  };
  w.Audio=function(){this.loop=false;this.preload='';
    this.setAttribute=function(){};this.play=function(){plays++;return Promise.resolve();};
    this.pause=function(){};};

  w.eval(source('js/let-it-snow.js'));
  w.eval(source('js/rain-engine.js'));
  w.eval(source('js/rain-read.js'));
  return {w,audio,timers,frames,
    plays:()=>plays,
    level:()=>audio.master?audio.master.gain.value:0,
    /* The bed's low-pass is where the weight of the rain shows: 2500 Hz for
       the light band, 3900 for the wide one a downpour needs. */
    band:()=>{const f=audio.nodes.filter(n=>n.type==='lowpass');return f.length?f[f.length-1].frequency.value:0;},
    sky:()=>{const s=w.OLAE_WEATHER.state();return (s.kind||'none')+':'+s.level;},
    canvas:()=>w.document.querySelector('canvas'),
    essay:w.document.getElementById('essay-rain'),
    snow:w.document.getElementById('let-it-snow'),
    rain:w.document.getElementById('let-it-rain'),
    close:()=>dom.window.close()};
}

/* One button, three states, and each of them is both a sound and a sky. */
let h=harness();
assert.equal(h.essay.hidden,false,'the button appears where Web Audio does');
assert.equal(h.essay.textContent,'read with rain');
assert.equal(h.audio.contexts,0,'and costs nothing until it is asked');
assert.equal(h.canvas(),null);

h.essay.click();
assert.equal(h.essay.textContent,'heavier rain');
assert.equal(h.essay.getAttribute('aria-pressed'),'true');
assert.equal(h.sky(),'rain:1','the picture comes with the sound');
assert.equal(h.canvas().className,'snowfall weather-rain');
assert.equal(h.rain.dataset.weatherLevel,'1','and the footer says so too');
assert.equal(h.level(),0.13,'held at reading volume');
assert.equal(h.band(),2500,'a narrow band for light rain');
assert(h.plays()>0,'iOS silent-switch unlock on the tap');

h.essay.click();
assert.equal(h.essay.textContent,'stop the rain');
assert.equal(h.sky(),'rain:2');
assert.equal(h.rain.dataset.weatherLevel,'2');
assert.equal(h.level(),0.19,'a downpour is a little louder');
assert.equal(h.band(),3900,'and mostly a wider, lower band');
assert.equal(h.audio.contexts,1,'the same graph throughout, not a new one per weight');

h.essay.click();
assert.equal(h.essay.textContent,'read with rain');
assert.equal(h.essay.getAttribute('aria-pressed'),'false');
assert.equal(h.sky(),'none:0','the picture goes with the sound');
assert.equal(h.level(),0,'faded out, not cut');
h.close();

/* The footer's droplet is a picture and stays a silent one. */
h=harness();
h.rain.click();
assert.equal(h.sky(),'rain:1');
assert.equal(h.audio.contexts,0,'the footer never starts the sound');
assert.equal(h.essay.textContent,'read with rain');
/* But it is the same sky: a click there while the essay's rain plays makes
   that rain heavier, and one that takes the rain away ends it. */
h.essay.click();
assert.equal(h.sky(),'rain:1','joining the rain already falling, not resetting it');
assert.equal(h.essay.textContent,'heavier rain');
assert.equal(h.level(),0.13);
h.rain.click();
assert.equal(h.sky(),'rain:2');
assert.equal(h.level(),0.19,'the sound follows the window');
assert.equal(h.band(),3900);
assert.equal(h.essay.textContent,'stop the rain');
h.snow.click();
assert.equal(h.sky(),'snow:1','snow is not rain');
assert.equal(h.level(),0,'so the rain stops being heard');
assert.equal(h.essay.textContent,'read with rain');
assert.equal(h.essay.getAttribute('aria-pressed'),'false');
h.close();

/* Heavy rain already on the window is joined at its own weight. */
h=harness();
h.rain.click();h.rain.click();
assert.equal(h.sky(),'rain:2');
h.essay.click();
assert.equal(h.essay.textContent,'stop the rain','one click joins a downpour as a downpour');
assert.equal(h.level(),0.19);
assert.equal(h.band(),3900);
assert.equal(h.sky(),'rain:2','and does not disturb the picture');
h.close();

/* Without the footer's weather at all — a page that carries no canvas — the
   sound still plays: the picture is an addition, never a dependency. */
(function(){
  const dom=new JSDOM('<main>'+essayButtons+'</main>',{runScripts:'outside-only'});
  const w=dom.window;
  w.setTimeout=()=>0;w.clearTimeout=()=>{};w.setInterval=()=>0;w.clearInterval=()=>{};
  let masterGain=null;
  function param(value){return {value:value,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},
    linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(){},connect(){},disconnect(){}};}
  const node=extra=>Object.assign({connect(){},disconnect(){},start(){},stop(){}},extra);
  w.AudioContext=function(){
    this.sampleRate=8000;this.currentTime=0;this.state='running';this.destination=node({});
    this.resume=function(){};
    this.createGain=function(){const g=node({gain:param(1)});if(!masterGain)masterGain=g;return g;};
    this.createBiquadFilter=function(){return node({type:'',frequency:param(0),Q:param(0)});};
    this.createOscillator=function(){return node({type:'',frequency:param(0)});};
    this.createBufferSource=function(){return node({buffer:null,loop:false,onended:null});};
    this.createBuffer=function(c,l,r){const d=new Float32Array(l);return {duration:l/r,getChannelData:()=>d};};
  };
  w.Audio=function(){this.setAttribute=function(){};this.play=function(){return Promise.resolve();};
    this.pause=function(){};};
  w.eval(source('js/rain-engine.js'));
  w.eval(source('js/rain-read.js'));
  const btn=w.document.getElementById('essay-rain');
  assert.equal(btn.hidden,false);
  assert.equal(w.OLAE_WEATHER,undefined,'no weather on this page');
  btn.click();
  assert.equal(masterGain.gain.value,0.13,'and the rain is heard anyway');
  btn.click();
  assert.equal(masterGain.gain.value,0.19,'both weights, still with no picture');
  dom.window.close();
})();

console.log('Read with rain passed: one button for the sound and the sky, two weights that agree, a silent footer droplet that the sound follows, rain joined at the weight already falling, and sound without a picture where there is none.');
