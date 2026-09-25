/* The drawer: what a reader keeps, from anywhere on the site. It opens in
   The House (/house/#drawer), but a word, a quiz note or a passage can go
   into it from the page it is on.

   It lives in this browser's storage and nowhere else. Each thing is kept
   whole (its kind, title, line and address), not as a pointer, so it stays
   in the drawer when the page it came from is reworded, reordered or gone.
   The House still shows the current text wherever the id is known.

   The same record holds The House's other small memories: the lamp, the
   question answered today, and what the site held at the last visit. One
   key, so clearing it clears all of it. */
(function () {
  'use strict';
  var KEY = 'olae-house-v1';
  var MAX_QUOTE = 700;
  var MIN_PASSAGE = 12;
  var listeners = [];
  var memory = null;
  var works = true;

  function tidy(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function text(value, max) { return typeof value === 'string' ? tidy(value).slice(0, max) : ''; }

  /* FNV-1a, so the same words kept from two places are one thing. */
  function textId(value) {
    var hash = 0x811c9dc5;
    var s = tidy(value).toLowerCase();
    for (var i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return 'text-' + hash.toString(36);
  }

  /* The first House kept ids alone, and could hold only these six. */
  var LEGACY = {
    'book-fragments': { id: textId('First there was Symmetry.'), kind: 'The Fragments', title: 'Point Zero', quote: 'First there was Symmetry.', href: '/book/part-one/#point-zero' },
    'essay-on-lying': { id: textId('A lie is an environment.'), kind: 'An essay', title: 'On Lying', quote: 'A lie is an environment.', href: '/pieces/on-lying.html' },
    'trivia-big-ben': { id: 'trivia-britain-great-bell', kind: 'British Culture', title: 'What does “Big Ben” technically refer to?', quote: 'Big Ben is the nickname of the Great Bell.', href: '/trivia/britain/' },
    'word-serendipity': { id: 'word-serendipity', kind: 'A word', title: 'serendipity', quote: '', href: '/word/serendipity/' },
    'word-museum': { id: 'word-museum', kind: 'A word', title: 'museum', quote: '', href: '/word/museum/' },
    'word-window': { id: 'word-window', kind: 'A word', title: 'window', quote: '', href: '/word/window/' }
  };

  /* Storage can be edited by hand or by an older page, so nothing read from
     it is trusted: ids are plain, text is text, and addresses stay on the
     site. */
  function clean(item) {
    if (!item || typeof item !== 'object') return null;
    var id = text(item.id, 120);
    var title = text(item.title, 240);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !title) return null;
    var href = text(item.href, 600);
    if (!/^\/(?![\/\\])/.test(href)) href = '/';
    return {
      id: id,
      kind: text(item.kind, 60),
      title: title,
      quote: text(item.quote, MAX_QUOTE),
      href: href,
      at: typeof item.at === 'number' && isFinite(item.at) ? item.at : 0
    };
  }

  function strings(list) {
    return Array.isArray(list) ? list.filter(function (s) { return typeof s === 'string' && s.length < 160; }) : [];
  }

  function normalize(value) {
    var state = { v: 2, kept: [], lamp: null, seen: null, answered: null };
    if (!value || typeof value !== 'object' || Array.isArray(value)) return state;
    if (Array.isArray(value.kept)) {
      value.kept.forEach(function (entry) {
        var item = typeof entry === 'string'
          ? (Object.prototype.hasOwnProperty.call(LEGACY, entry) ? clean(LEGACY[entry]) : null)
          : clean(entry);
        if (item && !state.kept.some(function (k) { return k.id === item.id; })) state.kept.push(item);
      });
    }
    if (typeof value.lamp === 'boolean') state.lamp = value.lamp;
    var seen = value.seen;
    if (seen && typeof seen === 'object' && typeof seen.day === 'string') {
      state.seen = { day: seen.day.slice(0, 10), known: strings(seen.known), fresh: strings(seen.fresh) };
    }
    var answered = value.answered;
    if (answered && typeof answered === 'object' && typeof answered.id === 'string' && typeof answered.choice === 'string' && typeof answered.day === 'string') {
      state.answered = { day: answered.day.slice(0, 10), id: answered.id.slice(0, 160), choice: answered.choice.slice(0, 300) };
    }
    return state;
  }

  function read() {
    if (memory) return normalize(JSON.parse(JSON.stringify(memory)));
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY) || 'null'));
    } catch (e) {
      // Malformed JSON is replaced on the next save; storage that cannot be
      // reached at all is found by the probe below.
      return normalize(null);
    }
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      works = true;
      memory = null;
    } catch (e) {
      works = false;
      memory = state;
    }
  }

  try {
    localStorage.setItem(KEY + '-probe', '1');
    localStorage.removeItem(KEY + '-probe');
  } catch (e) { works = false; }

  function emit() { listeners.forEach(function (fn) { fn(); }); }

  function update(change) {
    var state = read();
    change(state);
    write(state);
    emit();
    return state;
  }

  function has(id) { return read().kept.some(function (item) { return item.id === id; }); }

  /* Returns true when the thing is now in the drawer. */
  function toggle(raw) {
    var item = clean(raw);
    if (!item) return false;
    var now = false;
    update(function (state) {
      var at = state.kept.findIndex(function (k) { return k.id === item.id; });
      if (at === -1) { item.at = Date.now(); state.kept.push(item); now = true; }
      else state.kept.splice(at, 1);
    });
    return now;
  }

  function remove(id) {
    update(function (state) { state.kept = state.kept.filter(function (item) { return item.id !== id; }); });
  }

  /* --- On the page ------------------------------------------------------ */

  function note(message, from) {
    // Inside an open dialog the message belongs to the dialog; a status line
    // outside it would sit behind the backdrop.
    var dialog = from && from.closest && from.closest('dialog[open]');
    var inside = dialog && dialog.querySelector('[data-keep-status]');
    if (inside) { inside.textContent = message.text; return; }
    toast(message, from);
  }

  var toastBox = null;
  var toastTimer = 0;
  function toast(message, from) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'keep-toast';
      toastBox.setAttribute('role', 'status');
      toastBox.hidden = true;
      document.body.appendChild(toastBox);
    }
    toastBox.replaceChildren(document.createTextNode(message.text));
    if (message.link && location.pathname !== '/house/') {
      var link = document.createElement('a');
      link.href = '/house/#drawer';
      link.textContent = 'Open your drawer →';
      toastBox.appendChild(document.createTextNode(' '));
      toastBox.appendChild(link);
    }
    toastBox.hidden = false;
    // Over the button just pressed it would hide what the button now says,
    // and on a quiz the Next beside it; there it goes to the top instead.
    toastBox.classList.remove('keep-toast--top');
    if (from && from.matches && from.matches('[data-keep-button]')) {
      var pressed = from.getBoundingClientRect();
      var box = toastBox.getBoundingClientRect();
      if (pressed.bottom > box.top - 8 && pressed.top < box.bottom + 8) toastBox.classList.add('keep-toast--top');
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (!toastBox.matches(':focus-within')) toastBox.hidden = true;
    }, 6000);
  }

  function saidOnKeep(kept) {
    var text = kept ? 'Kept in your drawer.' : 'Taken out of your drawer.';
    if (!works) text += ' This browser cannot save it, so it stays only until you leave the page.';
    return { text: text, link: kept && works };
  }

  function itemFor(button) {
    var holder = button.closest('[data-keep-item]');
    if (!holder) return null;
    try { return clean(JSON.parse(holder.getAttribute('data-keep-item'))); } catch (e) { return null; }
  }

  /* Every keep button says whether its thing is already in the drawer. */
  function sync(root) {
    var kept = {};
    read().kept.forEach(function (item) { kept[item.id] = true; });
    (root || document).querySelectorAll('[data-keep-button]').forEach(function (button) {
      var item = itemFor(button);
      if (!item) return;
      if (!button.dataset.label) button.dataset.label = button.textContent;
      var on = !!kept[item.id];
      button.setAttribute('aria-pressed', String(on));
      button.textContent = on ? 'In your drawer ✓' : button.dataset.label;
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-keep-button]');
    if (!button) return;
    var item = itemFor(button);
    if (!item) return;
    var kept = toggle(item);
    sync();
    note(saidOnKeep(kept), button);
  });

  /* --- Passages --------------------------------------------------------
     A container marked data-keep-passage lets a reader select a few lines
     and keep them. Book pages name the chapter from the section the words
     sit in. On essay pages the selection already opens the translation
     prompt, and js/reader-translate.js puts a Keep button beside Türkçe
     through passageFor(); anywhere else a small prompt of our own appears. */

  function passageFor(range) {
    if (!range) return null;
    var node = range.commonAncestorContainer;
    var element = node.nodeType === 1 ? node : node.parentElement;
    var holder = element && element.closest('[data-keep-passage]');
    if (!holder) return null;
    var words = tidy(range.toString());
    if (words.length < MIN_PASSAGE || words.length > MAX_QUOTE) return null;
    var chapter = element.closest('.book-chapter');
    var heading = chapter && chapter.querySelector('h2[id]');
    var title = heading ? heading.textContent : holder.getAttribute('data-keep-title');
    var href = location.pathname + (heading ? '#' + heading.id : '');
    return clean({
      id: textId(words),
      kind: holder.getAttribute('data-keep-kind') || '',
      title: title || document.title,
      quote: words,
      href: href
    });
  }

  function keepPassage(item, from) {
    if (!item) { note({ text: 'Select a sentence or two to keep.' }, from); return; }
    var already = has(item.id);
    if (!already) toggle(item);
    note(already ? { text: 'Already in your drawer.', link: works } : saidOnKeep(true), from);
  }

  var prompt = null;
  var current = null;
  function ownPrompt() {
    prompt = document.createElement('div');
    prompt.className = 'keep-prompt';
    prompt.hidden = true;
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Keep this passage';
    // Pressing the button must not clear the selection it is about.
    button.addEventListener('pointerdown', function (event) { event.preventDefault(); });
    button.addEventListener('click', function () {
      keepPassage(current, button);
      prompt.hidden = true;
    });
    prompt.appendChild(button);
    document.body.appendChild(prompt);
    var timer = 0;
    document.addEventListener('selectionchange', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var selection = window.getSelection();
        current = selection && selection.rangeCount && !selection.isCollapsed ? passageFor(selection.getRangeAt(0)) : null;
        prompt.hidden = !current;
      }, 120);
    });
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== KEY && event.key !== null) return;
    sync();
    emit();
  });

  window.OLAE_KEEP = {
    read: read,
    update: update,
    has: has,
    toggle: toggle,
    remove: remove,
    clean: clean,
    textId: textId,
    sync: sync,
    passageFor: passageFor,
    keepPassage: keepPassage,
    works: function () { return works; },
    subscribe: function (fn) { listeners.push(fn); }
  };

  function start() {
    // .keep-js marks what is only worth showing once this script runs.
    document.documentElement.classList.add('keep-ready');
    sync();
    if (document.querySelector('[data-keep-passage]') && window.getSelection && !document.querySelector('.reader-translate')) ownPrompt();
  }
  // After every deferred script, so the translation prompt, if the page has
  // one, is already there to be found.
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
