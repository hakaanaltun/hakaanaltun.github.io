const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync(require('node:path').join(__dirname,'../js/sentence-puzzle.js'),'utf8');
const BODY='<button id="essay-rain" aria-pressed="true">stop the rain</button><button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body"><h2>Section</h2><p id="first">The <em>cat</em> saw the dog. It ran. The dog stayed.</p><blockquote><p>I <a href="#first">came</a>. Then I left.</p></blockquote><p>&lt;script&gt; stays text. It really does.</p><ul><li>One sentence. And a second one.</li></ul><p>A lone sentence with no sibling.</p><p><img src="cover.jpg" alt="Cover">Caption stays. A second one here.</p></article>';
const dom=new JSDOM(BODY,{runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.HTMLElement.prototype.scrollIntoView=function(){};
const article=d.querySelector('article'),originalHTML=article.innerHTML,original=d.getElementById('first'),link=article.querySelector('a');
let links=0;link.addEventListener('click',()=>links++);
w.eval(script);
const launch=d.getElementById('essay-puzzle');
const escape=node=>(node||d).dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));

// Opening boxes the sentences of every multi-sentence paragraph, and scatters
// none of them. A one-sentence paragraph has nothing to reorder, so it is not
// offered; nor is one carrying an image.
assert.equal(launch.hidden,false);launch.click();
const previews=[...d.querySelectorAll('.puzzle-preview')];
assert.equal(previews.length,4);
assert.equal(d.querySelectorAll('.sentence-puzzle').length,0);
assert.equal(original.isConnected,false);
assert.equal(original.querySelector('em').textContent,'cat');
assert.equal(article.querySelector('img').getAttribute('src'),'cover.jpg');
assert.ok([...article.querySelectorAll('p')].some(p=>p.textContent.includes('A lone sentence')),
  'the single-sentence paragraph is left as prose');
// Sentences, not words: the first paragraph is three boxes, not eleven.
assert.equal(previews[0].querySelectorAll('.puzzle-sentence').length,3);
assert.deepEqual([...previews[0].querySelectorAll('.puzzle-sentence')].map(s=>s.textContent),
  ['The cat saw the dog.','It ran.','The dog stayed.']);
previews.forEach((node,i)=>{
  assert.equal(node.getAttribute('role'),null,'the paragraph is not relabelled a button');
  const cue=node.querySelector('.puzzle-scatter-cue');
  assert.equal(cue.tagName,'BUTTON');assert.equal(cue.type,'button');
  assert.equal(cue.textContent,'scatter','a short paragraph needs no warning');
  assert.match(cue.getAttribute('aria-label'),new RegExp('^Scatter the \\d+ sentences of paragraph '+(i+1)+' of 4$'));
});
// Leaving before scattering rebuilds the source exactly.
d.querySelectorAll('.puzzle-panel .puzzle-action')[0].click();
assert.equal(article.innerHTML,originalHTML);assert.equal(d.getElementById('first'),original);

// One paragraph at a time: only the chosen one becomes a board.
launch.click();
d.querySelectorAll('.puzzle-preview')[0].click();
assert.equal(d.querySelectorAll('.sentence-puzzle').length,1);
assert.equal(d.querySelectorAll('.puzzle-preview').length,3);
const board=d.querySelector('.sentence-puzzle');
assert.equal(board.id,'first');
assert.equal(board.querySelectorAll('.puzzle-slot').length,3);
assert.equal(board.querySelectorAll('.puzzle-piece').length,3);
// The bank never opens on the original order; there would be nothing to do.
assert.notDeepEqual([...board.querySelectorAll('.puzzle-piece')].map(p=>p.textContent),
  ['The cat saw the dog.','It ran.','The dog stayed.']);

