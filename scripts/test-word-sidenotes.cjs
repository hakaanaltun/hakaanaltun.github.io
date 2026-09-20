/* The citations in Words with Stories, checked against the pages the build
   rendered: node scripts/test-word-sidenotes.cjs (run after jekyll build).

   A marker is a promise that a source is there to be read. The one that can
   quietly go wrong is a number with nothing behind it — n="3" on a word that
   lists two sources renders a marker, a link and a margin note that all
   point at a source that does not exist, and the page looks right. That is
   what this is here to catch.

   It also holds the margin copy to what it is allowed to be: hidden from
   assistive technology, and carrying no link of its own, because a link
   inside hidden content can be reached by keyboard without being readable. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const site = path.resolve(__dirname, '../_site/word');
assert.ok(fs.existsSync(site), 'no _site/word — run `bundle exec jekyll build` first');

const pages = fs.readdirSync(site, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(site, entry.name, 'index.html'))
  .filter(file => fs.existsSync(file));

assert.ok(pages.length >= 40, `expected the collection, found ${pages.length} pages`);

let markers = 0;
let sidenotes = 0;
let withSources = 0;

for (const file of pages) {
  const word = path.basename(path.dirname(file));
  const { document } = new JSDOM(fs.readFileSync(file, 'utf8')).window;

  const sourceIds = new Set(
    [...document.querySelectorAll('.word-story-sources li')].map(li => li.id)
  );
  if (sourceIds.size) withSources++;

  const cites = [...document.querySelectorAll('.word-cite a')];
  markers += cites.length;

  for (const cite of cites) {
    const target = cite.getAttribute('href').slice(1);
    assert.ok(
      sourceIds.has(target),
      `${word}: marker ${cite.textContent} points at #${target}, which no source carries`
    );
    assert.equal(
      cite.getAttribute('aria-label'),
      `Source ${cite.textContent}`,
      `${word}: marker ${cite.textContent} is missing its spoken label`
    );
  }

  /* Every marker's number is also in the margin, and nothing is in the
     margin that no marker asked for. Repeats are dropped in the browser,
     not here, so what the build renders still carries all of them. */
  const marginNumbers = [...document.querySelectorAll('.word-sidenote-number')].map(n => n.textContent.trim());
  const citeNumbers = cites.map(c => c.textContent.trim());
  assert.deepEqual(
    marginNumbers, citeNumbers,
    `${word}: the margin and the markers disagree — ${marginNumbers.join(',')} against ${citeNumbers.join(',')}`
  );

  for (const note of document.querySelectorAll('.word-sidenote')) {
    sidenotes++;
    assert.equal(note.getAttribute('aria-hidden'), 'true', `${word}: a margin note is not hidden from assistive technology`);
    assert.equal(note.querySelectorAll('a').length, 0, `${word}: a margin note carries a link`);
  }

  for (const number of marginNumbers) {
    assert.ok(sourceIds.has(`source-${number}`), `${word}: the margin shows source ${number}, which the page does not list`);
  }
}

console.log(
  `Word sidenotes passed: ${markers} markers across ${pages.length} pages, ` +
  `${withSources} of them sourced, ${sidenotes} margin notes, every number backed by a source.`
);
