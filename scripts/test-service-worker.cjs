/* The offline shell, exercised against the rendered worker in _site.
   Run `bundle exec jekyll build` first; the Liquid in sw.js needs it. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const built=path.join(__dirname,'../_site/sw.js');
assert.ok(fs.existsSync(built),'Build the site first: bundle exec jekyll build');

function harness({offline=false,seed=new Map()}={}){
  const cache={store:new Map(seed)};
  cache.match=async k=>cache.store.get(String(k));
  cache.put=async(k,v)=>{cache.store.set(String(k),v);};
  cache.addAll=async list=>{
    // Faithful to the real thing: all-or-nothing, and it fetches every entry.
    const fetched=await Promise.all(list.map(async u=>[u,await scope.fetch(u)]));
    if(fetched.some(([,res])=>!res.ok))throw Error('addAll: a request failed');
    fetched.forEach(([u,res])=>cache.store.set(String(u),res));
  };
  const network=[];
  const scope={
    caches:{
      open:async()=>cache,
      keys:async()=>[...deleted.known],
      delete:async k=>{deleted.calls.push(k);return true;}
    },
    fetch:async req=>{
      const url=typeof req==='string'?req:req.url;
      network.push(url);
      if(offline)throw Error('offline');
      return {ok:true,body:url,clone(){return this;}};
    },
    URL,
    listeners:{},
    addEventListener(type,fn){(scope.listeners[type]=scope.listeners[type]||[]).push(fn);},
    skipWaiting:async()=>{},
    clients:{claim:async()=>{}},
    location:{origin:'https://hakanaltun.io'}
  };
  const deleted={known:['olae-tools-v29','olae-tools-v30','other-cache-v1'],calls:[]};
  scope.self=scope;
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(built,'utf8'),scope);
  const fire=(type,event)=>scope.listeners[type].forEach(fn=>fn(event));
  return {scope,cache,network,deleted,fire};
}
async function request(h,url){
  let responded=null;
  h.fire('fetch',{request:{method:'GET',url},respondWith(p){responded=p;}});
  return responded===null?null:await responded;
}

async function main(){
  // Install precaches the tool pages and their shell — and nothing under the
  // bundled PDF reader, which is 7.3 MB and blocks the install if listed.
  {
    const h=harness();
    let waited;h.fire('install',{waitUntil(p){waited=p;}});await waited;
    const keys=[...h.cache.store.keys()];
    assert.ok(keys.includes('/read/'),'The Reader is precached');
    assert.ok(keys.includes('/js/reader-pdf.js'),'and so is its PDF controller');
    assert.ok(keys.includes('/css/reader-pdf.css'));
    assert.ok(keys.includes('/js/let-it-snow.js'),'the footer weather is part of the shell');
    assert.ok(keys.includes('/css/let-it-snow.css'));
    assert.equal(keys.filter(k=>k.startsWith('/js/vendor/pdfjs/')).length,0,
      'the bundled reader is never precached');
    assert.ok(keys.length>25);
  }

  // Activate retires our own old versions only.
  {
    const h=harness();
    let waited;h.fire('activate',{waitUntil(p){waited=p;}});await waited;
    assert.deepEqual(h.deleted.calls,['olae-tools-v29'],'and leaves other caches alone');
  }

  // A PDF.js file is not precached, but it is kept the first time it is used.
  {
    const h=harness();
    const url='https://hakanaltun.io/js/vendor/pdfjs/build/pdf.worker.mjs';
    const first=await request(h,url);
    assert.ok(first,'the worker answers for PDF.js');
    assert.deepEqual(h.network,[url],'fetched once, from the network');
    assert.ok(h.cache.store.has('/js/vendor/pdfjs/build/pdf.worker.mjs'),'and kept');
    // Offline afterwards, the kept copy is what a reader gets.
    const later=harness({offline:true,seed:h.cache.store});
    assert.equal((await request(later,url)).body,url,'served from cache with no connection');
    assert.equal(later.network.length,1,'the failed revalidation is not the answer');
  }

  // A cmap or font PDF.js asks for later is covered by the same rule.
  {
    const h=harness();
    assert.ok(await request(h,'https://hakanaltun.io/js/vendor/pdfjs/web/cmaps/Adobe-Japan1-UCS2.bcmap'));
    assert.ok(await request(h,'https://hakanaltun.io/js/vendor/pdfjs/web/standard_fonts/FoxitSans.pfb'));
  }

  // Everything else on the origin is still none of the worker's business.
  {
    const h=harness();
    assert.equal(await request(h,'https://hakanaltun.io/pieces/an-essay.html'),null);
    assert.equal(await request(h,'https://hakanaltun.io/js/puzzle-mode.js'),null);
    assert.equal(await request(h,'https://hakanaltun.io/js/vendor/pdfjs'),null,'the prefix must be a directory');
    assert.equal(h.network.length,0);
    // Cross-origin and non-GET stay untouched too.
    assert.equal(await request(h,'https://gc.zgo.at/count.js'),null);
    let responded=null;
    h.fire('fetch',{request:{method:'POST',url:'https://hakanaltun.io/read/'},respondWith(p){responded=p;}});
    assert.equal(responded,null);
  }

  // The ?v= keying survives: a stamped asset is kept under its stamped key,
  // and offline falls back to the copy laid down at install.
  {
    const h=harness({seed:new Map([['/js/reader-pdf.js',{ok:true,body:'installed',clone(){return this;}}]])});
    await request(h,'https://hakanaltun.io/js/reader-pdf.js?v=20260909-3');
    assert.ok(h.cache.store.has('/js/reader-pdf.js?v=20260909-3'),'kept under the stamped key');
    const later=harness({offline:true,seed:new Map([['/js/reader-pdf.js',{ok:true,body:'installed',clone(){return this;}}]])});
    const answer=await request(later,'https://hakanaltun.io/js/reader-pdf.js?v=20260910-9');
    assert.equal(answer.body,'installed','an unseen stamp falls back to the installed copy');
  }

  console.log('Service worker checks passed: precache contents, PDF.js cached on use not on install, offline reuse, pass-through and ?v= keying.');
}
main().catch(error=>{console.error(error);process.exit(1);});
