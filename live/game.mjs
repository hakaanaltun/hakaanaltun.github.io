// game.mjs — the rules of a live trivia game, with no network in them
// (5 November 2026). The room (room.mjs) keeps one game object, hands it to
// these functions as things happen, and sends each screen the view made for
// it. Everything here is plain data in and plain data out, so the rules are
// tested on their own (scripts/test-live.mjs).
//
// A game runs lobby → question → reveal → question → … → final. The teacher's
// screen moves it on; a question also closes by itself when its time is up or
// when everyone still in the room has answered. A right answer earns between
// 500 and 1000 points, more the sooner it came, as Kahoot counts them; a
// wrong one or none earns nothing.

export const LIMITS = {
  players: 80,
  name: 16,
  questions: 50,
  timers: [20, 30, 45, 60],
  counts: [5, 10, 15, 20, 30, 50]
};

const LETTERS = 'ABCD';

function shuffle(list, rand) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* A name as the room shows it: letters, digits, spaces and a few marks, at
   most LIMITS.name characters, spaces closed up. Anything else is dropped. */
export function cleanName(raw) {
  return String(raw || '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} .'_-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LIMITS.name)
    .trim();
}

/* The questions of one quiz from the site's bank (/trivia/questions.json),
   count of them in a random order, each with its choices shuffled once for
   the whole room, since the big screen and every phone must agree on what
   A means. */
export function pickQuestions(bank, slug, count, rand) {
  const own = bank.filter((q) => q && q.slug === slug && Array.isArray(q.choices) &&
    q.choices.length >= 2 && q.choices.length <= 4 &&
    Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length);
  let selected;
  if (slug.startsWith('speaking-')) {
    const rounds = new Set(own.map((q) => q.category));
    selected = Array.from(rounds).flatMap((round) =>
      shuffle(own.filter((q) => q.category === round), rand)
    ).slice(0, LIMITS.questions);
  } else {
    selected = shuffle(own, rand).slice(0, Math.min(count, LIMITS.questions));
  }
  return selected.map((q) => {
    const order = shuffle(q.choices.map((_, i) => i), rand);
    const out = {
      id: q.id,
      question: q.question,
      choices: order.map((i) => q.choices[i]),
      answer: order.indexOf(q.answer),
      note: q.note || ''
    };
    if (q.picture) out.picture = q.picture;
    if (q.word) out.word = q.word;
    return out;
  });
}

export function newGame({ pin, hostKey, quiz, questions, timer, now }) {
  return {
    pin,
    hostKey,
    quiz,
    timer: LIMITS.timers.includes(timer) ? timer : 30,
    questions,
    phase: 'lobby',
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

export function question(game) {
  return game.questions[game.index] || null;
}

/* A phone joins, or comes back. A phone that has been here before brings
   its token and gets its own place back, score and all, even under a
   different name. */
export function join(game, { name, token, pid }) {
  if (game.phase === 'final') return { error: 'over' };
  if (token && game.kicked.includes(token)) return { error: 'removed' };
  if (token) {
    for (const [id, p] of Object.entries(game.players)) {
      if (p.token === token) return { pid: id, back: true };
    }
  }
  const clean = cleanName(name);
  if (!clean) return { error: 'name' };
  const taken = Object.values(game.players).some((p) => p.name.toLowerCase() === clean.toLowerCase());
  if (taken) return { error: 'taken' };
  if (Object.keys(game.players).length >= LIMITS.players) return { error: 'full' };
  game.order += 1;
  game.players[pid] = { name: clean, token, score: 0, order: game.order };
  return { pid, back: false };
}

export function kick(game, pid) {
  const p = game.players[pid];
  if (!p) return false;
  game.kicked.push(p.token);
  delete game.players[pid];
  delete game.answers[pid];
  return true;
}

export function open(game, now) {
  game.index += 1;
  if (game.index >= game.questions.length) {
    game.phase = 'final';
    game.deadline = 0;
    return;
  }
  game.phase = 'question';
  game.answers = {};
  game.openedAt = now;
  game.deadline = now + game.timer * 1000;
}

export function answer(game, pid, choice, now) {
  if (game.phase !== 'question' || !game.players[pid]) return false;
  if (game.answers[pid]) return false;
  const q = question(game);
  if (!Number.isInteger(choice) || choice < 0 || choice >= q.choices.length) return false;
  if (now > game.deadline) return false;
  game.answers[pid] = { choice, at: now };
  return true;
}

export function points(game, at) {
  const span = game.timer * 1000;
  const elapsed = Math.min(span, Math.max(0, at - game.openedAt));
  return Math.round(1000 * (1 - elapsed / span / 2));
}

/* The question closes: the answers are counted and the scores move. */
export function close(game) {
  if (game.phase !== 'question') return;
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
  game.phase = 'reveal';
  game.deadline = 0;
}

/* The teacher's button: start the game, close a question early, or go on to
   the next one. */
export function advance(game, now) {
  if (game.phase === 'question') close(game);
  else if (game.phase === 'lobby' || game.phase === 'reveal') open(game, now);
}

export function standings(game) {
  return Object.entries(game.players)
    .map(([pid, p]) => ({ pid, name: p.name, score: p.score, order: p.order }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    // Equal scores share a place: a place is one more than the number of
    // players ahead.
    .map((p, i, all) => ({
      pid: p.pid,
      name: p.name,
      score: p.score,
      rank: 1 + all.findIndex((q) => q.score === p.score)
    }));
}

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

/* The big screen: everything, the names in the room and who is online. */
export function hostView(game, online, now) {
  const view = {
    role: 'host',
    pin: game.pin,
    quiz: game.quiz,
    phase: game.phase,
    timer: game.timer,
    now,
    deadline: game.deadline,
    players: Object.entries(game.players)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([pid, p]) => ({ pid, name: p.name, online: online.has(pid) })),
    total: game.questions.length
  };
  if (game.phase === 'question') {
    view.question = publicQuestion(game, false);
    view.answered = Object.keys(game.answers).length;
  }
  if (game.phase === 'reveal') {
    view.question = publicQuestion(game, true);
    view.counts = game.last.counts;
    view.standings = standings(game).slice(0, 5);
    view.last = game.index === game.questions.length - 1;
  }
  if (game.phase === 'final') view.standings = standings(game).slice(0, 10);
  return view;
}

/* One phone: the question and its choices, and only its own result. */
export function playerView(game, pid, now) {
  const p = game.players[pid];
  const view = {
    role: 'player',
    pin: game.pin,
    quiz: game.quiz,
    phase: game.phase,
    now,
    deadline: game.deadline,
    me: p ? { name: p.name, score: p.score } : null
  };
  if (game.phase === 'question') {
    view.question = publicQuestion(game, false);
    const a = game.answers[pid];
    view.chosen = a ? a.choice : null;
  }
  if (game.phase === 'reveal' || game.phase === 'final') {
    const table = standings(game);
    const mine = table.find((row) => row.pid === pid);
    if (mine) view.me.rank = mine.rank;
    view.players = table.length;
  }
  if (game.phase === 'reveal') {
    view.question = publicQuestion(game, true);
    view.result = (game.last && game.last.results[pid]) || { answered: false, right: false, gained: 0 };
  }
  return view;
}

/* Is everyone who is here answered? Then the question need not wait. */
export function allAnswered(game, online) {
  const here = Object.keys(game.players).filter((pid) => online.has(pid));
  return here.length > 0 && here.every((pid) => game.answers[pid]);
}
