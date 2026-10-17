/* Content checks: the parts of the editorial rules in COLOPHON.md that a
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
const UNSOURCED_ALLOWED = { britain: 36 };

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

/* COLOPHON.md was published as /colophon/ and may be again, and AGENTS.md
   and the notes in _agents/ are kept in the same prose. Their code spans
   quote titles and commands as they are, so they are blanked like comments.
   A word hyphenated across a line break would reach the page as two:
   "hand- balancing". The colophon also keeps the site's curly marks: a
   straight one outside a code span would reach the page as it is. */
const notes = ['AGENTS.md', 'COLOPHON.md', ...list('_agents', '.md')];
for (const file of notes) {
  const text = read(file);
  const blanked = text.replace(/`[^`\n]*`/g, (part) => part.replace(/[^\n]/g, ''));
  checkDashes(file, blanked);
  text.split('\n').forEach((line, i) => {
    if (/[A-Za-z]-$/.test(line)) problem(`${file}:${i + 1}`, `a word is split at the end of the line; keep it on one line: ${line.trim().slice(-40)}`);
  });
  if (file === 'COLOPHON.md') {
    blanked.split('\n').forEach((line, i) => {
      if (/['"]/.test(line)) problem(`${file}:${i + 1}`, `a straight mark outside a code span; curl it: ${line.trim().slice(0, 80)}`);
    });
  }
}
if (!notes.includes('_agents/house.md')) problem('_agents/', 'the notes on The House are missing');

// --- Dashes on the built pages ---------------------------------------------

/* _plugins/dash_join.rb puts a word joiner (U+2060) before every closed-up
   em dash on a rendered page, so the dash stays with the word before it
   rather than opening a line. Scripts, styles, code, text fields, titles and
   attributes keep the plain dash: a joiner there would change what a script
   reads or what a field holds. Every page also ends with the plugin's short
   script that takes the joiner out of what a reader copies. */
const keptPlain = /<(script|style|pre|code|textarea|title)\b[\s\S]*?<\/\1\s*>/gi;
const anyTag = /<(?:[^>"']|"[^"]*"|'[^']*')*>/g;
const unjoined = /[^\s\u2060](?:—|&mdash;|&#8212;|&#x2014;)/i;
function checkJoinedDashes(file) {
  const where = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  if (/<\/body\s*>/i.test(html) && !html.includes('<script data-dash-copy>')) problem(where, 'no copy script from _plugins/dash_join.rb before </body>');
  for (const block of html.match(keptPlain) || []) {
    if (block.includes('\u2060')) problem(where, `a word joiner inside <${block.match(/^<(\w+)/)[1]}>, which should keep the plain dash`);
  }
  const text = html.replace(keptPlain, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const tag of text.match(anyTag) || []) {
    if (tag.includes('\u2060')) problem(where, `a word joiner inside a tag: ${tag.slice(0, 60)}`);
  }
  for (const part of text.split(anyTag)) {
    const found = part.match(unjoined);
    if (found) problem(where, `an em dash without its word joiner: ${part.slice(Math.max(0, found.index - 30), found.index + 20).trim()}`);
  }
}

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

/* An old address (/essays/, /pieces/ for a part of the book) moves on at
   once to where its page is now. It has to go there in one step: when a page
   moves again, every address that pointed at it is changed to the new place. */
const movesOn = (html) => html.match(/http-equiv="refresh" content="0; *url=([^"]+)"/)?.[1];

for (const file of htmlFiles(site)) {
  checkJoinedDashes(file);
  const where = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8')
    .replace(/<script\b[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const next = movesOn(html);
  if (next?.startsWith('/')) {
    const target = resolve(next.split('#')[0].split('?')[0]);
    const after = target && movesOn(fs.readFileSync(target, 'utf8'));
    if (after) problem(where, `moves on to ${next}, which moves on again to ${after}`);
  }
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

// --- Pictures inside links -------------------------------------------------

/* A link names its destination with its own words: a card's title, its
   date, its teaser. A picture inside such a link has an empty alt, or a
   screen reader reads the whole description of the cover before the title,
   in every list of links. The description stays where the picture is the
   subject, on the piece or the picture's own page. A link with no words of
   its own still needs its picture's alt to name it. The scripts that build
   cards are held to the same rule. */
const visibleWords = (html) => html
  .replace(/<img\b[^>]*>/gi, '')
  .replace(/<[^>]*\baria-hidden="true"[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .trim();
for (const file of htmlFiles(site)) {
  const where = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8')
    .replace(/<script\b[\s\S]*?<\/script>/g, '')
    .replace(/<template\b[\s\S]*?<\/template>/g, '');
  for (const [link] of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
    if (!/<img\b/i.test(link) || /^<a\b[^>]*\baria-label=/i.test(link) || !visibleWords(link)) continue;
    for (const [img] of link.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\balt=""/.test(img)) problem(where, `a picture inside a link with its own words keeps an alt; give it alt="": ${img.slice(0, 90)}`);
    }
  }
}
for (const file of ['js/more-essays.js', 'js/series-nav.js', 'js/cafe-nav.js']) {
  for (const [img] of read(file).matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=""/.test(img)) problem(file, `a card's picture keeps an alt; its link has its own words, so give it alt="": ${img.slice(0, 90)}`);
  }
}

