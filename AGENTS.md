# AGENTS.md

## What this is for

The question behind this site is why things that would be good for people
have not been made. It asks how people came to be steered toward accepting
less, and why money came before feeling. Large companies grew with people
while neglecting their needs. Their growth depended on the lack of
alternatives. This site grows by caring about the people who come to it.

These concerns guide every change.

- **Give the reader something, and take nothing they did not choose to
  give.** Respect the time a reader chooses to spend here. Do not add
  tracking or engagement tricks that draw them back or keep them longer
  than they meant to stay. What a reader keeps stays in their own browser,
  in the drawer. The site asks for an email address for new pieces quietly
  at the end of an essay, and the reader chooses whether to give it.
  The existing visit counter is the one exception. GoatCounter
  (`_layouts/default.html`) counts visits to pages that carry the site's
  header. The Farm House, the pictures and the instruments are not counted.
  It sets no cookies and keeps aggregate totals. These include visits per
  page, the pages and sites visitors came from, and their country, language,
  browser, system and screen width. The author looks at it once a week.
  The search page does not load it, so what a reader searches for stays
  with them. Add no other counter or analytics.
- **Never ask a reader to settle for less.** A half-made page or a drawing
  that does not work tells the reader their time was not worth the care.
  Descriptions must be accurate. If something cannot be made well, it waits.
- **The test is the reader's first look.** Someone opening a page should
  find something that draws them in and a clear way to explore it.

## The Farm House

The Farm House is a growing fictional world where visitors can spend time
and feel close to nature. Its existing family story unfolds gradually.
Wandering and observing should be worthwhile on their own.

- **The visual set is fixed.** The seven loose watercolor illustrations
  restored on 1 October 2026 are the canonical set. They are
  `exterior-watercolor.webp`, `hall-watercolor.webp`,
  `kitchen-watercolor.webp`, `garden-watercolor.webp`,
  `stable-yard-watercolor.webp`, `stable-watercolor.webp` and
  `upstairs-watercolor.webp`, all in `farm-house/assets/`. These are the
  exact images from commit `d48a4fc`. The upstairs image also appears at
  the story's ending. Keep their finish and style unless the author
  explicitly requests a change. The original upstairs watercolor is the
  style reference for new scenes. It uses broad brush marks and transparent
  washes, with a limited value range and visible pencil. Occasional
  unfinished edges expose the white paper. Use existing scenes to establish
  the objects and their placement, relative scale and camera angle. Paint
  new scenes from scratch in this language. Preserve important objects.
  Avoid inventing decoration or copying a former render's surface detail.
- Let the story develop through occasional discoveries and small traces in
  the rooms. Give each addition time to settle. Preserve the unanswered
  questions in the existing story, including why the grandmother kept the
  letter and remained silent about it.
- Grow the house and its surroundings as connected places. The garden can
  lead to woodland paths and a river. Rooms can hold traces of the past.
  Introduce the animals kept on the farm as well as wildlife in the forest.
  Plants and birds are part of the world visitors can learn to recognize.
- Complete the spring/summer setting first. For now, keep new scenes sunlit
  and suggestive of spring or summer. Autumn and winter views can follow.
  Keep the light natural in the watercolor scenes. Direct sun should differ
  from veranda shade and window-lit interiors. Avoid exaggerated yellow
  casts or glowing highlights. Shadows should retain differences in brightness.
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
- Expand in small, coherent steps. Follow the site's editorial standards
  below, and keep fictional details consistent with the established story.

### Sound

The Farm House has an optional sound layer. It stays off until the visitor
turns it on with "listen to the farm" in the footer. The choice is kept in
their browser (`olae-farm-sound`). If sound was left on, it waits for their
first click because browsers require an interaction before starting audio.
Every start and stop fades over a second or two. A hidden tab fades out and
suspends the audio until it returns.

- **The sound changes through the day.** Morning has sparse birdsong and a
  collared dove. At midday, soft wind accompanies cicadas that come in waves,
  with the dove heard now and then. Crickets sound in the evening. At night
  they are fewer, slower and quieter, with a scops owl also heard. The small
  birds and crickets do not represent particular species. The dove, owl and
  cicadas do, and the author asked for them in October 2026. Nothing on the
  page names a species.
