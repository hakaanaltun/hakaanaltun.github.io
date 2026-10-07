# AGENTS.md

## What this is for

The aim is never money. The question behind this site is why the things that
would be good for people have not been made: why people have been steered,
why settling for less came to be accepted, why money came before feeling. The
large companies grew with people without caring about them, and they grew
because there was no alternative. This site goes the other way. It grows by
caring about the people who come to it, not by going out to reach them.

What that asks of every change:

- **Give the reader something, and take nothing they did not choose to
  give.** No tracking, no engagement tricks, nothing that pulls a reader back
  or holds them longer than they meant to stay. What a reader keeps stays
  with them: the drawer lives in their own browser. The one thing the site
  asks for, an email address for new pieces, waits quietly at the end of an
  essay and is theirs to give.
- **Never ask a reader to settle for less.** A half-made page, a drawing that
  does not work, a description that is not true: each tells the reader they
  were not worth the care. If something cannot be made well, it waits.
- **The test is the reader's first look.** Someone who opens a page should be
  drawn into it, not left wondering what this nonsense is.

## The Farm House

The Farm House is a growing fictional world where visitors can spend time
and feel close to nature. Its existing family story unfolds gradually.
Wandering and observing should be worthwhile on their own.

- **The visual set is fixed.** The seven loose watercolor illustrations restored
  on 1 October 2026 are the canonical set: `exterior-watercolor.webp`,
  `hall-watercolor.webp`, `kitchen-watercolor.webp`, `garden-watercolor.webp`,
  `stable-yard-watercolor.webp`, `stable-watercolor.webp` and
  `upstairs-watercolor.webp`, all in `farm-house/assets/`. These are the exact
  images from commit `d48a4fc`; the upstairs image also appears at the story's
  ending. Keep their finish and style unless the author explicitly requests a
  change. The original upstairs watercolor is the style reference for new
  scenes: broad brush marks, transparent washes, a limited value range,
  visible pencil, occasional unfinished edges and exposed white paper. Use
  existing scenes for objects, placement, relative scale and camera angle;
  paint new scenes from scratch in this language. Preserve important objects
  and avoid inventing decoration or copying a former render's surface detail.
- Let the story develop through occasional discoveries and small traces in
  the rooms. Give each addition time to settle. Preserve the unanswered
  questions in the existing story, including why the grandmother kept the
  letter and remained silent about it.
- Grow the house and its surroundings as connected places. The garden can
  lead to woodland paths and a river; rooms can hold traces of the past.
  Introduce the animals kept on the farm as well as wildlife in the forest.
  Plants and birds are part of the world visitors can learn to recognize.
- Complete the spring/summer setting first. For now, keep new scenes bright,
  sunlit and suggestive of spring or summer; autumn and winter views can follow.
  Keep the light natural in the watercolor scenes. Preserve believable
  differences between direct sun, veranda shade and window-lit interiors; avoid
  exaggerated yellow casts, glowing highlights and uniformly bright shadows.
- Let the natural world change with the seasons, including which birds are
  present. Keep species and seasonal appearances plausible for the setting,
  and verify natural-history information with reliable sources.
- **Visual continuity is a primary requirement.** Use established images as
  spatial references for every new view. Preserve the layout of rooms and
  the positions of doors, windows and furniture. Keep exterior landmarks
  and paths in consistent locations, with views that agree across scenes.
  A kitchen glimpsed from the hall must remain that kitchen when entered.
- The window beside the grandmother's bed looks across the grounds on the
  house's left, toward the stable and field. Its view includes part of the
  stable roof among olive trees, with cultivated land beyond.
- Compare connected scenes side by side and inspect the transition in the
  browser. Check recognizable objects as well as the overall architecture.
  Keep lighting and seasonal details consistent within a visit. Resolve
  contradictions before extending that part of the world.
- Expand in small, coherent steps. Write plain prose with correct
  punctuation; avoid ornate phrasing, rhetorical triples and unnecessary
  negative examples. Fictional details should fit the established story.

