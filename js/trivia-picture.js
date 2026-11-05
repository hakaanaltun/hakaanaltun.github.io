/* trivia-picture.js — the small drawing above a trivia question (5 November
   2026). A question that has one says so in its bank, _data/quizzes/<slug>.json:

     "picture": {
       "sheet": "/trivia/assets/britain-question-illustrations.webp",
       "grid": [3, 2],      columns and rows of drawings on the sheet
       "cell": [0, 0],      which one: column, then row, counted from 0
       "alt": "A red London bus beside a streetlamp."
     }

   Several drawings share one sheet, so a quiz asks for one image however many
   of its questions are illustrated, and only when one of them comes up. The
   window onto the sheet is counted in cells, not pixels, so a sheet can be
   saved smaller or larger without changing anything here. A drawing shows the
   question's subject and never its answer, since it stands there before the
   reader chooses. The quizzes (js/trivia.js) and the homepage's question of
   the day (js/home-daily-trivia.js) both draw it with this. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function whole(n, low, high) {
    return typeof n === 'number' && n % 1 === 0 && n >= low && n <= high;
  }

  /* Only a sheet of this site's own, in the trivia folder. */
  function usable(p) {
    if (!p || typeof p !== 'object') return false;
    if (typeof p.sheet !== 'string' || !/^\/trivia\/assets\/[a-z0-9-]+\.(webp|png|jpg)$/.test(p.sheet)) return false;
    if (!Array.isArray(p.grid) || !Array.isArray(p.cell)) return false;
    if (!whole(p.grid[0], 1, 12) || !whole(p.grid[1], 1, 12)) return false;
    return whole(p.cell[0], 0, p.grid[0] - 1) && whole(p.cell[1], 0, p.grid[1] - 1);
  }

  /* Puts the question's drawing in holder, or empties and hides holder when
     the question has none. */
  function show(holder, picture) {
    if (!holder) return;
    holder.textContent = '';
    if (!usable(picture)) {
      holder.hidden = true;
      return;
    }
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '96');
    svg.setAttribute('height', '96');
    svg.setAttribute('viewBox', picture.cell[0] + ' ' + picture.cell[1] + ' 1 1');
    svg.setAttribute('overflow', 'hidden');
    svg.setAttribute('focusable', 'false');
    if (typeof picture.alt === 'string' && picture.alt) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', picture.alt);
    } else {
      svg.setAttribute('aria-hidden', 'true');
    }
    var image = document.createElementNS(NS, 'image');
    image.setAttribute('width', String(picture.grid[0]));
    image.setAttribute('height', String(picture.grid[1]));
    image.setAttribute('preserveAspectRatio', 'none');
    image.setAttribute('href', picture.sheet);
    image.addEventListener('error', function () {
      if (holder.firstChild === svg) holder.hidden = true;
    });
    svg.appendChild(image);
    holder.appendChild(svg);
    holder.hidden = false;
  }

  window.triviaPicture = { show: show, usable: usable };
}());
