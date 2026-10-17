# Reading, keeping and the way back

Notes on how to build and change reading and keeping, for the sessions
that work on it. The rules a reader could read, with their reasons, are in
`COLOPHON.md`; a note here marked "(rule in `COLOPHON.md`)" carries out a
rule written there.

## Reading options

- **"Original" is the published page** (rule in `COLOPHON.md`).
  `js/reading-settings.js` sets `data-reading-size` and
  `data-reading-spacing` on `<html>` for a choice, and every rule in
  `css/reading.css` that changes the prose waits for one. The fixed sizes
  of headings, quotations and the piece note in `style.css` are multiplied
  by `--reading-scale`, so a larger setting keeps them in proportion.
  `scripts/test-reading.cjs` fails on an ungated rule.
- **A selected passage can be kept, written about or highlighted, and only
  Highlight marks the page** (rule in `COLOPHON.md`). The prompt over a
  selection offers Türkçe, Keep, Note and Highlight (`js/keep.js`,
  `js/reader-translate.js`).
  - On 12 October 2026 the author asked for the same prompt on a word's
    story and on a quiz's questions and notes. Every container marked
    `data-keep-passage` has it. A passage from a word story is kept under
    Words with Stories and named by its word, and its source numbers are
    left out. One from a quiz is kept under the quiz's name and named by
    the question it belongs to, which `js/trivia.js` sets as
    `data-keep-title`.
  - Keep puts the passage in the drawer and opens a small panel at the
    foot of the window with "Add a note", "Take out" and the way to the
    drawer, which opens the drawer over the page, as the footer's does.
    Note lets a reader write first: nothing is kept until "Keep
    with the note", and closing a note that is not kept asks once more.
    The way to the drawer stays beside a note that is not kept yet, so the
    earlier notes can be read while a new one is written, as the author
    asked on 12 October 2026. The note waits in the tab's session storage
    (`olae-note-draft`), and the panel opens with it again when the reader
    comes back to the page. Keeping it or letting it go clears it.
  - Highlight marks the passage on its page; over a highlight it reads
    "Remove highlight" and clears it. A highlight is listed in the drawer
    as Highlighted. One made by Highlight alone leaves the drawer when it
    is cleared; a highlight on something kept or written about only loses
    its mark. Touching a highlight opens a small box beside it with the
    note, "Remove highlight" and "Hide highlights". Hidden highlights stay
    hidden on every page until the reader shows them again from that box,
    from the drawer or by making a new highlight.
  - The note is stored with the thing it belongs to, goes into a backup,
    the text download and the printed drawer, and stays off a shared card.
    Under the note, "Write at length on The Page" takes the note there
    with what was kept and its link, after whatever The Page already
    holds, and The Page opens at their end (`at=end`). The author asked
    on 12 October 2026 that every note do this, as the balcony's notebook
    does (`toPage` in `js/keep.js`); the Copy button that stood beside it
    was taken out then. The link carries its way back (see The way back below).
    From the drawer, The Page's way back says "your drawer" and returns to
    the drawer as it was. From a passage on a page it names the piece, the
    word, the quiz, the book or The Reader and returns there. Taking out
    something with a note asks twice.
  - The mark is drawn with the CSS Custom Highlight API, so the page's
    text is never wrapped or changed. A browser without it is not offered
    Highlight, and paper never shows a mark. A passage is found by its
    words, so one whose words have since changed loses its mark and stays
    in the drawer.
- **Türkçe is found, not announced** (rule in `COLOPHON.md`). The
  translation runs on the free daily allowance of Cloudflare Workers AI,
  10,000 Neurons a day, through `translate.hakanaltunn.workers.dev`. Once
  the allowance is used up, Cloudflare answers with error 3036 and the
  reader is told that the daily limit has been reached.
- **The translation worker is kept in `workers/translate.js`.** It is a
  copy, added on 14 October 2026 so that a session can read it, and
  Jekyll leaves the folder out of the site. The worker itself runs on
  Cloudflare and is changed and deployed in its dashboard (Workers &
  Pages, translate, Edit code); a change made on one side is copied to
  the other, so the two stay the same. It answers pages on
  `hakanaltun.io` and `www.hakanaltun.io`, takes up to 500 selected
  characters with up to 1,500 characters of the text around them, and
  asks Qwen 3.8 27B on Workers AI for Turkish. By an estimate made that
  day, a translated sentence costs about 50 Neurons, so the free
  allowance holds about 200 a day; the Workers AI page in the dashboard
  shows the real figure. A script can
  claim to come from the site, so the check on the origin keeps other
  sites out but cannot stop someone using up the day's allowance. The
  code holds no secret; the model is reached through the worker's `AI`
  binding.
- **A printed piece** opens with its kind (Essay or Short fiction) on the
  left and HAKANALTUN.IO on the right, then the title and date, centered, and
  ends with the footer's two lines, centered at the foot of the last page. Word pages have no print layout
  of their own: The House's cards are how a word is printed or shared.
- **Puzzle mode waits at the foot of a piece** and opens at its head. Its
  panel is sticky, so the scroll aims at the article beneath it.

## The way back

- **Wherever a reader goes from, they can go back there** (rule in
  `COLOPHON.md`).
- **The address carries it.** A link that leaves a place carries `from=`,
  which names the place, and, where the name alone cannot find it,
  `back=` with its address on this site (`wayBack` in `js/keep.js`). The
  instruments read both in `_includes/tool-back.html`, and the drawer in
  The House reads them in `js/house.js`. An address on another site is
  never followed. After many rounds between the same two places `back=`
  would keep growing; past 1,500 characters it is left off, and the way
  back goes to the place's usual address. A passage's holder names its
  place with `data-keep-from`: `piece`, `word`, `quiz`, `book` or `read`.
- **The drawer is found as it was.** Its address in The House names the
  room it was open over (`in=balcony` or `in=door`; the study needs none)
  and its own way back (`from=notebook`, or an instrument or a page with
  its `back=`). On any other page `#drawer` opens the drawer over that
  page, and closing it takes `#drawer` out of the address. Until
  14 October 2026, when the author noticed it, every way back to the
  drawer led to the study with no way on from there, and a drawer opened
  from an instrument forgot the instrument's own way back.
- `scripts/test-house.cjs` and `scripts/test-instrument-drawer.cjs` check
  the ways back.

## The drawer over any page

- **It opens where the reader is.** The site's menu's "Your drawer" and
  the footer's icon open the drawer in a box over the page, and closing
  it leaves the reader where they were. In The House it is the
  room's own box, opened over the door or the room that is showing.
  `js/drawer.js` lays the drawer out and holds what its buttons do, for
  The House (`js/house.js` hands it its box and its ways back) and for
  every other page, where it makes a box of its own with a line at its
  foot to the study, where the drawer is kept. `css/drawer.css` styles both.
  An address that ends in `#drawer` opens the drawer over its page; it is
  the way back to the drawer from The Page or an instrument.
- **What a page lacks is fetched once.** `_data/drawer_assets.yml` lists
  the drawer's scripts and styles and their `?v=` once; `head.html` and
  The House use it, and `js/site-nav.js` fetches whatever a page lacks the
  first time the drawer is asked for there. A kept thing shows the
  catalog's current words over any page, as in The House
  (`/house/catalog.json`). `scripts/test-house.cjs` checks all of it.
