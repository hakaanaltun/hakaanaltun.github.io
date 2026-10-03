/* A single reading place for The Fragments, kept only in this browser.
   Opening a page never replaces it. Save after deliberate reading movement;
   resume only when the reader follows the Continue reading link. */
(function () {
  'use strict';
  var KEY = 'olae-book-place-v1';
  var PARTS = { '/book/part-one/': 'Part I', '/book/part-two/': 'Part II' };
  var widgets = Array.prototype.slice.call(document.querySelectorAll('[data-book-resume]'));
  if (!widgets.length) return;
  var body = document.querySelector('.book-part-body');
  var chapters = document.querySelector('.book-chapters');
  var timer = 0;
  var moved = false;
  var intentional = false;
  var restoring = false;
  var ready = false;

  function clean(value) {
    if (!value || value.v !== 1 || !Object.prototype.hasOwnProperty.call(PARTS, value.path)) return null;
    if (typeof value.chapter !== 'string' || !/^[a-z0-9-]{1,100}$/.test(value.chapter)) return null;
    if (!Number.isInteger(value.paragraph) || value.paragraph < 0 || value.paragraph > 5000) return null;
    if (typeof value.title !== 'string' || !value.title || value.title.length > 180) return null;
    if (typeof value.quote !== 'string' || value.quote.length > 180) return null;
    if (typeof value.offset !== 'number' || !isFinite(value.offset) || value.offset < 0 || value.offset > 1) return null;
    return value;
  }

  function read() {
    try { return clean(JSON.parse(localStorage.getItem(KEY) || 'null')); }
    catch (e) { return null; }
  }

  function render(saved, panelsOnly) {
    widgets.forEach(function (widget) {
      if (panelsOnly && !widget.hasAttribute('data-book-resume-panel')) return;
      widget.hidden = !saved;
      if (!saved) return;
      widget.querySelector('[data-book-resume-link]').href = saved.path + '?resume=1#' + saved.chapter;
      widget.querySelector('[data-book-resume-place]').textContent = PARTS[saved.path] + ' · ' + saved.title;
    });
  }

  function text(element) { return element.textContent.replace(/\s+/g, ' ').trim().slice(0, 180); }
  function paragraphs(chapter) {
    return Array.prototype.slice.call(chapter.querySelectorAll('h2, p:not(.divider), blockquote'));
  }
  function readingLine() {
    var article = document.querySelector('.book-part');
    var header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head-band')) || 0;
    var band = article ? parseFloat(getComputedStyle(article).getPropertyValue('--book-band')) || 0 : 0;
    return Math.min(header + band + 24, window.innerHeight * .42);
  }

  function capture() {
    if (!body || !PARTS[location.pathname]) return null;
    var line = readingLine();
    var sections = Array.prototype.slice.call(body.querySelectorAll('.book-chapter'));
    var section = null;
    sections.some(function (candidate) {
      if (candidate.getBoundingClientRect().top <= line) section = candidate;
      return candidate.getBoundingClientRect().bottom > line;
    });
    if (!section) return null;
    var heading = section.querySelector('h2[id]');
    if (!heading) return null;
    var blocks = paragraphs(section);
    var index = blocks.findIndex(function (block) { return block.getBoundingClientRect().bottom > line; });
    if (index < 0) index = blocks.length - 1;
    if (index < 0) return null;
    var block = blocks[index];
    var rect = block.getBoundingClientRect();
    return {
      v: 1, path: location.pathname, chapter: heading.id, title: text(heading),
      paragraph: index, quote: text(block),
      offset: Math.max(0, Math.min(1, (line - rect.top) / Math.max(1, rect.height)))
    };
  }

  function save() {
    window.clearTimeout(timer);
    if (!ready || !moved || restoring || document.visibilityState === 'prerender') return;
    var saved = capture();
    if (!saved) return;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); }
    catch (e) { return; }
    moved = false;
    /* Updating the panel does not insert a new block above the text while
       somebody is reading. The top prompt is the place from arrival. */
    render(saved, true);
  }

  var initial = read();
  render(initial, false);
  widgets.forEach(function (widget) {
    widget.querySelector('[data-book-resume-clear]').addEventListener('click', function () {
      try { localStorage.removeItem(KEY); }
      catch (e) { return; }
      window.clearTimeout(timer);
      moved = false;
      intentional = false;
      var focusTarget = chapters && chapters.open ? chapters.querySelector('summary') : document.querySelector('.book-reading-link, .book-part-header a');
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      render(null, false);
    });
  });
  window.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === null) render(read(), !!body);
  });
  if (!body) return;

  function resume() {
    var query = new URLSearchParams(location.search);
    if (query.get('resume') !== '1' || !initial || initial.path !== location.pathname) return;
    var heading = document.getElementById(initial.chapter);
    var section = heading && heading.closest('.book-chapter');
    if (!section) return;
    var blocks = paragraphs(section);
    var block = blocks[initial.paragraph];
    if (!block || text(block) !== initial.quote) {
      block = blocks.find(function (candidate) { return text(candidate) === initial.quote; }) || heading;
    }
    restoring = true;
    var rect = block.getBoundingClientRect();
    var offset = block === heading ? 0 : initial.offset * rect.height;
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top + offset - readingLine()), behavior: 'instant' });
    block.setAttribute('tabindex', '-1');
    block.classList.add('book-resume-target');
    block.focus({ preventScroll: true });
    query.delete('resume');
    var remaining = query.toString();
    history.replaceState(history.state, '', location.pathname + (remaining ? '?' + remaining : '') + location.hash);
    window.requestAnimationFrame(function () { restoring = false; });
  }

  function start() {
    var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    fonts.then(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { resume(); ready = true; });
      });
    });
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  function intend(event) {
    if (!ready || restoring || (chapters && chapters.open && chapters.contains(event.target))) return;
    intentional = true;
  }
  window.addEventListener('wheel', intend, { passive: true });
  window.addEventListener('touchmove', intend, { passive: true });
  window.addEventListener('pointerdown', function (event) {
    if (event.target === document.documentElement) intend(event);
  }, { passive: true });
  window.addEventListener('keydown', function (event) {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].indexOf(event.key) >= 0 && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) && !event.target.isContentEditable) intend(event);
  });
  if (chapters) chapters.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () { intentional = true; });
  });
  window.addEventListener('scroll', function () {
    if (!ready || !intentional || restoring) return;
    moved = true;
    window.clearTimeout(timer);
    timer = window.setTimeout(save, 900);
  }, { passive: true });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') save();
  });
})();
