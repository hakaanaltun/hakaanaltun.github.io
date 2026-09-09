const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync(require('node:path').join(__dirname,'../js/word-puzzle.js'),'utf8');
const BODY='<button id="essay-rain" aria-pressed="true">stop the rain</button><button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body"><h2>Section</h2><p id="first">the <em>cat</em> saw the dog.</p><blockquote><p>I <a href="#first">came</a>.<br>Then I left.</p></blockquote><p>&lt;script&gt; stays text.</p><ul><li>One more sentence.</li></ul><p><img src="cover.jpg" alt="Cover">Caption stays.</p></article>';
const dom=new JSDOM(BODY,{runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.HTMLElement.prototype.scrollIntoView=function(){};
const article=d.querySelector('article'),originalHTML=article.innerHTML,original=d.getElementById('first'),link=article.querySelector('a');
let links=0;link.addEventListener('click',()=>links++);
w.eval(script);
const launch=d.getElementById('essay-puzzle');
const escape=node=>(node||d).dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));

// Opening boxes every prose paragraph but scatters none of them.
assert.equal(launch.hidden,false);launch.click();
const previews=[...d.querySelectorAll('.puzzle-preview')];
assert.equal(previews.length,4);
assert.equal(d.querySelectorAll('.puzzle-word-preview').length,16);
assert.equal(d.querySelectorAll('.word-puzzle').length,0);
assert.equal(original.isConnected,false);
assert.equal(original.querySelector('em').textContent,'cat');
assert.equal(article.querySelector('img').getAttribute('src'),'cover.jpg');
// Each paragraph keeps its own role and prose; the cue is the real control,
// so Enter and Space activate it natively and a list item stays a list item.
previews.forEach((node,i)=>{
  assert.equal(node.getAttribute('role'),null,'the paragraph is not relabelled a button');
  assert.equal(node.getAttribute('tabindex'),null);
  const cue=node.querySelector('.puzzle-scatter-cue');
  assert.equal(cue.tagName,'BUTTON');assert.equal(cue.type,'button');
  assert.equal(cue.textContent,'scatter','a short paragraph needs no warning');
  assert.match(cue.getAttribute('aria-label'),new RegExp('^Scatter the \\d+ words of paragraph '+(i+1)+' of 4$'));
});
assert.equal(d.querySelector('li .puzzle-scatter-cue').closest('li').getAttribute('role'),null);
// Leaving before scattering rebuilds the source exactly.
d.querySelectorAll('.puzzle-panel .puzzle-action')[0].click();
assert.equal(article.innerHTML,originalHTML);assert.equal(d.getElementById('first'),original);

// One paragraph at a time: only the chosen one becomes a board.
launch.click();
d.querySelectorAll('.puzzle-preview')[0].click();
assert.equal(d.querySelectorAll('.word-puzzle').length,1);
assert.equal(d.querySelectorAll('.puzzle-preview').length,3);
const board=d.querySelector('.word-puzzle');
assert.equal(board.id,'first');
// A whole essay never becomes a board at once.
assert.ok(d.querySelectorAll('.puzzle-word,.puzzle-slot').length<=2*5);

const slots=[...board.querySelectorAll('.puzzle-slot')],bank=board.querySelector('.puzzle-bank');
function available(word){return [...bank.querySelectorAll('.puzzle-word')].find(node=>!node.hidden && node.textContent===word);}
function put(word,index){const token=available(word);assert(token,'Missing available word '+word);token.click();slots[index].click();}
function conserve(){
  const remaining=[...bank.querySelectorAll('.puzzle-word')].filter(node=>!node.hidden).map(node=>node.textContent);
  const placed=slots.filter(node=>node.classList.contains('puzzle-filled')).map(node=>node.textContent);
  assert.deepEqual([...remaining,...placed].sort(),['the','cat','saw','the','dog.'].sort());
}
put('dog.',0);put('the',1);conserve();
// Placing on an occupied position returns the displaced word to the bank.
put('cat',0);assert(available('dog.'));conserve();
slots[0].click();assert(available('cat'));conserve();
// HTML drag data is scoped to this game and paragraph.
function transfer(){const data=new Map();return {types:[],setData(type,value){data.set(type,value);this.types.push(type);},getData(type){return data.get(type)||'';}};}
function dragEvent(node,type,data){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'dataTransfer',{value:data});node.dispatchEvent(e);return e;}
const drag=transfer();dragEvent(available('cat'),'dragstart',drag);
assert(dragEvent(slots[0],'dragover',drag).defaultPrevented);
dragEvent(slots[0],'drop',drag);assert.equal(slots[0].textContent,'cat');conserve();
// A second board opened alongside it refuses the first board's tokens.
d.querySelector('.puzzle-preview').click();
const second=[...d.querySelectorAll('.word-puzzle')][1];
assert.equal(d.querySelectorAll('.word-puzzle').length,2);
const beforeOther=second.querySelector('.puzzle-slots').textContent;
dragEvent(second.querySelector('.puzzle-slot'),'drop',drag);
assert.equal(second.querySelector('.puzzle-slots').textContent,beforeOther);
const move=transfer();dragEvent(slots[0],'dragstart',move);dragEvent(slots[1],'drop',move);
assert.equal(slots[0].textContent,'the');assert.equal(slots[1].textContent,'cat');conserve();
put('saw',2);put('the',3);put('dog.',4);conserve();
const compare=board.querySelector('.puzzle-action');assert.equal(compare.disabled,false);compare.click();
assert.equal(board.querySelector('.puzzle-status').textContent,'This matches the original wording.');
// Exchanging identical tokens still matches, without relying on token IDs.
const duplicate=transfer();dragEvent(slots[0],'dragstart',duplicate);dragEvent(slots[3],'drop',duplicate);
compare.click();assert.equal(board.querySelector('.puzzle-status').textContent,'This matches the original wording.');
const different=transfer();dragEvent(slots[1],'dragstart',different);dragEvent(slots[4],'drop',different);compare.click();
assert.match(board.querySelector('.puzzle-status').textContent,/different order/i);
assert.match(board.querySelector('.puzzle-comparison-note').textContent,/can also be grammatical/);
assert.equal(board.querySelectorAll('.puzzle-different').length,2);
assert.equal(article.querySelector('script'),null);
assert([...second.querySelectorAll('.puzzle-word')].some(node=>node.textContent==='came.'));
assert([...second.querySelectorAll('.puzzle-word')].some(node=>node.textContent==='Then'));

