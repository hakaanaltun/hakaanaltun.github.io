/* The sources behind the site, checked from outside: every web address a word
 * story, a quiz question, an essay or a note cites, fetched to see that it is
 * still there. Run weekly by .github/workflows/links.yml, and by hand with
 * `npm run links`.
 *
 * This is not part of `npm test`. It depends on other people's servers, and a
 * pull request should not fail because a museum's site was down for an hour.
 *
 * Only a page that answers "gone" (404 or 410), or a site that no longer
 * exists, fails the run. Many sites refuse scripts outright (403, 429) or
 * are briefly down; those are listed as not checked, because they say nothing
 * about the page itself. A link that works but goes to the wrong page, like a
 * slideshow link that opens on the wrong slide, is beyond any script. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const list = (dir, ext) => fs.readdirSync(path.join(root, dir))
  .filter((name) => name.endsWith(ext)).sort().map((name) => `${dir}/${name}`);

/* url → the files that cite it */
const cited = new Map();
const add = (url, file) => {
  const clean = url.replace(/&amp;/g, '&');
  if (!/^https?:\/\/[^/\s]+\.[^\s]+$/.test(clean)) return;
  if (/^https?:\/\/(?:www\.)?hakanaltun\.io\//.test(clean)) return;
  if (!cited.has(clean)) cited.set(clean, new Set());
  cited.get(clean).add(file);
};

for (const file of list('_words', '.md')) {
  for (const m of read(file).matchAll(/^\s+url:\s*"?([^"\s]+)"?\s*$/gm)) add(m[1], file);
}
for (const file of list('_data/quizzes', '.json')) {
  for (const q of JSON.parse(read(file))) for (const url of q.sources || []) add(url, file);
}
for (const file of list('_posts', '.html')) {
  for (const m of read(file).matchAll(/href="(https?:\/\/[^"]+)"/g)) add(m[1], file);
}
for (const m of read('_data/notes.yml').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) add(m[1], '_data/notes.yml');

const GONE = new Set([404, 410]);
const TIMEOUT = 20000;
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; hakanaltun.io link check; +https://hakanaltun.io/)',
  accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8'
};

async function check(url) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT) });
      response.body?.cancel().catch(() => {});
      if (response.ok) return { state: 'ok' };
      if (GONE.has(response.status)) return { state: 'gone', why: `${response.status}` };
      if (response.status >= 500 && attempt < 2) continue;
      return { state: 'unchecked', why: `${response.status}` };
    } catch (error) {
      const code = error.cause?.code || error.name;
      if (code === 'ENOTFOUND') return { state: 'gone', why: 'the site no longer exists (no such host)' };
      if (attempt < 2) continue;
      return { state: 'unchecked', why: code || error.message };
    }
  }
}

(async () => {
  const urls = [...cited.keys()];
  const results = new Map();
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++];
      results.set(url, await check(url));
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  const where = (url) => [...cited.get(url)].join(', ');
  const gone = urls.filter((url) => results.get(url).state === 'gone');
  const unchecked = urls.filter((url) => results.get(url).state === 'unchecked');
  console.log(`Checked ${urls.length} cited addresses: ${urls.length - gone.length - unchecked.length} fine, ${gone.length} gone, ${unchecked.length} could not be checked.`);
  if (unchecked.length) {
    /* Grouped by site, since it is usually a whole site that turns scripts
       away, not one page. */
    const bySite = new Map();
    for (const url of unchecked) {
      const key = `${new URL(url).hostname} (${results.get(url).why})`;
      bySite.set(key, (bySite.get(key) || 0) + 1);
    }
    console.log('\nCould not be checked; the site refused or did not answer, which says nothing about the page:');
    for (const [site, count] of bySite) console.log(`  ${site}: ${count} address${count === 1 ? '' : 'es'}`);
  }
  if (gone.length) {
    console.error('\nGone, find a new address or another source:');
    for (const url of gone) console.error(`  ${url} (${results.get(url).why}) — ${where(url)}`);
    process.exitCode = 1;
  }
})();
