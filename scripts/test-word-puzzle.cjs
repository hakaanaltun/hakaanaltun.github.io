const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync(require('node:path').join(__dirname,'../js/word-puzzle.js'),'utf8');
const dom=new JSDOM('<button id="essay-rain" aria-pressed="true">stop the rain</button><button id="essay-puzzle" hidden>puzzle mode</button><article class="essay-body"><h2>Section</h2><p id="first">the <em>cat</em> saw the dog.</p><blockquote><p>I <a href="#first">came</a>.<br>Then I left.</p></blockquote><p>&lt;script&gt; stays text.</p><ul><li>One more sentence.</li></ul><p><img src="cover.jpg" alt="Cover">Caption stays.</p></article>',{runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.HTMLElement.prototype.scrollIntoView=function(){};
const article=d.querySelector('article'),originalHTML=article.innerHTML,original=d.getElementById('first'),link=article.querySelector('a');
let links=0;link.addEventListener('click',()=>links++);
w.eval(script);
const launch=d.getElementById('essay-puzzle');
assert.equal(launch.hidden,false);launch.click();
assert.equal(d.querySelectorAll('.puzzle-preview').length,4);
assert.equal(d.querySelectorAll('.puzzle-word-preview').length,16);
assert.equal(d.querySelectorAll('.word-puzzle').length,0);
assert.equal(original.isConnected,false);
assert.equal(original.querySelector('em').textContent,'cat');
assert.equal(article.querySelector('img').getAttribute('src'),'cover.jpg');
// The preview can be exited before scattering, without rebuilding the source.
d.querySelectorAll('.puzzle-panel .puzzle-action')[1].click();
assert.equal(article.innerHTML,originalHTML);assert.equal(d.getElementById('first'),original);
launch.click();d.querySelector('.puzzle-panel .puzzle-action').click();
let boards=[...d.querySelectorAll('.word-puzzle')];assert.equal(boards.length,4);
assert.equal(boards[3].tagName,'LI');
const board=boards[0],slots=[...board.querySelectorAll('.puzzle-slot')],bank=board.querySelector('.puzzle-bank');
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
const beforeOther=boards[1].querySelector('.puzzle-slots').textContent;
dragEvent(boards[1].querySelector('.puzzle-slot'),'drop',drag);
assert.equal(boards[1].querySelector('.puzzle-slots').textContent,beforeOther);
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
const firstData=boards[1].querySelectorAll('.puzzle-word');
assert([...firstData].some(node=>node.textContent==='came.'));
assert([...firstData].some(node=>node.textContent==='Then'));
// Restore the exact nodes, markup, links and existing rain state.
d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
assert.equal(article.innerHTML,originalHTML);assert.equal(d.getElementById('first'),original);
link.click();assert.equal(links,1);assert.equal(d.getElementById('essay-rain').getAttribute('aria-pressed'),'true');
assert.equal(d.querySelectorAll('.puzzle-panel,.word-puzzle').length,0);
for(let i=0;i<3;i++){launch.click();launch.click();launch.click();assert.equal(article.innerHTML,originalHTML);}
dom.window.close();
console.log('Word puzzle checks passed: two stages, tap/drag/swap/return, duplicate words, paragraph boundaries, comparison and exact restoration.');
