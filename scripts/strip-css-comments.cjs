/* The stylesheets explain themselves at length, for whoever edits them next,
 * and in style.css the explanations are about two thirds of what a reader's
 * browser would download. The deploy keeps them in the repository and takes
 * them out of the copy it publishes: .github/workflows/pages.yml runs this on
 * _site/css after the checks and before the upload.
 *
 * Only comments go. Strings are left alone, so a "/*" inside quotes stays,
 * and nothing else is minified. Every file is parsed before and after, and
 * the run fails, publishing nothing, if a single rule reads differently.
 *
 *   node scripts/strip-css-comments.cjs _site/css */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const csstree = require('css-tree');

/* A comment between two characters that would otherwise run together into
 * one word, as in 1px/**\/solid, becomes a space; anywhere else it simply
 * goes, so a/**\/.b stays one selector. */
const joins = (a, b) => /[\w-]/.test(a || '') && /[\w-]/.test(b || '');

function strip(css) {
  let out = '';
  for (let i = 0; i < css.length;) {
    const c = css[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c && css[j] !== '\n') j += css[j] === '\\' ? 2 : 1;
      out += css.slice(i, j + 1);
      i = j + 1;
    } else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const next = end === -1 ? css.length : end + 2;
      if (joins(out[out.length - 1], css[next])) out += ' ';
      i = next;
    } else {
      out += c;
      i++;
    }
  }
  // Lines a comment filled are left empty; a run of them closes up to one.
  return out.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
}

/* The rules as a parser reads them, with comments set aside. */
const rules = (css) => csstree.generate(csstree.parse(css));

function stripFile(file) {
  const before = fs.readFileSync(file, 'utf8');
  const after = strip(before);
  if (rules(after) !== rules(before)) throw new Error(`${file}: the rules changed when the comments were taken out`);
  fs.writeFileSync(file, after);
  return [before.length, after.length];
}

module.exports = { strip, rules };

if (require.main === module) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node scripts/strip-css-comments.cjs <css directory>'); process.exit(2); }
  let total = [0, 0];
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.css')).sort()) {
    const [a, b] = stripFile(path.join(dir, name));
    total = [total[0] + a, total[1] + b];
  }
  console.log(`CSS comments taken out of ${dir}: ${total[0]} bytes down to ${total[1]}.`);
}
