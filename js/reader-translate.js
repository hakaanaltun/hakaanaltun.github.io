/* Selection translation for essay/story reading pages.
   A reader selects English text, gets a small on-page prompt, and can ask for
   Turkish without leaving the page. The Cloudflare Worker receives the selected
   span plus nearby prose as context; context is never displayed or translated. */
(function () {
  'use strict';

  var article = document.querySelector('.essay-body');
  if (!article || !window.getSelection || !window.fetch) return;

  var ENDPOINT = 'https://translate.hakanaltunn.workers.dev/';
  var MAX_TEXT = 500;
  var MAX_CONTEXT = 1500;
  var cache = new Map();
  var current = null;
  var requestController = null;
  var selectionTimer = 0;

  injectStyles();

  var popup = document.createElement('div');
  popup.className = 'reader-translate';
  popup.hidden = true;
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Turkish translation');
  popup.innerHTML =
    '<div class="reader-translate-top">' +
      '<div class="reader-translate-source"></div>' +
      '<button type="button" class="reader-translate-close" aria-label="Close translation">×</button>' +
    '</div>' +
    '<div class="reader-translate-result" aria-live="polite"></div>' +
    '<button type="button" class="reader-translate-button">Türkçe</button>';
  document.body.appendChild(popup);

  var sourceEl = popup.querySelector('.reader-translate-source');
  var resultEl = popup.querySelector('.reader-translate-result');
  var translateButton = popup.querySelector('.reader-translate-button');
  var closeButton = popup.querySelector('.reader-translate-close');

  function injectStyles() {
    if (document.getElementById('reader-translate-styles')) return;
    var style = document.createElement('style');
    style.id = 'reader-translate-styles';
    style.textContent = [
      '.reader-translate{position:fixed;z-index:120;width:min(320px,calc(100vw - 28px));padding:13px 14px 12px;background:var(--paper,#fdfcf8);color:var(--ink,#262320);border:1px solid color-mix(in srgb,var(--ink,#262320) 18%,transparent);border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,.18);font-family:"EB Garamond",Georgia,serif;line-height:1.35;opacity:0;transform:translateY(4px);transition:opacity .14s ease,transform .14s ease;}',
      '.reader-translate[hidden]{display:none;}',
      '.reader-translate.is-visible{opacity:1;transform:translateY(0);}',
      '.reader-translate-top{display:flex;align-items:flex-start;gap:10px;}',
      '.reader-translate-source{min-width:0;flex:1;color:var(--vizon,#6d665b);font-size:.9rem;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.reader-translate-close{flex:0 0 auto;width:26px;height:26px;margin:-5px -6px 0 0;padding:0;border:0;background:transparent;color:var(--vizon,#6d665b);font:400 21px/1 Georgia,serif;cursor:pointer;border-radius:6px;}',
      '.reader-translate-close:hover,.reader-translate-close:active{opacity:var(--select-dim,.78);}',
      '.reader-translate-close:focus-visible,.reader-translate-button:focus-visible{outline:2px solid var(--petrol,#4a554f);outline-offset:2px;}',
      '.reader-translate-result{display:none;margin:8px 0 2px;color:var(--ink-soft,#3a342c);font-size:1.05rem;line-height:1.45;overflow-wrap:anywhere;}',
      '.reader-translate.has-result .reader-translate-result{display:block;}',
      '.reader-translate-button{display:inline-flex;align-items:center;margin-top:8px;padding:5px 10px;border:1px solid color-mix(in srgb,var(--petrol,#4a554f) 34%,transparent);border-radius:999px;background:transparent;color:var(--petrol,#4a554f);font-family:"EB Garamond",Georgia,serif;font-size:.92rem;font-style:italic;line-height:1.2;cursor:pointer;transition:var(--select-ease,opacity .2s ease);}',
      '.reader-translate-button:hover,.reader-translate-button:active{opacity:var(--select-dim,.78);}',
      '.reader-translate-button[disabled]{cursor:default;opacity:.62;}',
      '.reader-translate.is-loading .reader-translate-button::after{content:"";width:10px;height:10px;margin-left:7px;border:1px solid currentColor;border-right-color:transparent;border-radius:50%;animation:reader-translate-spin .65s linear infinite;}',
      '@keyframes reader-translate-spin{to{transform:rotate(360deg);}}',
      '@media (max-width:640px){.reader-translate{left:14px!important;right:14px!important;bottom:14px!important;top:auto!important;width:auto;max-height:min(44vh,300px);overflow:auto;padding:14px 15px 13px;border-radius:14px;}.reader-translate-source{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}.reader-translate-result{font-size:1.08rem;}}',
      '@media (prefers-reduced-motion:reduce){.reader-translate{transition:none;}.reader-translate.is-loading .reader-translate-button::after{animation-duration:1.2s;}}',
      '@media print{.reader-translate{display:none!important;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function nodeElement(node) {
    return node && (node.nodeType === 1 ? node : node.parentElement);
  }

  function insideArticle(node) {
    var el = nodeElement(node);
    return !!(el && article.contains(el));
  }

  function nearestBlock(node) {
    var el = nodeElement(node);
    if (!el) return null;
    return el.closest('p, li, blockquote, h2, h3, h4, figcaption') || article;
  }

  function contextFor(range, selected) {
    var startBlock = nearestBlock(range.startContainer);
    var endBlock = nearestBlock(range.endContainer);
    var block = startBlock === endBlock ? startBlock : article;
    var text = normalizeText(block && block.textContent);
    if (!text) return selected;
    if (text.length <= MAX_CONTEXT) return text;

    var needle = normalizeText(selected);
    var at = text.indexOf(needle);
    if (at < 0) return text.slice(0, MAX_CONTEXT);

    var spare = MAX_CONTEXT - needle.length;
    var before = Math.max(0, Math.floor(spare / 2));
    var start = Math.max(0, at - before);
    var end = Math.min(text.length, start + MAX_CONTEXT);
    start = Math.max(0, end - MAX_CONTEXT);
    return text.slice(start, end).trim();
  }

  function selectionData() {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    if (!insideArticle(selection.anchorNode) || !insideArticle(selection.focusNode)) return null;

    var text = normalizeText(selection.toString());
    if (!text || text.length > MAX_TEXT) return null;

    var range = selection.getRangeAt(0).cloneRange();
    var rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return null;

    return {
      text: text,
      context: contextFor(range, text),
      rect: rect
    };
  }

  function showForSelection() {
    var data = selectionData();
    if (!data) {
      if (!popup.matches(':focus-within')) hidePopup();
      return;
    }

    if (current && current.text === data.text && current.context === data.context && !popup.hidden) {
      positionPopup(data.rect);
      return;
    }

    if (requestController) requestController.abort();
    requestController = null;
    current = data;

    sourceEl.textContent = data.text;
    resultEl.textContent = '';
    popup.classList.remove('has-result', 'is-loading');
    translateButton.disabled = false;
    translateButton.dataset.done = 'false';
    translateButton.textContent = 'Türkçe';
    popup.hidden = false;
    positionPopup(data.rect);
    requestAnimationFrame(function () { popup.classList.add('is-visible'); });
  }

  function positionPopup(rect) {
    if (window.matchMedia('(max-width: 640px)').matches) return;

    var margin = 10;
    var width = Math.min(320, window.innerWidth - 28);
    var left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(14, Math.min(left, window.innerWidth - width - 14));

    popup.style.width = width + 'px';
    popup.style.left = left + 'px';
    popup.style.right = 'auto';

    var estimatedHeight = popup.offsetHeight || 96;
    var above = rect.top - estimatedHeight - margin;
    var top = above >= 10 ? above : rect.bottom + margin;
    top = Math.max(10, Math.min(top, window.innerHeight - estimatedHeight - 10));
    popup.style.top = top + 'px';
    popup.style.bottom = 'auto';
  }

  function hidePopup() {
    if (popup.hidden) return;
    popup.classList.remove('is-visible');
    window.setTimeout(function () {
      if (!popup.classList.contains('is-visible')) popup.hidden = true;
    }, 150);
    if (requestController) requestController.abort();
    requestController = null;
    current = null;
  }

  function cacheKey(data) {
    return data.text + '\n\u241f\n' + data.context;
  }

  function isDailyLimit(response, payload) {
    if (response.status === 429) return true;

    var errorText = '';
    try {
      errorText = JSON.stringify(payload || {}).toLowerCase();
    } catch (e) {
      errorText = normalizeText(payload).toLowerCase();
    }

    return errorText.indexOf('3036') !== -1 ||
      errorText.indexOf('daily free allocation') !== -1 ||
      (errorText.indexOf('daily') !== -1 && errorText.indexOf('quota') !== -1) ||
      (errorText.indexOf('allocation') !== -1 && errorText.indexOf('used up') !== -1);
  }

  async function translateCurrent() {
    if (translateButton.dataset.done === 'true') {
      hidePopup();
      return;
    }
    if (!current || translateButton.disabled) return;

    var data = current;
    var key = cacheKey(data);
    var cached = cache.get(key);
    if (cached) {
      showResult(cached);
      return;
    }

    translateButton.disabled = true;
    translateButton.dataset.done = 'false';
    translateButton.textContent = 'Translating';
    popup.classList.add('is-loading');
    resultEl.textContent = '';
    popup.classList.remove('has-result');

    requestController = new AbortController();

    try {
      var response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.text, context: data.context }),
        signal: requestController.signal
      });

      var payload = {};
      try { payload = await response.json(); } catch (e) {}

      if (!response.ok) {
        if (isDailyLimit(response, payload)) {
          throw new Error('daily-limit');
        }
        throw new Error(payload.error || 'translation-unavailable');
      }

      var translation = normalizeText(payload.translation);
      if (!translation) throw new Error('empty-translation');

      cache.set(key, translation);
      if (current !== data) return;
      showResult(translation);
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      if (current !== data) return;
      var message = error && error.message === 'daily-limit'
        ? 'Daily translation limit reached. Please try again tomorrow.'
        : 'Translation is currently unavailable.';
      showResult(message, true);
    } finally {
      if (current === data) {
        popup.classList.remove('is-loading');
        translateButton.disabled = false;
      }
      requestController = null;
    }
  }

  function showResult(text, isError) {
    resultEl.textContent = text;
    resultEl.dataset.error = isError ? 'true' : 'false';
    popup.classList.add('has-result');
    popup.classList.remove('is-loading');
    translateButton.disabled = false;
    translateButton.dataset.done = isError ? 'false' : 'true';
    translateButton.textContent = isError ? 'Try again' : 'Done';
    if (current) positionPopup(current.rect);
  }

  function scheduleSelection() {
    window.clearTimeout(selectionTimer);
    selectionTimer = window.setTimeout(showForSelection, 90);
  }

  document.addEventListener('pointerup', function (event) {
    if (popup.contains(event.target)) return;
    scheduleSelection();
  });

  document.addEventListener('keyup', function (event) {
    if (event.key === 'Escape') {
      hidePopup();
      return;
    }
    if (event.key.indexOf('Arrow') !== -1 || event.key === 'Shift') scheduleSelection();
  });

  document.addEventListener('selectionchange', function () {
    var selection = window.getSelection();
    if (selection && !selection.isCollapsed) scheduleSelection();
  });

  document.addEventListener('pointerdown', function (event) {
    if (!popup.hidden && !popup.contains(event.target) && !insideArticle(event.target)) hidePopup();
  });

  window.addEventListener('resize', function () {
    if (current && !popup.hidden) positionPopup(current.rect);
  });

  window.addEventListener('scroll', function () {
    if (!popup.hidden && !window.matchMedia('(max-width: 640px)').matches) hidePopup();
  }, { passive: true });

  translateButton.addEventListener('click', translateCurrent);
  closeButton.addEventListener('click', hidePopup);
})();
