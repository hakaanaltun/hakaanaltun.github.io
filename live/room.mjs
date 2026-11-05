// room.mjs — one live game, one room (5 November 2026). Cloudflare keeps a
// room as a Durable Object: one small program per six-digit code, which the
// teacher's screen and every phone in the game talk to over a WebSocket.
// The rules are in game.mjs; this file connects them to the sockets, keeps
// the game in the room's storage, and wakes itself when a question's time
// is up.
//
// The room sleeps between messages (Cloudflare's WebSocket hibernation), so
// nothing is billed while a class reads a question. What must survive the
// sleep is kept in storage, and each phone's answer to the open question
// rides on its own socket (serializeAttachment), so an answer costs no
// storage write. A room is emptied four hours after it opened: nothing about
// the game, the names in it or its scores is kept after that.

import * as rules from './game.mjs';

const LIFETIME = 4 * 60 * 60 * 1000;

function token() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c]));
}

export class LiveRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.game = null;
    this.now = () => Date.now();
  }

  async load() {
    if (this.game) return this.game;
    this.game = (await this.ctx.storage.get('game')) || null;
    if (this.game) {
      // Answers to the open question ride on the sockets until it closes;
      // the ones already saved (from a phone since gone) are kept.
      this.game.answers = this.game.answers || {};
      for (const ws of this.ctx.getWebSockets()) {
        const a = ws.deserializeAttachment() || {};
        if (a.pid && a.answer && a.answer.index === this.game.index && this.game.players[a.pid]) {
          this.game.answers[a.pid] = { choice: a.answer.choice, at: a.answer.at };
        }
      }
    }
    return this.game;
  }

  async save() {
    await this.ctx.storage.put('game', this.game);
  }

  async schedule() {
    const g = this.game;
    const when = g.phase === 'question' ? g.deadline : g.created + LIFETIME;
    await this.ctx.storage.setAlarm(when);
  }

  online() {
    const set = new Set();
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() || {};
      if (a.pid) set.add(a.pid);
    }
    return set;
  }

  send(ws, message) {
    try { ws.send(JSON.stringify(message)); } catch (error) { /* gone */ }
  }

  viewFor(ws, online) {
    const a = ws.deserializeAttachment() || {};
    if (a.role === 'host') return rules.hostView(this.game, online, this.now());
    if (a.pid && this.game.players[a.pid]) return rules.playerView(this.game, a.pid, this.now());
    return { role: 'player', phase: this.game.phase, pin: this.game.pin, quiz: this.game.quiz, me: null, now: this.now() };
  }

  /* Every screen gets its own view of the game, or only the hosts and the
     one phone that changed. */
  broadcast(only) {
    const online = this.online();
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() || {};
      if (a.role === 'gone' || (only && a.role !== 'host' && a.pid !== only)) continue;
      this.send(ws, { t: 'view', view: this.viewFor(ws, online) });
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/create' && request.method === 'POST') return this.create(request);
    if (url.pathname === '/ws') return this.connect(request, url);
    return new Response('Not found', { status: 404 });
  }

  async create(request) {
    const body = await request.json();
    const existing = await this.load();
    if (existing && this.now() < existing.created + LIFETIME) {
      return Response.json({ error: 'taken' }, { status: 409 });
    }
    await this.ctx.storage.deleteAll();
    this.game = rules.newGame({
      pin: body.pin,
      hostKey: token(),
      quiz: body.quiz,
      questions: body.questions,
      timer: body.timer,
      now: this.now()
    });
    await this.save();
    await this.schedule();
    return Response.json({ hostKey: this.game.hostKey }, { status: 201 });
  }

  async connect(request, url) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const game = await this.load();
    const done = (error) => {
      this.send(server, { t: 'error', error });
      server.close(4000, error);
      return new Response(null, { status: 101, webSocket: client });
    };
    if (!game || this.now() >= game.created + LIFETIME) return done('no-room');

    if (url.searchParams.get('role') === 'host') {
      if (url.searchParams.get('key') !== game.hostKey) return done('not-host');
      server.serializeAttachment({ role: 'host' });
      this.send(server, { t: 'view', view: rules.hostView(game, this.online(), this.now()) });
      return new Response(null, { status: 101, webSocket: client });
    }

    const tok = String(url.searchParams.get('token') || '').slice(0, 64);
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(tok)) return done('token');
    if (game.kicked.includes(tok)) return done('removed');
    const seat = Object.entries(game.players).find(([, p]) => p.token === tok);
    const attach = { role: 'player', token: tok, pid: seat ? seat[0] : null };
    if (seat) {
      // A phone back after a locked screen: its answer to the open question,
      // if it gave one, is still in the game.
      const a = game.answers[seat[0]];
      if (a) attach.answer = { index: game.index, choice: a.choice, at: a.at };
    }
    server.serializeAttachment(attach);
    if (seat) this.broadcast();
    else this.send(server, { t: 'view', view: this.viewFor(server, this.online()) });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > 2000) return;
    let msg;
    try { msg = JSON.parse(raw); } catch (error) { return; }
    const game = await this.load();
    if (!game) return;
    const a = ws.deserializeAttachment() || {};
    const now = this.now();

    if (a.role === 'host') {
      if (msg.t === 'advance') {
        rules.advance(game, now);
      } else if (msg.t === 'kick') {
        const pid = String(msg.pid || '');
        if (!rules.kick(game, pid)) return;
        for (const other of this.ctx.getWebSockets()) {
          const oa = other.deserializeAttachment() || {};
          if (oa.pid === pid) {
            this.send(other, { t: 'error', error: 'removed' });
            other.serializeAttachment({ role: 'gone' });
            other.close(4000, 'removed');
          }
        }
      } else if (msg.t === 'end') {
        if (game.phase === 'question') rules.close(game);
        game.phase = 'final';
        game.deadline = 0;
      } else return;
      await this.save();
      await this.schedule();
      this.broadcast();
      return;
    }

    if (a.role !== 'player') return;

    if (msg.t === 'join' && !a.pid) {
      const pid = 'p' + token().slice(0, 10);
      const result = rules.join(game, { name: msg.name, token: a.token, pid });
      if (result.error) {
        this.send(ws, { t: 'error', error: result.error });
        return;
      }
      a.pid = result.pid;
      ws.serializeAttachment(a);
      await this.save();
      this.broadcast();
      return;
    }

    if (msg.t === 'answer' && a.pid) {
      if (!rules.answer(game, a.pid, msg.choice, now)) return;
      a.answer = { index: game.index, choice: msg.choice, at: now };
      ws.serializeAttachment(a);
      if (rules.allAnswered(game, this.online())) {
        rules.close(game);
        await this.save();
        await this.schedule();
        this.broadcast();
      } else {
        this.broadcast(a.pid);
      }
    }
  }

  async webSocketClose(ws) {
    const game = await this.load();
    const a = ws.deserializeAttachment() || {};
    ws.serializeAttachment({ role: 'gone' });
    if (!game || !a.pid) return;
    // The teacher's list shows who has dropped out; a question everyone
    // left in the room has answered need not wait for the rest.
    if (game.phase === 'question' && rules.allAnswered(game, this.online())) {
      rules.close(game);
      await this.save();
      await this.schedule();
    }
    this.broadcast();
  }

  async webSocketError(ws) {
    return this.webSocketClose(ws);
  }

  async alarm() {
    const game = await this.load();
    if (!game) return;
    const now = this.now();
    if (now >= game.created + LIFETIME) {
      for (const ws of this.ctx.getWebSockets()) {
        this.send(ws, { t: 'error', error: 'no-room' });
        try { ws.close(4000, 'closed'); } catch (error) { /* gone */ }
      }
      await this.ctx.storage.deleteAll();
      this.game = null;
      return;
    }
    if (game.phase === 'question' && now >= game.deadline - 50) {
      rules.close(game);
      await this.save();
      this.broadcast();
    }
    await this.schedule();
  }
}
