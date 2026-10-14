/* A stylesheet or a script that changes needs a new ?v= wherever a page
 * loads it. Under the old address a reader's browser, and the tools'
 * service worker, go on serving the copy they already have, and new markup
 * meets an old stylesheet or script. AGENTS.md asks for the bump each time;
 * on 12 October 2026 one was missed and needed a pull request of its own.
 *
 * This compares the working tree with the base branch: on a pull request
 * the merge's first parent (pages.yml checks out two commits for it), and
 * elsewhere the merge base with origin/main. Every changed file in css/ or
 * js/ that is loaded with a ?v= must be loaded under a stamp it did not
 * have before. A stylesheet whose rules read the same, with only its
 * comments changed, needs none, since the published copy carries no
 * comments. scripts/ is left out: its checks pin old stamps on purpose.
 *
 *   node scripts/test-asset-versions.cjs */
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { rules } = require('./strip-css-comments.cjs');

const root = path.join(__dirname, '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
// git grep answers 1 when nothing matches.
const grep = (...args) => {
  try { return git('grep', ...args); } catch (error) { if (error.status === 1) return ''; throw error; }
};
const WHERE = ['--', '.', ':!scripts'];

function base() {
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    try { return git('rev-parse', '--verify', 'HEAD^1').trim(); } catch (error) {
      console.error('test-asset-versions: the base branch is not in the checkout; pages.yml checks out with fetch-depth: 2 for it.');
      process.exit(1);
    }
  }
  try { return git('merge-base', 'HEAD', 'origin/main').trim(); } catch (error) { return null; }
}

const from = base();
if (!from) {
  console.log('Asset versions: no base branch to compare with, so nothing was checked.');
  process.exit(0);
}

const changed = git('diff', '--name-only', '--diff-filter=M', from, '--', 'css', 'js').split('\n').filter(Boolean);
const problems = [];
let checked = 0;
for (const file of changed) {
  if (file.endsWith('.css')) {
    const before = git('show', from + ':' + file);
    const now = fs.readFileSync(path.join(root, file), 'utf8');
    let same = false;
    try { same = rules(before) === rules(now); } catch (error) { same = false; }
    if (same) continue;
  }
  const pattern = '/' + file.replace(/[.^$*+?()[\]{}|\\]/g, '\\$&') + '\\?v=[A-Za-z0-9._-]+';
  const loads = grep('-n', '-o', '-E', pattern, ...WHERE).split('\n').filter(Boolean);
  if (!loads.length) continue;
  checked++;
  const old = new Set(grep('-h', '-o', '-E', pattern, from, ...WHERE).split('\n').filter(Boolean));
  for (const line of loads) {
    const [where, number, address] = line.split(':');
    if (old.has(address)) problems.push(`${file} changed, but ${where}:${number} still loads it as ${address}. Give it a new ?v=.`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Asset versions: every changed stylesheet and script is loaded under a new ?v= (${checked} checked).`);