### Sound

The Farm House has an optional sound layer. It is off until the visitor
turns it on with "listen to the farm" in the footer. The choice is kept in
their browser (`olae-farm-sound`); sound left on waits for their first
click, because browsers start audio only from one. Every start and stop
fades over a second or two, and a hidden tab fades out and suspends the
audio until it returns.

- **The time of day.** Morning is sparse birdsong and a collared dove;
  midday a soft wind, with cicadas in waves and the dove now and then;
  evening crickets; night fewer crickets, slower and quieter, and a scops
  owl. The small birds and the crickets are not any one species. The dove,
  the owl and the cicadas are; the author asked for them in October 2026.
  Nothing on the page names a species.
- **Summer.** The time of day is the visitor's, but the season is the
  picture's: summer, like the scenes. The scops owl and the cicadas are
  summer sounds, and they go when autumn or winter scenes come.
- **Indoors and out.** Outdoors the sound is low. In the rooms it is lower
  still and low-passed, as if heard through the walls. The rooms are the
  hall, the kitchen, upstairs and the stable aisle, listed in the page's
  `indoors` set; a new room must be added there.
- **The horses are heard only near them**, at the author's request: faintly
  from the left in the garden, close by in the stable yard, and in the
  stable, where they share the room and are not muffled. They snort, blow
  and shift a hoof now and then, each from where it stands in the picture.
  A whinny made from oscillators was tried first and taken out in October
  2026; it did not sound like a horse. Bees cross the garden in the
  morning and at midday; they belong to the garden's own sound, which is
  told when the part of the day changes.
- **No creaks.** Synthesised floorboard creaks were tried in October 2026
  and taken out at the author's request. Do not add them back unless the
  author asks.
- **Whose time.** Unlike The House, which stays in İstanbul, the farm's
  sound follows the visitor's own sky: the browser's time zone gives a city
  through `window.OLAE_SKY` (`_includes/sky-ramp.html`), as Follow the sky
  does, and the sun's height decides. Night is the sun below −12°, or
  climbing but still below −6°; morning lasts while it climbs to half its
  noon height; evening starts once it sinks below 10° (or below 30% of the
  noon height on a short day). No location is ever asked for. Without
  `OLAE_SKY` the clock decides: morning 05–10, midday 10–18, evening
  18–22, night after that.
- **Testing.** `?hour=19` (any value from 0 to 23.99) stands the clock at
  that time today, so each part of the day can be heard at any moment. The
  sky still decides, so which hour is evening moves with the season: in
  İstanbul in early October, 8 is morning, 13 midday, 19 evening and 23
  night. It works only on the live site, so a change is heard there after
  merging; before that, publish a private preview of the built page. Never
  link to it.
- **Where things are.** `js/farm-sound-engine.js` makes the sounds and
  nothing else, like `js/rain-engine.js`, whose pink noise it borrows for
  the wind. `js/farm-sound.js` holds the toggle and the scheduling, and
  near its top the levels: `LEVEL` for indoors, outdoors and a place's own
  sound (`near`), `HOUR_LEVEL` for each part of the day (the birds were
  raised a little and the wind lowered after the author listened).
  The balance inside a part, such as one cricket against another, is set
  in the engine; so are the places that have a sound of their own and
  where each horse stands, in its `PLACES`. Bump the `?v=` on a
  script's tag in `farm-house/index.html` when it changes.
  `scripts/test-farm-sound.cjs` checks the behaviour; only listening can
  check the sound, so listen on a phone before changing a level or a
  voice. Neither script is precached by `sw.js`; if that changes, bump its
  `CACHE`.

## Cursor Cloud specific instructions

This repository is a **Jekyll 4 static site** ("On Life & Everything", a personal blog) that is deployed to GitHub Pages via `.github/workflows/pages.yml`. Ruby, RubyGems, and Bundler 4.0.13 are pre-installed in the Cloud VM, and the startup update script runs `bundle install` (gems install into the git-ignored `vendor/bundle/`, configured by `.bundle/config`).

