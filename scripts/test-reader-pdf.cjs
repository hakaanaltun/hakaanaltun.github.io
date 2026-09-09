/* DOM-level integration tests; no browser or network is required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '..');
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
function setup(){
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'read/index.html'), 'utf8').replace(/\{%[\s\S]*?%\}/g,''), {url:'https://hakanaltun.io/read/',runScripts:'outside-only',pretendToBeVisual:true});
  const w = dom.window;
  w.ResizeObserver = class{observe(){} disconnect(){}};
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLCanvasElement.prototype.getContext = () => ({});
  const defaultRect = w.HTMLElement.prototype.getBoundingClientRect;
  w.HTMLElement.prototype.getBoundingClientRect = function(){
    if(this.classList.contains('pdf-scroll')) return {left:180,right:844,top:160,bottom:900,width:664,height:740};
    if(this.classList.contains('pdf-toolbar')) return {left:180,right:844,top:100,bottom:150,width:664,height:50};
    return defaultRect.call(this);
  };
  w.TextDecoder = TextDecoder;
  Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 360;}});
  w.eval(fs.readFileSync(path.join(root,'js/reader-pdf.js'),'utf8'));
  return dom;
}
async function main(){
  const dom = setup(), w = dom.window;
  let destroyed = 0, cancels = 0, saved = 0;
  const doc = {numPages:4,getPage:async n => ({
    getViewport:({scale}) => ({width:600*scale,height:800*scale}),cleanup(){},
    render(){ return {promise:Promise.resolve(),cancel(){cancels++;}}; },
    streamTextContent(){ return {}; }
  })};
  const prepared = {doc,task:{destroy:async()=>{destroyed++;}},lib:{TextLayer:class{render(){return Promise.resolve();} cancel(){}}}};
  const viewer = w.OLAE_PDF.mount(prepared,w.document.querySelector('#reading'),3,()=>{saved++;});
  await tick();
  assert.equal(viewer.page(),3);
  assert.equal(w.document.querySelectorAll('canvas').length,1);
  w.document.querySelector('[data-pdf="next"]').click();
  await tick();
  assert.equal(viewer.page(),4);
  assert.equal(w.document.querySelector('[data-pdf="next"]').disabled,true);
  assert.equal(saved,1);
  const sideNav=w.document.querySelector('.pdf-side-nav');
  const sidePrev=w.document.querySelector('.pdf-side-prev');
  const sideNext=w.document.querySelector('.pdf-side-next');
  assert.equal(sideNext.disabled,true);
  assert.equal(sideNav.classList.contains('pdf-nav-visible'),false);
  w.document.body.dispatchEvent(new w.MouseEvent('pointermove',{bubbles:true,clientX:190,clientY:300}));
  assert(sideNav.classList.contains('pdf-nav-visible'));
  w.document.body.dispatchEvent(new w.MouseEvent('click',{bubbles:true,clientX:500,clientY:950}));
  assert.equal(sideNav.classList.contains('pdf-nav-visible'),false);
  // A first edge tap reveals the arrows without turning the page.
  w.document.body.dispatchEvent(new w.MouseEvent('click',{bubbles:true,clientX:190,clientY:300}));
  assert(sideNav.classList.contains('pdf-nav-visible'));
  assert.equal(viewer.page(),4);
  sidePrev.click();await tick();assert.equal(viewer.page(),3);
  assert(sideNav.classList.contains('pdf-nav-visible'));
  await new Promise(resolve=>setTimeout(resolve,2250));
  assert.equal(sideNav.classList.contains('pdf-nav-visible'),false);
  sidePrev.focus();assert(sideNav.classList.contains('pdf-nav-visible'));
  sidePrev.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(w.document.activeElement,w.document.querySelector('.pdf-scroll'));
  assert.equal(sideNav.classList.contains('pdf-nav-visible'),false);
  const input = w.document.querySelector('[data-pdf="page"]');
  input.value='-20';input.dispatchEvent(new w.Event('change'));
  await tick();assert.equal(viewer.page(),1);
  assert.equal(sidePrev.disabled,true);
  input.value='';input.dispatchEvent(new w.Event('change'));
  assert.equal(viewer.page(),1);
  const zoom = w.document.querySelector('[data-pdf="zoom"]');
  function arrow(key, target=w.document.body, options={}){
    const event=new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...options});
    target.dispatchEvent(event);return event;
  }
  assert(arrow('ArrowRight').defaultPrevented);await tick();assert.equal(viewer.page(),2);
  assert(arrow('ArrowLeft').defaultPrevented);await tick();assert.equal(viewer.page(),1);
  arrow('ArrowLeft');assert.equal(viewer.page(),1);
  for(const target of [input,zoom,w.document.querySelector('#shVol')]){
    assert.equal(arrow('ArrowRight',target).defaultPrevented,false);
    assert.equal(viewer.page(),1);
  }
  const editable=w.document.createElement('div');editable.setAttribute('contenteditable','true');
  const child=w.document.createElement('span');editable.appendChild(child);w.document.body.appendChild(editable);
  assert.equal(arrow('ArrowRight',child).defaultPrevented,false);assert.equal(viewer.page(),1);editable.remove();
  for(const modifier of ['altKey','ctrlKey','metaKey','shiftKey','isComposing']){
    assert.equal(arrow('ArrowRight',w.document.body,{[modifier]:true}).defaultPrevented,false);
    assert.equal(viewer.page(),1);
  }
  const range=w.document.createRange();range.selectNodeContents(w.document.querySelector('.pdf-status'));
  w.getSelection().removeAllRanges();
  w.getSelection().addRange(range);
  assert.equal(arrow('ArrowRight').defaultPrevented,false);assert.equal(viewer.page(),1);
  w.getSelection().removeAllRanges();
  arrow('ArrowRight',w.document.querySelector('.pdf-scroll'));await tick();assert.equal(viewer.page(),2);
  arrow('ArrowRight',w.document.body,{repeat:true});assert.equal(viewer.page(),2);
  arrow('ArrowLeft');await tick();assert.equal(viewer.page(),1);
  zoom.value='3';zoom.dispatchEvent(new w.Event('change'));
  w.document.querySelector('[data-pdf="next"]').click();
  await tick();
  assert.equal(w.document.querySelectorAll('canvas').length,1);
  assert.equal(w.document.querySelector('canvas').style.width,'1800px');
  viewer.destroy();assert.equal(destroyed,1);assert.equal(w.document.querySelectorAll('canvas').length,0);
  assert.equal(w.document.querySelector('.pdf-side-nav'),null);
  assert.equal(arrow('ArrowRight').defaultPrevented,false);
  w.document.body.dispatchEvent(new w.MouseEvent('pointermove',{bubbles:true,clientX:190,clientY:300}));
  dom.window.close();

  const second = setup(), v = second.window;
  let pdfPage = 2, clearCount=0, reject=false, deferred;
  v.OLAE_PDF = {
    prepare:async(file,alive) => {if(reject)throw Error('Bad PDF');if(file.name==='slow.pdf')await new Promise(r=>deferred=r);return alive()?{}:null;},
    mount(p,host,page,onPage){
      pdfPage=page||1;host.textContent='PDF page';
      return {page:()=>pdfPage,progress:()=>0.5,destroy:()=>{clearCount++;}};
    }
  };
  const scripts=[...v.document.querySelectorAll('script:not([src])')];
  v.eval(scripts.find(s=>s.textContent.includes('function openFile')).textContent);
  function open(name,body='test',type='application/pdf'){
    const file = new v.File([body],name,{type,lastModified:1});
    const input=v.document.querySelector('#fileInput');
    Object.defineProperty(input,'files',{configurable:true,value:[file]});
    input.dispatchEvent(new v.Event('change'));
    return file;
  }
  open('book.PDF');await tick();assert(v.document.body.classList.contains('reading-pdf'));
  pdfPage=3;v.dispatchEvent(new v.Event('beforeunload'));
  // jsdom has no viewport layout; use scroll's delayed save with dimensions.
  v.document.documentElement.getBoundingClientRect=()=>({width:360});
  v.dispatchEvent(new v.Event('beforeunload'));
  open('book.PDF');await tick();assert.equal(pdfPage,3);
  reject=true;open('broken.pdf');await tick();assert.equal(v.document.querySelector('#reading').textContent,'PDF page');
  reject=false;open('slow.pdf');await tick();
  open('note.txt','A readable paragraph.','text/plain');await tick();deferred();await tick();
  assert.equal(v.document.body.classList.contains('reading-pdf'),false);
  assert.equal(v.document.querySelector('#reading p').textContent,'A readable paragraph.');
  assert(clearCount>=2);
  second.window.close();
  console.log('PDF controls, side arrows, reveal/hide timer, keyboard, rendering, bookmarks and PDF → TXT race: passed');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
