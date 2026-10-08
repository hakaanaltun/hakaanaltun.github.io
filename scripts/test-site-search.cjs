/* Check the real Jekyll index and the browser search together. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const index = JSON.parse(fs.readFileSync('_site/search-index.json', 'utf8'));
const script = fs.readFileSync('js/site-search.js', 'utf8');
const html = fs.readFileSync('_site/search/index.html', 'utf8');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  assert(index.length > 60, 'Index should include writing, words, instruments and sections');
  assert.equal(new Set(index.map(entry => entry.url)).size, index.length, 'Canonical URLs must be unique');
  assert(index.every(entry => entry.url.startsWith('/') && !entry.url.startsWith('//')));
  assert.equal(index.find(entry => entry.title === 'The Notice').url, '/story/1/');
  assert(!index.some(entry => entry.url === '/search/' || entry.url === '/404.html'));
  assert(!index.find(entry => entry.title === 'Measured').text.includes('.measured-scene'));
  // The visit counter sends the address's query, which here is the search.
  assert(!html.includes('goatcounter'), 'the search page loads no visit counter');
  assert(fs.readFileSync('_site/about/index.html', 'utf8').includes('goatcounter'), 'other pages keep the visit counter');
  const dom = new JSDOM(html, { url: 'https://hakanaltun.io/search/?q=reader', runScripts: 'outside-only' });
  let fetches = 0;
  dom.window.fetch = async () => {
    fetches++;
    return { ok: true, json: async () => index };
  };
  dom.window.eval(script);
  await wait(0);
  const document = dom.window.document;
  const input = document.getElementById('site-search');
  const links = () => [...document.querySelectorAll('#search-results h2 a')];
  const submit = async query => {
    input.value = query;
    input.form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await wait(0);
  };
  assert.equal(links()[0].textContent, 'The Reader');
  assert(!document.getElementById('search-results').textContent.includes('&mdash;'));
  await submit('word counter');
  assert.equal(links()[0].textContent, 'The Counter');
  await submit('ŞAFAK');
  const accented = links().map(link => link.href);
  assert(accented.length);
  await submit('safak');
  assert.deepEqual(links().map(link => link.href), accented);
  await submit('quarantine');
  assert.equal(links()[0].getAttribute('href'), '/word/quarantine/');
  await submit('Umberto Eco');
  assert(links().some(link => link.getAttribute('href') === '/notes/#queen-loana-opening-lines'));
  await submit('demolition');
  assert(links().some(link => link.getAttribute('href') === '/story/1/'));
  await submit('fourth-floor elevator');
  assert(links().some(link => link.textContent === 'Measured'));
  /* Words copied from a page can carry the joiner the build puts before a
     closed-up dash; the search drops it, and results show it. */
  const dashed = index.find(entry => /\S—\S/.test(entry.text));
  const phrase = dashed.text.match(/(\S+)—(\S+)/);
  await submit(`${phrase[1]}—${phrase[2]}`);
  const plainHits = links().map(link => link.href);
  assert(plainHits.length, 'a phrase with a closed-up dash is found');
  await submit(`${phrase[1]}\u2060—${phrase[2]}`);
  assert.deepEqual(links().map(link => link.href), plainHits, 'the joiner in a pasted phrase is ignored');
  assert(!/[^\s\u2060]—/.test(document.getElementById('search-results').textContent), 'results join their closed-up dashes');
  await submit('<img src=x onerror=alert(1)>');
  assert.equal(links().length, 0);
  assert(!document.querySelector('#search-status img'));
  await submit('   ');
  assert.equal(links().length, 0);
  assert(!dom.window.location.search);
  assert.equal(fetches, 1, 'Reuse the index while changing searches');
  dom.window.close();

  const offline = new JSDOM(html, { url: 'https://hakanaltun.io/search/?q=reader', runScripts: 'outside-only' });
  offline.window.fetch = async () => { throw new Error('Offline'); };
  offline.window.eval(script);
  await wait(0);
  assert(offline.window.document.getElementById('search-status').textContent.includes('could not load'));
  offline.window.fetch = async () => ({ ok: true, json: async () => index });
  offline.window.document.getElementById('site-search').form.dispatchEvent(new offline.window.Event('submit', { cancelable: true }));
  await wait(0);
  assert(offline.window.document.querySelector('#search-results a'));
  offline.window.close();
  console.log('Site search: generated index, ranking, text matches, Turkish letters, pasted dash joiners, safe output, retry and no visit counter on the search page passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
