/* Content checks: the parts of the editorial rules in AGENTS.md that a
 * script can hold, so that they are held on every pull request rather than
 * only when someone remembers to look.
 *
 * What this cannot do is the part that matters most: say whether a note is
 * true, whether a source says what it is cited for, or whether a link that
 * works goes to the right page. Those still need a person, or a review. This
 * only keeps the mechanical slips from reaching the site, and it lists every
 * one it finds at once, so a failed run is a list to work through rather than
 * one error at a time.
 *
 * The word and link checks read the rendered _site/, so the rules are checked
 * against what a reader gets. Run `bundle exec jekyll build` first. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const site = path.join(root, '_site');
const problems = new Map();
const problem = (where, message) => {
  const line = `${where}: ${message}`;
  problems.set(line, (problems.get(line) || 0) + 1);
};
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const list = (dir, ext) => fs.readdirSync(path.join(root, dir))
  .filter((name) => name.endsWith(ext)).sort().map((name) => `${dir}/${name}`);

if (!fs.existsSync(path.join(site, 'word', 'index.html'))) {
  console.error('test-content: run `bundle exec jekyll build` first (missing _site/word/index.html)');
  process.exit(1);
}

/* Em dashes are closed up: word—word. A dash that opens a line or a
   paragraph, as before an attribution or a line of dialogue, is not between
   two words and is left alone.
   Front matter holds titles, whose spaced dash is deliberate, so it is
   blanked rather than checked: blanked, not cut, so line numbers still match
   the file. Comments, styles and scripts are notes and code, not prose. */
const spacedDash = /[^\s>][ \u00a0]—[ \u00a0]?\S|[^\s>][ \u00a0]?—[ \u00a0]\S/;
const notProse = /^---\n[\s\S]*?\n---\n|<!--[\s\S]*?-->|\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}|<style\b[\s\S]*?<\/style>|<script\b[\s\S]*?<\/script>/g;
function checkDashes(where, text) {
  text.replace(notProse, (part) => part.replace(/[^\n]/g, ''))
    .split('\n').forEach((line, i) => {
      if (spacedDash.test(line)) problem(`${where}:${i + 1}`, `spaced em dash, close it up (word—word): ${line.trim().slice(0, 80)}`);
    });
}

// --- Trivia ----------------------------------------------------------------

/* The British bank was written before notes had to carry sources, and most of
   its questions still have none. It may not gain any more; lower this as they
   are sourced, and remove it once it reaches zero. */
const UNSOURCED_ALLOWED = { britain: 41 };

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

for (const file of list('_data/quizzes', '.json')) {
  const slug = path.basename(file, '.json');
  let bank;
  try {
    bank = JSON.parse(read(file));
  } catch (error) {
    problem(file, `not valid JSON: ${error.message}`);
    continue;
  }
  checkDashes(file, read(file));

  let unsourced = 0;
  const seen = new Set();
  const ids = new Set();
  bank.forEach((q, i) => {
    const where = `${file} #${i + 1}`;
    if (!q.question) return problem(where, 'no question');
    const label = `${where} “${q.question.slice(0, 50)}”`;
    if (seen.has(q.question)) problem(label, 'asked twice in this bank');
    seen.add(q.question);
    /* Readers keep questions in their drawer by this id, so it outlives any
       rewording or reordering. A new question gets a new one. */
    if (typeof q.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(q.id)) {
      problem(label, 'needs an "id": lowercase letters, digits and hyphens');
    } else if (ids.has(q.id)) {
      problem(label, `id “${q.id}” is used twice in this bank`);
    }
    ids.add(q.id);
    if (!q.category) problem(label, 'no category; a category is a round');
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      problem(label, 'needs exactly four choices');
    } else {
      if (new Set(q.choices).size !== 4) problem(label, 'two choices are the same');
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
        problem(label, '"answer" must be 0–3, the position of the right choice');
      } else {
        /* Only the plain case: the answer written out in its own question.
           Naming the bear names the station is beyond a script. */
        const answer = q.choices[q.answer];
        if (answer.length >= 4 && new RegExp(`\\b${escapeRegExp(answer)}\\b`, 'i').test(q.question)) {
          problem(label, `the answer “${answer}” stands inside the question`);
        }
      }
    }
    if (!q.note || !q.note.trim()) problem(label, 'no note; the note is what a reader keeps');
    const sources = q.sources || [];
    if (!sources.length) unsourced += 1;
    for (const url of sources) {
      if (!/^https?:\/\/[^\s/]+\.[^\s]+$/.test(url)) problem(label, `source is not a web address: ${url}`);
    }
  });

  const allowed = UNSOURCED_ALLOWED[slug] || 0;
  if (unsourced > allowed) {
    problem(file, `${unsourced} question${unsourced === 1 ? ' has' : 's have'} no sources (allowed: ${allowed}); every claim must be sourced`);
  } else if (unsourced < allowed) {
    problem(file, `only ${unsourced} questions are unsourced now; lower UNSOURCED_ALLOWED.${slug} in scripts/test-content.cjs to ${unsourced}`);
  }

  /* The bank is stored grouped, in round order, and the quiz reads its rounds
     from that: a category that reappears later splits into two rounds. */
  const runs = [];
  for (const q of bank) {
    if (runs.length && runs[runs.length - 1].category === q.category) runs[runs.length - 1].size += 1;
    else runs.push({ category: q.category, size: 1 });
  }
  const names = runs.map((run) => run.category);
  names.forEach((name, i) => {
    if (names.indexOf(name) !== i) problem(file, `round “${name}” is split; keep its questions together`);
  });
  for (const run of runs) {
    if (run.size < 6 || run.size > 14) problem(file, `round “${run.category}” has ${run.size} questions; aim for six to fourteen`);
  }
}

