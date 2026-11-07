# Trivia

Notes on how to build and change Trivia, for the sessions that work on it.
The rules a reader could read, with their reasons, are in `COLOPHON.md`; a
note here marked "(rule in `COLOPHON.md`)" carries out a rule written
there.

- Adding a quiz requires three files, as described in `_data/trivia.yml`.

- **A question's drawing lives in its bank** (rule in `COLOPHON.md`).
  `"picture": {"src": "/trivia/assets/drawings/<name>.webp", "alt": "..."}`
  on the question. Each drawing is a square file of its own, named after
  what it shows, and several questions may share one. `js/trivia-picture.js`
  shows it at 96px. The quiz shows it above the question
  (`#trivia-question-illustration`), and so do the homepage's question of
  the day (`#home-daily-trivia-illustration`) and the big screen of a game
  played together (`#live-picture`); `/trivia/questions.json` carries
  `picture`. Students had asked for pictures on 9 October 2026; the first
  six, for British Culture, came on 5 November 2026, and on 6 November a
  drawing for every question in all six quizzes. They came as sheets of
  many drawings, a window onto a sheet for each question, until the
  homepage turned out to fetch a sheet of about 750 KB to show one
  drawing. The same day the sheets were cut into files of 3 to 17 KB,
  136px square (192px for the first six, cut down from 512px), so a page
  fetches only the drawings it shows. A new sheet of drawings is cut the
  same way before it goes in. `scripts/test-trivia.cjs` checks every
  picture names a file that is there, square, between 96 and 288px and no
  more than 40 KB. Hello Kitty, Sanrio's character, was drawn for the
  question about her and was taken out the same day; the drawings are the
  site's own (rule in `COLOPHON.md`).

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

- **Speaking games have their own catalogue.** `/speaking/` groups pages
  marked `speaking: true` by `level` (A, B1 or B2), then `lesson_order`.
  Each page names its bank in `_data/speaking/` with `quiz`, and its card
  with `topic` and `description`. Keep the existing Making Plans address.
  Each bank has five expressions followed by ten situations. The shared
  quiz layout and the live game keep those rounds in order and shuffle
  within them. `/speaking/questions.json` supplies the rooms separately
  from the culture feed, so these questions stay out of daily trivia.
  The host menu groups the same pages by level and uses `data-count` to
  keep every speaking game at fifteen questions. `scripts/test-live.mjs`
  checks each bank, its page, drawings and shuffled answers.

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
  before the question closes; once it closes, the phone shows the note
  under its result (`#join-result-note`). A phone that shows the choices'
  words shows the question's drawing above them too (`#join-picture`); one
  that shows only colours keeps to its buttons.
- **The QR code opens across the whole screen** (`#live-qr-big`), for the
  back of the room: a click on the lobby's code opens it, and a click or any
  key closes it, as does the game starting. It sits inside the stage, so it
  covers the browser's full screen as well. The author asked for both on
  6 November 2026, after playing a game alone.
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
  `live.hakanaltun.io` domain on the first deploy. The author set it up
  this way on 6 November 2026, with preview builds turned off, since a
  Worker that holds a Durable Object gets no preview addresses. It
  deploys again from each change to `main`, and the first room opened
  that morning.