- **The sound follows the scenes' summer season.** The time of day is the
  visitor's, while the season belongs to the pictures. Remove the scops owl
  and cicadas when autumn or winter scenes arrive.
- **The rooms soften the outdoor sound.** Outdoors the sound is low. In the
  rooms it is lower still and low-passed to suggest sound heard through the
  walls. The hall, kitchen, upstairs and stable aisle are listed in the
  page's `indoors` set. Add each new room to that set.
- **The horses are heard only near them.** The author requested that they
  sound faintly from the left in the garden and close by in the stable yard.
  In the stable they share the room, and their sounds remain unmuffled. Each
  horse occasionally snorts, blows or shifts a hoof from its position in the
  picture. A whinny made from oscillators was tried and removed in October
  2026 because it failed to sound like a horse. Bees cross the garden in the
  morning and at midday. They belong to the garden's own sound, which is
  updated when the part of the day changes.
- **Keep the floorboard creaks out.** Synthesized creaks were tried in
  October 2026 and removed at the author's request. Add them again only if
  the author asks.
- **The farm's sound follows the visitor's sky.** The browser's time zone
  resolves to a city through `window.OLAE_SKY` (`_includes/sky-ramp.html`),
  following the same method as Follow the sky. The sun's height decides the
  part of the day. Night begins below −12°, or while the sun is climbing but
  remains below −6°. Morning lasts while it climbs to half its noon height.
  Evening starts once it sinks below 10°, or below 30% of its noon height on
  a short day. No location is ever requested. Without `OLAE_SKY`, the clock
  assigns morning to 05–10, midday to 10–18 and evening to 18–22. Night follows.
- **The sound can be tested at any hour.** `?hour=19`, with any value from
  0 to 23.99, sets the clock to that time today. The sky still decides which
  part of the day applies, so evening's hour changes with the season. In
  İstanbul in early October, 8 is morning, 13 is midday, 19 is evening and
  23 is night. This works only on the live site. Before merging, publish a
  private preview of the built page to listen to a change. Never link to it.
- **Two scripts control the sound.** Keep sound generation in
  `js/farm-sound-engine.js`. It borrows pink noise for the wind from
  `js/rain-engine.js`.
  `js/farm-sound.js` holds the toggle and scheduling. Near its top,
  `LEVEL` sets the indoor and outdoor levels and a place's own sound
  (`near`), while `HOUR_LEVEL` sets the levels for each part of the day.
  The birds were raised a little and the wind lowered after the author
  listened. The engine sets the balance within a part of the day, such as
  one cricket against another. Its `PLACES` defines which places have their
  own sound and where each horse stands. Bump the `?v=` on a script's tag
  in `farm-house/index.html` when it changes. `scripts/test-farm-sound.cjs`
  checks the behavior. Listen on a phone before changing a level or a voice,
  because the sound itself needs to be heard. Neither script is precached by
  `sw.js`. If that changes, bump its `CACHE`.

## Working on the site

This repository is a **Jekyll 4 static site** called "On Life & Everything",
a personal blog deployed to GitHub Pages through `.github/workflows/pages.yml`.
Ruby, RubyGems and Bundler 4.0.13 are preinstalled in the Cloud VM. The startup
update script runs `bundle install`. Gems go into the git-ignored
`vendor/bundle/`, as configured by `.bundle/config`.

### Running the site (dev)

- Serve the site with live reload using
  `bundle exec jekyll serve --host 0.0.0.0 --port 4000`, and open
  http://localhost:4000/. Run it in a long-lived tmux session.
- Build the site with `bundle exec jekyll build`. Output goes to the
  git-ignored `_site/`.
- Run `python3 scripts/vendor_pdfjs.py` once to restore the bundled PDF.js
  assets needed by the PDF checks. Then run `bundle exec jekyll build`,
  followed by `npm ci && npm test`. CI runs the same checks on every pull
  request. Several checks read the built `_site/`.
  `scripts/test-content.cjs` checks the editorial rules that can be tested
  in code. These cover quiz-bank structure and rounds, word-story footnotes
  numbered in first-cited order, closed-up em dashes and links within the
  site. It reports every problem it finds in one run.
