/* palettes.js — the /themes/ wardrobe for the light side of the site.
   --------------------------------------------------------------------------
   Two jobs:

   1. Everywhere: keep the theme-color meta on the active palette's chrome.
      theme.js calls window.__paletteMetaSync() whenever it re-points the
      metas; the pre-paint script in head.html does the same before CSS
      paints. The chrome hexes live in three places — the --chrome-rgb
      lines in css/palettes.css, the compact table in head.html, and the
      CHROME map below — keep the three in sync.

   2. On /themes/: build the palette previews; a click keeps that palette
      on this device — no separate "keep" step, no rotation. A palette only
      ever repaints the light path — Dark, Midnight and the dark half of
      Dusk are out of reach by construction (see css/palettes.css), so
      choosing here simply forces data-theme="light" for the look; a
      stored Dark/Midnight choice is untouched and returns on the next page.

   Palette 1 is Ash & Gold, the site's own face — it needs no rules, it is
   the :root default in style.css, so "no attribute" means 1. */
(function () {
  'use strict';
  if (window.__paletteWardrobe) return;
  window.__paletteWardrobe = true;

  var COUNT = 12;
  var CHROME = {
    2: '#3E4A44', 3: '#3A4148', 4: '#5E4234', 5: '#3E4F42',
    6: '#22364F', 7: '#59513A', 8: '#47415A', 9: '#234640',
    10: '#5E4046', 11: '#45412E', 12: '#2E3F45'
  };

  /* Display data for the /themes/ mocks: paper, soft ink, muted, chrome,
     footer type and the eight section accents (home, essays, series, book,
     moris, about, story, tools — the ACCENT_LABELS order below).

     The accents are the one thing here that is not authored: the browser
     derives them from the section hues in css/style.css and the palette's
     own --sec-l in css/palettes.css. These hexes are that derivation
     precomputed, purely so the swatches can be painted as inline styles —
     if either of those two files changes, recompute them, or the mocks will
     quietly disagree with the site they are previewing. */
  var PALETTES = [
    { name: 'Ash & Gold',    tag: 'the site’s own face',
      paper: '#FDFCF8', inkSoft: '#3A342C', vizon: '#6D665B',
      chrome: '#444A4E', ftext: '#DCD1AC', fmuted: '#C6B98F',
      acc: ['#247373', '#8B535C', '#407353', '#7C6230', '#626C38', '#785882', '#8A5841', '#456990'] },
    { name: 'Vellum',        tag: 'warm cream, quiet as old paper',
      paper: '#F7F2E7', inkSoft: '#443B30', vizon: '#716654',
      chrome: '#3E4A44', ftext: '#EFE9D4', fmuted: '#CFC7AE',
      acc: ['#1E6F6F', '#875058', '#3C6F4F', '#775E2C', '#5E6834', '#74547E', '#86543D', '#41658C'] },
    { name: 'Fog',           tag: 'a cool grey morning',
      paper: '#F2F3F1', inkSoft: '#373C42', vizon: '#62686E',
      chrome: '#3A4148', ftext: '#E8EBEE', fmuted: '#C3C9CF',
      acc: ['#1E6F6F', '#875058', '#3C6F4F', '#775E2C', '#5E6834', '#74547E', '#86543D', '#41658C'] },
    { name: 'Clay',          tag: 'terracotta dust',
      paper: '#F6EDE3', inkSoft: '#4A382D', vizon: '#775F51',
      chrome: '#5E4234', ftext: '#F4E7D6', fmuted: '#D9C3AE',
      acc: ['#1A6C6C', '#844D55', '#396C4C', '#745B29', '#5B6532', '#71517B', '#83513B', '#3F6289'] },
    { name: 'Sage',          tag: 'a garden in pale green',
      paper: '#EEF1E6', inkSoft: '#3A463D', vizon: '#5D695B',
      chrome: '#3E4F42', ftext: '#E9F0DF', fmuted: '#C4CFB2',
      acc: ['#1C6E6E', '#854E57', '#3B6D4D', '#765C2A', '#5D6633', '#72537C', '#84523C', '#40638A'] },
    { name: 'Blueprint',     tag: 'the draughtsman’s blue',
      paper: '#EDF1F5', inkSoft: '#33414F', vizon: '#586679',
      chrome: '#22364F', ftext: '#E4EBF3', fmuted: '#B9C6D4',
      acc: ['#1B6D6D', '#844D56', '#3A6C4D', '#755B2A', '#5C6632', '#72527C', '#83523B', '#3F6289'] },
    { name: 'Ochre',         tag: 'sunlit straw',
      paper: '#F6F0D8', inkSoft: '#4A4328', vizon: '#6F653C',
      chrome: '#59513A', ftext: '#F3EDD2', fmuted: '#D8CCA4',
      acc: ['#1B6D6D', '#844D56', '#3A6C4D', '#755B2A', '#5C6632', '#72527C', '#83523B', '#3F6289'] },
    { name: 'Lavender Mist', tag: 'dusk-tinted violet',
      paper: '#F0EEF4', inkSoft: '#3E3A4A', vizon: '#666176',
      chrome: '#47415A', ftext: '#EDE9F4', fmuted: '#CBC4DA',
      acc: ['#196B6C', '#834C55', '#396B4C', '#745A28', '#5B6431', '#70517A', '#82503A', '#3E6188'] },
    { name: 'Sea Salt',      tag: 'a breath of the Aegean',
      paper: '#EDF4F1', inkSoft: '#33443F', vizon: '#586A64',
      chrome: '#234640', ftext: '#E7F2EB', fmuted: '#BCD2C8',
      acc: ['#1D6E6E', '#864F57', '#3C6E4E', '#775D2B', '#5D6733', '#73537D', '#85533D', '#41648B'] },
    { name: 'Pudra',         tag: 'powder pink, softly worn',
      paper: '#F7EDE8', inkSoft: '#4C3A3C', vizon: '#755E60',
      chrome: '#5E4046', ftext: '#F6E9E4', fmuted: '#DCC5C2',
      acc: ['#196B6C', '#834C55', '#396B4C', '#745A28', '#5B6431', '#70517A', '#82503A', '#3E6188'] },
    { name: 'Field',         tag: 'harvest gold, full sun',
      paper: '#DDD6BC', inkSoft: '#453F28', vizon: '#5B522F',
      chrome: '#45412E', ftext: '#E9E3C8', fmuted: '#C5BB92',
      acc: ['#03595A', '#6F3C45', '#2A593C', '#61491A', '#4A5323', '#5E4167', '#6E402C', '#2F5073'] },
    { name: 'Slate Paper',   tag: 'wet slate after rain',
      paper: '#DDE3E4', inkSoft: '#324147', vizon: '#4E5E64',
      chrome: '#2E3F45', ftext: '#E3EAEB', fmuted: '#B4C2C6',
      acc: ['#096363', '#7A444C', '#306243', '#6B521F', '#525C28', '#684871', '#794832', '#36587F'] }
  ];
  var ACCENT_LABELS = ['home', 'essays', 'series', 'book', 'moris', 'about', 'story', 'tools'];

  function stored() {
    try { return localStorage.getItem('palette'); } catch (e) { return null; }
  }
  /* Keep <meta name="theme-color"> on the active palette's chrome — but
     only on the light path. theme.js calls this at the end of every
     syncThemeColor(); head.html's pre-paint script covers first paint. */
  function paletteMetaSync() {
    var n = parseInt(stored(), 10);
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'midnight') return;     /* dark side is fixed */
    if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) return;
    document.querySelectorAll('meta[name="theme-color"][data-light]').forEach(function (m) {
      var v = n >= 2 && n <= COUNT && CHROME[n] ? CHROME[n] : m.getAttribute('data-light');
      if (v) m.setAttribute('content', v);            /* palette chrome, else Ash & Gold */
    });
  }
  window.__paletteMetaSync = paletteMetaSync;
  paletteMetaSync();

  /* ---- /themes/ page ---- */
  var list = document.getElementById('palette-list');
  if (!list) return;
  var status = document.getElementById('themes-status');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildPreview(p, n) {
    var box = el('section', 'palette-preview');
    box.setAttribute('data-n', n);
    box.setAttribute('tabindex', '0');
    box.setAttribute('role', 'button');
    box.setAttribute('aria-label', 'Preview the ' + p.name + ' palette');

    var head = el('div', 'palette-preview-head');
    var name = el('h2', 'palette-preview-name');
    name.innerHTML = (n) + ' · ' + p.name.replace(/&/g, '&amp;') + ' ';
    name.appendChild(el('span', 'palette-current-mark', '✓'));
    head.appendChild(name);
    head.appendChild(el('span', 'palette-preview-tag', p.tag));
    box.appendChild(head);

    var mock = el('div', 'palette-mock');
    var pmh = el('div', 'pm-head');
    pmh.style.background = p.chrome;
    var brand = el('span', 'pm-brand');
    brand.innerHTML = 'On Life &amp; Everything';
    brand.style.color = p.ftext;
    var nav = el('span', 'pm-nav', 'Essays · Series · Book · About');
    nav.style.color = p.fmuted;
    pmh.appendChild(brand); pmh.appendChild(nav);

    var pmb = el('div', 'pm-body');
    pmb.style.background = p.paper;
    var title = el('h3', 'pm-title', 'The Corner');
    title.style.color = p.acc[0];
    var text = el('p', 'pm-text', 'Three stories from a corner that never emptied.');
    text.style.color = p.inkSoft;
    var meta = el('p', 'pm-meta', 'Series · 3 stories');
    meta.style.color = p.vizon;
    pmb.appendChild(title); pmb.appendChild(text); pmb.appendChild(meta);

    var pmf = el('div', 'pm-foot');
    pmf.style.background = p.chrome;
    var f1 = el('span', 'pm-foot-brand');
    f1.innerHTML = 'On Life &amp; Everything';
    f1.style.color = p.ftext;
    var f2 = el('span', null, 'letters@hakanaltun.io');
    f2.style.color = p.fmuted;
    pmf.appendChild(f1); pmf.appendChild(f2);

    mock.appendChild(pmh); mock.appendChild(pmb); mock.appendChild(pmf);
    box.appendChild(mock);

    var accents = el('div', 'palette-accents');
    p.acc.forEach(function (c, i) {
      var a = el('div', 'palette-accent');
      var sw = el('div', 'pa-sw');
      sw.style.background = c;
      a.appendChild(sw);
      a.appendChild(el('div', 'pa-lb', ACCENT_LABELS[i]));
      accents.appendChild(a);
    });
    box.appendChild(accents);
    return box;
  }

  PALETTES.forEach(function (p, i) { list.appendChild(buildPreview(p, i + 1)); });
  var previews = Array.prototype.slice.call(list.querySelectorAll('.palette-preview'));

  /* Click = keep: the choice is stored at once and stays on this device
     until another palette is picked. Palette 1 means "no choice" — the
     site's own Ash & Gold — so it clears the key instead of storing. */
  function choose(n) {
    if (n === 1) document.documentElement.removeAttribute('data-palette');
    else document.documentElement.setAttribute('data-palette', String(n));
    try {
      if (n === 1) localStorage.removeItem('palette');
      else localStorage.setItem('palette', String(n));
    } catch (e) { /* private mode */ }
    /* Force the light path for the look — a stored Dark/Midnight choice is
       untouched and quietly returns on the next page. */
    document.documentElement.setAttribute('data-theme', 'light');
    paletteMetaSync();
    sync();
  }

  function sync() {
    var s = parseInt(stored(), 10);
    var chosen = s >= 1 && s <= COUNT ? s : 1;
    var name = PALETTES[chosen - 1].name;

    previews.forEach(function (pv) {
      var on = parseInt(pv.getAttribute('data-n'), 10) === chosen;
      var mark = pv.querySelector('.palette-current-mark');
      if (mark) mark.hidden = !on;
    });

    if (chosen === 1) {
      status.innerHTML = 'Nothing chosen&mdash;the site always opens in its own <b class="site-face">Ash &amp; Gold</b>.';
    } else {
      status.innerHTML = '<b class="site-face">' + name + '</b> is yours on this device, until you pick another.';
    }
  }

  list.addEventListener('click', function (e) {
    var pv = e.target.closest('.palette-preview');
    if (pv) choose(parseInt(pv.getAttribute('data-n'), 10));
  });
  list.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var pv = e.target.closest('.palette-preview');
    if (!pv) return;
    e.preventDefault();
    choose(parseInt(pv.getAttribute('data-n'), 10));
  });

  sync();
})();
