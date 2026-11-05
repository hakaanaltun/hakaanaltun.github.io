// worker.mjs — live.hakanaltun.io, the rooms for playing a quiz together
// (5 November 2026). The pages are on the site (/trivia/live/ for the big
// screen, /join/ for the phones); this Worker only opens rooms and connects
// screens to them. It is its own Worker, beside the site's, because
// Cloudflare gives no preview addresses to a Worker that holds a Durable
// Object, and the site's branches keep theirs.
//
//   POST /rooms            { quiz, count, timer } → { pin, hostKey }
//   GET  /rooms/<pin>/ws   a WebSocket into the room (?role=host&key=… or
//                          ?token=… for a phone)
//
// The questions come from the site's own bank, never from the request, so a
// room can only ever show the site's quizzes.

import { LiveRoom } from './room.mjs';
import { LIMITS, pickQuestions } from './game.mjs';

export { LiveRoom };

const ORIGINS = ['https://hakanaltun.io', 'https://www.hakanaltun.io'];
// A branch's preview of the site: <version>-hakanaltun-io.hakanaltunn.workers.dev
const PREVIEW = /^https:\/\/([a-z0-9-]+-)?hakanaltun-io\.hakanaltunn\.workers\.dev$/;

function allowed(origin, env) {
  if (!origin) return false;
  if (ORIGINS.includes(origin) || PREVIEW.test(origin)) return true;
  const extra = String(env.ALLOW_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin);
}

function cors(origin, env) {
  const headers = { Vary: 'Origin' };
  if (allowed(origin, env)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return headers;
}

function random() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}

async function bank(env) {
  const site = env.SITE || 'https://hakanaltun.io';
  const response = await fetch(site + '/trivia/questions.json', { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) throw new Error('bank ' + response.status);
  return response.json();
}

async function openRoom(request, env, headers) {
  let body;
  try { body = await request.json(); } catch (error) { body = {}; }
  const slug = String(body.quiz || '');
  const count = LIMITS.counts.includes(body.count) ? body.count : 10;
  const timer = LIMITS.timers.includes(body.timer) ? body.timer : 30;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return Response.json({ error: 'quiz' }, { status: 400, headers });

  let all;
  try { all = await bank(env); } catch (error) {
    return Response.json({ error: 'bank' }, { status: 502, headers });
  }
  const questions = pickQuestions(all, slug, count, random);
  if (!questions.length) return Response.json({ error: 'quiz' }, { status: 400, headers });
  const quiz = { slug, name: (all.find((q) => q.slug === slug) || {}).quiz || slug };

  // A free six-digit code: a room still in use answers 409, and another
  // code is tried.
  for (let tries = 0; tries < 8; tries += 1) {
    const pin = String(100000 + Math.floor(random() * 900000));
    const room = env.ROOMS.get(env.ROOMS.idFromName(pin));
    const answer = await room.fetch('https://room/create', {
      method: 'POST',
      body: JSON.stringify({ pin, quiz, questions, timer })
    });
    if (answer.status === 201) {
      const { hostKey } = await answer.json();
      return Response.json({ pin, hostKey, quiz, count: questions.length, timer }, { status: 201, headers });
    }
  }
  return Response.json({ error: 'busy' }, { status: 503, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const headers = cors(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: allowed(origin, env) ? 204 : 403, headers });
    }

    if (url.pathname === '/rooms' && request.method === 'POST') {
      if (!allowed(origin, env)) return Response.json({ error: 'origin' }, { status: 403, headers });
      return openRoom(request, env, headers);
    }

    const socket = url.pathname.match(/^\/rooms\/(\d{6})\/ws$/);
    if (socket) {
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
      if (!allowed(origin, env)) return new Response('Forbidden', { status: 403 });
      const room = env.ROOMS.get(env.ROOMS.idFromName(socket[1]));
      return room.fetch(new Request('https://room/ws' + url.search, request));
    }

    if (url.pathname === '/') {
      return new Response('Rooms for playing hakanaltun.io quizzes together. Start one at https://hakanaltun.io/trivia/', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    return new Response('Not found', { status: 404 });
  }
};
