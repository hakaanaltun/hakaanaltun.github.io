/* DOM-level checks for "guess the word".
 *
 * The one that matters most is the last: the essay has to come back exactly as
 * it was, including where two of the lifted words share a paragraph. Stitching
 * split text nodes by hand passed a single-word test and wrote the sentence in
 * twice on a paragraph with three, which is why the fixture has one. */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'guess-word.js'), 'utf8');

// Three words in the first paragraph, one in the second, one inside an <em>,
// and one that is not in the text at all.
const WORDS = ['hollow', 'sharp', 'patience', 'gleaming', 'quicksilver', 'absent'];
const BODY = `<!doctype html><html><body>
<article class="essay-body">
  <p>There was a hollow space in it, a sharp one, and the patience of men being paid to wait.</p>
  <p>Outside, the rain had stopped and the pavement was gleaming.</p>
  <p>It came down as <em>quicksilver</em> rain, and went.</p>
</article>
<div class="essay-guess-wrap">
  <button type="button" class="essay-guess" id="essay-guess" hidden>guess the word</button>
</div>
<script type="application/json" id="essay-guess-words">${JSON.stringify(WORDS)}</script>
</body></html>`;

function build({ body = BODY } = {}) {
  const dom = new JSDOM(body, { runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  // jsdom lays nothing out, so the scroll the script does on opening is a no-op
  // it still has to be able to call.
  w.Element.prototype.scrollIntoView = function () {};
  w.eval(source);
  const d = w.document;
  const type = (input, value) => {
    input.value = value;
    input.dispatchEvent(new w.Event('input', { bubbles: true }));
  };
  const blur = (input) => input.dispatchEvent(new w.FocusEvent('blur'));
  return {
    w, d,
    trigger: d.getElementById('essay-guess'),
    article: d.querySelector('.essay-body'),
    text: () => d.querySelector('.essay-body').textContent,
    inputs: () => [...d.querySelectorAll('.guess-input')],
    blanks: () => [...d.querySelectorAll('.guess-blank')],
    actions: () => [...d.querySelectorAll('.guess-action')],
    type, blur
  };
}

function main() {
  // Without a list there is nothing to play, and the button never appears
  // rather than appearing and doing nothing.
  {
    const kit = build({ body: BODY.replace(/\[.*?\]/, '[]') });
    assert.equal(kit.trigger.hidden, true);
  }

  // The button is offered, and nothing is touched until it is pressed.
  {
    const kit = build();
    assert.equal(kit.trigger.hidden, false);
    assert.equal(kit.blanks().length, 0);
  }

  // Opening lifts every word that is actually in the text — including one
  // inside an <em> — and skips the one that is not.
  const original = build().text();
  {
    const kit = build();
    kit.trigger.click();
    assert.equal(kit.blanks().length, 5, 'a word not in the essay is not a blank');
    assert.equal(kit.trigger.hidden, true, 'the offer stands down while the game is open');
    assert.equal(kit.actions().length, 2);
    // The box is as wide as the word it stands in for.
    assert.equal(kit.inputs()[0].style.width, '6ch');
    assert.ok(!kit.text().includes('hollow'), 'the word is out of the text while it is asked for');
  }

  // The essay's own word settles as it is typed: no Enter, no tick, and the
  // box is gone.
  {
    const kit = build();
    kit.trigger.click();
    kit.type(kit.inputs()[0], 'hollow');
    assert.equal(kit.blanks()[0].classList.contains('is-settled'), true);
    assert.equal(kit.d.querySelectorAll('.guess-word.is-found').length, 1);
    assert.ok(kit.text().includes('a hollow space'), 'the sentence closes over it');
  }

  // Case and a curly apostrophe are not the question being asked.
  {
    const kit = build();
    kit.trigger.click();
    kit.type(kit.inputs()[0], '  Hollow ');
    assert.equal(kit.blanks()[0].classList.contains('is-settled'), true);
  }

  // A word that is not the essay's is KEPT. Not cleared, not refused, not
  // marked wrong — marked as the reader's.
  {
    const kit = build();
    kit.trigger.click();
    const input = kit.inputs()[0];
    kit.type(input, 'dead');
    kit.blur(input);
    assert.equal(input.value, 'dead', 'the reader\'s word stays in the box');
    assert.equal(kit.blanks()[0].classList.contains('is-yours'), true);
    assert.equal(kit.blanks()[0].classList.contains('is-settled'), false);
    // Editing it again drops the mark rather than piling a second one on.
    kit.type(input, 'deadl');
    assert.equal(kit.blanks()[0].classList.contains('is-yours'), false);
  }

  // Asking for the words puts the essay's back so the sentence reads as
  // written, and stands the reader's beside only the ones that differ.
  {
    const kit = build();
    kit.trigger.click();
    kit.type(kit.inputs()[0], 'dead');      // differs
    kit.type(kit.inputs()[1], 'sharp');     // settles on its own
    const [reveal] = kit.actions();
    reveal.click();
    assert.equal(kit.inputs().length, 0, 'no boxes are left open');
    // The reader's word is part of the sentence a reader copies or hears, so
    // its brackets and its space are characters rather than CSS decoration.
    assert.ok(kit.text().includes('a hollow (dead) space'), 'the writer\'s word is back, the reader\'s beside it');
    const yours = [...kit.d.querySelectorAll('.guess-yours')].map(e => e.textContent);
    assert.deepEqual(yours, [' (dead)'], 'only a differing word is shown beside');
    assert.equal(reveal.disabled, true);
  }

  // The essay comes back exactly as it was — the case the clone restore exists
  // for, with three of the words in one paragraph.
  {
    const kit = build();
    kit.trigger.click();
    kit.type(kit.inputs()[0], 'dead');
    kit.type(kit.inputs()[1], 'sharp');
    kit.actions()[0].click();
    kit.actions()[1].click();
    assert.equal(kit.text(), original, 'not a character added or lost');
    assert.equal(kit.blanks().length, 0);
    assert.equal(kit.actions().length, 0);
    assert.equal(kit.trigger.hidden, false, 'the offer comes back');
  }

  // Escape is the same way out.
  {
    const kit = build();
    kit.trigger.click();
    assert.equal(kit.blanks().length, 5);
    kit.d.dispatchEvent(new kit.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(kit.text(), original);
    assert.equal(kit.blanks().length, 0);
  }

  // A second round starts clean rather than on top of the first.
  {
    const kit = build();
    kit.trigger.click();
    kit.actions()[1].click();
    kit.trigger.click();
    assert.equal(kit.blanks().length, 5, 'the same five, once each');
    kit.actions()[1].click();
    assert.equal(kit.text(), original);
  }

  console.log('guess-word: ok');
}

main();
