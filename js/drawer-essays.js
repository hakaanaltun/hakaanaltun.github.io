/* drawer-essays.js — Replaces static essay links in drawer with thumbnail cards */
(function () {
  'use strict';

  if (typeof ALL_ESSAYS === 'undefined') return;

  var drawer = document.getElementById('site-drawer');
  if (!drawer) return;

  /* Detect if we're inside the essays/ subdirectory */
  var isEssayPage = window.location.pathname.indexOf('/essays/') !== -1;
  var prefix = isEssayPage ? '' : 'essays/';
  /* Only mark a card as current when we are actually on an essay page */
  var current = isEssayPage ? (window.location.pathname.split('/').pop() || '') : '';

  var REGULAR_HREFS = [
    'best-ideas.html', 'empathy-paradox.html', 'love-or-fear.html',
    'unfinished-things.html', 'jung-shadow.html', 'defense-mechanisms.html',
    'ai-enough.html', 'say-hello.html'
  ];
  var SERIES_HREFS = [
    'on-lying.html', 'on-perceiving.html', 'on-looking.html',
    'on-forgiveness.html', 'on-keeping.html', 'on-longing.html', 'on-silence.html'
  ];

  function filterEssays(hrefs) {
    return hrefs.map(function (h) {
      for (var i = 0; i < ALL_ESSAYS.length; i++) {
        if (ALL_ESSAYS[i].href === h) return ALL_ESSAYS[i];
      }
      return null;
    }).filter(Boolean);
  }

  function buildCards(essays) {
    var container = document.createElement('div');
    container.className = 'drawer-essay-cards';

    essays.forEach(function (e) {
      var isCurrent = (e.href === current);

      var card = document.createElement('div');
      card.className = 'drawer-essay-card' + (isCurrent ? ' drawer-essay-card--current' : '');

      var img = document.createElement('img');
      img.src = e.img;
      img.alt = e.title;
      img.setAttribute('loading', 'lazy');
      card.appendChild(img);

      var titleSpan = document.createElement('span');
      titleSpan.className = 'drawer-essay-card-title';
      titleSpan.textContent = e.title;
      card.appendChild(titleSpan);

      if (isCurrent) {
        container.appendChild(card);
      } else {
        var link = document.createElement('a');
        link.href = prefix + e.href;
        link.className = 'drawer-essay-card-link';
        link.setAttribute('aria-label', e.title);
        link.appendChild(card);
        container.appendChild(link);
      }
    });

    return container;
  }

  function replaceLinksAfterLabel(label, cardContainer) {
    if (!label) return;

    /* Remove all nodes between this label and the next .drawer-label or end */
    var next = label.nextSibling;
    var toRemove = [];
    while (next) {
      if (next.nodeType === 1 && next.classList && next.classList.contains('drawer-label')) break;
      toRemove.push(next);
      next = next.nextSibling;
    }
    toRemove.forEach(function (node) { node.parentNode.removeChild(node); });

    /* Insert card container after the label */
    if (label.nextSibling) {
      label.parentNode.insertBefore(cardContainer, label.nextSibling);
    } else {
      label.parentNode.appendChild(cardContainer);
    }
  }

  /* Find the Essays and The On Series labels */
  var drawerLabels = drawer.querySelectorAll('.drawer-label');
  var essaysLabel = null, seriesLabel = null;
  for (var i = 0; i < drawerLabels.length; i++) {
    var text = drawerLabels[i].textContent.trim();
    if (text === 'Essays') essaysLabel = drawerLabels[i];
    if (text === 'The On Series') seriesLabel = drawerLabels[i];
  }

  replaceLinksAfterLabel(essaysLabel, buildCards(filterEssays(REGULAR_HREFS)));
  replaceLinksAfterLabel(seriesLabel, buildCards(filterEssays(SERIES_HREFS)));

  /* Attach close-drawer behaviour to newly created links */
  var backdrop = document.getElementById('site-drawer-backdrop');
  var toggleBtn = document.querySelector('.hamburger-btn');

  function closeDrawerForNav() {
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.classList.remove('drawer-open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  }

  var newLinks = drawer.querySelectorAll('.drawer-essay-card-link');
  for (var j = 0; j < newLinks.length; j++) {
    newLinks[j].addEventListener('click', closeDrawerForNav);
  }
})();