const slots=[...board.querySelectorAll('.puzzle-slot')],bank=board.querySelector('.puzzle-bank');
const bodyOf=slot=>slot.querySelector('.puzzle-slot-text').textContent;
assert.deepEqual(slots.map(s=>s.querySelector('.puzzle-slot-number').textContent),['1','2','3']);
function available(text){return [...bank.querySelectorAll('.puzzle-piece')].find(node=>!node.hidden && node.textContent===text);}
function put(text,index){const piece=available(text);assert(piece,'Missing available sentence '+text);piece.click();slots[index].click();}
function conserve(){
  const remaining=[...bank.querySelectorAll('.puzzle-piece')].filter(n=>!n.hidden).map(n=>n.textContent);
  const placed=slots.filter(n=>n.classList.contains('puzzle-filled')).map(bodyOf);
  assert.deepEqual([...remaining,...placed].sort(),['The cat saw the dog.','It ran.','The dog stayed.'].sort());
}
put('The dog stayed.',0);put('It ran.',1);conserve();
// Placing on an occupied position returns the displaced sentence to the bank.
put('The cat saw the dog.',0);assert(available('The dog stayed.'));conserve();
slots[0].click();assert(available('The cat saw the dog.'));conserve();
// HTML drag data is scoped to this game and paragraph.
function transfer(){const data=new Map();return {types:[],setData(t,v){data.set(t,v);this.types.push(t);},getData(t){return data.get(t)||'';}};}
function dragEvent(node,type,data){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'dataTransfer',{value:data});node.dispatchEvent(e);return e;}
const drag=transfer();dragEvent(available('The cat saw the dog.'),'dragstart',drag);
assert(dragEvent(slots[0],'dragover',drag).defaultPrevented);
dragEvent(slots[0],'drop',drag);assert.equal(bodyOf(slots[0]),'The cat saw the dog.');conserve();
// A second board opened alongside it refuses the first board's sentences.
d.querySelector('.puzzle-preview').click();
const second=[...d.querySelectorAll('.sentence-puzzle')][1];
assert.equal(d.querySelectorAll('.sentence-puzzle').length,2);
const beforeOther=second.querySelector('.puzzle-slots').textContent;
dragEvent(second.querySelector('.puzzle-slot'),'drop',drag);
assert.equal(second.querySelector('.puzzle-slots').textContent,beforeOther);
const move=transfer();dragEvent(slots[0],'dragstart',move);dragEvent(slots[1],'drop',move);
assert.equal(bodyOf(slots[0]),'It ran.');assert.equal(bodyOf(slots[1]),'The cat saw the dog.');conserve();
// Filling the paragraph unlocks the comparison.
put('The dog stayed.',2);conserve();
const compare=board.querySelector('.puzzle-action');assert.equal(compare.disabled,false);
assert.match(board.querySelector('.puzzle-status').textContent,/3 of 3 sentences placed/);
compare.click();
assert.match(board.querySelector('.puzzle-status').textContent,/different order/i);
assert.match(board.querySelector('.puzzle-comparison-note').textContent,/Which sentence opens the paragraph/);
// The first two are swapped; the third is where the writer left it.
assert.equal(board.querySelectorAll('.puzzle-different').length,2);
// Put the two back and the comparison says the paragraph is as written.
const reset=transfer();dragEvent(slots[0],'dragstart',reset);dragEvent(slots[1],'drop',reset);
compare.click();
assert.equal(board.querySelector('.puzzle-status').textContent,'This matches the original order.');
assert.equal(board.querySelectorAll('.puzzle-different').length,0);
assert.equal(board.querySelector('.puzzle-version').textContent,'The cat saw the dog. It ran. The dog stayed.');
assert.equal(article.querySelector('script'),null);
// A sentence broken across a <br> or carrying a link still arrives whole.
assert.deepEqual([...second.querySelectorAll('.puzzle-piece')].map(n=>n.textContent).sort(),
  ['I came.','Then I left.']);

// "Put this paragraph back" returns one board, leaving the other alone.
const putBack=[...second.querySelectorAll('.puzzle-action')].find(n=>n.textContent==='Put this paragraph back');
assert(putBack,'Missing per-board exit');putBack.click();
assert.equal(d.querySelectorAll('.sentence-puzzle').length,1);
assert.equal(d.querySelectorAll('.puzzle-preview').length,3);
assert.equal(board.isConnected,true,'The other board keeps its arrangement');
assert.equal(bodyOf(slots[0]),'The cat saw the dog.');

// Escape is a ladder: the focused board, then the last one open, then the mode.
d.querySelector('.puzzle-preview').click();
assert.equal(d.querySelectorAll('.sentence-puzzle').length,2);
escape(d.querySelectorAll('.sentence-puzzle')[1].querySelector('.puzzle-piece'));
assert.equal(d.querySelectorAll('.sentence-puzzle').length,1,'Escape closes the board it is in');
assert.equal(board.isConnected,true,'and costs no other paragraph');
escape(launch);
assert.equal(d.querySelectorAll('.sentence-puzzle').length,0,'Escape outside a board closes the last one opened');
assert.equal(article.classList.contains('puzzle-active'),true,'without leaving puzzle mode');
escape();
assert.equal(launch.textContent,'puzzle mode');

