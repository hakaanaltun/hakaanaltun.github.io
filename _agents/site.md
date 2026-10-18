# The site's frame, type and interface

Notes on how to build and change the site's frame, type and interface, for
the sessions that work on it. The rules a reader could read, with their
reasons, are in `COLOPHON.md`; a note here marked "(rule in
`COLOPHON.md`)" carries out a rule written there.

## The visit counter (rule in `COLOPHON.md`)

- GoatCounter is loaded in `_layouts/default.html`.

## Prose and punctuation, as the build carries them

- **Close up em dashes** (rule in `COLOPHON.md`). The spaced separator in
  page titles is deliberate and explained in `_includes/head.html`.
- The build puts an invisible word joiner before each closed-up dash
  (`_plugins/dash_join.rb`), so the dash stays with the word before it and
  never opens a line. Write the plain dash in the sources.
- Text a script writes is out of the build's reach, so the script joins its
  own dashes as it shows them: trivia notes, the homepage's question, The
  House, search results, the series line and the instruments' messages. A
  new script that writes prose does the same. What a script keeps or
  compares drops the joiner (`js/keep.js`, `js/book-resume.js`,
  `js/reader-translate.js` and the search). A short script the build adds
  to every page keeps it out of anything a reader copies and leaves the
  rest of the copy to the browser.
- **Quotation marks and apostrophes are curly** (rule in `COLOPHON.md`).
  The build curls only what passes through Markdown, such as the body of a
  word story. HTML, front matter, `_data` and scripts are shown as they
  are written, and that is where straight marks have reached the page.
  `scripts/test-content.cjs` fails on a straight mark against a letter on
  a built page, in its titles, alt text, labels and descriptions, and in
  the JSON the site’s scripts show. Text written inside a script is out of
  its reach and is checked by eye.
- **The site’s ampersand is Cormorant Garamond Italic** (rule in
  `COLOPHON.md`). `css/fonts.css` gives italic EB Garamond and upright
  Cormorant Garamond their & from Cormorant Garamond Italic, so nothing
  needs to be done in italic text or in the display face. A title or label
  set in upright EB Garamond, such as “SEEING & LIGHT” above a word, wraps
  its & in `<span class="amp">&amp;</span>`, and the page’s styles give
  `.amp` the italic display face. The small sans-serif labels and the
  sources under a word’s story do the same. A new face on the site gets
  the same treatment in `css/fonts.css`.

## The site's header and footer

- **Every page that is read or browsed carries them** (rule in
  `COLOPHON.md`). They come from `_layouts/default.html`, and a new page
  of this kind uses it.
- **A new place takes its family's frame.** A new instrument takes the
  instruments' bar and a new picture the picture layout. Woodland paths or
  a river reached from the farm's garden are scenes of the Farm House and
  keep its frame; they do not become pages of their own.
- **The House in the header goes straight to the door.** From
  13 October 2026 a pointer over The House, a click on its name or the
  chevron beside it opened a small menu with "To the door" and "Your
  drawer". On 17 October 2026 the author took the menu out of the header,
  since it made the way into The House two clicks. The site's menu keeps
  both under The House, which opens like its other sections; it is the
  one place the drawer is named on every page, and the footer's icon
  opens it too. Do not put the drawer back in the header unless the
  author asks.
- **Series and Book are inside Writing.** The author took them out of the
  header's strip on 15 October 2026, when the header felt crowded, and the
  strip has nine links now. Writing's page has a section for each, after
  Essays, and they lead to `/series/` and `/book/`, whose addresses stay as
  they were. The site's menu keeps Series and Book as sections of their
  own, since it carries the whole list. On their pages the strip marks
  Writing as the section the reader is in.
- **Writing's sections also stand at the right edge.** The author asked on
  15 October 2026 for the book's Contents panel on Writing, so that Short
  Fiction can be reached from the foot of the page. The row of section
  names under the title stays. The panel is the book's own
  (`.book-chapters` and `js/book-chapters.js`), and `side_contents: true`
  in a page's front matter loads its script. `.side-contents` hangs its tab
  below the masthead and ends the frame where its list ends; a word's
  collection uses it too (see Words with Stories collections). The author
  asked the same day for it on Series, which has two series for now, so
  that the page is ready when more come. A new series takes its place in
  both the row and the panel.
- **The arrow after a link in the site's menu hangs.** It stands 6px past
  the last word and takes no room in the line, so every linked line sits
  on the panel's centre with the section names and the cards. Counted in
  the line, it pulled each one 11px to the left, and the author saw it
  under The House, where "Your drawer" has no arrow.
