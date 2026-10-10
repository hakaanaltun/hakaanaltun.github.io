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
     prompt, and js/reader-translate.js puts a Keep button beside Türkçe
     through passageFor(); anywhere else a small prompt of our own appears.
     Either way the passage is then marked on the page, and a panel offers
     a note. */

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
    // The selection goes, so the mark it leaves is what the reader sees.
    var selection = window.getSelection && window.getSelection();
    if (selection && !selection.isCollapsed && selection.anchorNode && selection.anchorNode.parentElement &&
        selection.anchorNode.parentElement.closest('[data-keep-passage]')) selection.removeAllRanges();
    openPanel(item.id, already ? 'already' : 'kept', from);
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

  /* --- A note ------------------------------------------------------------
     The same small editor serves a passage on its page and anything in the
     drawer. It saves as the reader writes, so nothing waits on a button;
     Done closes it. For a reader who wants to write at length, Copy takes
     the note with what was kept and its address, and The Page (/write/)
     is beside it to paste them into. */

  var editors = 0;
  var flushes = [];
  function flushNotes() { flushes.forEach(function (fn) { fn(); }); }

  function noteEditor(id, options) {
    options = options || {};
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
    var kept = find(id);
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
    done.textContent = 'Done';
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
    hint.textContent = works
      ? 'Your note stays in this browser with what you kept. To write at length, copy both and paste them on The Page.'
      : 'This browser cannot save your note. Copy it before you leave.';
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
    flushes.push(save);
    copy.addEventListener('click', function () {
      save();
      var item = (options.describe && options.describe()) || find(id);
      if (!item) { said.textContent = 'This is no longer in your drawer.'; return; }
      var words = plain(Object.assign({}, item, { note: noteText(area.value) }));
      copyText(words).then(function () {
        said.textContent = 'Copied, with its link.';
      }, function () {
        said.textContent = 'This browser would not copy it. Select your note and copy it by hand.';
      });
    });
    function finish() {
      save();
      flushes = flushes.filter(function (fn) { return fn !== save; });
      if (!gone) setNote(id, area.value);
      if (options.onDone) options.onDone(noteText(area.value));
    }
    done.addEventListener('click', finish);
    box.focusNote = function () { area.focus(); };
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

  /* --- The panel under a kept passage ------------------------------------
     Keeping a passage, or touching one already kept, opens a small panel
     at the foot of the window: what happened, a note, and a way to take the
     passage out again. A note is the reader's own writing, so taking out a
     passage that has one asks a second time. */

  var panel = null;
  var panelId = '';
  var panelTimer = 0;
  var panelFrom = null;

  function buildPanel() {
    panel = document.createElement('section');
    panel.className = 'keep-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'A kept passage');
    var head = document.createElement('div');
    head.className = 'keep-panel-head';
    var said = document.createElement('p');
    said.className = 'keep-panel-said';
    said.setAttribute('role', 'status');
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'keep-panel-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    head.appendChild(said);
    head.appendChild(close);
    var row = document.createElement('div');
    row.className = 'keep-panel-actions';
    var noteButton = document.createElement('button');
    noteButton.type = 'button';
    noteButton.setAttribute('data-panel-note', '');
    var out = document.createElement('button');
    out.type = 'button';
    out.setAttribute('data-panel-out', '');
    var drawer = document.createElement('a');
    drawer.href = '/house/#drawer';
    drawer.textContent = 'Open your drawer →';
    row.appendChild(noteButton);
    row.appendChild(out);
    row.appendChild(drawer);
    panel.appendChild(head);
    panel.appendChild(row);
    document.body.appendChild(panel);

    close.addEventListener('click', function () { closePanel(true); });
    noteButton.addEventListener('click', function () { showEditor(true); });
    out.addEventListener('click', function () {
      var editor = panel.querySelector('.keep-note');
      if (editor) editor.save();
      var item = find(panelId);
      if (!item) { closePanel(true); return; }
      if (item.note && out.getAttribute('data-armed') !== 'true') {
        out.setAttribute('data-armed', 'true');
        out.textContent = 'Take it out with the note';
        said.textContent = 'Your note would go with it.';
        return;
      }
      if (editor) { flushes = flushes.filter(function (fn) { return fn !== editor.save; }); editor.remove(); }
      remove(panelId);
      said.textContent = 'Taken out of your drawer.';
      row.hidden = true;
      close.focus();
      hideLater(4000);
    });
    out.addEventListener('blur', disarm);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) closePanel(true);
    });
    document.addEventListener('pointerdown', function (event) {
      if (panel.hidden || panel.contains(event.target)) return;
      if (!panel.querySelector('.keep-note')) closePanel(false);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', placePanel);
      window.visualViewport.addEventListener('scroll', placePanel);
    }
  }

  function disarm() {
    var out = panel && panel.querySelector('[data-panel-out]');
    if (!out) return;
    out.removeAttribute('data-armed');
    out.textContent = 'Take out';
  }

  /* On a phone the keyboard rises over the foot of the window; the panel
     rises with it, so the note being written stays in view. */
  function placePanel() {
    if (!panel || panel.hidden) return;
    var view = window.visualViewport;
    var lift = view ? Math.max(0, window.innerHeight - view.height - view.offsetTop) : 0;
    panel.style.bottom = lift > 40 ? (lift + 10) + 'px' : '';
    panel.style.maxHeight = view ? Math.max(160, view.height - 28) + 'px' : '';
  }

  function hideLater(wait) {
    clearTimeout(panelTimer);
    panelTimer = setTimeout(function check() {
      if (!panel || panel.hidden) return;
      if (panel.querySelector('.keep-note') || panel.matches(':focus-within, :hover')) {
        panelTimer = setTimeout(check, 2000);
        return;
      }
      closePanel(false);
    }, wait);
  }

  function showEditor(focus) {
    var item = find(panelId);
    if (!item) return;
    var old = panel.querySelector('.keep-note');
    if (old) { if (focus) old.focusNote(); return; }
    var editor = noteEditor(panelId, {
      onDone: function (words) {
        editor.remove();
        var said = panel.querySelector('.keep-panel-said');
        said.textContent = words ? 'Your note is in your drawer.' : 'In your drawer, without a note.';
        labelPanel();
        panel.querySelector('[data-panel-note]').focus();
        hideLater(5000);
      }
    });
    panel.querySelector('.keep-panel-actions').before(editor);
    panel.querySelector('[data-panel-note]').hidden = true;
    clearTimeout(panelTimer);
    placePanel();
    if (focus) editor.focusNote();
  }

  function labelPanel() {
    var item = find(panelId);
    var noteButton = panel.querySelector('[data-panel-note]');
    noteButton.hidden = false;
    noteButton.textContent = item && item.note ? 'Your note' : 'Add a note';
    disarm();
    panel.querySelector('.keep-panel-actions a').hidden = !works || location.pathname === '/house/';
  }

  /* how: 'kept' just now, 'already' kept before, or 'touched' on the page. */
  function openPanel(id, how, from) {
    var item = find(id);
    if (!item) return;
    if (!panel) buildPanel();
    var editor = panel.querySelector('.keep-note');
    if (editor) { editor.save(); flushes = flushes.filter(function (fn) { return fn !== editor.save; }); editor.remove(); }
    if (toastBox) toastBox.hidden = true;
    panelId = id;
    panelFrom = from && from.isConnected !== false ? from : null;
    panel.querySelector('.keep-panel-actions').hidden = false;
    var said = how === 'kept' ? saidOnKeep(true).text : how === 'already' ? 'Already in your drawer.' : 'In your drawer.';
    if (!works && how !== 'kept') said += ' This browser cannot save it, so it stays only until you leave the page.';
    panel.querySelector('.keep-panel-said').textContent = said;
    labelPanel();
    panel.hidden = false;
    placePanel();
    // A note is what a reader touches a kept passage to find, so it opens
    // with the panel, unfocused, so a phone's keyboard stays down.
    if (item.note && how !== 'kept') showEditor(false);
    else hideLater(8000);
  }

  function closePanel(restore) {
    if (!panel || panel.hidden) return;
    clearTimeout(panelTimer);
    var editor = panel.querySelector('.keep-note');
    if (editor) { editor.save(); flushes = flushes.filter(function (fn) { return fn !== editor.save; }); editor.remove(); }
    var hadFocus = panel.matches(':focus-within');
    panel.hidden = true;
    panelId = '';
    if (restore && hadFocus && panelFrom && panelFrom.isConnected && !panelFrom.closest('[hidden]')) panelFrom.focus({ preventScroll: true });
  }

  window.addEventListener('pagehide', flushNotes);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flushNotes(); });

  /* --- Marks on the page -------------------------------------------------
     A passage kept from this page is marked where it stands, for this
     reader only. The marks are drawn with the CSS Custom Highlight API, so
     the page's own text is never wrapped or changed, and where a browser
     lacks it nothing is marked. A passage is found by its words with the
     spaces and the dash's word joiner left out, so a passage whose words
     have since changed is no longer marked but stays in the drawer. */

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

  function paintMarks() {
    marks = [];
    var kept = read().kept.filter(onThisPage);
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

  function markAt(x, y) {
    var hit = null;
    marks.forEach(function (mark) {
      if (mark.range.collapsed || !mark.range.getClientRects) return;
      var rects = mark.range.getClientRects();
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { hit = mark; return; }
      }
    });
    return hit;
  }

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
      var mark = markAt(event.clientX, event.clientY);
      if (!mark) return;
      // A second click selects a word for the translation prompt; wait to
      // see whether one comes.
      clearTimeout(touch);
      touch = setTimeout(function () {
        var selection = window.getSelection();
        if (selection && !selection.isCollapsed) return;
        openPanel(mark.id, 'touched', null);
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
    openPanel: openPanel,
    works: function () { return works; },
    subscribe: function (fn) { listeners.push(fn); }
  };

  function start() {
    // .keep-js marks what is only worth showing once this script runs.
    document.documentElement.classList.add('keep-ready');
    sync();
    if (document.querySelector('[data-keep-passage]') && window.getSelection && !document.querySelector('.reader-translate')) ownPrompt();
    if (document.querySelector('[data-keep-passage]')) watchMarks();
  }
  // After every deferred script, so the translation prompt, if the page has
  // one, is already there to be found.
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
