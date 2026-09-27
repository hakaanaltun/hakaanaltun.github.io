/* Things to do, offered in the search field. The site can do more than it
   says: snow and rain at the foot of the page, puzzle mode and rain under an
   essay, the House and the Farm House behind it, a theme that follows the
   sky. The field says one of them in its placeholder, a different one on each
   page, and does it when asked.

   How it is asked is the whole design, because the field is still a search
   field first:
   - Focusing the field reveals one button for its suggestion. Typing an
     ordinary query keeps searching; typing a command can complete it.
   - Enter in the field and the search button always search, even when the
     query spells a command. Only the separate suggestion button runs it.
   - Typed in part, the rest of a command shows faintly after the caret, and
     → takes it. Tab keeps moving between controls.

   Only what the page can do is offered: puzzle mode and read-with-rain exist
   under an essay and nowhere else, so each command asks the page first. It
   is done in place, and a short line then says where its own control lives,
   so the next time the reader needs neither the field nor this. Nothing is
   sent or remembered beyond the last suggestion shown, which keeps the next
   page from repeating it. */
(function () {
  'use strict';
  var forms = document.querySelectorAll('.site-search-form');
  if (!forms.length) return;
  var refreshers = [];

  function shown(id) {
    var el = document.getElementById(id);
    return el && !el.hidden ? el : null;
  }
  function theme() {
    return document.documentElement.getAttribute('data-theme') || 'system';
  }
  function weather(kind) {
    var w = window.OLAE_WEATHER;
    if (w && w.set) {
      var now = w.state();
      if (now.kind !== kind) w.set(kind, 1);
      return;
    }
    var button = shown(kind === 'snow' ? 'let-it-snow' : 'let-it-rain');
    if (button) button.click();
  }
  function setTheme(name) {
    var item = document.querySelector('#theme-menu [data-set-theme="' + name + '"]');
    if (item) item.click();
  }
  function go(path) {
    return function () { location.href = path; };
  }
  function press(id, where) {
    return function () {
      var button = shown(id);
      button.click();
      if (where) button.scrollIntoView({ block: where });
    };
  }
  var here = location.pathname;

  /* Translating and keeping start from a selection, which a field cannot
     make for the reader; so the command makes one, the first sentence of
     the piece, and the box that any selection brings up comes up for it. */
  var article = document.querySelector('.essay-body');
  function firstSentence() {
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return node.parentElement.closest('p') && /\S/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var node = walker.nextNode();
    if (!node) return null;
    var text = node.nodeValue;
    var start = text.search(/\S/);
    var stop = text.slice(start).search(/[.!?](\s|$)/);
    var range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, stop === -1 ? text.length : start + stop + 1);
    return range;
  }
  function selectFirstLine() {
    var range = firstSentence();
    if (!range) return;
    var block = range.startContainer.parentElement.closest('p');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    block.scrollIntoView({ block: 'center', behavior: 'instant' });
    /* After the scroll has settled: a scroll closes the box. */
    setTimeout(function () {
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }, 250);
  }
  function selectable() {
    return article && window.getSelection && document.querySelector('.reader-translate') && firstSentence();
  }

  /* Three kinds, drawn from in turn so that the page's own things come up
     most and the eighteen instruments do not drown the rest: what this page
     can do, what every page can do, and the instruments. */
  var COMMANDS = [
    { kind: 'page', say: 'read with rain',
      can: function () { var b = shown('essay-rain'); return b && b.getAttribute('aria-pressed') !== 'true'; },
      run: press('essay-rain'),
      done: 'Rain behind the essay. The button under its title stops it.' },
    { kind: 'page', say: 'puzzle mode',
      can: function () { var b = shown('essay-puzzle'); return b && b.getAttribute('aria-pressed') !== 'true'; },
      run: press('essay-puzzle', 'center') },
    { kind: 'page', say: 'guess the word',
      can: function () { return shown('essay-guess'); },
      run: press('essay-guess', 'center') },
    { kind: 'page', say: 'translate a line',
      can: selectable,
      run: selectFirstLine, top: true,
      done: 'Select any line and the same box offers it in Turkish.' },
    { kind: 'page', say: 'keep a line',
      can: function () { return window.OLAE_KEEP && article && article.hasAttribute('data-keep-passage') && selectable(); },
      run: selectFirstLine, top: true,
      done: 'Select any line, and Keep puts it in your drawer in The House.' },
    { kind: 'page', say: 'compress everything',
      can: function () { return shown('book-compress'); },
      run: press('book-compress') },
    { kind: 'site', say: 'let it snow',
      can: function () { return shown('let-it-snow') && !(window.OLAE_WEATHER && window.OLAE_WEATHER.state().kind === 'snow'); },
      run: function () { weather('snow'); },
      done: 'Snowing. The snowflake at the foot of the page stops it.' },
    { kind: 'site', say: 'let it rain',
      can: function () { return shown('let-it-rain') && !(window.OLAE_WEATHER && window.OLAE_WEATHER.state().kind === 'rain'); },
      run: function () { weather('rain'); },
      done: 'Raining. The drop at the foot of the page stops it.' },
    { kind: 'site', say: 'follow the sky',
      can: function () { return shown('theme-toggle') && theme() !== 'sky'; },
      run: function () { setTheme('sky'); }, stay: true,
      done: 'The page now follows the sky. Themes are at the foot of the page.' },
    { kind: 'site', say: 'midnight',
      can: function () { return shown('theme-toggle') && theme() !== 'midnight'; },
      run: function () { setTheme('midnight'); }, stay: true,
      done: 'Midnight. Themes are at the foot of the page.' },
    { kind: 'site', say: 'enter the house',
      can: function () { return here !== '/house/'; },
      run: go('/house/#study') },
    { kind: 'site', say: 'visit the farm house',
      can: function () { return here === '/house/'; },
      run: go('/farm-house/') },
    { kind: 'site', say: 'take a quiz',
      can: function () { return here.indexOf('/trivia/') !== 0; },
      run: go('/trivia/') }
  ];
  /* The instruments, each by what it is for. */
  [
    ['write', 'write on a blank page'],
    ['draw', 'draw something'],
    ['words', 'count words'],
    ['marks', 'copy an em dash'],
    ['clean', 'clean pasted text'],
    ['list', 'sort a list'],
    ['lots', 'draw names'],
    ['diff', 'compare two texts'],
    ['desk', 'sit at the desk'],
    ['read', 'read a file'],
    ['clock', 'start a pomodoro'],
    ['prompt', 'open a teleprompter'],
    ['noise', 'play some noise'],
    ['breathe', 'breathe'],
    ['twilight', 'see today’s twilight'],
    ['moon', 'see tonight’s moon'],
    ['season', 'the next solstice'],
    ['days', 'days between dates']
  ].forEach(function (tool) {
    COMMANDS.push({ kind: 'instrument', say: tool[1],
      can: function () { return here !== '/' + tool[0] + '/'; },
      run: go('/' + tool[0] + '/') });
  });

  function plain(text) {
    return String(text || '').toLowerCase().replace(/[\u2019']/g, '').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function available() {
    return COMMANDS.filter(function (c) { try { return !!c.can(); } catch (e) { return false; } });
  }
  function exact(text) {
    var said = plain(text);
    if (!said) return null;
    return available().filter(function (c) { return plain(c.say) === said; })[0] || null;
  }
  /* The command a typed start is heading for. Three letters at least: "le"
     is the start of too many searches to put words in a reader's mouth.
     Where two share a start, as the snow and the rain do, the one the field
     is already offering goes first, and otherwise the first in the list. */
  function completion(text) {
    var typed = text.toLowerCase().replace(/'/g, '\u2019');
    if (typed.replace(/\s/g, '').length < 3) return null;
    var matches = available().filter(function (c) { return c.say.indexOf(typed) === 0 && c.say !== typed; });
    if (offered && matches.indexOf(offered) !== -1) return offered;
    return matches[0] || null;
  }

  var LAST = 'olae-search-suggestion';
  function pick() {
    var list = available();
    if (!list.length) return null;
    var last = null;
    try { last = sessionStorage.getItem(LAST); } catch (e) {}
    var fresh = list.filter(function (c) { return c.say !== last; });
    if (fresh.length) list = fresh;
    function of(kind) { return list.filter(function (c) { return c.kind === kind; }); }
    /* Half the time the page's own, when it has any; the rest split between
       what every page can do and the instruments. */
    var roll = Math.random();
    var pool = of('page').length && roll < 0.5 ? of('page')
      : of('site').length && (roll < 0.8 || !of('instrument').length) ? of('site')
      : of('instrument');
    if (!pool.length) pool = list;
    var chosen = pool[Math.floor(Math.random() * pool.length)];
    try { sessionStorage.setItem(LAST, chosen.say); } catch (e) {}
    return chosen;
  }

  var said = null;
  var saidTimer = 0;
  /* Over the field it came from, where the reader is looking. At the foot of
     the window it would sit on the very snowflake it points to. A field that
     has gone (the menu closes behind its command) leaves it at the foot. */
  function tell(text, form, top) {
    if (!said) {
      said = document.createElement('p');
      said.className = 'search-said';
      said.setAttribute('role', 'status');
      said.hidden = true;
      document.body.appendChild(said);
    }
    said.textContent = text;
    said.hidden = false;
    var box = form && form.getBoundingClientRect();
    var room = document.documentElement.clientWidth;
    var width = said.offsetWidth;
    said.style.top = '';
    said.style.bottom = '';
    /* At the foot too when the command has moved the page away from the
       field, as the ones that show part of an essay do. */
    if (top) {
      /* The box a selection brings up sits under the line, or on a phone at
         the foot of the window; this goes where it cannot cover it. */
      said.style.left = Math.max(14, (room - width) / 2) + 'px';
      said.style.top = 'max(18px, env(safe-area-inset-top))';
    } else if (!box || !box.width || !form.offsetParent || box.bottom < 0 || box.top > window.innerHeight) {
      said.style.left = Math.max(14, (room - width) / 2) + 'px';
      said.style.bottom = 'max(18px, env(safe-area-inset-bottom))';
    } else {
      said.style.left = Math.max(14, Math.min(box.left, room - width - 14)) + 'px';
      if (box.top > said.offsetHeight + 24) said.style.bottom = (window.innerHeight - box.top + 10) + 'px';
      else said.style.top = (box.bottom + 10) + 'px';
    }
    clearTimeout(saidTimer);
    saidTimer = setTimeout(function () { said.hidden = true; }, 6000);
  }

  /* What each field says, as long as it fits. The menu's field is narrower
     than the footer's, and a suggestion cut off mid-word is not one; there
     the shorter form is used, and failing that the field only offers to
     search. Its focused suggestion button can wrap the complete offer. */
  var offered = null;
  var ruler = document.createElement('canvas').getContext('2d');
  function fits(input, text) {
    var style = getComputedStyle(input);
    var room = input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    if (!ruler || room <= 0) return null;
    ruler.font = style.font;
    /* Less the clear button's place, which Chromium and Safari keep inside
       the field even while it is empty (22px, see search.css), and a little
       more: a closing quote is the first thing to go. */
    return ruler.measureText(text).width <= room - 30;
  }
  function fit(input) {
    if (!offered) { input.placeholder = 'Search the site'; input.shows = null; return; }
    var long = 'Search, or try “' + offered.say + '”';
    var short = 'Try “' + offered.say + '”';
    var roomy = fits(input, long);
    if (roomy === null) return;
    if (roomy) { input.placeholder = long; input.shows = offered; }
    else if (fits(input, short)) { input.placeholder = short; input.shows = offered; }
    else { input.placeholder = 'Search the site'; input.shows = null; }
    if (input.form.contains(document.activeElement)) input.placeholder = 'Search the site';
  }
  function offer() {
    offered = pick();
    forms.forEach(function (form) {
      var input = form.querySelector('input[type="search"]');
      if (input) fit(input);
    });
    refreshers.forEach(function (refresh) { refresh(); });
  }
  function usable(command) {
    try { return command && command.can() ? command : null; } catch (e) { return null; }
  }

  function run(command, input) {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    /* From the menu, the menu closes so the reader sees what they asked for. */
    var close = input.closest('#site-drawer') && document.getElementById('site-drawer-close');
    if (close && document.getElementById('site-drawer').classList.contains('open')) close.click();
    command.run();
    if (command.done) tell(command.done, close ? null : input.form, command.top);
    /* The theme menu hands focus to its own button when it closes; a reader
       who was in the footer's field stays in it. */
    if (command.stay && !close && document.activeElement !== input && input.offsetParent) input.focus({ preventScroll: true });
    offer();
  }

  forms.forEach(function (form) {
    var input = form.querySelector('input[type="search"]');
    if (!input) return;
    form.classList.add('site-search-form--suggests');

    var ghost = document.createElement('span');
    ghost.className = 'search-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    var typedPart = document.createElement('span');
    typedPart.className = 'search-ghost-typed';
    var restPart = document.createElement('span');
    restPart.className = 'search-ghost-rest';
    ghost.append(typedPart, restPart);
    form.insertBefore(ghost, input.nextSibling);

    var pending = null;
    function place() {
      var style = getComputedStyle(input);
      ghost.style.left = (input.offsetLeft + parseFloat(style.paddingLeft)) + 'px';
      ghost.style.top = input.offsetTop + 'px';
      ghost.style.height = input.offsetHeight + 'px';
      ghost.style.font = style.font;
      ghost.style.letterSpacing = style.letterSpacing;
    }
    function refresh() {
      pending = input.value && input.selectionStart === input.value.length ? completion(input.value) : null;
      if (!pending || document.activeElement !== input || fits(input, pending.say) === false) { ghost.hidden = true; return; }
      place();
      typedPart.textContent = input.value;
      restPart.textContent = pending.say.slice(input.value.length);
      ghost.hidden = false;
    }
    ghost.hidden = true;

    /* A single real button makes the offer usable by touch as well as by
       keyboard. It stays out of the layout until the form has focus. */
    var suggestion = document.createElement('button');
    suggestion.type = 'button';
    suggestion.className = 'search-suggestion';
    suggestion.hidden = true;
    form.insertBefore(suggestion, form.querySelector('button[type="submit"]'));
    var suggested = null;
    var dismissed = false;
    function refreshSuggestion() {
      refresh();
      suggested = input.value.trim() ? (pending || exact(input.value)) : usable(offered);
      suggestion.hidden = dismissed || !form.contains(document.activeElement) || !suggested;
      if (suggestion.hidden) return;
      suggestion.textContent = 'Try “' + suggested.say + '”';
      var box = form.getBoundingClientRect();
      var viewport = window.visualViewport;
      var bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      suggestion.classList.toggle('search-suggestion--above', box.bottom + suggestion.offsetHeight + 8 > bottom && box.top > suggestion.offsetHeight + 8);
    }
    refreshers.push(refreshSuggestion);
    input.addEventListener('input', function () { dismissed = false; refreshSuggestion(); });
    input.addEventListener('blur', function () { ghost.hidden = true; });
    form.addEventListener('focusin', function () { dismissed = false; fit(input); refreshSuggestion(); });
    form.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!form.contains(document.activeElement)) { suggestion.hidden = true; ghost.hidden = true; fit(input); }
      }, 0);
    });
    /* Keep a touch or mouse press from blurring the field before its click,
       including browsers that do not focus buttons on pointer interaction. */
    suggestion.addEventListener('pointerdown', function (event) {
      if (event.button === 0) event.preventDefault();
    });
    suggestion.addEventListener('click', function () {
      var command = usable(suggested);
      if (!command) return;
      /* Do not leave keyboard focus on the button that is about to vanish. */
      input.focus({ preventScroll: true });
      run(command, input);
      dismissed = true;
      suggestion.hidden = true;
    });
    form.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !suggestion.hidden) {
        event.preventDefault();
        event.stopPropagation();
        input.focus({ preventScroll: true });
        dismissed = true;
        suggestion.hidden = true;
        ghost.hidden = true;
      }
    });
    /* The menu's field has no width until the menu opens, and every field
       changes width when the window does. */
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { fit(input); refreshSuggestion(); }).observe(input);

    input.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (input.selectionStart !== input.value.length) return;
      var take = input.value ? pending : usable(input.shows);
      if (!take) return;
      event.preventDefault();
      input.value = take.say;
      input.dispatchEvent(new Event('input'));
    });
  });

  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () {
    refreshers.forEach(function (refresh) { refresh(); });
  });

  /* Loaded after the scripts that unhide the page's own controls, which run
     as they load, so what can be done here is already known. */
  offer();
  /* Measured again once the site's own face has arrived: a line measured in
     the fallback font is narrower than the one the reader will see. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      forms.forEach(function (form) {
        var input = form.querySelector('input[type="search"]');
        if (input) fit(input);
      });
    });
  }
})();
