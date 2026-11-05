/* live-join.js — a phone in a quiz played together (5 November 2026;
   /join/). The code comes from the big screen, typed or in the address from
   its QR code (?pin=123456). The phone keeps a random token for that game,
   so a locked screen, a lost signal or a reload returns it to its own place
   and score; it keeps the last name it used, to offer it again; and it keeps
   whether its buttons show the choices' words or only their colours, which
   the player chooses. Nothing else is stored, and nothing leaves the phone
   but the name and the answers. */
(function () {
  'use strict';

  var root = document.getElementById('live-join');
  if (!root || !window.live || !window.WebSocket) return;
  var L = window.live;
  var $ = function (id) { return document.getElementById(id); };

  var enterPanel = $('join-enter');
  var form = $('join-form');
  var pinInput = $('join-pin');
  var nameInput = $('join-name');
  var errorLine = $('join-error');
  var game = $('join-game');
  var parts = { wait: $('join-wait'), question: $('join-question'), result: $('join-result') };

  var socket = null;
  var pin = '';
  var view = null;
  var tick = 0;
  var pendingName = '';
  var MODE = 'ole-live-mode';
  var NAME = 'ole-live-name';
  var mode = L.store('local', MODE) === 'colours' ? 'colours' : 'words';

  var MESSAGES = {
    'no-room': 'There is no game with this code. Check the code on the big screen.',
    'removed': 'You were taken out of this game.',
    'over': 'This game has ended.',
    'taken': 'Someone in this game already has that name. Try another.',
    'name': 'Please write a name, in letters or numbers.',
    'full': 'This game is full.',
    'token': 'This phone could not join. Please reload the page.'
  };

  function cleanPin(value) { return String(value || '').replace(/\D/g, '').slice(0, 6); }

  (function () {
    var asked = cleanPin(new URLSearchParams(window.location.search).get('pin'));
    if (asked.length === 6) pinInput.value = asked.slice(0, 3) + ' ' + asked.slice(3);
    var last = L.store('local', NAME);
    if (last) nameInput.value = last;
    (asked.length === 6 ? nameInput : pinInput).focus({ preventScroll: true });
  }());

  function showError(text) {
    errorLine.textContent = text || '';
    errorLine.hidden = !text;
  }

  function show(part) {
    Object.keys(parts).forEach(function (key) { parts[key].hidden = key !== part; });
  }

  function tokenFor(code) {
    var key = 'ole-live-token-' + code;
    var token = L.store('local', key);
    if (!token) {
      token = L.randomToken();
      L.store('local', key, token);
    }
    return token;
  }

  function setMode(next) {
    mode = next;
    L.store('local', MODE, next);
    $('join-words').setAttribute('aria-pressed', String(next === 'words'));
    $('join-colours').setAttribute('aria-pressed', String(next === 'colours'));
    if (view && view.phase === 'question') drawQuestion(view);
  }

  function wait(big, small) {
    show('wait');
    $('join-wait-big').textContent = big;
    $('join-wait-small').textContent = small || '';
  }

  function drawClock() {
    window.clearInterval(tick);
    if (!view || view.phase !== 'question') return;
    function step() {
      $('join-clock').textContent = L.secondsLeft(view.deadline);
    }
    step();
    tick = window.setInterval(step, 250);
  }

  function drawQuestion(v) {
    var q = v.question;
    if (v.chosen !== null && v.chosen !== undefined) {
      var mark = L.marks[v.chosen];
      wait('Answer sent', mark.shape + ' ' + mark.letter + (mode === 'words' ? ' · ' + q.choices[v.chosen].text : '') + '. Look at the big screen.');
      return;
    }
    show('question');
    $('join-number').textContent = q.number + ' of ' + q.total;
    var text = $('join-question-text');
    text.textContent = q.text;
    text.hidden = mode !== 'words';
    var box = $('join-buttons');
    box.textContent = '';
    box.className = 'live-buttons live-buttons--' + mode;
    q.choices.forEach(function (choice, i) {
      var mark = L.marks[i];
      var button = L.el('button', 'live-button live-tile--' + mark.name);
      button.type = 'button';
      var shape = L.el('span', 'live-tile-shape', mark.shape);
      shape.setAttribute('aria-hidden', 'true');
      button.appendChild(shape);
      button.appendChild(L.el('span', 'live-tile-letter', mark.letter));
      if (mode === 'words') button.appendChild(L.el('span', 'live-tile-text', choice.text));
      else button.setAttribute('aria-label', mark.letter + ': ' + choice.text);
      button.addEventListener('click', function () {
        if (!socket.send({ t: 'answer', choice: i })) return;
        box.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
        button.classList.add('is-chosen');
      });
      box.appendChild(button);
    });
    drawClock();
  }

  function place(v) {
    if (!v.me || !v.me.rank) return '';
    return 'You are ' + L.ordinal(v.me.rank) + ' of ' + v.players + '.';
  }

  function drawReveal(v) {
    show('result');
    var r = v.result || {};
    var q = v.question;
    var mark = L.marks[q.answer];
    var answer = mark.shape + ' ' + mark.letter + ' · ' + q.choices[q.answer].text;
    var big = $('join-result-big');
    big.className = 'live-phone-big ' + (r.right ? 'is-right' : 'is-wrong');
    if (r.right) {
      big.textContent = 'Right';
      $('join-result-small').textContent = '+' + L.number(r.gained) + ' points';
    } else {
      big.textContent = r.answered ? 'Not this time' : 'Time ran out';
      $('join-result-small').textContent = 'The answer: ' + answer;
    }
    $('join-result-place').textContent = place(v);
  }

  function draw(v) {
    view = v;
    $('join-lost').hidden = true;
    if (!v.me) {
      // Not in the game yet: give the room the name the player wrote.
      if (pendingName) {
        socket.send({ t: 'join', name: pendingName });
        pendingName = '';
      } else {
        backToForm('');
      }
      return;
    }
    enterPanel.hidden = true;
    game.hidden = false;
    $('join-me').textContent = v.me.name;
    $('join-score').textContent = L.number(v.me.score) + ' points';
    window.clearInterval(tick);
    // The words-or-colours choice is offered while it still matters.
    root.querySelector('.live-view-choice').hidden = !(v.phase === 'lobby' || v.phase === 'question');
    if (v.phase === 'lobby') wait('You’re in', 'Your name is on the big screen. The game starts soon.');
    else if (v.phase === 'question') drawQuestion(v);
    else if (v.phase === 'reveal') drawReveal(v);
    else if (v.phase === 'final') {
      wait('The end', 'You finished ' + L.ordinal(v.me.rank || 1) + ' of ' + v.players + ' with ' + L.number(v.me.score) + ' points.');
      if (socket) socket.close();
    }
  }

  function backToForm(message) {
    game.hidden = true;
    enterPanel.hidden = false;
    showError(message);
  }

  function start(code, name) {
    if (socket && pin === code) {
      // Already in this room: only the name was wrong.
      if (view && !view.me) socket.send({ t: 'join', name: name });
      else pendingName = name;
      return;
    }
    if (socket) socket.close();
    pin = code;
    view = null;
    pendingName = name;
    socket = L.connect(L.socketUrl(code, 'token=' + tokenFor(code)), {
      view: draw,
      error: function (error) {
        backToForm(MESSAGES[error] || 'Something went wrong. Please try again.');
        if (/^(no-room|removed|over|token)$/.test(error)) {
          socket = null;
          pin = '';
        }
      },
      lost: function () { if (!game.hidden) $('join-lost').hidden = false; }
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var code = cleanPin(pinInput.value);
    var name = nameInput.value.trim();
    if (code.length !== 6) { showError('The code has six digits.'); pinInput.focus(); return; }
    if (!name) { showError(MESSAGES.name); nameInput.focus(); return; }
    showError('');
    L.store('local', NAME, name);
    start(code, name);
  });

  $('join-words').addEventListener('click', function () { setMode('words'); });
  $('join-colours').addEventListener('click', function () { setMode('colours'); });
  setMode(mode);

  /* A phone that has joined this game before goes straight back in. */
  var known = cleanPin(pinInput.value);
  if (known.length === 6 && L.store('local', 'ole-live-token-' + known)) start(known, '');
}());
