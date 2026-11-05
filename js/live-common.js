/* live-common.js — what the big screen (js/live-host.js) and the phones
   (js/live-join.js) share when a quiz is played together (5 November 2026):
   where the rooms are, a socket that finds its way back after a locked
   screen or a lost signal, the room's clock, and the four colours and
   shapes the choices wear. The rooms themselves are live/ in the
   repository, a Worker at live.hakanaltun.io. */
(function () {
  'use strict';

  var SERVER = 'https://live.hakanaltun.io';

  /* A local build may point at a room server of its own:
     ?server=http://localhost:8787 works only on localhost. */
  function server() {
    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      var asked = new URLSearchParams(window.location.search).get('server');
      if (asked && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(asked)) return asked;
    }
    return SERVER;
  }

  function socketUrl(pin, query) {
    return server().replace(/^http/, 'ws') + '/rooms/' + pin + '/ws?' + query;
  }

  /* The four choices: a colour and a shape each, so that a choice can be
     told by its shape as well as its colour. */
  var MARKS = [
    { letter: 'A', shape: '▲', name: 'triangle' },
    { letter: 'B', shape: '◆', name: 'diamond' },
    { letter: 'C', shape: '●', name: 'circle' },
    { letter: 'D', shape: '■', name: 'square' }
  ];

  /* The room's clock against this device's: each view carries the room's
     time, so a countdown agrees on every screen however wrong a phone's own
     clock is. */
  var offset = 0;
  function sync(view) {
    if (view && typeof view.now === 'number') offset = view.now - Date.now();
  }
  function now() { return Date.now() + offset; }
  function secondsLeft(deadline) {
    return Math.max(0, Math.ceil((deadline - now()) / 1000));
  }

  /* A socket into a room that opens again by itself, a little later each
     time, unless the room says it is over (an error message), or the page
     closes it. */
  function connect(url, handlers) {
    var ws = null;
    var stopped = false;
    var tries = 0;
    var timer = 0;

    function open() {
      if (stopped) return;
      ws = new WebSocket(url);
      ws.onopen = function () {
        tries = 0;
        if (handlers.open) handlers.open();
      };
      ws.onmessage = function (event) {
        var msg;
        try { msg = JSON.parse(event.data); } catch (error) { return; }
        if (msg.t === 'view') {
          sync(msg.view);
          handlers.view(msg.view);
        } else if (msg.t === 'error') {
          if (/^(no-room|not-host|removed|over|token)$/.test(msg.error)) stopped = true;
          handlers.error(msg.error);
        }
      };
      ws.onclose = function () {
        if (stopped) return;
        if (handlers.lost) handlers.lost();
        tries += 1;
        timer = window.setTimeout(open, Math.min(8000, 500 * tries));
      };
    }

    /* A phone woken from sleep tries at once rather than waiting out the
       delay. */
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible' || stopped) return;
      if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
      window.clearTimeout(timer);
      open();
    });

    open();
    return {
      send: function (message) {
        if (ws && ws.readyState === 1) {
          ws.send(JSON.stringify(message));
          return true;
        }
        return false;
      },
      close: function () {
        stopped = true;
        window.clearTimeout(timer);
        if (ws) ws.close();
      }
    };
  }

  function store(kind, key, value) {
    try {
      var box = kind === 'session' ? window.sessionStorage : window.localStorage;
      if (value === undefined) return box.getItem(key);
      if (value === null) box.removeItem(key);
      else box.setItem(key, value);
    } catch (error) { /* private window: the game still runs */ }
    return null;
  }

  function randomToken() {
    var bytes = new Uint8Array(18);
    window.crypto.getRandomValues(bytes);
    var out = '';
    for (var i = 0; i < bytes.length; i += 1) out += ('0' + bytes[i].toString(16)).slice(-2);
    return out;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  /* 1st, 2nd, 3rd, 4th, 11th, 12th, 21st … */
  function ordinal(n) {
    var tens = n % 100;
    if (tens >= 11 && tens <= 13) return n + 'th';
    return n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  }

  function number(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  window.live = {
    server: server,
    socketUrl: socketUrl,
    connect: connect,
    marks: MARKS,
    now: now,
    secondsLeft: secondsLeft,
    store: store,
    randomToken: randomToken,
    el: el,
    ordinal: ordinal,
    number: number
  };
}());
