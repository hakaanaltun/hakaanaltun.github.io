/* Requires jsdom 26.x on NODE_PATH (test-only; no browser dependency).
   node scripts/test-reader-markdown.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const marked = require('../js/vendor/marked-18.0.11.umd.js');
const {render} = require('../js/reader-markdown.js').OLAE_MARKDOWN;
const doc = new JSDOM('').window.document;
const sample = '# İstanbul &amp; ışık\n\n*italic* **bold** ~~old~~ and `&lt;code&gt;`.\n\n> A quotation.\n\n---\n\n3. Three\n4. Four\n\n- [x] Done\n- [ ] Later\n\n| Name | State |\n| --- | --- |\n| Moris | asleep |\n\n```js\n<script>no execution</script>\n```\n\n[Jump](#second) [Site](https://example.com) [Mail](mailto:reader@example.com)\n\n## Second\n\n## Second\n\n## Second-1\n\nFinal paragraph.';
const result = render(sample, doc, marked.lexer), section = result.section;
assert.equal(section.querySelector('h1').textContent, 'İstanbul & ışık');
for(const tag of ['em','strong','del','blockquote','hr','ol','ul','table','pre','code']) assert(section.querySelector(tag), tag);
assert.equal(section.querySelector('ol').getAttribute('start'), '3');
assert.equal(section.querySelector('code').textContent, '&lt;code&gt;');
assert.equal(section.querySelector('pre code').textContent, '<script>no execution</script>');
assert.equal(section.querySelectorAll('[role="img"]').length, 2);
assert.equal(result.toc.length, 4);
assert.equal(new Set(result.toc.map(x => x.frag)).size, 4);
assert.equal(section.querySelector('a[data-frag]').getAttribute('data-frag'), 'md-second');
assert.equal(section.querySelector('a[target]').getAttribute('rel'), 'noopener noreferrer');
const hostile = render('<script>alert(1)</script>\n\n<img src="https://example.com/track" onerror="alert(1)">\n\n<svg onload="alert(1)"></svg>\n\n[JS](javascript:alert%281%29) [entity](jav&#x61;script:alert%281%29) [data](data:text/html,hi) [relative](file.md) ![Image description](https://example.com/track)\n\n&lt;img src=x onerror=alert(1)&gt;', doc, marked.lexer).section;
assert.equal(hostile.querySelectorAll('script,img,svg,iframe,style,object,input,a[href]').length, 0);
assert(hostile.textContent.includes('<script>alert(1)</script>'));
assert(hostile.textContent.includes('Image description'));
assert(hostile.textContent.includes('<img src=x onerror=alert(1)>'));
assert.throws(() => render('unused', doc, () => Array.from({length:100001}, () => ({type:'hr'}))), /too many/);
let nested = [{type:'text',text:'end'}];
for(let i=0; i<70; i++) nested = [{type:'blockquote',tokens:nested}];
assert.throws(() => render('unused', doc, () => nested), /deeply/);

async function integration(embedded){
  const html = source('read/index.html');
  const dom = new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''), {url:'https://hakanaltun.io/read/', runScripts:'outside-only'});
  const w = dom.window, d = w.document;
  w.TextDecoder = TextDecoder; w.requestAnimationFrame = fn => fn(); w.scrollTo = () => {};
  if(embedded) w.OLAE_DESK_EMBED = {register(){}};
  w.eval(source('js/vendor/marked-18.0.11.umd.js')); w.eval(source('js/reader-markdown.js'));
  const main = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]).find(x => x.includes('function openFile(file)'));
  let finished;
  const Reader = w.FileReader;
  w.FileReader = class extends Reader { constructor(){ super(); this.addEventListener('loadend', () => finished()); } };
  w.eval(main);
  async function open(name, content, type=''){
    const file = new w.File([content], name, {type,lastModified:1000});
    const input = d.querySelector('#fileInput');
    Object.defineProperty(input, 'files', {value:[file], configurable:true});
    const done = new Promise(resolve => { finished = resolve; });
    input.dispatchEvent(new w.Event('change'));
    await done;
  }
  for(const [name,type] of [['sample.MD',''],['sample.markdown','application/octet-stream'],['sample','text/markdown'],['sample.md','text/plain']]){
    await open(name, sample, type);
    assert(d.querySelector('#reading h1'), name + ': ' + d.querySelector('#emptyLine').textContent);
    assert.equal(d.querySelector('#reading h1').textContent, 'İstanbul & ışık');
    assert.equal(d.querySelector('#tocList').children.length,4);
  }
  const prior = d.querySelector('#reading').textContent;
  await open('empty.md', '   ');
  assert.equal(d.querySelector('#reading').textContent, prior, 'empty input preserves the current reading');
  await open('sample.txt', '# Literal heading\n\n**Literal stars**', 'text/plain');
  assert.equal(d.querySelector('#reading h1'), null);
  assert(d.querySelector('#reading').textContent.includes('**Literal stars**'));
  assert(d.querySelector('#tocRow').hidden);
  const ledger = JSON.parse(w.localStorage.getItem(embedded ? 'olae-desk-read-pos' : 'olae-read-pos'));
  assert(ledger.some(x=>x[0].startsWith('sample.md\0')), 'Markdown uses the existing bookmark ledger');
  dom.window.close();
}
(async()=>{ await integration(false); await integration(true); console.log('Markdown checks passed: formatting, heading links, safe DOM, file routing, preserved reading, TXT and Desk bookmarks.'); })().catch(e=>{console.error(e);process.exitCode=1;});
