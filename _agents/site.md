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
- **The strip's names stand a step back from the site's name, in tone
  alone.** On 24 October 2026, with every word in the header the same
  yellow, the author found the strip under the name reading as part of
  it, and asked for The House, Writing and the rest to look like "The
  Fragments · Part I" (`.book-part-kicker`): .98rem, in `--footer-text` at
  85%, in that line's italic. The italic put the site off balance and was
  taken out, and upright the names came up to 1.04rem. Later the same day
  the author found the strip too small and asked for its 1.10rem back,
  keeping only the tone: 85% of `--footer-text`. The footer's credit line
  ("Hakan Altun · İstanbul … All rights reserved"), the one line under the
  name there, takes the same step at the 0.95rem it always had. The step
  is written into the colour with `color-mix()` rather than as opacity, so
  a pointer dims from it like any control that rests faint and the focus
  ring keeps full ink. It holds 4.5:1 on the chrome in every theme; the
  first light palette was the closest, at 4.77:1, while the words were
  yellow. Since they are white the closest is Follow the sky's dawn, at
  5.0:1, and among the palettes Ochre, at 6.3:1. Do not set the strip,
  the menu or the credit in italic unless the author asks.
- **The site's menu names its sections in 13px spaced capitals.** On
  24 October 2026 the author asked for the menu's section names
  (`.drawer-label` and `.drawer-section-links a`) to follow the header in
  title case, and they stood in upright EB Garamond at 1.1rem for an
  afternoon. The author found them too small and asked for the capitals
  back the same day.