- **The footer carries the drawer.** Its icon, the same chest the
  instruments' own drawer button shows, as tall as the instruments' four
  squares, stands beside the instruments' and
  opens the drawer over the page; without the script it leads to
  `/house/#drawer`. The author asked for this on 13 October 2026, when the
  drawer had come to matter across the site, and asked the same day for
  the instruments a sign that says what they are for. A viewfinder round a
  point in focus read as a camera, a pair of compasses felt chosen rather
  than natural, and a pencil, a ruler and compasses in a frame could not
  be seen from a distance, so the instruments kept their four squares.
  The controls run in this order, as the author asked the same day: the
  theme, the instruments, the drawer, and sharing.
- **Rain and snow stand above the site's name.** The footer's snowflake
  and drop stand centred just above "On Life & Everything", as the author
  asked on 15 October 2026; until then they stood under the credit line.
  Their buttons keep their full 44px, and `.footer-bottom .footer-weather`
  in `css/style.css` brings them close to the name.

## The homepage

- **Slate and green take turns down the page.** Every homepage section is
  named in one of the two accent lists in `css/style.css` ("Homepage accent
  rhythm"). A new section takes the color its place calls for, and every
  section after it moves to the other list. `scripts/test-pictures.cjs`
  fails when a section is missing from the lists or two neighbors share a
  color.
- **The House keeps its own line.** After "First time here?" and its three
  doors, the homepage says "Another way in." and leads to The House.
  Folding it into the three doors was considered on 14 October 2026, and
  the author kept it as it is: the header and the site's menu already lead
  there.
- **The book stands between "Another way in." and Further back.** The
  author asked for it on 18 October 2026. The book is newer than everything
  under Further back, so it comes after the latest pieces and before the
  older ones. It shows the cover, the book's description in full, the two
  parts that can be read here and one line on to `/book/`
  (`_includes/book-home.html`). The description is kept once, in
  `_includes/book-description.html`, which the book's page uses too, so the
  two never differ. Here each paragraph is a panel and the reader moves
  through them, so the full text takes the height of one. Where to buy the
  book stays on its own page: the homepage offers it to be read.

## Search

- **Some places stay out of search** (rule in `COLOPHON.md`).
  `search-index.json` gathers the writing, the word stories, the
  standalone pictures, the instruments, each quiz by its rounds, the notes
  and the pages in the site's frame. Besides the quizzes:
  - Through the Solar System waits until its new paintings and journey
    are finished. Then look at it again: a result for each scene, at
    `/pictures/space/#scene-<id>`, which opens that scene, would take a
    search for Jupiter or Voyager straight there.
  - The Farm House stays out. It is entered only from the study, and its
    story is found in the rooms.

## Interface details

- **A picture never dims when it is chosen** (rule in `COLOPHON.md`). A
  pointer over a link that carries a picture and words dims the words by
  `--select-dim`. A picture that is a link on its own, with no words,
  answers in its own way: Moris's gallery cover grows a little, the Farm
  House's photograph straightens, and Tonight's sky on the homepage draws
  a faint ring around itself. The sky dimmed like a link until the author
  asked on 17 October 2026 for it to be treated as a picture.
  `scripts/test-hover.cjs` fails on any rule that dims a picture, a drawn
  one included.
- **A picture inside a card is named by the card's words** (rule in
  `COLOPHON.md`). `scripts/test-content.cjs` holds the built pages and the
  scripts that build cards (`js/more-essays.js`, `js/series-nav.js`,
  `js/cafe-nav.js`) to it.
- **A pointer draws no line** (rule in `COLOPHON.md`). The frames and
  instruments that load their own stylesheet carry the same dim
  themselves, with 0.95 for readers who ask for more contrast.
  `scripts/test-hover.cjs` fails on a rule that draws a line under a
  pointer outside running text.
- **A window is a native dialog.** The House's boxes, the drawer, the
  farm's details, the pictures' close views and Moris's gallery open with
  `showModal()`, so the page behind them is inert and Escape closes them.
  Moris's gallery was the last to move, on 14 October 2026: until then
  focus stayed on its cover, behind the dark, and Tab went on through the
  page.
- **A disclosure uses the site's chevron.** It is the one in the drawer
  and on a piece's reading options. Its words sit where
  the layout puts them; the chevron hangs beside them and does not pull them
  off their line.