// --- Curly quotes on the built pages ---------------------------------------

/* Quotation marks and apostrophes are curly in everything a reader sees:
   the text, the titles, what a screen reader or a shared card reads, and
   the JSON the site's scripts show. The build curls only Markdown, so a
   straight mark written in HTML, front matter or _data reaches the page as
   it is. The slip is a straight mark against a letter (doesn't, 'star').
   One standing apart is left alone, so The Marks and The Clean can still
   show the keyboard's marks, and 5'10" can be a height. Code, scripts,
   styles and addresses keep their straight marks. Text written inside a
   script is out of this check's reach. */
const straight = /\p{L}['"]|['"]\p{L}/u;
const plainMarks = (s) => s
  .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
  .replace(/&#0*34;|&#x0*22;|&quot;/gi, '"')
  .replace(/&amp;/g, '&');
function checkCurly(where, what, text) {
  const found = text.match(straight);
  if (found) problem(where, `a straight mark in ${what}; write ’ ‘ ’ “ ”: ${text.slice(Math.max(0, found.index - 30), found.index + 20).trim()}`);
}
const readAloud = /\s(alt|title|aria-label|placeholder|data-keep-title)="([^"]*)"/g;
const describes = /^<meta\b[^>]*\b(?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description)"/i;
const eachString = (value, visit) => {
  if (typeof value === 'string') visit(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((part) => eachString(part, visit));
};
const proseIn = (value, visit) => eachString(value, (s) => {
  if (!/^(?:[a-z]+:|\/|#)/i.test(s)) visit(plainMarks(s.replace(anyTag, ' ')));
});
for (const file of htmlFiles(site)) {
  const where = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      proseIn(JSON.parse(json), (s) => checkCurly(where, 'the description for search engines', s));
    } catch (error) {
      problem(where, `its description for search engines is not valid JSON: ${error.message}`);
    }
  }
  const page = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|pre|code|kbd|samp|textarea)\b[\s\S]*?<\/\1\s*>/gi, '');
  for (const tag of page.match(anyTag) || []) {
    for (const [, name, value] of tag.matchAll(readAloud)) checkCurly(where, `${name}="…"`, plainMarks(value));
    if (describes.test(tag)) checkCurly(where, 'a description in <meta>', plainMarks(tag.match(/\scontent="([^"]*)"/)?.[1] || ''));
  }
  for (const part of page.split(anyTag)) checkCurly(where, 'the text', plainMarks(part));
}
for (const file of fs.readdirSync(site, { recursive: true }).filter((name) => name.endsWith('.json'))) {
  if (/(?:^|\/)(?:vendor|pdfjs)\//.test(file)) continue;
  proseIn(JSON.parse(fs.readFileSync(path.join(site, file), 'utf8')), (s) => checkCurly(`_site/${file}`, 'what a script shows', s));
}

if (problems.size) {
  console.error(`Content checks found ${problems.size} problem${problems.size === 1 ? '' : 's'}:\n`);
  for (const [line, times] of problems) console.error(`  ${line}${times > 1 ? ` (${times} times)` : ''}`);
  process.exitCode = 1;
} else {
  console.log('Content checks passed: quiz banks, word footnotes, closed-up dashes, their word joiners on the built pages, links inside the site, pictures inside links and curly quotes.');
}