// --- Words with Stories ----------------------------------------------------

for (const file of list('_words', '.md')) {
  const text = read(file);
  const front = (text.match(/^---\n([\s\S]*?)\n---\n/) || [])[1] || '';
  for (const key of ['word', 'pos', 'teaser', 'description', 'sources']) {
    if (!new RegExp(`^${key}:`, 'm').test(front)) problem(file, `front matter has no ${key}`);
  }
  checkDashes(file, text);

  /* Footnotes are numbered in the order they first appear, like any numbered
     notes: the first cited is 1, the next new one 2. Every source is cited
     somewhere, or the list is sourcing nothing in particular. */
  const slug = path.basename(file, '.md');
  const pagePath = path.join(site, 'word', slug, 'index.html');
  if (!fs.existsSync(pagePath)) {
    problem(file, `no rendered page at _site/word/${slug}/`);
    continue;
  }
  const page = fs.readFileSync(pagePath, 'utf8');
  const count = (page.match(/<li id="source-\d+">/g) || []).length;
  const cites = [...page.matchAll(/<sup class="word-cite">([\s\S]*?)<\/sup>/g)]
    .map((sup) => [...sup[1].matchAll(/href="#source-(\d+)"/g)].map((m) => Number(m[1])));
  const cited = cites.flat();
  if (!count) problem(file, 'no sources listed');
  if (!cited.length) problem(file, 'no footnote markers; tie each claim to its source');
  for (const n of new Set(cited)) {
    if (n < 1 || n > count) problem(file, `footnote ${n} points past the ${count} sources`);
  }
  for (let n = 1; n <= count; n += 1) {
    if (!cited.includes(n)) problem(file, `source ${n} is never cited`);
  }
  const order = [...new Set(cited)];
  if (order.some((n, i) => n !== i + 1)) {
    problem(file, `footnotes first appear as ${order.join(', ')}; list the sources in that order so they read 1, 2, 3`);
  }
  cites.forEach((group) => {
    if (group.some((n, i) => i && n < group[i - 1])) problem(file, `footnote group ${group.join(',')} is out of order`);
  });
}

// --- Other prose -----------------------------------------------------------

for (const file of list('_posts', '.html')) checkDashes(file, read(file));
for (const file of list('_includes/book', '.html')) checkDashes(file, read(file));
checkDashes('_data/notes.yml', read('_data/notes.yml').split('\n')
  .map((line) => (line.trim().startsWith('#') ? '' : line)).join('\n'));

// --- Links inside the site -------------------------------------------------

/* Every link and image on the built site that points inside it must lead
   somewhere, and a link to #something must find that id on its page. The
   480/ and 960/ image sizes are made from the originals when the site is
   deployed, so an original standing in for them is enough. */
function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'vendor' || entry.name === 'pdfjs' ? [] : htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}
const idCache = new Map();
function ids(file) {
  if (!idCache.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}
function resolve(urlPath) {
  const plain = decodeURIComponent(urlPath);
  const candidates = plain.endsWith('/')
    ? [path.join(site, plain, 'index.html')]
    : [path.join(site, plain), path.join(site, `${plain}.html`), path.join(site, plain, 'index.html')];
  const resized = plain.match(/^\/images\/(?:480|960)\/(.+)$/);
  if (resized) candidates.push(path.join(site, 'images', resized[1]));
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

for (const file of htmlFiles(site)) {
  const where = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8')
    .replace(/<script\b[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  for (const match of html.matchAll(/\s(?:href|src)=(?:"([^"]*)"|'([^']*)')/g)) {
    const link = unescape(match[1] ?? match[2]);
    if (!link || /^(?:[a-z]+:|\/\/|\{\{)/i.test(link)) continue;
    const [beforeHash, hash] = link.split('#');
    const urlPath = beforeHash.split('?')[0];
    if (!urlPath) {
      if (hash && !ids(file).has(decodeURIComponent(hash))) problem(where, `#${hash} has no element with that id on the page`);
      continue;
    }
    if (!urlPath.startsWith('/')) continue;
    const target = resolve(urlPath);
    if (!target) {
      problem(where, `link to ${urlPath}, which is not on the site`);
    } else if (hash && target.endsWith('.html') && !ids(target).has(decodeURIComponent(hash))) {
      problem(where, `link to ${link}, but that page has no #${hash}`);
    }
  }
}

if (problems.size) {
  console.error(`Content checks found ${problems.size} problem${problems.size === 1 ? '' : 's'}:\n`);
  for (const [line, times] of problems) console.error(`  ${line}${times > 1 ? ` (${times} times)` : ''}`);
  process.exitCode = 1;
} else {
  console.log('Content checks passed: quiz banks, word footnotes, closed-up dashes and links inside the site.');
}
