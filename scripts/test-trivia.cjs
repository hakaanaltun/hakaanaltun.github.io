/* DOM-level checks for the trivia quiz.
 *
 * The page itself is the fixture: this reads the rendered
 * _site/trivia/britain/index.html, so the layout's ids and the script's
 * expectations are checked against each other rather than against a copy of
 * the markup that can drift. Run `bundle exec jekyll build` first.
 *
 * The check that matters most is the first. The bank's own answer positions
 * are not neutral — 29 of the first fifty right answers were written as the
 * second choice — so if the choices are not shuffled per game, "always press
 * 2" is a winning strategy and the quiz is not a quiz. */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'trivia.js'), 'utf8');
const pagePath = path.join(root, '_site', 'trivia', 'britain', 'index.html');

if (!fs.existsSync(pagePath)) {
  console.error('test-trivia: run `bundle exec jekyll build` first (missing _site/trivia/britain/index.html)');
  process.exit(1);
}
const page = fs.readFileSync(pagePath, 'utf8');

/* A fixed generator, so a distribution can be asserted without the test
   depending on luck. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function build({ seed = 1, questions = null, storage = null } = {}) {
  const dom = new JSDOM(page, {
    url: 'https://hakanaltun.io/trivia/britain/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const w = dom.window;
  const d = w.document;

  /* The stylesheet comes along, because some of this quiz's behaviour IS the
     stylesheet: the script hides a control by setting the hidden attribute,
     and a class that sets display quietly outranks it. */
  const style = d.createElement('style');
  style.textContent = fs.readFileSync(path.join(root, 'css', 'trivia.css'), 'utf8');
  d.head.appendChild(style);

  if (questions) {
    d.getElementById('trivia-data').textContent = JSON.stringify(questions);
  }
  if (storage) {
    w.localStorage.setItem(d.getElementById('trivia-app').dataset.storageKey, storage);
  }
  const scrolled = [];
  w.Element.prototype.scrollIntoView = function (options) {
    scrolled.push({ el: this, options: options });
  };

  w.Math.random = seeded(seed);
  w.eval(source);

  const id = (name) => d.getElementById(name);
  const visible = () => ['trivia-intro', 'trivia-question', 'trivia-round', 'trivia-result']
    .find((name) => !id(name).hidden);
  const choices = () => [...d.querySelectorAll('.trivia-choice')];
  const key = (value, init = {}) => {
    const event = new w.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...init });
    (init.on || d).dispatchEvent(event);
    return event;
  };

  return {
    w, d, id, visible, choices, key, scrolled,
    bank: JSON.parse(d.getElementById('trivia-data').textContent),
    stored: () => JSON.parse(w.localStorage.getItem(d.getElementById('trivia-app').dataset.storageKey)),
    text: (name) => id(name).textContent,
    start: () => id('trivia-start').click(),
    next: () => id('trivia-next').click(),
    keepGoing: () => id('trivia-continue').click()
  };
}

/* Answer the question on screen; `how` picks the slot to press. */
function answer(kit, how) {
  const slots = kit.choices();
  const q = kit.bank[kit.stored().order[kit.stored().position]];
  const arrangement = kit.stored().arrangement[kit.stored().position];
  const right = arrangement.indexOf(q.answer);
  const slot = how === 'right' ? right : (right + 1) % slots.length;
  slots[slot].click();
  return { right, slot, question: q };
}

/* Play a whole game through, collecting what each panel said on the way. */
function play(kit, how) {
  kit.start();
  const seen = [];
  const breaks = [];
  let guard = 0;
  while (kit.visible() !== 'trivia-result' && guard++ < 500) {
    if (kit.visible() === 'trivia-round') {
      breaks.push({
        kicker: kit.text('trivia-round-kicker'),
        title: kit.text('trivia-round-title'),
        at: kit.stored().position
      });
      kit.keepGoing();
      continue;
    }
    const before = kit.stored().position;
    seen.push({
      position: before,
      category: kit.text('trivia-question-category'),
      round: kit.text('trivia-round-label'),
      counter: kit.text('trivia-counter'),
      ...answer(kit, how)
    });
    kit.next();
  }
  return { seen, breaks };
}

