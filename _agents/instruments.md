# The instruments

Notes on how to build and change the instruments, for the sessions that
work on it. The rules a reader could read, with their reasons, are in
`COLOPHON.md`; a note here marked "(rule in `COLOPHON.md`)" carries out a
rule written there.

## The instruments' notes

- **The notes wait folded until the reader asks.** The author asked on
  13 October 2026: the notes and questions help on a first visit and
  distract while an instrument is in use. `_includes/tool-notes.html`,
  inside every instrument's notes, folds them and lets "notes & questions"
  open and fold them again; an instrument without that cue is given one
  where its notes begin. They are folded with `hidden="until-found"` where
  the browser knows it, so find in page still reaches them, and a link to
  `#notes` opens them. Each visit starts with them folded.
- **Never in full screen.** In full screen, native or an instrument's own
  `body.immersive`, the notes and the cue are gone, so nothing can scroll
  down to them. The include marks a native full screen with
  `html.tool-full`. `scripts/test-tool-notes.cjs` checks every instrument.
- **The Page makes its own room.** The notes used to give room below the
  writing. Now `body.room-below` does, while typewriter scrolling is on
  and after arriving with `at=end`, so the last line can still come to the
  middle of the screen; a blank page does not scroll.

## Following the sky

- **By day an instrument is light, by night it is the ramp.** The author
  asked on 23 October 2026 for the instruments to turn with the site, so
  that a reader on Follow the sky does not step from a light page into a
  dark one at noon (`_agents/site.md`, Themes). `_includes/page-sky.html`
  paints the four tokens from the day's papers in
  `_includes/sky-ramp.html`: `--muted` is the paper's muted tier and
  `--line` its rule. By night they are the evening's slate darkening until
  nine and then the ramp's, as on the site. Its
  `data-theme` stays `"sky"` in both halves, so the corner button and the
  shelves of The Reader and The Page know the choice; `data-sky` names
  the half, and the colour scheme, light or dark, is set with the paint.
  On The Desk, `js/desk.js` hands the scheme to each pane with the
  tokens. The clock, The Noise, The Breath and the sky instruments keep
  their own light. Light and Dark on the corner button are as they were.

## The Desk

- **Every instrument can stand on it, beside any other or itself.** The
  author asked on 13 October 2026 for Reader beside Reader above all, so
  that a paper and another source, or one PDF at two pages, can be read
  side by side; Page beside Page and Draw beside Draw came with it, and
  the same day the author asked for every instrument. The desk's page
  lists them from `_data/tools.yml`, on the shelves of `/tools/`, so a new
  instrument joins the desk with its entry there; it must include
  `_includes/desk-embed.html` in its head. `js/desk.js` holds instances,
  `read:1` and `read:2`, and choosing an instrument brings it to that
  place without touching the other. An instance put away stays alive
  while the desk is open, and choosing its instrument again in that place
  returns to it. The layout keeps the instances (`order`); a layout that
  named instruments alone, as before, reads as their first instances.
- **Neither moves the other.** A second instance is opened with `pane=2`,
  and `_includes/desk-embed.html` gives it `OLAE_DESK_EMBED.key()`, which
  adds `-2` to every key it keeps. On the desk an instrument keeps its work
  under `olae-desk-<name>-v1`, apart from its own page, as The Page and The
  Draw always did; The Reader keeps its places and type size. The first
  instance keeps the keys the desk always had, so nothing kept before is
  lost. PDF zoom and the page shown live in each pane. The resizing, the
  controls and the phone layout are as they were.
  `scripts/test-desk.cjs` checks the desk and every instrument on it.
- **A pane put away stops its sound.** The Noise stops playing and a
  running script on The Prompter stops; the work of every instrument that
  keeps it through `_includes/storage-feedback.html` is saved as its pane
  is put away. A clock keeps its time.
- **On the desk an instrument shows its work.** Its name, its way back,
  its theme and its full screen are the desk's. A top bar left with
  nothing else to show folds away (`desk-bare`). The clock, The Noise, The
  Breath and the sky instruments keep their own light on the desk
  (`data-own-theme` on their `<html>`); the others follow the desk's.
- **A pane scrolls only itself.** `scrollIntoView` inside a pane also
  scrolls The Desk around it: in full screen a PDF page turned with the
  arrows moved the whole desk and brought its notes into view, as the
  author found on 13 October 2026. The Reader's page turns and its
  contents scroll their own window (`toTop` in `js/reader-pdf.js`). Use
  `window.scrollTo` inside an instrument, never `scrollIntoView`.

## The instruments and the drawer

