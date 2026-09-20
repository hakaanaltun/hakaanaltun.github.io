/* link-preview.js — what is behind a link, without following it.

   Hold still over a link to somewhere else on this site and a small card
   says what it leads to: the title, what kind of thing it is, and the
   sentence that page uses to describe itself. Let go and it goes away. The
   point is to make looking around cost nothing, so that a reader can open a
   door a little way before deciding to walk through it.

   Where it stays out of the way:

   - Where there is no hover. A phone has no way to hold still over a link,
     and a card that appears on the tap that is already navigating away is
     worse than nothing. (hover: hover) and (pointer: fine) is the test.
   - Where the link is already a picture of the thing. A piece card carries
     the cover, the title and the date; repeating them in a box over the top
     is noise, so any link holding an image is left alone.
   - Where the link goes nowhere new — the page the reader is already on.
   - Where the reader asked for less motion; the card still appears, it just
     does not fade in.

   The index is /link-preview.json, fetched once, on the first sign that
   somebody is about to need it, and never on load. It carries no bodies,
   which is what keeps it small; /search-index.json is the one with those.
   If the fetch fails, nothing happens and every link still works, which is
   the whole failure behaviour: this is a convenience laid over ordinary
   links, and it never stands between the reader and one.

   Keyboard: a focused link shows the same card, and the card is wired to
   the link with aria-describedby so a screen reader reads it as the link's
   description rather than as loose text. Escape dismisses it. */
(function () {
  'use strict';

  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (!window.fetch || !window.Map) return;

  var OPEN_DELAY = 260;
  var CLOSE_DELAY = 160;
  var EDGE = 12;
  var GAP = 10;

  var records = null;
  var loading = null;
  var card = null;
  var openTimer = 0;
  var closeTimer = 0;
  var activeLink = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* One shape for a URL so the index and the page agree: the pathname, with
     a trailing slash, and the hash kept because a note is addressed by one. */
  function key(pathname, hash) {
    var path = pathname || '/';
    if (path.length > 1 && path.charAt(path.length - 1) !== '/' && path.indexOf('.') === -1) path += '/';
    return path + (hash || '');
  }

  function load() {
    if (loading) return loading;
    loading = fetch('/link-preview.json', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then(function (rows) {
        records = new Map();
        rows.forEach(function (row) {
          var parsed = document.createElement('a');
          parsed.href = row.url;
          records.set(key(parsed.pathname, parsed.hash), row);
        });
        return records;
      })
      .catch(function () {
        records = new Map();
        return records;
      });
    return loading;
  }

  function previewable(link) {
    if (!link || link.dataset.noPreview === 'true') return false;
    if (link.hostname !== window.location.hostname) return false;
    if (link.getAttribute('href') === null) return false;
    if (link.closest('.link-preview')) return false;
    /* A card that already shows the cover and the title needs no second
       version of itself floating above it. */
    if (link.querySelector('img')) return false;
    var target = key(link.pathname, link.hash);
    if (target === key(window.location.pathname, window.location.hash)) return false;
    if (target === key(window.location.pathname, '')) return false;
    return target;
  }

  function build() {
    if (card) return card;
    card = document.createElement('div');
    card.className = 'link-preview';
    card.id = 'link-preview';
    card.setAttribute('role', 'tooltip');
    card.hidden = true;
    card.innerHTML =
      '<span class="link-preview-kind"></span>' +
      '<span class="link-preview-title"></span>' +
      '<span class="link-preview-description"></span>';
    document.body.appendChild(card);
    return card;
  }

  function place(link) {
    var box = link.getBoundingClientRect();
    var own = card.getBoundingClientRect();
    var left = box.left + (box.width / 2) - (own.width / 2);
    left = Math.max(EDGE, Math.min(left, window.innerWidth - own.width - EDGE));

    /* Below the link, unless there is more room above it. */
    var below = box.bottom + GAP;
    var top = below;
    if (below + own.height > window.innerHeight - EDGE && box.top - GAP - own.height > EDGE) {
      top = box.top - GAP - own.height;
    }
    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top + window.scrollY) + 'px';
  }

  function show(link, row) {
    build();
    card.querySelector('.link-preview-kind').textContent = row.kind || '';
    card.querySelector('.link-preview-title').textContent = row.title || '';
    var description = card.querySelector('.link-preview-description');
    description.textContent = row.description || '';
    description.hidden = !row.description;

    card.hidden = false;
    card.classList.toggle('is-still', reducedMotion);
    place(link);
    /* Two frames: one for the card to be measured at its real size, one for
       the class change to be seen as a transition rather than a first paint. */
    window.requestAnimationFrame(function () {
      if (card.hidden) return;
      place(link);
      card.classList.add('is-open');
    });

    activeLink = link;
    link.setAttribute('aria-describedby', 'link-preview');
  }

  function hide() {
    window.clearTimeout(openTimer);
    openTimer = 0;
    if (activeLink) {
      activeLink.removeAttribute('aria-describedby');
      activeLink = null;
    }
    if (!card) return;
    card.classList.remove('is-open');
    card.hidden = true;
  }

  function open(link) {
    var target = previewable(link);
    if (!target) return;
    window.clearTimeout(closeTimer);
    window.clearTimeout(openTimer);
    openTimer = window.setTimeout(function () {
      load().then(function (index) {
        var row = index.get(target);
        /* The reader may have moved on while the index was in flight. */
        if (!row || !link.matches(':hover, :focus-visible')) return;
        show(link, row);
      });
    }, OPEN_DELAY);
  }

  function close() {
    window.clearTimeout(openTimer);
    openTimer = 0;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(hide, CLOSE_DELAY);
  }

  document.addEventListener('pointerover', function (event) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    open(link);
  });

  document.addEventListener('pointerout', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (link) close();
  });

  document.addEventListener('focusin', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (link && link.matches(':focus-visible')) open(link);
  });

  document.addEventListener('focusout', function (event) {
    if (event.target.closest && event.target.closest('a[href]')) close();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && activeLink) hide();
  });

  /* Anything that moves the page out from under the card takes it with it. */
  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('resize', hide, { passive: true });
  document.addEventListener('click', hide);

  window.OLAE_LINK_PREVIEW = { key: key, previewable: previewable };
})();