- `npm run links` fetches every cited source address. It runs weekly from
  `.github/workflows/links.yml`. Because it depends on other sites being up,
  it is kept out of pull-request checks. Only a page that is gone fails it.

### Non-obvious notes

- URLs use the "pretty" format. Source files such as `about.html` and
  `archive.html` are served at `/about/` and `/archive/`, with trailing
  slashes. Posts use the permalink pattern `/pieces/:slug.html`, set in
  `_config.yml`.
- `_config.yml` sets `future: true`, so posts dated in the future render
  as intended.
- The production Pages workflow uses Ruby 3.3. The VM's apt-provided Ruby
  3.2 also builds the site.
- `style.css` and `palettes.css` are linked once in `_includes/head.html`
  for every page that uses the default layout. Bump the `?v=` there when
  either changes.
- The published stylesheets carry no comments. After the checks, deployment
  runs `scripts/strip-css-comments.cjs` on `_site/css` and fails if any rule
  would change. Keep writing comments in `css/`, where a local build keeps
  them. Styles inside a page's own `<style>` remain untouched.
- **This file is published.** Every deployment builds `/colophon/` from
  it, beneath the author's introduction in `colophon.html`.
  `_plugins/agents_md.rb` reads it without processing Liquid. Follow the
  site's prose and punctuation rules here because visitors read it too.
  `scripts/test-content.cjs` checks its dashes and words split across line
  breaks. A split word would appear on the page as two (`hand- balancing`).

## Starting a session

Every session starts cold. This file keeps a record of what earlier work
has taught us.

- **Build the working branch from `main` before writing anything.** Branch
  names are reused across sessions, so a branch that looks ready to continue
  may belong to a pull request merged days ago. New commits stacked on
  merged history make a pull request difficult to review. Start with
  `git fetch origin main && git checkout -B <branch> origin/main`.
- **Check whether the last work reached `main`.** A merge can land while
  a branch is still being pushed. This happened twice in one session.
  A prose fix was pushed after its pull request had been merged and sat on
  the branch until someone noticed. Before opening anything new, use
  `git merge-base --is-ancestor <sha> origin/main` to check that the last
  pushed commit belongs to `origin/main`. Carry over any work that has yet
  to reach it. Ask the author to report when a pull request is merged.
- **Show changes as rendered pages.** The author reviews a change by
  looking at it. For a long time, this meant merging first and looking
  afterward. Build the site and hand over the changed pages, together with
  the index they belong to, before asking for a merge. The author needs to
  read the actual paragraph in its page.
- **Describe the work at the scale of the change.** A pull-request
  description names what changed and its scope. Keep line-by-line reasoning
  in the conversation. "The prose was simplified" is enough for the public
  record when that is what the change does.

## Before showing anything

The House's opening taught us several lessons. These rules keep a record
of them for future work.

- **Look at it before anyone else does.** Passing checks establish that a
  page works. Its appearance needs a separate review. Build the site and
  inspect every state of each changed page in a browser. This includes the
  hours of The House and its phone and dark-theme views. Judge a drawing by
  looking at it.
  A Moris drawn from coordinates reached the author before anyone rendered
  it, and failed to look like a cat.
- **Say "I can't" at the start.** Some things cannot be done well from here,
  including a likeness drawn by writing SVG coordinates. Explain that limit
  before trying.
- **Describe a photograph from the photograph.** Look at it before writing
  its alt text or a line beneath it. Ask the author about anything the
  picture cannot settle, such as where Moris is or what he is looking at.
  A line written for the drawn room was once put under a photograph of
  somewhere else.
- **Report only what you have reproduced.** Naming a problem before it is
  confirmed costs trust when it is reported and again when it is taken back.
  A header said to be covering the room turned out to be a scrolled page.
  Photographs said to be broken were missing only from a local build.
