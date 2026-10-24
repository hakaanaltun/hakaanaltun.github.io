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

## The fonts

- **The latin-ext files are cut down.** Since 23 October 2026 each holds
  the European letters, the dotted letters of transliteration, the
  currency signs, † and ℓ, and its `unicode-range` in `css/fonts.css`
  names exactly that. The note at the top of that file says why and how to
  cut a new one. A letter the site starts to use outside that range falls
  back to Georgia: widen the range and the file together, never the range
  alone.

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
  since it made the way into The House two clicks. On 19 October 2026
  the site's left menu was simplified to a direct /house/ link too.
  The reader's drawer remains accessible at the House door and through
  the footer icon. Do not restore a House submenu unless the author asks.
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
- **The menu inherits the color of the page it opens on.** The author
  restored this on 20 October 2026. Homepage sections keep their own colors;
  menu headings and links use the page’s `--petrol` in every theme.
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

## Themes

- **Follow the sky is the default.** Since 21 October 2026 a reader who
  has chosen nothing gets Follow the sky, and "system" follows the
  device's light or dark (`_includes/head.html`, `js/theme.js`). A page
  outside the default layout that reads the theme itself does the same:
  the door to Part III (`story/9r2m.html`) learned it on 23 October 2026,
  two days late, after a reader on the default had come to it from a
  night-blue page and found it white.
- **Follow the sky has a day and a night.** On 23 October 2026 the author
  found the sky's daytime slate too dark, and asked for a light day in a
  new series: Fog and Blueprint, and in place of Pudra a colour near them.
  Light ink holds the site's dimmest tier only on a ground about as dark
  as that slate, so the theme now turns at sunrise and at sunset
  (`SUNRISE` in `_includes/sky-ramp.html`, the sun at 0°). The day's
  papers are kept there too (`DAY`), for the site and the instruments:
  a warm stone at the horizon, Fog a third of the way to noon and
  Blueprint at noon, with their inks, rules and chrome. The way is
  measured against the day's own noon (`noonAltitude()`), so the paper
  moves through the whole day in every season; until the author asked
  that evening for every hour to move, Blueprint began at 35° and the
  summer sun sat under it for eight hours. By day the site's painter
  (`_includes/site-sky.html`) sets `data-theme="light"` and
  `data-sky="day"`, so every light-path rule applies.
  `css/palettes.css` leaves a stored palette alone while `data-sky` is on
  and hands the day's chrome to `<body>`. The night is the ramp as it
  was, `data-theme="sky"` and `data-sky="night"`, and whatever a page
  draws differently on Dark and Midnight, a shadow above all, it draws
  the same way there: the notes on `/notes/` cast the dark themes' shadow
  by night since 23 October 2026. The same day the author asked for the
  instruments to follow the same two halves (`_agents/instruments.md`),
  and then for an evening: the night came down too soon after sunset, so
  at sunset the night is the slate the day used to be, and it darkens with
  the sinking sun until it is the night at 21:00 on the reader's own
  clock (`EVENING_ENDS`, `evening()` and `nightAt()` in
  `_includes/sky-ramp.html`). The author first asked for 22:00, then for
  21:00, and then, finding a slate that held still until half past eight,
  for it to darken all evening. The slate holds the ramp's floors on the
  sheet, and the accents keep 5.1:1. Only the darkest of the night stays
  still. The ink cannot move gradually: it turns at sunrise and sunset,
  and those two moments stay sudden.
  `?hour=13` on any page that follows the sky, the instruments included,
  stands the sun where it will be at that hour today, so each half can be
  looked at. `scripts/test-window-sky.cjs` checks the turn and both
  halves' contrast, on the site and on The List.

## The homepage

- **Each section is shown in its own page's color.** The author asked for
  this on 19 October 2026, in place of the slate and green that took turns
  down the page. Every homepage section is named in one of the voices in
  `css/style.css` ("Section identity"), the one its section's page speaks
  in: Latest and Further back in the writing's graphite, the book in its blue,
  The Notice in a deep indigo (an ivy green and then a wine red from the
  evening of 19 October 2026, while it stood beside the book's blue, until
  the author moved it under Latest on 20 October 2026 and asked for the
  indigo again), The House in Moris's near-black green,
  Notes in a soft clay,
  Words with Stories in plum,
  Pictures with Stories and Tonight in slate, Trivia in leaf green,
  "First time here?" in the writing's graphite, which is the homepage's own,
  and Instruments in a bluer petrol. Notes, Words
  and Pictures had no color before that day and fell to the rose, and The
  House with them; each page now names its voice with `series:` in its
  front matter (Words through `_config.yml` for the word pages and
  collections). A new section takes the voice of the page it leads to. Two
  neighbors may not share a color; if a new section would stand next to
  its own color, ask the author before choosing another.
  `scripts/test-pictures.cjs` fails on a section with no voice or next to
  its own color. Each section builds its accent from its voice in every
  theme; Midnight uses gold except for the writing’s silver. A voice may sit a step darker by
  day with `--sec-dl`, as the fiction's indigo and the green of Moris and
  The House do; the author asked for them to change color on 19 October
  2026, when the amber and the olive looked muddy on paper.
