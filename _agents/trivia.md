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

## Playing together

- **One big screen, a phone each** (rule in `COLOPHON.md`). The author asked
  for a Kahoot-like way to play on 5 November 2026 and chose: a race, with
  points for speed; each player decides whether their buttons show the
  choices' words or only colours and shapes; anyone can open a room.
- **The pages are on the site; the rooms are not.** `/trivia/live/`
  (`trivia/live/index.html`, `js/live-host.js`) is the big screen, `/join/`
  (`join.html`, `js/live-join.js`) the phone, and `js/live-common.js` what
  they share; `css/live.css` styles both. The rooms are `live/`, a Worker
  of their own, `hakanaltun-live`, at `live.hakanaltun.io`: `live/worker.mjs`
  opens a room, `live/room.mjs` is one room (a Durable Object), and
  `live/game.mjs` holds the rules with no network in them
  (`scripts/test-live.mjs`). Jekyll leaves `live/` out of the site.
- **Why a second Worker.** Cloudflare makes no preview addresses for a
  Worker that holds a Durable Object, and the site's branches need theirs,
  so the site's own `wrangler.jsonc` must never gain one; `test-live.mjs`
  fails if it does.
- **The questions come from the site.** The room fetches
  `/trivia/questions.json` from `SITE` (hakanaltun.io) and picks from it,
  so a room can only show the site's own quizzes, with their notes and
  drawings. The choices are shuffled once per room, since A must mean the
  same thing on every screen. A phone never receives the answer or the note
  before the question closes.
- **What the room keeps, and for how long.** The game is in the room's
  storage, written at each join and each change of question, and each
  phone's answer rides on its own socket until the question closes, so an
  answer costs no write. The room sleeps between messages (WebSocket
  hibernation) and is emptied four hours after it opened. The free plan's
  allowance (100,000 requests and 100,000 rows written a day, in November
  2026) holds a class of forty playing fifty questions many hundreds of
  times a day.
- **Screens accepted.** Rooms open and sockets connect only from
  hakanaltun.io, www, and the site's preview addresses on
  `hakanaltunn.workers.dev`; `ALLOW_ORIGINS` adds others for a local test.
  Names are cleaned to letters, digits and a few marks, sixteen at most,
  one of each per room; the big screen can take a name out, and that phone
  cannot come back into the room.
- **Trying it locally.** Run `npx wrangler dev --var SITE:<a local copy of
  the built site> --var ALLOW_ORIGINS:<its origin>` in `live/`, and open the
  pages with `?server=http://localhost:8787`, which only a page on
  localhost obeys. On 5 November 2026 a game was played through this way
  with a big screen and four phones: a taken name, a phone reloaded mid
  question, the big screen reloaded, a question closed by its timer, a
  phone taken out, and the results.
- **Setting it up on Cloudflare, once.** In Workers & Pages, create a
  Worker from the repository, named `hakanaltun-live`, with `live` as its
  root directory and `npx wrangler deploy` as its deploy command (no build
  command). Its `wrangler.jsonc` creates the room class and the
  `live.hakanaltun.io` domain on the first deploy.
