/* The deploy takes the comments out of the published stylesheets
 * (scripts/strip-css-comments.cjs). Check that it takes out comments and
 * nothing else, on small cases and on every stylesheet in css/, and that the
 * workflow runs it after the checks and before the upload. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { strip, rules } = require('./strip-css-comments.cjs');
const root = path.join(__dirname, '..');

assert.equal(strip('/* a note */\na{color:red} /* another */\n'), 'a{color:red}\n');
assert.equal(strip('a::before{content:"/* kept */"}'), 'a::before{content:"/* kept */"}', 'a comment inside a string is text');
assert.equal(strip("a::after{content:'it\\'s /* kept */'}"), "a::after{content:'it\\'s /* kept */'}", 'an escaped quote does not end the string');
assert.equal(strip('a{border:1px/**/solid}'), 'a{border:1px solid}', 'two words a comment kept apart stay apart');
assert.equal(strip('a/**/.b{color:red}'), 'a.b{color:red}', 'a comment inside a selector leaves one selector');
assert.equal(strip('a{color:red}\n\n/* one */\n\n/* two */\n\n\nb{color:blue}'), 'a{color:red}\n\nb{color:blue}');

for (const name of fs.readdirSync(path.join(root, 'css')).filter((n) => n.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(root, 'css', name), 'utf8');
  const out = strip(css);
  assert.equal(rules(out), rules(css), `${name}: the rules are unchanged`);
  assert.equal(strip(out), out, `${name}: nothing left to take out`);
}
{
  const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  assert.ok(strip(css).length < css.length * 0.7, 'style.css loses its comments');
}

const flow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
const at = (text) => flow.indexOf(text);
assert.ok(at('node scripts/strip-css-comments.cjs _site/css') > at('run: npm test'), 'the comments go after the checks, which read the full stylesheets');
assert.ok(at('node scripts/strip-css-comments.cjs _site/css') < at('upload-pages-artifact'), 'and before the upload');

console.log('CSS comments: taken out of the published copy only, strings and selectors untouched, every stylesheet\'s rules unchanged, after the checks and before the upload.');