- **Image variants are generated during deployment.**
  `scripts/generate_image_variants.py` in `.github/workflows/pages.yml`
  makes `/images/480/` and `/images/960/`. A local build has only the variants
  committed to the repository. Check the live address before reporting a
  missing local image as broken.

## Time, place and sky

The site has two deliberate ideas of place. Preserve both.

- **The general site follows the visitor's sky.** The Follow the Sky theme,
  `/twilight/`, `/sun/`, `/stars/` and the homepage's Tonight read the
  browser-reported IANA time zone and resolve it through `_data/cities.yml`.
  No location permission is requested. For an unknown zone, keep the
  existing nominal-equatorial fallback. Avoid claiming a latitude the site
  cannot establish.
- **The House is in İstanbul.** Its calendar day and light use İstanbul
  time and coordinates (`Europe/Istanbul`, 41.015, 28.979). The same applies
  to sunrise and sunset, moon visibility, the room period, Moris's movement
  and the wall clock. Any future outdoor space, including the balcony,
  also belongs to İstanbul. A visitor enters that place.
- A link from The House to Twilight must preserve the place explicitly
  through `/twilight/?city=istanbul`. An ordinary site link to `/twilight/`
  follows the visitor's sky. Give it a label that describes that view.
- Keep labels honest about which clock they describe. General site copy
  may say "today's twilight" or name the resolved city. House copy may say
  "İstanbul's Twilight" because the House stays there.
- The moon's phase is global at a given instant. Whether it is above the
  House's horizon is calculated for İstanbul. Keep phase and local
  visibility distinct.
- For an unknown zone, Tonight gives only the sun's times and the moon's
  phase. A map or compass direction would claim a place the site cannot
  establish.

## The Sun, The Stars and Tonight

- **`js/bright-stars.js` is generated.** Change `scripts/build_sky_data.py`
  and run it with the three pinned sources named at its top. These are
  the Bright Star Catalogue, the IAU's catalog of star names and
  d3-celestial's constellation lines. Keep manual edits out of the generated
  data. T Coronae Borealis is omitted because the catalog gives it the
  brightness of its 1866 outburst. Mira and chi Cygni are omitted because
  their brightness on a given night is unknown. The notes on `/stars/`
  explain these omissions.
- **The same sky calculation serves all three views.** `js/sky-map.js`
  calculates and draws the sky for `/stars/`, the homepage's Tonight and
  the window in The House. Its scripts and their `?v=` are listed once
  in `_data/sky_scripts.yml`. The homepage fetches them when Tonight comes
  near the viewport. The House fetches them when its window is opened
  after dark.
- The moon's phase name and percentage come from `js/astronomy.js`
  everywhere. The Moon, The House, Tonight and The Stars therefore give
  the same moon. Astronomy Engine supplies the positions of the moon
  and planets.
- `scripts/test-window-sky.cjs` checks the star data, both instruments
  and Tonight.

## Reading options

- **"Original" is the published page.** Text size and line spacing change
  only after a reader chooses another setting. `js/reading-settings.js`
  sets `data-reading-size` and `data-reading-spacing` on `<html>` for
  that choice. Every prose-changing rule in `css/reading.css` waits for
  one. In `style.css`, the fixed sizes of headings, quotations and the
  piece note are multiplied by `--reading-scale` to keep them in proportion
  at larger settings. `scripts/test-reading.cjs` fails on an ungated rule.
- **Keep "read with rain" under the title.** Reserve that control for this
  position, where a reader can see how to stop the rain while it is falling.
- **A printed piece keeps the site's identifying details.** It opens with
  its kind, Essay or Short fiction, on the left and HAKANALTUN.IO on the
  right. The title and date follow, centered. The footer's two lines close
  the piece, also centered. The House's cards provide the printing and
  sharing format for words, whose pages have no print layout of their own.
- **Puzzle mode waits at the foot of a piece and opens at its head.** Its
  panel is sticky, so scrolling must aim at the article beneath it.
- **Listening and offline saving were removed in October 2026.** Device
  voices vary in availability, and offline copies put the service worker
  in front of every page. "Print or save as PDF" is the way to keep a piece.
  Restore those features only if the author asks. Listening that works
  for everyone would need recorded audio.

