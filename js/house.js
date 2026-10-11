/* The House: the study and the balcony beside it. The pictures are in
   house/index.html; this puts things in them.

   What changes by the day (the word cards, the question on the wall, the
   two lines on the shelf) comes from /house/catalog.json and follows
   İstanbul's calendar, so every reader finds the same room on the same day
   and a different one tomorrow. What changes by the hour (the sky in the
   window and over the balcony, the lamp, where Moris is) follows İstanbul's
   sun and moon, through js/astronomy.js. The drawer belongs to js/keep.js,
   which the rest of the site keeps things through too; the room only opens
   it. */
(function () {
  'use strict';
  var root = document.getElementById('house');
  var KEEP = window.OLAE_KEEP;
  if (!root || !KEEP) return;
  var dialog = document.getElementById('house-dialog');
  if (typeof dialog.showModal !== 'function') {
    var enter = document.getElementById('house-enter');
    enter.href = '/all-work/';
    enter.textContent = 'Visit the writing →';
    return;
  }

  var TZ = 'Europe/Istanbul';
  var LAT = 41.015;
  var LNG = 28.979;
  var content = document.getElementById('house-dialog-content');
  var scene = document.getElementById('house-scene');
  var status = document.getElementById('house-status');
  var dialogStatus = document.getElementById('house-dialog-status');
  var entrance = document.getElementById('house-entrance');
  var study = document.getElementById('study');
  var balcony = document.getElementById('balcony');
  var balconyScene = document.getElementById('house-balcony-scene');
  var catalog = null;           // null while it loads, false if it could not
  var index = Object.create(null);
  var waiting = [];
  var activeObject = '';
  var opener = null;
  var labels = {
    books: ['By the wall', 'The bookshelf'],
    words: ['On the desk', 'Word cards'],
    question: ['Pinned to the wall', 'A question for you'],
    window: ['Outside', 'Through the window'],
    moris: ['On his cushion', 'Moris'],
    drawer: ['Yours to keep', 'Your drawer'],
    sun: ['In the sky', 'The sun'],
    moon: ['In the sky', 'The moon'],
    stars: ['In the sky', 'The stars']
  };

  /* --- İstanbul's day and hour ----------------------------------------- */

  function parts(date, options) {
    var out = {};
    new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: TZ }, options)).formatToParts(date)
      .forEach(function (p) { out[p.type] = p.value; });
    return out;
  }
  function today() {
    var p = parts(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit' });
    return p.year + '-' + p.month + '-' + p.day;
  }
  function clock(date) {
    var p = parts(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    return p.hour + ':' + p.minute;
  }
  function dayNumber(day) {
    var p = day.split('-');
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }

  /* A fixed shuffle of the list, the same for everyone, walked a step a day:
     nothing comes round again until everything else has had its day. A new
     entry reshuffles the walk, which is no loss. */
  function seeded(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function todays(list, salt, count) {
    var n = list.length;
    if (!n) return [];
    var order = list.map(function (_, i) { return i; });
    var random = seeded(salt);
    for (var i = n - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    var start = (dayNumber(today()) * count) % n;
    var picked = [];
    for (var k = 0; k < Math.min(count, n); k++) picked.push(list[order[(start + k) % n]]);
    return picked;
  }

  /* --- The catalog ------------------------------------------------------ */

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

  function whenCatalog(fn) { if (catalog !== null) fn(); else waiting.push(fn); }
  function arrived(data) {
    catalog = data && Array.isArray(data.words) ? data : false;
    if (catalog) {
      catalog.words.forEach(function (w) { index[w.id] = wordItem(w); });
      catalog.questions.forEach(function (q) { index[q.id] = questionItem(q); });
      catalog.lines.forEach(function (l) { var item = lineItem(l); index[item.id] = item; });
    }
    var run = waiting;
    waiting = [];
    run.forEach(function (fn) { fn(); });
  }
  if (typeof fetch === 'function') {
    fetch(root.getAttribute('data-catalog'))
      .then(function (response) { if (!response.ok) throw new Error(response.status); return response.json(); })
      .then(arrived, function () { arrived(false); });
  } else {
    arrived(false);
  }

  /* A kept thing shows its current words where the catalog still knows it,
     and what was kept where it does not. Only the words are taken: the kind
     and address a reader kept it under stay, and so do the reader's note
     and highlight. */
  function current(item) {
    var known = index[item.id];
    if (!known) return item;
    return { id: item.id, kind: item.kind || known.kind, title: known.title, quote: known.quote || item.quote, href: known.href, at: item.at, note: item.note, mark: item.mark, keep: item.keep };
  }

  /* --- Small builders ---------------------------------------------------- */

  /* The build keeps a closed-up dash from opening a line on the published
     page (_plugins/dash_join.rb); text set here is out of its reach, so the
     same word joiner goes in as it is shown. What is kept stays plain. */
  function joinDashes(text) { return String(text).replace(/([^\s\u2060])\u2014/g, '$1\u2060\u2014'); }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = joinDashes(text);
    return node;
  }
  function keepButton(item, label) {
    var button = element('button', 'house-keep', label);
    button.type = 'button';
    button.setAttribute('data-keep-button', '');
    button.setAttribute('data-keep-item', JSON.stringify(item));
    return button;
  }
  function actions(href, linkText, item, keepLabel) {
    var row = element('div', 'house-item-actions');
    var link = element('a', '', linkText);
    link.href = href;
    row.appendChild(link);
    if (item) row.appendChild(keepButton(item, keepLabel));
    return row;
  }
  function more(href, text) {
    var link = element('a', 'house-more', text);
    link.href = href;
    return link;
  }
  function unreachable(box, href, text) {
    box.appendChild(element('p', 'house-object-intro', 'This could not be brought in just now. Try again in a moment.'));
    box.appendChild(more(href, text));
  }
  function announce(message) {
    status.textContent = message;
    dialogStatus.textContent = message;
  }

  /* --- The objects ------------------------------------------------------- */

  function renderBooks(box) {
    if (!catalog) return unreachable(box, '/all-work/', 'All the writing →');
    box.appendChild(element('p', 'house-object-intro', 'Two lines on the shelf today: one from the book, one from the pieces.'));
    var book = todays(catalog.lines.filter(function (l) { return l.book; }), 37, 1)[0];
    var piece = todays(catalog.lines.filter(function (l) { return !l.book; }), 41, 1)[0];
    [book, piece].forEach(function (line) {
      if (!line) return;
      var item = lineItem(line);
      var article = element('article', 'house-item');
      article.appendChild(element('p', 'house-item-kind', item.kind));
      article.appendChild(element('h3', '', line.source));
      article.appendChild(element('blockquote', '', line.text));
      article.appendChild(actions(line.url, line.book ? 'Read the chapter →' : 'Read the piece →', item, 'Keep this line'));
      box.appendChild(article);
    });
    box.appendChild(more('/all-work/', 'All the writing →'));
  }

  function renderWords(box) {
    if (!catalog) return unreachable(box, '/word/', 'All the words →');
    box.appendChild(element('p', 'house-object-intro', 'Three cards on the desk today. Turn one over; there’s a story behind each word.'));
    todays(catalog.words, 11, 3).forEach(function (w) {
      var article = element('article', 'house-item house-word-card');
      article.appendChild(element('p', 'house-item-kind', w.pos));
      article.appendChild(element('h3', '', w.word));
      var details = element('details');
      var summary = element('summary', '', 'Turn the card over ');
      summary.appendChild(element('span', '', '↻')).setAttribute('aria-hidden', 'true');
      details.appendChild(summary);
      details.appendChild(element('p', '', w.description));
      article.appendChild(details);
      article.appendChild(actions(w.url, 'Read its story →', wordItem(w), 'Keep this word'));
      box.appendChild(article);
    });
    box.appendChild(more('/word/', 'All the words →'));
  }

  function renderQuestion(box) {
    if (!catalog) return unreachable(box, '/trivia/', 'All the quizzes →');
    var q = todays(catalog.questions, 23, 1)[0];
    var article = element('article', 'house-item house-question');
    article.appendChild(element('p', 'house-item-kind', 'Today, from ' + q.quiz));
    article.appendChild(element('h3', '', q.question));
    var answers = element('div', 'house-answers');
    answers.setAttribute('role', 'group');
    answers.setAttribute('aria-label', 'Choose an answer');
    // Like the quizzes, a fixed order of choices would give the answer away.
    // The shuffle is the day's, though, so the wall reads the same each time
    // the room is opened until İstanbul's next morning, and B stays B.
    var order = q.choices.map(function (_, i) { return i; });
    var random = seeded(dayNumber(today()) * 31 + 23);
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    // Lettered by place on the screen, as in the quizzes.
    order.forEach(function (at, slot) {
      var button = element('button');
      button.type = 'button';
      button.setAttribute('data-answer', at === q.answer ? 'correct' : 'other');
      button.appendChild(element('span', 'house-answer-letter', 'ABCDEFGHI'.charAt(slot) + '.'));
      button.appendChild(element('span', 'house-answer-text', q.choices[at]));
      answers.appendChild(button);
    });
    article.appendChild(answers);
    var after = element('div', 'house-answer-note');
    after.hidden = true;
    var result = element('p', 'house-answer-result');
    after.appendChild(result);
    after.appendChild(element('p', '', q.note));
    after.appendChild(actions(q.url, 'Play a full round →', questionItem(q), 'Keep this note'));
    article.appendChild(after);
    box.appendChild(article);
    article.setAttribute('data-question', q.id);
    // The answer stays answered for the rest of İstanbul's day.
    var saved = KEEP.read().answered;
    if (saved && saved.day === today() && saved.id === q.id) {
      var chosen = Array.prototype.find.call(answers.children, function (b) { return choiceText(b) === saved.choice; });
      if (chosen) showAnswer(chosen, false);
    }
  }

  // The choice's own words, without its letter. Answers are kept by their
  // words, as they were before the choices had letters.
  function choiceText(button) {
    return button.querySelector('.house-answer-text').textContent;
  }

  function showAnswer(button, moveFocus) {
    var correct = content.querySelector('[data-answer="correct"]');
    content.querySelectorAll('[data-answer]').forEach(function (choice) {
      choice.disabled = true;
      if (choice === correct) choice.dataset.result = 'correct';
      else if (choice === button) choice.dataset.result = 'chosen';
    });
    var note = content.querySelector('.house-answer-note');
    note.hidden = false;
    var result = content.querySelector('.house-answer-result');
    result.textContent = button === correct ? 'That’s right.' : 'The answer is ';
    if (button !== correct) {
      // Set apart from the italic line, so that "A boiled egg" cannot be
      // read as the choice lettered A.
      result.appendChild(element('em', '', choiceText(correct)));
      result.appendChild(document.createTextNode('.'));
    }
    if (moveFocus) {
      // The disabled answer no longer takes focus; the note is what to read.
      note.tabIndex = -1;
      note.focus({ preventScroll: true });
    }
  }

  function renderWindow(box) {
    box.appendChild(document.getElementById('house-window').content.cloneNode(true));
    var sky = skyNow(new Date());
    box.querySelector('[data-sky-line]').textContent = {
      morning: 'It is morning in İstanbul.', day: 'It is day in İstanbul.',
      evening: 'It is evening in İstanbul.', night: 'It is night in İstanbul.'
    }[sky.period] + ' The light in this window is the light there.';
    var facts = box.querySelector('[data-sky-facts]');
    function fact(term, value) {
      if (!value) return;
      facts.appendChild(element('dt', '', term));
      facts.appendChild(element('dd', '', value));
    }
    fact('Sunrise', sky.sunrise && clock(sky.sunrise));
    fact('Sunset', sky.sunset && clock(sky.sunset));
    fact('The moon', sky.moon);
    var crossing = sky.moon && window.OLAE_ASTRO.moonCrossing(new Date(), LAT, LNG);
    fact(sky.moonUp ? 'Moonset' : 'Moonrise', crossing && clock(crossing));
    if (!facts.children.length) facts.remove();
    /* After sunset, the planets that are up over İstanbul, as The Stars
       finds them. Their ephemeris is fetched the first time it is wanted. */
    var dark = sky.period === 'night' || (sky.period === 'evening' && sky.sunset && new Date() > sky.sunset);
    if (dark && facts.isConnected) loadSky().then(function () {
      var M = window.OLAE_SKYMAP;
      var up = M.planets(new Date(), LAT, LNG).filter(function (p) { return p.alt > 5; }).slice(0, 2);
      if (up.length && facts.isConnected) fact('Planets', up.map(function (p) { return p.body + ' ' + M.where(p.alt, p.az); }).join(', '));
    }).catch(function () {});
  }

  /* The sky map's scripts, listed in house/index.html from _data/sky_scripts.yml.
     The window needs only the planets; the balcony draws the stars too. */
  var skyScripts = Object.create(null);
  function loadScript(src) {
    if (!skyScripts[src]) {
      skyScripts[src] = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = src; script.onload = resolve; script.onerror = reject;
        document.head.appendChild(script);
      }).catch(function (error) { delete skyScripts[src]; throw error; });
    }
    return skyScripts[src];
  }
  function loadSky(withStars) {
    if (window.OLAE_SKYMAP && window.Astronomy && (!withStars || window.OLAE_STARS)) return Promise.resolve();
    var list = window.OLAE_SKY_SCRIPTS;
    if (!list) return Promise.reject(new Error('No sky scripts'));
    var order = withStars ? [list.engine, list.stars, list.map] : [list.engine, list.map];
    return order.reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve());
  }

  /* --- The sky over the balcony -----------------------------------------
     The sun, the moon and the stars as they stand over İstanbul now, in
     words, with the ways on to the pages about them. */

  var COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  // The words of The Stars and the window: "low in the east", "high in the south".
  function where(alt, az) {
    if (alt >= 80) return 'overhead';
    return (alt < 15 ? 'low in the ' : alt >= 60 ? 'high in the ' : 'in the ') + COMPASS[Math.round(az / 45) % 8];
  }
  function bearing(az) {
    var name = COMPASS[Math.round(az / 45) % 8];
    return name.charAt(0).toUpperCase() + name.slice(1) + ', ' + Math.round(az) % 360 + '°';
  }
  function duration(ms) {
    var m = Math.round(ms / 60000), h = Math.floor(m / 60);
    m %= 60;
    return h > 0 ? h + ' h' + (m > 0 ? ' ' + m + ' m' : '') : m + ' m';
  }
  // The balcony looks the same way as the study window, toward the south;
  // what stands behind the house is not seen from either.
  function inFront(az) { return az >= 90 && az <= 270; }
  function skyDialog(box, id) {
    box.appendChild(document.getElementById(id).content.cloneNode(true));
    var facts = box.querySelector('[data-sky-facts]');
    return function fact(term, value) {
      if (!value) return;
      facts.appendChild(element('dt', '', term));
      facts.appendChild(element('dd', '', value));
    };
  }
  function nextSunrise(now) {
    var A = window.OLAE_ASTRO;
    for (var ahead = 0; ahead < 3; ahead++) {
      var p = parts(new Date(now.getTime() + ahead * 86400000), { year: 'numeric', month: 'numeric', day: 'numeric' });
      var y = +p.year, mo = +p.month - 1, d = +p.day;
      var rise = A.sunEvent({ n: Math.round((Date.UTC(y, mo, d) - Date.UTC(y, 0, 0)) / 86400000), y: y, mo: mo, d: d }, true, 90.833, LAT, LNG, TZ);
      if (rise && rise > now) return rise;
    }
    return null;
  }

  function renderSun(box) {
    var fact = skyDialog(box, 'house-sun');
    var now = new Date(), sky = skyNow(now), sun = sky.sun;
    var line = box.querySelector('[data-sky-line]');
    if (!sun || sun.alt <= -0.833) {
      line.textContent = 'The sun is below İstanbul’s horizon.';
    } else {
      line.textContent = 'The sun is ' + where(sun.alt, sun.az) + '.' + (inFront(sun.az) ? '' : ' It is behind the house, so the balcony does not see it now.');
      fact('Height', Math.round(sun.alt) + '°');
      fact('Direction', bearing(sun.az));
    }
    fact('Sunrise', sky.sunrise && clock(sky.sunrise));
    fact('Sunset', sky.sunset && clock(sky.sunset));
    fact('Day length', sky.sunrise && sky.sunset && duration(sky.sunset - sky.sunrise));
  }

  function renderMoon(box) {
    var fact = skyDialog(box, 'house-moon');
    var now = new Date(), sky = skyNow(now), moon = sky.moonAt;
    var line = box.querySelector('[data-sky-line]');
    if (!sky.moonUp) {
      line.textContent = 'The moon is below İstanbul’s horizon.';
    } else {
      line.textContent = 'The moon is ' + where(moon.alt, moon.az) + '.' + (inFront(moon.az) ? '' : ' It is behind the house, so the balcony does not see it now.');
    }
    fact('Phase', sky.moon);
    if (sky.moonUp) {
      fact('Height', Math.round(moon.alt) + '°');
      fact('Direction', bearing(moon.az));
    }
    var crossing = sky.moon && window.OLAE_ASTRO.moonCrossing(now, LAT, LNG);
    fact(sky.moonUp ? 'Moonset' : 'Moonrise', crossing && clock(crossing));
  }

  function renderStars(box) {
    var fact = skyDialog(box, 'house-stars');
    var now = new Date();
    var rise = window.OLAE_ASTRO && nextSunrise(now);
    loadSky(true).then(function () {
      if (!box.isConnected) return;
      var M = window.OLAE_SKYMAP, s = M.sky(new Date(), LAT, LNG);
      var planets = s.planets.filter(function (p) { return p.alt > 5 && !p.glare; }).slice(0, 3);
      if (planets.length) fact('Planets', planets.map(function (p) { return p.body + ' ' + M.where(p.alt, p.az); }).join(', '));
      var named = s.visible.filter(function (v) { return v.s.name && v.s.mag <= 1.5 && v.alt >= 10 && inFront(v.az); }).slice(0, 3);
      if (named.length) fact('Bright stars', named.map(function (v) { return v.s.name + ' ' + M.where(v.alt, v.az); }).join(', '));
      fact('Sunrise', rise && clock(rise));
    }, function () { fact('Sunrise', rise && clock(rise)); });
  }

  var MORIS = {
    cushion: { place: 'On his cushion', line: 'He is resting on his cushion below the window.' },
    balcony: { place: 'On the balcony', line: 'He is out on the balcony for the middle of the day, behind the closed glass.' },
    'balcony-late': { place: 'On the balcony', line: 'He is out on the balcony again until the sun is low, behind the closed glass.' },
    sill: { place: 'At the window', line: 'He is asleep by the window as the sun goes down.' },
    shelf: { place: 'On the bookshelf', line: 'He is on top of the bookshelf, inspecting the room.' },
    rug: { place: 'On the rug', line: 'He is on the rug.' }
  };
  function renderMoris(box) {
    box.appendChild(document.getElementById('house-moris').content.cloneNode(true));
    var where = scene.dataset.moris;
    // Out on the balcony twice a day: the second time is the late afternoon's.
    if (where === 'balcony' && skyNow(new Date()).hour >= 14) where = 'balcony-late';
    var about = MORIS[where] || MORIS.cushion;
    document.getElementById('house-dialog-place').textContent = about.place;
    box.querySelector('[data-moris-line]').textContent = about.line;
  }

  function storageNote() {
    return KEEP.works()
      ? 'Kept in this browser, and nowhere else. You can put things here from anywhere on the site. Clearing your browser’s data empties it.'
      : 'This browser cannot save your drawer. What you put here stays until you leave the page.';
  }

  function renderDrawer(box) {
    var kept = KEEP.read().kept.map(current).reverse();
    box.appendChild(element('p', 'house-drawer-note', storageNote()));
    /* Only what can be done: an empty drawer has nothing to download, and a
       browser that cannot keep the drawer cannot take a restored one. */
    if (!kept.length) {
      var empty = element('div', 'house-empty-drawer');
      empty.appendChild(element('p', '', 'Nothing here yet. Pick up a word card, read a line from the bookshelf, or try the question on the wall. On a word’s page, after a quiz answer, or when you select a line in an essay or the book, there is a way to keep it too.'));
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
      article.appendChild(element('p', 'house-item-kind', item.mark ? [item.kind, 'Highlighted'].filter(Boolean).join(' · ') : item.kind));
      article.appendChild(element('h3', item.id.indexOf('word-') === 0 ? 'is-word' : '', item.title));
      if (item.quote) article.appendChild(element(item.id.indexOf('text-') === 0 ? 'blockquote' : 'p', '', item.quote));
      if (item.note) {
        var noted = element('div', 'house-item-note');
        noted.appendChild(element('p', 'house-item-kind', 'Your note'));
        noted.appendChild(element('p', 'house-note-text', item.note));
        article.appendChild(noted);
      }
      var row = actions(item.href, 'Go to the page →');
      var write = element('button', '', item.note ? 'Edit the note' : 'Add a note');
      write.type = 'button';
      write.setAttribute('data-note', item.id);
      row.appendChild(write);
      // The card is for sending, so it carries what was kept and never the note.
      var share = element('button', '', 'Share as a card');
      share.type = 'button';
      share.setAttribute('data-share', item.id);
      row.appendChild(share);
      var remove = element('button', '', 'Remove');
      remove.type = 'button';
      remove.setAttribute('data-remove', item.id);
      remove.setAttribute('aria-label', 'Remove ' + item.title + ' from your drawer');
      row.appendChild(remove);
      article.appendChild(row);
      box.appendChild(article);
    });
  }

  var renderers = { books: renderBooks, words: renderWords, question: renderQuestion, window: renderWindow, moris: renderMoris, drawer: renderDrawer, sun: renderSun, moon: renderMoon, stars: renderStars };
  var needsCatalog = { books: true, words: true, question: true };

  function fill(name) {
    content.replaceChildren();
    if (needsCatalog[name] && catalog === null) {
      content.appendChild(element('p', 'house-object-intro', 'One moment…'));
      whenCatalog(function () { if (dialog.open && activeObject === name) fill(name); });
      return;
    }
    renderers[name](content);
    KEEP.sync(content);
  }

  function openObject(name, button) {
    if (!labels[name]) return;
    activeObject = name;
    opener = button;
    document.getElementById('house-dialog-place').textContent = labels[name][0];
    document.getElementById('house-dialog-title').textContent = labels[name][1];
    dialogStatus.textContent = '';
    fill(name);
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    document.getElementById('house-close').focus({ preventScroll: true });
  }

  /* --- The sky, the lamp and the cat ------------------------------------ */

  /* In the window the sun and the moon stand in the casement on their side
     of the sky, the left while they are in the east and the right in the
     west, and sink behind the sea and the Islands as they set. They are
     there while they are above İstanbul's horizon and in front of the
     house, by day as well as by night. Sharing a casement, the one further
     east keeps to its left. */
  var CASEMENT = { east: 628, west: 758 };
  /* Over the balcony the sky is drawn whole between its walls: east at the
     left, west at the right, and from the horizon at the sea up to the
     ceiling, so the sun, the moon and the stars are where they stand. */
  var OPEN = { left: 262.5, right: 737.5, horizon: 285, top: 125 };
  function skyPoint(alt, az) {
    return { x: OPEN.left + (az - 90) / 180 * (OPEN.right - OPEN.left), y: OPEN.horizon - alt / 90 * (OPEN.horizon - OPEN.top) };
  }
  /* From his cushion to each of his other places. The room is drawn in
     perspective, so he is smaller up at the window and on the bookshelf,
     and larger out on the carpet, near the front of the room. */
  var PLACES = { sill: 'translate(25.7 -107) scale(.891)', shelf: 'translate(-478.8 -311.3) scale(.924)', rug: 'translate(-711.1 -82.2) scale(1.467)', cushion: 'translate(109.7 23.83) scale(.88)' };
  var PHASES = ['new moon', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full moon', 'waning gibbous', 'last quarter', 'waning crescent'];

  // How far apart two things in the sky are, in degrees.
  function apart(a, b) {
    var r = Math.PI / 180;
    var c = Math.sin(a.alt * r) * Math.sin(b.alt * r) + Math.cos(a.alt * r) * Math.cos(b.alt * r) * Math.cos((a.az - b.az) * r);
    return Math.acos(Math.max(-1, Math.min(1, c))) / r;
  }

  function skyNow(now) {
    var A = window.OLAE_ASTRO;
    var hour = +clock(now).slice(0, 2);
    var sky = { hour: hour };
    if (A) {
      var p = parts(now, { year: 'numeric', month: 'numeric', day: 'numeric' });
      var y = +p.year, mo = +p.month - 1, d = +p.day;
      var day = { n: Math.round((Date.UTC(y, mo, d) - Date.UTC(y, 0, 0)) / 86400000), y: y, mo: mo, d: d };
      sky.sunrise = A.sunEvent(day, true, 90.833, LAT, LNG, TZ);
      sky.sunset = A.sunEvent(day, false, 90.833, LAT, LNG, TZ);
      var dawn = A.sunEvent(day, true, 96, LAT, LNG, TZ);
      var dusk = A.sunEvent(day, false, 96, LAT, LNG, TZ);
      /* Hung on the day's own sunrise and sunset, so a winter morning is as
         long as a summer one: morning runs from first light to two and a
         half hours after sunrise, evening from an hour and a half before
         sunset to last light. */
      var t = now.getTime();
      sky.period = !dawn || !dusk || t < dawn.getTime() || t > dusk.getTime() ? 'night'
        : t < sky.sunrise.getTime() + 150 * 60000 ? 'morning'
        : t > sky.sunset.getTime() - 90 * 60000 ? 'evening' : 'day';
      var lunation = A.lunation(now);
      sky.age = (lunation - Math.floor(lunation)) * A.SYNODIC;
      var lit = Math.round((1 - Math.cos(2 * Math.PI * sky.age / A.SYNODIC)) / 2 * 100);
      var phase = PHASES[A.moonPhaseIndex(sky.age)];
      sky.moon = phase.charAt(0).toUpperCase() + phase.slice(1) + ', ' + lit + '% lit';
      var sun = A.sunPosition(now, LAT, LNG), moon = A.moonPosition(now, LAT, LNG);
      sky.sun = { alt: sun.altitude, az: sun.azimuth };
      sky.moonAt = { alt: moon.altitude, az: moon.azimuth };
      sky.moonUp = moon.altitude > A.MOON_HORIZON;
      // Within a day or two of the new moon it is lost in the sun's light.
      sky.moonSeen = sky.moonUp && lit >= 3 && apart(sky.sun, sky.moonAt) >= 12;
    } else {
      sky.period = hour >= 6 && hour < 10 ? 'morning' : hour >= 10 && hour < 17 ? 'day' : hour >= 17 && hour < 21 ? 'evening' : 'night';
    }
    return sky;
  }

  /* Where Moris is goes by İstanbul's light: on his cushion through the
     morning, out on the balcony for the middle of the day, from noon to
     two, back on his cushion, out on the balcony again from two hours
     before sunset until half an hour before it, asleep at the window as the
     sun goes down, up on the bookshelf once the lamps are on, and out on
     the carpet after midnight. The balcony's glass is closed while he is
     out there. */
  var MINUTE = 60000;
  function morisPlace(sky, now) {
    var late = sky.sunset ? now >= sky.sunset - 120 * MINUTE && now < sky.sunset - 30 * MINUTE : sky.hour >= 16 && sky.hour < 18;
    if ((sky.period === 'day' && sky.hour >= 12 && sky.hour < 14) || late) return 'balcony';
    if (sky.period === 'morning' || sky.period === 'day') return 'cushion';
    if (sky.period === 'evening') return (sky.sunset ? now < sky.sunset : sky.hour < 19) ? 'sill' : 'shelf';
    return sky.hour >= 12 ? 'shelf' : 'rug';
  }

  /* The lit part of the moon: the bright limb, then back along the
     terminator, an ellipse as wide as the phase leaves it. Seen from
     İstanbul a waxing moon is lit on the right. */
  function moonPath(age, cx, cy, r) {
    var cycle = age / window.OLAE_ASTRO.SYNODIC;
    var lit = (1 - Math.cos(2 * Math.PI * cycle)) / 2;
    var waxing = cycle < 0.5;
    var gibbous = lit > 0.5;
    var rx = (r * Math.abs(1 - 2 * lit)).toFixed(2);
    var outer = waxing ? 1 : 0;
    var inner = waxing === gibbous ? 1 : 0;
    return 'M' + cx + ' ' + (cy - r) + 'A' + r + ' ' + r + ' 0 0 ' + outer + ' ' + cx + ' ' + (cy + r) +
      'A' + rx + ' ' + r + ' 0 0 ' + inner + ' ' + cx + ' ' + (cy - r) + 'Z';
  }

  /* The wall clock belongs to the room, so it keeps İstanbul time just like
     the light, the window and the digital time above the study. */
  function wallClock() {
    var now = new Date();
    var p = parts(now, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    var hours = +p.hour, minutes = +p.minute;
    var turn = function (hand, degrees) {
      scene.querySelector(hand).setAttribute('transform', 'rotate(' + degrees + ' 450 146)');
    };
    turn('.house-clock-hour', (hours % 12 + minutes / 60) * 30);
    turn('.house-clock-minute', minutes * 6);
  }
  // On the minute, not a minute after the page happened to open.
  function keepTime() {
    wallClock();
    window.setTimeout(keepTime, 60000 - Date.now() % 60000 + 50);
  }

  // Where the sun is for a picture: in front of the house, behind it, or down.
  function sunState(sky) {
    if (!sky.sun) return sky.period === 'night' ? 'down' : 'in';
    return sky.sun.alt <= -0.833 ? 'down' : inFront(sky.sun.az) ? 'in' : 'behind';
  }
  function placeMoon(target, age, x, y, r) {
    var disc = target.querySelector('.house-moon-disc');
    disc.setAttribute('cx', x); disc.setAttribute('cy', y); disc.setAttribute('r', r);
    target.querySelector('.house-moon-lit').setAttribute('d', moonPath(age, x, y, r));
  }

  function paintWindow(sky) {
    var sunIn = sunState(sky) === 'in';
    var moonIn = sky.moonSeen && inFront(sky.moonAt.az);
    var bodies = [];
    if (sunIn) bodies.push({ name: 'sun', az: sky.sun.az, low: sky.sun.alt < 4 });
    if (moonIn) bodies.push({ name: 'moon', az: sky.moonAt.az, low: sky.moonAt.alt < 4 });
    bodies.forEach(function (b) {
      b.side = b.az < 180 ? 'east' : 'west';
      b.x = CASEMENT[b.side];
    });
    if (bodies.length === 2 && bodies[0].side === bodies[1].side) {
      bodies.sort(function (a, b) { return a.az - b.az; });
      bodies[0].x -= 25; bodies[1].x += 25;
    }
    scene.dataset.sun = sunState(sky);
    bodies.forEach(function (b) {
      if (b.name === 'sun') {
        var sun = scene.querySelector('.house-sun');
        sun.setAttribute('cx', b.x); sun.setAttribute('cy', b.low ? 213 : 196);
      } else placeMoon(scene, sky.age, b.x, b.low ? 214 : 198, 17);
    });
    if (moonIn) scene.dataset.moon = 'up'; else delete scene.dataset.moon;
  }

  /* A name in the balcony's sky sits beside what it names, on the side
     toward the middle; out of sight behind the house it waits at the edge
     of the view on that body's side. */
  function placeSkyName(name, alt, az, r) {
    var hotspot = balconyScene.querySelector('.house-hotspot--' + name);
    var travel = balconyScene.querySelector('.house-sky-travel--' + name);
    var item = balcony.querySelector('[data-sky-item="' + name + '"]');
    var shown = alt !== null;
    hotspot.hidden = !shown;
    if (item) item.hidden = !shown;
    if (travel) travel.hidden = !shown || !inFront(az);
    if (!shown) return null;
    var at = skyPoint(alt, Math.min(270, Math.max(90, az)));
    var side = inFront(az) ? (at.x < 560 ? 'right' : 'left') : (az < 90 ? 'right' : 'left');
    hotspot.dataset.side = inFront(az) ? side : 'edge-' + side;
    hotspot.style.setProperty('--sky-x', (at.x / 10).toFixed(2));
    hotspot.style.setProperty('--sky-y', (at.y / 6.5).toFixed(2));
    hotspot.style.setProperty('--sky-r', (r / 10).toFixed(2));
    if (travel) {
      travel.style.setProperty('--sky-x', (at.x / 10).toFixed(2));
      travel.style.setProperty('--sky-y', (at.y / 6.5).toFixed(2));
    }
    return at;
  }

  function paintBalcony(sky) {
    var state = sunState(sky);
    balconyScene.dataset.sun = state;
    var sunAt = placeSkyName('sun', state === 'down' || !sky.sun ? null : sky.sun.alt, sky.sun ? sky.sun.az : 180, 15);
    if (sunAt && state === 'in') {
      var sun = balconyScene.querySelector('.house-sun');
      sun.setAttribute('cx', sunAt.x.toFixed(1)); sun.setAttribute('cy', sunAt.y.toFixed(1));
    }
    var moonAt = placeSkyName('moon', sky.moonSeen ? sky.moonAt.alt : null, sky.moonAt ? sky.moonAt.az : 180, 13);
    if (moonAt && inFront(sky.moonAt.az)) {
      placeMoon(balconyScene, sky.age, +moonAt.x.toFixed(1), +moonAt.y.toFixed(1), 13);
      balconyScene.dataset.moon = 'up';
    } else delete balconyScene.dataset.moon;
    var dark = sky.period === 'night';
    balconyScene.querySelector('.house-hotspot--stars').hidden = !dark;
    balcony.querySelector('[data-sky-item="stars"]').hidden = !dark;
    if (dark && !balcony.hidden) paintStars();
  }

  /* The stars over the balcony: in the city's light only the brightest
     show, with the planets, each where it stands now. Their catalogue and
     ephemeris come the first time the balcony is dark. */
  function paintStars() {
    loadSky(true).then(function () {
      var M = window.OLAE_SKYMAP, s = M.sky(new Date(), LAT, LNG);
      var layer = balconyScene.querySelector('.house-sky-stars');
      layer.replaceChildren();
      function dot(alt, az, r, planet) {
        var at = skyPoint(alt, az);
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', at.x.toFixed(1)); c.setAttribute('cy', at.y.toFixed(1)); c.setAttribute('r', r);
        if (planet) c.setAttribute('class', 'is-planet');
        layer.appendChild(c);
      }
      s.visible.forEach(function (v) {
        if (v.s.mag <= 2 && v.alt > 1 && inFront(v.az)) dot(v.alt, v.az, Math.max(0.9, 2.1 - v.s.mag * 0.55).toFixed(2), false);
      });
      s.planets.forEach(function (p) {
        if (p.alt > 1 && !p.glare && inFront(p.az)) dot(p.alt, p.az, 2.3, true);
      });
    }).catch(function () {});
  }

  function paint() {
    var now = new Date();
    var sky = skyNow(now);
    var name = { morning: 'Morning', day: sky.hour < 12 ? 'Morning' : 'Afternoon', evening: 'Evening', night: 'Night' }[sky.period];
    scene.dataset.hour = sky.period;
    balconyScene.dataset.hour = sky.period;
    document.getElementById('house-hour').textContent = name + ' in İstanbul';
    document.getElementById('house-clock').textContent = '· ' + clock(now);
    balcony.querySelector('[data-house-hour]').textContent = name + ' in İstanbul';
    balcony.querySelector('[data-house-clock]').textContent = '· ' + clock(now);
    if (sky.sun) {
      paintWindow(sky);
      paintBalcony(sky);
    }
    var place = morisPlace(sky, now);
    scene.dataset.moris = place;
    balconyScene.dataset.moris = place;
    balcony.querySelector('[data-moris-item]').hidden = place !== 'balcony';
    study.querySelector('.house-objects [data-open="moris"]').parentNode.hidden = place === 'balcony';
    var cat = scene.querySelector('.house-moris');
    if (PLACES[place]) cat.setAttribute('transform', PLACES[place]); else cat.removeAttribute('transform');
    /* Each lamp is on in the evening and at night until the reader turns it
       off, and off by day until they turn it on; the drawer remembers the
       choice. The balcony's lamp has its switch in the study, beside the
       door, and each room's lamp shows in the other through the door's glass. */
    var kept = KEEP.read();
    var dusk = sky.period === 'night' || sky.period === 'evening';
    var on = kept.lamp === null ? dusk : kept.lamp;
    scene.dataset.lamp = on ? 'on' : 'off';
    balconyScene.dataset.lamp = scene.dataset.lamp;
    root.querySelectorAll('button[data-lamp]').forEach(function (button) { button.setAttribute('aria-pressed', String(on)); });
    var porch = kept.balconyLamp === null ? dusk : kept.balconyLamp;
    balconyScene.dataset.balconyLamp = porch ? 'on' : 'off';
    scene.dataset.balconyLamp = balconyScene.dataset.balconyLamp;
    root.querySelectorAll('button[data-balcony-lamp]').forEach(function (button) { button.setAttribute('aria-pressed', String(porch)); });
  }

  /* --- Weather at the window ------------------------------------------
     On this page the footer's rain and snow fall outside the window rather
     than over the whole page: js/let-it-snow.js hands them over, and keeps
     its buttons and their labels as they are everywhere else. On the
     balcony they fall beyond the parapet, and the snow gathers along the
     foot of the glass. */

  var VIEWS = {
    study: { scene: scene, layer: scene.querySelector('.house-weather'), snow: scene.querySelector('.house-window-snow'),
      box: { left: 560, right: 826, top: 108, bottom: 321 }, drift: { left: 560, right: 826, base: 321 }, where: ' at the study window.' },
    balcony: { scene: balconyScene, layer: balconyScene.querySelector('.house-weather'), snow: balconyScene.querySelector('.house-balcony-snow'),
      box: { left: 232.5, right: 767.5, top: 99.6, bottom: 379.4 }, drift: { left: 232.5, right: 767.5, base: 379.4 }, where: ' over the city.' }
  };
  var view = VIEWS.study;
  // The pine outside the balcony holds the snow on its tufts as it falls.
  var pineSnow = balconyScene.querySelector('.house-pine-snow');
  var weather = { kind: null, level: 0, drops: [], frame: 0, last: 0, snow: 0 };
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function makeDrop(anywhere) {
    var rain = weather.kind === 'rain', heavy = weather.level === 2, depth = Math.random();
    var drop = { depth: depth, phase: Math.random() * 6.3 };
    drop.speed = rain ? (170 + depth * 150) * (heavy ? 1.4 : 1) : (11 + depth * 15) * (heavy ? 1.7 : 1);
    drop.node = document.createElementNS('http://www.w3.org/2000/svg', rain ? 'line' : 'circle');
    if (rain) drop.node.setAttribute('stroke-width', (0.6 + depth * 0.8).toFixed(2));
    else drop.node.setAttribute('r', ((0.9 + depth * 1.4) * (heavy ? 1.25 : 1)).toFixed(2));
    drop.node.setAttribute('opacity', ((rain ? 0.35 : 0.55) + depth * 0.4).toFixed(2));
    view.layer.appendChild(drop.node);
    placeDrop(drop, anywhere);
    return drop;
  }
  // Rain leans with the wind, so it starts a little to the left of the glass.
  function placeDrop(drop, anywhere) {
    var box = view.box;
    drop.x = box.left - 30 + Math.random() * (box.right - box.left + 30);
    drop.y = anywhere ? box.top + Math.random() * (box.bottom - box.top) : box.top - 10 - Math.random() * 30;
  }
  function drawDrop(drop, rain) {
    if (rain) {
      var length = 9 + drop.depth * 9;
      drop.node.setAttribute('x1', drop.x.toFixed(1));
      drop.node.setAttribute('y1', drop.y.toFixed(1));
      drop.node.setAttribute('x2', (drop.x - length * 0.14).toFixed(1));
      drop.node.setAttribute('y2', (drop.y - length).toFixed(1));
    } else {
      drop.node.setAttribute('cx', drop.x.toFixed(1));
      drop.node.setAttribute('cy', drop.y.toFixed(1));
    }
  }
  /* Snow gathers along the foot of the glass while it falls, deeper in a
     heavy fall, and melts away once it stops. */
  function drawWindowSnow() {
    var h = weather.snow, d = view.drift, base = d.base;
    view.snow.setAttribute('d', h < 0.2 ? '' : 'M' + d.left + ' ' + base + 'V' + (base - h).toFixed(1) +
      'Q' + (d.left + 45) + ' ' + (base - h * 1.5).toFixed(1) + ' ' + (d.left + 91) + ' ' + (base - h).toFixed(1) +
      'T' + d.right + ' ' + (base - h).toFixed(1) + 'V' + base + 'Z');
  }
  function weatherStep(now) {
    weather.frame = 0;
    var seconds = weather.last ? Math.min(0.05, (now - weather.last) / 1000) : 0;
    weather.last = now;
    var rain = weather.kind === 'rain';
    weather.drops.forEach(function (drop) {
      drop.y += drop.speed * seconds;
      drop.x += rain ? drop.speed * 0.14 * seconds : Math.sin(now / 1100 + drop.phase) * 9 * seconds;
      if (drop.y > view.box.bottom - (rain ? 0 : weather.snow) + (rain ? 18 : 2)) placeDrop(drop, false);
      drawDrop(drop, rain);
    });
    var deepest = weather.kind === 'snow' ? (weather.level === 2 ? 14 : 6) : 0;
    weather.snow = weather.snow < deepest ? Math.min(deepest, weather.snow + seconds * (weather.level === 2 ? 0.12 : 0.05))
      : Math.max(deepest, weather.snow - seconds * 2);
    drawWindowSnow();
    pineSnow.setAttribute('opacity', Math.min(1, weather.snow / 4).toFixed(2));
    if (weather.drops.length || weather.snow > 0) weather.frame = window.requestAnimationFrame(weatherStep);
    else weather.last = 0;
  }
  function seedWeather() {
    weather.drops.forEach(function (drop) { drop.node.remove(); });
    weather.drops = [];
    var kind = weather.kind, level = weather.level;
    var count = kind ? (kind === 'rain' ? (level === 2 ? 190 : 85) : (level === 2 ? 160 : 85)) : 0;
    if (still) count = Math.round(count * 0.45);
    for (var i = 0; i < count; i++) weather.drops.push(makeDrop(true));
    if (!weather.frame) weather.frame = window.requestAnimationFrame(weatherStep);
  }
  function windowWeather(kind, level) {
    weather.kind = kind;
    weather.level = level;
    [scene, balconyScene].forEach(function (s) { if (kind) s.dataset.weather = kind; else delete s.dataset.weather; });
    seedWeather();
    announce(!kind ? 'The sky clears.' : (level === 2 ? 'Heavy ' : 'Light ') + kind + view.where);
    // The buttons are at the foot of the page and the sky may be out of
    // sight above them, so the room is brought up to show where it is falling.
    var section = view === VIEWS.study ? study : balcony;
    if (kind && !section.hidden) {
      var sky = view === VIEWS.study ? scene.querySelector('.house-glass').getBoundingClientRect() : balconyScene.getBoundingClientRect();
      if (sky.top < 0 || sky.bottom > window.innerHeight) view.scene.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
    }
  }
  // Going out to the balcony, or back in, takes the weather along.
  function weatherFollows(next) {
    if (next === view) return;
    view.snow.setAttribute('d', '');
    view = next;
    seedWeather();
    drawWindowSnow();
  }
  // js/let-it-snow.js runs after this script, so the window is offered to it
  // once the page has finished loading as well as now.
  function offerWindow() {
    if (window.OLAE_WEATHER && window.OLAE_WEATHER.place) window.OLAE_WEATHER.place(windowWeather);
  }

  /* --- Since the last visit ---------------------------------------------
     The house remembers what the site held on a reader's last day here and
     says, at the door, what has come since. It is worked out once a day, so
     the note is still there if the page is opened again the same day. */

  function arrivals() {
    if (!catalog) return;
    var things = [].concat(
      catalog.pieces.map(function (p) { return { id: p.id, label: p.fiction ? 'A new story' : 'A new essay', title: p.title, url: p.url }; }),
      catalog.words.map(function (w) { return { id: w.id, label: 'A new word', title: w.word, url: w.url }; }),
      catalog.notes.map(function (n) { return { id: n.id, label: 'A new note', title: longDate(n.date), url: n.url }; }),
      catalog.quizzes.map(function (q) { return { id: q.id, label: 'A new quiz', title: q.title, url: q.url }; })
    );
    var ids = things.map(function (t) { return t.id; });
    var day = today();
    var returning = false;
    var fresh = [];
    KEEP.update(function (state) {
      if (!state.seen) { state.seen = { day: day, known: ids, fresh: [] }; return; }
      returning = true;
      if (state.seen.day !== day) {
        var known = Object.create(null);
        state.seen.known.forEach(function (id) { known[id] = true; });
        state.seen = { day: day, known: ids, fresh: ids.filter(function (id) { return !known[id]; }) };
      }
      fresh = state.seen.fresh;
    });
    if (returning) document.getElementById('house-welcome').textContent = 'Welcome back.';
    var shown = things.filter(function (t) { return fresh.indexOf(t.id) !== -1; });
    if (!shown.length) return;
    var list = document.getElementById('house-since-list');
    list.replaceChildren();
    shown.slice(0, 6).forEach(function (t) {
      var li = element('li', '', t.label + ': ');
      var link = element('a', '', t.title);
      link.href = t.url;
      li.appendChild(link);
      list.appendChild(li);
    });
    if (shown.length > 6) list.appendChild(element('li', '', 'and ' + (shown.length - 6) + ' more.'));
    document.getElementById('house-since').hidden = false;
  }

  function longDate(value) {
    var p = String(value).split('-');
    if (p.length !== 3) return value;
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])));
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

  function exportBackup() {
    var saved = download(new Blob([JSON.stringify(KEEP.backup(), null, 2)], { type: 'application/json;charset=utf-8' }), 'your-drawer.json');
    announce(saved ? 'Your drawer backup is saved to your downloads.' : 'This browser cannot save a file from here.');
  }
  function restoreDrawer(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { announce('This backup is too large to restore.'); return; }
    announce('Reading your drawer backup…');
    var reader = new FileReader();
    reader.onerror = function () { announce('This file could not be read. Your drawer is unchanged.'); };
    reader.onload = function () {
      try {
        var value = JSON.parse(reader.result);
        var added = KEEP.restoreBackup(value);
        // A restore re-renders the dialog, so focus its new restore button.
        var button = content.querySelector('[data-export="restore"]');
        if (button) button.focus({ preventScroll: true });
        announce(restored(added));
      } catch (e) {
        announce(e && /QuotaExceeded|Security/.test(e.name)
          ? 'This browser could not save the restored items. Your drawer is unchanged.'
          : 'This is not a valid drawer backup. Your drawer is unchanged.');
      }
      var input = content.querySelector('[data-drawer-file]');
      if (input) input.value = '';
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
      var article = element('article');
      article.appendChild(element('p', 'house-item-kind', item.kind));
      article.appendChild(element('h2', item.id.indexOf('word-') === 0 ? 'is-word' : '', item.title));
      if (item.quote) article.appendChild(element('p', '', quoted(item)));
      if (item.note) {
        article.appendChild(element('p', 'house-item-kind', 'Your note'));
        article.appendChild(element('p', 'house-print-note', item.note));
      }
      article.appendChild(element('p', 'house-print-address', location.host + item.href));
      sheet.appendChild(article);
    });
    document.body.appendChild(sheet);
    document.documentElement.classList.add('house-printing');
    window.addEventListener('afterprint', function done() {
      document.documentElement.classList.remove('house-printing');
      window.removeEventListener('afterprint', done);
    });
    // A modal dialog prints over the page, so the drawer closes first.
    dialog.close();
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

  /* --- Moving about ------------------------------------------------------ */

  function centerPicture() {
    var currentScene = location.hash === '#balcony' ? balconyScene : location.hash === '#study' ? scene : null;
    if (currentScene) currentScene.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  function setView(focus) {
    var hash = location.hash;
    var inside = hash === '#study' || hash === '#drawer';
    var outside = hash === '#balcony';
    entrance.hidden = inside || outside;
    study.hidden = !inside;
    balcony.hidden = !outside;
    weatherFollows(outside ? VIEWS.balcony : VIEWS.study);
    if (outside) paint();
    if (hash === '#drawer') {
      if (!dialog.open) openObject('drawer', document.getElementById('drawer'));
      return;
    }
    if (focus) {
      var target = document.getElementById(outside ? 'house-balcony-title' : inside ? 'house-room-title' : 'house-enter');
      target.focus({ preventScroll: true });
      if (inside || outside) centerPicture();
      else root.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  function syncCount() {
    var count = KEEP.read().kept.length;
    root.querySelectorAll('[data-kept-count]').forEach(function (node) { node.textContent = count; });
  }

  /* The places in the pictures are quiet until a pointer or the keyboard
     finds them; "Show places to look" shows every name, in both rooms, until
     the reader hides them again. Their browser remembers the choice, so the
     names are still there after The Page or another visit; the same choice
     holds in the Farm House and the pictures. */
  var PLACES_KEY = 'olae-places';
  function showPlaces(show) {
    root.classList.toggle('show-places', show);
    root.querySelectorAll('[data-places]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(show));
      button.textContent = show ? 'Hide places to look' : 'Show places to look';
    });
    try {
      if (show) localStorage.setItem(PLACES_KEY, 'shown');
      else localStorage.removeItem(PLACES_KEY);
    } catch (e) { /* storage blocked: the names stay for this visit */ }
  }
  try {
    if (localStorage.getItem(PLACES_KEY) === 'shown') showPlaces(true);
  } catch (e) { /* storage blocked: the names start hidden */ }

  root.addEventListener('click', function (event) {
    if (event.target.closest('[data-places]')) { showPlaces(!root.classList.contains('show-places')); return; }
    var trigger = event.target.closest('[data-open]');
    if (trigger) { openObject(trigger.getAttribute('data-open'), trigger); return; }
    // Out through the glass door to the balcony, and back in.
    var go = event.target.closest('[data-go]');
    if (go) {
      event.preventDefault();
      history.pushState(null, '', go.getAttribute('href'));
      setView(true);
      return;
    }
    // Only the lamp's own buttons: the scene carries data-lamp too, as the
    // lamp's state, and a touch anywhere in the room is not a hand on the lamp.
    if (event.target.closest('button[data-lamp]')) {
      var on = scene.dataset.lamp !== 'on';
      KEEP.update(function (state) { state.lamp = on; });
      paint();
      announce(on ? 'The lamp is on.' : 'The lamp is off.');
      return;
    }
    if (event.target.closest('button[data-balcony-lamp]')) {
      var lit = balconyScene.dataset.balconyLamp !== 'on';
      KEEP.update(function (state) { state.balconyLamp = lit; });
      paint();
      announce(lit ? 'The balcony lamp is on.' : 'The balcony lamp is off.');
      return;
    }
    var answer = event.target.closest('[data-answer]');
    if (answer && !answer.disabled) {
      var id = answer.closest('[data-question]').getAttribute('data-question');
      KEEP.update(function (state) { state.answered = { day: today(), id: id, choice: choiceText(answer) }; });
      showAnswer(answer, true);
      return;
    }
    var write = event.target.closest('[data-note]');
    if (write) { openNote(write); return; }
    if (event.target.closest('[data-marks]')) {
      var show = !KEEP.marksShown();
      KEEP.setMarks(show);
      var again = content.querySelector('[data-marks]');
      if (again) again.focus({ preventScroll: true });
      announce(show ? 'Highlights shown on every page.' : 'Highlights hidden on every page.');
      return;
    }
    var remove = event.target.closest('[data-remove]');
    if (remove) {
      // A note is the reader's own writing, so taking it out asks twice.
      var kept = KEEP.find(remove.getAttribute('data-remove'));
      if (kept && kept.note && remove.getAttribute('data-armed') !== 'true') {
        remove.setAttribute('data-armed', 'true');
        remove.textContent = 'Remove it and the note';
        announce('Your note would go with it.');
        remove.addEventListener('blur', function disarm() {
          remove.removeAttribute('data-armed');
          remove.textContent = 'Remove';
          remove.removeEventListener('blur', disarm);
        });
        return;
      }
      var position = Array.prototype.indexOf.call(content.querySelectorAll('[data-remove]'), remove);
      KEEP.remove(remove.getAttribute('data-remove'));
      var left = content.querySelectorAll('[data-remove]');
      (left[Math.min(position, left.length - 1)] || document.getElementById('house-close')).focus({ preventScroll: true });
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
      else if (action === 'restore') content.querySelector('[data-drawer-file]').click();
      else exportText();
    }
  });

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
        var again = content.querySelector('[data-note="' + id + '"]');
        if (again) again.focus({ preventScroll: true });
        announce(words ? 'Your note is in your drawer.' : 'No note on this one.');
      }
    });
    article.insertBefore(editor, article.querySelector('.house-item-actions'));
    button.hidden = true;
    editor.focusNote();
  }

  /* Whatever changes the drawer (a keep here, a removal, another tab) comes
     through one place. */
  KEEP.subscribe(function () {
    syncCount();
    paint();
    if (dialog.open && activeObject === 'drawer') {
      content.replaceChildren();
      renderDrawer(content);
    } else {
      KEEP.sync(content);
    }
  });

  document.getElementById('house-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    activeObject = '';
    if (location.hash === '#drawer') history.replaceState(null, '', '#study');
    if (opener && !opener.hidden) opener.focus({ preventScroll: true });
  });
  ['house-enter', 'house-leave'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function (event) {
      event.preventDefault();
      history.pushState(null, '', this.getAttribute('href'));
      setView(true);
    });
  });
  window.addEventListener('hashchange', function () {
    if (dialog.open && location.hash !== '#drawer') dialog.close();
    setView(true);
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { paint(); wallClock(); } });
  window.setInterval(paint, 60000);

  root.querySelectorAll('.house-js').forEach(function (node) { node.hidden = false; });
  if (KEEP.read().kept.length) document.getElementById('house-welcome').textContent = 'Welcome back.';
  if (!KEEP.works()) status.textContent = storageNote();
  syncCount();
  paint();
  keepTime();
  setView(false);
  // On a fresh visit through a room link, land on its picture rather than
  // the heading. Leave browser history and reload scroll restoration alone.
  if (location.hash === '#study' || location.hash === '#balcony') {
    window.addEventListener('load', function () {
      var entries = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation');
      if (!entries || !entries[0] || entries[0].type === 'navigate') centerPicture();
    }, { once: true });
  }
  whenCatalog(arrivals);
  offerWindow();
  document.addEventListener('DOMContentLoaded', offerWindow);
})();
