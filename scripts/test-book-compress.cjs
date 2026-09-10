/* Run with Node 22+ from the repository root: node scripts/test-book-compress.cjs

   The scene is built out of the Web Animations API and a modal <dialog>,
   neither of which jsdom implements, so both are stubbed here. The stubs are
   the point of the test as much as the assertions: they record every keyframe
   list the script produces, which is where a bad offset would otherwise only
   show up as a thrown TypeError in a real browser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/book-compress.js'), 'utf8');

const BODY = `<style>
  body { background: #FDFCF8; }
  header { background: rgb(68, 74, 78); }
  .card { background: rgb(30, 40, 50); }
</style>
<header data-rect="0,0,1280,140">
  <a id="nav" href="/notes/" data-rect="260,100,54,24">Notes</a>
  <a href="/book/" data-rect="360,100,44,24">Book</a>
</header>
<main>
  <h1 data-rect="544,250,240,44">The Fragments</h1>
  <p data-rect="544,320,536,126">First, there was <span data-rect="600,320,90,24">Symmetry</span>.</p>
  <a id="retailer" href="/x" data-rect="544,740,76,24">Hardcover</a>
  <p id="offscreen" data-rect="544,3000,536,26">Far below the fold.</p>
  <canvas id="torn" width="0" height="0" data-rect="0,0,1280,900"></canvas>
  <div class="card" data-rect="544,800,300,60"><a id="carded" href="/y" data-rect="560,812,80,24">Inside</a></div>
</main>
<div class="book-compress-wrap">
  <button class="book-compress" id="book-compress" type="button" hidden>Compress everything</button>
</div>`;

function build({ reduced = false, animations = true } = {}) {
  const dom = new JSDOM(BODY, { runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  const recorded = [];
  w.matchMedia = () => ({ matches: reduced, addEventListener() {}, addListener() {} });
  w.Element.prototype.getBoundingClientRect = function () {
    const [left, top, width, height] = (this.getAttribute('data-rect') || '0,0,0,0').split(',').map(Number);
    return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top };
  };
  // jsdom has the interface but none of the modal behaviour.
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  if (animations) {
    w.Element.prototype.animate = function (frames, options) {
      let settle;
      const animation = {
        target: this, frames, options, playState: 'running',
        finished: new Promise(resolve => { settle = resolve; }),
        finish() { if (this.playState === 'running') { this.playState = 'finished'; settle(this); } },
        cancel() { if (this.playState === 'running') { this.playState = 'idle'; settle(this); } }
      };
      recorded.push(animation);
      return animation;
    };
  }
  const scrolled = [];
  w.scrollTo = (x, y) => scrolled.push([x, y]);
  w.eval(source);
  const d = w.document;
  return { w, d, recorded, scrolled,
    trigger: d.getElementById('book-compress'),
    scene: d.querySelector('.book-compress-scene'),
    // Nothing here awaits real time, so one drained microtask queue per phase
    // is enough to carry the script from one await to the next.
    settle: async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); },
    run: async () => {
      // compress() and expand() each await more than one phase, and the next
      // phase's animations only exist once the previous one has settled.
      for (let pass = 0; pass < 6; pass++) {
        for (let i = 0; i < 12; i++) await Promise.resolve();
        recorded.forEach(a => a.finish());
      }
      for (let i = 0; i < 12; i++) await Promise.resolve();
    } };
}

async function main() {
  // Without the Web Animations API there is no scene to fall back to, so the
  // button never appears rather than appearing and doing nothing.
  {
    const { d, trigger } = build({ animations: false });
    assert.equal(trigger.hidden, true);
    assert.equal(d.querySelector('.book-compress-scene'), null);
  }

  // The scene is built once, up front, and the point is not a live target until
  // something has actually collapsed into it.
  {
    const { d, trigger, scene } = build();
    assert.equal(trigger.hidden, false);
    assert.equal(scene.getAttribute('aria-label'), 'Everything, compressed to a point');
    assert.deepEqual([...scene.children].map(el => el.className),
      ['book-compress-pieces', 'book-compress-dark', 'book-compress-flash', 'book-compress-point']);
    assert.equal(d.querySelector('.book-compress-point').disabled, true);
    assert.equal(d.querySelector('.book-compress-pieces').getAttribute('aria-hidden'), 'true');
  }

  // Capture takes the outermost visible fragments only, skips what is off the
  // fold, and never copies the scene it is drawing into.
  async function captured() {
    const kit = build();
    kit.trigger.click();
    await kit.settle();
    return kit;
  }
  {
    const kit = await captured();
    const pieces = [...kit.d.querySelectorAll('.book-compress-piece')];
    const tags = pieces.map(piece => piece.firstElementChild.tagName);
    const text = pieces.map(piece => piece.firstElementChild.textContent.replace(/\s+/g, ' ').trim());
    assert.deepEqual(tags, ['HEADER', 'H1', 'P', 'A', 'CANVAS', 'A']);
    assert.equal(text[0], 'Notes Book', 'the band comes along whole, not as one piece per link');
    assert.equal(text.filter(t => t === 'Notes').length, 0, 'a link inside a captured band is not its own piece');
    assert.equal(text.filter(t => t === 'Symmetry').length, 0, 'a span inside a captured p is not its own piece');
    assert.equal(pieces.filter(p => p.firstElementChild.textContent.includes('Far below')).length, 0);
    assert.equal(kit.scene.querySelectorAll('.book-compress-point').length, 1, 'the scene did not capture itself');
    // The copy is placed at the rect it was measured at, not at its old offset.
    assert.equal(pieces[1].style.left, '544px');
    assert.equal(pieces[1].style.width, '240px');
  }

  // A fragment lifted off a coloured surface keeps the ground it was written
  // for; one already sitting on the page's own paper is given none.
  {
    const kit = await captured();
    const pieces = [...kit.d.querySelectorAll('.book-compress-piece')];
    assert.equal(pieces[5].firstElementChild.textContent, 'Inside');
    assert.equal(pieces[5].style.background, 'rgb(30, 40, 50)');
    assert.equal(pieces[3].firstElementChild.textContent, 'Hardcover');
    assert.equal(pieces[3].style.background, '');
  }

  // Every keyframe list the script hands to the browser has to be ordered and
  // inside [0, 1]; an offset outside that range is a TypeError, not a glitch.
  function checkOffsets(recorded, label) {
    recorded.forEach(animation => {
      let previous = -1;
      animation.frames.forEach(frame => {
        if (frame.offset === undefined) return;
        assert.ok(frame.offset >= 0 && frame.offset <= 1, `${label}: offset ${frame.offset} out of range`);
        assert.ok(frame.offset >= previous, `${label}: offset ${frame.offset} follows ${previous}`);
        previous = frame.offset;
      });
      assert.ok(animation.options.duration > 0, `${label}: duration must be positive`);
    });
  }

  // A full round trip locks the page, then puts back everything it borrowed.
  {
    const kit = await captured();
    const root = kit.d.documentElement;
    assert.equal(root.style.overflow, 'hidden');
    assert.equal(root.style.scrollbarGutter, 'stable');
    assert.equal(kit.scene.open, true);
    checkOffsets(kit.recorded, 'compress');

    await kit.run();
    const point = kit.d.querySelector('.book-compress-point');
    assert.equal(point.disabled, false, 'the point is pressable once it holds everything');
    assert.equal(kit.d.querySelectorAll('.book-compress-piece').length, 0, 'the copies are released');
    assert.ok(kit.recorded.some(a => a.target.className === 'book-compress-dark'), 'the dark closes over the pile');
    assert.ok(!kit.recorded.some(a => a.target.className === 'book-compress-flash'), 'nothing flashes on the way in');

    const before = kit.recorded.length;
    point.click();
    await kit.run();
    checkOffsets(kit.recorded.slice(before), 'expand');
    assert.ok(kit.recorded.slice(before).some(a => a.target.className === 'book-compress-flash'),
      'releasing the point is the flash');
    assert.equal(kit.scene.open, false);
    assert.equal(root.style.overflow, '');
    assert.equal(root.style.scrollbarGutter, '');
    assert.deepEqual(kit.scrolled.at(-1), [0, 0], 'the reader is put back where they were');
    assert.equal(kit.d.activeElement, kit.trigger);
    assert.equal(point.disabled, true, 'a closed scene leaves nothing to press');
  }

  // A tap runs the rest at once: a phone has no Escape key.
  {
    const kit = await captured();
    kit.scene.dispatchEvent(new kit.w.Event('pointerdown', { bubbles: true }));
    await kit.settle();
    assert.ok(kit.recorded.every(a => a.playState !== 'running'), 'the flight is finished, not cancelled');
    await kit.settle();
    assert.equal(kit.d.querySelector('.book-compress-point').disabled, false,
      'the skip carries through the collapse rather than stopping at it');
  }

  // Escape while collapsed expands rather than dropping the page back abruptly.
  {
    const kit = await captured();
    await kit.run();
    const before = kit.recorded.length;
    const escape = new kit.w.Event('cancel', { cancelable: true });
    kit.scene.dispatchEvent(escape);
    await kit.settle();
    assert.equal(escape.defaultPrevented, true);
    assert.ok(kit.recorded.length > before, 'the fragments are given their way back');
    await kit.run();
    assert.equal(kit.scene.open, false);
  }

  // Reduced motion crosses the same states without the flight or the flash.
  {
    const kit = build({ reduced: true });
    kit.trigger.click();
    await kit.run();
    assert.equal(kit.d.querySelector('.book-compress-point').disabled, false);
    assert.ok(!kit.recorded.some(a => a.target.className === 'book-compress-flash'));
    kit.recorded.forEach(a => assert.ok(a.options.duration <= 180, 'no long move survives the preference'));
    kit.d.querySelector('.book-compress-point').click();
    await kit.run();
    assert.equal(kit.scene.open, false);
    assert.equal(kit.d.documentElement.style.overflow, '');
  }

  console.log('book-compress: ok');
}

main().catch(error => { console.error(error); process.exit(1); });
