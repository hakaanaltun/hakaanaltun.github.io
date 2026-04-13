/* fragments-nav.js—Replaces .fragments-nav with The Fragments thumbnail cards */
(function () {
  'use strict';

  var FRAGMENTS = [
    { num: 1, href: 'the-joy.html',     label: 'The Joy' },
    { num: 2, href: 'the-anxiety.html', label: 'The Anxiety' },
    { num: 3, href: 'the-poise.html',   label: 'The Poise' }
  ];

  var nav = document.querySelector('.fragments-nav');
  if (!nav) return;

  var current = window.location.pathname.split('/').pop() || '';

  /* Build image map from ALL_ESSAYS */
  var imgMap = {};
  if (typeof ALL_ESSAYS !== 'undefined') {
    ALL_ESSAYS.forEach(function (e) { imgMap[e.href] = e.img; });
  }

  /* Title with split colors */
  var html = '<p class="series-nav-title">'
    + '<span class="series-nav-title-on">The Fragments</span>'
    + '<span class="series-nav-title-sub"> \u00b7 A personal essay and two short stories\u2014memory, interference, and the decisions we make on behalf of others</span>'
    + '</p>';

  /* Thumbnail cards row */
  html += '<div class="series-nav-cards">';

  FRAGMENTS.forEach(function (f) {
    var isCurrent = (f.href === current);
    var img = imgMap[f.href] || '';
    var label = f.label.replace(/"/g, '&quot;');

    var inner = '<div class="series-thumb-card' + (isCurrent ? ' series-thumb-card--current' : '') + '">'
      + (img ? '<img src="' + img + '" alt="' + label + '" loading="lazy">' : '<div class="series-thumb-img-placeholder"></div>')
      + '<span class="series-thumb-label">'
      + '<span class="series-thumb-num">' + f.num + '</span>. ' + f.label
      + '</span>'
      + '</div>';

    if (isCurrent) {
      html += inner;
    } else {
      html += '<a href="' + f.href + '" class="series-thumb-link" aria-label="' + label + '">' + inner + '</a>';
    }
  });

  html += '</div>';

  nav.innerHTML = html;
})();
