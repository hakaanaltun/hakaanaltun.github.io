/* more-essays.js—Renders 4 random "Keep reading" cards in the standard piece-card format */
(function () {
  'use strict';
  if (typeof ALL_ESSAYS === 'undefined') return;

  var container = document.getElementById('more-essays-container');
  if (!container) return;

  /* Determine base path for images/links.
     On essay pages the file is essays/foo.html so href is just 'file.html'.
     On index.html it would be 'essays/file.html'. */
  var onIndex = /\/(index\.html)?$/.test(window.location.pathname);
  var hrefPrefix = onIndex ? 'essays/' : '';

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
    html += '<li class="piece-card"><a href="' + hrefPrefix + e.href + '" class="piece-card-link">';
    html += '<span class="piece-body">';
    html += '<span class="piece-title">' + title + '</span>';
    if (e.subtitle) html += '<span class="piece-subtitle">' + e.subtitle + '</span>';
    html += '<span class="piece-meta">' + e.date + '</span>';
    html += '</span>';
    if (e.img) {
      html += '<span class="piece-thumb-wrap">';
      html += '<img src="' + e.img + '" alt="' + title.replace(/"/g, '&quot;') + '" class="piece-thumb" loading="lazy">';
      html += '</span>';
    }
    html += '</a></li>';
  });

  html += '</ul>';
  container.innerHTML = html;
})();