// Restore the exact nodes, markup, links and existing rain state.
assert.equal(article.innerHTML,originalHTML);assert.equal(d.getElementById('first'),original);
link.click();assert.equal(links,1);assert.equal(d.getElementById('essay-rain').getAttribute('aria-pressed'),'true');
assert.equal(d.querySelectorAll('.puzzle-panel,.sentence-puzzle,.puzzle-preview').length,0);
// Activating the cue alone opens the paragraph, for readers on a keyboard.
launch.click();
d.querySelector('.puzzle-scatter-cue').click();
assert.equal(d.querySelectorAll('.sentence-puzzle').length,1);
escape();escape();
assert.equal(article.innerHTML,originalHTML);
for(let i=0;i<3;i++){launch.click();launch.click();assert.equal(article.innerHTML,originalHTML);}
dom.window.close();

function fresh(body){
  const page=new JSDOM(body,{runScripts:'outside-only',pretendToBeVisual:true});
  page.window.HTMLElement.prototype.scrollIntoView=function(){};
  page.window.eval(script);
  return page;
}
// Abbreviations and decimals are not sentence endings.
{
  const page=fresh('<button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body"><p>Dr. Aydın measured 3.14 metres. She wrote it down, e.g. in the margin. Then she left.</p></article>');
  const doc=page.window.document;
  doc.getElementById('essay-puzzle').click();
  assert.deepEqual([...doc.querySelectorAll('.puzzle-sentence')].map(s=>s.textContent),
    ['Dr. Aydın measured 3.14 metres.','She wrote it down, e.g. in the margin.','Then she left.']);
  page.window.close();
}
// Where Intl.Segmenter is missing, the regular expression carries the same
// rule — including the joining back of abbreviations.
{
  const page=new JSDOM('<button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body"><p>Dr. Aydın measured 3.14 metres. She wrote it down, e.g. in the margin. Then she left.</p></article>',{runScripts:'outside-only',pretendToBeVisual:true});
  page.window.HTMLElement.prototype.scrollIntoView=function(){};
  page.window.Intl=Object.create(null);            // no Segmenter here
  page.window.eval(script);
  const doc=page.window.document;
  doc.getElementById('essay-puzzle').click();
  assert.deepEqual([...doc.querySelectorAll('.puzzle-sentence')].map(s=>s.textContent),
    ['Dr. Aydın measured 3.14 metres.','She wrote it down, e.g. in the margin.','Then she left.'],
    'the fallback splits the same way');
  page.window.close();
}
// A long paragraph is still the reader's to choose; the cue names its size.
{
  const long='<p>'+('A sentence here. '.repeat(9))+'</p>';
  const page=fresh('<button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body">'+long+'<p>Short one. And another.</p></article>');
  const doc=page.window.document,btn=doc.getElementById('essay-puzzle');
  assert.equal(btn.hidden,false);btn.click();
  assert.equal(doc.querySelectorAll('.puzzle-preview').length,2,'A long paragraph is still offered');
  assert.equal(doc.querySelectorAll('.puzzle-scatter-cue')[0].textContent,'scatter · 9 sentences');
  assert.equal(doc.querySelectorAll('.puzzle-scatter-cue')[1].textContent,'scatter');
  doc.querySelectorAll('.puzzle-preview')[0].click();
  assert.equal(doc.querySelectorAll('.puzzle-slot').length,9,'and it scatters in full when asked');
  page.window.close();
}
// An essay with nothing to reorder never shows the button at all.
{
  const page=fresh('<button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body"><p>One sentence only.</p><p><img src="a.jpg" alt="x"></p><pre><code>x=1</code></pre></article>');
  const btn=page.window.document.getElementById('essay-puzzle');
  assert.equal(btn.hidden,true,'No offer means no button');
  assert.equal(btn.textContent,'puzzle mode','The label is never overwritten with an error');
  page.window.close();
}

console.log('Sentence puzzle checks passed: sentence splitting with abbreviations in both paths, one paragraph at a time, per-board exit, Escape ladder, keyboard opening, tap/drag/swap/return, board isolation, comparison, eligibility and exact restoration.');
