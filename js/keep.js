/* The drawer: what a reader keeps, from anywhere on the site. It opens in
   The House (/house/#drawer), but a word, a quiz note or a passage can go
   into it from the page it is on.

   It lives in this browser's storage and nowhere else. Each thing is kept
   whole (its kind, title, line and address), not as a pointer, so it stays
   in the drawer when the page it came from is reworded, reordered or gone.
   The House still shows the current text wherever the id is known. A thing
   can carry the reader's own note, which is kept with it and goes where it
   goes: into a backup, the text download and the printed drawer, but not
   onto a shared card.

   The same record holds The House's other small memories: the lamp, the
   question answered today, and what the site held at the last visit. One
   key, so clearing it clears all of it. */
(function () {
  'use strict';
  var KEY = 'olae-house-v1';
  var MAX_QUOTE = 700;
  var MAX_NOTE = 2000;
  var MIN_PASSAGE = 12;
  var listeners = [];
  var memory = null;
  var works = true;

  /* The word joiner the build puts before a closed-up dash is left out, so
     a passage kept before it arrived is still the same passage. */
  function tidy(value) { return String(value || '').replace(/\u2060/g, '').replace(/\s+/g, ' ').trim(); }
  function text(value, max) { return typeof value === 'string' ? tidy(value).slice(0, max) : ''; }
  /* A note keeps its line breaks; only runs of empty lines are closed up. */
  function noteText(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/\r\n?/g, '\n').replace(/\u2060/g, '').replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_NOTE);
  }

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
    var out = {
      id: id,
      kind: text(item.kind, 60),
      title: title,
      quote: text(item.quote, MAX_QUOTE),
      href: href,
      at: typeof item.at === 'number' && isFinite(item.at) ? item.at : 0
    };
    var note = noteText(item.note);
    if (note) out.note = note;
    // A highlight is marked on its page; one made by Highlight alone is
    // not otherwise kept (see highlight() below).
    if (item.mark === true) out.mark = true;
    if (item.keep === false) out.keep = false;
    return out;
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
    // Marks on the pages are shown unless the reader hid them.
    if (value.marks === false) state.marks = false;
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

  function find(id) {
    var found = null;
    read().kept.forEach(function (item) { if (item.id === id) found = item; });
    return found;
  }

  /* A highlight is a passage marked on its page. It lives in the drawer
     like anything kept, flagged mark, so a backup carries it and the
     drawer lists it. One made by Highlight alone also carries keep: false,
     so clearing it leaves nothing behind; a highlight on something kept or
     written about only loses its mark. Keep or a note makes it kept. */
  function highlight(raw) {
    var item = clean(raw);
    if (!item) return false;
    update(function (state) {
      var known = null;
      state.kept.forEach(function (k) { if (k.id === item.id) known = k; });
      if (known) known.mark = true;
      else {
        item.mark = true;
        item.keep = false;
        item.at = Date.now();
        state.kept.push(item);
      }
      // A new highlight is meant to be seen, so hidden highlights return.
      delete state.marks;
    });
    return true;
  }
  function unhighlight(id) {
    update(function (state) {
      state.kept = state.kept.filter(function (item) {
        if (item.id !== id) return true;
        if (item.keep === false && !item.note) return false;
        delete item.mark;
        return true;
      });
    });
  }
  function hold(id) {
    update(function (state) {
      state.kept.forEach(function (item) { if (item.id === id) delete item.keep; });
    });
  }

  /* While a note is being written it is saved quietly, so a page that
     redraws on every change (the drawer) does not redraw under the reader's
     hands. Done saves it aloud. Returns false when the thing is no longer
     in the drawer. */
  function setNote(id, value, quiet) {
    var note = noteText(value);
    var state = read();
    var found = false;
    state.kept.forEach(function (item) {
      if (item.id !== id) return;
      found = true;
      if (note) item.note = note;
      else delete item.note;
    });
    if (!found) return false;
    write(state);
    if (!quiet) emit();
    return true;
  }

  /* One kept thing as plain text: for the copy beside a note and for the
     drawer's text download. */
  function plain(item) {
    var lines = [[item.kind, item.title].filter(Boolean).join(' · ')];
    if (item.quote) lines.push(item.id.indexOf('text-') === 0 ? '“' + item.quote + '”' : item.quote);
    if (item.note) lines.push('Note: ' + item.note);
    lines.push(location.origin + item.href);
    return lines.join('\n');
  }

  /* A portable copy contains only the things in the drawer. Restoring it
     adds missing records, and a note to a record that has none, and leaves
     the lamp, the House's memories and every note already here alone.
     Commit to storage before emitting, so a full or blocked store cannot
     be mistaken for a successful restore. */
  function backup() {
    return { format: 'olae-drawer', version: 1, items: read().kept };
  }
  function restoreBackup(value) {
    if (!value || value.format !== 'olae-drawer' || value.version !== 1 ||
        !Array.isArray(value.items) || value.items.length > 5000) throw new Error('Invalid drawer backup.');
    var items = value.items.map(function (entry) {
      var item = clean(entry);
      if (!item) throw new Error('Invalid drawer record.');
      return item;
    });
    var state = read();
    var here = new Map(state.kept.map(function (item) { return [item.id, item]; }));
    var added = { items: 0, notes: 0 };
    items.forEach(function (item) {
      var known = here.get(item.id);
      if (known) {
        if (item.note && !known.note) { known.note = item.note; added.notes++; }
        return;
      }
      here.set(item.id, item);
      state.kept.push(item);
      added.items++;
    });
    if (added.items || added.notes) {
      localStorage.setItem(KEY, JSON.stringify(state));
      memory = null;
      works = true;
      emit();
      sync();
    }
    return added;
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
     prompt, and js/reader-translate.js puts Keep, Note and Highlight
     beside Türkçe through passageFor(); anywhere else a small prompt of
     our own appears. Keeping and writing a note leave the page as it is;
     only Highlight marks it. */

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
    var known = find(item.id);
    if (!known) toggle(item);
    else if (known.keep === false) hold(item.id);
    clearSelection();
    openPanel(item.id, known && known.keep !== false ? 'already' : 'kept', from);
  }

  /* Highlight, beside Keep: marks the selected passage on its page, or,
     pressed over a highlight, clears it. */
  function highlightSelection(range, from) {
    var over = range ? marksIn(range) : [];
    var item = over.length ? null : passageFor(range);
    clearSelection();
    if (panel && !panel.hidden && !part('.keep-note')) closePanel(false);
    if (over.length) {
      over.forEach(function (mark) { unhighlight(mark.id); });
      note({ text: 'Highlight removed.' }, from);
      return;
    }
    if (!item) { note({ text: 'Select a sentence or two to highlight.' }, from); return; }
    highlight(item);
    note({ text: works ? 'Highlighted. It stays in this browser.' : 'Highlighted until you leave the page. This browser cannot save it.' }, from);
  }

  /* The selection goes, so the mark it leaves is what the reader sees. */
  function clearSelection() {
    var selection = window.getSelection && window.getSelection();
    if (selection && !selection.isCollapsed && selection.anchorNode && selection.anchorNode.parentElement &&
        selection.anchorNode.parentElement.closest('[data-keep-passage]')) selection.removeAllRanges();
  }

  var prompt = null;
  var current = null;
  var currentRange = null;
  function ownPrompt() {
    prompt = document.createElement('div');
    prompt.className = 'keep-prompt';
    prompt.hidden = true;
    var marker = null;
    [['Keep this passage', function (from) { keepPassage(current, from); }],
     ['Add a note', function (from) { notePassage(current, from); }],
     ['Highlight', function (from) { highlightSelection(currentRange, from); }]].forEach(function (pair, i) {
      if (i === 2 && !canMark()) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = pair[0];
      // Pressing the button must not clear the selection it is about.
      button.addEventListener('pointerdown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () {
        pair[1](button);
        prompt.hidden = true;
      });
      prompt.appendChild(button);
      if (i === 2) marker = button;
    });
    document.body.appendChild(prompt);
    var timer = 0;
    document.addEventListener('selectionchange', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var selection = window.getSelection();
        currentRange = selection && selection.rangeCount && !selection.isCollapsed ? selection.getRangeAt(0).cloneRange() : null;
        current = currentRange ? passageFor(currentRange) : null;
        var lit = isHighlighted(currentRange);
        if (marker) marker.textContent = lit ? 'Remove highlight' : 'Highlight';
        prompt.hidden = !current && !lit;
      }, 120);
    });
  }

  /* --- A note ------------------------------------------------------------
     The same small editor serves a passage on its page and anything in the
     drawer. It saves as the reader writes, so nothing waits on a button;
     Done closes it. For a reader who wants to write at length, Copy takes
     the note with what was kept and its address, and The Page (/write/)
     is beside it to paste them into. */

  var editors = 0;
  var flushes = [];
  function flushNotes() { flushes.forEach(function (fn) { fn(); }); }

  /* With options.draft, the thing is not in the drawer yet: nothing is
     saved as the reader writes, and the last button keeps the thing and
     its note together. */
  function noteEditor(id, options) {
    options = options || {};
    var draft = options.draft ? clean(options.draft) : null;
    var n = ++editors;
    var box = document.createElement('div');
    box.className = 'keep-note';
    var label = document.createElement('label');
    label.className = 'keep-note-label';
    label.htmlFor = 'keep-note-' + n;
    label.textContent = 'Your note';
    var area = document.createElement('textarea');
    area.id = 'keep-note-' + n;
    area.className = 'keep-note-text';
    area.rows = 4;
    area.maxLength = MAX_NOTE;
    area.spellcheck = true;
    var kept = draft ? null : find(id);
    area.value = kept && kept.note ? kept.note : '';
    var foot = document.createElement('div');
    foot.className = 'keep-note-foot';
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'keep-note-copy';
    copy.textContent = 'Copy';
    var done = document.createElement('button');
    done.type = 'button';
    done.className = 'keep-note-done';
    done.textContent = draft ? 'Keep with the note' : 'Done';
    var page = document.createElement('a');
    page.className = 'keep-note-page';
    page.href = pageHref();
    page.textContent = 'Write more on The Page →';
    var start = document.createElement('span');
    start.className = 'keep-note-start';
    start.appendChild(copy);
    start.appendChild(page);
    foot.appendChild(start);
    foot.appendChild(done);
    var hint = document.createElement('p');
    hint.className = 'keep-note-hint';
    hint.textContent = !works
      ? 'This browser cannot save your note. Copy it before you leave.'
      : draft
        ? 'Nothing is kept until you keep it. To write at length, copy your note and paste it on The Page.'
        : 'Your note stays in this browser with what you kept. To write at length, copy both and paste them on The Page.';
    var said = document.createElement('p');
    said.className = 'keep-note-said';
    said.setAttribute('role', 'status');
    box.appendChild(label);
    box.appendChild(area);
    box.appendChild(foot);
    box.appendChild(hint);
    box.appendChild(said);

    /* Only what was written since the last save is saved, so an editor
       that has left the page can never write its older words over a newer
       note. */
    var timer = 0;
    var gone = false;
    var dirty = false;
    function save() {
      clearTimeout(timer);
      if (draft) return;
      if (dirty && !gone && !setNote(id, area.value, true)) gone = true;
      dirty = false;
      if (!area.isConnected) flushes = flushes.filter(function (fn) { return fn !== save; });
    }
    function left() {
      var room = MAX_NOTE - area.value.length;
      said.textContent = room <= 100 ? (room === 1 ? '1 character left.' : room + ' characters left.') : '';
    }
    area.addEventListener('input', function () {
      dirty = true;
      clearTimeout(timer);
      timer = setTimeout(save, 400);
      left();
    });
    area.addEventListener('blur', save);
    if (!draft) flushes.push(save);
    copy.addEventListener('click', function () {
      save();
      var item = draft || (options.describe && options.describe()) || find(id);
      if (!item) { said.textContent = 'This is no longer in your drawer.'; return; }
      var words = plain(Object.assign({}, item, { note: noteText(area.value) }));
      copyText(words).then(function () {
        said.textContent = 'Copied, with its link.';
      }, function () {
        said.textContent = 'This browser would not copy it. Select your note and copy it by hand.';
      });
    });
    function finish() {
      if (draft) {
        var words = noteText(area.value);
        var item = clean(Object.assign({}, draft, { note: words }));
        draft = null;
        if (has(item.id)) { setNote(item.id, words, true); hold(item.id); }
        else toggle(item);
        if (options.onDone) options.onDone(words);
        return;
      }
      save();
      flushes = flushes.filter(function (fn) { return fn !== save; });
      if (!gone) setNote(id, area.value);
      if (options.onDone) options.onDone(noteText(area.value));
    }
    done.addEventListener('click', finish);
    box.focusNote = function () { area.focus(); };
    box.isDraft = function () { return !!draft; };
    box.hasText = function () { return noteText(area.value) !== ''; };
    box.finish = finish;
    box.save = save;
    return box;
  }

  /* The Page is opened with from=drawer, so its way back leads to the
     drawer, as The House's own links lead back to the study
     (_includes/tool-back.html). The v loads The Page as it is now rather
     than a service worker's older copy; it moves when that way back does. */
  function pageHref() { return '/write/?from=drawer&v=20261010-1'; }

  function copyText(words) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(words).catch(function () { return oldCopy(words); });
    }
    return oldCopy(words);
  }
  function oldCopy(words) {
    return new Promise(function (resolve, reject) {
      var spare = document.createElement('textarea');
      spare.value = words;
      spare.setAttribute('readonly', '');
      spare.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
      document.body.appendChild(spare);
      spare.select();
      var copied = false;
      try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
      spare.remove();
      if (copied) resolve(); else reject(new Error('copy'));
    });
  }

  /* --- The panel by a kept passage ----------------------------------------
     There are three ways in. Keeping a passage opens a panel at the foot of
     the window: what happened, a note, and a way to take the passage out.
     Note, beside Keep, opens the same panel with the note first, and
     nothing is kept until the reader keeps it. Touching a marked passage
     opens a smaller box beside it, with the note, a way to hide the marks
     and a way to take the passage out. A note is the reader's own writing,
     so taking out a passage that has one, or closing a note that is not
     kept yet, asks a second time. */

  var panel = null;
  var panelId = '';
  var panelMode = '';
  var panelTimer = 0;
  var panelFrom = null;
  var panelNear = null;

  /* Text a script shows is out of the build's reach, so its closed-up
     dashes are joined here, as the build joins them on the page. */
  function joinDashes(value) { return String(value).replace(/([^\s⁠])—/g, '$1⁠—'); }

  function make(tag, className, words) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (words) node.textContent = words;
    return node;
  }
  function part(selector) { return panel.querySelector(selector); }
  function narrow() { return !!(window.matchMedia && window.matchMedia('(max-width: 640px)').matches); }

  function buildPanel() {
    panel = make('section', 'keep-panel');
    panel.hidden = true;
    panel.setAttribute('aria-label', 'A kept passage');
    var head = make('div', 'keep-panel-head');
    var said = make('p', 'keep-panel-said');
    said.setAttribute('role', 'status');
    var close = make('button', 'keep-panel-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    head.appendChild(said);
    head.appendChild(close);
    var quote = make('blockquote', 'keep-panel-quote');
    quote.hidden = true;
    var shown = make('p', 'keep-panel-note');
    shown.hidden = true;
    var row = make('div', 'keep-panel-actions');
    ['data-panel-note', 'data-panel-out', 'data-panel-marks'].forEach(function (name) {
      var button = make('button');
      button.type = 'button';
      button.setAttribute(name, '');
      row.appendChild(button);
    });
    var drawer = make('a', '', 'Open your drawer →');
    drawer.href = '/house/#drawer';
    row.appendChild(drawer);
    panel.appendChild(head);
    panel.appendChild(quote);
    panel.appendChild(shown);
    panel.appendChild(row);
    document.body.appendChild(panel);

    close.addEventListener('click', function () { closePanel(true); });
    part('[data-panel-note]').addEventListener('click', function () { showEditor(true); });
    part('[data-panel-marks]').addEventListener('click', function () {
      var on = !marksShown();
      setMarks(on);
      said.textContent = on ? 'Highlights shown on every page.' : 'Highlights hidden on every page.';
      labelPanel();
      placePanel();
      hideLater(6000);
    });
    var out = part('[data-panel-out]');
    out.addEventListener('click', function () {
      var editor = part('.keep-note');
      if (editor) editor.save();
      var item = find(panelId);
      if (!item) { closePanel(true); return; }
      // In the box by a highlight, this clears the highlight. A note, or a
      // keep, stays in the drawer.
      if (panelMode === 'touched') {
        unhighlight(panelId);
        said.textContent = 'Highlight removed.';
        shown.hidden = true;
        row.hidden = true;
        close.focus();
        hideLater(4000);
        return;
      }
      if (item.note && out.getAttribute('data-armed') !== 'true') {
        out.setAttribute('data-armed', 'true');
        out.textContent = 'Take it out with the note';
        said.textContent = 'Your note would go with it.';
        return;
      }
      dropEditor();
      remove(panelId);
      said.textContent = 'Taken out of your drawer.';
      shown.hidden = true;
      row.hidden = true;
      close.focus();
      hideLater(4000);
    });
    out.addEventListener('blur', disarm);
    // Writing again after a first Close means the reader is not done.
    panel.addEventListener('input', function () { panel.removeAttribute('data-leaving'); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) closePanel(true);
    });
    document.addEventListener('pointerdown', function (event) {
      if (panel.hidden || panel.contains(event.target)) return;
      if (!part('.keep-note')) closePanel(false);
    });
    document.addEventListener('selectionchange', function () {
      if (!panel.hidden && !part('.keep-note') && selectingPassage()) closePanel(false);
    });
    // The small box stands by its passage, so it goes when the page moves,
    // as the translation prompt does.
    window.addEventListener('scroll', function () {
      if (!panel.hidden && panelNear && !part('.keep-note') && !narrow()) closePanel(false);
    }, { passive: true });
    window.addEventListener('resize', placePanel);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', placePanel);
      window.visualViewport.addEventListener('scroll', placePanel);
    }
  }

  function disarm() {
    var out = panel && part('[data-panel-out]');
    if (!out) return;
    out.removeAttribute('data-armed');
    out.textContent = panelMode === 'touched' ? 'Remove highlight' : 'Take out';
  }

  function dropEditor() {
    var editor = panel && part('.keep-note');
    if (!editor) return;
    editor.save();
    flushes = flushes.filter(function (fn) { return fn !== editor.save; });
    editor.remove();
  }

  /* The small box sits under the line that was touched, or over it when
     there is no room below; on a phone it sits at the foot of the window,
     like everything else here. There the keyboard rises over the foot of
     the window, and the panel rises with it, so the note being written
     stays in view. */
  function placePanel() {
    if (!panel || panel.hidden) return;
    var style = panel.style;
    if (panelNear && !narrow()) {
      var width = Math.min(420, window.innerWidth - 28);
      style.width = width + 'px';
      style.left = Math.max(14, Math.min(panelNear.x - width / 2, window.innerWidth - width - 14)) + 'px';
      style.transform = 'none';
      style.bottom = 'auto';
      style.maxHeight = '';
      var height = panel.offsetHeight || 120;
      var top = panelNear.bottom + 10;
      if (top + height > window.innerHeight - 10) top = panelNear.top - height - 10;
      style.top = Math.max(10, Math.min(top, window.innerHeight - height - 10)) + 'px';
      return;
    }
    style.width = style.left = style.top = style.transform = '';
    var view = window.visualViewport;
    var lift = view ? Math.max(0, window.innerHeight - view.height - view.offsetTop) : 0;
    style.bottom = lift > 40 ? (lift + 10) + 'px' : '';
    style.maxHeight = view ? Math.max(160, view.height - 28) + 'px' : '';
  }

  function hideLater(wait) {
    clearTimeout(panelTimer);
    panelTimer = setTimeout(function check() {
      if (!panel || panel.hidden) return;
      if (part('.keep-note') || panel.matches(':focus-within, :hover')) {
        panelTimer = setTimeout(check, 2000);
        return;
      }
      closePanel(false);
    }, wait);
  }

  /* A note is written at the foot of the window, wherever the panel was. */
  function showEditor(focus) {
    var item = find(panelId);
    if (!item) return;
    var old = part('.keep-note');
    if (old) { if (focus) old.focusNote(); return; }
    panelNear = null;
    panel.classList.remove('keep-panel--near');
    part('.keep-panel-note').hidden = true;
    var editor = noteEditor(panelId, {
      onDone: function (words) {
        editor.remove();
        part('.keep-panel-said').textContent = words ? 'Your note is in your drawer.' : 'In your drawer, without a note.';
        labelPanel();
        part('.keep-panel-note').hidden = true;
        part('[data-panel-note]').focus();
        hideLater(5000);
      }
    });
    part('.keep-panel-actions').before(editor);
    part('[data-panel-note]').hidden = true;
    clearTimeout(panelTimer);
    placePanel();
    if (focus) editor.focusNote();
  }

  function labelPanel() {
    var item = find(panelId);
    var noteButton = part('[data-panel-note]');
    noteButton.hidden = false;
    noteButton.textContent = item && item.note ? 'Your note' : 'Add a note';
    // The box by a highlight offers to hide them all, and to show them
    // again straight after.
    var marksButton = part('[data-panel-marks]');
    marksButton.hidden = panelMode !== 'touched' || !canMark();
    marksButton.textContent = marksShown() ? 'Hide highlights' : 'Show highlights';
    disarm();
    part('.keep-panel-actions a').hidden = panelMode === 'touched' || !works || location.pathname === '/house/';
    var preview = part('.keep-panel-note');
    preview.hidden = !(panelMode === 'touched' && item && item.note);
    preview.textContent = item && item.note ? joinDashes(item.note) : '';
  }

  /* A new selection in a piece is the reader moving on: a panel with
     nothing being written, and the line a toast says, make way for the
     prompt over the selection. */
  function selectingPassage() {
    var selection = window.getSelection && window.getSelection();
    var node = selection && !selection.isCollapsed && selection.anchorNode;
    var element = node && (node.nodeType === 1 ? node : node.parentElement);
    return !!(element && element.closest('[data-keep-passage]'));
  }

  function startPanel(mode, from, near) {
    if (!panel) buildPanel();
    dropEditor();
    if (toastBox) toastBox.hidden = true;
    clearTimeout(panelTimer);
    panelMode = mode;
    panelFrom = from && from.isConnected !== false ? from : null;
    panelNear = near || null;
    panel.classList.toggle('keep-panel--near', !!panelNear);
    panel.removeAttribute('data-leaving');
    part('.keep-panel-quote').hidden = true;
    part('.keep-panel-actions').hidden = false;
  }

  /* how: 'kept' just now, 'already' kept before, or 'touched' on the page. */
  function openPanel(id, how, from, near) {
    var item = find(id);
    if (!item) return;
    startPanel(how, from, how === 'touched' ? near : null);
    panelId = id;
    var said = how === 'kept' ? saidOnKeep(true).text : how === 'already' ? 'Already in your drawer.' : 'Highlighted.';
    if (!works && how !== 'kept') said += ' This browser cannot save it, so it stays only until you leave the page.';
    part('.keep-panel-said').textContent = said;
    labelPanel();
    panel.hidden = false;
    placePanel();
    // Kept before with a note, the note is what the reader is after; it
    // opens unfocused, so a phone's keyboard stays down.
    if (item.note && how === 'already') showEditor(false);
    else hideLater(how === 'touched' ? 6000 : 8000);
  }

  /* Note, beside Keep: the note comes first, and the passage goes into the
     drawer with it only when the reader keeps it. */
  function notePassage(item, from) {
    if (!item) { note({ text: 'Select a sentence or two to write about.' }, from); return; }
    clearSelection();
    var known = find(item.id);
    if (known && known.keep !== false) { openPanel(item.id, 'already', from); showEditor(true); return; }
    startPanel('draft', from, null);
    panelId = '';
    part('.keep-panel-said').textContent = 'A note on this passage.';
    var quote = part('.keep-panel-quote');
    quote.textContent = joinDashes(item.quote);
    quote.hidden = false;
    part('.keep-panel-note').hidden = true;
    part('.keep-panel-actions').hidden = true;
    var editor = noteEditor(item.id, {
      draft: item,
      onDone: function (words) {
        editor.remove();
        quote.hidden = true;
        panelId = item.id;
        panelMode = 'kept';
        part('.keep-panel-said').textContent = works ? (words ? 'Kept in your drawer, with your note.' : 'Kept in your drawer.') : saidOnKeep(true).text;
        part('.keep-panel-actions').hidden = false;
        labelPanel();
        part('[data-panel-note]').focus();
        hideLater(6000);
      }
    });
    part('.keep-panel-actions').before(editor);
    panel.hidden = false;
    placePanel();
    editor.focusNote();
  }

  function closePanel(restore) {
    if (!panel || panel.hidden) return;
    var editor = part('.keep-note');
    if (editor && editor.isDraft() && editor.hasText() && panel.getAttribute('data-leaving') !== 'true') {
      panel.setAttribute('data-leaving', 'true');
      part('.keep-panel-said').textContent = 'Your note is not kept yet. Close again to let it go.';
      return;
    }
    clearTimeout(panelTimer);
    dropEditor();
    var hadFocus = panel.matches(':focus-within');
    panel.hidden = true;
    panel.removeAttribute('data-leaving');
    panelId = '';
    panelMode = '';
    panelNear = null;
    if (restore && hadFocus && panelFrom && panelFrom.isConnected && !panelFrom.closest('[hidden]')) panelFrom.focus({ preventScroll: true });
  }

  window.addEventListener('pagehide', flushNotes);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flushNotes(); });

  /* --- Highlights on the page --------------------------------------------
     A passage highlighted on this page is marked where it stands, for this
     reader only. The marks are drawn with the CSS Custom Highlight API, so
     the page's own text is never wrapped or changed, and where a browser
     lacks it there is no Highlight to offer. A passage is found by its
     words with the spaces and the dash's word joiner left out, so a passage
     whose words have since changed is no longer marked but stays in the
     drawer. */

  var MARK = 'olae-kept';
  var IGNORED = /[\s⁠­​]/;
  var marks = [];
  var markTimer = 0;

  function canMark() {
    return !!(window.CSS && CSS.highlights && typeof window.Highlight === 'function');
  }

  function flatten(holder) {
    var flat = { text: '', nodes: [], offsets: [] };
    var chars = [];
    var walker = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT);
    for (var node = walker.nextNode(); node; node = walker.nextNode()) {
      var parent = node.parentElement;
      if (parent && parent.closest('script, style')) continue;
      var data = node.data;
      for (var i = 0; i < data.length; i++) {
        var c = data.charAt(i);
        if (IGNORED.test(c)) continue;
        chars.push(c);
        flat.nodes.push(node);
        flat.offsets.push(i);
      }
    }
    flat.text = chars.join('');
    return flat;
  }

  function rangeIn(flat, quote) {
    var needle = String(quote).split('').filter(function (c) { return !IGNORED.test(c); }).join('');
    if (needle.length < 4) return null;
    var at = flat.text.indexOf(needle);
    if (at < 0) return null;
    var end = at + needle.length - 1;
    var range = document.createRange();
    range.setStart(flat.nodes[at], flat.offsets[at]);
    range.setEnd(flat.nodes[end], flat.offsets[end] + 1);
    return range;
  }

  function onThisPage(item) {
    return item.id.indexOf('text-') === 0 && item.quote && item.href.split('#')[0] === location.pathname;
  }

  function marksShown() { return read().marks !== false; }
  function setMarks(on) {
    update(function (state) {
      if (on) delete state.marks;
      else state.marks = false;
    });
  }

  function paintMarks() {
    marks = [];
    var kept = marksShown() ? read().kept.filter(function (item) { return item.mark === true && onThisPage(item); }) : [];
    if (kept.length) {
      var flats = Array.prototype.map.call(document.querySelectorAll('[data-keep-passage]'), flatten);
      kept.forEach(function (item) {
        for (var i = 0; i < flats.length; i++) {
          var range = rangeIn(flats[i], item.quote);
          if (range) { marks.push({ id: item.id, range: range }); return; }
        }
      });
    }
    if (!canMark()) return;
    if (!marks.length) { CSS.highlights.delete(MARK); return; }
    var highlight = new window.Highlight();
    marks.forEach(function (mark) { highlight.add(mark.range); });
    CSS.highlights.set(MARK, highlight);
  }

  /* The mark under a point, and the line of it that was touched. */
  function markAt(x, y) {
    var hit = null;
    marks.forEach(function (mark) {
      if (mark.range.collapsed || !mark.range.getClientRects) return;
      var rects = mark.range.getClientRects();
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { hit = { mark: mark, line: r }; return; }
      }
    });
    return hit;
  }

  /* The highlights a selection touches, so Highlight can clear them. */
  function overlaps(a, b) {
    try {
      return a.compareBoundaryPoints(Range.START_TO_END, b) > 0 && a.compareBoundaryPoints(Range.END_TO_START, b) < 0;
    } catch (e) { return false; }
  }
  function marksIn(range) {
    return marks.filter(function (mark) { return !mark.range.collapsed && overlaps(mark.range, range); });
  }
  function isHighlighted(range) { return !!range && marksIn(range).length > 0; }

  function watchMarks() {
    if (!canMark()) return;
    paintMarks();
    listeners.push(paintMarks);
    // Puzzle mode and Guess the word lift paragraphs out and put them back;
    // the marks are found again once the page has settled.
    if (window.MutationObserver) {
      var watcher = new MutationObserver(function () {
        clearTimeout(markTimer);
        markTimer = setTimeout(paintMarks, 200);
      });
      document.querySelectorAll('[data-keep-passage]').forEach(function (holder) {
        watcher.observe(holder, { childList: true, subtree: true, characterData: true });
      });
    }
    var touch = 0;
    document.addEventListener('click', function (event) {
      if (!marks.length || event.defaultPrevented || event.button) return;
      var target = event.target;
      if (!target.closest || !target.closest('[data-keep-passage]')) return;
      if (target.closest('a, button, input, textarea, select, summary, label')) return;
      var hit = markAt(event.clientX, event.clientY);
      if (!hit) return;
      var near = { x: event.clientX, top: hit.line.top, bottom: hit.line.bottom };
      // A second click selects a word for the translation prompt; wait to
      // see whether one comes.
      clearTimeout(touch);
      touch = setTimeout(function () {
        var selection = window.getSelection();
        if (selection && !selection.isCollapsed) return;
        openPanel(hit.mark.id, 'touched', null, near);
      }, 260);
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
    backup: backup,
    restoreBackup: restoreBackup,
    clean: clean,
    textId: textId,
    sync: sync,
    find: find,
    setNote: setNote,
    plain: plain,
    noteEditor: noteEditor,
    passageFor: passageFor,
    keepPassage: keepPassage,
    notePassage: notePassage,
    highlight: highlight,
    unhighlight: unhighlight,
    highlightSelection: highlightSelection,
    isHighlighted: isHighlighted,
    canHighlight: canMark,
    openPanel: openPanel,
    marksShown: marksShown,
    setMarks: setMarks,
    works: function () { return works; },
    subscribe: function (fn) { listeners.push(fn); }
  };

  function start() {
    // .keep-js marks what is only worth showing once this script runs.
    document.documentElement.classList.add('keep-ready');
    sync();
    if (document.querySelector('[data-keep-passage]') && window.getSelection && !document.querySelector('.reader-translate')) ownPrompt();
    if (document.querySelector('[data-keep-passage]')) {
      watchMarks();
      document.addEventListener('selectionchange', function () {
        if (toastBox && !toastBox.hidden && selectingPassage()) toastBox.hidden = true;
      });
    }
  }
  // After every deferred script, so the translation prompt, if the page has
  // one, is already there to be found.
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
