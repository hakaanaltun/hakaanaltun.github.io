/* An optional entrance to the site. Only canonical item IDs are stored;
   all drawer text and links come from the current rendered templates. */
(function () {
  'use strict';
  var root = document.getElementById('house');
  if (!root) return;
  var STORAGE = 'olae-house-v1';
  var dialog = document.getElementById('house-dialog');
  if (typeof dialog.showModal !== 'function') {
    document.getElementById('house-enter').href = '/all-work/';
    document.getElementById('house-enter').textContent = 'Visit the writing →';
    return;
  }
  var content = document.getElementById('house-dialog-content');
  var scene = document.getElementById('house-scene');
  var lamp = document.getElementById('house-lamp');
  var status = document.getElementById('house-status');
  var dialogStatus = document.getElementById('house-dialog-status');
  var entrance = document.getElementById('house-entrance');
  var study = document.getElementById('study');
  var activeObject = '';
  var opener = null;
  var storageWorks = true;
  var catalog = Object.create(null);
  var answered = null;
  var labels = {
    books: ['By the wall', 'The bookshelf'],
    words: ['On the desk', 'Word cards'],
    question: ['Pinned to the wall', 'A question for you'],
    window: ['Outside', 'Through the window'],
    moris: ['On the cushion', 'Moris'],
    drawer: ['Yours to keep', 'Your drawer']
  };
  root.querySelectorAll('template').forEach(function (template) {
    template.content.querySelectorAll('[data-house-item]').forEach(function (item) {
      var source = item.querySelector('[data-source]');
      catalog[item.dataset.houseItem] = {
        title: item.querySelector('h3').textContent,
        quote: item.querySelector('[data-quote]').textContent,
        kind: item.dataset.kind,
        href: source.getAttribute('href')
      };
    });
  });
  function readState() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      if (!value || typeof value !== 'object') value = {};
      return {
        kept: Array.isArray(value.kept) ? value.kept.filter(function (id, i, list) {
          return typeof id === 'string' && Object.prototype.hasOwnProperty.call(catalog, id) && list.indexOf(id) === i;
        }) : [],
        lamp: typeof value.lamp === 'boolean' ? value.lamp : null
      };
    } catch (e) {
      // Malformed JSON can be replaced on the next save; inaccessible
      // storage is detected separately by the write probe below.
      return { kept: [], lamp: null };
    }
  }
  var state = readState();
  try {
    localStorage.setItem(STORAGE + '-probe', '1');
    localStorage.removeItem(STORAGE + '-probe');
  } catch (e) { storageWorks = false; }
  function persist() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
      storageWorks = true;
    } catch (e) { storageWorks = false; }
  }
  function storageNote() {
    return storageWorks ? 'Saved in this browser. Your drawer stays here when you come back. Clearing browser data empties it.' : 'Your browser cannot save this drawer. You can use it until you leave this page.';
  }
  function announce(message) {
    status.textContent = message;
    dialogStatus.textContent = message;
  }
  function syncKept() {
    root.querySelectorAll('[data-kept-count]').forEach(function (count) { count.textContent = state.kept.length; });
    content.querySelectorAll('[data-keep]').forEach(function (button) {
      if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent;
      var kept = state.kept.indexOf(button.dataset.keep) !== -1;
      button.setAttribute('aria-pressed', String(kept));
      button.textContent = kept ? 'In your drawer ✓' : button.dataset.originalLabel;
    });
  }
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function renderDrawer() {
    content.replaceChildren();
    content.appendChild(element('p', 'house-drawer-note', storageNote()));
    if (!state.kept.length) {
      var empty = element('div', 'house-empty-drawer');
      empty.appendChild(element('p', '', 'Nothing here yet. Pick up a word card, read a line from the bookshelf, or try the question on the wall.'));
      content.appendChild(empty);
      return;
    }
    state.kept.forEach(function (id) {
      var item = catalog[id];
      var article = element('article', 'house-item');
      article.appendChild(element('p', 'house-item-kind', item.kind));
      article.appendChild(element('h3', '', item.title));
      article.appendChild(element('p', '', item.quote));
      var actions = element('div', 'house-item-actions');
      var link = element('a', '', 'Go to the page →');
      link.href = item.href;
      actions.appendChild(link);
      var remove = element('button', '', 'Remove');
      remove.type = 'button';
      remove.dataset.remove = id;
      remove.setAttribute('aria-label', 'Remove ' + item.title + ' from your drawer');
      actions.appendChild(remove);
      article.appendChild(actions);
      content.appendChild(article);
    });
  }
  function showAnswer(button, announceResult) {
    var correct = content.querySelector('[data-answer="correct"]');
    var result = button === correct ? 'That’s right.' : 'The answer is ' + correct.textContent + '.';
    content.querySelectorAll('[data-answer]').forEach(function (choice) {
      choice.disabled = true;
      if (choice === correct) choice.dataset.result = 'correct';
      else if (choice === button) choice.dataset.result = 'chosen';
    });
    content.querySelector('.house-answer-note').hidden = false;
    content.querySelector('.house-answer-result').textContent = result;
    if (announceResult) {
      // The disabled answer no longer takes focus. Put it on the newly
      // revealed note, making the full explanation available to a reader.
      var note = content.querySelector('.house-answer-note');
      note.tabIndex = -1;
      note.focus({ preventScroll: true });
    }
  }
  function openObject(name, button) {
    if (!labels[name]) return;
    activeObject = name;
    opener = button;
    document.getElementById('house-dialog-place').textContent = labels[name][0];
    document.getElementById('house-dialog-title').textContent = labels[name][1];
    dialogStatus.textContent = '';
    if (name === 'drawer') renderDrawer();
    else {
      content.replaceChildren(document.getElementById('house-' + name).content.cloneNode(true));
      if (name === 'question') {
        // Match the quizzes: neither the source position nor a fixed order
        // should give the answer away. Retain an answered card this visit.
        var answers = content.querySelector('.house-answers');
        var choices = Array.from(answers.children);
        for (var i = choices.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = choices[i]; choices[i] = choices[j]; choices[j] = tmp;
        }
        choices.forEach(function (choice) { answers.appendChild(choice); });
        if (answered !== null) showAnswer(choices.find(function (choice) { return choice.textContent === answered; }), false);
      }
    }
    syncKept();
    dialog.showModal();
    dialog.scrollTop = 0;
    document.getElementById('house-close').focus({ preventScroll: true });
  }
  function setView(focus) {
    var inside = location.hash === '#study';
    entrance.hidden = inside;
    study.hidden = !inside;
    if (focus) {
      var target = inside ? document.getElementById('house-room-title') : document.getElementById('house-enter');
      target.focus({ preventScroll: true });
      root.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  function paintTime() {
    var date = new Date();
    var hour = date.getHours();
    var period = hour >= 6 && hour < 10 ? 'morning' : hour >= 10 && hour < 17 ? 'day' : hour >= 17 && hour < 21 ? 'evening' : 'night';
    var name = { morning: 'Morning', day: hour < 12 ? 'Morning' : 'Afternoon', evening: 'Evening', night: 'Night' }[period];
    scene.dataset.hour = period;
    document.getElementById('house-hour').textContent = name + ' · your time';
    var on = state.lamp === null ? period === 'night' || period === 'evening' : state.lamp;
    scene.dataset.lamp = on ? 'on' : 'off';
    lamp.setAttribute('aria-pressed', String(on));
    lamp.setAttribute('aria-label', on ? 'Turn off the lamp' : 'Turn on the lamp');
  }
  root.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-open]');
    if (trigger) { openObject(trigger.dataset.open, trigger); return; }
    var keep = event.target.closest('[data-keep]');
    if (keep && catalog[keep.dataset.keep]) {
      var id = keep.dataset.keep;
      var index = state.kept.indexOf(id);
      if (index === -1) state.kept.push(id); else state.kept.splice(index, 1);
      persist(); syncKept();
      announce((index === -1 ? 'Put in your drawer.' : 'Taken out of your drawer.') + (storageWorks ? '' : ' Kept only until you leave this page.'));
      return;
    }
    var remove = event.target.closest('[data-remove]');
    if (remove) {
      var removeButtons = Array.from(content.querySelectorAll('[data-remove]'));
      var position = removeButtons.indexOf(remove);
      state.kept = state.kept.filter(function (id) { return id !== remove.dataset.remove; });
      persist(); renderDrawer(); syncKept();
      var remaining = content.querySelectorAll('[data-remove]');
      (remaining[Math.min(position, remaining.length - 1)] || document.getElementById('house-close')).focus({ preventScroll: true });
      announce('Taken out of your drawer.');
      return;
    }
    var answer = event.target.closest('[data-answer]');
    if (answer && !answer.disabled) { answered = answer.textContent; showAnswer(answer, true); }
  });
  lamp.addEventListener('click', function () {
    state.lamp = lamp.getAttribute('aria-pressed') !== 'true';
    persist(); paintTime(); announce(state.lamp ? 'The lamp is on.' : 'The lamp is off.');
  });
  document.getElementById('house-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () { if (opener && !opener.hidden) opener.focus({ preventScroll: true }); });
  ['house-enter', 'house-leave'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function (event) {
      event.preventDefault();
      history.pushState(null, '', this.getAttribute('href'));
      setView(true);
    });
  });
  window.addEventListener('hashchange', function () { if (dialog.open) dialog.close(); setView(true); });
  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE && event.key !== null) return;
    state = readState(); syncKept(); paintTime();
    if (dialog.open && activeObject === 'drawer') renderDrawer();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) paintTime(); });
  window.setInterval(paintTime, 60000);
  root.querySelectorAll('.house-js').forEach(function (item) { item.hidden = false; });
  if (state.kept.length) document.getElementById('house-welcome').textContent = 'Welcome back.';
  if (!storageWorks) status.textContent = storageNote();
  syncKept(); paintTime(); setView(false);
})();