- **Follow the sky uses one accent standard.** On 22 October 2026 the
  author extended the writing’s shared tone to every section. Each section
  uses the shared sky contrast floor with its own hue, chroma and minimum
  lightness, then mixes the base with 12% white once. Both accent tokens use
  that result, so section headings, card titles, links and page titles agree
  on the homepage and section pages. Writing uses soft silver (hue 250,
  chroma 0.010, minimum lightness 0.780) and Notes a soft clay (hue 40,
  chroma 0.050, lightness 0.780). The shared floor follows the final mixed colors,
  retaining contrast above 4.5:1 across the night ramp, including the hero. The
  theme preview applies the same floor, mix and current section hues. This
  rule is exclusive to Follow the sky's night. By day the accents print
  as on the light palettes, from a `--sec-l` the day's stops carry (0.480,
  0.495 and 0.490), each a little under the palette's own, so the colours
  between the stops still clear 4.5:1 on the band.
- **Writing and Notes keep the same identities across themes.** On 22 October
  2026 the author extended the change to every theme: writing shared First
  time here’s teal profile. On 23 October the author changed Notes to
  graphite on light palettes and soft silver on Dark, Midnight and Follow
  the sky. On 24 October the author asked for the writing to take that
  colour instead, its headings on Writing with it, as a trial. Light
  palettes use their own lightness with chroma 0.012 and hue 250; dark
  themes use lightness 0.780 and chroma 0.010. Midnight keeps the silver
  for the writing and gold for every other section, Notes included. Notes
  then stood under Further back in the same colour, and the author asked
  for a soft colour for Notes that sits well with the others: a clay,
  hue 40, on the warm side that no other voice uses. A rose and a mauve
  were tried and read as the plum of Words below it. On Writing the Book
  band speaks in the book's blue (`.all-work-band#book`, which builds its
  own accent as a homepage section does), as the author asked the same
  day. After that change was merged, the author pointed out that Latest
  and Further back belong to the homepage rather than to a section page,
  and then asked for the homepage itself to take the writing's graphite,
  so that the two are one: Latest, Further back, the titles of their
  pieces and "First time here?" all wear it. On Midnight the author asked
  for the homepage to keep the gold, and the writing alone is silver. Every
  page without a voice of its own already spoke in the writing's, and the
  homepage was the last one left in the teal, which no section wears
  now.
- **The night opens towards the horizon.** The shared ramp keeps its
  night stops through -6 degrees and turns grey-violet as the sun nears
  the horizon, where the day takes over; in the evening the slate stands
  in for it until nine. Body ink stays above 6.5:1 and muted ink above
  5.5:1. Until 23 October 2026 the ramp ran on to 40 degrees into that
  slate. The House's illustrated lighting is independent of this ramp.
- **The green family has three distinct roles.** On 20 October 2026 the
  author approved a shaded forest green for The House and Moris, a brighter
  leaf green for Trivia, and a bluer petrol for Instruments. Their homepage
  headings and links use the same accents as their section pages. Long
  descriptions retain the shared text color. Midnight keeps its single gold.
- **A quote takes the color of the page it comes from.** The quotes at the
  top are from the book and from the pieces. The script marks `#quotes`
  with `data-voice="writing"`, or `"story"` for The Notice, and a quote
  from the book leaves it unmarked, in the book's blue. The source line
  changes color while it fades. Every theme uses the section accent for
  the source and its italic title, including on devices set to dark.
- **Latest opens the homepage, and The Notice follows it.** The order is
  the quotes, Latest, The Notice, "First time here?", "Another way in.",
  the book, Further back, as the author set it on 20 October 2026. On the
  morning of 19 October a walk through the homepage on a phone had found
  "First time here?" three and a half screens down, under the six large
  cards of Latest, and it was moved to the top; that evening the author put
  the work first again, with The Notice just above the book, and Latest and
  Further back came down to three cards each on a phone. On 20 October the
  author asked for four of each, held either way (`nth-child(n+5)` in
  `css/style.css`; a phone held sideways shows them two by two), and for
  The Notice just under Latest, in its indigo. "Another way in." stays
  with "First time here?", since it answers "Three doors in."
- **The House keeps its own line.** After "First time here?" and its three
  doors, the homepage says "Another way in." and leads to The House.
  Folding it into the three doors was considered on 14 October 2026, and
  the author kept it as it is: the header and the site's menu already lead
  there.
- **The book stands just before Further back.** The author asked for it
  on 18 October 2026, between "Another way in." and Further back, which
  then followed Latest; on 19 October The Notice stood just above it for a
  day. The book is newer than everything under
  Further back, so it comes after the latest pieces and before the older
  ones. It shows the cover, the book's description in full, the two
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
  - Through the Solar System is searchable by its sourced notes, with results
    opening the relevant world and note in the journey.
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
  pointer outside running text. The note about Part III has no line
  under its links at rest either, on the book's page and at the end of
  Part II. The book page's never had one; the author asked on
  18 October 2026 for Part II's to match it. They keep the accent and dim
  under a pointer.
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
