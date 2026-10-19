// The addresses Cloudflare serves (workers/site.mjs) answer as GitHub Pages
// answered them, checked against the built _site/: a folder's address by its
// index.html, a piece's .html address as it is, an address with neither
// slash nor extension by its .html file or sent on to its folder, and
// anything else by the site's 404 page with a 404.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import worker from '../workers/site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
// Cloudflare's static files with html_handling "none": a path is a file or nothing.
const env = { ASSETS: { async fetch(request) {
  const file = path.join(site, decodeURIComponent(new URL(request.url).pathname));
  if (file.startsWith(site) && fs.existsSync(file) && fs.statSync(file).isFile()) return new Response(fs.readFileSync(file), { status: 200 });
  return new Response('', { status: 404 });
} } };
const get = (p) => worker.fetch(new Request('https://hakanaltun.io' + p), env);

const home = await get('/');
assert.equal(home.status, 200);
assert.equal(await home.text(), fs.readFileSync(path.join(site, 'index.html'), 'utf8'), 'the front page is the built index.html');
assert.equal((await get('/about/')).status, 200, 'a folder address is its index.html');
const bare = await get('/about?x=1');
assert.equal(bare.status, 301, 'an address without its slash is sent on');
assert.equal(bare.headers.get('Location'), 'https://hakanaltun.io/about/?x=1');
const piece = fs.readdirSync(path.join(site, 'pieces')).find((f) => f.endsWith('.html'));
// A piece's .html address is a file, so Cloudflare serves it before the
// script; without its .html it is answered by the same file, not redirected.
const plain = await get('/pieces/' + piece.replace(/\.html$/, ''));
assert.equal(plain.status, 200, 'a piece without .html is still the piece');
const gone = await get('/no-such-page/');
assert.equal(gone.status, 404);
assert.match(await gone.text(), /<html/i, 'a missing page shows the site\'s 404 page');
assert.equal((await get('/no-such-file.png')).status, 404);
console.log('Site worker: folder addresses, addresses without their slash, pieces without .html and the 404 page answer as on GitHub Pages.');
