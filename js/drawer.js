/* The drawer: what a reader keeps, laid out to be read, changed, taken
   away or put back. What it holds belongs to js/keep.js; this shows it.

   It opens in The House, in the box the study's things open in, and over
   any other page from the site's menu and its footer, in a box of its own
   that closes back to the page (open() below). Both are the same drawer:
   the House hands render() its own box and its ways back, and every other
   page gets the box this script makes.

   A kept thing shows its current words where the House's catalog still
   knows it (/house/catalog.json), and what was kept where it does not. */
(function () {
  'use strict';
  var KEEP = window.OLAE_KEEP;
  if (!KEEP) return;

  /* The drawer being shown: its box, the dialog round it, the way back,
     and how it says what it has done. */
  var here = { box: null, dialog: null, back: null, current: function (item) { return item; }, announce: function () {} };
  function current(item) { return here.current(item); }
  function announce(message) { here.announce(message); }

  /* --- The House's catalog ---------------------------------------------- */

  function lineItem(line) {
    return {
      id: KEEP.textId(line.text),
      kind: line.book ? 'The Fragments' : line.fiction ? 'A story' : 'An essay',
      title: line.source,
      quote: line.text,
      href: line.url
    };
  }
  function wordItem(w) { return { id: w.id, kind: 'A word', title: w.word, quote: w.description, href: w.url }; }
  function questionItem(q) { return { id: q.id, kind: q.quiz, title: q.question, quote: q.note, href: q.url }; }
  function indexOf(catalog) {
    var index = Object.create(null);
    catalog.words.forEach(function (w) { index[w.id] = wordItem(w); });
    catalog.questions.forEach(function (q) { index[q.id] = questionItem(q); });
    catalog.lines.forEach(function (l) { var item = lineItem(l); index[item.id] = item; });
    return index;
  }
  /* A kept thing shows its current words where the catalog still knows it,
     and what was kept where it does not. Only the words are taken: the kind
     a reader kept it under stays, and so do the reader's note and
     highlight. */
  function currentIn(index, item) {
    var known = index[item.id];
    if (!known) return item;
    return { id: item.id, kind: item.kind || known.kind, title: known.title, quote: known.quote || item.quote, href: known.href, at: item.at, note: item.note, mark: item.mark, keep: item.keep };
  }

  /* --- Small builders ---------------------------------------------------- */

  /* The build keeps a closed-up dash from opening a line on the published
     page (_plugins/dash_join.rb); text set here is out of its reach, so the
     same word joiner goes in as it is shown. What is kept stays plain. */
  function joinDashes(text) { return String(text).replace(/([^\s⁠])—/g, '$1⁠—'); }
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = joinDashes(text);
    return node;
  }
  function actions(href, linkText) {
    var row = element('div', 'house-item-actions');
    var link = element('a', '', linkText);
    link.href = href;
    row.appendChild(link);
    return row;
  }
  /* The day as İstanbul has it, where the House is, for the dates on what
     is taken away. */
  function today() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).forEach(function (part) { p[part.type] = part.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }
  function longDate(value) {
    var p = String(value).split('-');
    if (p.length !== 3) return value;
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])));
  }

  /* --- What is in it ------------------------------------------------------ */

  function storageNote() {
    return KEEP.works()
      ? 'Kept in this browser, and nowhere else. You can put things here from anywhere on the site. Clearing your browser’s data empties it.'
      : 'This browser cannot save your drawer. What you put here stays until you leave the page.';
  }

  /* The way from a kept thing back into its instrument, which puts it
     there (js/tool-drawer.js). The v loads the instrument as it is now
     rather than a service worker's older copy. */
  var BACK_TO = 'v=20261013-1';
  function backInto(item) {
    var work = KEEP.WORKS[KEEP.workOf(item.id)];
    if (!work || work.slug === 'draw') return null;
    var link = element('a', '', work.slug === 'write' ? 'Continue on The\u00a0Page\u00a0→' : 'Open in ' + work.kind.replace(' ', '\u00a0') + '\u00a0→');
    link.href = '/' + work.slug + '/?from=drawer&open=' + encodeURIComponent(item.id) + '&' + BACK_TO;
    return link;
  }

  /* A page, a script, a list or a comparison shows its opening, and the
     whole of it a touch away. It is the reader's own, kept line for line. */
  var OPENING = { chars: 360, lines: 6 };
  var COUNTED = { page: true, script: true, clean: true };
  function showText(article, item) {
    var work = KEEP.workOf(item.id);
    var text = (item.text || '').replace(/\s+$/, '');
    var lines = text.split('\n');
    // Whole lines while they fit; a first line too long for the opening is
    // cut at a word, and only then does it end in an ellipsis.
    var opening = '';
    var cut = false;
    for (var i = 0; i < lines.length && i < OPENING.lines; i++) {
      var next = i ? opening + '\n' + lines[i] : lines[i];
      if (next.length > OPENING.chars) {
        if (!opening.trim()) {
          var at = lines[i].lastIndexOf(' ', OPENING.chars);
          opening = lines[i].slice(0, at > OPENING.chars / 2 ? at : OPENING.chars);
          cut = true;
        }
        break;
      }
      opening = next;
    }
    opening = opening.replace(/\s+$/, '');
    var whole = opening.length >= text.length;
    var first = element('p', 'house-page-text', whole ? text : cut ? opening + '…' : opening);
    article.appendChild(first);
    if (!whole) {
      var details = element('details', 'house-page-whole');
      details.appendChild(element('summary', '', 'The whole ' + KEEP.WORKS[work].noun));
      details.appendChild(element('p', 'house-page-text', text));
      details.addEventListener('toggle', function () { first.hidden = details.open; });
      article.appendChild(details);
    }
    if (!COUNTED[work]) return;
    var count = (text.match(/\S+/g) || []).length;
    article.appendChild(element('p', 'house-page-count', count === 1 ? '1 word' : count.toLocaleString('en-GB') + ' words'));
  }

  /* A drawing from The Draw is a picture in this browser's IndexedDB
     (js/keep.js). It is fetched once while the House is open, and kept
     here for the drawer, its download and the printed drawer; a drawing
     kept again is fetched afresh, and one not found is looked for again
     the next time. */
  var pictures = {};
  function pictureOf(item) {
    var known = pictures[item.id];
    if (known && known.at === item.at) return known.ready;
    if (known && known.url) URL.revokeObjectURL(known.url);
    var entry = { at: item.at, blob: null, url: '' };
    function missing() {
      if (pictures[item.id] === entry) delete pictures[item.id];
      return null;
    }
    entry.ready = KEEP.files.get(item.id).then(function (blob) {
      if (!blob) return missing();
      entry.blob = blob;
      entry.url = URL.createObjectURL(blob);
      return entry;
    }, missing);
    pictures[item.id] = entry;
    return entry.ready;
  }
  function showDrawing(article, item) {
    var frame = element('div', 'house-drawing');
    article.appendChild(frame);
    pictureOf(item).then(function (entry) {
      if (!entry) {
        frame.appendChild(element('p', 'house-drawer-note', 'The picture is no longer in this browser.'));
        return;
      }
      var image = element('img');
      image.alt = 'Your drawing';
      image.src = entry.url;
      frame.appendChild(image);
    });
  }

  var tidied = false;
  function renderDrawer(box) {
    var kept = KEEP.read().kept.map(current).reverse();
    // The way back to where the drawer was opened from, when there is one.
    if (here.back) box.appendChild(here.back);
    // A picture whose drawing has left the drawer goes too, once a visit.
    if (!tidied) {
      tidied = true;
      KEEP.files.tidy().catch(function () {});
    }
    box.appendChild(element('p', 'house-drawer-note', storageNote()));
    /* Only what can be done: an empty drawer has nothing to download, and a
       browser that cannot keep the drawer cannot take a restored one. */
    if (!kept.length) {
      var empty = element('div', 'house-empty-drawer');
      empty.appendChild(element('p', '', 'Nothing here yet. Pick up a word card, read a line from the bookshelf, try the question on the wall, or write in the notebook on the balcony. On a word’s page, after a quiz answer, or when you select a line in an essay or the book, there is a way to keep it too. What you write, draw or make on the instruments can be kept here as well.'));
      box.appendChild(empty);
    }
    var choices = kept.length ? [['backup', 'Download your drawer']] : [];
    if (KEEP.works()) choices.push(['restore', 'Restore your drawer']);
    if (kept.length) choices.push(['text', 'Download as text']);
    // Opened from an iPhone's or iPad's Home Screen, the house cannot print.
    if (kept.length && !(window.navigator.standalone === true && navigator.maxTouchPoints > 0)) choices.push(['print', 'Print or save as PDF']);
    if (!choices.length) return;
    var tools = element('div', 'house-drawer-tools');
    choices.forEach(function (pair) {
      var button = element('button', '', pair[1]);
      button.type = 'button';
      button.setAttribute('data-export', pair[0]);
      tools.appendChild(button);
    });
    var file = element('input');
    file.type = 'file';
    file.accept = '.json,application/json';
    file.hidden = true;
    file.setAttribute('data-drawer-file', '');
    file.setAttribute('aria-label', 'Choose a drawer backup');
    file.addEventListener('change', function () { restoreDrawer(file.files && file.files[0]); });
    tools.appendChild(file);
    box.appendChild(tools);
    if (!kept.length) {
      box.appendChild(element('p', 'house-drawer-note', 'If you downloaded your drawer in another browser, you can restore it here.'));
      return;
    }
    box.appendChild(element('p', 'house-drawer-note', 'Download a backup to keep or move to another browser.' + (KEEP.works() ? ' Restoring adds its contents to your drawer.' : '')));
    // Highlights are shown on their pages for the reader who made them;
    // they can be hidden here or from the box by a highlight.
    if (kept.some(function (item) { return item.mark; }) || !KEEP.marksShown()) {
      var shown = KEEP.marksShown();
      var marks = element('p', 'house-drawer-marks', shown ? 'Your highlights are shown on their pages.' : 'Your highlights are hidden on their pages.');
      var toggle = element('button', '', shown ? 'Hide them' : 'Show them');
      toggle.type = 'button';
      toggle.setAttribute('data-marks', '');
      marks.appendChild(document.createTextNode(' '));
      marks.appendChild(toggle);
      box.appendChild(marks);
    }
    kept.forEach(function (item) {
      var article = element('article', 'house-item');
      var work = KEEP.workOf(item.id);
      article.appendChild(element('p', 'house-item-kind', item.mark ? [item.kind, 'Highlighted'].filter(Boolean).join(' · ') : item.kind));
      article.appendChild(element('h3', item.id.indexOf('word-') === 0 ? 'is-word' : '', item.title));
      if (work === 'drawing') showDrawing(article, item);
      else if (work) showText(article, item);
      if (item.quote) article.appendChild(element(item.id.indexOf('text-') === 0 ? 'blockquote' : 'p', '', item.quote));
      if (work) {
        // Something made on an instrument is the reader's own work: it is
        // taken away as text or as the PNG The Draw gives, it can go back
        // into its instrument, and it has no note and no card.
        var taken = element('div', 'house-item-actions');
        var back = backInto(item);
        if (back) taken.appendChild(back);
        var take = element('button', '', work === 'drawing' ? 'Download as PNG' : 'Download as text');
        take.type = 'button';
        take.setAttribute('data-take', item.id);
        taken.appendChild(take);
        var out = element('button', '', 'Remove');
        out.type = 'button';
        out.setAttribute('data-remove', item.id);
        out.setAttribute('aria-label', 'Remove ' + item.title + ' from your drawer');
        taken.appendChild(out);
        article.appendChild(taken);
        box.appendChild(article);
        return;
      }
      if (item.note) {
        var noted = element('div', 'house-item-note');
        noted.appendChild(element('p', 'house-item-kind', 'Your note'));
        noted.appendChild(element('p', 'house-note-text', item.note));
        article.appendChild(noted);
      }
      // A note from the balcony's notebook belongs to the balcony, and a
      // passage from The Reader to the reader's own file.
      var fromNotebook = item.id.indexOf('notebook-') === 0;
      var fromReader = KEEP.fromReader(item);
      var row = actions(fromReader ? '/read/?from=drawer&' + BACK_TO : item.href, fromNotebook ? 'Go to the balcony →' : fromReader ? 'Open The Reader →' : 'Go to the page →');
      var write = element('button', '', item.note ? 'Edit the note' : 'Add a note');
      write.type = 'button';
      write.setAttribute('data-note', item.id);
      row.appendChild(write);
      // The card is for sending, so it carries what was kept and never the
      // note. A page from the notebook is all note, so it has no card.
      if (!fromNotebook && !fromReader) {
        var share = element('button', '', 'Share as a card');
        share.type = 'button';
        share.setAttribute('data-share', item.id);
        row.appendChild(share);
      }
      var remove = element('button', '', 'Remove');
      remove.type = 'button';
      remove.setAttribute('data-remove', item.id);
      remove.setAttribute('aria-label', 'Remove ' + item.title + ' from your drawer');
      row.appendChild(remove);
      article.appendChild(row);
      box.appendChild(article);
    });
  }

  /* --- Taking things out of the drawer ---------------------------------- */

  function download(blob, name) {
    if (!window.URL || !URL.createObjectURL) return false;
    var url = URL.createObjectURL(blob);
    var link = element('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return true;
  }

  function quoted(item) { return item.id.indexOf('text-') === 0 ? '“' + item.quote + '”' : item.quote; }

  function exportText() {
    var lines = ['Your drawer', 'On Life & Everything · hakanaltun.io', 'Saved ' + longDate(today()), ''];
    KEEP.read().kept.map(current).forEach(function (item) {
      lines.push(KEEP.plain(item), '');
    });
    var saved = download(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), 'your-drawer.txt');
    announce(saved ? 'Your drawer is saved to your downloads as a text file.' : 'This browser cannot save a file from here.');
  }

  /* A page or a drawing kept from an instrument is taken away as the
     instrument gives it: a page as text, a drawing as its PNG, each named
     after the day it was kept. */
  function takeWork(id) {
    var item = KEEP.find(id);
    if (!item) return;
    var day = new Date(item.at || Date.now()).toISOString().slice(0, 10);
    var work = KEEP.workOf(id);
    if (work !== 'drawing') {
      var saved = download(new Blob([item.text || ''], { type: 'text/plain;charset=utf-8' }), work + '-' + day + '.txt');
      announce(saved ? 'The ' + KEEP.WORKS[work].noun + ' is saved to your downloads as a text file.' : 'This browser cannot save a file from here.');
      return;
    }
    pictureOf(item).then(function (entry) {
      if (!entry) { announce('The picture is no longer in this browser.'); return; }
      announce(download(entry.blob, 'draw-' + day + '.png') ? 'The drawing is saved to your downloads.' : 'This browser cannot save a file from here.');
    });
  }

  /* The backup carries each drawing's picture beside its record, so a
     drawer moved to another browser takes its drawings with it. */
  function asDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(blob);
    });
  }
  function fromDataUrl(value) {
    var m = /^data:(image\/png);base64,([A-Za-z0-9+\/=]+)$/.exec(typeof value === 'string' ? value : '');
    if (!m) return null;
    var bytes = atob(m[2]);
    var data = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) data[i] = bytes.charCodeAt(i);
    return new Blob([data], { type: m[1] });
  }
  function exportBackup() {
    var value = KEEP.backup();
    var drawings = value.items.filter(function (item) { return KEEP.workOf(item.id) === 'drawing'; });
    var gathered = drawings.map(function (item) {
      return pictureOf(item).then(function (entry) {
        return entry ? asDataUrl(entry.blob).then(function (url) { return [item.id, url]; }) : null;
      }).catch(function () { return null; });
    });
    Promise.all(gathered).then(function (pairs) {
      pairs = pairs.filter(Boolean);
      if (pairs.length) {
        value.pictures = {};
        pairs.forEach(function (pair) { value.pictures[pair[0]] = pair[1]; });
      }
      var saved = download(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' }), 'your-drawer.json');
      announce(saved ? 'Your drawer backup is saved to your downloads.' : 'This browser cannot save a file from here.');
    });
  }
  /* Pictures go in before their records, so a restored drawing is never
     shown without one. A picture already here is left alone, as a note
     already here is. */
  function restorePictures(value) {
    var given = value && value.pictures && typeof value.pictures === 'object' ? value.pictures : null;
    if (!given || !Array.isArray(value.items)) return Promise.resolve();
    var here = {};
    KEEP.read().kept.forEach(function (item) { here[item.id] = true; });
    return Promise.all(value.items.map(function (item) {
      var id = item && typeof item.id === 'string' ? item.id : '';
      if (KEEP.workOf(id) !== 'drawing' || !Object.prototype.hasOwnProperty.call(given, id)) return null;
      var blob = fromDataUrl(given[id]);
      if (!blob) return null;
      return KEEP.files.get(id).then(function (known) {
        if (!known || !here[id]) return KEEP.files.put(id, blob);
      }).catch(function () {});
    }));
  }
  function restoreDrawer(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { announce('This backup is too large to restore.'); return; }
    announce('Reading your drawer backup…');
    var reader = new FileReader();
    reader.onerror = function () { announce('This file could not be read. Your drawer is unchanged.'); };
    reader.onload = function () {
      function finish(e) {
        if (e) {
          announce(e && /QuotaExceeded|Security/.test(e.name)
            ? 'This browser could not save the restored items. Your drawer is unchanged.'
            : 'This is not a valid drawer backup. Your drawer is unchanged.');
        }
        var input = here.box && here.box.querySelector('[data-drawer-file]');
        if (input) input.value = '';
      }
      var value;
      try { value = JSON.parse(reader.result); } catch (e) { finish(e); return; }
      restorePictures(value).then(function () {
        try {
          var added = KEEP.restoreBackup(value);
          // A restore re-renders the dialog, so focus its new restore button.
          var button = here.box && here.box.querySelector('[data-export="restore"]');
          if (button) button.focus({ preventScroll: true });
          announce(restored(added));
          finish(null);
        } catch (e) { finish(e); }
      });
    };
    reader.readAsText(file);
  }

  function restored(added) {
    var items = added.items ? added.items + (added.items === 1 ? ' item' : ' items') : '';
    var notes = added.notes ? added.notes + (added.notes === 1 ? ' note' : ' notes') : '';
    if (!items && !notes) return 'Everything in this backup is already in your drawer.';
    return [items, notes].filter(Boolean).join(' and ') + ' added to your drawer.';
  }

  function printDrawer() {
    var old = document.querySelector('.house-print');
    if (old) old.remove();
    var sheet = element('section', 'house-print');
    sheet.appendChild(element('h1', '', 'Your drawer'));
    var from = element('p', 'house-print-from', 'On Life ');
    from.appendChild(element('span', 'amp', '&'));
    from.appendChild(document.createTextNode(' Everything · hakanaltun.io · ' + longDate(today())));
    sheet.appendChild(from);
    KEEP.read().kept.map(current).forEach(function (item) {
      var work = KEEP.workOf(item.id);
      var article = element('article', work && work !== 'drawing' ? 'is-page' : '');
      article.appendChild(element('p', 'house-item-kind', item.kind));
      article.appendChild(element('h2', item.id.indexOf('word-') === 0 ? 'is-word' : '', item.title));
      if (item.text) article.appendChild(element('p', 'house-print-page', item.text));
      // A drawing prints as the drawer shows it; one not fetched yet prints
      // by its name.
      var picture = work === 'drawing' && pictures[item.id];
      if (picture && picture.url) {
        var image = element('img', 'house-print-drawing');
        image.alt = 'Your drawing';
        image.src = picture.url;
        article.appendChild(image);
      }
      if (item.quote) article.appendChild(element('p', '', quoted(item)));
      if (item.note) {
        article.appendChild(element('p', 'house-item-kind', 'Your note'));
        article.appendChild(element('p', 'house-print-note', item.note));
      }
      if (!work && !KEEP.fromReader(item)) article.appendChild(element('p', 'house-print-address', location.host + item.href));
      sheet.appendChild(article);
    });
    document.body.appendChild(sheet);
    document.documentElement.classList.add('house-printing');
    window.addEventListener('afterprint', function done() {
      document.documentElement.classList.remove('house-printing');
      window.removeEventListener('afterprint', done);
    });
    // A modal dialog prints over the page, so the drawer closes first.
    if (here.dialog && here.dialog.open) here.dialog.close();
    if (typeof window.print === 'function') window.print();
  }

  /* A card for one kept thing, to send or save as a picture. The paper, ink
     and type are the site's, set down in the light palette whatever the
     page is showing. */
  function wrap(ctx, words, width) {
    var lines = [];
    var line = '';
    words.split(/\s+/).forEach(function (word) {
      var next = line ? line + ' ' + word : word;
      if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next;
    });
    if (line) lines.push(line);
    return lines;
  }
  function drawCard(item) {
    var W = 1080, H = 1350, M = 112;
    var canvas = element('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx || !canvas.toBlob) return Promise.reject(new Error('no canvas'));
    var fonts = document.fonts && document.fonts.load ? Promise.all([
      document.fonts.load('500 64px "Cormorant Garamond"'),
      document.fonts.load('italic 500 64px "Cormorant Garamond"'),
      document.fonts.load('400 40px "EB Garamond"')
    ]).catch(function () {}) : Promise.resolve();
    return fonts.then(function () {
      var width = W - 2 * M;
      ctx.fillStyle = '#FDFCF8';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#D6CDB6';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, W - 96, H - 96);
      var y = M + 44;
      ctx.fillStyle = '#6D665B';
      ctx.font = '400 28px "EB Garamond", Georgia, serif';
      // The site's address stands across from the kind, like a letterhead:
      // the name alone does not find the site in a search. A kind too long
      // to share the line sends it under the words instead.
      if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
      var kind = (item.kind || '').toUpperCase();
      ctx.fillText(kind, M, y);
      var aside = ctx.measureText(kind).width + 48 + ctx.measureText('HAKANALTUN.IO').width <= width;
      if (aside) {
        ctx.textAlign = 'right';
        ctx.fillText('HAKANALTUN.IO', W - M, y);
        ctx.textAlign = 'left';
      }
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      var word = item.id.indexOf('word-') === 0;
      // A long question steps down in size until it fits in four lines,
      // so it is read to its end. Only a title too long even then is cut,
      // and the cut is marked.
      var size = word ? 104 : 62;
      var floor = word ? 72 : 44;
      var heading = [];
      for (;;) {
        ctx.font = (word ? 'italic ' : '') + '500 ' + size + 'px "Cormorant Garamond", Georgia, serif';
        heading = wrap(ctx, item.title, width);
        if (heading.length <= 4 || size <= floor) break;
        size -= 2;
      }
      if (heading.length > 4) { heading = heading.slice(0, 4); heading[3] = heading[3].replace(/\s*\S*$/, '') + ' …'; }
      ctx.fillStyle = '#262320';
      y += size * 1.35;
      heading.forEach(function (line) { ctx.fillText(line, M, y); y += size * 1.12; });
      y += 34;
      // The words take the largest size that fits, and sit in the middle
      // of the room left for them, so a short line is not lost at the top.
      var bottom = H - M - 160;
      var body = item.quote ? quoted(item) : '';
      var face = item.id.indexOf('text-') === 0 ? 'italic 400 ' : '400 ';
      var fit = 60;
      var lines = [];
      var under = 0;
      for (;;) {
        ctx.font = face + fit + 'px "EB Garamond", Georgia, serif';
        lines = wrap(ctx, body, width);
        under = aside ? 0 : Math.round(fit * 0.75) + 36;
        if (y + lines.length * fit * 1.5 + under <= bottom || fit <= 28) break;
        fit -= 2;
      }
      var room = Math.max(0, Math.floor((bottom - under - y) / (fit * 1.5)));
      if (lines.length > room) { lines = lines.slice(0, room); if (room) lines[room - 1] = lines[room - 1].replace(/\s*\S*$/, '') + ' …'; }
      y += Math.max(0, (bottom - y - lines.length * fit * 1.5 - under) / 2);
      ctx.fillStyle = '#3A342C';
      lines.forEach(function (line) { y += fit * 1.5; ctx.fillText(line, M, y); });
      if (!aside) {
        ctx.fillStyle = '#6D665B';
        ctx.font = '400 28px "EB Garamond", Georgia, serif';
        ctx.fillText('hakanaltun.io', M, y + under);
      }
      // The sign-off is the header's logo, name over line, in the light
      // palette's colours and at the same proportions.
      ctx.textAlign = 'center';
      ctx.fillStyle = '#373F3A';
      ctx.font = 'italic 400 46px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('On Life & Everything', W / 2, H - M - 42);
      ctx.fillStyle = '#6D665B';
      ctx.font = 'italic 400 32px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('Essays, short fiction, and other writing.', W / 2, H - M + 10);
      return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
    });
  }
  function share(id) {
    var item = KEEP.read().kept.map(current).find(function (k) { return k.id === id; });
    if (!item) return;
    announce('Making the card…');
    drawCard(item).then(function (blob) {
      if (!blob) throw new Error('no image');
      var name = 'on-life-and-everything-' + (item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'card') + '.png';
      var file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
      // The card is a picture and holds no link, so the page's own address
      // goes with it as text. Where a browser will not send the two together, the
      // card goes alone.
      var data = { files: [file], title: item.title, text: location.origin + item.href };
      if (file && navigator.canShare && !navigator.canShare(data)) data = { files: [file], title: item.title };
      if (file && navigator.canShare && navigator.canShare(data)) {
        return navigator.share(data)
          .then(function () { announce('The card is on its way.'); }, function () { announce(''); });
      }
      announce(download(blob, name) ? 'The card is saved to your downloads.' : 'This browser cannot save the card.');
    }).catch(function () { announce('This browser cannot draw the card.'); });
  }

  /* A note is written in place, under the thing it belongs to. Done
     redraws the drawer, and focus comes back to the note's own button. */
  function openNote(button) {
    var id = button.getAttribute('data-note');
    var article = button.closest('.house-item');
    if (!article || article.querySelector('.keep-note')) return;
    var shown = article.querySelector('.house-item-note');
    if (shown) shown.remove();
    var editor = KEEP.noteEditor(id, {
      describe: function () { var item = KEEP.find(id); return item && current(item); },
      onDone: function (words) {
        var again = here.box.querySelector('[data-note="' + id + '"]');
        if (again) again.focus({ preventScroll: true });
        announce(words ? 'Your note is in your drawer.' : 'No note on this one.');
      }
    });
    article.insertBefore(editor, article.querySelector('.house-item-actions'));
    button.hidden = true;
    editor.focusNote();
  }

  /* --- What the buttons in the drawer do ---------------------------------- */

  function act(event) {
    var box = event.currentTarget;
    if (box !== here.box) return;
    var write = event.target.closest('[data-note]');
    if (write) { openNote(write); return; }
    if (event.target.closest('[data-marks]')) {
      var show = !KEEP.marksShown();
      KEEP.setMarks(show);
      var again = box.querySelector('[data-marks]');
      if (again) again.focus({ preventScroll: true });
      announce(show ? 'Highlights shown on every page.' : 'Highlights hidden on every page.');
      return;
    }
    var take = event.target.closest('[data-take]');
    if (take) { takeWork(take.getAttribute('data-take')); return; }
    var remove = event.target.closest('[data-remove]');
    if (remove) {
      // A note is the reader's own writing, and so are a page and a
      // drawing, so taking one out asks twice.
      var kept = KEEP.find(remove.getAttribute('data-remove'));
      var own = kept && KEEP.workOf(kept.id);
      if (kept && (kept.note || own) && remove.getAttribute('data-armed') !== 'true') {
        remove.setAttribute('data-armed', 'true');
        remove.textContent = own ? 'Remove it for good' : 'Remove it and the note';
        announce(own ? 'The ' + KEEP.WORKS[own].noun + ' would leave your drawer. Download it first to keep a copy.' : 'Your note would go with it.');
        remove.addEventListener('blur', function disarm() {
          remove.removeAttribute('data-armed');
          remove.textContent = 'Remove';
          remove.removeEventListener('blur', disarm);
        });
        return;
      }
      var position = Array.prototype.indexOf.call(box.querySelectorAll('[data-remove]'), remove);
      KEEP.remove(remove.getAttribute('data-remove'));
      var left = here.box.querySelectorAll('[data-remove]');
      var close = here.dialog && here.dialog.querySelector('.house-close');
      var next = left[Math.min(position, left.length - 1)] || close;
      if (next) next.focus({ preventScroll: true });
      announce('Taken out of your drawer.');
      return;
    }
    var shareButton = event.target.closest('[data-share]');
    if (shareButton) { share(shareButton.getAttribute('data-share')); return; }
    var exporter = event.target.closest('[data-export]');
    if (exporter) {
      var action = exporter.getAttribute('data-export');
      if (action === 'print') printDrawer();
      else if (action === 'backup') exportBackup();
      else if (action === 'restore') box.querySelector('[data-drawer-file]').click();
      else exportText();
    }
  }


  /* --- Showing it ------------------------------------------------------------

     render(box, options) lays the drawer out in box, and its buttons work
     from then on. options.dialog is the box's dialog, closed before the
     drawer is printed; options.back a link or button to put first, the way
     back to where the drawer was opened from; options.current gives a kept
     thing's current words; options.announce says what has been done. */
  var bound = typeof WeakSet === 'function' ? new WeakSet() : null;
  function render(box, options) {
    options = options || {};
    here = {
      box: box,
      dialog: options.dialog || null,
      back: options.back || null,
      current: options.current || function (item) { return item; },
      announce: options.announce || function () {}
    };
    if (bound ? !bound.has(box) : !box.hasAttribute('data-drawer-bound')) {
      if (bound) bound.add(box); else box.setAttribute('data-drawer-bound', '');
      box.addEventListener('click', act);
    }
    box.replaceChildren();
    renderDrawer(box);
    KEEP.sync(box);
  }

  /* --- Over any page ----------------------------------------------------------

     The site's menu and footer open the drawer over the page the reader is
     on (js/site-nav.js loads this script for them). It is the House's
     drawer in a box of the same kind, and closing it leaves the reader
     where they were. */
  var overlay = null, overlayIndex = null, catalogAsked = null, opener = null;
  function askCatalog() {
    if (catalogAsked) return catalogAsked;
    catalogAsked = typeof fetch !== 'function' ? Promise.resolve() : fetch('/house/catalog.json', { cache: 'no-cache' })
      .then(function (response) { if (!response.ok) throw new Error(response.status); return response.json(); })
      .then(function (data) { if (data && Array.isArray(data.words)) overlayIndex = indexOf(data); }, function () {});
    return catalogAsked;
  }
  function overlayCurrent(item) { return overlayIndex ? currentIn(overlayIndex, item) : item; }
  function makeOverlay() {
    var dialog = element('dialog', 'house-dialog drawer-dialog');
    dialog.id = 'drawer-dialog';
    dialog.setAttribute('aria-labelledby', 'drawer-dialog-title');
    var head = element('div', 'house-dialog-head');
    head.appendChild(element('p', 'house-eyebrow', 'Yours to keep'));
    var close = element('button', 'house-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close your drawer');
    close.textContent = '×';
    head.appendChild(close);
    dialog.appendChild(head);
    var title = element('h2', '', 'Your drawer');
    title.id = 'drawer-dialog-title';
    dialog.appendChild(title);
    var box = element('div', 'drawer-dialog-content');
    dialog.appendChild(box);
    var said = element('p', 'house-dialog-status');
    said.setAttribute('role', 'status');
    said.setAttribute('aria-live', 'polite');
    said.setAttribute('data-keep-status', '');
    dialog.appendChild(said);
    var home = element('p', 'drawer-dialog-home');
    var link = element('a', '', 'Your drawer is in the study of The House →');
    link.href = '/house/#study';
    home.appendChild(link);
    dialog.appendChild(home);
    close.addEventListener('click', function () { dialog.close(); });
    // A click on the backdrop, outside the box, closes it too.
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', function () {
      if (opener && opener.isConnected && !opener.hidden) opener.focus({ preventScroll: true });
      opener = null;
    });
    document.body.appendChild(dialog);
    KEEP.subscribe(function () { if (dialog.open) show(); });
    return dialog;
  }
  function show() {
    var said = overlay.querySelector('.house-dialog-status');
    render(overlay.querySelector('.drawer-dialog-content'), {
      dialog: overlay,
      current: overlayCurrent,
      announce: function (message) { said.textContent = message; }
    });
  }
  function open(from) {
    if (!overlay) {
      if (typeof document.createElement('dialog').showModal !== 'function') { location.href = '/house/#drawer'; return; }
      overlay = makeOverlay();
    }
    opener = from || document.activeElement;
    // The catalog is asked for once a visit, and waited for only a moment.
    Promise.race([askCatalog(), new Promise(function (resolve) { setTimeout(resolve, 700); })]).then(function () {
      overlay.querySelector('.house-dialog-status').textContent = '';
      show();
      if (!overlay.open) overlay.showModal();
      overlay.scrollTop = 0;
      overlay.querySelector('.house-close').focus({ preventScroll: true });
    });
  }

  window.OLAE_DRAWER = {
    render: render,
    open: open,
    storageNote: storageNote,
    lineItem: lineItem,
    wordItem: wordItem,
    questionItem: questionItem,
    indexOf: indexOf,
    currentIn: currentIn
  };
})();
