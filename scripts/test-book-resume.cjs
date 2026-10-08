/* Reading place survives visits, respects explicit resume, and never trusts
   an arbitrary address from browser storage. Use the rendered book pages. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/book-resume.js'), 'utf8');
const KEY = 'olae-book-place-v1';

async function open(url, saved, blocked = false) {
  const pathname = new URL(url).pathname;
  const html = fs.readFileSync(path.join(root, '_site', pathname, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document;
  w.requestAnimationFrame = fn => { fn(); return 1; };
  const scrolls = [];
  w.scrollTo = options => scrolls.push(options);
  if (saved !== undefined) w.localStorage.setItem(KEY, typeof saved === 'string' ? saved : JSON.stringify(saved));
  if (blocked) {
    Object.defineProperty(w, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  }
  const sections = [...d.querySelectorAll('.book-chapter')];
  sections.forEach((section, i) => {
    section.getBoundingClientRect = () => ({ top: i * 10000 - 200, bottom: (i + 1) * 10000 - 200, height: 10000 });
    [...section.querySelectorAll('h2, p:not(.divider), blockquote')].forEach((p, j) => {
      p.getBoundingClientRect = () => ({ top: i * 10000 + j * 100 - 200, bottom: i * 10000 + j * 100 - 100, height: 100 });
    });
  });
  w.eval(source);
  await new Promise(resolve => setTimeout(resolve, 0));
  w.dispatchEvent(new w.Event('load'));
  await new Promise(resolve => setTimeout(resolve, 0));
  function move() {
    w.dispatchEvent(new w.WheelEvent('wheel', { deltaY: 100 }));
    w.dispatchEvent(new w.Event('scroll'));
    w.dispatchEvent(new w.Event('pagehide'));
  }
  return { w, d, scrolls, move, saved: () => JSON.parse(w.localStorage.getItem(KEY)), close: () => w.close() };
}

(async () => {
  let kit = await open('https://hakanaltun.io/book/part-one/');
  assert.equal(kit.saved(), null, 'Opening a part must not create a reading place');
  kit.w.dispatchEvent(new kit.w.Event('scroll'));
  kit.w.dispatchEvent(new kit.w.Event('pagehide'));
  assert.equal(kit.saved(), null, 'Browser scroll restoration must not save');
  kit.move();
  const saved = kit.saved();
  assert.equal(saved.path, '/book/part-one/');
  assert.equal(saved.chapter, 'point-zero');
  assert(saved.quote.length > 0);
  assert.equal(kit.d.querySelector('[data-book-resume-panel]').hidden, false);
  assert.equal(kit.d.querySelector('.book-part > [data-book-resume]').hidden, true, 'Saving must not insert content above the reader');
  kit.close();

  kit = await open('https://hakanaltun.io/book/', saved);
  assert.equal(kit.d.querySelector('[data-book-resume]').hidden, false);
  assert.match(kit.d.querySelector('[data-book-resume-link]').href, /\/book\/part-one\/\?resume=1#point-zero$/);
  kit.close();

  kit = await open('https://hakanaltun.io/book/part-two/#moris', saved);
  assert.equal(kit.scrolls.length, 0, 'An ordinary chapter link must not be hijacked');
  assert.deepEqual(kit.saved(), saved, 'Opening the other part must preserve the previous place');
  kit.close();

  kit = await open('https://hakanaltun.io/book/part-one/?resume=1#point-zero', saved);
  assert(kit.scrolls.length > 0, 'Continue reading must restore the paragraph');
  assert.equal(kit.w.location.search, '', 'Consume the resume request');
  assert.match(kit.d.activeElement.textContent.replace(/\s+/g, ' ').trim(), new RegExp(saved.quote.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  kit.d.querySelector('[data-book-resume-clear]').click();
  assert.equal(kit.saved(), null);
  assert([...kit.d.querySelectorAll('[data-book-resume]')].every(el => el.hidden));
  kit.w.dispatchEvent(new kit.w.Event('scroll'));
  kit.w.dispatchEvent(new kit.w.Event('pagehide'));
  assert.equal(kit.saved(), null, 'Clearing must not immediately recreate the place');
  kit.close();

  /* A place saved before the build joined closed-up dashes (the quote has a
     plain dash) still finds its paragraph, which now carries the joiner. */
  const partTwo = new JSDOM(fs.readFileSync(path.join(root, '_site/book/part-two/index.html'), 'utf8')).window.document;
  const plain = el => el.textContent.replace(/\u2060/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);
  let joined = null;
  for (const section of partTwo.querySelectorAll('.book-chapter')) {
    const blocks = [...section.querySelectorAll('h2, p:not(.divider), blockquote')];
    const index = blocks.findIndex(block => block.tagName === 'P' && block.textContent.replace(/\s+/g, ' ').trim().slice(0, 181).includes('\u2060'));
    const heading = section.querySelector('h2[id]');
    if (index > 0 && heading) { joined = { v: 1, path: '/book/part-two/', chapter: heading.id, title: plain(heading), paragraph: index, quote: plain(blocks[index]), offset: 0 }; break; }
  }
  assert(joined, 'Part Two has a paragraph with a joined dash near its start');
  kit = await open(`https://hakanaltun.io/book/part-two/?resume=1#${joined.chapter}`, joined);
  assert.equal(kit.d.activeElement.tagName, 'P', 'A place saved with a plain dash must land on its paragraph');
  assert.equal(plain(kit.d.activeElement), joined.quote);
  kit.close();

  for (const bad of ['{broken', { ...saved, path: '//example.com/' }, { ...saved, offset: 9 }, { ...saved, paragraph: -1 }]) {
    kit = await open('https://hakanaltun.io/book/', bad);
    assert.equal(kit.d.querySelector('[data-book-resume]').hidden, true);
    kit.close();
  }
  kit = await open('https://hakanaltun.io/book/part-one/', undefined, true);
  kit.move();
  assert.equal(kit.d.querySelector('[data-book-resume-panel]').hidden, true, 'Failed storage must not claim a saved place');
  kit.close();
  console.log('book-resume: persistence, resume, a place saved before the dash joiner, navigation, clearing and unavailable storage passed');
})().catch(error => { console.error(error); process.exit(1); });
