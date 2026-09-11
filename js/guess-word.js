/* Guess the word — a few of the essay's own words are lifted out and the reader
   puts them back, or doesn't.

   There is no wrong here, and that is the whole design rather than a kindness
   bolted onto it. A word that matches settles into the sentence and the box is
   gone. A word that does not match STAYS, in the reader's own hand: it is not
   refused, not marked, not cleared. Asking for the words puts the writer's back
   in place and stands the reader's beside whichever ones differ, which is the
   only moment the two are meant to be compared — not as answer and error, but
   as two people reaching for the same slot.

   Which words are lifted is not decided here. _data/guesses.yml holds the list,
   approved by hand; this file only finds them and hands them back.

   Every original text node is kept and returned on exit, so nothing about the
   essay survives the game. Nothing is sent or saved. */
(function () {
  'use strict';
  var trigger = document.getElementById('essay-guess');
  var source = document.getElementById('essay-guess-words');
  var article = document.querySelector('.essay-body');
  if (!trigger || !source || !article) return;

  var words;
  try { words = JSON.parse(source.textContent); } catch (error) { return; }
  if (!words || !words.length) return;

  var blanks = [];        // one per word actually found in the text
  var clones = [];        // every block the game touches, as it was before it did
  var actions = null;     // the two controls, built when the game opens
  var phase = 'reading';

  /* The words are approved one per piece and each appears exactly once in it,
     so the first whole-word match is the only match. Case is not part of the
     question: the list holds them lowercase, and a reader typing "Grief" has
     answered. Apostrophes vary by keyboard, so they are levelled too. */
  function normal(value) {
    return value.toLowerCase().trim().replace(/[’']/g, "'");
  }

  function findTextNode(word) {
    var pattern = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        // A word already lifted out is not a place to lift another from.
        if (node.parentElement.closest('.guess-blank')) return NodeFilter.FILTER_REJECT;
        return pattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var node = walker.nextNode();
    return node ? { node: node, at: node.nodeValue.search(pattern) } : null;
  }

  /* The box is as wide as the word it replaces, so the line it sits in keeps
     the shape it had. Anything narrower and the paragraph reflows the moment
     the game opens, which is the sentence moving out from under the reader. */
  function lift(word) {
    var found = findTextNode(word);
    if (!found) return null;
    var node = found.node;
    var original = node.nodeValue;
    var actual = original.substr(found.at, word.length);

    var tail = node.splitText(found.at);
    tail.nodeValue = tail.nodeValue.substr(word.length);

    var slot = document.createElement('span');
    slot.className = 'guess-blank';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'guess-input';
    input.autocapitalize = 'none';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', 'A word the essay used here, ' + word.length + ' letters');
    input.style.width = Math.max(word.length, 3) + 'ch';
    slot.appendChild(input);
    node.parentNode.insertBefore(slot, tail);

    var blank = { word: word, actual: actual, slot: slot, input: input, settled: false };

    input.addEventListener('input', function () {
      slot.classList.remove('is-yours');
      if (normal(input.value) === normal(word)) settle(blank, actual);
    });
    // A word that is not the essay's is not taken away. It is kept, and marked
    // as the reader's own, which is a different thing from being marked wrong.
    input.addEventListener('blur', function () {
      if (!blank.settled) slot.classList.toggle('is-yours', input.value.trim() !== '');
    });
    return blank;
  }

  /* No sound, no colour, no tick. The word simply takes its place and the
     sentence closes over it, which is what finding it actually feels like. */
  function settle(blank, text) {
    blank.settled = true;
    blank.guess = blank.input.value;
    var word = document.createElement('span');
    word.className = 'guess-word is-found';
    word.textContent = text;
    blank.slot.replaceChildren(word);
    blank.slot.classList.remove('is-yours');
    blank.slot.classList.add('is-settled');
  }

  /* The writer's word goes back so the sentence reads as written — that is what
     was asked for. The reader's stands next to it only where the two differ,
     small and plainly theirs. Nothing is struck through. */
  function reveal() {
    blanks.forEach(function (blank) {
      if (blank.settled) return;
      var mine = blank.input.value.trim();
      blank.settled = true;
      blank.guess = mine;
      var word = document.createElement('span');
      word.className = 'guess-word is-revealed';
      word.textContent = blank.actual;
      blank.slot.replaceChildren(word);
      if (mine && normal(mine) !== normal(blank.word)) {
        var yours = document.createElement('span');
        yours.className = 'guess-yours';
        // The brackets and the space are characters, not CSS: a reader copying
        // the line, or hearing it read, has to get the same sentence a reader
        // looking at it gets. Decoration in ::before does not survive either.
        yours.textContent = ' (' + mine + ')';
        yours.title = 'What you wrote';
        blank.slot.appendChild(yours);
      }
      blank.slot.classList.remove('is-yours');
      blank.slot.classList.add('is-settled');
    });
    if (actions) actions.reveal.disabled = true;
  }

  /* The essay is put back by swapping each block it touched for the copy taken
     before it was touched — the same move puzzle mode makes, and for the same
     reason. Stitching the split text nodes back together by hand looked simpler
     and was wrong twice over: normalising one blank's parent merges the text
     node the next blank is holding, so the second restore reaches for a node
     with no parent; and where two words share a paragraph the second blank's
     node IS the tail of the first one's split, so giving both their remembered
     values back writes the sentence into the paragraph twice. A copy cannot
     drift from the thing it copied. */
  function restore() {
    clones.forEach(function (pair) {
      if (pair.live.parentNode) pair.live.replaceWith(pair.copy);
    });
    clones = [];
    blanks = [];
    if (actions) { actions.bar.remove(); actions = null; }
    article.classList.remove('is-guessing');
    document.removeEventListener('keydown', onKey);
    phase = 'reading';
    trigger.hidden = false;
    trigger.focus({ preventScroll: true });
  }

  function onKey(event) {
    if (event.key === 'Escape' && phase === 'playing') { event.preventDefault(); restore(); }
  }

  function control(label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'guess-action';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  /* The block a word sits in, so it can be copied before it is opened up. */
  function blockOf(word) {
    var found = findTextNode(word);
    return found && found.node.parentElement
      ? found.node.parentElement.closest('p, li, blockquote, h2, h3, h4') : null;
  }

  function open() {
    if (phase !== 'reading') return;
    // Copies first, and every copy before any lifting: a block opened up is no
    // longer the block that should be remembered.
    var seen = [];
    words.forEach(function (word) {
      var block = blockOf(word);
      if (block && seen.indexOf(block) === -1) {
        seen.push(block);
        clones.push({ live: block, copy: block.cloneNode(true) });
      }
    });
    blanks = words.map(lift).filter(Boolean);
    // Nothing to play: the list and the essay have drifted apart. Say nothing,
    // change nothing, and leave the button where it was.
    if (!blanks.length) { clones = []; return; }

    article.classList.add('is-guessing');
    var bar = document.createElement('p');
    bar.className = 'guess-bar';
    var reveal_ = control('Show the words', reveal);
    var exit = control('Read the original', restore);
    bar.append(reveal_, exit);
    actions = { bar: bar, reveal: reveal_, exit: exit };
    trigger.hidden = true;
    trigger.parentNode.insertBefore(bar, trigger);

    phase = 'playing';
    document.addEventListener('keydown', onKey);
    // The reader pressed this at the foot of the essay; the first box is
    // somewhere above them. Taking them to it is the difference between a game
    // and a page that appears to have done nothing.
    blanks[0].slot.scrollIntoView({ block: 'center', behavior: 'smooth' });
    blanks[0].input.focus({ preventScroll: true });
  }

  trigger.addEventListener('click', open);
  trigger.hidden = false;
})();
