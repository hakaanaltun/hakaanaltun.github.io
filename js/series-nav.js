/* series-nav.js — Replaces .series-nav with On Series thumbnail cards */
(function () {
  'use strict';

  var SERIES = [
    { num: 1, href: 'on-lying.html',       label: 'On Lying' },
    { num: 2, href: 'on-perceiving.html',  label: 'On Perceiving' },
    { num: 3, href: 'on-looking.html',     label: 'On Looking' },
    { num: 4, href: 'on-forgiveness.html', label: 'On Forgiveness' },
    { num: 5, href: 'on-beauty.html',      label: 'On Keeping' },
    { num: 6, href: 'on-longing.html',     label: 'On Longing' },
    { num: 7, href: 'on-silence.html',     label: 'On Silence',     isFinale: true  }
  ];

  var nav = document.querySelector('.series-nav');
  if (!nav) return;

  var current = window.location.pathname.split('/').pop() || '';

  /* Build image map from ALL_ESSAYS */
  var imgMap = {};
  if (typeof ALL_ESSAYS !== 'undefined') {
    ALL_ESSAYS.forEach(function (e) { imgMap[e.href] = e.img; });
  }

  /* Title with split colors */
  var html = '<p class="series-nav-title">'
    + '<span class="series-nav-title-on">The On Series</span>'
    + '<span class="series-nav-title-sub"> \u00b7 Essays on what we build inside ourselves \u2014 and why</span>'
    + '</p>';

  /* Thumbnail cards row */
  html += '<div class="series-nav-cards">';

  SERIES.forEach(function (s) {
    var isCurrent = (s.href === current);
    var img = imgMap[s.href] || '';
    var label = s.label.replace(/"/g, '&quot;');

    var isFinale = !!s.isFinale;
    var inner = '<div class="series-thumb-card' + (isCurrent ? ' series-thumb-card--current' : '') + (isFinale ? ' series-thumb-card--finale' : '') + '">'
      + (img ? '<img src="' + img + '" alt="' + label + '" loading="lazy">' : '<div class="series-thumb-img-placeholder"></div>')
      + '<span class="series-thumb-label">'
      + '<span class="series-thumb-num">' + s.num + '</span>. ' + s.label
      + '</span>'
      + '</div>';

    if (isCurrent) {
      html += inner;
    } else {
      html += '<a href="' + s.href + '" class="series-thumb-link" aria-label="' + label + '">' + inner + '</a>';
    }
  });

  html += '</div>';

  nav.innerHTML = html;
})();
