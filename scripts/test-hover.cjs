/* How a link answers a pointer. Two rules, both from AGENTS.md:

   A picture never dims when it is chosen. When a link carries a picture and
   words, a pointer over it dims the words and leaves the picture at its full
   weight. This reads every built page that shows a picture, with the
   stylesheets that page loads, and fails on any rule that fades a picture on
   :hover or :active, or fades an element that holds one.

   A pointer draws no line. A link dims; a line under it stays only when it
   is there at rest, and dims with the link. Links in running text keep the
   underline they have and may darken it, so those are named below. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const csstree = require('css-tree');
const root = path.join(__dirname, '..');
const site = path.join(root, '_site');

function pages(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'pdfjs' || entry.name === 'vendor') continue;
      found.push(...pages(full));
    } else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

// Rules that fade something under a pointer, as [selector, where] pairs.
function fadingRules(css, where) {
  const rules = [];
  csstree.walk(csstree.parse(css), {
    visit: 'Rule',
    enter(rule) {
      let fades = false;
      csstree.walk(rule.block, {
        visit: 'Declaration',
        enter(decl) {
          const value = csstree.generate(decl.value).trim();
          if (decl.property === 'opacity' && value !== '1') fades = true;
          if (decl.property === 'filter' && value !== 'none') fades = true;
        }
      });
      if (!fades || rule.prelude.type !== 'SelectorList') return;
      rule.prelude.children.forEach((selector) => {
        const text = csstree.generate(selector);
        if (/:(hover|active)\b/.test(text)) rules.push([text, where]);
      });
    }
  });
  return rules;
}

const sheets = new Map();
function sheet(href) {
  const file = path.join(site, href.split('?')[0]);
  if (!sheets.has(file)) sheets.set(file, fs.existsSync(file) ? fadingRules(fs.readFileSync(file, 'utf8'), path.relative(site, file)) : []);
  return sheets.get(file);
}

// The element the rule styles, found with the pointer taken away.
function subject(selector) {
  return selector
    .replace(/::?(before|after|placeholder|marker|backdrop)\b/g, '')
    .replace(/:(hover|active)\b/g, '')
    .replace(/:not\(\[aria-disabled="true"\]\)/g, '');
}

function check(doc, rules, page, problems) {
  for (const [selector, where] of rules) {
    let matched;
    try { matched = doc.querySelectorAll(subject(selector)); } catch { continue; }
    for (const el of matched) {
      if (el.matches('img, picture') || el.querySelector('img, picture')) {
        problems.push(`${page}: "${selector}" (${where}) fades a picture`);
        break;
      }
    }
  }
}

const problems = [];
let checked = 0;
for (const file of pages(site)) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/<img\b/.test(html)) continue;
  const doc = new JSDOM(html).window.document;
  const rules = [];
  for (const link of doc.querySelectorAll('link[rel="stylesheet"][href^="/"]')) rules.push(...sheet(link.getAttribute('href')));
  doc.querySelectorAll('style').forEach((style, i) => rules.push(...fadingRules(style.textContent, `inline style ${i + 1}`)));
  check(doc, rules, path.relative(site, file), problems);
  checked++;
}

// Links that scripts build after the page loads, as js/series-nav.js and
// js/cafe-nav.js write them, checked against the site's stylesheet.
{
  const doc = new JSDOM('<div class="series-nav-cards"><a href="/" class="series-thumb-link"><div class="series-thumb-card"><img src="/x.webp" alt=""><span class="series-thumb-label"><span class="series-thumb-num">1</span>. A piece</span></div></a></div>').window.document;
  check(doc, sheet('/css/style.css'), 'series and café thumbnails', problems);
}

// Links in running text: the essays' closing line, the notes under each
// instrument and the text a reader opens in Read.
const RUNNING_TEXT = ['.essay-afterward a', '.notes a', '.notes .places-list a', '#reading a[href]'];
const LINE = /^(border-bottom|border-bottom-color|text-decoration|text-decoration-line|text-decoration-color)$/;
function lineRules(css, where) {
  csstree.walk(csstree.parse(css), {
    visit: 'Rule',
    enter(rule) {
      if (rule.prelude.type !== 'SelectorList') return;
      const selectors = [];
      rule.prelude.children.forEach((selector) => {
        const text = csstree.generate(selector);
        if (/:(hover|active)\b/.test(text) && !RUNNING_TEXT.includes(subject(text))) selectors.push(text);
      });
      if (!selectors.length) return;
      csstree.walk(rule.block, {
        visit: 'Declaration',
        enter(decl) {
          const value = csstree.generate(decl.value).trim();
          if (LINE.test(decl.property) && !/^(none|transparent|0)$/.test(value)) {
            for (const selector of selectors) problems.push(`${where}: "${selector}" draws a line under a pointer`);
          }
        }
      });
    }
  });
}
let styles = 0;
for (const file of fs.readdirSync(path.join(site, 'css')).filter((name) => name.endsWith('.css'))) {
  lineRules(fs.readFileSync(path.join(site, 'css', file), 'utf8'), 'css/' + file);
  styles++;
}
for (const file of pages(site)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    lineRules(match[1], path.relative(site, file));
    styles++;
  }
}

assert.ok(checked > 0, 'no built page with a picture was found; run bundle exec jekyll build first');
assert.deepEqual(problems, [], '\n' + problems.join('\n'));
console.log(`hover: ${checked} pages with pictures, no picture dims when chosen; ${styles} stylesheets, no line drawn under a pointer`);
