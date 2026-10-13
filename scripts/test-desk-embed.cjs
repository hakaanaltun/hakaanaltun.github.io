'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname, '../_includes/desk-embed.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function setup(kind, bar = null, own = false) {
  const properties = {}, attributes = {}, classes = new Set();
  const location = { origin:'https://example.test', search:'?desk=1' };
  const root = {classList:{add:v=>classes.add(v), toggle:(v,on)=>on?classes.add(v):classes.delete(v)}, style:{setProperty:(k,v)=>properties[k]=v}, setAttribute:(k,v)=>attributes[k]=v, hasAttribute:k=>own && k==='data-own-theme'};
  const window = {parent:{location, OLAE_DESK:{restore(){}}}};
  if(kind === 'standalone') window.parent = window;
  if(kind === 'unrelated') delete window.parent.OLAE_DESK;
  if(kind === 'cross-origin') Object.defineProperty(window.parent,'location',{get(){throw new Error('SecurityError');}});
  vm.runInNewContext(code, {window,location,document:{documentElement:root,addEventListener(){},querySelector:s=>s==='.chrome'?bar:null},URLSearchParams,requestAnimationFrame:fn=>fn()});
  return {api:window.OLAE_DESK_EMBED,properties,attributes,classes};
}
for(const kind of ['standalone','unrelated','cross-origin']) assert.equal(setup(kind).api, undefined);
const s = setup('desk');
assert.ok(s.classes.has('in-desk'));
let saves=0, pauses=0, resizes=0, unsaved=false;
// The instrument and its shelf register from separate closures. Neither may
// replace the other's hooks, especially the save hook when the pane is hidden.
s.api.register({save(){saves++;},resize(){resizes++;},unsaved(){return unsaved;}});
s.api.register({pause(){pauses++;}});
s.api.setActive(false);
assert.equal(saves,1); assert.equal(pauses,1);
s.api.setActive(false);
assert.equal(saves,1); assert.equal(pauses,1);
s.api.setActive(true);
assert.equal(resizes,1);
s.api.save(); assert.equal(saves,2);
unsaved=true; assert.equal(s.api.unsaved(),true);
s.api.setTheme('sky',{'--paper':'rgb(30,40,50)','--ink':'rgb(240,240,230)'});
assert.equal(s.attributes['data-theme'],'sky');
assert.equal(s.properties['--paper'],'rgb(30,40,50)');
// A top bar with nothing left to show on the desk folds away; one with a
// button of the instrument's own stays.
const button = (shown) => ({ getClientRects: () => shown ? [{}] : [] });
assert.ok(setup('desk', { querySelectorAll: () => [button(false), button(false)] }).classes.has('desk-bare'));
assert.ok(!setup('desk', { querySelectorAll: () => [button(false), button(true)] }).classes.has('desk-bare'));
// An instrument with a light of its own keeps it on the desk.
const own = setup('desk', null, true);
own.api.setTheme('light', {'--paper':'#fff'});
assert.equal(own.attributes['data-theme'], undefined);
assert.equal(own.properties['--paper'], undefined);
console.log('Desk embed checks passed: separate hooks, retained save guard, pane lifecycle, theme, an instrument\'s own light, a bare top bar folded and embedding boundaries.');
