/* The deploy takes the comments out of the published scripts
 * (scripts/strip-js-comments.cjs). Check that it takes out comments and
 * nothing else, on small cases and on every script the build publishes,
 * that it leaves js/vendor/ alone, and that the workflow runs it after the
 * checks and before the upload. Run `bundle exec jekyll build` first: the
 * scripts are read from _site/js, where js/essays-data.js has been through
 * Liquid. */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { strip, program } = require('./strip-js-comments.cjs');
const root = path.join(__dirname, '..');
const built = path.join(root, '_site', 'js');
if (!fs.existsSync(built)) {
  console.error('test-strip-js: run `bundle exec jekyll build` first');
  process.exit(1);
}

assert.equal(strip('// a note\nvar a = 1; // another\n'), 'var a = 1;\n');
assert.equal(strip('  /* one\n     two */\n  go();\n'), '  go();\n', 'a comment on lines of its own goes with them');
assert.equal(strip('go(); // the end'), 'go();');
assert.equal(strip('var s = "// kept /* kept */";'), 'var s = "// kept /* kept */";', 'a comment inside a string is text');
assert.equal(strip("var s = 'it\\'s // kept';"), "var s = 'it\\'s // kept';", 'an escaped quote does not end the string');
assert.equal(strip('var t = `a // kept ${b /* gone */} /* kept */`;'), 'var t = `a // kept ${b } /* kept */`;', 'a template keeps its text and loses the comment in its code');
assert.equal(strip('var r = /\\/\\/ not a comment/g; // gone'), 'var r = /\\/\\/ not a comment/g;', 'a regular expression is not a comment');
assert.equal(strip('x = a/**/+/**/+b;'), 'x = a + +b;', 'two tokens a comment kept apart stay apart');
{
  // A comment that spans lines ends a statement as a line break does.
  const js = 'function f() { return /* nothing\n follows */ 1; }';
  assert.equal(strip(js), 'function f() { return \n 1; }');
  assert.equal(program(strip(js)), program(js));
  assert.notEqual(program('function f() { return 1; }'), program(js), 'which the program check would have noticed');
}

let files = 0;
for (const name of fs.readdirSync(built).filter((n) => n.endsWith('.js'))) {
  const js = fs.readFileSync(path.join(built, name), 'utf8');
  const out = strip(js);
  assert.equal(program(out), program(js), `${name}: the program is unchanged`);
  assert.equal(strip(out), out, `${name}: nothing left to take out`);
  files++;
}
assert.ok(files > 30, 'every published script');
{
  const js = fs.readFileSync(path.join(built, 'house.js'), 'utf8');
  assert.ok(strip(js).length < js.length * 0.85, 'house.js loses its comments');
}

// Run on a directory, it takes the comments out of the scripts there and
// leaves js/vendor/, with its licences, as it is.
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-js-'));
  fs.mkdirSync(path.join(dir, 'vendor'));
  fs.writeFileSync(path.join(dir, 'a.js'), '// a note\nvar a = 1;\n');
  fs.writeFileSync(path.join(dir, 'vendor', 'b.js'), '/*! licence */\nvar b = 2;\n');
  execFileSync(process.execPath, [path.join(__dirname, 'strip-js-comments.cjs'), dir], { stdio: 'ignore' });
  assert.equal(fs.readFileSync(path.join(dir, 'a.js'), 'utf8'), 'var a = 1;\n');
  assert.equal(fs.readFileSync(path.join(dir, 'vendor', 'b.js'), 'utf8'), '/*! licence */\nvar b = 2;\n');
  fs.rmSync(dir, { recursive: true });
}

// Cloudflare's build publishes the site and GitHub checks pull requests;
// both take the comments out after the checks, which read the full files,
// and Cloudflare publishes only once its build script has finished, so the
// stripping is the script's last step.
const build = fs.readFileSync(path.join(root, 'scripts/cloudflare-build.sh'), 'utf8');
const flow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
for (const [name, text] of [['cloudflare-build.sh', build], ['pages.yml', flow]]) {
  const at = (t) => text.indexOf(t);
  assert.ok(at('node scripts/strip-js-comments.cjs _site/js') > at('npm test') && at('npm test') > -1, name + ': the comments go after the checks');
}
assert.ok(build.trimEnd().split('\n').slice(-2).some((line) => line.trim() === 'node scripts/strip-js-comments.cjs _site/js'), 'and they are the last thing done before Cloudflare publishes');

console.log(`JS comments: taken out of the published copy only, strings, templates and regular expressions untouched, every one of ${files} published scripts unchanged as a program, js/vendor/ left alone, after the checks and before the site is published.`);
