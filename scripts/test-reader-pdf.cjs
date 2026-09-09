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
  const input = w.document.querySelector('[data-pdf="page"]');
  input.value='-20';input.dispatchEvent(new w.Event('change'));
  await tick();assert.equal(viewer.page(),1);
  input.value='';input.dispatchEvent(new w.Event('change'));
  assert.equal(viewer.page(),1);
  const zoom = w.document.querySelector('[data-pdf="zoom"]');
  zoom.value='3';zoom.dispatchEvent(new w.Event('change'));
  w.document.querySelector('[data-pdf="next"]').click();
  await tick();
  assert.equal(w.document.querySelectorAll('canvas').length,1);
  assert.equal(w.document.querySelector('canvas').style.width,'1800px');
  viewer.destroy();assert.equal(destroyed,1);assert.equal(w.document.querySelectorAll('canvas').length,0);
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
  console.log('PDF controls, bounded rendering, bookmarks, errors and PDF → TXT race: passed');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
