var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// game.mjs
var LIMITS = {
  players: 80,
  name: 16,
  questions: 50,
  timers: [20, 30, 45, 60],
  counts: [5, 10, 15, 20, 30, 50]
};
var LETTERS = "ABCD";
function shuffle(list, rand) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
__name(shuffle, "shuffle");
function cleanName(raw) {
  return String(raw || "").normalize("NFC").replace(/[^\p{L}\p{N} .'_-]/gu, "").replace(/\s+/g, " ").trim().slice(0, LIMITS.name).trim();
}
__name(cleanName, "cleanName");
function pickQuestions(bank2, slug, count, rand) {
  const own = bank2.filter((q) => q && q.slug === slug && Array.isArray(q.choices) && q.choices.length >= 2 && q.choices.length <= 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length);
  return shuffle(own, rand).slice(0, Math.min(count, LIMITS.questions)).map((q) => {
    const order = shuffle(q.choices.map((_, i) => i), rand);
    const out = {
      id: q.id,
      question: q.question,
      choices: order.map((i) => q.choices[i]),
      answer: order.indexOf(q.answer),
      note: q.note || ""
    };
    if (q.picture) out.picture = q.picture;
    if (q.word) out.word = q.word;
    return out;
  });
}
__name(pickQuestions, "pickQuestions");
function newGame({ pin, hostKey, quiz, questions, timer, now }) {
  return {
    pin,
    hostKey,
    quiz,
    timer: LIMITS.timers.includes(timer) ? timer : 30,
    questions,
    phase: "lobby",
    index: -1,
    openedAt: 0,
    deadline: 0,
    created: now,
    touched: now,
    players: {},
    order: 0,
    kicked: [],
    // The answers to the question that is open, by player: { choice, at }.
    answers: {},
    // How the last closed question went: counts per choice, and each
    // player's result.
    last: null
  };
}
__name(newGame, "newGame");
function question(game) {
  return game.questions[game.index] || null;
}
__name(question, "question");
function join(game, { name, token: token2, pid }) {
  if (game.phase === "final") return { error: "over" };
  if (token2 && game.kicked.includes(token2)) return { error: "removed" };
  if (token2) {
    for (const [id, p] of Object.entries(game.players)) {
      if (p.token === token2) return { pid: id, back: true };
    }
  }
  const clean = cleanName(name);
  if (!clean) return { error: "name" };
  const taken = Object.values(game.players).some((p) => p.name.toLowerCase() === clean.toLowerCase());
  if (taken) return { error: "taken" };
  if (Object.keys(game.players).length >= LIMITS.players) return { error: "full" };
  game.order += 1;
  game.players[pid] = { name: clean, token: token2, score: 0, order: game.order };
  return { pid, back: false };
}
__name(join, "join");
function kick(game, pid) {
  const p = game.players[pid];
  if (!p) return false;
  game.kicked.push(p.token);
  delete game.players[pid];
  delete game.answers[pid];
  return true;
}
__name(kick, "kick");
function open(game, now) {
  game.index += 1;
  if (game.index >= game.questions.length) {
    game.phase = "final";
    game.deadline = 0;
    return;
  }
  game.phase = "question";
  game.answers = {};
  game.openedAt = now;
  game.deadline = now + game.timer * 1e3;
}
__name(open, "open");
function answer(game, pid, choice, now) {
  if (game.phase !== "question" || !game.players[pid]) return false;
  if (game.answers[pid]) return false;
  const q = question(game);
  if (!Number.isInteger(choice) || choice < 0 || choice >= q.choices.length) return false;
  if (now > game.deadline) return false;
  game.answers[pid] = { choice, at: now };
  return true;
}
__name(answer, "answer");
function points(game, at) {
  const span = game.timer * 1e3;
  const elapsed = Math.min(span, Math.max(0, at - game.openedAt));
  return Math.round(1e3 * (1 - elapsed / span / 2));
}
__name(points, "points");
function close(game) {
  if (game.phase !== "question") return;
  const q = question(game);
  const counts = q.choices.map(() => 0);
  const results = {};
  for (const [pid, p] of Object.entries(game.players)) {
    const a = game.answers[pid];
    if (a) counts[a.choice] += 1;
    const right = !!a && a.choice === q.answer;
    const gained = right ? points(game, a.at) : 0;
    p.score += gained;
    results[pid] = { answered: !!a, choice: a ? a.choice : null, right, gained };
  }
  game.last = { counts, results };
  game.phase = "reveal";
  game.deadline = 0;
}
__name(close, "close");
function advance(game, now) {
  if (game.phase === "question") close(game);
  else if (game.phase === "lobby" || game.phase === "reveal") open(game, now);
}
__name(advance, "advance");
function standings(game) {
  return Object.entries(game.players).map(([pid, p]) => ({ pid, name: p.name, score: p.score, order: p.order })).sort((a, b) => b.score - a.score || a.order - b.order).map((p, i, all) => ({
    pid: p.pid,
    name: p.name,
    score: p.score,
    rank: 1 + all.findIndex((q) => q.score === p.score)
  }));
}
__name(standings, "standings");
function publicQuestion(game, withAnswer) {
  const q = question(game);
  if (!q) return null;
  const out = {
    number: game.index + 1,
    total: game.questions.length,
    text: q.question,
    choices: q.choices.map((text, i) => ({ letter: LETTERS[i], text })),
    picture: q.picture || null
  };
  if (withAnswer) {
    out.answer = q.answer;
    out.note = q.note;
    if (q.word) out.word = q.word;
  }
  return out;
}
__name(publicQuestion, "publicQuestion");
function hostView(game, online, now) {
  const view = {
    role: "host",
    pin: game.pin,
    quiz: game.quiz,
    phase: game.phase,
    timer: game.timer,
    now,
    deadline: game.deadline,
    players: Object.entries(game.players).sort((a, b) => a[1].order - b[1].order).map(([pid, p]) => ({ pid, name: p.name, online: online.has(pid) })),
    total: game.questions.length
  };
  if (game.phase === "question") {
    view.question = publicQuestion(game, false);
    view.answered = Object.keys(game.answers).length;
  }
  if (game.phase === "reveal") {
    view.question = publicQuestion(game, true);
    view.counts = game.last.counts;
    view.standings = standings(game).slice(0, 5);
    view.last = game.index === game.questions.length - 1;
  }
  if (game.phase === "final") view.standings = standings(game).slice(0, 10);
  return view;
}
__name(hostView, "hostView");
function playerView(game, pid, now) {
  const p = game.players[pid];
  const view = {
    role: "player",
    pin: game.pin,
    quiz: game.quiz,
    phase: game.phase,
    now,
    deadline: game.deadline,
    me: p ? { name: p.name, score: p.score } : null
  };
  if (game.phase === "question") {
    view.question = publicQuestion(game, false);
    const a = game.answers[pid];
    view.chosen = a ? a.choice : null;
  }
  if (game.phase === "reveal" || game.phase === "final") {
    const table = standings(game);
    const mine = table.find((row) => row.pid === pid);
    if (mine) view.me.rank = mine.rank;
    view.players = table.length;
  }
  if (game.phase === "reveal") {
    view.question = publicQuestion(game, true);
    view.result = game.last && game.last.results[pid] || { answered: false, right: false, gained: 0 };
  }
  return view;
}
__name(playerView, "playerView");
function allAnswered(game, online) {
  const here = Object.keys(game.players).filter((pid) => online.has(pid));
  return here.length > 0 && here.every((pid) => game.answers[pid]);
}
__name(allAnswered, "allAnswered");

// room.mjs
var LIFETIME = 4 * 60 * 60 * 1e3;
function token() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c]);
}
__name(token, "token");
var LiveRoom = class {
  static {
    __name(this, "LiveRoom");
  }
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.game = null;
    this.now = () => Date.now();
  }
  async load() {
    if (this.game) return this.game;
    this.game = await this.ctx.storage.get("game") || null;
    if (this.game) {
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
    await this.ctx.storage.put("game", this.game);
  }
  async schedule() {
    const g = this.game;
    const when = g.phase === "question" ? g.deadline : g.created + LIFETIME;
    await this.ctx.storage.setAlarm(when);
  }
  online() {
    const set = /* @__PURE__ */ new Set();
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() || {};
      if (a.pid) set.add(a.pid);
    }
    return set;
  }
  send(ws, message) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
    }
  }
  viewFor(ws, online) {
    const a = ws.deserializeAttachment() || {};
    if (a.role === "host") return hostView(this.game, online, this.now());
    if (a.pid && this.game.players[a.pid]) return playerView(this.game, a.pid, this.now());
    return { role: "player", phase: this.game.phase, pin: this.game.pin, quiz: this.game.quiz, me: null, now: this.now() };
  }
  /* Every screen gets its own view of the game, or only the hosts and the
     one phone that changed. */
  broadcast(only) {
    const online = this.online();
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() || {};
      if (a.role === "gone" || only && a.role !== "host" && a.pid !== only) continue;
      this.send(ws, { t: "view", view: this.viewFor(ws, online) });
    }
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/create" && request.method === "POST") return this.create(request);
    if (url.pathname === "/ws") return this.connect(request, url);
    return new Response("Not found", { status: 404 });
  }
  async create(request) {
    const body = await request.json();
    const existing = await this.load();
    if (existing && this.now() < existing.created + LIFETIME) {
      return Response.json({ error: "taken" }, { status: 409 });
    }
    await this.ctx.storage.deleteAll();
    this.game = newGame({
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
    if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const game = await this.load();
    const done = /* @__PURE__ */ __name((error) => {
      this.send(server, { t: "error", error });
      server.close(4e3, error);
      return new Response(null, { status: 101, webSocket: client });
    }, "done");
    if (!game || this.now() >= game.created + LIFETIME) return done("no-room");
    if (url.searchParams.get("role") === "host") {
      if (url.searchParams.get("key") !== game.hostKey) return done("not-host");
      server.serializeAttachment({ role: "host" });
      this.send(server, { t: "view", view: hostView(game, this.online(), this.now()) });
      return new Response(null, { status: 101, webSocket: client });
    }
    const tok = String(url.searchParams.get("token") || "").slice(0, 64);
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(tok)) return done("token");
    if (game.kicked.includes(tok)) return done("removed");
    const seat = Object.entries(game.players).find(([, p]) => p.token === tok);
    const attach = { role: "player", token: tok, pid: seat ? seat[0] : null };
    if (seat) {
      const a = game.answers[seat[0]];
      if (a) attach.answer = { index: game.index, choice: a.choice, at: a.at };
    }
    server.serializeAttachment(attach);
    if (seat) this.broadcast();
    else this.send(server, { t: "view", view: this.viewFor(server, this.online()) });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 2e3) return;
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (error) {
      return;
    }
    const game = await this.load();
    if (!game) return;
    const a = ws.deserializeAttachment() || {};
    const now = this.now();
    if (a.role === "host") {
      if (msg.t === "advance") {
        advance(game, now);
      } else if (msg.t === "kick") {
        const pid = String(msg.pid || "");
        if (!kick(game, pid)) return;
        for (const other of this.ctx.getWebSockets()) {
          const oa = other.deserializeAttachment() || {};
          if (oa.pid === pid) {
            this.send(other, { t: "error", error: "removed" });
            other.serializeAttachment({ role: "gone" });
            other.close(4e3, "removed");
          }
        }
      } else if (msg.t === "end") {
        if (game.phase === "question") close(game);
        game.phase = "final";
        game.deadline = 0;
      } else return;
      await this.save();
      await this.schedule();
      this.broadcast();
      return;
    }
    if (a.role !== "player") return;
    if (msg.t === "join" && !a.pid) {
      const pid = "p" + token().slice(0, 10);
      const result = join(game, { name: msg.name, token: a.token, pid });
      if (result.error) {
        this.send(ws, { t: "error", error: result.error });
        return;
      }
      a.pid = result.pid;
      ws.serializeAttachment(a);
      await this.save();
      this.broadcast();
      return;
    }
    if (msg.t === "answer" && a.pid) {
      if (!answer(game, a.pid, msg.choice, now)) return;
      a.answer = { index: game.index, choice: msg.choice, at: now };
      ws.serializeAttachment(a);
      if (allAnswered(game, this.online())) {
        close(game);
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
    ws.serializeAttachment({ role: "gone" });
    if (!game || !a.pid) return;
    if (game.phase === "question" && allAnswered(game, this.online())) {
      close(game);
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
        this.send(ws, { t: "error", error: "no-room" });
        try {
          ws.close(4e3, "closed");
        } catch (error) {
        }
      }
      await this.ctx.storage.deleteAll();
      this.game = null;
      return;
    }
    if (game.phase === "question" && now >= game.deadline - 50) {
      close(game);
      await this.save();
      this.broadcast();
    }
    await this.schedule();
  }
};