- **The row of sections on Writing and Series is in spaced capitals.**
  The author asked on 24 October 2026 for `.work-jump` ("Short Fiction ·
  Essays · Series · Book" and "The Corner · The On Series") to leave its
  spaced capitals for title case, at .98rem and upright, and later the
  same day asked for the capitals back.
- **Rain and snow stand above the site's name.** The footer's snowflake
  and drop stand centred just above "On Life & Everything", as the author
  asked on 15 October 2026; until then they stood under the credit line.
  Their buttons keep their full 44px, and `.footer-bottom .footer-weather`
  in `css/style.css` brings them close to the name.

## Themes

- **White daytime frame, 26 October 2026** (rule in `COLOPHON.md`).
  This supersedes the older colour notes below. `chromeAt()` now returns
  white throughout the day; `site-sky.html` uses slate `#283444` words by
  day and keeps white at night. Light (palette 1, White & Slate) uses the
  same daytime colours in `css/palettes.css`, scoped away from other
  palettes and from the sky. Ash & Gold keeps its original tokens.
  The preview in `js/palettes.js`, browser colour in `head.html`, and
  manifest follow the new face. Identity assets retain their glyph and
  use slate on white. The House continues to use its own colours.

- **Follow the sky is the default** (rule in `COLOPHON.md`). A reader
  who has chosen nothing gets Follow the sky, and "system" follows the
  device's light or dark (`_includes/head.html`, `js/theme.js`). A page
  outside the default layout that reads the theme itself does the same:
  the door to Part III (`story/9r2m.html`) and the instruments
  (`_includes/page-sky.html`). The door learned it on 23 October 2026,
  two days late, after a reader on the default had come to it from a
  night-blue page and found it white. Light was the default for a few
  hours on 25 October 2026; a reader who chose it then keeps it.
- **Follow the sky has a day and a night.** On 23 October 2026 the author
  found the sky's daytime slate too dark, and asked for a light day in a
  new series: Fog and Blueprint, and in place of Pudra a colour near them.
  Light ink holds the site's dimmest tier only on a ground about as dark
  as that slate, so the theme now turns at sunrise and at sunset
  (`SUNRISE` in `_includes/sky-ramp.html`, the sun at 0°). The day's
  papers are kept there too (`DAY`), for the site and the instruments,
  with their inks, rules and chrome. On 24 October 2026 the author asked
  for the day to be one light slate in the evening's hue: its darkest
  light shade at sunrise, nearly white at noon, and darker again until
  sunset, where the evening's slate takes over. It had been a warm stone,
  Fog and Blueprint since the day before. On 25 October 2026 the author
  asked for noon to be white itself (`#FFFFFF`, the last `DAY` stop), with
  the band, the card and the rules a step off it in the slate's hue.
  Where the paper is darkest the ink is darkest too, near-black, as the
  author asked, so every tier
  keeps the day's floors; the header and footer are the evening's header
  all day, so they carry across sunset unchanged. Their words were a cool
  grey at first, and the author found them dull and asked the same day
  for a little more yellow: a warm gold near the site's own header, still
  7:1 and 4.5:1 on the chrome. Seeing it on the site, the author asked
  for every word there to be the yellow of "On Life & Everything", with
  no second tone: the header and footer need no distinction of colour,
  and that yellow brings the light the site needs. The tagline, the
  menu's links and the footer's credit wear it too. Later that day the
  author asked for the header's strip and the footer's credit to stand a
  step back from the name, at 85% of that yellow (see The site's header
  and footer), and then found the yellow itself too full and asked for a
  little white in it: `#F8EBC2` with 25% white, `#FAF0D1`, 7.6:1 on the
  chrome. On 25 October 2026 the author asked for those words to follow
  the sky, by night as well as by day (`wordsAt()` in
  `_includes/sky-ramp.html`): the full `#F8EBC2` while the night is at
  its darkest, white mixed in as the sky opens and back as slowly. Later
  that day the author set the amounts: 40% white at sunrise and sunset,
  70% at noon, none at the darkest of the night. By night they had been the night's light ink. The ink still turns at
  sunset, from the darkest light slate to the evening's slate. The way is
  measured along the sun's arc, from where it rises to the day's own
  noon (`arcShare()`), so the paper moves through the whole day in every
  season. Until the author asked on 23 October for every hour to move,
  the noon paper began at 35° and the summer sun sat under it for eight
  hours; it was then measured by the sun's height, which hardly changes
  for the hour round noon, and the paper stood still there for over an
  hour. The author asked on 24 October for it to change with
  the sun every minute: along the arc it holds still for a few minutes at
  most, which is as fine as a screen's shades allow. By day the site's painter
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

- **Follow the sky since 25 October 2026** (rule in `COLOPHON.md`). This
  supersedes the moving day, the evening and the accents' white described
  above, which are kept as the record of what was tried. By day `DAY` in
  `_includes/sky-ramp.html` is one white paper, and only the chrome
  moves, `chromeAt(prog)`, from `CHROME_DAWN` to `CHROME_DUSK` along
  `dayProgress()` (0 at sunrise, 1 at sunset); the header's and
  footer's words are white, by night as well since later that day
  (`_includes/site-sky.html`): the author asked for no yellow there at
  all. By night `nightAt()` is the ramp at no higher than `NIGHT_TOP`
  (-6°), so the page is navy from sunset; `evening()`, `EVENING_ENDS`
  and `SLATE` are gone. The accents have no white (`--sky-accent-white`
  is gone), and `--sky-ld-floor` was raised to keep 4.6:1 on the cards
  without it. `wordsAt()` stays for The House alone.

- **The header's and footer's words are white, except on Midnight**
  (rule in `COLOPHON.md`). `--footer-text` and `--footer-muted` are
  `#FFFFFF` in `:root` (Ash & White, palette 1), in both dark blocks of
  `css/style.css`, in every palette's two blocks in `css/palettes.css` and
  in the `/themes/` mocks in `js/palettes.js`, and `--header-border` is
  white at the alpha each theme had. Midnight's block keeps `#DCD1AC`.
  Palette 13, Ash & Gold, is `:root` with the gold words it wore until
  then (`#DCD1AC`, `#C6B98F` and a gold border); it needs only those three
  tokens, `--sec-l` and its chrome in the three places the palettes keep
  it (`css/palettes.css`, the table in `_includes/head.html` and `CHROME`
  in `js/palettes.js`). Earlier notes and comments that name Ash & Gold
  as the site's own face mean what is now Ash & White.
  The House's rooms still paint their own words (`js/house.js`).
- **The site's mark is white on `#283444`** (rule in `COLOPHON.md`), the
  sky's `CHROME_DUSK`: `on-icon.svg`, the favicons, the home-screen
  icons, `og-image-on-card.png` and the manifest's `theme_color`. The
  PNGs and the ICO were recoloured from the gold-on-`#444A4E` set pixel
  by pixel, so the glyph and its edges are unchanged. A new stamp on
  their `?v=` makes browsers and link previews take the new ones. The
  instruments' own cards in `images/og/` keep each instrument's face.

- **The House's rooms wear their own colours** (rule in `COLOPHON.md`).
  While the study or the balcony is open, `data-house-theme` on `<html>`
  hands the page to the tokens in `css/house.css`, whatever theme the
  reader chose, and `_includes/site-sky.html` leaves the `theme-color`
  metas to The House (`_agents/house.md`). A new theme token needs a value
  there too, or it will show the site's theme inside the rooms.

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
  "First time here?" in the teal, and Instruments in a bluer petrol. Notes, Words
  and Pictures had no color before that day and fell to the rose, and The
  House with them; each page now names its voice with `series:` in its
  front matter (Words through `_config.yml` for the word pages and
  collections). A new section takes the voice of the page it leads to. Two
  neighbors may not share a color; if a new section would stand next to
  its own color, ask the author before choosing another.
  `scripts/test-pictures.cjs` fails on a section with no voice or next to
  its own color. Each section builds its accent from its voice in every
  theme; Midnight uses gold for every section. A voice may sit a step darker by
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
  rule is exclusive to Follow the sky's night. On 25 October 2026 the
  author asked for the white to open with the night as the header's words
  do: 12% at the darkest of the night, rising to 40% at sunset and sunrise
  (`accentWhiteAt()` in `_includes/sky-ramp.html`, painted as
  `--sky-accent-white`). Day was left out: the accents print dark on light
  paper, and 40% white would bring them to 2.4:1. By day the accents print
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
  themes use lightness 0.780 and chroma 0.010. On 25 October 2026 the
  author asked for a little navy in that grey by day and none by night:
  the day's chroma went to 0.024 at the same hue, so Latest, Further
  back, the menu and the pieces' titles lean blue on paper, and the
  silver of the dark themes and of the sky's night is as it was. A
  stronger navy (hue 258, 0.032, by night as well) was tried first. Notes
  then stood under Further back in the same colour, and the author asked
  for a soft colour for Notes that sits well with the others: a clay,
  hue 40, on the warm side that no other voice uses. A rose and a mauve
  were tried and read as the plum of Words below it. On Writing the Book
  band speaks in the book's blue (`.book-voice`, which builds its own
  accent as a homepage section does), as the author asked the same day.
  Later that day the author asked for the book to wear its own colour
  wherever it appears: the titles of Part I and Part II in that band, and
  the book's door under "First time here?" on the homepage, now carry it
  too (the door gave it up on 25 October; see below). On 25 October 2026
  the author asked for Writing to keep its own colour throughout, the
  book's band included, and `.book-voice` was taken out. The site's menu still takes the colour of the page it
  opens on (see The site's header and footer). After that change was merged, the author pointed out that Latest
  and Further back belong to the homepage rather than to a section page,
  and then asked for the homepage itself to take the writing's graphite,
  so that the two are one: Latest, Further back, the titles of their
  pieces and "First time here?" all wear it. On Midnight the author then
  asked for every section to be gold, the writing too, so that Midnight
  differs from the other themes; the silver Notes and then the writing wore
  there is gone. Every
  page without a voice of its own already spoke in the writing's, and the
  homepage was the last one left in the teal. On 25 October 2026 the
  author asked for the teal back on "First time here?", The Fragments
  under it included, so that the colour belongs to that section alone:
  `body.is-home #start-here` is the one voice written for a homepage
  section rather than a page, and its swatch on `/themes/` is listed by
  that id.
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
  House's photograph straightens, Tonight's sky on the homepage draws
  a faint ring around itself, and the moon under a piece comes up to full.
  The colour swatches on The Clock and The Draw grow a little, and the
  Pale Blue Dot in the journey, a photograph that is its own button, keeps
  its weight. The sky dimmed like a link until the author asked on
  17 October 2026 for it to be treated as a picture.
  `scripts/test-hover.cjs` fails on any rule that dims a picture, a drawn
  one included.
- **A picture inside a card is named by the card's words** (rule in
  `COLOPHON.md`). `scripts/test-content.cjs` holds the built pages and the
  scripts that build cards (`js/more-essays.js`, `js/series-nav.js`,
  `js/cafe-nav.js`) to it.
