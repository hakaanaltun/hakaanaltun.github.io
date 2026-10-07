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
   essay its own buttons above it. */
const form=source('_includes/search-form.html')
  .replace(/\{\{ include\.id \}\}/g,'footer-search')
  .replace(/\{% if include\.modifier %\}[^{]*\{\{ include\.modifier \}\}\{% endif %\}/,' site-search-form--footer');
const footer=source('_includes/footer.html').replace(/\{% include search-form\.html[^%]*%\}/,form);
const essayButtons=(source('_layouts/post.html').match(/<button[^>]*id="essay-(?:rain|puzzle)"[\s\S]*?<\/button>/g)||[]).join('');
assert.equal((essayButtons.match(/<button/g)||[]).length,2,'The essay still offers read-with-rain and puzzle mode');

const opened=[];
function page({essay=false,width=300,random=0,pathname,search=false}={}){
  let html='<main id="main">'+(essay?essayButtons:'')+'</main>'+liquid(footer);
  if(search)html=html.replace('site-search-form--footer','').replace(/footer-search/g,'site-search');
  const dom=new JSDOM(html,{url:'https://example.test'+(pathname||(essay?'/pieces/x.html':'/about/')),runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
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
  const input=w.document.getElementById(search?'site-search':'footer-search');
  const f=input.form;
  let searches=0;
  f.addEventListener('submit',()=>{searches++;});
  w.eval(source('js/search-suggest.js'));
  return {w,input,clicks,
    submit(value){input.value=value;return !f.dispatchEvent(new w.Event('submit',{cancelable:true}));},
    key(k){const e=new w.KeyboardEvent('keydown',{key:k,cancelable:true,bubbles:true});input.dispatchEvent(e);return e.defaultPrevented;},
    type(value){input.focus();input.value=value;input.setSelectionRange(value.length,value.length);input.dispatchEvent(new w.Event('input'));},
    ghost:()=>f.querySelector('.search-ghost'),
    suggestion:()=>f.querySelector('.search-suggestion'),
    searches:()=>searches,
    weather:()=>w.OLAE_WEATHER.state().kind,
    said:()=>{const s=w.document.querySelector('.search-said');return s&&!s.hidden?s.textContent:'';}};
}

// Away from an essay, nothing of an essay's is offered.
for(let r=0;r<1;r+=0.05){
  const p=page({random:r});
  assert.match(p.input.placeholder,/^Search, or [a-z][a-z’ ]+$/,'the offer is named as a thing to do, not quoted as words to type');
  assert.doesNotMatch(p.input.placeholder,/puzzle mode|read with rain|guess the word|translate a line|keep a line/);
  assert.doesNotMatch(p.input.placeholder,/share/,'sharing is left to whoever wants to share');
  assert.doesNotMatch(p.input.placeholder,/farm house/,'the photograph in The House is the suggested way to the farm');
}

// Search and actions remain separate in the main field too.
{
  const p=page({search:true,pathname:'/search/'});
  assert.equal(p.submit('let it snow'),false);
  assert.equal(p.weather(),null,'Enter on a full command still searches');
  assert.equal(p.searches(),1);
  p.type('let it snow');
  p.suggestion().click();
  assert.equal(p.weather(),'snow','only the separate button runs the action');
  assert.equal(p.submit('moon'),false);
  assert.equal(p.searches(),2,'ordinary queries still reach the search handler');
}

// A focused field offers one touch/keyboard button; ordinary searches hide it.
{
  const p=page({random:0.1});
  assert.equal(p.suggestion().hidden,true);
  p.input.focus();
  assert.equal(p.suggestion().hidden,false);
  assert.equal(p.suggestion().textContent,'Let it snow');
  p.suggestion().focus();
  assert.equal(p.suggestion().hidden,false,'moving focus to the button keeps it usable');
  p.suggestion().click();
  assert.equal(p.weather(),'snow');
  assert.equal(p.suggestion().hidden,true,'acting does not leave a new button under the same tap');
  assert.equal(p.w.document.activeElement,p.input,'focus returns to the field');
  p.type('moon');
  assert.equal(p.suggestion().hidden,true);
  p.type('let it r');
  assert.equal(p.suggestion().textContent,'Let it rain');
  assert.equal(p.suggestion().hidden,false);
  p.key('Escape');
  assert.equal(p.suggestion().hidden,true);
  assert.equal(p.input.value,'let it r','Escape preserves the query');
}

// Even when a placeholder cannot fit, the focused button can wrap its offer.
{
  const p=page({random:0.1,width:120});
  p.input.focus();
  assert.equal(p.suggestion().hidden,false);
  p.suggestion().click();
  assert.equal(p.weather(),'snow');
}

// The farm is suggested only in The House. Quiz suggestions offer a quiz.
{
  const home=page({pathname:'/house/'});
  home.input.focus();home.type('visit');
  assert.equal(home.suggestion().textContent,'Visit the farm house');
  const other=page();
  other.input.focus();other.type('visit');
  assert.equal(other.suggestion().hidden,true);
  assert.equal(other.ghost().hidden,true);
  other.type('visit the farm house');
  assert.equal(other.suggestion().hidden,true);
  assert.equal(other.submit('visit the farm house'),false);
  other.type('take');
  assert.equal(other.suggestion().textContent,'Take a quiz');
  const quiz=page({pathname:'/trivia/american/'});
  quiz.input.focus();quiz.type('take');
  assert.equal(quiz.suggestion().hidden,true);
}

// An empty submission never performs an unexpected action.
{
  const p=page({random:0.1});
  assert.equal(p.input.placeholder,'Search, or let it snow');
  assert.equal(p.submit(''),false,'even an empty field keeps the search action');
  assert.equal(p.weather(),null);
  p.input.focus();
  assert.equal(p.input.placeholder,'Search the site','focus makes the field’s purpose explicit');
  p.suggestion().click();
  assert.equal(p.weather(),'snow');
  assert.match(p.said(),/snowflake at the foot of the page/);
  assert.doesNotMatch(p.input.placeholder,/let it snow/,'snow already falling is not offered again');
}

// Full command phrases remain searchable; actions need an explicit selection.
{
  const p=page();
  assert.equal(p.submit('Let it rain'),false);
  assert.equal(p.weather(),null);
  p.type('Let it rain');
  p.suggestion().click();
  assert.equal(p.weather(),'rain');
  assert.equal(p.input.value,'','the field is cleared after an action');
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
  assert.equal(p.input.placeholder,'Search, or read with rain');
  p.input.focus();
  p.suggestion().click();
  assert.equal(p.clicks['essay-rain'],1);
  p.type('open puzzle mode');
  p.suggestion().click();
  assert.equal(p.clicks['essay-puzzle'],1);
  p.type('open puzzle mode');
  assert.equal(p.suggestion().hidden,true,'what is already on is not offered again');
}

// A field too narrow for the offer only offers to search; an empty search
// there does nothing new.
{
  const fits=page({random:0.1,width:230});
  assert.equal(fits.input.placeholder,'Search, or let it snow');
  /* 154px of line in 180px of field: it would fit, but not beside the room
     the browser keeps for its clear button. */
  const narrow=page({random:0.1,width:200});
  assert.equal(narrow.input.placeholder,'Search the site');
  assert.equal(narrow.submit(''),false,'nothing unseen runs from an empty field');
  assert.equal(narrow.weather(),null);
}

// Exercise the actual live-search script alongside suggestions. An exact
// action phrase is still a query, and an action clears stale results.
(async()=>{
  const p=page({search:true,pathname:'/search/'});
  const d=p.w.document;
  d.getElementById('main').innerHTML='<div data-search-index="/search-index.json"><p id="search-status"></p><ul id="search-results"></ul></div>';
  p.w.fetch=async()=>({ok:true,json:async()=>[
    {title:'Let it snow',url:'/notes/',kind:'Page',text:'Snow in the garden.',description:''},
    {title:'The Moon',url:'/moon/',kind:'Instrument',text:'Moon phase',description:''}
  ]});
  p.w.eval(source('js/site-search.js'));
  p.submit('let it snow');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(p.weather(),null);
  assert.equal(d.querySelector('#search-results a').textContent,'Let it snow');
  assert.equal(p.w.location.search,'?q=let+it+snow');
  p.type('let it snow');
  p.suggestion().click();
  await new Promise(resolve=>setTimeout(resolve,180));
  assert.equal(p.weather(),'snow');
  assert.equal(d.querySelector('#search-results a'),null);
  assert.equal(p.w.location.search,'');
  p.submit('moon');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(d.querySelector('#search-results a').textContent,'The Moon');
  console.log('Search suggestions passed: Enter always searches, actions require the separate button, all fields offer suggestions, narrow offers wrap, and the farm is offered only in The House.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{for(const w of opened)w.close();});
