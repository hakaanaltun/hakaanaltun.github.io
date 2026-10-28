/* The House: the study and the balcony beside it. The pictures are in
   house/index.html; this puts things in them.

   What changes by the day (the word cards, the question on the wall, the
   two lines on the shelf) comes from /house/catalog.json and follows
   İstanbul's calendar, so every reader finds the same room on the same day
   and a different one tomorrow. What changes by the hour (the sky in the
   window and over the balcony, the lamp, where Moris is) follows İstanbul's
   sun and moon, through js/astronomy.js. What is in the drawer belongs to
   js/keep.js, which the rest of the site keeps things through too, and the
   drawer is laid out by js/drawer.js, which every page opens it with; the
   room only opens it. */
(function () {
  'use strict';
  var root = document.getElementById('house');
  var KEEP = window.OLAE_KEEP;
  var DRAWER = window.OLAE_DRAWER;
  if (!root || !KEEP || !DRAWER) return;
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
    notebook: ['On the table', 'The notebook'],
    stars: ['In the sky', 'The stars'],
    sun: ['In the sky', 'The sun'],
    moon: ['In the sky', 'The moon']
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

  var lineItem = DRAWER.lineItem;
  var wordItem = DRAWER.wordItem;
  var questionItem = DRAWER.questionItem;

  /* The desk and the door put out only the words in a collection; the
     rest stay in the index above, so a word already kept still shows its
     story in the drawer. */
  function collectedWords() { return catalog.words.filter(function (w) { return w.collected; }); }

  function whenCatalog(fn) { if (catalog !== null) fn(); else waiting.push(fn); }
  function arrived(data) {
    catalog = data && Array.isArray(data.words) ? data : false;
    if (catalog) index = DRAWER.indexOf(catalog);
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

  /* A kept thing shows its current words where the catalog still knows it
     (js/drawer.js). */
  function current(item) { return DRAWER.currentIn(index, item); }

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
    todays(collectedWords(), 11, 3).forEach(function (w) {
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

  /* The sun and the moon lead on to their pictures only while the
     balcony's glass is open. While Moris is out here the glass is closed,
     and a touch on either says where it stands and why the way is shut. */
  function renderBody(name) {
    return function (box) {
      var sky = skyNow(new Date());
      var at = name === 'sun' ? sky.sun : sky.moonAt;
      var title = name === 'sun' ? 'The sun' : 'The moon';
      box.appendChild(element('p', 'house-object-intro', title + (at ? ' is ' + where(at.alt, at.az) : ' is up') + ' over İstanbul.'));
      var facts = element('dl', 'house-sky-facts');
      function fact(term, value) {
        if (!value) return;
        facts.appendChild(element('dt', '', term));
        facts.appendChild(element('dd', '', value));
      }
      if (name === 'sun') fact('Sunset', sky.sunset && clock(sky.sunset));
      else fact('Phase', sky.moon);
      if (facts.children.length) box.appendChild(facts);
      box.appendChild(element('p', '', 'The glass is closed while Moris is out here. When he goes back in, you can go on to the ' + name + '.'));
    };
  }

  var MORIS = {
    cushion: { place: 'On his cushion', line: 'He is resting on his cushion below the window.' },
    balcony: { place: 'On the balcony', line: 'He is asleep on a chair out on the balcony for the middle of the day.' },
    'balcony-late': { place: 'On the balcony', line: 'He is lying by the balcony glass, looking out.' },
    sill: { place: 'At the window', line: 'He is asleep by the window as the sun goes down.' },
    shelf: { place: 'On the bookshelf', line: 'He is on top of the bookshelf, inspecting the room.' },
    rug: { place: 'On the rug', line: 'He is on the rug.' }
  };
  function renderMoris(box) {
    box.appendChild(document.getElementById('house-moris').content.cloneNode(true));
    var where = scene.dataset.moris;
    // Midday finds him on the chair; his other balcony visits are by the glass.
    if (where === 'balcony' && balconyScene.dataset.morisSpot === 'glass') where = 'balcony-late';
    var about = MORIS[where] || MORIS.cushion;
    document.getElementById('house-dialog-place').textContent = about.place;
    box.querySelector('[data-moris-line]').textContent = about.line;
  }

  /* The notebook on the balcony's table. What is written stays on its page,
     in the drawer's record, until the reader keeps it as a note in the
     drawer or goes on to The Page with it, as every note on the site can
     (KEEP.toPage): there it is added after whatever is already written,
     and The Page opens at its end. A kept page stays open in the notebook
     for the rest of the visit, saying so, and what is changed there is
     changed in the drawer. "A new page" and "Take out" stand where Keep
     was, as the panel by a kept passage offers Take out (js/keep.js);
     taken out, the words stay in the notebook. The author asked for this
     on 12 October 2026, when a kept note vanished from the notebook with
     only a line at its foot. "Open your drawer" is there from the start,
     so the earlier notes can be read and changed while a new one is
     written; the drawer leads back to the notebook, where the page being
     written waits. */
  var notebookKept = '';
  var notebookCheck = null;
  function renderNotebook(box) {
    box.appendChild(document.getElementById('house-notebook').content.cloneNode(true));
    var area = box.querySelector('[data-notebook-text]');
    var page = box.querySelector('[data-notebook-page]');
    var keep = box.querySelector('[data-notebook-keep]');
    var drawer = box.querySelector('[data-notebook-drawer]');
    var fresh = box.querySelector('[data-notebook-fresh]');
    var out = box.querySelector('[data-notebook-out]');
    var said = box.querySelector('[data-notebook-said]');
    var hint = box.querySelector('[data-notebook-hint]');
    var label = box.querySelector('[data-notebook-label]');
    var kept = notebookKept ? KEEP.find(notebookKept) : null;
    if (!kept) notebookKept = '';
    area.value = kept ? kept.note || '' : KEEP.notebook();
    function show() {
      keep.hidden = !!notebookKept;
      fresh.hidden = out.hidden = !notebookKept;
      // Kept, it is named as a note is in the drawer and the panel.
      label.textContent = notebookKept ? 'Your note' : 'Write a note';
      hint.textContent = !KEEP.works()
        ? 'This browser cannot save your note. What you write here stays until you leave the page.'
        : notebookKept
          ? 'What you change here is changed in your drawer too. Write at length on The Page takes the note there, after anything already written.'
          : 'The notebook keeps your words in this browser until you put them in your drawer, where your earlier notes are. Write at length on The Page takes them there, after anything already written.';
    }
    show();
    /* A kept page taken out of the drawer elsewhere, in another tab, goes
       back to being the notebook's own at once, and the notebook says so. */
    notebookCheck = function () {
      if (!notebookKept || KEEP.find(notebookKept)) return;
      var lost = document.activeElement === fresh || document.activeElement === out;
      notebookKept = '';
      KEEP.setNotebook(area.value);
      said.textContent = 'Taken out of your drawer. The page stays in the notebook.';
      show();
      if (lost) keep.focus({ preventScroll: true });
    };
    var timer = 0;
    // A kept page saves to its note in the drawer; the page being written,
    // to the notebook. A kept page taken out of the drawer meanwhile goes
    // back to being the notebook's own.
    function save() {
      clearTimeout(timer);
      if (notebookKept && KEEP.setNote(notebookKept, area.value, true)) return;
      if (notebookKept) { notebookKept = ''; show(); }
      KEEP.setNotebook(area.value);
    }
    area.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(save, 300);
      // "Write something first" has been answered.
      if (!notebookKept) said.textContent = '';
    });
    area.addEventListener('blur', save);
    keep.addEventListener('click', function () {
      var words = area.value.trim();
      if (!words) {
        said.textContent = 'Write something first.';
        area.focus();
        return;
      }
      clearTimeout(timer);
      notebookKept = 'notebook-' + Date.now().toString(36);
      KEEP.toggle({ id: notebookKept, kind: 'The notebook', title: 'On the balcony, ' + longDate(today()), quote: '', href: '/house/#balcony', note: words });
      KEEP.setNotebook('');
      said.textContent = 'Kept in your drawer.';
      show();
      // Keep has gone, so the focus goes to what stands in its place.
      drawer.focus({ preventScroll: true });
    });
    drawer.addEventListener('click', function () {
      save();
      // The drawer opens in the same box, with a way back to the notebook,
      // and closing it returns to the notebook's place on the balcony.
      openObject('drawer', opener, 'notebook');
    });
    out.addEventListener('click', function () {
      save();
      if (notebookKept) KEEP.remove(notebookKept);
      notebookKept = '';
      KEEP.setNotebook(area.value);
      said.textContent = 'Taken out of your drawer. The page stays in the notebook.';
      show();
      keep.focus({ preventScroll: true });
    });
    fresh.addEventListener('click', function () {
      save();
      notebookKept = '';
      area.value = '';
      KEEP.setNotebook('');
      said.textContent = '';
      show();
      area.focus();
    });
    page.addEventListener('click', function (event) {
      var words = area.value.trim();
      if (!words) return;
      save();
      if (!KEEP.toPage(words, page)) {
        event.preventDefault();
        said.textContent = 'This browser cannot take your note to The Page. Select it and copy it by hand.';
        return;
      }
      // A kept page stays in the drawer; the notebook's own page goes on.
      if (!notebookKept) KEEP.setNotebook('');
    });
  }

  /* An instrument, or a page without the site's menu, opens the drawer
     here with from= and back= in the address (js/keep.js, wayBack), so the
     drawer offers the way back, as the drawer opened from the notebook
     does. back= keeps the instrument's own way back. */
  var INSTRUMENTS = { write: 'The Page', draw: 'The Draw', desk: 'The Desk', read: 'The Reader', prompt: 'The Prompter', lots: 'The Lots', list: 'The List', clean: 'The Clean', diff: 'The Diff' };
  var PAGES = { piece: 'the piece', word: 'the word', quiz: 'the quiz', book: 'the book' };
  /* Not "arrived": that name is the catalogue's callback above, and
     reusing it replaced the function before a failed fetch could call it,
     so the rooms never showed their way to the full lists. */
  var openedWith = new URLSearchParams(location.search);
  var cameFromSlug = openedWith.get('from') || '';
  var cameBack = KEEP.backAddress(openedWith.get('back'));
  var own = Object.prototype.hasOwnProperty;
  var cameFrom = own.call(INSTRUMENTS, cameFromSlug) ? [cameBack || '/' + cameFromSlug + '/', '← Back to ' + INSTRUMENTS[cameFromSlug], cameFromSlug]
    : own.call(PAGES, cameFromSlug) && cameBack ? [cameBack, '← Back to ' + PAGES[cameFromSlug], cameFromSlug] : null;

  /* The drawer itself is js/drawer.js's, the same drawer every page opens.
     The House gives it this box and the way back: to the notebook it was
     opened from, or to the instrument or the page that sent the reader
     here. It also gives the drawer's own address, which opens it again
     over the same room with the same way back. */
  function renderDrawer(box) {
    var back = null;
    if (backTo === 'notebook') {
      back = element('button', 'house-back', '← Back to the notebook');
      back.type = 'button';
      back.addEventListener('click', function () { openObject('notebook', opener); });
    } else if (cameFrom) {
      back = element('a', 'house-back', cameFrom[1]);
      back.href = cameFrom[0];
    }
    DRAWER.render(box, { dialog: dialog, back: back, address: drawerAddress, current: current, announce: announce });
  }
  /* The drawer's address names the room it is open over, in=balcony or
     in=door (the study needs none), and its way back: the notebook, or
     the instrument or page with its own address. */
  function drawerAddress() {
    var params = new URLSearchParams();
    if (shownView === balcony) params.set('in', 'balcony');
    else if (shownView === entrance) params.set('in', 'door');
    if (backTo === 'notebook') params.set('from', 'notebook');
    else if (cameFrom) {
      params.set('from', cameFrom[2]);
      params.set('back', cameFrom[0]);
    }
    var query = params.toString();
    return '/house/' + (query ? '?' + query : '') + '#drawer';
  }
  /* The room an address with #drawer opens the drawer over. */
  function drawerRoom() {
    var room = new URLSearchParams(location.search).get('in');
    return room === 'balcony' || room === 'door' ? room : 'study';
  }

  var renderers = { books: renderBooks, words: renderWords, question: renderQuestion, window: renderWindow, moris: renderMoris, notebook: renderNotebook, drawer: renderDrawer, stars: renderStars, sun: renderBody('sun'), moon: renderBody('moon') };
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

  /* back names the object the box was opened from, when it can lead back
     to it: the drawer opened from the notebook offers the way back. */
  var backTo = '';
  function openObject(name, button, back) {
    if (!labels[name]) return;
    activeObject = name;
    opener = button;
    backTo = back || '';
    document.getElementById('house-dialog-place').textContent = labels[name][0];
    document.getElementById('house-dialog-title').textContent = labels[name][1];
    dialogStatus.textContent = '';
    fill(name);
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    document.getElementById('house-close').focus({ preventScroll: true });
  }

  /* --- The sky, the lamp and the cat ------------------------------------ */

  /* The window and the balcony look out over the same view at the same
     size: the balcony draws it with its horizon at 285, the window with
     its horizon at 222. So the sun and the moon stand in the window just
     where they stand over the balcony, 63 higher, and show in it only
     while they are in the window's part of the sky, from the
     south-southwest toward the west. The author asked for this on
     12 October 2026; until then each stood in the casement on its side. */
  var WINDOW_LIFT = 285 - 222;
  /* Over the balcony the sky is drawn whole across its front glass: east
     at the wall on the left, west at the corner on the right, and from the
     horizon at the sea up to the ceiling, so the sun, the moon and the
     stars are where they stand. */
  var OPEN = { left: 262.5, right: 737.5, horizon: 285, top: 125 };
  function skyPoint(alt, az) {
    return { x: OPEN.left + (az - 90) / 180 * (OPEN.right - OPEN.left), y: OPEN.horizon - alt / 90 * (OPEN.horizon - OPEN.top) };
  }
  /* From his cushion to each of his other places. The room is drawn in
     perspective, so he is smaller up at the window and on the bookshelf,
     and larger out on the carpet, near the front of the room. */
  var PLACES = { sill: 'translate(25.7 -107) scale(.891)', shelf: 'translate(-478.8 -311.3) scale(.924)', rug: 'translate(-711.1 -82.2) scale(1.467)', cushion: 'translate(109.7 23.83) scale(.88)' };
  /* Out on the balcony he sleeps on the empty chair through the middle of
     the day; on his other visits he lies on the coping by the glass,
     turned toward the room. */
  var BALCONY_SPOTS = { chair: 'translate(-15.2 129.9) scale(.76)', glass: 'translate(1012.7 29.3) scale(-.735 .735)' };
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
     early morning, out on the balcony from ten to eleven, and again from
     noon to two, back on his cushion, out again from two hours
     before sunset until half an hour before it, asleep at the window as the
     sun goes down, up on the bookshelf once the lamps are on, and out on
     the carpet after midnight. Two more balcony visits run from nine to
     ten at night and from two to three in the morning, by İstanbul's clock.
     The balcony's glass is closed and its door
     stands open while he is out there; while he is indoors the door is shut
     and the glass is folded away. */
  var MINUTE = 60000;
  function morisPlace(sky, now) {
    var late = sky.sunset ? now >= sky.sunset - 120 * MINUTE && now < sky.sunset - 30 * MINUTE : sky.hour >= 16 && sky.hour < 18;
    var daylight = sky.period === 'morning' || sky.period === 'day';
    var morning = sky.hour >= 10 && sky.hour < 11;
    var midday = sky.hour >= 12 && sky.hour < 14;
    var night = (sky.hour >= 21 && sky.hour < 22) || (sky.hour >= 2 && sky.hour < 3);
    if ((daylight && morning) || (sky.period === 'day' && midday) || late || night) return 'balcony';
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
  /* On the minute, not a minute after the page happened to open. The wall
     clock, the time in both rooms' bars, the sky and Moris all turn over
     together, so the two clocks never disagree. */
  function keepTime() {
    paint();
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
    scene.dataset.sun = sunState(sky);
    if (sunIn) {
      var at = skyPoint(sky.sun.alt, sky.sun.az);
      var sun = scene.querySelector('.house-sun');
      sun.setAttribute('cx', at.x.toFixed(1)); sun.setAttribute('cy', (at.y - WINDOW_LIFT).toFixed(1));
    }
    if (moonIn) {
      var m = skyPoint(sky.moonAt.alt, sky.moonAt.az);
      placeMoon(scene, sky.age, +m.x.toFixed(1), +(m.y - WINDOW_LIFT).toFixed(1), 13);
    }
    if (moonIn) scene.dataset.moon = 'up'; else delete scene.dataset.moon;
  }

  /* A name in the balcony's sky sits beside what it names, on the side
     toward the middle; out of sight behind the house it waits at the edge
     of the view on that body's side. */
  function placeSkyName(name, alt, az, r) {
    var hotspot = balconyScene.querySelector('.house-hotspot--' + name);
    var item = balcony.querySelector('[data-sky-item="' + name + '"]');
    var shown = alt !== null;
    hotspot.hidden = !shown;
    if (item) item.hidden = !shown;
    if (!shown) return null;
    var at = skyPoint(alt, Math.min(270, Math.max(90, az)));
    var side = inFront(az) ? (at.x < 560 ? 'right' : 'left') : (az < 90 ? 'right' : 'left');
    hotspot.dataset.side = inFront(az) ? side : 'edge-' + side;
    hotspot.style.setProperty('--sky-x', (at.x / 10).toFixed(2));
    hotspot.style.setProperty('--sky-y', (at.y / 6.5).toFixed(2));
    hotspot.style.setProperty('--sky-r', (r / 10).toFixed(2));
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
    heardSky = { period: sky.period, hour: sky.hour, month: +parts(now, { month: 'numeric' }).month };
    document.getElementById('house-hour').textContent = name + ' in İstanbul';
    document.getElementById('house-clock').textContent = clock(now);
    balcony.querySelector('[data-house-hour]').textContent = name + ' in İstanbul';
    balcony.querySelector('[data-house-clock]').textContent = clock(now);
    if (sky.sun) {
      paintWindow(sky);
      paintBalcony(sky);
    }
    var place = morisPlace(sky, now);
    scene.dataset.moris = place;
    balconyScene.dataset.moris = place;
    var spot = place === 'balcony' ? (sky.hour < 12 || sky.hour >= 14 ? 'glass' : 'chair') : null;
    if (spot) {
      balconyScene.dataset.morisSpot = spot;
      balconyScene.querySelector('.house-moris').setAttribute('transform', BALCONY_SPOTS[spot]);
    } else delete balconyScene.dataset.morisSpot;
    balcony.querySelector('[data-moris-item]').hidden = place !== 'balcony';
    balcony.querySelectorAll('.house-hotspot--sun, .house-hotspot--moon, [data-sky-item="sun"] a, [data-sky-item="moon"] a').forEach(function (link) {
      if (place === 'balcony') link.setAttribute('aria-haspopup', 'dialog'); else link.removeAttribute('aria-haspopup');
    });
    study.querySelector('.house-objects [data-open="moris"]').parentNode.hidden = place === 'balcony';
    var cat = scene.querySelector('.house-moris');
    if (PLACES[place]) cat.setAttribute('transform', PLACES[place]); else cat.removeAttribute('transform');
    /* Each lamp is on in the evening and at night until the reader turns it
       off, and off by day until they turn it on; the drawer remembers the
       choice. The balcony's lamp has its switch on the balcony wall beside
       the door, and each room's lamp shows in the other through the door's
       glass. */
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
    wearTheme();
    hear();
  }

  /* --- Weather at the window ------------------------------------------
     On this page the footer's rain and snow fall outside the window rather
     than over the whole page: js/let-it-snow.js hands them over, and keeps
     its buttons and their labels as they are everywhere else. On the
     balcony they fall beyond the parapet and past the glass at its side,
     and the snow gathers along the foot of the glass at the front and at
     the side. When the footer's weather stops, the rooms follow İstanbul's
     weather again. The balcony's glass takes in more of the sky than the
     window, so more falls there and the fall is as thick. */

  var VIEWS = {
    study: { scene: scene, layer: scene.querySelector('.house-weather'), snow: scene.querySelector('.house-window-snow'),
      box: { left: 560, right: 826, top: 108, bottom: 321 }, drift: { left: 560, right: 826, base: 321 }, where: ' at the study window.' },
    balcony: { scene: balconyScene, layer: balconyScene.querySelector('.house-weather'), snow: balconyScene.querySelector('.house-balcony-snow'),
      box: { left: 232.5, right: 1000, top: 0, bottom: 474 }, more: 2,
      drift: { left: 232.5, right: 767.5, base: 379.4, side: { right: 1000, base: 461.4, grow: 1.87 } }, where: ' over the city.' }
  };
  var view = VIEWS.study;
  // The pine outside the balcony holds the snow on its pads as it falls.
  // Each pad carries its own cushion, so a pad in front hides the snow on
  // the one behind it.
  var pineSnow = balconyScene.querySelectorAll('.house-pine-snow');
  var pineSnowShown = '0.00';
  var weather = { kind: null, level: 0, drops: [], frame: 0, last: 0, snow: 0 };
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The drops are drawn in a few layers by depth, each one path, rather
     than as an element apiece: a heavy fall on the balcony is hundreds of
     drops, and moving each of them on every frame held a phone's page at
     full load. The far layers are fainter and finer, and go first. */
  var LAYERS = 6;
  var layers = [];
  function makeLayers() {
    var rain = weather.kind === 'rain';
    for (var i = 0; i < LAYERS; i++) {
      var depth = (i + 0.5) / LAYERS;
      var node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      node.setAttribute('class', rain ? 'house-rain' : 'house-snowfall');
      if (rain) node.setAttribute('stroke-width', (0.6 + depth * 0.8).toFixed(2));
      node.setAttribute('opacity', ((rain ? 0.35 : 0.55) + depth * 0.4).toFixed(2));
      view.layer.appendChild(node);
      layers.push(node);
    }
  }
  /* Each drop carries its own shape, drawn on from where it is: a rain
     streak trailing back up into the wind, or a flake's circle from its
     left edge. */
  function makeDrop(anywhere) {
    var rain = weather.kind === 'rain', heavy = weather.level === 2, depth = Math.random();
    var drop = { phase: Math.random() * 6.3, layer: Math.min(LAYERS - 1, Math.floor(depth * LAYERS)) };
    drop.speed = rain ? (170 + depth * 150) * (heavy ? 1.4 : 1) : (11 + depth * 15) * (heavy ? 1.7 : 1);
    if (rain) {
      var length = 9 + depth * 9;
      drop.from = 0;
      drop.shape = 'l' + (-length * 0.14).toFixed(1) + ' ' + (-length).toFixed(1);
    } else {
      var r = ((0.9 + depth * 1.4) * (heavy ? 1.25 : 1)).toFixed(2);
      drop.from = +r;
      drop.shape = 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0';
    }
    placeDrop(drop, anywhere);
    return drop;
  }
  // Rain leans with the wind, so it starts a little to the left of the glass.
  function placeDrop(drop, anywhere) {
    var box = view.box;
    drop.x = box.left - 30 + Math.random() * (box.right - box.left + 30);
    drop.y = anywhere ? box.top + Math.random() * (box.bottom - box.top) : box.top - 10 - Math.random() * 30;
  }
  function drawDrops() {
    var paths = [];
    for (var i = 0; i < LAYERS; i++) paths.push('');
    weather.drops.forEach(function (drop) {
      paths[drop.layer] += 'M' + (drop.x - drop.from).toFixed(1) + ' ' + drop.y.toFixed(1) + drop.shape;
    });
    layers.forEach(function (node, i) { node.setAttribute('d', paths[i]); });
  }
  /* Snow gathers along the foot of the glass while it falls, deeper in a
     heavy fall, and melts away once it stops. */
  function drawWindowSnow() {
    var h = weather.snow, d = view.drift, base = d.base, side = d.side;
    if (h < 0.2) { view.snow.setAttribute('d', ''); return; }
    var path = 'M' + d.left + ' ' + base + 'V' + (base - h).toFixed(1) +
      'Q' + (d.left + 45) + ' ' + (base - h * 1.5).toFixed(1) + ' ' + (d.left + 91) + ' ' + (base - h).toFixed(1) +
      'T' + d.right + ' ' + (base - h).toFixed(1) + 'V' + base + 'Z';
    if (side) {
      var near = side.base - h * side.grow;
      path += 'M' + d.right + ' ' + base + 'L' + side.right + ' ' + side.base + 'V' + near.toFixed(1) +
        'Q' + (d.right + side.right) / 2 + ' ' + ((near + base - h) / 2 - h * 0.7).toFixed(1) + ' ' + d.right + ' ' + (base - h).toFixed(1) + 'Z';
    }
    view.snow.setAttribute('d', path);
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
    });
    drawDrops();
    var deepest = weather.kind === 'snow' ? (weather.level === 2 ? 14 : 6) : 0;
    weather.snow = weather.snow < deepest ? Math.min(deepest, weather.snow + seconds * (weather.level === 2 ? 0.12 : 0.05))
      : Math.max(deepest, weather.snow - seconds * 2);
    drawWindowSnow();
    var settled = Math.min(1, weather.snow / 4).toFixed(2);
    if (settled !== pineSnowShown) {
      pineSnowShown = settled;
      pineSnow.forEach(function (cushion) { cushion.setAttribute('opacity', settled); });
    }
    if (!still && (weather.drops.length || weather.snow > 0)) weather.frame = window.requestAnimationFrame(weatherStep);
    else weather.last = 0;
  }
  function seedWeather() {
    layers.forEach(function (node) { node.remove(); });
    layers = [];
    weather.drops = [];
    var kind = weather.kind, level = weather.level;
    var count = kind ? (kind === 'rain' ? (level === 2 ? 190 : 85) : (level === 2 ? 160 : 85)) * (view.more || 1) : 0;
    if (still) count = Math.round(count * 0.45);
    if (kind) makeLayers();
    for (var i = 0; i < count; i++) weather.drops.push(makeDrop(true));
    drawDrops();
    if (!weather.frame) weather.frame = window.requestAnimationFrame(weatherStep);
  }
  var liveWeather = null, manualWeather = false;
  var weatherSummary = document.getElementById('house-weather-summary');
  var checking = weatherSummary.textContent;
  var followWeather = document.getElementById('house-weather-follow');
  var temperatures = root.querySelectorAll('[data-house-temperature]');
  // İstanbul's sky in both rooms; before its first report, the sky the page
  // opened with.
  function showWeather(value, instant) {
    var kind = value ? value.kind : null, level = value ? value.level : 0, clouded = !!(value && value.clouded);
    if (instant) [scene, balconyScene].forEach(function (s) { s.dataset.skyInstant = ''; });
    weatherSummary.textContent = !value ? checking : value.available ? value.summary + ' in İstanbul. ' : 'İstanbul weather is unavailable. ';
    [scene, balconyScene].forEach(function (s) {
      if (clouded) s.dataset.clouded = ''; else delete s.dataset.clouded;
    });
    balconyScene.dataset.skyObscured = String(clouded || !!kind);
    balcony.dataset.skyObscured = String(clouded || !!kind);
    if (weather.kind !== kind || weather.level !== level) windowWeather(kind, level, true);
    if (instant) {
      scene.getBoundingClientRect();
      [scene, balconyScene].forEach(function (s) { delete s.dataset.skyInstant; });
    }
  }
  function applyLiveWeather(value) {
    // The first report replaces the sky the page opened with at once, so
    // rain never starts to fall while the sun is still fading.
    var first = !liveWeather;
    liveWeather = value;
    // İstanbul's temperature stands beside its time, whoever chose the weather.
    var degrees = value.available && value.temperature != null ? (value.temperature < 0 ? '−' + -value.temperature : value.temperature) + '°C' : '';
    temperatures.forEach(function (node) { node.textContent = degrees && '· ' + degrees; node.hidden = !degrees; });
    if (!manualWeather) showWeather(value, first);
    hear();
  }
  // Stopping the footer's weather hands the rooms back to İstanbul at once.
  function followCity() {
    manualWeather = false; followWeather.hidden = true;
    showWeather(liveWeather);
    paintChoices();
    announce('The House follows İstanbul’s weather again.');
  }
  /* The snow and the rain under the rooms are the footer's two buttons
     again, with the same signs, names and steps: light, heavy, then off,
     which hands the rooms back to İstanbul. A touch here presses the
     footer's own button, and these take its names after every change, so
     the two can never disagree. A reader who has used them out here knows
     them at the foot of every other page. */
  var choices = document.getElementById('house-weather-choice');
  var offered = false;
  // Under both rooms, where the weather falls; at the door there is no sky.
  function showChoices() {
    choices.hidden = !offered || (study.hidden && balcony.hidden);
  }
  function footerButton(button) {
    return document.getElementById('let-it-' + button.getAttribute('data-weather-choice'));
  }
  function paintChoices() {
    choices.querySelectorAll('[data-weather-choice]').forEach(function (button) {
      var twin = footerButton(button);
      if (!twin) return;
      ['aria-label', 'aria-pressed', 'title'].forEach(function (name) { button.setAttribute(name, twin.getAttribute(name)); });
    });
  }
  followWeather.addEventListener('click', function () {
    // Resetting the footer's buttons stops their weather, which follows the city.
    if (window.OLAE_WEATHER) window.OLAE_WEATHER.set('rain', 0); else followCity();
  });
  function windowWeather(kind, level, automatic) {
    if (!automatic && !kind) { followCity(); return; }
    if (!automatic) {
      manualWeather = true; followWeather.hidden = false;
      weatherSummary.textContent = 'Weather chosen by you. ';
      [scene, balconyScene].forEach(function (s) { delete s.dataset.clouded; });
      balconyScene.dataset.skyObscured = 'true';
      balcony.dataset.skyObscured = 'true';
    }
    weather.kind = kind;
    weather.level = level;
    [scene, balconyScene].forEach(function (s) { if (kind) s.dataset.weather = kind; else delete s.dataset.weather; });
    seedWeather();
    hear();
    paintChoices();
    if (automatic) return;
    announce((level === 2 ? 'Heavy ' : 'Light ') + kind + view.where);
    // The buttons are at the foot of the page and the sky may be out of
    // sight above them, so the room is brought up to show where it is falling.
    var section = view === VIEWS.study ? study : balcony;
    if (!section.hidden) {
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
    if (window.OLAE_WEATHER && window.OLAE_WEATHER.place) {
      window.OLAE_WEATHER.place(windowWeather);
      offered = !!document.getElementById('let-it-snow') && !!document.getElementById('let-it-rain');
      showChoices();
      paintChoices();
    }
  }
  /* The balcony's sound (js/house-sound.js) is told where the reader is,
     İstanbul's hour, month, temperature and weather, and whether the glass
     is closed. It is heard out on the balcony and not in the study. */
  var heardSky = { period: 'day', hour: 12, month: 1 };
  function hear() {
    if (!window.OLAE_HOUSE_SOUND || !weather) return;
    var temp = liveWeather && liveWeather.available && typeof liveWeather.temperature === 'number' ? liveWeather.temperature : null;
    window.OLAE_HOUSE_SOUND.update({
      outside: !balcony.hidden,
      glass: balconyScene.dataset.moris === 'balcony' ? 'closed' : 'open',
      weather: weather.kind, level: weather.level,
      period: heardSky.period, hour: heardSky.hour, month: heardSky.month, temp: temp
    });
  }

  /* --- Since the last visit ---------------------------------------------
     The house remembers what the site held on a reader's last day here and
     says, at the door, what has come since. It is worked out once a day, so
     the note is still there if the page is opened again the same day. */

  function arrivals() {
    if (!catalog) return;
    var things = [].concat(
      catalog.pieces.map(function (p) { return { id: p.id, label: p.fiction ? 'A new story' : 'A new essay', title: p.title, url: p.url }; }),
      collectedWords().map(function (w) { return { id: w.id, label: 'A new word', title: w.word, url: w.url }; }),
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

  /* --- Moving about ------------------------------------------------------ */

  function centerPicture() {
    var currentScene = location.hash === '#balcony' ? balconyScene : location.hash === '#study' ? scene : null;
    if (currentScene) currentScene.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  /* Leaving a room, for the other room or the door, its picture stays over
     the place coming in and fades away, as the farm's scenes do, so no bare
     paper shows between two pictures; at night that paper flashed white.
     The room is lifted out of the page while it fades: only its picture is
     seen, nothing in it can be reached, and from one room to the other it
     stands over the new room's picture. From the door, which is paper
     already, the room fades up from the paper. A page that opens on a room
     shows it at once, and a reader who asks for less motion is spared the
     fade. */
  var shownView = null;
  var leaving = null;
  var LIFTED = ['position', 'top', 'left', 'width', 'height', 'margin', 'padding', 'box-sizing', 'z-index', 'visibility', 'pointer-events'];
  function pictureOf(view) { return view.querySelector('.house-scene'); }
  function settleLeaving() {
    if (!leaving) return;
    var gone = leaving;
    leaving = null;
    gone.animation.cancel();
    LIFTED.forEach(function (property) { gone.view.style.removeProperty(property); });
    gone.picture.style.removeProperty('visibility');
    gone.view.inert = false;
    gone.view.hidden = gone.view !== shownView;
  }
  // Measured while the place is still in the page, at its own size.
  function measure(view) {
    var picture = pictureOf(view);
    var box = view.getBoundingClientRect();
    return picture && { view: view, picture: picture, width: box.width, height: box.height, padding: getComputedStyle(view).padding, at: picture.getBoundingClientRect() };
  }
  function fadeAway(was) {
    var view = was.view;
    var picture = was.picture;
    if (!view.animate) return;
    view.hidden = false;
    view.inert = true;
    view.style.position = 'absolute';
    view.style.top = '0px';
    view.style.left = '0px';
    view.style.margin = '0';
    view.style.boxSizing = 'border-box';
    view.style.width = was.width + 'px';
    // In full screen the picture is sized by the room's own height.
    view.style.height = was.height + 'px';
    view.style.padding = was.padding;
    view.style.zIndex = '2';
    view.style.pointerEvents = 'none';
    view.style.visibility = 'hidden';
    picture.style.visibility = 'visible';
    // From room to room the two pictures meet; on the way to the door the
    // picture stays where the reader saw it.
    var arriving = pictureOf(shownView);
    var goal = arriving ? arriving.getBoundingClientRect() : was.at;
    var now = picture.getBoundingClientRect();
    view.style.top = (goal.top - now.top) + 'px';
    view.style.left = (goal.left - now.left) + 'px';
    leaving = { view: view, picture: picture, animation: view.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 580, easing: 'cubic-bezier(.4, 0, .2, 1)' }) };
    leaving.animation.onfinish = settleLeaving;
  }

  function setView(focus) {
    settleLeaving();
    var hash = location.hash;
    var over = hash === '#drawer' ? drawerRoom() : '';
    var inside = hash === '#study' || over === 'study';
    var outside = hash === '#balcony' || over === 'balcony';
    var showing = outside ? balcony : inside ? study : entrance;
    // Full screen is for the rooms; the door ends it, without a fade
    // between the two sizes of the picture.
    var ending = screenMode && showing === entrance;
    var moving = shownView && showing !== shownView && !still && !ending;
    var was = moving ? measure(shownView) : null;
    entrance.hidden = inside || outside;
    study.hidden = !inside;
    balcony.hidden = !outside;
    shownView = showing;
    if (ending) leaveScreen();
    // The gold speck and its trail are for the rooms; at the door the
    // pointer is the reader's own (css/house.css).
    document.documentElement.classList.toggle('house-inside', inside || outside);
    wearTheme();
    weatherFollows(outside ? VIEWS.balcony : VIEWS.study);
    showChoices();
    hear();
    if (outside) paint();
    if (hash === '#drawer') {
      // Opened by its address, the drawer is over the room it names, with
      // the way back to the notebook when the notebook opened it.
      var notebook = over === 'balcony' && cameFromSlug === 'notebook';
      var from = over === 'study' ? document.getElementById('drawer')
        : notebook ? balcony.querySelector('.house-hotspot--notebook')
        : document.getElementById(over === 'balcony' ? 'house-balcony-title' : 'house-enter');
      if (!dialog.open) openObject('drawer', from, notebook ? 'notebook' : '');
    } else if (focus) {
      var target = document.getElementById(outside ? 'house-balcony-title' : inside ? 'house-room-title' : 'house-enter');
      target.focus({ preventScroll: true });
      if (screenMode) { /* the room already fills the screen */ }
      else if (inside || outside) centerPicture();
      else root.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    if (was) fadeAway(was);
    else if (moving && showing.animate) showing.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
  }

  /* The House's own colours (css/house.css). At the door the page wears
     the site's theme; in a room it wears the House's, which follows
     İstanbul's light: the rooms' cream by day, darker in the evening and
     a step darker at night, so the screen does not glare after dark (the
     author, 28 October 2026). The box over a room is a few shades lighter
     than the page. The lamps light the rooms, not the page.

     The header and footer are the page's own colour, with the page's ink
     for their words, as on White & Slate: the author asked for this on
     26 October 2026, in place of the beige and dark that had moved with
     İstanbul's sun since the day before. The browser's own bar takes the
     same colour, and at the door the site's theme points it back. */
  var HOUSE_CHROME = { day: '#F4EFE3', evening: '#D5D0C2', night: '#CAC5B7' };
  function wearTheme() {
    var page = document.documentElement;
    var hour = scene.dataset.hour;
    var theme = !page.classList.contains('house-inside') ? '' : hour === 'night' || hour === 'evening' ? hour : 'day';
    var was = page.getAttribute('data-house-theme') || '';
    if (theme) page.setAttribute('data-house-theme', theme);
    else page.removeAttribute('data-house-theme');
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    if (theme) {
      Array.prototype.forEach.call(metas, function (meta) { meta.setAttribute('content', HOUSE_CHROME[theme]); });
    } else if (was) {
      if (window.OLAE_SITE_SKY && window.OLAE_SITE_SKY.isOn()) window.OLAE_SITE_SKY.paintNow();
      else if (window.__themeColorSync) window.__themeColorSync();
    }
  }

  function syncCount() {
    var count = KEEP.read().kept.length;
    root.querySelectorAll('[data-kept-count]').forEach(function (node) { node.textContent = count; });
  }

  /* A hand on the balcony's globe changes nothing. While it is lit, the
     light only goes and comes back once or twice, in well under a second,
     as a loose bulb's would; an unlit globe stays dark. Nothing is kept,
     and a reader who asks for less motion is spared it. */
  var FLICKER = [80, 60, 140];
  var flickering = 0;
  function flicker() {
    if (flickering) return true;
    if (still || balconyScene.dataset.balconyLamp !== 'on') return false;
    balconyScene.dataset.flicker = '';
    var step = 0;
    (function next() {
      if (step === FLICKER.length) {
        // The lamp as it really is, settled before its light may ease again.
        paint();
        void balconyScene.getBoundingClientRect();
        delete balconyScene.dataset.flicker;
        flickering = 0;
        return;
      }
      balconyScene.dataset.balconyLamp = step % 2 ? 'on' : 'off';
      flickering = window.setTimeout(next, FLICKER[step++]);
    })();
    return true;
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

  /* Full screen, in the study and on the balcony, as in the pictures. The
     room fills the screen with its bar, its places, the way out and, on the
     balcony, its sound; the site's header and footer, the heading and the
     weather line wait until the reader leaves it (css/house.css). The page
     asks the browser for its own full screen, so the pointer's trail and
     the boxes come along; a browser that cannot give one, such as a
     phone's, has the room fill its window instead. Going from one room to
     the other keeps it, and the door, a page that opens or Escape ends it.
     Nothing is kept. */
  var screenMode = null;
  var screenFrom = null;
  var screenOutside = [];
  var screenOverflow = '';
  function nativeScreen() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function paintScreen() {
    root.querySelectorAll('[data-fullscreen]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(!!screenMode));
      button.textContent = screenMode ? 'Exit full screen' : 'Full screen';
    });
  }
  function startScreen(mode) {
    if (screenMode) return;
    screenMode = mode;
    screenOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Everything on the way out to the body that is not The House waits.
    for (var node = root; node !== document.body; node = node.parentElement) {
      Array.prototype.forEach.call(node.parentElement.children, function (sibling) {
        if (sibling === node || sibling.hasAttribute('inert')) return;
        screenOutside.push(sibling);
        sibling.setAttribute('inert', '');
      });
    }
    root.classList.add('is-fullscreen');
    paintScreen();
    var button = shownView.querySelector('[data-fullscreen]');
    if (button && !dialog.open) button.focus({ preventScroll: true });
  }
  function endScreen() {
    if (!screenMode) return;
    screenMode = null;
    root.classList.remove('is-fullscreen');
    screenOutside.forEach(function (node) { node.removeAttribute('inert'); });
    screenOutside = [];
    document.body.style.overflow = screenOverflow;
    paintScreen();
    // Back where the reader was, or at the room they went on to.
    if (shownView === entrance) root.scrollIntoView({ block: 'start', behavior: 'instant' });
    else if (screenFrom && shownView === screenFrom.view) window.scrollTo(screenFrom.x, screenFrom.y);
    else centerPicture();
    var button = shownView.querySelector('[data-fullscreen]');
    if (button && !dialog.open) button.focus({ preventScroll: true });
  }
  function enterScreen() {
    screenFrom = { view: shownView, x: window.scrollX, y: window.scrollY };
    var page = document.documentElement;
    var ask = page.requestFullscreen || page.webkitRequestFullscreen;
    if (!ask || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)) { startScreen('window'); return; }
    try {
      var asked = ask.call(page);
      // Safari's older call answers with its change event alone.
      if (asked && asked.then) asked.then(function () { if (nativeScreen()) startScreen('native'); }, function () { startScreen('window'); });
    } catch (e) { startScreen('window'); }
  }
  function leaveScreen() {
    if (screenMode !== 'native' || !nativeScreen()) { endScreen(); return; }
    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    try {
      var left = exit.call(document);
      if (left && left.then) left.then(endScreen, function () { if (!nativeScreen()) endScreen(); });
    } catch (e) { endScreen(); }
  }
  function screenChanged() {
    if (nativeScreen()) startScreen('native');
    else if (screenMode === 'native') endScreen();
  }
  document.addEventListener('fullscreenchange', screenChanged);
  document.addEventListener('webkitfullscreenchange', screenChanged);
  // The browser's own full screen ends with Escape; the window's does too,
  // once a box open over the room has closed.
  document.addEventListener('keydown', function (event) {
    if (screenMode !== 'window' || dialog.open || event.key !== 'Escape') return;
    event.preventDefault();
    leaveScreen();
  });

  root.addEventListener('click', function (event) {
    if (event.target.closest('[data-places]')) { showPlaces(!root.classList.contains('show-places')); return; }
    if (event.target.closest('[data-fullscreen]')) { if (screenMode) leaveScreen(); else enterScreen(); return; }
    var choice = event.target.closest('button[data-weather-choice]');
    if (choice) {
      var twin = footerButton(choice);
      if (twin) twin.click();
      return;
    }
    // A link in the box to the room the reader is already in, such as a
    // notebook page's "Go to the balcony" on the balcony, closes the box.
    var here = event.target.closest('#house-dialog a[href]');
    if (here && here.pathname === location.pathname && here.hash && here.hash === location.hash) {
      event.preventDefault();
      dialog.close();
      return;
    }
    // The sun and the moon wait behind the closed glass while Moris is out.
    var body = event.target.closest('.house-hotspot--sun, .house-hotspot--moon, [data-sky-item="sun"] a, [data-sky-item="moon"] a');
    if (body && balconyScene.dataset.moris === 'balcony') {
      event.preventDefault();
      var item = body.closest('[data-sky-item]');
      openObject(item ? item.getAttribute('data-sky-item') : body.classList.contains('house-hotspot--sun') ? 'sun' : 'moon', body);
      return;
    }
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
    if (event.target.closest('button[data-balcony-globe]')) {
      announce((flicker() ? 'The lamp flickers. ' : '') + 'Its switch is on the wall by the door.');
      return;
    }
    var answer = event.target.closest('[data-answer]');
    if (answer && !answer.disabled) {
      var id = answer.closest('[data-question]').getAttribute('data-question');
      KEEP.update(function (state) { state.answered = { day: today(), id: id, choice: choiceText(answer) }; });
      showAnswer(answer, true);
      return;
    }
  });

  /* Whatever changes the drawer (a keep here, a removal, another tab) comes
     through one place. */
  KEEP.subscribe(function () {
    syncCount();
    paint();
    if (dialog.open && activeObject === 'drawer') {
      renderDrawer(content);
    } else {
      if (dialog.open && activeObject === 'notebook') notebookCheck();
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
    backTo = '';
    // Closed, the drawer leaves the room it was open over, and the
    // address no longer names it.
    if (location.hash === '#drawer') {
      var over = drawerRoom();
      var left = new URLSearchParams(location.search);
      left.delete('in');
      var query = left.toString();
      history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + (over === 'door' ? '' : '#' + over));
    }
    /* The list under a room on a phone repeats the places for the eye and
       is hidden from a screen reader, so the focus goes back to the same
       place in the picture rather than into the list. */
    var back = opener;
    if (back && back.closest('[aria-hidden="true"]')) {
      var room = back.closest('section');
      back = room && room.querySelector('.house-hotspot[data-open="' + back.getAttribute('data-open') + '"]');
    }
    if (back && !back.hidden) back.focus({ preventScroll: true });
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

  /* The site's menu and footer open the drawer over whatever is showing,
     the door or a room, and leave it there when the drawer closes
     (js/site-nav.js). */
  window.OLAE_HOUSE = { openDrawer: function (from) { openObject('drawer', from || null); } };

  root.querySelectorAll('.house-js').forEach(function (node) { node.hidden = false; });
  if (KEEP.read().kept.length) document.getElementById('house-welcome').textContent = 'Welcome back.';
  if (!KEEP.works()) status.textContent = DRAWER.storageNote();
  syncCount();
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
  if (window.OLAE_ISTANBUL_WEATHER) window.OLAE_ISTANBUL_WEATHER.start(applyLiveWeather);
  document.addEventListener('DOMContentLoaded', offerWindow);
})();