- **A pointer draws no line** (rule in `COLOPHON.md`).
  `scripts/test-hover.cjs` fails on a rule that draws a line under a
  pointer. The note about Part III has no line
  under its links at rest either, on the book's page and at the end of
  Part II. The book page's never had one; the author asked on
  18 October 2026 for Part II's to match it. They keep the accent and dim
  under a pointer.
- **A pointer dims what it is over, everywhere** (rule in `COLOPHON.md`).
  On 24 October 2026 the author found two links that did nothing, the
  quote's source at the top of the homepage and the book's title beside
  its cover. A pointer moved over every kind of link and button on the
  built site that day found nine more in the site's frame that did
  nothing, and the frames and instruments answering in their own ways:
  the instruments brightened to full ink and darkened their borders, the
  journey and the farm left most of their controls silent, and the
  reading options, "read with rain", the theme menu and the subscribe
  button took on a colour. The author asked for one answer everywhere.
  - On the site's pages each rule says it with `--select-dim`. A control
    that rests faint dims from there, as the quote's arrows do with
    `calc(0.55 * var(--select-dim))`: so do a note's date, the footer's
    snow and rain and The House's, a word's ‹ ›, the search's clear
    button and the PDF's side arrows. Keyboard focus still brings
    them up to full; the dim is for a pointer only. A state stays a state:
    "read with rain" while it rains and open reading options keep the
    accent, and dim under a pointer like the rest.
  - The House's boxes, the drawer and the rooms, dim everything that can
    be chosen in them with one rule in `css/drawer.css`.
  - Each instrument ends its own `<style>` with the same block: it sets
    `--select-dim` (0.95 when more contrast is asked for), gives links,
    buttons, `summary`, `select` and date fields a 0.2s fade through
    `:where()`, and dims them under a pointer, leaving disabled buttons
    and colour swatches alone. The Page's style buttons rest faint and dim
    from there. The Sun and The Stars carry it in `css/window-sky.css`,
    The Desk in `css/desk.css`, the journey at the end of
    `css/space-journey.css` and the Farm House in its own styles. A new
    instrument takes the block with the rest of the instruments' bar.
  - What comes into view when a pointer comes near is not an answer and
    stays: the names of the places in a picture, the quote's arrows when
    the quote is pointed at, the words under the footer's signs, puzzle
    mode's folded panel and the book page's dot.
  - `scripts/test-hover.cjs` fails on a rule under `:hover` or `:active`
    that sets anything but a dim, and names the pictures and the things
    that come into view that answer in their own way. Text a script
    writes into a `<style>` is out of its reach: `js/reader-translate.js`
    dims its own buttons.
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
