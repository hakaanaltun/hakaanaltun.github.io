/* Run with Node 22+ from the repository root: node scripts/test-instrument-safety.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { deflateRawSync } = require('node:zlib');
const root = require('node:path').resolve(__dirname, '..');
const source = name => fs.readFileSync(require('node:path').join(root, name), 'utf8');
function script(html) { return html.split('<script>')[1].split('</script>')[0]; }
function testStorage() {
  let denied = false, writes = 0, notice, windowEvents = {}, docEvents = {};
  const document = {
    body: { appendChild(el) { notice = el; } },
    createElement() { return { hidden: false, setAttribute(k,v) { this[k] = v; } }; },
    addEventListener(k, fn) { docEvents[k] = fn; }, visibilityState: 'visible'
  };
  const window = { addEventListener(k, fn) { windowEvents[k] = fn; } };
  const localStorage = { setItem() { if(denied) throw Error('quota or access denied'); writes++; } };
  vm.runInNewContext(script(source('_includes/storage-feedback.html')), {window,document,localStorage});
  const storage = window.OLAE_STORAGE;
  assert.equal(storage.save('draft','original'), true);
  assert.equal(notice, undefined, 'no warning during normal use');
  denied = true;
  assert.equal(storage.save('draft','new work'), false);
  assert.equal(writes, 1, 'last successful value survives');
  assert.equal(notice.hidden, false);
  assert.equal(notice.role, 'alert');
  storage.guard(() => storage.save('draft','new work'));
  let prevented = false;
  windowEvents.beforeunload({preventDefault(){ prevented = true; }});
  assert(prevented, 'unsaved work guards closing');
  denied = false;
  document.visibilityState = 'hidden'; docEvents.visibilitychange();
  assert.equal(notice.hidden, true, 'later successful save clears warning');
  prevented = false;
  windowEvents.beforeunload({preventDefault(){ prevented = true; }});
  assert.equal(prevented, false, 'saved work does not block closing');
}
function makeZip(text, {method=8, declared, name='text.txt', offset=0}={}) {
  const raw = Buffer.from(text), packed = method===8 ? deflateRawSync(raw) : raw;
  const file = Buffer.from(name), local = Buffer.alloc(30), central = Buffer.alloc(46), end = Buffer.alloc(22);
  local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(method,8); local.writeUInt16LE(file.length,26);
  central.writeUInt32LE(0x02014b50,0); central.writeUInt16LE(method,10);
  central.writeUInt32LE(packed.length,20); central.writeUInt32LE(declared ?? raw.length,24);
  central.writeUInt16LE(file.length,28); central.writeUInt32LE(offset,42);
  end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(1,10);
  end.writeUInt32LE(local.length+file.length+packed.length,16);
  const result=Buffer.concat([local,file,packed,central,file,end]);
  return result.buffer.slice(result.byteOffset,result.byteOffset+result.length);
}
function parser(extra={}) {
  const html=source('read/index.html');
  const code=html.slice(html.indexOf('  function parseZip(buf){'),html.indexOf('  function readEntryText('));
  const context={TextDecoder,DataView,Uint8Array,Blob,DecompressionStream,
    ZIP_MAX_ENTRIES:8192, ZIP_MAX_ENTRY:128*1024*1024, ZIP_MAX_TOTAL:200*1024*1024, ZIP_MAX_RATIO:500,...extra};
  vm.createContext(context); vm.runInContext(code,context); return context.parseZip;
}
async function testZip() {
  const parse=parser();
  for(const method of [0,8]) {
    const zip=parse(makeZip('Hello İstanbul',{method}));
    assert.equal(new TextDecoder().decode(await zip.read('text.txt')),'Hello İstanbul');
    await assert.rejects(zip.read('missing'),/missing/);
    await assert.rejects(parse(makeZip('Hello',{method,declared:1})).read('text.txt'),/size|large/);
    await assert.rejects(parse(makeZip('Hello',{method,declared:30})).read('text.txt'),/size/);
  }
  await assert.rejects(parse(makeZip('Hello',{offset:0xFFFFFF})).read('text.txt'),/bad/);
  assert.throws(()=>parse(makeZip('a',{declared:129*1024*1024})),/large/);
  const special=parse(makeZip('safe',{name:'__proto__'}));
  assert(special.has('__proto__')); assert.equal(new TextDecoder().decode(await special.read('__proto__')),'safe');
  /* A dishonest stream is cancelled on its first oversized chunk, without
     collecting all its output. Small fixture sizes keep this a safe test. */
  let reads=0,cancelled=false,released=false;
  class FakeBlob { stream(){return {pipeThrough(){return {getReader(){return {
    async read(){ reads++; return {done:false,value:new Uint8Array(100)}; },
    async cancel(){cancelled=true;}, releaseLock(){released=true;}
  };}};}};} }
  await assert.rejects(parser({Blob:FakeBlob})(makeZip('a')).read('text.txt'),/large/);
  assert.equal(reads,1); assert(cancelled); assert(released);
}
function testClipboard(){
  for(const slug of ['marks','clean','list','lots']){
    const html=source(slug+'/index.html');
    const start=html.indexOf('  function execCopy(text){');
    const code=html.slice(start,html.indexOf('\n  }',start)+4);
    let result=false, removed=false, throwCopy=false;
    const document={
      body:{appendChild(){}},
      createElement(){return {style:{},select(){},setAttribute(){},remove(){removed=true;}};},
      execCommand(){if(throwCopy)throw Error('denied');return result;}
    };
    const ctx={document};vm.createContext(ctx);vm.runInContext(code,ctx);
    assert.equal(ctx.execCopy('test'),false,slug+' reports refusal');assert(removed);
    result=true;assert.equal(ctx.execCopy('test'),true,slug+' reports success');
    throwCopy=true;assert.equal(ctx.execCopy('test'),false,slug+' handles denied clipboard');
  }
}
function testDates() {
  const html=source('days/index.html');
  const code=html.slice(html.indexOf('  function parseDate(v){'),html.indexOf('  function todayParts(){'));
  const ctx={Date,DAY:86400000}; vm.createContext(ctx);vm.runInContext(code,ctx);
  assert.equal(new Date(ctx.noon({y:1,m:1,d:1})).getUTCFullYear(),1);
  assert.equal(new Date(ctx.noon({y:1,m:1,d:1})).getUTCDay(),1);
  assert.equal(ctx.daysBetween({y:99,m:12,d:31},{y:100,m:1,d:1}),1);
  assert.equal(ctx.daysBetween({y:2024,m:2,d:28},{y:2024,m:3,d:1}),2);
  assert.equal(ctx.daysInMonth(4,2),29);
  assert.equal(ctx.isoWeek({y:1,m:1,d:1}),1);
  assert.equal(ctx.isoWeek({y:2000,m:1,d:1}),52);
  assert.equal(ctx.isoWeek({y:2021,m:1,d:1}),53);
}
(async()=>{testStorage();await testZip();testClipboard();testDates();console.log('Instrument safety checks passed: storage failure/recovery, bounded ZIP decoding, clipboard failure, calendar edge cases.');})().catch(e=>{console.error(e);process.exitCode=1;});
