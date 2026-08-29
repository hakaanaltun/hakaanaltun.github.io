/* palettes.js — the /themes/ wardrobe for the light side of the site.
   --------------------------------------------------------------------------
   Two jobs:

   1. Everywhere: keep the theme-color meta on the active palette's chrome.
      theme.js calls window.__paletteMetaSync() whenever it re-points the
      metas; the pre-paint script in head.html does the same before CSS
      paints. The chrome hexes live in three places — the --chrome-rgb
      lines in css/palettes.css, the compact table in head.html, and the
      CHROME map below — keep the three in sync.

   2. On /themes/: build the previews; a click keeps that look on this
      device — no separate "keep" step, no rotation. The page shows the
      whole wardrobe, in two halves:

      * Twelve light palettes. A palette only ever repaints the light path —
        Dark, Midnight and the dark half of Dusk are out of reach by
        construction (see css/palettes.css), so choosing one simply forces
        data-theme="light" for the look; a stored palette is untouched by a
        later Dark choice and returns the next time the day is on.
      * Dark and Midnight, the two themes the light path cannot reach.
        These are the same choice the footer menu offers, shown here as
        previews rather than as words — the reason the footer's own list
        exists is that there are two darks, and until now the only place
        you could see the difference was by picking one. Choosing here
        writes the same localStorage key theme.js reads, so the footer
        menu, the theme-color metas and this page all agree.

      System and Dusk stay footer-only: neither is a look, so neither has
      anything to preview — Dusk is a rule that resolves to three of the
      looks below, and System is whatever the device says.

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
     footer type and the five section voices — the writing, the book, the
     quotes, the fiction and the site's own furniture, in the ACCENT_LABELS
     order below. Eight sections share these five; the grouping and the
     reasoning behind it live in css/style.css.

     The accents are the one thing here that is not authored: the browser
     derives them from the voices in css/style.css and the palette's own
     --sec-l in css/palettes.css. These hexes are that derivation
     precomputed, purely so the swatches can be painted as inline styles —
     if either of those two files changes, recompute them, or the mocks will
     quietly disagree with the site they are previewing. */
  var PALETTES = [
    { name: 'Ash & Gold',    tag: 'the site’s own face',
      paper: '#FDFCF8', inkSoft: '#3A342C', vizon: '#6D665B',
      chrome: '#444A4E', ftext: '#DCD1AC', fmuted: '#C6B98F',
      acc: ['#89565C', '#4F6792', '#646C45', '#805F49', '#467167'] },
    { name: 'Vellum',        tag: 'warm cream, quiet as old paper',
      paper: '#F7F2E7', inkSoft: '#443B30', vizon: '#716654',
      chrome: '#3E4A44', ftext: '#EFE9D4', fmuted: '#CFC7AE',
      acc: ['#855259', '#4B638E', '#606841', '#7C5B46', '#426D63'] },
    { name: 'Fog',           tag: 'a cool grey morning',
      paper: '#F2F3F1', inkSoft: '#373C42', vizon: '#62686E',
      chrome: '#3A4148', ftext: '#E8EBEE', fmuted: '#C3C9CF',
      acc: ['#855259', '#4B638E', '#606841', '#7C5B46', '#426D63'] },
    { name: 'Clay',          tag: 'terracotta dust',
      paper: '#F6EDE3', inkSoft: '#4A382D', vizon: '#775F51',
      chrome: '#5E4234', ftext: '#F4E7D6', fmuted: '#D9C3AE',
      acc: ['#824F55', '#48608B', '#5D653E', '#785843', '#3F6960'] },
    { name: 'Sage',          tag: 'a garden in pale green',
      paper: '#EEF1E6', inkSoft: '#3A463D', vizon: '#5D695B',
      chrome: '#3E4F42', ftext: '#E9F0DF', fmuted: '#C4CFB2',
      acc: ['#835157', '#49618C', '#5E663F', '#7A5944', '#406B61'] },
    { name: 'Blueprint',     tag: 'the draughtsman’s blue',
      paper: '#EDF1F5', inkSoft: '#33414F', vizon: '#586679',
      chrome: '#22364F', ftext: '#E4EBF3', fmuted: '#B9C6D4',
      acc: ['#835157', '#49618C', '#5E663F', '#7A5944', '#406B61'] },
    { name: 'Ochre',         tag: 'sunlit straw',
      paper: '#F6F0D8', inkSoft: '#4A4328', vizon: '#6F653C',
      chrome: '#59513A', ftext: '#F3EDD2', fmuted: '#D8CCA4',
      acc: ['#835157', '#49618C', '#5E663F', '#7A5944', '#406B61'] },
    { name: 'Lavender Mist', tag: 'dusk-tinted violet',
      paper: '#F0EEF4', inkSoft: '#3E3A4A', vizon: '#666176',
      chrome: '#47415A', ftext: '#EDE9F4', fmuted: '#CBC4DA',
      acc: ['#814F55', '#475F8A', '#5C643D', '#775742', '#3E695F'] },
    { name: 'Sea Salt',      tag: 'a breath of the Aegean',
      paper: '#EDF4F1', inkSoft: '#33443F', vizon: '#586A64',
      chrome: '#234640', ftext: '#E7F2EB', fmuted: '#BCD2C8',
      acc: ['#845258', '#4A628D', '#5F6740', '#7B5A45', '#416C62'] },
    { name: 'Pudra',         tag: 'powder pink, softly worn',
      paper: '#F7EDE8', inkSoft: '#4C3A3C', vizon: '#755E60',
      chrome: '#5E4046', ftext: '#F6E9E4', fmuted: '#DCC5C2',
      acc: ['#814F55', '#485F8A', '#5C643E', '#785742', '#3F695F'] },
    { name: 'Field',         tag: 'harvest gold, full sun',
      paper: '#DDD6BC', inkSoft: '#453F28', vizon: '#5B522F',
      chrome: '#45412E', ftext: '#E9E3C8', fmuted: '#C5BB92',
      acc: ['#6E3E44', '#374E78', '#4B532D', '#664632', '#2D584E'] },
    { name: 'Slate Paper',   tag: 'wet slate after rain',
      paper: '#DDE3E4', inkSoft: '#324147', vizon: '#4E5E64',
      chrome: '#2E3F45', ftext: '#E3EAEB', fmuted: '#B4C2C6',
      acc: ['#78474D', '#405781', '#545C36', '#6F4F3A', '#366157'] }
  ];
  var ACCENT_LABELS = ['writing', 'book', 'quotes', 'fiction', 'the site'];

  /* The two darks, in the same display shape as a palette so one builder
     covers both halves of the page. Their grounds and type are read off the
     [data-theme] blocks in css/style.css; Dark's five accents are the
     --sec-ld/--sec-cd/--sec-h night voices from the same file, resolved to
     sRGB — the night twin of the precomputation above, and the same rule
     applies: if those blocks change, recompute these. Midnight reads none
     of it. It pins --petrol to a single gold for every section, so it gets
     one swatch rather than five, which is the honest picture of it. */
  var DARKS = [
    { key: 'dark',     name: 'Dark',     tag: 'the warm night',
      paper: '#1C1B18', inkSoft: '#D7CEB8', vizon: '#A29A8A',
      chrome: '#171613', ftext: '#EFE7D4', fmuted: '#C3BAA4',
      acc: ['#CA8A91', '#B0C5EB', '#C7D0A8', '#D3AB91', '#9DC8BE'] },
    { key: 'midnight', name: 'Midnight', tag: 'parliament blue, one gold',
      paper: '#10161F', inkSoft: '#C6B98F', vizon: '#C6B98F',
      chrome: '#0D1219', ftext: '#DCD1AC', fmuted: '#C6B98F',
      acc: ['#C6B98F'], accLabels: ['every section'] }
  ];

  function stored() {
    try { return localStorage.getItem('palette'); } catch (e) { return null; }
  }
  /* theme.js owns this key; read it here so the tick can sit on Dark or
     Midnight when one of them is the stored choice. "dusk" is deliberately
     not one of them: it is a rule, not a look, and ticking whichever of the
     two it happens to have resolved to would misreport the choice. */
  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
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

  function group(text) {
    var h = el('h2', 'themes-group', text);
    list.appendChild(h);
  }

  /* The whole card is clickable, but it is not the keyboard target: a
     role="button" makes its descendants presentational, which threw away all
     twelve headings and with them any way to move through the page by
     heading. The heading stays a heading; a real <button> inside it carries
     the name, the focus ring and the keyboard activation. Mouse users still
     get the whole card — the click listener on the list has not changed.
     (They are <h3> under the two <h2> group headings.)

     `label` is what the button says: "3 · Fog" for a palette, a bare name
     for a dark — the numbers belong to data-palette, and the darks are not
     in it. */
  function buildPreview(p, label) {
    var box = el('section', 'palette-preview');

    var head = el('div', 'palette-preview-head');
    var name = el('h3', 'palette-preview-name');
    var btn = el('button', 'palette-preview-btn');
    btn.type = 'button';
    btn.innerHTML = label.replace(/&/g, '&amp;') + ' ';
    btn.appendChild(el('span', 'palette-current-mark', '✓'));
    name.appendChild(btn);
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
    var title = el('h4', 'pm-title', 'The Corner');   /* inside the preview's own h3 */
    title.style.color = p.acc[0];   /* a series, so the writing voice */
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
    var labels = p.accLabels || ACCENT_LABELS;
    p.acc.forEach(function (c, i) {
      var a = el('div', 'palette-accent');
      var sw = el('div', 'pa-sw');
      sw.style.background = c;
      a.appendChild(sw);
      a.appendChild(el('div', 'pa-lb', labels[i]));
      accents.appendChild(a);
    });
    box.appendChild(accents);
    return box;
  }

  group('Twelve for the day');
  PALETTES.forEach(function (p, i) {
    var box = buildPreview(p, (i + 1) + ' · ' + p.name);
    box.setAttribute('data-n', String(i + 1));
    list.appendChild(box);
  });

  group('Two for the night');
  DARKS.forEach(function (p) {
    var box = buildPreview(p, p.name);
    box.setAttribute('data-set-theme', p.key);
    list.appendChild(box);
  });

  var previews = Array.prototype.slice.call(list.querySelectorAll('.palette-preview'));

  /* Click = keep: the choice is stored at once and stays on this device
     until another palette is picked. Palette 1 means "no choice" — the
     site's own Ash & Gold — so it clears the key instead of storing.

     Choosing a palette also stores Light. A palette exists only on the day
     path — every rule in css/palettes.css is behind either
     prefers-color-scheme: light or an explicit [data-theme="light"] — so a
     reader whose system prefers dark used to get the look on this page and
     nothing at all on the next one: the page offered a choice that did not
     survive a click. Pinning Light is what makes the offer true. It is not
     a one-way door; Dark and Midnight are two cards further down this page
     (and Dusk is one click away in the footer), and the palette stored here
     waits through all of them for the next time the day is on. */
  function choose(n) {
    if (n === 1) document.documentElement.removeAttribute('data-palette');
    else document.documentElement.setAttribute('data-palette', String(n));
    try {
      if (n === 1) localStorage.removeItem('palette');
      else localStorage.setItem('palette', String(n));
      localStorage.setItem('theme', 'light');
    } catch (e) { /* private mode */ }
    document.documentElement.setAttribute('data-theme', 'light');
    themeMetaSync();
    sync();
  }

  /* Dark and Midnight: the same write theme.js's own menu makes, so the two
     stay one choice rather than two. The stored palette is deliberately left
     alone — it is the day's look, and it comes back the next time the day
     is on. */
  function chooseTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* private mode */ }
    themeMetaSync();
    sync();
  }

  /* theme.js publishes its meta sync once it has wired the footer menu; it
     covers the palette metas too (it ends by calling paletteMetaSync). Fall
     back to the palette half alone if the footer strip is not on the page. */
  function themeMetaSync() {
    if (window.__themeColorSync) window.__themeColorSync();
    else paletteMetaSync();
  }

  function sync() {
    var t = storedTheme();
    var darkChosen = t === 'dark' || t === 'midnight';
    var s = parseInt(stored(), 10);
    var chosen = s >= 1 && s <= COUNT ? s : 1;
    var name = PALETTES[chosen - 1].name;

    previews.forEach(function (pv) {
      var theme = pv.getAttribute('data-set-theme');
      /* One tick on the page: a stored dark carries it, and the palette
         underneath waits its turn rather than claiming it too. */
      var on = theme ? theme === t
                     : !darkChosen && parseInt(pv.getAttribute('data-n'), 10) === chosen;
      var mark = pv.querySelector('.palette-current-mark');
      if (mark) mark.hidden = !on;
      /* The tick is the sighted cue; aria-pressed is the same news for
         anyone who cannot see it. */
      var btn = pv.querySelector('.palette-preview-btn');
      if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    var face = '<b class="site-face">' + name.replace(/&/g, '&amp;') + '</b>';
    if (darkChosen) {
      var dark = '<b class="site-face">' + (t === 'dark' ? 'Dark' : 'Midnight') + '</b>';
      status.innerHTML = chosen === 1
        ? dark + ' is yours on this device, until you pick another.'
        : dark + ' is yours on this device&mdash;' + face + ' is still stored, and comes back the next time the day is on.';
    } else if (chosen === 1) {
      status.innerHTML = 'No palette chosen&mdash;the site keeps its own <b class="site-face">Ash &amp; Gold</b> '
        + 'by day, and turns to <b class="site-face">Dark</b> when the day is off.';
    } else if (dayIsOn()) {
      status.innerHTML = face + ' is yours on this device, until you pick another.';
    } else {
      /* A palette stored while System or Dusk has the night on. Say what is
         actually true, and name the way out. */
      status.innerHTML = face + ' is stored, but the site is on a dark theme right now'
        + '&mdash;pick it again to turn the day on.';
    }
  }

  /* Is the light path the one CSS is painting? An explicit theme decides it;
     with none, the system does. */
  function dayIsOn() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'light';
    return !window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* One listener covers both routes: a click anywhere on the card, and the
     click a real <button> already fires for Enter and Space. */
  list.addEventListener('click', function (e) {
    var pv = e.target.closest('.palette-preview');
    if (!pv) return;
    var theme = pv.getAttribute('data-set-theme');
    if (theme) chooseTheme(theme);
    else choose(parseInt(pv.getAttribute('data-n'), 10));
  });

  sync();
})();
