/* The link preview's rules, checked without a browser:
   node scripts/test-link-preview.cjs

   What is worth holding still here is not the card — that is CSS and a
   pointer, and a browser is the only honest test of it. It is the three
   decisions the script makes before any of that: whether to run at all,
   which links it will speak for, and what it considers the same address.

   Running at all is the one with a cost attached. Where there is no hover
   the script must return before it reaches anything else, so that a phone
   never requests the index for a card it could not show. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const source = fs.readFileSync(path.resolve(__dirname, '../js/link-preview.js'), 'utf8');

function run({ hover, url = 'https://hakanaltun.io/word/bosh/', body = '' }) {
  const dom = new JSDOM(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    url,
    runScripts: 'outside-only',
  });
  const { window } = dom;

  const asked = [];
  window.matchMedia = query => {
    asked.push(query);
    return { matches: query.includes('hover: hover') ? hover : false, addEventListener() {}, removeEventListener() {} };
  };

  let fetches = 0;
  window.fetch = url => { fetches++; return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve([]) }); };

  window.eval(source);
  return { window, api: window.OLAE_LINK_PREVIEW, fetches: () => fetches, asked };
}

/* 1. No hover, no script — and, importantly, no request. */
{
  const { api, fetches } = run({ hover: false });
  assert.equal(api, undefined, 'the script installed itself where there is no hover');
  assert.equal(fetches(), 0, 'the index was requested where no card can be shown');
}

/* 2. With hover the script installs — but still fetches nothing until asked. */
{
  const { api, fetches } = run({ hover: true });
  assert.ok(api, 'the script did not install where hover exists');
  assert.equal(fetches(), 0, 'the index was fetched on load rather than on need');
}

/* 3. One shape for an address, so the page and the index can be compared. */
{
  const { api } = run({ hover: true });
  assert.equal(api.key('/word/bosh', ''), '/word/bosh/', 'a missing trailing slash was not added');
  assert.equal(api.key('/word/bosh/', ''), '/word/bosh/', 'a trailing slash was not left alone');
  assert.equal(api.key('/', ''), '/', 'the root was rewritten');
  assert.equal(api.key('/feed.xml', ''), '/feed.xml', 'a file was given a trailing slash');
  assert.equal(api.key('/notes/', '#made-with-ai'), '/notes/#made-with-ai', 'a note lost the hash that addresses it');
}

/* 4. Which links it speaks for. */
{
  const body = `
    <a id="ordinary" href="/word/boycott/">boycott</a>
    <a id="away" href="https://example.com/x">elsewhere</a>
    <a id="card" href="/pieces/michi.html"><img src="/images/michi.webp" alt=""></a>
    <a id="here" href="/word/bosh/">this very page</a>
    <a id="opted-out" href="/word/curfew/" data-no-preview="true">curfew</a>
    <div class="link-preview"><a id="inside" href="/word/farce/">farce</a></div>
  `;
  const { window, api } = run({ hover: true, body });
  const at = id => window.document.getElementById(id);

  assert.equal(api.previewable(at('ordinary')), '/word/boycott/', 'an ordinary internal link was refused');
  assert.equal(api.previewable(at('away')), false, 'a link off the site was accepted');
  assert.equal(api.previewable(at('card')), false, 'a link that is already a picture was accepted');
  assert.equal(api.previewable(at('here')), false, 'the page the reader is on was accepted');
  assert.equal(api.previewable(at('opted-out')), false, 'data-no-preview was ignored');
  assert.equal(api.previewable(at('inside')), false, 'a link inside the card was accepted');
}

/* 5. The index it reads is the one the build writes, carrying what the card
      shows and not the bodies that would make it large. */
{
  const file = path.resolve(__dirname, '../_site/link-preview.json');
  assert.ok(fs.existsSync(file), 'no _site/link-preview.json — run `bundle exec jekyll build` first');
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(rows.length > 100, `expected the whole site, found ${rows.length} records`);
  for (const row of rows) {
    assert.deepEqual(Object.keys(row), ['title', 'url', 'kind', 'description'], `unexpected fields on ${row.url}`);
    assert.ok(row.url && row.url.startsWith('/'), `a record has no site-relative url: ${JSON.stringify(row)}`);
    assert.ok(row.title, `a record has no title: ${row.url}`);
  }

  /* The two indexes come from one include; this is what says so out loud. */
  const search = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../_site/search-index.json'), 'utf8'));
  assert.deepEqual(
    rows.map(r => r.url), search.map(r => r.url),
    'the preview index and the search index no longer hold the same records in the same order'
  );

  const bytes = fs.statSync(file).size;
  assert.ok(bytes < 120 * 1024, `the preview index has grown to ${Math.round(bytes / 1024)}KB — it is fetched on a pause, keep it small`);
  console.log(
    `Link preview passed: silent without hover, ${rows.length} records at ${Math.round(bytes / 1024)}KB, ` +
    `address shapes and link rules as written.`
  );
}
