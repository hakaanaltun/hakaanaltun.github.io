/* The search field's suggestions (js/search-suggest.js): it offers only what
   the page can do, does it when asked, and is still a search field for
   everything else.
   Run with Node 22+ from the repository root: node scripts/test-search-suggest.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const liquid=html=>html.replace(/\{%-?[\s\S]*?-?%\}/g,'').replace(/\{\{[^}]*\}\}/g,'');

/* The real form, as the footer includes it, inside the real footer; and on an
   essay the header's buttons above it. */
const form=source('_includes/search-form.html')
  .replace(/\{\{ include\.id \}\}/g,'footer-search')
  .replace(/\{% if include\.modifier %\}[^{]*\{\{ include\.modifier \}\}\{% endif %\}/,' site-search-form--footer');
const footer=source('_includes/footer.html').replace(/\{% include search-form\.html[^%]*%\}/,form);
const essayButtons=(source('_layouts/post.html').match(/<button[^>]*id="essay-(?:rain|puzzle)"[\s\S]*?<\/button>/g)||[]).join('');
assert.equal((essayButtons.match(/<button/g)||[]).length,2,'The essay header still has read-with-rain and puzzle mode');

const opened=[];
function page({essay=false,width=300,random=0}={}){
  const html='<main id="main">'+(essay?essayButtons:'')+'</main>'+liquid(footer);
  const dom=new JSDOM(html,{url:'https://example.test'+(essay?'/pieces/x.html':'/about/'),runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const w=dom.window;
  opened.push(w);
  w.Math.random=()=>random;
  w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};
  w.ResizeObserver=class{observe(){}disconnect(){}};
  w.matchMedia=()=>({matches:false,addEventListener(){}});
  /* A field of a known width, and a face in which every letter is 7px, so
     what fits is arithmetic. */
  Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return width;}});
  w.getComputedStyle=()=>({paddingLeft:'10px',paddingRight:'10px',font:'15px serif',letterSpacing:'normal',getPropertyValue:()=>''});
  w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:t.length*7}),
    setTransform(){},clearRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},
    save(){},restore(){},fillRect(){},arc(){},ellipse(){},createLinearGradient(){return {addColorStop(){}};}});
  w.eval(source('js/let-it-snow.js'));
  const clicks={};
  if(essay)for(const id of ['essay-rain','essay-puzzle']){
    const b=w.document.getElementById(id);b.hidden=false;clicks[id]=0;
    b.addEventListener('click',()=>{clicks[id]++;b.setAttribute('aria-pressed','true');});
  }
  w.eval(source('js/search-suggest.js'));
  const input=w.document.getElementById('footer-search');
  const f=input.form;
  return {w,input,clicks,
    submit(value){input.value=value;return !f.dispatchEvent(new w.Event('submit',{cancelable:true}));},
    key(k){const e=new w.KeyboardEvent('keydown',{key:k,cancelable:true});input.dispatchEvent(e);return e.defaultPrevented;},
    type(value){input.value=value;input.setSelectionRange(value.length,value.length);input.dispatchEvent(new w.Event('input'));},
    ghost:()=>f.querySelector('.search-ghost'),
    weather:()=>w.OLAE_WEATHER.state().kind,
    said:()=>{const s=w.document.querySelector('.search-said');return s&&!s.hidden?s.textContent:'';}};
}

// Away from an essay, nothing of an essay's is offered.
for(let r=0;r<1;r+=0.05){
  const p=page({random:r});
  assert.match(p.input.placeholder,/^(Search, or try|Try) “.+”$/);
  assert.doesNotMatch(p.input.placeholder,/puzzle mode|read with rain|guess the word|translate a line|keep a line/);
  assert.doesNotMatch(p.input.placeholder,/share/,'sharing is left to whoever wants to share');
}

// With the field empty, the search button does the thing on offer.
{
  const p=page({random:0.1});
  assert.equal(p.input.placeholder,'Search, or try “let it snow”');
  assert.equal(p.submit(''),true,'an empty field runs its suggestion instead of searching');
  assert.equal(p.weather(),'snow');
  assert.match(p.said(),/snowflake at the foot of the page/);
  assert.doesNotMatch(p.input.placeholder,/let it snow/,'snow already falling is not offered again');
}

// Typed in full, a command is done in place; anything else is searched.
{
  const p=page();
  assert.equal(p.submit('Let it rain'),true);
  assert.equal(p.weather(),'rain');
  assert.equal(p.input.value,'','the field is cleared after a command');
  assert.equal(p.submit('rain'),false,'a word that only begins a command is searched');
  assert.equal(p.submit('let it snow please'),false);
}

// Typed in part, the rest shows faintly and → takes it; Tab is left alone.
{
  const p=page({random:0.1});
  p.type('le');
  assert.equal(p.ghost().hidden,true,'two letters are too few to guess from');
  p.type('let');
  assert.equal(p.ghost().hidden,false);
  assert.equal(p.ghost().textContent,'let it snow','the one on offer wins a shared start');
  assert.equal(p.key('Tab'),false,'Tab still moves between controls');
  assert.equal(p.key('ArrowRight'),true);
  assert.equal(p.input.value,'let it snow');
  p.type('');
  assert.equal(p.key('ArrowRight'),true,'→ in an empty field takes the suggestion');
  assert.equal(p.input.value,'let it snow');
  p.type('zzz');
  assert.equal(p.ghost().hidden,true);
  assert.equal(p.key('ArrowRight'),false);
}

// On an essay its own things are offered, and done.
{
  const p=page({essay:true,random:0});
  assert.equal(p.input.placeholder,'Search, or try “read with rain”');
  assert.equal(p.submit(''),true);
  assert.equal(p.clicks['essay-rain'],1);
  assert.equal(p.submit('puzzle mode'),true);
  assert.equal(p.clicks['essay-puzzle'],1);
  assert.equal(p.submit('puzzle mode'),false,'what is already on is not a command any more');
}

// A narrow field shortens the offer, and one too narrow for it offers only
// to search; an empty search there does nothing new.
{
  /* 196px of line in 210px of field: it would fit, but not beside the room
     the browser keeps for its clear button, so it is shortened. */
  const tight=page({random:0.1,width:230});
  assert.equal(tight.input.placeholder,'Try “let it snow”');
  const shorter=page({random:0.1,width:200});
  assert.equal(shorter.input.placeholder,'Try “let it snow”');
  const narrow=page({random:0.1,width:120});
  assert.equal(narrow.input.placeholder,'Search the site');
  assert.equal(narrow.submit(''),false,'nothing unseen runs from an empty field');
  assert.equal(narrow.weather(),null);
}

for(const w of opened)w.close();
console.log('Search suggestions passed: only what the page can do, done from an empty field or a full command, searched otherwise, completed with → and never Tab, and shortened or withdrawn where the field is narrow.');