// worker.mjs
var ORIGINS = ["https://hakanaltun.io", "https://www.hakanaltun.io"];
var PREVIEW = /^https:\/\/([a-z0-9-]+-)?hakanaltun-io\.hakanaltunn\.workers\.dev$/;
function allowed(origin, env) {
  if (!origin) return false;
  if (ORIGINS.includes(origin) || PREVIEW.test(origin)) return true;
  const extra = String(env.ALLOW_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin);
}
__name(allowed, "allowed");
function cors(origin, env) {
  const headers = { Vary: "Origin" };
  if (allowed(origin, env)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return headers;
}
__name(cors, "cors");
function random() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}
__name(random, "random");
async function bank(env) {
  const site = env.SITE || "https://hakanaltun.io";
  const response = await fetch(site + "/trivia/questions.json", { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) throw new Error("bank " + response.status);
  return response.json();
}
__name(bank, "bank");
async function openRoom(request, env, headers) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }
  const slug = String(body.quiz || "");
  const count = LIMITS.counts.includes(body.count) ? body.count : 10;
  const timer = LIMITS.timers.includes(body.timer) ? body.timer : 30;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return Response.json({ error: "quiz" }, { status: 400, headers });
  let all;
  try {
    all = await bank(env);
  } catch (error) {
    return Response.json({ error: "bank" }, { status: 502, headers });
  }
  const questions = pickQuestions(all, slug, count, random);
  if (!questions.length) return Response.json({ error: "quiz" }, { status: 400, headers });
  const quiz = { slug, name: (all.find((q) => q.slug === slug) || {}).quiz || slug };
  for (let tries = 0; tries < 8; tries += 1) {
    const pin = String(1e5 + Math.floor(random() * 9e5));
    const room = env.ROOMS.get(env.ROOMS.idFromName(pin));
    const answer2 = await room.fetch("https://room/create", {
      method: "POST",
      body: JSON.stringify({ pin, quiz, questions, timer })
    });
    if (answer2.status === 201) {
      const { hostKey } = await answer2.json();
      return Response.json({ pin, hostKey, quiz, count: questions.length, timer }, { status: 201, headers });
    }
  }
  return Response.json({ error: "busy" }, { status: 503, headers });
}
__name(openRoom, "openRoom");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const headers = cors(origin, env);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: allowed(origin, env) ? 204 : 403, headers });
    }
    if (url.pathname === "/rooms" && request.method === "POST") {
      if (!allowed(origin, env)) return Response.json({ error: "origin" }, { status: 403, headers });
      return openRoom(request, env, headers);
    }
    const socket = url.pathname.match(/^\/rooms\/(\d{6})\/ws$/);
    if (socket) {
      if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
      if (!allowed(origin, env)) return new Response("Forbidden", { status: 403 });
      const room = env.ROOMS.get(env.ROOMS.idFromName(socket[1]));
      return room.fetch(new Request("https://room/ws" + url.search, request));
    }
    if (url.pathname === "/") {
      return new Response("Rooms for playing hakanaltun.io quizzes together. Start one at https://hakanaltun.io/trivia/", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    return new Response("Not found", { status: 404 });
  }
};

// ../../../../tmp/claude-0/-home-claude/0d28c59d-9e3f-5346-89bb-689fd171076f/scratchpad/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../tmp/claude-0/-home-claude/0d28c59d-9e3f-5346-89bb-689fd171076f/scratchpad/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-b297RV/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../tmp/claude-0/-home-claude/0d28c59d-9e3f-5346-89bb-689fd171076f/scratchpad/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-b297RV/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  LiveRoom,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
