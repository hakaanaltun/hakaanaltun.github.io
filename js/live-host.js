/* live-host.js — the big screen of a quiz played together (5 November 2026;
   /trivia/live/). It opens a room on live.hakanaltun.io, shows the code and
   a QR code for the phones, and then each question, how the room answered,
   the note behind the answer, and the scores. The room keeps the game; this
   screen only draws what the room sends and passes on the teacher's three
   buttons: start or go on, remove a name, end the game. The QR code opens
   across the whole screen for the back of the room (6 November 2026). A reload finds the
   same room again (the room's code and key are kept for this tab only). */
(function () {
  'use strict';

  var root = document.getElementById('live-host');
  if (!root || !window.live || !window.WebSocket) return;
  var L = window.live;
  var $ = function (id) { return document.getElementById(id); };

  var setup = $('live-setup');
  var form = $('live-setup-form');
  var setupError = $('live-setup-error');
  var stage = $('live-stage');
  var panels = { lobby: $('live-lobby'), question: $('live-question'), reveal: $('live-question'), final: $('live-final') };
  var errorLine = $('live-error');
  var endRow = $('live-end-row');
  var head = root.querySelector('.live-head');

  var SAVED = 'ole-live-host';
  var socket = null;
  var room = null;
  var view = null;
  var tick = 0;
  var settings = null;

  /* ?quiz=britain from a quiz's own page chooses it here. */
  (function () {
    var asked = new URLSearchParams(window.location.search).get('quiz');
    if (!asked) return;
    var radio = form.querySelector('input[name="quiz"][value="' + asked.replace(/[^a-z0-9-]/g, '') + '"]');
    if (radio) radio.checked = true;
  }());

  var countSelect = $('live-count');
  var cultureCount = countSelect.value;
  function updateCount() {
    var quiz = form.querySelector('input[name="quiz"]:checked');
    var fullSet = quiz && quiz.getAttribute('data-count');
    if (!countSelect.disabled) cultureCount = countSelect.value;
    countSelect.value = fullSet || cultureCount;
    countSelect.disabled = Boolean(fullSet);
  }
  form.addEventListener('change', function (event) {
    if (event.target.name === 'quiz') updateCount();
  });
  updateCount();

  function joinAddress() {
    return window.location.origin + root.getAttribute('data-join');
  }

  function showError(line, text) {
    line.textContent = text;
    line.hidden = !text;
  }

  function qr(text, box) {
    box.textContent = '';
    if (typeof window.qrcode !== 'function') return;
    var code = window.qrcode(0, 'M');
    code.addData(text);
    code.make();
    var n = code.getModuleCount();
    var pad = 2;
    var size = n + pad * 2;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('aria-hidden', 'true');
    var back = document.createElementNS(ns, 'rect');
    back.setAttribute('width', size);
    back.setAttribute('height', size);
    back.setAttribute('fill', '#fff');
    svg.appendChild(back);
    var d = '';
    for (var r = 0; r < n; r += 1) {
      for (var c = 0; c < n; c += 1) {
        if (code.isDark(r, c)) d += 'M' + (c + pad) + ' ' + (r + pad) + 'h1v1h-1z';
      }
    }
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', '#111');
    svg.appendChild(path);
    box.appendChild(svg);
  }

  function showPanel(phase) {
    Object.keys(panels).forEach(function (key) { panels[key].hidden = true; });
    if (panels[phase]) panels[phase].hidden = false;
  }

  function tile(choice, index, reveal) {
    var mark = L.marks[index];
    var node = L.el('div', 'live-tile live-tile--' + mark.name);
    var shape = L.el('span', 'live-tile-shape', mark.shape);
    shape.setAttribute('aria-hidden', 'true');
    node.appendChild(shape);
    node.appendChild(L.el('span', 'live-tile-letter', mark.letter + '.'));
    node.appendChild(L.el('span', 'live-tile-text', choice.text));
    if (reveal) {
      var right = index === reveal.answer;
      node.classList.add(right ? 'is-right' : 'is-other');
      var count = L.el('span', 'live-tile-count', String(reveal.counts[index] || 0));
      count.setAttribute('aria-label', (reveal.counts[index] || 0) + ' answered this');
      node.appendChild(count);
      if (right) node.appendChild(L.el('span', 'live-tile-mark', 'Answer'));
    }
    return node;
  }

  function drawLobby(v) {
    $('live-pin').textContent = v.pin.slice(0, 3) + ' ' + v.pin.slice(3);
    var names = $('live-names');
    names.textContent = '';
    v.players.forEach(function (p) {
      var item = L.el('li', 'live-name' + (p.online ? '' : ' is-away'));
      item.appendChild(L.el('span', '', p.name));
      var remove = L.el('button', 'live-remove', '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Remove ' + p.name);
      remove.addEventListener('click', function () { socket.send({ t: 'kick', pid: p.pid }); });
      item.appendChild(remove);
      names.appendChild(item);
    });
    var n = v.players.length;
    $('live-count-line').textContent = n ? (n === 1 ? 'One player is in.' : n + ' players are in.') : 'Waiting for the first player…';
    $('live-start').disabled = !n;
    $('live-qr-big-count').textContent = $('live-count-line').textContent;
  }

  /* The QR code across the whole screen, so the back of the room can scan
     it too. It belongs to the lobby, and closes when the game starts. */
  var big = $('live-qr-big');
  function openBig() {
    big.hidden = false;
    $('live-qr-big-close').focus({ preventScroll: true });
  }
  function closeBig() {
    if (big.hidden) return;
    big.hidden = true;
    $('live-qr').focus({ preventScroll: true });
  }

  function drawClock() {
    window.clearInterval(tick);
    if (!view || view.phase !== 'question') {
      $('live-clock').textContent = '';
      return;
    }
    var span = view.timer * 1000;
    function step() {
      var left = view.deadline - L.now();
      $('live-clock').textContent = L.secondsLeft(view.deadline);
      $('live-time-bar').style.transform = 'scaleX(' + Math.max(0, Math.min(1, left / span)).toFixed(4) + ')';
      if (left <= 0) window.clearInterval(tick);
    }
    step();
    tick = window.setInterval(step, 200);
  }

  function drawQuestion(v) {
    var q = v.question;
    var reveal = v.phase === 'reveal' ? { answer: q.answer, counts: v.counts || [] } : null;
    $('live-number').textContent = 'Question ' + q.number + ' of ' + q.total;
    var answeredCount = v.phase === 'question' ? (v.answered || 0) : (v.counts || []).reduce(function (a, b) { return a + b; }, 0);
    var here = v.players.filter(function (p) { return p.online; }).length;
    $('live-answered').textContent = answeredCount + ' of ' + (v.phase === 'question' ? here : v.players.length) + ' answered';
    if (window.triviaPicture) window.triviaPicture.show($('live-picture'), q.picture);
    $('live-question-text').textContent = q.text;
    var tiles = $('live-tiles');
    tiles.textContent = '';
    q.choices.forEach(function (choice, i) { tiles.appendChild(tile(choice, i, reveal)); });
    tiles.classList.toggle('is-revealed', !!reveal);
    panels.question.classList.toggle('is-reveal', !!reveal);

    var note = $('live-note');
    note.hidden = !reveal;
    note.textContent = reveal ? q.note : '';

    var list = $('live-standings');
    list.textContent = '';
    list.hidden = !reveal;
    if (reveal) {
      (v.standings || []).forEach(function (row) {
        var item = L.el('li', 'live-standing');
        item.appendChild(L.el('span', 'live-standing-rank', L.ordinal(row.rank)));
        item.appendChild(L.el('span', 'live-standing-name', row.name));
        item.appendChild(L.el('span', 'live-standing-score', L.number(row.score)));
        list.appendChild(item);
      });
    }
    var button = $('live-advance');
    button.textContent = reveal ? (v.last ? 'See the results' : 'Next question') : 'Show the answer';
    drawClock();
  }

  function drawFinal(v) {
    var list = $('live-podium');
    list.textContent = '';
    (v.standings || []).forEach(function (row) {
      var item = L.el('li', 'live-place live-place--' + Math.min(row.rank, 4));
      item.appendChild(L.el('span', 'live-place-rank', L.ordinal(row.rank)));
      item.appendChild(L.el('span', 'live-place-name', row.name));
      item.appendChild(L.el('span', 'live-place-score', L.number(row.score) + ' points'));
      list.appendChild(item);
    });
    if (!v.standings || !v.standings.length) list.appendChild(L.el('li', 'live-place', 'Nobody played this time.'));
  }

  function draw(v) {
    view = v;
    showError(errorLine, '');
    $('live-bar-quiz').textContent = v.quiz.name;
    var join = $('live-bar-join');
    join.hidden = v.phase === 'lobby' || v.phase === 'final';
    join.textContent = window.location.host + '/join · ' + v.pin;
    endRow.hidden = v.phase === 'final';
    showPanel(v.phase);
    if (v.phase !== 'lobby') closeBig();
    if (v.phase === 'lobby') drawLobby(v);
    if (v.phase === 'question' || v.phase === 'reveal') drawQuestion(v);
    else drawClock();
    if (v.phase === 'final') {
      drawFinal(v);
      L.store('session', SAVED, null);
    }
  }

  var MESSAGES = {
    'no-room': 'This room has closed. Open a new one to play again.',
    'not-host': 'This screen is not the one that opened the room.'
  };

  function enter(saved) {
    room = saved;
    setup.hidden = true;
    head.hidden = true;
    root.classList.add('is-playing');
    stage.hidden = false;
    $('live-join-address').textContent = window.location.host + '/join';
    var link = joinAddress() + '?pin=' + room.pin;
    qr(link, $('live-qr'));
    qr(link, $('live-qr-big-code'));
    $('live-qr-big-address').textContent = window.location.host + '/join';
    $('live-qr-big-pin').textContent = room.pin.slice(0, 3) + ' ' + room.pin.slice(3);
    socket = L.connect(L.socketUrl(room.pin, 'role=host&key=' + encodeURIComponent(room.hostKey)), {
      view: draw,
      error: function (error) {
        if (MESSAGES[error]) {
          L.store('session', SAVED, null);
          leave(MESSAGES[error]);
        }
      },
      lost: function () { showError(errorLine, 'The connection dropped. Trying again…'); }
    });
  }

  function leave(message) {
    if (socket) socket.close();
    socket = null;
    window.clearInterval(tick);
    big.hidden = true;
    stage.hidden = true;
    setup.hidden = false;
    head.hidden = false;
    root.classList.remove('is-playing');
    showError(setupError, message || '');
  }

  function openRoom(chosen) {
    settings = chosen;
    var button = $('live-open');
    button.disabled = true;
    showError(setupError, '');
    fetch(L.server() + '/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chosen)
    }).then(function (response) {
      return response.json().then(function (body) {
        if (!response.ok) throw new Error(body.error || 'room');
        return body;
      });
    }).then(function (body) {
      var saved = { pin: body.pin, hostKey: body.hostKey, settings: chosen };
      L.store('session', SAVED, JSON.stringify(saved));
      enter(saved);
    }).catch(function () {
      showError(setupError, 'A room could not be opened just now. Please try again in a moment.');
    }).then(function () {
      button.disabled = false;
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var quiz = form.querySelector('input[name="quiz"]:checked');
    openRoom({
      quiz: quiz ? quiz.value : '',
      count: Number($('live-count').value),
      timer: Number($('live-timer').value)
    });
  });

  $('live-qr').addEventListener('click', openBig);
  big.addEventListener('click', closeBig);
  $('live-start').addEventListener('click', function () { socket.send({ t: 'advance' }); });
  $('live-advance').addEventListener('click', function () { socket.send({ t: 'advance' }); });
  $('live-end').addEventListener('click', function () { socket.send({ t: 'end' }); });
  $('live-again').addEventListener('click', function () {
    leave('');
    if (room && room.settings) openRoom(room.settings);
  });

  /* The space bar or the right arrow moves the game on, as a clicker would. */
  document.addEventListener('keydown', function (event) {
    if (!big.hidden) {
      // Any key closes the big code first; Tab stays on its button.
      if (event.key === 'Tab') { event.preventDefault(); return; }
      event.preventDefault();
      closeBig();
      return;
    }
    if (!view || stage.hidden || event.target.closest('input, select, textarea, button')) return;
    if (event.key !== ' ' && event.key !== 'ArrowRight' && event.key !== 'PageDown') return;
    if (view.phase === 'lobby' && $('live-start').disabled) return;
    if (view.phase === 'final') return;
    event.preventDefault();
    socket.send({ t: 'advance' });
  });

  $('live-full').addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (stage.requestFullscreen) stage.requestFullscreen().catch(function () {});
  });
  document.addEventListener('fullscreenchange', function () {
    $('live-full').textContent = document.fullscreenElement ? 'Leave full screen' : 'Full screen';
  });

  var saved = null;
  try { saved = JSON.parse(L.store('session', SAVED) || 'null'); } catch (error) { saved = null; }
  if (saved && /^\d{6}$/.test(saved.pin) && saved.hostKey) enter(saved);
}());