## Punctuation

- Write complete sentences. Use fragments only when they serve a clear
  purpose, including short interface labels and section headings.
- State the intended point directly. Avoid the `not X, but Y` pattern and
  unnecessary negative examples.
- Use a rhetorical group of three only when every part is needed. Keep
  necessary lists of technical items or factual details intact.
- Keep the prose plain and use correct punctuation. Avoid ornate phrasing
  and polished endings written mainly to sound quotable. Use em dashes
  and colons only when needed.
- **Close up em dashes.** When a dash is needed, write `word—word`.
  Essays and new text in quizzes, word stories and notes follow this
  convention. Keep the spaced separator in page titles, including
  `Feeds — On Life & Everything` and instrument names. That separator
  is deliberate and explained in `_includes/head.html`.

## Words with Stories editorial standard

`Words with Stories` is a deliberately small, curated collection.
Each term must earn its place through its story. Keep the collection
focused on those stories as new entries are considered.

- Prefer words or expressions whose modern sense retains a trace of an
  older meaning or image. That trace may also come from an object, belief
  or event. For example, *bosh* retains Turkish *boş*, and *quarantine*
  retains forty. The old *mare* remains in *nightmare*. *Influence* carries
  the old idea of something flowing in from the stars. *Rosetta stone*
  turns a historical object into a metaphor for a key to understanding.
- The story should change how the reader sees the term. A correct
  etymology needs a reason to be told here.
- Give a clear one-sentence answer to "Why this term rather than hundreds
  of other interesting etymologies?" Leave the term out if that answer
  cannot be given.
- Myth, folklore, historical belief and legend qualify when they explain
  the term's development or continuing image. Establish that connection
  before including a term. Mere association would let the collection
  expand without a meaningful boundary.
- Source every story. Prefer museums, universities, academic publications,
  dictionaries with etymological scholarship, archives and official
  institutions. Use multiple sources for historical claims when useful.
- If a popular story is disputed or cannot be confirmed, explain that
  clearly or leave it out. Accuracy takes priority over a neat story.
- Treat *nightmare* and *quarantine* as roughly the lower editorial
  threshold. Normally reject candidates with a weaker transformation,
  residue, surprise or narrative reason.
- Words, idioms and fixed expressions may all qualify in future. The
  same editorial threshold applies to each.
- Follow the site's prose rules. Sentences should carry the content.
  Give the story enough room to be remembered on its own.
- Match the part-of-speech label to the specific sense explained on the
  page. Label the entry as the reader encounters it in that story and
  example. Keep other senses outside the label.

## Pictures with Stories editorial standard

`Pictures with Stories` uses detailed, realistic watercolor illustrations
with areas visitors can open to learn about what is shown. Apply the
`Words with Stories` standards for curation, sourcing and accuracy, along
with the site's prose rules.

- **Keep the current catalog structure for now.** The future direction
  is to group pictures by subject. Astronomy or cosmology could include
  nebulae, quasars and black holes. Birds could be grouped by individual
  species, and cats could have their own section. Further subjects can
  follow as the collection grows. These examples leave the final grouping
  open. Preserve the current page layout and navigation until that
  reorganization. Every group follows the same standards for drawing
  and sourced storytelling.
- Follow The Farm House's watercolor language. Use broad brush strokes
  and transparent washes, with a limited value range and visible pencil.
  Leave occasional unfinished edges and exposed paper. Paint from
  scientific or historical references when the subject calls for them.
  Preserve the forms an explanation relies on. The Farm House's fixed
  scenes remain its own set.
- Use The Farm House's way of exploring. Keep quiet areas on the picture
  and optional labels, with numbered choices on a small screen. Place a
  closer view alongside each explanation. Provide keyboard access and
  a way back to the picture. Link to sources beneath each explanation
  and put the full source list below the picture.
- Source every clickable explanation. Verify factual claims before
  writing, and link to sources that support them. Prefer museums,
  universities, academic publications, archives and official institutions.
  Use multiple sources when useful.