function main() {
  // --- The choices are shuffled, and the shuffle is per game ---------------
  //
  // Across the whole bank, no slot may carry a runaway share of the right
  // answers. Written down, the second slot carried 29 of 50.
  {
    const spread = [0, 0, 0, 0];
    for (let seed = 1; seed <= 12; seed += 1) {
      const kit = build({ seed });
      kit.start();
      const state = kit.stored();
      state.order.forEach((qIndex, position) => {
        spread[state.arrangement[position].indexOf(kit.bank[qIndex].answer)] += 1;
      });
    }
    const total = spread.reduce((a, b) => a + b, 0);
    assert.equal(total, 600, 'twelve games over a bank of fifty');
    spread.forEach((count, slot) => {
      assert.ok(count / total > 0.18 && count / total < 0.32,
        `slot ${slot} held ${count}/${total} of the right answers`);
    });

    // And two games do not arrange the same question the same way.
    const a = build({ seed: 3 });
    const b = build({ seed: 99 });
    a.start(); b.start();
    assert.notDeepEqual(a.stored().arrangement, b.stored().arrangement);
  }

  // --- The slot pressed is the answer read ---------------------------------
  //
  // With the choices shuffled, "slot 2" and "the second answer in the JSON"
  // are different things; pressing the right slot has to score.
  {
    const kit = build({ seed: 5 });
    const { seen } = play(kit, 'right');
    assert.equal(seen.length, 50);
    assert.equal(kit.stored().score, 50);
    assert.equal(kit.text('trivia-result-title'), '50 / 50');
    assert.equal(kit.id('trivia-retry-missed').hidden, true);
    assert.equal(kit.id('trivia-review').hidden, true);

    // The label under each choice is that choice's own text.
    const k2 = build({ seed: 6 });
    k2.start();
    const state = k2.stored();
    const q = k2.bank[state.order[0]];
    k2.choices().forEach((button, slot) => {
      assert.equal(button.querySelector('.trivia-choice-text').textContent,
        q.choices[state.arrangement[0][slot]]);
      assert.equal(button.querySelector('.trivia-choice-number').textContent, String(slot + 1));
    });
  }

  // --- A round is a subject, and it is as long as the subject is -----------
  {
    const kit = build({ seed: 7 });
    const { seen, breaks } = play(kit, 'right');

    const expected = [
      ['Places & landmarks', 11],
      ['History', 11],
      ['Legend & custom', 6],
      ['Books, stage & screen', 12],
      ['Food & sport', 10]
    ];

    // Every question carries the category its round announces.
    seen.forEach((item) => {
      assert.equal(item.category, item.question.category);
    });

    const runs = [];
    seen.forEach((item) => {
      const last = runs[runs.length - 1];
      if (!last || last[0] !== item.category) runs.push([item.category, 1]);
      else last[1] += 1;
    });
    assert.deepEqual(runs, expected, 'rounds follow the bank, in order, whole');

    assert.equal(seen[0].round, 'Round 1 of 5');
    assert.equal(seen[0].counter, 'Question 1 of 50');
    assert.equal(seen[49].round, 'Round 5 of 5');

    // Four breaks, at the seams, each scored out of its own round's length —
    // not out of a fixed ten.
    assert.equal(breaks.length, 4);
    assert.deepEqual(breaks.map((b) => b.at), [11, 22, 28, 40]);
    assert.deepEqual(breaks.map((b) => b.title), ['11 / 11', '11 / 11', '6 / 6', '12 / 12']);
    assert.equal(breaks[2].kicker, 'Round 3 · Legend & custom');

    // And the result panel says the same thing a fifth time.
    const rows = [...kit.id('trivia-breakdown').querySelectorAll('li')]
      .map((li) => [
        li.querySelector('.trivia-breakdown-name').textContent,
        li.querySelector('.trivia-breakdown-score').textContent
      ]);
    assert.deepEqual(rows, expected.map(([name, size]) => [name, `${size} / ${size}`]));
  }

  // --- A bank with no categories still plays, in rounds of ten -------------
  {
    const plain = JSON.parse(fs.readFileSync(path.join(root, '_data', 'quizzes', 'britain.json'), 'utf8'))
      .slice(0, 25)
      .map(({ category, ...rest }) => rest);
    const kit = build({ seed: 11, questions: plain });
    const { seen, breaks } = play(kit, 'right');
    assert.equal(seen.length, 25);
    assert.equal(kit.id('trivia-question-category').hidden, true);
    assert.deepEqual(breaks.map((b) => b.at), [10, 20]);
    assert.deepEqual(breaks.map((b) => b.title), ['10 / 10', '10 / 10']);
    assert.equal(breaks[0].kicker, 'Round 1 complete');
    // The last round is the remainder, and is scored as five.
    assert.equal(kit.id('trivia-breakdown').hidden, true);
    assert.equal(kit.text('trivia-result-title'), '25 / 25');
  }

  // --- Answering never throws focus out of the quiz ------------------------
  //
  // The choices carry aria-disabled rather than disabled: a disabled button
  // leaves the tab order the instant it is pressed, which sent a keyboard
  // reader back to the top of the document after every single answer.
  {
    const kit = build({ seed: 13 });
    kit.start();
    // Deliberately a wrong slot, so both marks are written.
    const right = kit.stored().arrangement[0].indexOf(kit.bank[kit.stored().order[0]].answer);
    const pressed = kit.choices()[(right + 1) % 4];
    pressed.focus();
    pressed.click();
    assert.equal(kit.d.activeElement, pressed, 'focus stays on the answered choice');
    kit.choices().forEach((button) => {
      assert.equal(button.getAttribute('aria-disabled'), 'true');
      assert.equal(button.disabled, false);
    });
    assert.deepEqual(
      [...kit.d.querySelectorAll('.trivia-choice-mark')].map((mark) => mark.textContent).sort(),
      ['Answer', 'Your answer']);
    // Pressing another one afterwards changes nothing.
    const score = kit.stored().score;
    kit.choices()[(right + 2) % 4].click();
    assert.equal(kit.stored().score, score);
    assert.equal(kit.d.querySelectorAll('.trivia-choice-mark').length, 2);

    // And the next question takes focus, so it is announced rather than
    // silently swapped in.
    kit.next();
    assert.equal(kit.d.activeElement, kit.id('trivia-question-text'));
  }

  // --- The shortcuts give way to anything being typed ----------------------
  //
  // Every page carries a search field in the drawer and another in the footer
  // strip. Without the guard, typing "1984" into one of them answered the
  // open question and ate the digit.
  {
    const kit = build({ seed: 17 });
    kit.start();
    const field = kit.d.querySelector('input[type="search"]');
    assert.ok(field, 'the page really does carry a search field');

    const typed = kit.key('1', { on: field });
    assert.equal(typed.defaultPrevented, false, 'the digit reaches the field');
    assert.equal(kit.stored().pending, null, 'and does not answer the question');

    const chorded = kit.key('1', { ctrlKey: true });
    assert.equal(chorded.defaultPrevented, false);
    assert.equal(kit.stored().pending, null);

    // On its own, though, it answers.
    const bare = kit.key('1');
    assert.equal(bare.defaultPrevented, true);
    assert.equal(kit.stored().pending.selected, kit.stored().arrangement[0][0]);

    // Enter moves on; Enter typed into the field does not.
    kit.key('Enter', { on: field });
    assert.equal(kit.stored().position, 0);
    kit.key('Enter');
    assert.equal(kit.stored().position, 1);

    // Answering with the mouse leaves focus on the choice, which is still a
    // button and still focusable. Enter has to move on from there too — the
    // browser has nothing to activate, since an answered choice is spent.
    const chosen = kit.choices()[0];
    chosen.focus();
    chosen.click();
    assert.equal(kit.d.activeElement, chosen);
    const moved = kit.key('Enter', { on: chosen });
    assert.equal(moved.defaultPrevented, true, 'the button’s own Enter is suppressed');
    assert.equal(kit.stored().position, 2);

    // An unanswered choice keeps Enter for itself, so the browser can press it.
    const fresh = kit.choices()[0];
    fresh.focus();
    assert.equal(kit.key('Enter', { on: fresh }).defaultPrevented, false);
    assert.equal(kit.stored().pending, null);

    // And a click arriving late on a spent choice is ignored rather than
    // answering whatever question has since been drawn.
    const spent = kit.choices()[1];
    spent.click();
    const after = kit.stored();
    spent.click();
    assert.deepEqual(kit.stored().pending, after.pending);
    assert.equal(kit.d.querySelectorAll('.trivia-choice-mark').length <= 2, true);
  }

  // --- A second look at the ones you missed --------------------------------
  {
    const kit = build({ seed: 19 });
    play(kit, 'wrong');
    assert.equal(kit.stored().score, 0);
    assert.equal(kit.text('trivia-result-title'), '0 / 50');
    assert.equal(kit.id('trivia-retry-missed').hidden, false);
    assert.equal(kit.text('trivia-retry-missed'), 'Try the 50 you missed');
    assert.equal(kit.id('trivia-review').querySelectorAll('li').length, 50);

    kit.id('trivia-retry-missed').click();
    const retry = kit.stored();
    assert.equal(retry.mode, 'missed');
    assert.equal(retry.order.length, 50);
    assert.equal(retry.score, 0);
    assert.equal(kit.visible(), 'trivia-question');

    // A shorter second look keeps the rounds it still has, and drops the rest.
    const partial = build({ seed: 23 });
    partial.start();
    let missed = 0;
    while (partial.visible() !== 'trivia-result') {
      if (partial.visible() === 'trivia-round') { partial.keepGoing(); continue; }
      const position = partial.stored().position;
      answer(partial, position % 7 === 0 ? 'wrong' : 'right');
      if (position % 7 === 0) missed += 1;
      partial.next();
    }
    assert.equal(partial.stored().score, 50 - missed);
    partial.id('trivia-retry-missed').click();
    const second = partial.stored();
    assert.equal(second.order.length, missed);
    // Still grouped by subject, still in the bank's order.
    const ranks = second.order.map((i) => ['Places & landmarks', 'History', 'Legend & custom',
      'Books, stage & screen', 'Food & sport'].indexOf(partial.bank[i].category));
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
    assert.equal(partial.text('trivia-counter'), `Question 1 of ${missed}`);
  }

  // --- Progress is kept, and a stale shape is thrown away ------------------
  {
    const kit = build({ seed: 29 });
    kit.start();
    answer(kit, 'right');
    kit.next();
    answer(kit, 'right');
    kit.next();
    const saved = kit.w.localStorage.getItem(kit.d.getElementById('trivia-app').dataset.storageKey);

    const resumed = build({ seed: 31, storage: saved });
    assert.equal(resumed.id('trivia-resume-copy').hidden, false);
    assert.equal(resumed.text('trivia-resume-copy'), 'Continue at question 3 of 50.');
    assert.equal(resumed.text('trivia-start'), 'Continue');
    resumed.start();
    assert.equal(resumed.stored().position, 2);
    assert.equal(resumed.stored().score, 2);
    // The arrangement came back with it, rather than being rolled again.
    assert.deepEqual(resumed.stored().arrangement, JSON.parse(saved).arrangement);

    // Anything that no longer matches the bank is dropped rather than played.
    ['{"version":1,"order":[0]}', '{"version":2,"mode":"full","order":[0],"arrangement":[[0,1,2,3]]}', 'not json']
      .forEach((junk) => {
        const fresh = build({ seed: 37, storage: junk });
        assert.equal(fresh.id('trivia-resume-copy').hidden, true);
        fresh.start();
        assert.equal(fresh.stored().order.length, 50);
        assert.equal(fresh.stored().position, 0);
      });
  }

  // --- What the script hides has to actually disappear ---------------------
  //
  // `display` on a class beats the browser's own [hidden] rule, so Next stood
  // at full size under every unanswered question and could be pressed for
  // nothing, and a first-time reader was offered "Start over".
  {
    const kit = build({ seed: 41 });
    const gone = (name) => kit.w.getComputedStyle(kit.id(name)).display === 'none';

    assert.equal(gone('trivia-reset-intro'), true, 'Start over, on a first visit');
    assert.equal(gone('trivia-question'), true, 'the panels the intro replaces');
    assert.equal(gone('trivia-result'), true);

    kit.start();
    assert.equal(gone('trivia-intro'), true);
    assert.equal(gone('trivia-next'), true, 'Next, before an answer');
    assert.equal(gone('trivia-retry-missed'), true, 'the second look, before there is a result');

    // And they come back when they are meant to.
    answer(kit, 'wrong');
    assert.equal(gone('trivia-next'), false);

    const finished = build({ seed: 43 });
    play(finished, 'wrong');
    const alsoGone = (name) => finished.w.getComputedStyle(finished.id(name)).display === 'none';
    assert.equal(alsoGone('trivia-result'), false);
    assert.equal(alsoGone('trivia-retry-missed'), false);
    assert.equal(alsoGone('trivia-question'), true);
  }

  // --- The note is brought into view, and only when it is new --------------
  //
  // On a phone the choices fill the screen and the note opens underneath it,
  // off the bottom, with Next below that. The note is the part worth reading.
  {
    const kit = build({ seed: 47 });
    kit.start();
    kit.scrolled.length = 0;

    answer(kit, 'wrong');
    const moves = kit.scrolled.filter((s) => s.el.classList.contains('trivia-actions--question'));
    assert.equal(moves.length, 1, 'answering brings the note and Next up');
    // "nearest" so a screen that already shows them does not move at all.
    assert.equal(moves[0].options.block, 'nearest');

    // Coming back to a question already answered must not move the page by
    // itself — that is the reader's reload, not their answer.
    const saved = kit.w.localStorage.getItem(kit.d.getElementById('trivia-app').dataset.storageKey);
    const resumed = build({ seed: 47, storage: saved });
    resumed.start();
    assert.equal(resumed.stored().pending !== null, true, 'the answer came back with it');
    assert.equal(
      resumed.scrolled.filter((s) => s.el.classList.contains('trivia-actions--question')).length,
      0);
  }

  console.log('test-trivia: ok');
}

main();
