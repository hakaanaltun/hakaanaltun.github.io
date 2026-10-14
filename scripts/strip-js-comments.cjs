/* The scripts explain themselves at length, for whoever edits them next,
 * and about a fifth of what a reader's browser would download is those
 * explanations. As with the stylesheets (scripts/strip-css-comments.cjs),
 * the deploy keeps them in the repository and takes them out of the copy
 * it publishes: .github/workflows/pages.yml runs this on _site/js after
 * the checks and before the upload.
 *
 * Only comments go, and only from the site's own scripts: js/vendor/ is
 * left as it is, with its licences. A parser (acorn) finds the comments,
 * so a "//" inside a string, a template or a regular expression stays.
 * A comment on lines of its own goes with them; one after code goes and
 * leaves the line; one between two pieces of code leaves a space, or a
 * line break if it spanned lines, so nothing runs together and no
 * statement ends where it did not. Every file is parsed before and after,
 * and the run fails, publishing nothing, if a single part of a program
 * reads differently.
 *
 *   node scripts/strip-js-comments.cjs _site/js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');

/* A script first, and a module if it will not read as one. The comments
 * found go into `comments`, when it is given. */
function parse(js, comments) {
  for (const sourceType of ['script', 'module']) {
    if (comments) comments.length = 0;
    try {
      return acorn.parse(js, { ecmaVersion: 'latest', sourceType, onComment: comments });
    } catch (error) {
      if (sourceType === 'module') throw error;
    }
  }
}

/* The program as the parser reads it, without the places of its parts. */
const program = (js) => JSON.stringify(parse(js), (key, value) =>
  key === 'start' || key === 'end' ? undefined : typeof value === 'bigint' ? String(value) : value);

const blank = (text) => /^[ \t\r]*$/.test(text);

function strip(js) {
  const comments = [];
  parse(js, comments);
  let out = '';
  let at = 0;
  for (const comment of comments) {
    let from = comment.start;
    let to = comment.end;
    let put = '';
    const lineStart = js.lastIndexOf('\n', from - 1) + 1;
    const newline = js.indexOf('\n', to);
    const lineEnd = newline === -1 ? js.length : newline;
    const before = js.slice(lineStart, from);
    if (blank(before) && blank(js.slice(to, lineEnd))) {
      // On lines of its own: the lines go with it.
      from = lineStart;
      to = newline === -1 ? js.length : newline + 1;
    } else if (blank(js.slice(to, lineEnd))) {
      // After code: it goes, with the space before it, and the line stays.
      from -= before.length - before.trimEnd().length;
    } else if (/[\n\r\u2028\u2029]/.test(js.slice(from, to))) {
      put = '\n';
    } else if (!/\s/.test(js[from - 1] || ' ') && !/\s/.test(js[to] || ' ')) {
      put = ' ';
    }
    from = Math.max(from, at);
    out += js.slice(at, from) + put;
    at = to;
  }
  return out + js.slice(at);
}

function stripFile(file) {
  const before = fs.readFileSync(file, 'utf8');
  const after = strip(before);
  if (program(after) !== program(before)) throw new Error(`${file}: the program changed when the comments were taken out`);
  fs.writeFileSync(file, after);
  return [before.length, after.length];
}

module.exports = { strip, program };

if (require.main === module) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node scripts/strip-js-comments.cjs <js directory>'); process.exit(2); }
  let total = [0, 0];
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.js')).sort()) {
    const [a, b] = stripFile(path.join(dir, name));
    total = [total[0] + a, total[1] + b];
  }
  console.log(`JS comments taken out of ${dir}: ${total[0]} bytes down to ${total[1]}.`);
}