### Running the site (dev)
- Serve with live reload: `bundle exec jekyll serve --host 0.0.0.0 --port 4000` (open http://localhost:4000/). Run it in a long-lived tmux session, not a one-shot background process.
- Build only: `bundle exec jekyll build` (output goes to the git-ignored `_site/`).
- Checks: `python3 scripts/vendor_pdfjs.py` once (the PDF checks need the bundled PDF.js), `bundle exec jekyll build`, then `npm ci && npm test`: the same chain CI runs on every pull request, and several checks read the built `_site/`. `scripts/test-content.cjs` holds the editorial rules a script can hold: quiz bank structure and rounds, word-story footnotes numbered in first-cited order, closed-up em dashes, and links inside the site. It lists every problem it finds at once.
- `npm run links` fetches every cited source address; it runs weekly from `.github/workflows/links.yml` rather than on pull requests, because it depends on other sites being up. Only a page that is gone fails it.

### Non-obvious notes
- URLs are "pretty": source files like `about.html` / `archive.html` are served at `/about/` and `/archive/` (trailing slash), NOT `/about.html`. Posts use the permalink pattern `/pieces/:slug.html` (set in `_config.yml`).
- `_config.yml` sets `future: true`, so posts dated in the future still render — expected for this repo.
- The production Pages workflow uses Ruby 3.3; the VM uses the apt-provided Ruby 3.2, which builds the site fine.

## Starting a session

Every session starts cold and remembers nothing of the last one, so what was
learned the hard way is written down here instead.

- **Build the working branch from `main`, before writing anything.** Branch
  names are reused across sessions here, so a branch that looks ready to
  continue may be carrying a pull request that was merged days ago. New
  commits stacked on merged history produce a pull request nobody can read.
  `git fetch origin main && git checkout -B <branch> origin/main`.
- **A merge can land while you are still pushing, and nothing will say so.**
  This happened twice in one session: a prose fix was pushed after its pull
  request had already been merged, so it sat on the branch and never reached
  the site — and it was only caught later, by chance. Before opening anything
  new, check that the last commit you pushed is an ancestor of `origin/main`
  (`git merge-base --is-ancestor <sha> origin/main`) and carry over whatever
  is not. Ask to be told when a pull request is merged; it is cheaper than
  finding out.
- **This site is read as pages, not as diffs.** Its author reviews a change by
  looking at it, which for a long time meant merging first and looking after.
  Build the site and hand over the rendered pages — the ones that changed and
  the index they sit in — before asking for a merge. A description of a
  paragraph is not a substitute for the paragraph.
- **Say what changed, not why each word changed.** A pull request description
  names the work and its shape; the line-by-line reasoning behind an edit
  belongs in the conversation, not in a public description that outlives it.
  "The prose was simplified" is the right altitude.

## Before showing anything

What went wrong on the day The House opened, so that it does not go wrong
again.

- **Look at it before anyone else does.** Passing checks say a page works, not
  that it looks right. Build the site, open the page in a browser and look at
  every state it has: each hour of The House, a phone, the dark themes. A
  drawing can only be judged by looking at it. A Moris drawn from coordinates
  and never rendered reached the author, and it was not a cat.
- **Say "I can't" at the start.** Some things cannot be done well from here,
  and a likeness drawn by writing SVG coordinates is one of them. Say so
  before trying, not after the author has seen the attempt.
- **Describe a photograph from the photograph.** Look at it before writing its
  alt text or a line under it, and ask the author about whatever the picture
  cannot settle: where he is, what he is looking at. A line written for the
  drawn room was put under a photograph of somewhere else.
- **Report only what you have reproduced.** A problem named before it is
  confirmed costs trust twice, once when it is said and again when it is taken
  back. That day a header "covering" the room turned out to be a scrolled
  page, and "broken" photographs were only missing from a local build.
- **`/images/480/` and `/images/960/` are made at deploy** by
  `scripts/generate_image_variants.py` in `.github/workflows/pages.yml`. A
  local build has only the variants that are committed, so an image missing
  locally may be fine on the site. Check the live address before calling it
  broken.

## Time, place and sky

The site has two deliberate ideas of place. Do not collapse them into one.

- **The general site follows the visitor's sky.** The Follow the Sky theme,
  `/twilight/`, `/sun/`, `/stars/` and the homepage's Tonight read the
  browser-reported IANA time zone and resolve it through `_data/cities.yml`.
  No location permission is requested. If the zone is unknown, keep the
  existing nominal-equatorial fallback rather than pretending to know the
  visitor's latitude.
- **The House is in İstanbul.** Its calendar day, light, sunrise and sunset,
  moon visibility, room period, Moris's movement, wall clock, and any future
  outdoor space such as the balcony all use İstanbul time and coordinates
  (`Europe/Istanbul`, 41.015, 28.979). A visitor enters that place; the House
  does not move to the visitor.
- A link from The House to Twilight must preserve that place explicitly:
  `/twilight/?city=istanbul`. A normal site link to `/twilight/` should stay
  visitor-local and should not be labelled “İstanbul's Twilight.”
- Keep labels honest about which clock they describe. General site copy may say
  “today's twilight” or name the resolved city. House copy may say
  “İstanbul's Twilight” because the House deliberately stays there.
- The moon's phase itself is global at a given instant, but whether the moon is
  above the House's horizon is an İstanbul calculation. Do not confuse phase
  with local visibility.
- For an unknown zone, Tonight gives only the sun's times and the moon's
  phase. A map or a compass direction would claim a place the site does not
  know.

## The Sun, The Stars and Tonight

- **`js/bright-stars.js` is generated.** Change `scripts/build_sky_data.py`
  and run it with the three pinned sources named at its top: the Bright Star
  Catalogue, the IAU's catalogue of star names and d3-celestial's
  constellation lines. Do not edit the data by hand. T Coronae Borealis is
  left out, because the catalogue gives it the brightness of its 1866
  outburst, and Mira and chi Cygni are not drawn, because their brightness
  on a given night is unknown. The notes on `/stars/` say so.
- **One sky, three places.** `js/sky-map.js` works out and draws the sky for
  `/stars/`, the homepage's Tonight and the window in The House, so they
  never disagree. Its scripts and their `?v=` are listed once, in
  `_data/sky_scripts.yml`. The homepage fetches them when Tonight comes near;
  The House only when its window is opened after dark.
- The moon's phase name and percentage come from `js/astronomy.js`
  everywhere, so The Moon, The House, Tonight and The Stars give the same
  moon. Positions of the moon and planets come from Astronomy Engine.
- `scripts/test-window-sky.cjs` checks the star data, both instruments and
  Tonight.

## Reading options

- **"Original" is the published page.** Text size and line spacing change a
  piece only after a reader picks something else: `js/reading-settings.js`
  sets `data-reading-size` and `data-reading-spacing` on `<html>` for a
  choice, and every rule in `css/reading.css` that changes the prose waits
  for one. The fixed sizes of headings, quotations and the piece note in
  `style.css` are multiplied by `--reading-scale`, so a larger setting keeps
  them in proportion. `scripts/test-reading.cjs` fails on an ungated rule.
- **"read with rain" stays under the title**, not in the menu: rain that is
  falling has to show where it can be stopped.
- **A printed piece** opens with its kind (Essay or Short fiction) on the
  left and HAKANALTUN.IO on the right, then the title and date, centred, and
  ends with the footer's two lines, centred. Word pages have no print layout
  of their own: The House's cards are how a word is printed or shared.
- **Puzzle mode waits at the foot of a piece** and opens at its head. Its
  panel is sticky, so the scroll aims at the article, not at the panel.
- **Listening and offline saving were tried and taken out** in October 2026.
  Device voices are not on every device, and offline copies put the service
  worker in front of every page. "Print or save as PDF" is the way to keep
  a piece. Do not add them back unless the author asks; listening that works
  for everyone would need recorded audio.

## Punctuation

- **Em dashes are closed up: word—word, not word — word.** The essays are
  written that way, and new text in quizzes, word stories and notes follows
  them. Leave the spaced dash in page titles (" — On Life & Everything" and
  the instrument names) alone; that separator is deliberate and explained in
  `_includes/head.html`.

## Words with Stories editorial standard

`Words with Stories` is a deliberately small, curated collection, not a general etymology dictionary. A term should be added only when its story earns its place.

- Prefer words or expressions in which an older meaning, image, object, belief, or event still leaves a visible trace in the modern term. Examples include *bosh* retaining Turkish *boş*, *quarantine* retaining forty, *nightmare* retaining the old *mare*, *influence* carrying the old idea of something flowing in from the stars, and *Rosetta stone* turning a historical object into a metaphor for a key to understanding.
- The story should change how the reader sees the term. A merely correct etymology is not enough.
- There should be a clear one-sentence answer to: "Why this term rather than hundreds of other interesting etymologies?" If there is not, leave it out.
- Myth, folklore, historical belief, and legend are allowed when they genuinely explain the term's development or continuing image. Mere association with mythology is not enough; otherwise the collection would expand without a meaningful boundary.
- Every story must be sourced. Prefer museums, universities, academic publications, dictionaries with etymological scholarship, archives, or official institutions. Use multiple sources for historical claims when useful.
- If a popular story is disputed or cannot be confirmed, say so explicitly or do not use it. Do not preserve a neat story at the expense of accuracy.
- Treat *nightmare* and *quarantine* as roughly the lower editorial threshold. Candidates with a weaker transformation, residue, surprise, or narrative reason should normally be rejected.
- Words, idioms, and fixed expressions may all qualify in future; the same editorial threshold applies.
- Keep the prose plain and unshowy. Sentences should carry the content rather than compete with it. Avoid polished, aphoristic endings or lines written mainly to sound quotable. The reader should remember the story more than the sentence.
- The part-of-speech label must match the specific sense being explained on the page. Do not list every part of speech the spelling can have; label the entry as the reader encounters it in that story and example.

## Pictures with Stories editorial standard

`Pictures with Stories` uses detailed, realistic
watercolour illustrations whose areas can be opened to learn about what is
shown. Apply the `Words with Stories` standards for curation, sourcing,
accuracy and plain prose to this section as well.

- Follow The Farm House's watercolor language: broad brush strokes,
  transparent washes, a limited value range, visible pencil, occasional
  unfinished edges and exposed paper. Paint from scientific or historical
  references when the subject calls for them; preserve the forms that an
  explanation relies on. The Farm House's fixed scenes remain its own set.
- Use The Farm House's way of exploring: quiet areas on the picture,
  optional labels, numbered choices on a small screen, and a closer view
  alongside each explanation. Provide keyboard access and a way back to the
  picture. Sources sit below the explanation as links, with the full source
  list below the picture.
- Every clickable explanation must be sourced. Verify its factual claims
  before writing, and link to sources that support those claims. Prefer
  museums, universities, academic publications, archives and official
  institutions; use multiple sources when useful.
- Choose subjects whose visible details have a story worth explaining. Each
  explanation should help the reader understand the part of the picture they
  opened. Let the subject determine the number of areas.
- Keep the illustration accurate enough to support its explanations.
  Distinguish observed features from reconstructions and artistic choices
  where that distinction matters.
- If a claim is disputed or cannot be confirmed, explain the uncertainty or
  leave it out. Keep the prose plain and unshowy, following the same writing
  rules as `Words with Stories`.
- A picture may also have a story below it. Source each part as carefully as
  the clickable explanations. For scientific subjects, identify speculative
  ideas as such and distinguish mathematical predictions from observations.
  A sourced account of a theory is evidence that it was proposed, not that
  it has been confirmed. If an anecdote is retained without a verifiable
  source, say that explicitly and do not present it as an established fact.
- **The story opens with the picture's own history**: who first worked out
  or showed what it shows, and how. Speculation the subject invites comes
  after that, marked as such.
- **The painting stands as a sheet on a light, quiet page.**
  `--picture-paper` in `css/pictures.css` is `#f8f7f2`, a shade under the
  site's own light paper; the image keeps its edges, as it does on the
  section's index and the homepage. The painting's warm paper was tried as
  the page colour in October 2026 and taken out at the author's request:
  over a whole page it was too loud.
- **Places show as faint dots from the first look**, on every screen. A
  label sits on its place unless that covers the thing it names, such as a
  thin line; `label_side: right` in the picture's front matter puts it
  beside it. A label that shows opens its detail as the dot does; a hidden
  one takes no clicks.
- **A close view opens at the top of its dialog.** Reset the scroll after
  `showModal()`, never before it: a closed dialog cannot be scrolled. Open
  every detail on a phone as well as a desk, one after another, and check
  that each close view shows what its text names.
- The homepage shows one picture, chosen at random, under Words with
  Stories (`_includes/pictures-with-stories-home.html`).

## The homepage

- **Slate and green take turns down the page.** Every homepage section is
  named in one of the two accent lists in `css/style.css` ("Homepage accent
  rhythm"). A new section takes the colour its place calls for, and every
  section after it moves to the other list. `scripts/test-pictures.cjs`
  fails when a section is missing from the lists or two neighbours share a
  colour.

## Interface details

- **A disclosure uses the site's chevron**, the one in the drawer and on a
  piece's reading options, never the browser's triangle. Its words sit where
  the layout puts them; the chevron hangs beside them and does not pull them
  off their line.

## Trivia editorial standard

`Trivia` is quizzes. Adding one is three files and is described in
`_data/trivia.yml`; this is what belongs inside them.

- **A question earns its place through its note.** Difficulty is worth little
  on its own. The note is the only part a reader keeps, so it has to hand them
  something the question withheld: that Big Ben cracked in its first months and
  the crack is what gives the chime its tone; that the Romans knew Bath as
  Aquae Sulis, after a local goddess they folded into their own Minerva. Two or
  three sentences is the usual length. A note that says the answer again in
  other words should be rewritten, and a question that cannot carry one should
  be dropped.
- Every claim must be sourced before it is written down. Prefer museums,
  universities, dictionaries with etymological scholarship, archives, national
  institutions, and the governing body of a sport for its own rules. Where a
  popular version is disputed, say so in the note or leave the question out.
- Nothing that goes stale: a current holder, a standing record, a living
  person's role. The bank is not revisited on a schedule, so a question that
  needs one is a question that will quietly become wrong.
- **The answer must not stand inside its own question.** Naming the bear names
  the station; ask it another way or ask something else.
- All four choices must be real candidates to somebody who does not know. Three
  obviously wrong ones make the question an inventory check, not a question.
  Distractors should be the same kind of thing as the answer — four monarchs,
  four counties, four novelists — and of roughly the same length.
- Write the right answer wherever it belongs in the list and think no further
  about it. The quiz shuffles both the questions and the choices for every
  game, so a pattern in the file is not a pattern a reader can see, and hand-
  balancing the positions only makes the file harder to read. This is worth
  saying because the first bank drifted badly — 29 of its 50 answers were
  written second — which is why the shuffle exists.
- A negative question ("least typical", "not") is allowed but should stay rare,
  and the negative must be unmissable in the wording.
- Every question carries a `category`, and **a category is a round**: the bank
  is stored grouped, in the order the rounds should run, and the quiz reads the
  round count from that rather than from anything written down. Aim for six to
  fourteen questions in a round. A subject too thin for six belongs inside a
  neighbour, not in a round of its own.
- Order the rounds so the quiz opens on the easiest ground and does not end on
  the narrowest.
- Every question also carries an `id`, unique in its bank. Readers keep
  questions in their drawer in The House by it, so it stays put when a
  question is reworded or moved; a new question gets a new id.
- Keep the prose plain, as everywhere else here, and let the content do the
  work.
