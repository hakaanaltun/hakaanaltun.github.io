/* trivia-picture.js — the small drawing above a trivia question (5 November
   2026). A question that has one says so in its bank, _data/quizzes/<slug>.json:

     "picture": {
       "src": "/trivia/assets/drawings/red-london-bus.webp",
       "alt": "A red London bus beside a streetlamp."
     }

   Each drawing is a small file of its own in /trivia/assets/drawings/, and
   several questions may share one. The drawings first came as sheets of many
   drawings, which meant the homepage's question of the day fetched them all
   to show one; on 6 November 2026 they were cut into files of a few
   kilobytes each. A drawing shows the question's subject and never its
   answer, since it stands there before the reader chooses. The quizzes
   (js/trivia.js), the homepage's question of the day
   (js/home-daily-trivia.js) and the big screen of a game played together
   (js/live-host.js) all draw it with this. */
(function () {
  'use strict';

  /* Only a drawing of this site's own, in the trivia folder. */
  function usable(p) {
    if (!p || typeof p !== 'object') return false;
    return typeof p.src === 'string' && /^\/trivia\/assets\/drawings\/[a-z0-9-]+\.webp$/.test(p.src);
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
    var image = document.createElement('img');
    image.width = 96;
    image.height = 96;
    image.decoding = 'async';
    image.alt = typeof picture.alt === 'string' ? picture.alt : '';
    image.addEventListener('error', function () {
      if (holder.firstChild === image) holder.hidden = true;
    });
    image.src = picture.src;
    holder.appendChild(image);
    holder.hidden = false;
  }

  window.triviaPicture = { show: show, usable: usable };
}());