- **The clickable details carry the picture's stories.** Every picture
  must have sourced details worth telling stories about. Each explanation
  should help the reader understand the part they opened and change how
  they see it. Let the subject determine the number of areas.
- **Choose the subject through its details first.** Establish whether
  enough details carry worthwhile stories to justify the picture's place.
  This is required. An interesting account of how we came to know what
  it shows gives a candidate priority, although such an account is optional.
  Give a clear one-sentence answer to "Why this picture rather than
  hundreds of others?" Let it wait if its details cannot justify it.
- Keep the illustration accurate enough to support its explanations.
  Where the distinction matters, identify observed features separately
  from reconstructions and artistic choices.
- If a claim is disputed or cannot be confirmed, explain the uncertainty
  or leave it out. Follow the same writing rules as `Words with Stories`.
- **A separate story below the picture is optional.** Include one only
  when there is a worthwhile account to tell. Let the material determine
  how much space it needs. Something that cannot be made well waits.
  Source each part as carefully as the clickable explanations. For
  scientific subjects, identify speculative ideas and distinguish mathematical
  predictions from observations. A source describing a theory establishes
  that it was proposed. Confirmation needs its own evidence. If an anecdote
  is retained without a verifiable source, state that explicitly and keep
  its uncertainty clear.
- **The reader should see more when they return to the picture.** Judge
  every explanation and separate story by whether it helps the reader
  notice or understand more in the picture. Clickable explanations open
  its details, and a separate story connects them. Let the subject
  determine the story's length.
- **Let the subject choose its story and its opening.** "How do we know
  this?" is one useful way in. It can lead through the evidence behind
  an observation and the interpretations that help us understand it.
  The history of a first drawing may belong here when it helps. Possible
  openings include the seismic evidence for Earth's interior or early
  microscope observations of cells. Changing fossil reconstructions of
  Iguanodon provide another example. The black-hole story already follows
  this approach. Other subjects may carry stories through their lives
  or relationships, and through the changes they undergo.

  - A bird may carry a migration story. Its name or a meaning people have
    given it may also provide a way in.
  - A nebula may be understood through its formation and the changes ahead
    of it. The picture's details can open parts of that process.
  - A cat may lead to its history of living with people, or to the reason
    behind a behavior shown in the picture.

  Verify and source particular claims before using any example. Keep
  observation and inference distinct, and identify artistic reconstructions.
  Mark speculation clearly and follow the evidence.
- **The painting stands as a sheet on a light, quiet page.**
  `--picture-paper` in `css/pictures.css` is `#f8f7f2`, a shade under the
  site's own light paper. The image keeps its edges, as it does on the
  section's index and homepage. The painting's warm paper was tried as
  the page color in October 2026 and removed at the author's request.
  Across a whole page, it was too loud.
- **Places show as faint dots from the first look on every screen.** A
  label sits on its place unless it would cover the thing it names,
  such as a thin line. `label_side: right` in the picture's front matter
  puts it beside the place. A visible label opens its detail as the dot
  does. A hidden label takes no clicks.
- **A close view opens at the top of its dialog.** Reset the scroll after
  `showModal()`, when the dialog can be scrolled. Open every detail on a
  phone as well as a desktop, one after another. Check that each close
  view shows what its text names.
- The homepage shows one picture, chosen at random, under Words with
  Stories (`_includes/pictures-with-stories-home.html`).
- **Full screen is optional.** Each picture offers it through its own
  control. Keep the whole sheet visible, preserving its proportions and
  clickable places. Explanations remain available in full screen. Provide
  an explicit exit and keyboard access. Escape closes an explanation
  before leaving the picture. Exiting restores focus and the page position.
  If the browser cannot enter native full screen, fill its window instead.
  Check both paths on a desktop and a phone, including a change of
  orientation.

## The homepage

- **Slate and green take turns down the page.** Every homepage section
  belongs to one of the two accent lists in `css/style.css`, under
  "Homepage accent rhythm". A new section takes the color its place
  calls for. Move every section after it to the other list.
  `scripts/test-pictures.cjs` fails when a section is missing from the
  lists or two neighbors share a color.

