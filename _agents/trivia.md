# Trivia

Notes on how to build and change Trivia, for the sessions that work on it.
The rules a reader could read, with their reasons, are in `COLOPHON.md`; a
note here marked "(rule in `COLOPHON.md`)" carries out a rule written
there.

- Adding a quiz requires three files, as described in `_data/trivia.yml`.

- **A question's drawing lives in its bank** (rule in `COLOPHON.md`).
  `"picture": {"sheet": "/trivia/assets/<name>.webp", "grid": [cols, rows],
  "cell": [col, row], "alt": "..."}` on the question; `cell` counts from 0,
  column first. Several drawings share one sheet, fetched only when one of
  its questions comes up. `js/trivia-picture.js` draws it, 96px, as a window
  onto the sheet counted in cells, so a sheet can be saved at another size
  without any change to code; cells must be square. The quiz shows it above
  the question (`#trivia-question-illustration`), and so does the homepage's
  question of the day (`#home-daily-trivia-illustration`);
  `/trivia/questions.json` carries `picture`. A 1536×1024 sheet of six is
  about 300 KB, five times what a 96px drawing needs on a sharp phone
  screen; 768×512 is about 100 KB and still sharp. Students had asked for
  pictures on 9 October 2026; the first six, for British Culture, came on
  5 November 2026, first as a script for that quiz alone, and moved into
  the bank the same evening. `scripts/test-trivia.cjs` checks every picture
  names a sheet that is there, a cell inside its grid and square cells.

- **A question can name a word** (rule in `COLOPHON.md`). `"word": "<slug>"`
  in the bank adds the line under the answered note (`#trivia-word`,
  `js/trivia.js`). Following it puts `#question` in the quiz's address, and
  a quiz opened with `#question` and a game in progress goes straight back
  to that question with its note. The homepage's question of the day shows the
  same line since 5 November 2026 (`#home-daily-trivia-word`,
  `js/home-daily-trivia.js`); `/trivia/questions.json` carries the `word`.
  The author found it missing under the sandwich question. `scripts/test-content.cjs` fails on a
  word with no story in `_words/`.
