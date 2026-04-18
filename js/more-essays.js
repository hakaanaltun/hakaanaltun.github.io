/* more-essays.js—Renders 4 random "More essays" cards (homepage-style) */
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

  /* Filter out current essay and coming-soon entries */
  var pool = ALL_ESSAYS.filter(function (e) { return e.href !== current && !e.comingSoon; });

  /* Fisher-Yates shuffle */
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }

  var picks = pool.slice(0, 4);

  /* Build HTML using homepage card structure */
  var html = '<p class="more-essays-title">More Essays</p>';
  html += '<ul class="essay-list more-essays-grid-hp">';

  picks.forEach(function (e) {
    html += '<li><a href="' + hrefPrefix + e.href + '" class="essay-card">';
    html += '<img src="' + e.img + '" alt="' + e.title.replace(/"/g, '&quot;') + '" class="essay-thumb" loading="lazy">';
    html += '<div class="essay-card-text">';
    html += '<span class="essay-title">' + e.title + '</span>';
    if (e.subtitle) html += '<span class="essay-card-subtitle">' + e.subtitle + '</span>';
    html += '</div>';
    html += '</a></li>';
  });

  html += '</ul>';
  container.innerHTML = html;
})();