## The site's header and footer

- **Every page that is read or browsed carries the site's header and
  footer.** This includes the homepage, The House, the writing, word pages,
  section indexes (Words, Pictures, Trivia, Instruments), Moris and About.
  They come from `_layouts/default.html`. Use that layout for each new
  page of this kind. The House is entered like a room, with a shelf and
  desk whose contents can be read and a drawer for keeping things. It
  fits within the site's page layout, retains the header and footer and
  appears first in the site's menu.
- **A place that fills the window has its own quiet frame.** The Farm
  House, each picture in Pictures with Stories and each instrument follow
  this rule. Their frames provide a way back and the place's controls,
  leaving the rest of the window to the picture or tool. The author
  settled this in October 2026. Keep the site's header and footer out of
  these places and preserve each frame's design. Fix faults within them
  as needed.
- **A new place takes its family's frame.** A new instrument takes the
  instruments' bar, and a new picture takes the picture layout. Woodland
  paths or a river reached from the farm's garden remain scenes of The
  Farm House and keep its frame. Keep them within that world.
- **The way back leads to the place's own section.** An instrument leads
  to the instruments, and a picture leads to Pictures with Stories. The
  clock, reader and desk also open from The House's study. They retain
  their links to the instruments, while the browser's back button returns
  visitors to where they came from.
- **The Farm House belongs to The House.** Visitors enter it through the
  Polaroid on a shelf in the study. Its "← The House" link returns to
  `/house/#study`. Preserve that entrance and return. Keep a homepage
  link out of its frame so visitors leave the farm through the room
  they came from.

## Interface details

- **A disclosure uses the site's chevron.** Use the chevron found in the
  drawer and a piece's reading options to replace the browser's triangle.
  Keep the words where the layout
  places them, with the chevron hanging beside them so it leaves their
  alignment intact.

## Trivia editorial standard

`Trivia` holds quizzes. Adding one requires three files, as described
in `_data/trivia.yml`. The following rules govern their content.

- **A question earns its place through its note.** Difficulty has little
  value on its own. The note should give the reader something beyond the
  answer. It might explain that Big Ben cracked in its first months and
  that the crack gives the chime its tone. Another note might explain that
  the Romans knew Bath as Aquae Sulis, after a local goddess they folded
  into their own Minerva. Two or three sentences is the usual length.
  Rewrite a note that simply repeats the answer, and drop a question
  that cannot carry a worthwhile note.
- Source every claim before writing it down. Prefer museums, universities,
  dictionaries with etymological scholarship, archives and national
  institutions. For a sport's rules, use its governing body. Where a
  popular version is disputed, explain that in the note or leave the
  question out.
- Choose facts that will remain accurate. Current holders of titles and
  standing records can change, as can a living person's role. The bank
  is not revisited on a schedule, so leave out questions that would
  require regular updates.
- **The question must keep its answer out of the wording.** Naming the
  bear also names the station. Ask it another way or choose another
  question.
- All four choices must be plausible to somebody who does not know.
  Keep them in the same category and roughly the same length. A question
  about a monarch should offer four monarchs. Choose another set when
  several answers are obviously wrong.
- Write the right answer wherever it belongs in the list. The quiz
  shuffles questions and choices for every game, so readers encounter
  a fresh order. Manual balancing makes the source file harder to read.
  In the first bank, 29 of its 50 answers were written second. That
  imbalance led to the shuffle.
- A negative question, such as one asking for the "least typical" or
  using "not", is allowed. Keep it rare and make the negative unmissable.
- **Each category forms a round.** Every question carries a `category`.
  Store the bank grouped in the order the rounds should run. The quiz
  reads the round count from that structure. Aim for six to fourteen
  questions per round. Put a subject with fewer than six into a
  neighboring round.
- Order the rounds so the quiz opens on the easiest ground and ends
  with a subject broader than the narrowest one.
- Every question carries an `id` unique in its bank. Readers use it
  to keep questions in their drawer in The House. Preserve it when a
  question is reworded or moved, and give each new question a new id.
- Follow the site's prose rules and let the content carry the question
  and its note.
