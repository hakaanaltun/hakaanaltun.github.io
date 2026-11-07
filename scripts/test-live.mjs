/* Checks for playing a quiz together (live/game.mjs), the rules with no
 * network in them. The room itself (live/room.mjs) was played through
 * locally under `wrangler dev` with a host and three phones on
 * 5 November 2026; these checks hold the rules it relies on.
 *
 *   node scripts/test-live.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as rules from '../live/game.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const bank = JSON.parse(fs.readFileSync(path.join(root, '_data', 'quizzes', 'britain.json'), 'utf8'))
  .map((q) => ({ ...q, slug: 'britain', quiz: 'British Culture' }));

// Names: plain, short, and one of each in a room.
assert.equal(rules.cleanName('  Ayşe   Nur '), 'Ayşe Nur');
assert.equal(rules.cleanName('<script>x</script>'), 'scriptxscript');
assert.equal(rules.cleanName('a'.repeat(40)).length, rules.LIMITS.name);
assert.equal(rules.cleanName('🙂🙂'), '');

// Questions: the asked number, the right answer followed through the shuffle,
// and the same shuffle for every screen in the room.
{
  const picked = rules.pickQuestions(bank, 'britain', 10, seeded(4));
  assert.equal(picked.length, 10);
  for (const q of picked) {
    const original = bank.find((b) => b.id === q.id);
    assert.equal(q.choices[q.answer], original.choices[original.answer], q.id + ': the answer survives the shuffle');
    assert.deepEqual([...q.choices].sort(), [...original.choices].sort());
  }
  assert.equal(rules.pickQuestions(bank, 'nowhere', 10, seeded(1)).length, 0, 'no questions from another quiz');
  assert.equal(rules.pickQuestions(bank, 'britain', 500, seeded(1)).length, rules.LIMITS.questions);
  const drawn = rules.pickQuestions(bank, 'britain', 50, seeded(2)).find((q) => q.picture);
  if (bank.some((q) => q.picture)) assert.ok(drawn, 'a question keeps its drawing');
}

function game(timer = 20) {
  const questions = rules.pickQuestions(bank, 'britain', 3, seeded(7));
  return rules.newGame({ pin: '123456', hostKey: 'k', quiz: { slug: 'britain', name: 'British Culture' }, questions, timer, now: 0 });
}

// Joining: a name once, a token returns its own place, a removed phone stays out.
{
  const g = game();
  assert.equal(rules.join(g, { name: 'Ayşe', token: 't1', pid: 'p1' }).pid, 'p1');
  assert.equal(rules.join(g, { name: 'ayşe', token: 't2', pid: 'p2' }).error, 'taken');
  assert.equal(rules.join(g, { name: '', token: 't2', pid: 'p2' }).error, 'name');
  assert.deepEqual(rules.join(g, { name: 'Other', token: 't1', pid: 'p9' }), { pid: 'p1', back: true });
  rules.join(g, { name: 'Can', token: 't2', pid: 'p2' });
  assert.ok(rules.kick(g, 'p2'));
  assert.equal(rules.join(g, { name: 'Can', token: 't2', pid: 'p3' }).error, 'removed');
  for (let i = 0; i < rules.LIMITS.players + 5; i += 1) rules.join(g, { name: 'N' + i, token: 'x' + i, pid: 'q' + i });
  assert.equal(Object.keys(g.players).length, rules.LIMITS.players, 'a room holds at most LIMITS.players');
}

// A question: answers once, before the deadline, only with a real choice;
// points from 1000 down to 500 as the time runs; nothing for wrong or none.
{
  const g = game(20);
  for (const [n, pid] of [['A', 'a'], ['B', 'b'], ['C', 'c'], ['D', 'd']]) rules.join(g, { name: n, token: 't' + pid, pid });
  rules.advance(g, 1000);
  assert.equal(g.phase, 'question');
  assert.equal(g.deadline, 21000);
  const q = rules.question(g);
  const wrong = (q.answer + 1) % q.choices.length;
  assert.ok(rules.answer(g, 'a', q.answer, 1000));
  assert.ok(!rules.answer(g, 'a', wrong, 1500), 'one answer each');
  assert.ok(rules.answer(g, 'b', q.answer, 11000));
  assert.ok(rules.answer(g, 'c', wrong, 2000));
  assert.ok(!rules.answer(g, 'd', 9, 2000), 'not a choice');
  assert.ok(!rules.answer(g, 'd', q.answer, 21001), 'too late');
  assert.ok(rules.allAnswered(g, new Set(['a', 'b', 'c'])), 'everyone still here has answered');
  assert.ok(!rules.allAnswered(g, new Set(['a', 'b', 'c', 'd'])));

  // The phone never learns the answer before the question closes.
  const before = rules.playerView(g, 'a', 2000);
  assert.equal(before.question.answer, undefined);
  assert.equal(before.question.note, undefined);
  assert.equal(before.chosen, q.answer);
  assert.equal(rules.hostView(g, new Set(), 2000).question.answer, undefined, 'nor the big screen');

  rules.advance(g, 12000);
  assert.equal(g.phase, 'reveal');
  assert.equal(g.players.a.score, 1000, 'at once: 1000');
  assert.equal(g.players.b.score, 750, 'half the time gone: 750');
  assert.equal(g.players.c.score, 0, 'wrong: nothing');
  assert.equal(g.players.d.score, 0, 'no answer: nothing');
  assert.equal(rules.points(g, 99999), 500, 'the last moment still earns 500');
  const counts = g.last.counts;
  assert.equal(counts[q.answer], 2);
  assert.equal(counts[wrong], 1);

  const host = rules.hostView(g, new Set(['a']), 12000);
  assert.equal(host.question.answer, q.answer);
  assert.equal(host.question.note, q.note, 'the note is shown once the question closes');
  assert.deepEqual(host.standings.map((s) => [s.name, s.rank]), [['A', 1], ['B', 2], ['C', 3], ['D', 3]], 'equal scores share a place');
  const phone = rules.playerView(g, 'b', 12000);
  assert.deepEqual(phone.result, { answered: true, choice: q.answer, right: true, gained: 750 });
  assert.equal(phone.me.rank, 2);
  assert.equal(phone.players, 4);
  assert.equal(phone.standings, undefined, 'a phone sees its own place, not the others');
  assert.equal(phone.question.note, q.note, 'and the note, once the question closes');

  rules.advance(g, 13000);
  rules.advance(g, 14000);
  rules.advance(g, 15000);
  rules.advance(g, 16000);
  assert.equal(g.phase, 'reveal');
  assert.equal(rules.hostView(g, new Set(), 16000).last, true, 'the big screen knows the last question');
  rules.advance(g, 17000);
  assert.equal(g.phase, 'final');
  assert.equal(rules.join(g, { name: 'Late', token: 'late', pid: 'z' }).error, 'over');
}

// A speaking set keeps its vocabulary warm-up before the situations, even
// when opened with the default culture-quiz count.
const speakingDir = path.join(root, '_data', 'speaking');
for (const file of fs.readdirSync(speakingDir).filter((entry) => entry.endsWith('.json'))) {
  const slug = path.basename(file, '.json');
  const set = JSON.parse(fs.readFileSync(path.join(speakingDir, file), 'utf8'));
  assert.equal(set.length, 15, slug);
  const seenIds = new Set();
  set.forEach((q, index) => {
    assert.match(q.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, slug);
    assert.ok(!seenIds.has(q.id), slug + ': duplicate id');
    seenIds.add(q.id);
    assert.equal(q.category, index < 5 ? 'Words in conversation' : 'What would you say?');
    assert.equal(new Set(q.choices).size, 4, slug + ': duplicate choices');
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
    assert.ok(q.question.trim() && q.note.trim());
    assert.ok(!/\b(?:option|choice) [A-D]\b|[“”]?[A-D][“”]? (?:is|would be) (?:correct|wrong)/.test(q.note),
      slug + ': explanations quote words, not shuffled letters');
  });
  const [, level, ...parts] = slug.split('-');
  const page = fs.readFileSync(path.join(root, 'speaking', level, parts.join('-'), 'index.html'), 'utf8');
  assert.ok(page.includes(slug), slug + ': playable page names its bank');
  const picked = rules.pickQuestions(set.map((q) => ({ ...q, slug })), slug, 10, seeded(5));
  assert.equal(picked.length, 15);
  assert.equal(new Set(picked.map((q) => q.id)).size, 15);
  picked.forEach((q, i) => {
    const original = set.find((item) => item.id === q.id);
    assert.equal(original.category, i < 5 ? 'Words in conversation' : 'What would you say?');
    assert.equal(new Set(q.choices).size, 4);
    assert.equal(q.choices[q.answer], original.choices[original.answer]);
    assert.ok(q.note && q.picture.alt && fs.existsSync(path.join(root, q.picture.src)));
  });
}

// Only the set timers, and a timer outside them falls back to 30 seconds.
assert.equal(game(45).timer, 45);
assert.equal(game(7).timer, 30);

// The room's Worker takes the questions from the site's bank, and accepts
// screens only from the site and its previews.
{
  const worker = fs.readFileSync(path.join(root, 'live', 'worker.mjs'), 'utf8');
  assert.match(worker, /\/trivia\/questions\.json/);
  assert.ok(!/body\.questions/.test(worker), 'the questions never come from the request');
  const config = fs.readFileSync(path.join(root, 'live', 'wrangler.jsonc'), 'utf8');
  assert.match(config, /"new_sqlite_classes": \["LiveRoom"\]/, 'SQLite rooms, the kind the free plan offers');
  const site = fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8');
  assert.ok(!/durable_objects/.test(site), 'the site\'s own Worker holds no room, so its previews stay');
  const jekyll = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
  assert.match(jekyll, /^\s+- live$/m, 'the rooms\' code is not published as part of the site');
}

console.log('Live play checks passed: names, questions and their shuffle, joining and returning, removal, answers once and in time, Kahoot points, shared places, what each screen may see, the last question, timers, and where the rooms take their questions from.');
