/* more-essays.js—Renders 4 random "Keep reading" cards in the standard piece-card format */
(function () {
  'use strict';
  if (typeof ALL_ESSAYS === 'undefined') return;

  var container = document.getElementById('more-essays-container');
  if (!container) return;

  /* Current page filename to exclude */
  var current = window.location.pathname.split('/').pop() || 'index.html';

  /* Filter out current essay */
  var pool = ALL_ESSAYS.filter(function (e) { return e.href !== current; });

  /* Quiet recommendation filter:
     - the five early pieces stay public but are not suggested
     - The Cove is a coda to The Anxiety, so it is reached through the arc, not suggested cold */
  var notSuggested = ['say-hello', 'ai-enough', 'defense-mechanisms', 'jung-shadow', 'unfinished-things', 'the-cove'];
  pool = pool.filter(function (e) {
    var slug = (e.href || '').replace(/\.html$/, '');
    return notSuggested.indexOf(slug) === -1;
  });

  function displayTitle(text) {
    return (text || '').replace(/'/g, '’');
  }

  /* Fisher-Yates shuffle */
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }

  var picks = pool.slice(0, 4);

  var html = '<p class="more-essays-title">Keep reading</p>';
  html += '<ul class="piece-grid more-essays-grid-hp" style="margin-top: 34px;">';

  picks.forEach(function (e) {
    var title = displayTitle(e.title);
    var isTypographic = e.coverStyle === 'typographic';
    /* Story cards link to the story itself (storyUrl from post front matter),
       never to the card post's own redirect-stub URL. */
    var href = e.story ? (e.storyUrl || '/story/1/') : '/pieces/' + e.href;
    html += '<li class="piece-card' + (isTypographic ? ' is-typographic' : '') + '"><a href="' + href + '" class="piece-card-link">';
    if (isTypographic) {
      var coverLabel = e.coverLabel || 'Short fiction';
      html += '<span class="piece-thumb-wrap piece-thumb-wrap--typographic">';
      html += '<span class="type-cover type-cover--with-meta" aria-hidden="true"><span class="type-cover-inner">';
      html += '<span class="type-cover-mark">⁂</span>';
      html += '<span class="type-cover-title">' + title + '</span>';
      if (e.subtitle) html += '<span class="type-cover-subtitle">' + e.subtitle + '</span>';
      html += '<span class="type-cover-date">' + e.date + '</span>';
      if (e.excerpt) html += '<span class="type-cover-excerpt">' + e.excerpt + '</span>';
      html += '<span class="type-cover-label">' + coverLabel + '</span>';
      html += '</span></span></span>';
      html += '<span class="visually-hidden">' + title;
      if (e.subtitle) html += '. ' + e.subtitle;
      html += '. ' + e.date;
      if (e.excerpt) html += '. ' + e.excerpt;
      html += '</span>';
    } else {
      html += '<span class="piece-body">';
      html += '<span class="piece-title">' + title + '</span>';
      if (e.subtitle) html += '<span class="piece-subtitle">' + e.subtitle + '</span>';
      html += '<span class="piece-meta">' + e.date + '</span>';
      html += '</span>';
      if (e.img) {
        /* 96px thumb — the pre-generated 480px variant is plenty at 2x. */
        html += '<span class="piece-thumb-wrap">';
        html += '<img src="' + e.img.replace('/images/', '/images/480/') + '" alt="' + title.replace(/"/g, '&quot;') + '" class="piece-thumb" loading="lazy">';
        html += '</span>';
      } else if (e.story) {
        /* Imageless story fallback: same doorframe as the All index row. */
        html += '<span class="piece-thumb-wrap piece-thumb-wrap--bare" aria-hidden="true"></span>';
      }
    }
    html += '</a></li>';
  });

  html += '</ul>';
  container.innerHTML = html;
})();