// "Put this paragraph back" returns one board, leaving the other alone.
const putBack=[...second.querySelectorAll('.puzzle-action')].find(node=>node.textContent==='Put this paragraph back');
assert(putBack,'Missing per-board exit');putBack.click();
assert.equal(d.querySelectorAll('.word-puzzle').length,1);
assert.equal(d.querySelectorAll('.puzzle-preview').length,3);
assert.equal(board.isConnected,true,'The other board keeps its arrangement');
assert.equal(slots[1].textContent,'dog.');

// Escape is a ladder: the focused board, then the last one open, then the mode.
d.querySelector('.puzzle-preview').click();
assert.equal(d.querySelectorAll('.word-puzzle').length,2);
escape(d.querySelectorAll('.word-puzzle')[1].querySelector('.puzzle-word'));
assert.equal(d.querySelectorAll('.word-puzzle').length,1,'Escape closes the board it is in');
assert.equal(board.isConnected,true,'and costs no other paragraph');
escape(launch);
assert.equal(d.querySelectorAll('.word-puzzle').length,0,'Escape outside a board closes the last one opened');
assert.equal(article.classList.contains('puzzle-active'),true,'without leaving puzzle mode');
escape();
assert.equal(launch.textContent,'puzzle mode');

// Restore the exact nodes, markup, links and existing rain state.
assert.equal(article.innerHTML,originalHTML);assert.equal(d.getElementById('first'),original);
link.click();assert.equal(links,1);assert.equal(d.getElementById('essay-rain').getAttribute('aria-pressed'),'true');
assert.equal(d.querySelectorAll('.puzzle-panel,.word-puzzle,.puzzle-preview').length,0);
// Activating the cue alone opens the paragraph, for readers on a keyboard.
launch.click();
d.querySelector('.puzzle-scatter-cue').click();
assert.equal(d.querySelectorAll('.word-puzzle').length,1);
escape();escape();
assert.equal(article.innerHTML,originalHTML);
for(let i=0;i<3;i++){launch.click();launch.click();assert.equal(article.innerHTML,originalHTML);}
dom.window.close();

// A long paragraph is still the reader's to choose; the cue names its size
// first, so nothing about the choice is a surprise.
function fresh(body){
  const page=new JSDOM(body,{runScripts:'outside-only',pretendToBeVisual:true});
  page.window.HTMLElement.prototype.scrollIntoView=function(){};
  page.window.eval(script);
  return page;
}
const long='<p>'+('word '.repeat(145))+'</p>';
const mixed=fresh('<button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body">'+long+'<p>a short one here.</p></article>');
const mixedDoc=mixed.window.document,mixedButton=mixedDoc.getElementById('essay-puzzle');
assert.equal(mixedButton.hidden,false);mixedButton.click();
assert.equal(mixedDoc.querySelectorAll('.puzzle-preview').length,2,'A long paragraph is still offered');
assert.equal(mixedDoc.querySelectorAll('.puzzle-scatter-cue')[0].textContent,'scatter \u00b7 145 words');
assert.equal(mixedDoc.querySelectorAll('.puzzle-scatter-cue')[1].textContent,'scatter');
mixedDoc.querySelectorAll('.puzzle-preview')[0].click();
assert.equal(mixedDoc.querySelectorAll('.puzzle-slot').length,145,'and it scatters in full when asked');
mixed.window.close();
// Only a runaway paragraph is withheld, and a page with nothing to offer
// never shows the button at all.
const runaway='<p>'+('word '.repeat(401))+'</p>';
const barren=fresh('<button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body">'+runaway+'<p><img src="a.jpg" alt="x"></p><pre><code>x=1</code></pre></article>');
const barrenButton=barren.window.document.getElementById('essay-puzzle');
assert.equal(barrenButton.hidden,true,'No offer means no button');
assert.equal(barrenButton.textContent,'puzzle mode','The label is never overwritten with an error');
barren.window.close();

console.log('Word puzzle checks passed: one paragraph at a time, per-board exit, Escape ladder, keyboard opening, tap/drag/swap/return, duplicate words, board isolation, comparison, eligibility and exact restoration.');