- **Every instrument that holds work can keep it.** The author asked on
  13 October 2026 for "Keep in your drawer" and "Open your drawer" beside
  every download, and then for the same on The Prompter, The Lots, The
  List, The Clean and The Diff. `js/tool-drawer.js` and
  `css/tool-drawer.css` put a drawer button among the instrument's own
  buttons, beside the download where there is one, and a small box under
  it with both. The download stays one click. The instrument says what it
  holds in `window.OLAE_TOOL_WORK`, described at the top of the script.
  Inside The Desk the drawer opens in the whole window.
- **What is kept.** The Page keeps its page, The Prompter its script, The
  List and The Clean their text, The Lots its names, one to a line, or,
  while groups are shown, each group under its name. The Diff keeps its
  comparison as plain text, removed words in `[- -]` and added words in
  `{+ +}`, with both drafts after it, and the drafts apart as well
  (`drafts`). Each goes into the drawer's record whole, up to 200,000
  characters, under an id that begins with its own word (`WORKS` in
  `js/keep.js`). The Draw keeps the PNG its download gives, in this
  browser's IndexedDB (`olae-drawer-files`) under its record's `drawing-`
  id. If storage has no room, the drawer stays as it was and the
  instrument says so; it never goes on in memory, which would put the rest
  of the drawer at risk. Taking a drawing out takes its picture, and The
  House clears away a picture whose record has gone.
- **Keeping again brings the same copy up to date.** The script remembers
  the copy each instrument was kept as (`olae-tool-kept`), one entry for
  each instrument and each place on The Desk. An emptied instrument lets
  go of it, and the next thing is kept on its own; Undo after Clear takes
  hold of it again. A list that arrives on The Lots in a shared link is
  not the kept copy.
- **Back from the drawer.** "Continue on The Page" and "Open in The
  Prompter", The Lots, The List, The Clean and The Diff lead to
  `?from=drawer&open=<id>`, with the drawer's address in `back=`, and the
  instrument takes the kept thing back.
  What was there goes into the drawer first, unless it is there already as
  it is, so nothing is lost. It goes into the copy it was kept as, unless
  that is the very copy coming back; then it is kept on its own, since a
  page written over without being emptied is still linked to its copy.
  If the drawer has no room for it, nothing changes. The Lots puts back
  its groups as they were. A drawing stays in the drawer, since its
  strokes are not kept.
- **In the drawer** text shows its opening, with the whole of it under the
  site's chevron, and a drawing shows its picture. Each has its way back,
  "Download as text" or "Download as PNG", named after the day it was
  kept, and Remove, which asks twice because the work is the reader's own.
  None has a note or a card. The backup carries the pictures beside the
  records (`pictures`), and the text download and the printed drawer carry
  the whole text.
- **The Reader keeps passages.** Its text (`#reading`) carries
  `data-keep-passage`, so a selection there offers Keep, Note and
  Highlight, as on the essays, in the Reader's own colours. A passage is
  kept under The Reader and named by the file's title. A highlight is
  found again by its words when the same file is opened again. Only the
  passages the reader chooses are kept; the file itself never is. A
  passage from the reader's own file has no address and no card, and the
  drawer leads to "Open The Reader".
- **The way back names the instrument.** "Open your drawer" carries
  `from=` with the instrument's name, or `from=desk`, and `back=` with
  its own address, so the instrument's way back is kept too. The drawer
  then begins with "← Back to The Page", The Lots, The Reader or The Desk.
- On a phone the masthead of The Draw and The Lots takes its own line, as
  The Page's does, so their third button never crowds it. `sw.js`
  precaches the drawer's scripts and styles for the instruments, and
  `scripts/test-instrument-drawer.cjs` checks all of this.

## The way back from an instrument

- **The way back follows how an instrument was opened.** A link from the
  study to an instrument carries `from=house`, preserving any other query
  parameters. Its back link says "the study" and returns to `/house/#study`.
  A link from the balcony carries `from=balcony`; its back link says "the
  balcony" and returns to `/house/#balcony`. The author asked on 11 October
  2026 that the way back name the room it returns to. The link to The Page
  beside a note in the drawer carries `from=drawer` with the drawer's
  address, and its back link says "your drawer" and returns to the drawer
  as it was. Beside a note on a page it names that page (see The way back in `_agents/reading.md`).
  Other entries keep the link to Instruments. `_includes/tool-back.html`
  provides this behavior on every instrument. Keep the origin in the URL so
  reloading preserves it and separate visits stay independent. House links
  also carry `v` to load updated pages through the service worker's cache.
  A picture returns to Pictures with Stories, or to the balcony when its sky
  opened it with `from=balcony` (`js/pictures.js`).
