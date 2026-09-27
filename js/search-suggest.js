/* Things to do, offered in the search field. The site can do more than it
   says: snow and rain at the foot of the page, puzzle mode and rain under an
   essay, the House and the Farm House behind it, a theme that follows the
   sky. The field says one of them in its placeholder, a different one on each
   page, and does it when asked.

   How it is asked is the whole design, because the field is still a search
   field first:
   - Tapping or clicking it only focuses it, as always. Whatever is typed is
     searched, as always.
   - With the field empty, Enter or the search button does the thing the
     placeholder offers. An empty search had nothing to find, so no search is
     lost to this.
   - Typed in full, a command is done where the reader is, not searched for.
     Typed in part, the rest of it shows faintly after the caret, and → takes
     it. Tab is left alone: it moves between controls, and a field that kept
     it would trap anyone who navigates by keyboard.

   Only what the page can do is offered: puzzle mode and read-with-rain exist
   under an essay and nowhere else, so each command asks the page first. It
   is done in place, and a short line then says where its own control lives,
   so the next time the reader needs neither the field nor this. Nothing is
   sent or remembered beyond the last suggestion shown, which keeps the next
   page from repeating it. */
(function () {
  'use strict';
  var forms = document.querySelectorAll('.site-search-form--footer, .site-search-form--drawer');
  if (!forms.length) return;

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
  var here = location.pathname;

  var COMMANDS = [
    { say: 'let it snow',
      can: function () { return shown('let-it-snow') && !(window.OLAE_WEATHER && window.OLAE_WEATHER.state().kind === 'snow'); },
      run: function () { weather('snow'); },
      done: 'Snowing. The snowflake at the foot of the page stops it.' },
    { say: 'let it rain',
      can: function () { return shown('let-it-rain') && !(window.OLAE_WEATHER && window.OLAE_WEATHER.state().kind === 'rain'); },
      run: function () { weather('rain'); },
      done: 'Raining. The drop at the foot of the page stops it.' },
    { say: 'read with rain',
      can: function () { var b = shown('essay-rain'); return b && b.getAttribute('aria-pressed') !== 'true'; },
      run: function () { shown('essay-rain').click(); },
      done: 'Rain behind the essay. The button under its title stops it.' },
    { say: 'puzzle mode',
      can: function () { var b = shown('essay-puzzle'); return b && b.getAttribute('aria-pressed') !== 'true'; },
      run: function () { var b = shown('essay-puzzle'); b.click(); b.scrollIntoView({ block: 'center' }); } },
    { say: 'follow the sky',
      can: function () { return shown('theme-toggle') && theme() !== 'sky'; },
      run: function () { setTheme('sky'); },
      done: 'The page now follows the sky. Themes are at the foot of the page.' },
    { say: 'midnight',
      can: function () { return shown('theme-toggle') && theme() !== 'midnight'; },
      run: function () { setTheme('midnight'); },
      done: 'Midnight. Themes are at the foot of the page.' },
    { say: 'enter the house',
      can: function () { return here !== '/house/'; },
      run: go('/house/#study') },
    { say: 'visit the farm house',
      can: function () { return here !== '/farm-house/'; },
      run: go('/farm-house/') }
  ];

  function plain(text) {
    return String(text || '').toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function available() {
    return COMMANDS.filter(function (c) { try { return !!c.can(); } catch (e) { return false; } });
  }
  function exact(text) {
    var said = plain(text);
    if (!said) return null;
    return available().filter(function (c) { return c.say === said; })[0] || null;
  }
  /* The command a typed start is heading for. Three letters at least: "le"
     is the start of too many searches to put words in a reader's mouth.
     Where two share a start, as the snow and the rain do, the one the field
     is already offering goes first, and otherwise the first in the list. */
  function completion(text) {
    var typed = text.toLowerCase();
    if (typed.replace(/\s/g, '').length < 3) return null;
    var matches = available().filter(function (c) { return c.say.indexOf(typed) === 0 && c.say !== typed; });
    if (offered && matches.indexOf(offered) !== -1) return offered;
    return matches[0] || null;
  }

  var LAST = 'olae-search-suggestion';
  function pick() {
    var list = available();
    if (!list.length) return null;
    /* An essay's own things first: they are what the reader is looking at. */
    var own = list.filter(function (c) { return c.say === 'puzzle mode' || c.say === 'read with rain'; });
    if (own.length && Math.random() < 0.5) list = own;
    var last = null;
    try { last = sessionStorage.getItem(LAST); } catch (e) {}
    var fresh = list.filter(function (c) { return c.say !== last; });
    if (fresh.length) list = fresh;
    var chosen = list[Math.floor(Math.random() * list.length)];
    try { sessionStorage.setItem(LAST, chosen.say); } catch (e) {}
    return chosen;
  }

  var said = null;
  var saidTimer = 0;
  /* Over the field it came from, where the reader is looking. At the foot of
     the window it would sit on the very snowflake it points to. A field that
     has gone (the menu closes behind its command) leaves it at the foot. */
  function tell(text, form) {
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
    if (!box || !box.width || !form.offsetParent) {
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
     search, and an empty search does nothing new. */
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
  }
  function offer() {
    offered = pick();
    forms.forEach(function (form) {
      var input = form.querySelector('input[type="search"]');
      if (input) fit(input);
    });
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
    if (command.done) tell(command.done, close ? null : input.form);
    /* The theme menu hands focus to its own button when it closes; a reader
       who was in the footer's field stays in it. */
    if (!close && document.activeElement !== input && input.offsetParent) input.focus({ preventScroll: true });
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
      if (!pending || fits(input, pending.say) === false) { ghost.hidden = true; pending = null; return; }
      place();
      typedPart.textContent = input.value;
      restPart.textContent = pending.say.slice(input.value.length);
      ghost.hidden = false;
    }
    ghost.hidden = true;
    input.addEventListener('input', refresh);
    input.addEventListener('blur', function () { ghost.hidden = true; });
    input.addEventListener('focus', refresh);
    /* The menu's field has no width until the menu opens, and every field
       changes width when the window does. */
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { fit(input); }).observe(input);

    input.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (input.selectionStart !== input.value.length) return;
      var take = input.value ? pending : usable(input.shows);
      if (!take) return;
      event.preventDefault();
      input.value = take.say;
      refresh();
    });

    form.addEventListener('submit', function (event) {
      var command = input.value.trim() ? exact(input.value) : usable(input.shows);
      if (!command) return;
      event.preventDefault();
      run(command, input);
    });
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
