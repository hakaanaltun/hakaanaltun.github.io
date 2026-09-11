/* Guess the word — a few of the essay's own words are lifted out and the reader
   puts them back, or doesn't.

   There is no wrong here, and that is the whole design rather than a kindness
   bolted onto it. A word that matches settles into the sentence and the box is
   gone. A word that does not match STAYS, in the reader's own hand: it is not
   refused, not marked, not cleared. Asking for a word puts the writer's back in
   place and stands the reader's beside it if the two differ, which is the only
   moment they are meant to be compared — not as answer and error, but as two
   people reaching for the same slot.

   Everything here is shaped by one fact about the list: the words are far
   apart. Six or seven of them are spread across a whole essay, which is why
   there is no single control that acts on all of them from the foot of the
   page — pressing that revealed six words a reader then had to go hunting for.
   Instead each blank carries its own way out, offered where the reader is
   actually looking, and finishing one carries them to the next.

   Which words are lifted is not decided here. _data/guesses.yml holds the list,
   approved by hand; this file only finds them and hands them back.

   Every block the game opens is copied first and the copy is put back on exit,
   so nothing about the essay survives it. Nothing is sent or saved. */
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
  var bar = null;         // the strip that holds the count and the way out
  var current = null;     // the blank the reader is standing in, if any
  var phase = 'reading';
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  function left() {
    return blanks.filter(function (b) { return !b.settled; }).length;
  }

  function nextAfter(blank) {
    var from = blanks.indexOf(blank);
    for (var i = from + 1; i < blanks.length; i++) if (!blanks[i].settled) return blanks[i];
    for (var j = 0; j < from; j++) if (!blanks[j].settled) return blanks[j];
    return null;
  }

  /* A word filled is a place finished with, and the next one is most of an
     essay away. Carrying the reader there is the difference between a game and
     a scavenger hunt: without it, every turn ends in scrolling to look for the
     next box. */
  function goTo(blank) {
    if (!blank) return;
    blank.slot.scrollIntoView({ block: 'center',
      behavior: motion.matches ? 'auto' : 'smooth' });
    blank.input.focus({ preventScroll: true });
  }

  function countLabel() {
    var n = left();
    return n === 0 ? 'all of them found' : n === 1 ? '1 word left' : n + ' words left';
  }

  /* The strip says what it will do, always. With a box in focus the middle
     control acts on that one word; with none it acts on what is left. The
     label is never a guess about which. */
  function paint() {
    if (!bar) return;
    bar.count.textContent = countLabel();
    var one = current && !current.settled;
    bar.show.textContent = one ? 'show this word' : 'show the rest';
    bar.show.disabled = left() === 0;
  }

  /* The box is as wide as the word it replaces, so the line it sits in keeps
     the shape it had. Anything narrower and the paragraph reflows the moment
     the game opens, which is the sentence moving out from under the reader. */
  function lift(word) {
    var found = findTextNode(word);
    if (!found) return null;
    var node = found.node;
    var actual = node.nodeValue.substr(found.at, word.length);

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
      if (normal(input.value) === normal(word)) {
        settle(blank, actual);
        goTo(nextAfter(blank));
      }
    });
    input.addEventListener('focus', function () { current = blank; paint(); });
    // A word that is not the essay's is not taken away. It is kept, and marked
    // as the reader's own, which is a different thing from being marked wrong.
    input.addEventListener('blur', function () {
      if (!blank.settled) slot.classList.toggle('is-yours', input.value.trim() !== '');
      if (current === blank) { current = null; paint(); }
    });
    return blank;
  }

  /* No sound, no colour, no tick. The word simply takes its place and the
     sentence closes over it, which is what finding it actually feels like. */
  function settle(blank, text) {
    blank.settled = true;
    var word = document.createElement('span');
    word.className = 'guess-word is-found';
    word.textContent = text;
    blank.slot.replaceChildren(word);
    blank.slot.classList.remove('is-yours');
    blank.slot.classList.add('is-settled');
    if (current === blank) current = null;
    paint();
  }

  /* The writer's word goes back so the sentence reads as written — that is what
     was asked for. The reader's stands next to it only where the two differ,
     small and plainly theirs. Nothing is struck through. */
  function open_(blank) {
    if (blank.settled) return;
    var mine = blank.input.value.trim();
    blank.settled = true;
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
  }

  /* One word, where the reader is standing. This is the ordinary way to be
     shown something: asking for all of them at once scattered six answers over
     an essay and left the reader to find what had changed. */
  function revealOne(blank) {
    var next = nextAfter(blank);
    open_(blank);
    current = null;
    paint();
    goTo(next);
  }

  function revealRest() {
    blanks.forEach(open_);
    current = null;
    paint();
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
    current = null;
    if (bar) { bar.el.remove(); bar = null; }
    article.classList.remove('is-guessing');
    document.removeEventListener('keydown', onKey);
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', ride);
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

  /* The strip stays with the reader rather than at the foot of the page. The
     way out of a mode has to be reachable from inside it, and at seven words
     across an essay the foot is nowhere near where anyone is working.

     A popover on the blank itself was tried first and is what a reader would
     draw if you asked them to. It cannot work here: anything anchored under a
     line of body type covers the line beneath it, and on this site covering the
     writing to play a game about the writing is the wrong trade. The strip sits
     at the edge of the screen instead, where it covers nothing — and the word
     being worked on is always on screen anyway, because finishing one carries
     the reader to the next. */
  function buildBar() {
    var el = document.createElement('div');
    el.className = 'guess-bar';
    var count = document.createElement('span');
    count.className = 'guess-count';
    // Taken on pointerdown: a click lands after the box has already lost focus,
    // and which word is in focus is what this button acts on.
    var show = document.createElement('button');
    show.type = 'button';
    show.className = 'guess-action';
    show.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      if (show.disabled) return;
      if (current && !current.settled) revealOne(current); else revealRest();
    });
    var exit = control('read the original', restore);
    el.append(count, show, exit);
    document.body.appendChild(el);
    bar = { el: el, count: count, show: show, exit: exit };
    ride();
    paint();
  }

  /* A phone's keyboard covers the bottom of the screen, and a fixed element
     sits behind it. Where the browser reports its visual viewport, the strip
     rides the top of the keyboard instead of disappearing under it. */
  function ride() {
    var vv = window.visualViewport;
    if (!vv || !bar) return;
    var lift = Math.max(0, innerHeight - vv.height - vv.offsetTop);
    bar.el.style.bottom = (18 + lift) + 'px';
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
    trigger.hidden = true;
    buildBar();
    phase = 'playing';
    document.addEventListener('keydown', onKey);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', ride);
    // The reader pressed this at the foot of the essay; the first box is
    // somewhere above them. Taking them to it is the difference between a game
    // and a page that appears to have done nothing.
    goTo(blanks[0]);
  }

  trigger.addEventListener('click', open);
  trigger.hidden = false;
})();
