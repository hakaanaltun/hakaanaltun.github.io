# AGENTS.md

## What this is for

The question behind this site is why the things that
would be good for people have not been made. It asks why people have been
steered toward accepting less and why money came before feeling. The
large companies grew with people without caring about them, and they grew
because there was no alternative. This site goes the other way. It grows by
caring about the people who come to it.

Every change has to answer to these rules.

- **Give the reader something, and take nothing they did not choose to
  give.** Add no tracking or engagement tricks that pull a reader back
  or hold them longer than they meant to stay. What a reader keeps stays
  with them. The drawer lives in their own browser. The one thing the site
  asks for, an email address for new pieces, waits at the end of an
  essay and is theirs to give.
  The one exception is a visit counter. GoatCounter
  (`_layouts/default.html`) counts visits to the pages that carry the
  site's header; the Farm House, the pictures and the instruments are not
  counted. It sets no cookies and keeps only totals. These include visits per page,
  the pages and sites visitors came from, and their country, language,
  browser, system and screen width. The author looks at it once a week.
  It is not loaded on the search page, so what a reader searches for stays
  with them. Add no other counter or analytics.
- **Never ask a reader to settle for less.** A half-made page or a drawing
  that does not work tells the reader they were not worth the care.
  A description that is not true does the same. If something cannot be made well, it waits.
- **The test is the reader's first look.** Someone who opens a page should be
  drawn into it. A page that leaves them wondering what this nonsense is
  has failed that test.

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
  Earlier renders are kept in `farm-house/retired/`, outside the published
  site. They are not part of the set.
- Let the story develop through occasional discoveries and small traces in
  the rooms. Give each addition time to settle. Preserve the unanswered
  questions in the existing story, including why the grandmother kept the
  letter and remained silent about it.
- Grow the house and its surroundings as connected places. The garden can
  lead to woodland paths and a river; rooms can hold traces of the past.
  Introduce the animals kept on the farm as well as wildlife in the forest.
  Plants and birds are part of the world visitors can learn to recognize.
- Complete the spring/summer setting first. For now, keep new scenes sunlit
  and suggestive of spring or summer. Autumn and winter views can follow.
  Keep the light natural in the watercolor scenes. Preserve believable
  differences between direct sun, veranda shade and window-lit interiors; avoid
  exaggerated yellow casts and glowing highlights. Shadows should retain
  differences in brightness.
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
  punctuation, following the editorial rules below. Fictional details should fit the established story.
- **The farm is set in the site's type.** Its prose is EB Garamond and its
  titles Cormorant Garamond, from `css/fonts.css`, as in The House and the
  pictures; its small labels keep the sans-serif they share with the
  pictures. Until 13 October 2026 the page used Georgia, and the author
  asked for it to match the rest of the site.

### Sound

The Farm House has an optional sound layer. It is off until the visitor
turns it on with "listen to the farm" in the footer. The choice is kept in
their browser (`olae-farm-sound`); sound left on waits for their first
click, because browsers start audio only from one. Every start and stop
fades over a second or two, and a hidden tab fades out and suspends the
audio until it returns.

- **The sound changes through the day.** Morning has sparse birdsong
  and a collared dove. At midday, soft wind accompanies cicadas in waves,
  with the dove heard now and then. Crickets sound in the evening. At night
  they are fewer, slower and quieter, with a scops owl also heard. The small birds and the crickets are not any one species. The dove,
  the owl and the cicadas represent particular species; the author asked for them in October 2026.
  Nothing on the page names a species.
- **The sound follows the scenes' summer season.** The time of day is
  the visitor's. The season is the picture's, which is summer in these scenes. The scops owl and the cicadas are
  summer sounds, and they go when autumn or winter scenes come.
- **The rooms soften the outdoor sound.** Outdoors the sound is low. In the rooms it is lower
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
- **Keep the floorboard creaks out.** Synthesized floorboard creaks were tried in October 2026
  and taken out at the author's request. Do not add them back unless the
  author asks.
- **The farm's sound follows the visitor's own sky.** The House stays
  in İstanbul. For the farm, the browser's time zone gives a city
  through `window.OLAE_SKY` (`_includes/sky-ramp.html`), as Follow the sky
  does, and the sun's height decides. Night begins when the sun is below −12°, or
  climbing but still below −6°. Morning lasts while it climbs to half its
  noon height. Evening starts once it sinks below 10° (or below 30% of the
  noon height on a short day). No location is ever asked for. Without
  `OLAE_SKY`, the clock assigns morning to 05–10, midday to 10–18 and
  evening to 18–22. Night follows.
- **The sound can be tested at any hour.** `?hour=19` (any value from 0 to 23.99) stands the clock at
  that time today, so each part of the day can be heard at any moment. The
  sky still decides, so which hour is evening moves with the season. In
  İstanbul in early October, 8 is morning, 13 is midday, 19 is evening and
  23 is night. It works only on the live site, so a change is heard there after
  merging; before that, publish a private preview of the built page. Never
  link to it.
- **Two scripts control the sound.** `js/farm-sound-engine.js` makes the sounds and
  nothing else, like `js/rain-engine.js`, whose pink noise it borrows for
  the wind. `js/farm-sound.js` holds the toggle and the scheduling, and
  near its top are the levels. `LEVEL` sets indoors, outdoors and a place's
  own sound (`near`); `HOUR_LEVEL` sets each part of the day. The birds were
  raised a little and the wind lowered after the author listened.
  The balance inside a part, such as one cricket against another, is set
  in the engine; so are the places that have a sound of their own and
  where each horse stands, in its `PLACES`. Bump the `?v=` on a
  script's tag in `farm-house/index.html` when it changes.
  `scripts/test-farm-sound.cjs` checks the behavior; only listening can
  check the sound, so listen on a phone before changing a level or a
  voice. Neither script is precached by `sw.js`; if that changes, bump its
  `CACHE`.

## Working on the site

This repository is a **Jekyll 4 static site** called "On Life & Everything",
a personal blog deployed to GitHub Pages through `.github/workflows/pages.yml`.
Ruby, RubyGems and Bundler 4.0.13 are preinstalled in the Cloud VM. At the
start of a cloud session, `.claude/hooks/session-start.sh` installs the gems
and the npm packages for the checks, restores the bundled PDF.js and makes
the Pictures cards' downscales. Gems go into the git-ignored
`vendor/bundle/`, as configured by `.bundle/config`.

### Running the site (dev)

- Serve the site with live reload using
  `bundle exec jekyll serve --host 0.0.0.0 --port 4000`, and open
  http://localhost:4000/. Run it in a long-lived tmux session.
- Build the site with `bundle exec jekyll build`. Output goes to the
  git-ignored `_site/`.
- Run `bundle exec jekyll build`, followed by `npm test`. Outside a cloud
  session, run `python3 scripts/vendor_pdfjs.py`,
  `python3 scripts/generate_image_variants.py --pictures-only` (it needs
  Pillow) and `npm ci` first. The PDF checks need the bundled PDF.js, and
  the Pictures cards need their downscales. CI runs the same checks on every
  pull request. Several checks read the built `_site/`.
  `scripts/test-content.cjs` checks the editorial rules that can be tested
  in code. These cover quiz-bank structure and rounds, word-story footnotes
  numbered in first-cited order, closed-up em dashes, the word joiners the
  build puts before them and links within the site. It reports every
  problem it finds in one run.
- `npm run links` fetches every cited source address. It runs weekly from
  `.github/workflows/links.yml`. Because it depends on other sites being up,
  it is kept out of pull-request checks. Only a page that is gone fails it.

### Non-obvious notes

- URLs use the "pretty" format. Source files such as `about.html` and
  `archive.html` are served at `/about/` and `/archive/`, with trailing
  slashes. Posts use the permalink pattern `/pieces/:slug.html`, set in
  `_config.yml`.
- **Old addresses send the reader on.** Pieces were served at
  `/essays/<slug>.html` until 30 May 2026, and search engines still list
  some of them. Each has a small page in `essays/`, in the same form as
  `pieces/handled.html`: `sitemap: false`, `noindex,follow`, an immediate
  refresh and a canonical link. `/essays/` leads to Writing, and `/writing/`
  and `/instruments/`, the menu's own names, lead to Writing and
  Instruments. When a page moves, point every old address at its new place.
  `scripts/test-content.cjs` fails on an address that moves on twice.
- `_config.yml` sets `future: true`, so posts dated in the future render
  as intended.
- The production Pages workflow uses Ruby 3.3. The VM's apt-provided Ruby
  3.2 also builds the site.
- `style.css` and `palettes.css` are linked once in `_includes/head.html`
  for every page that uses the default layout. Bump the `?v=` there when
  either changes.
- **A changed stylesheet or script needs a new `?v=` everywhere it is
  loaded.** `scripts/test-asset-versions.cjs` compares a pull request with
  its base branch and fails on any page, include or `_data` list that
  still loads a changed file in `css/` or `js/` under its old stamp. A
  stylesheet whose rules are unchanged, with only its comments edited,
  needs no bump. One was missed on 12 October 2026 and needed a pull
  request of its own.
- The published stylesheets and scripts carry no comments. After the
  checks, deployment runs `scripts/strip-css-comments.cjs` on `_site/css`
  and `scripts/strip-js-comments.cjs` on `_site/js`, and fails if any rule
  or program would change. The scripts in `js/vendor/` keep theirs, with
  their licences. Keep writing comments in `css/` and `js/`, where a local
  build keeps them. Styles and scripts inside a page's own `<style>` and
  `<script>` remain untouched.
- **This file is not published for now.** The Colophon (`colophon.html`)
  showed it at `/colophon/` until the author took the page down on
  8 October 2026, and `_config.yml` excludes both. `_plugins/agents_md.rb`
  still reads it without processing Liquid, so taking those two lines out
  brings the page back. Keep the site's prose and punctuation rules here,
  so that it is ready to be read. `scripts/test-content.cjs` checks its
  dashes and words split across line breaks. A split word would appear on
  the page as two (`hand- balancing`).

## Starting a session

Every session starts cold and remembers nothing of the last one, so what was
learned the hard way is written down here instead.

- **Build the working branch from `main`, before writing anything.** Branch
  names are reused across sessions here, so a branch that looks ready to
  continue may be carrying a pull request that was merged days ago. New
  commits stacked on merged history produce a pull request nobody can read.
  Start with `git fetch origin main && git checkout -B <branch> origin/main`.
- **A merge can land while you are still pushing, and nothing will say so.**
  This happened twice in one session: a prose fix was pushed after its pull
  request had already been merged, so it sat on the branch and never reached
  the site—and it was only caught later, by chance. Before opening anything
  new, check that the last commit you pushed is an ancestor of `origin/main`
  (`git merge-base --is-ancestor <sha> origin/main`) and carry over whatever
  is not. Ask to be told when a pull request is merged; it is cheaper than
  finding out.
- **Every test closes the windows it opens.** A jsdom window left open
  keeps its timers running, and the checks then never finish. On
  12 October 2026 one such check held the deploy queue for over an hour,
  and two merges waited behind it. The build now stops after twenty
  minutes, and pull-request checks have a queue of their own, so they can
  no longer push a waiting deploy out.
- **This site is read as pages.** Its author reviews a change by
  looking at it, which for a long time meant merging first and looking after.
  Build the site and hand over the rendered pages that changed and
  the index they sit in before asking for a merge. The author needs to read
  the actual paragraph in its page.
- **Say what changed.** A pull request description
  names the work and its shape; the line-by-line reasoning behind an edit
  belongs in the conversation. The public description outlives it.
  "The prose was simplified" is the right altitude.
- **Hand the pull request over as soon as it is open.** Do not wait for
  its checks to finish before telling the author. Their result shows on
  the pull request, and a failing check shows at the merge button. Run
  what can be run before pushing; if a check fails after the handover,
  say so and fix it. The author asked for this on 14 October 2026, after
  sessions kept stopping for minutes to watch the checks.

## Before showing anything

These rules record what went wrong on the day The House opened, so that
it does not go wrong again.

- **Look at it before anyone else does.** Passing checks say a page works. Its appearance still has to be judged. Build the site, open the page in a browser and look at
  every state it has: each hour of The House, a phone, the dark themes. A
  drawing can only be judged by looking at it. A Moris drawn from coordinates
  and never rendered reached the author, and it was not a cat.
- **Say "I can't" at the start.** Some things cannot be done well from here,
  and a likeness drawn by writing SVG coordinates is one of them. Say so
  before trying. The author should hear it before seeing the attempt.
- **Describe a photograph from the photograph.** Look at it before writing its
  alt text or a line under it, and ask the author about whatever the picture
  cannot settle, including where he is and what he is looking at. A line written for the
  drawn room was put under a photograph of somewhere else.
- **Report only what you have reproduced.** A problem named before it is
  confirmed costs trust twice, once when it is said and again when it is taken
  back. That day a header "covering" the room turned out to be a scrolled
  page, and "broken" photographs were only missing from a local build.
- **`/images/480/` and `/images/960/` are made at deploy** by
  `scripts/generate_image_variants.py` in `.github/workflows/pages.yml`. A
  local build has only the variants that are committed, so an image missing
  locally may be fine on the site. Check the live address before calling it
  broken. The same script makes `/pictures/assets/480/` and `/960/` for the
  Pictures cards on the index and the homepage, and
  `/pictures/space/assets/480/` and `/960/` for the journey's card in both
  places. These are never committed.
  In a cloud session the hook makes them for a local build; elsewhere, run
  the script with `--pictures-only`.

## Time, place and sky

The site has two deliberate ideas of place. Do not collapse them into one.

- **The general site follows the visitor's sky.** The Follow the Sky theme,
  `/twilight/`, `/sun/`, `/stars/` and the homepage's Tonight read the
  browser-reported IANA time zone and resolve it through `_data/cities.yml`.
  No location permission is requested. If the zone is unknown, keep the
  existing nominal-equatorial fallback rather than pretending to know the
  visitor's latitude.
- **The House is in İstanbul.** Its calendar day, light, sunrise and sunset,
  moon visibility, room period, Moris's movement, wall clock, and the
  balcony with its sky all use İstanbul time and coordinates
  (`Europe/Istanbul`, 41.015, 28.979). A visitor enters that place; the House
  does not move to the visitor.
- A link from The House to Twilight must preserve that place explicitly:
  `/twilight/?city=istanbul`. A normal site link to `/twilight/` should stay
  visitor-local and should not be labeled “İstanbul's Twilight.”
- Keep labels honest about which clock they describe. General site copy may say
  “today's twilight” or name the resolved city. House copy may say
  “İstanbul's Twilight” because the House deliberately stays there.
- The moon's phase itself is global at a given instant, but whether the moon is
  above the House's horizon is an İstanbul calculation. Do not confuse phase
  with local visibility.
- For an unknown zone, Tonight gives only the sun's times and the moon's
  phase. A map or a compass direction would claim a place the site does not
  know.

## The balcony

- **The House has a balcony beside the study.** The author asked for it on
  11 October 2026. Its glass door is in the study's right-hand wall, beyond
  the plant. The balcony is set into the corner of the house, so it looks
  the same way as the study window. Its right-hand side is glass above the
  parapet, like its front. The author asked for this on 12 October 2026,
  when the wall there made the balcony feel a little stifling. The wall on
  the left, with the door, is the house's own. `_includes/house-balcony.svg`
  draws it in the study's line style, in one-point perspective toward the
  horizon at 500, 285.
- **Both views look over the same place.** The house is close to the shore.
  Over the neighbourhood's roofs there is a strip of sea, and the Islands
  lie on the horizon, part of them behind taller blocks to the left. The
  author chose the Islands over a strip of the Bosphorus.
  `_includes/house-view.svg` draws the view once, with the horizon at
  222, and the window and the balcony both include it at three-fifths of
  that size, the window with its horizon at 222 and the balcony at 285, so
  they cannot disagree and the roofs come up to the sea in both. Until
  12 October 2026 the window drew it at full size, and its roofs sat well
  below the sea. The Islands' outlines
  are general, and no island is named. Through the side glass the roofs and
  the strip of sea go on to the west, beyond the window's sight.
- **A pine stands just outside, to the left.** The author asked for it on
  11 October 2026, for the birds it will bring and for snow and rain. It
  stood first on the right, and on 13 October 2026 the author asked for it
  to move to the left of the balcony, behind the place on the coping where
  Moris lies in the late afternoon. Its crown fills the left of the front
  glass from below the parapet to a little under the top of the glass, and
  narrows toward the top on both sides of the trunk. It stands beyond what
  the study window can see, so the window's view stays as it was. Its
  needles grow in rounded pads at the ends of its branches, tier above
  tier, with the sky and the sea showing between them; the star-shaped
  tufts drawn before 13 October 2026 read more as a fir. Each pad is drawn
  with its lit top and its snow after the pads behind it, so the pads in
  front hide the branches and the trunk here and there. A fuller crown was
  tried when it moved, and the author chose to keep it as sparse as it
  was. Snow lies on the pads in cushions while it falls and melts after.
- **The sky is İstanbul's, at this moment.** On the balcony the sun, the
  moon and the brightest stars and planets are drawn at their own bearing
  and height across the front glass, with east at the left wall and west at
  the corner on the right, from the sea's horizon up to the ceiling. A body behind the house is
  not drawn, and its name waits at the edge on its side. Within a day or two
  of the new moon the moon is lost in the sun's light and is not drawn. In
  the study window the sun and the moon stand just where they stand over
  the balcony, 63 higher, because both rooms show the view at one size.
  They are in the window only from the south-southwest toward the west; a
  morning sun is out of its sight to the left. The author asked for this
  on 12 October 2026, when the window's sun stood high in its casement
  while the balcony's sat low over the sea. Their
  places come from `js/astronomy.js`, and the stars and planets from
  `js/sky-map.js`, loaded once the balcony is dark.
- **Only the balcony's sun and moon lead to their pictures.** Each body
  and its name share one link on every screen. The study window has no
  Sun or Moon travel links, and the author decided on 12 October 2026 to
  keep it so: the window is for looking out, the balcony for going out.
  The balcony's Sun opens Pictures with Stories and its Moon opens the
  Moon scene in the Solar System journey.
- **They lead on only while the glass is open.** The author asked for this
  on 12 October 2026. While Moris is out on the balcony the glass is
  closed, the arrows go from the two names, and a touch on either opens a
  small box that says where it stands over İstanbul, gives the sunset or
  the moon's phase, and says that the glass is closed while Moris is out
  and that the way on opens when he goes back in. A way that is shut has
  to say so; it must never look broken.
- **The way back to the balcony stays for the whole journey.** A reader
  who came from the balcony keeps "← the balcony" at the foot of every
  picture they go on to, outside the painting: `js/pictures.js` carries
  `from` on every link to another picture, as it carries full screen and
  the places to look. Inside the Solar System journey the address keeps it
  already, since its scenes share one page.
- **The House follows İstanbul's weather.** `js/house-weather.js` fetches
  Open-Meteo's current model data for the House's fixed coordinates every
  fifteen minutes while the tab is visible. It requests no visitor location.
  A short session cache avoids a new request on each return; data older than
  ninety minutes are rejected. Until the first answer the page says it is
  checking. An outage leaves the astronomical sky alone and the page says
  that weather is unavailable. Open-Meteo is credited on the page. Its model
  data guide the illustration; passing clouds do not claim to reproduce the
  sky outside. Rain and snow fall without a pause for as long as the data
  report them, as the author asked on 12 October 2026, so the line under the
  rooms always agrees with the picture. Snow settles on the pine and along
  the glass while it falls and melts once İstanbul's snow ends. Overcast and
  fog hide the sun, moon and stars; broken cloud covers and reveals them
  slowly. The first report replaces the sky the page opened with at once, so
  rain never falls while the sun is still fading. Both rooms share the
  weather. Covered bodies have no invisible travel targets. The footer's
  manual rain and snow override this for the visit. Stopping them, or Follow
  İstanbul weather, returns the rooms to the city at once; until 12 October
  2026 stopping them left a clear sky. The same two buttons stand again just
  under both rooms, before Follow İstanbul weather, as the author asked on
  12 October 2026: the footer's snowflake and drop, with its names and its
  steps, and a touch there presses the footer's own button, so the two never
  disagree. A reader who has used them by the rooms knows them at the foot
  of every other page. They are not shown at the door, where there is no
  sky. İstanbul's temperature, in whole
  degrees with a minus sign below zero, stands after the time in both rooms'
  bars and nowhere else, as the author asked that day. It stays İstanbul's
  while a reader's own weather falls. On a phone the time and the
  temperature form the bar's second line, so the room's name keeps to one.
  Automatic weather never scrolls the page, and it starts no audio the
  reader has not asked for (see the balcony's sound below). Reduced motion
  keeps precipitation still and does not cycle the passing clouds.
- **The balcony is glazed.** Folding glass panels stand on the parapet up to
  the ceiling, along the front and the right-hand side. Moris goes out to
  the balcony twice a day, as the author asked: from noon to two, and again
  from two hours before sunset until half an hour before it. At midday he
  sleeps on the empty chair, and in the late afternoon he lies on the coping
  by the glass, looking out; the author asked for both on 12 October 2026.
  In between he is on his cushion, and as the sun goes down he is asleep at
  the window. While he is out there the glass is closed and the door to the
  study stands open; while he is indoors the door is shut and the glass is
  folded away into the right-hand corner. The author settled the glass on
  11 October 2026 and the door on 12 October 2026: a cat is never shown on a
  balcony that is not safe for him. Do not draw Moris on the balcony with
  the glass open.
- **The door opens into the study.** It is hinged on the side nearest the
  study's entrance and folds back almost to the study's wall, clear of
  the plant that stands beside it. It stands a little off the wall, turned
  twelve degrees toward the room, as the author asked on 12 October 2026. Its handle is on the other side, toward
  the front of the house, in both rooms; until 12 October 2026 the study
  drew it on the hinge side. The door is wood below and clear glass above.
  The author asked for this on 12 October 2026, when its glass was a plain
  tint and neither room could be seen from the other while it was shut.
  The handle stands on the wood beside the glass. Through the glass, as
  through the open doorway, each room shows the other in that room's own
  light. From the balcony the study's wall, floor and plant show through
  it, and from the study the sky and the strip of sea to the west over the
  balcony's parapet, and its floor. While the door is open Moris is out,
  so the balcony's glass is closed and shows on its far side. That far side
  runs into the picture like the study's own right-hand wall, so the
  parapet's coping and its foot meet at 500, 222; until 12 October 2026
  they were drawn level and the glass as a plain tint, and the doorway
  looked like a flat panel. Only the sky is cut out of the study's dusk
  mask; the parapet and the floor darken with the room, and after sunset
  the balcony's lamp lights them through the shut door's glass. In the study
  the open leaf falls almost wholly outside the picture, so two brass
  hinges on the jamb nearest us show where it turned; the author chose
  this on 12 October 2026 over standing the leaf at a right angle, which
  would have covered either the view or the plant.
- **What is on the balcony.** Two chairs face each other across a small
  round table, as the author asked. A book lies on one chair, and a
  notebook with a pencil on it and a glass of tea are on the table. A small
  olive grows in a pot tucked into the right-hand corner, where the parapet
  turns. The view is The Breath. A link from the balcony carries
  `from=balcony`.
- **The notebook takes a note.** On 12 October 2026 the author took The
  Reader and The Page off the balcony and asked for the notebook to open a
  page to write on instead. What is written there stays in the notebook,
  in the drawer's record as `notebook`, until the reader keeps it or takes
  it on. "Keep in your drawer" makes it a note in the drawer, under The
  notebook, and it leads back to the balcony and has no card. The kept
  page stays open in the notebook for the rest of the visit, under "Kept
  in your drawer.", and what is changed there is changed in the drawer.
  "A new page" and "Take out" stand where Keep was, as the panel by a kept
  passage offers Take out; taken out, the words stay in the notebook. The
  author asked for this on 12 October 2026, when a kept note vanished from
  the notebook with only a line at its foot. "Open your drawer" is there
  from the start, as the author asked the same day, so the earlier notes
  can be read and changed while a new one is written. The drawer opens in
  the same box with "← Back to the notebook", and the page being written
  waits there. "Write at length on The Page" carries the words to The Page,
  as every note on the site does (see Reading options). With nothing
  written it is only the way to The Page.
- **The study's lamp is seen from above.** It stands below eye level, so
  the rim along the foot of its shade curves down toward the viewer and the
  opening the light comes through is out of sight. Until 12 October 2026
  that opening was drawn as an ellipse, which read as a shadow while the
  lamp was off. Lit, the shade glows most toward its foot.
- **Tea and coffee take turns.** The balcony's tea glass and saucer appear
  during the House's morning and evening periods, following İstanbul's sky.
  During those periods the study's coffee cup, handle and steam are absent.
  During the day and night periods the coffee is present and the tea is
  absent. Both rooms use the same `data-hour` value, including while open.
- **A lamp hangs on the left-hand wall.** The author asked for it on
  11 October 2026: a glass globe with a yellow light. It hung first on the
  right-hand wall beside the pine; when that wall became glass on
  12 October 2026 it moved to the left-hand wall, near the front glass,
  where it lights the chair with the book. It is on in the evening and at
  night until the reader puts it out, and off by day until they light it.
  Their choice is kept in the drawer's record as `balconyLamp`, apart from
  the study's lamp. A little of its light reaches the near side of the pine,
  and only after sunset. Its switch is out on the balcony, on the same wall
  beside the door to the study, a little higher than the handle. The author
  first had the switch put in the study and moved it out on 11 October 2026.
  A touch on the globe changes nothing. While it is lit, as a small joke,
  its light goes and comes back once or twice in well under a second; the
  author asked that an unlit globe stay dark. The status line points to the
  switch either way. After sunset each room's lamp shows in the other
  through the glass of the door.
- **The balcony is heard.** The author asked for this on 12 October 2026.
  "Listen outside" stands under the balcony's picture, beside the way back
  to the study, for as long as the reader is out there. The sound is off
  until the reader asks for it. Their browser remembers the choice
  (`olae-balcony-sound`), and sound left on waits for their first touch,
  click or key. Nothing is heard in the study, as the author asked. The
  author also asked that the way to stop the sound always be in plain
  sight, so the same button reads "Stop the sound" wherever it can be
  heard. Elsewhere on the site the footer's rain and snow stay silent:
  sound comes only where a reader asks for it by name, as on the essays,
  the farm and the balcony.
- **What is heard is İstanbul's, at this hour and in this month.** The
  House's hour and İstanbul's temperature decide, never the visitor's. A
  low hush of the city and the sea is always there. The gulls call by day
  and now and then at night: the gulls that live in Türkiye do not migrate
  (Bilim ve Teknik, July 2016), and in cities they nest on rooftops (Bilim
  Çocuk). Small birds chirp on the roofs by day, busiest from March to June
  and quietest in July and August (RSPB). Field crickets sing on warm
  evenings from May to July, only above 13 °C; tree crickets sing on warm
  evenings and nights from July to October, more slowly and with longer
  rests as it cools. The insects sing in spells with long silences
  between, as the author asked on 12 October 2026, when they had sung
  without a pause: on a cool October night about a fifth of the time, on
  a warm summer night about a third. `scripts/test-house-sound.cjs` holds
  them to it. A ferry's horn sounds now and then between seven in
  the morning and midnight, while the ferries run: one prolonged blast of
  four to six seconds (COLREGS, Rule 32), its pitch within the range Annex
  III gives a ship's whistle. The small birds, the gulls and the insects
  are not any one species, and nothing on the page names one. The sources
  for each voice are beside it in `js/balcony-sound-engine.js`.
- **Rain and snow.** Rain, İstanbul's or the reader's, is the essays' rain
  from `js/rain-engine.js`, and the birds and the insects fall quiet in
  it. With the glass folded away everything is clear. While Moris is out
  and the glass is closed, everything, the rain with it, is quieter and
  loses its top, as the author asked. Snow falls without a sound and
  hushes the rest.
- **Two scripts make it.** `js/balcony-sound-engine.js` makes the sounds
  and nothing else, as `js/farm-sound-engine.js` does for the farm.
  `js/house-sound.js` holds the button, chooses the voices by the hour,
  the month, the temperature and the weather, and sets the levels near its
  top. Only listening can check them, so listen on a phone before changing
  a level or a voice. `scripts/test-house-sound.cjs` checks the behavior.
  Bump the `?v=` on a script's tag in `house/index.html` when it changes.
  A new voice, a bird above all, is checked with its season against
  reliable sources before it is heard.

## The Sun, The Stars and Tonight

- **`js/bright-stars.js` is generated.** Change `scripts/build_sky_data.py`
  and run it with the three pinned sources named at its top: the Bright Star
  Catalogue, the IAU's catalogue of star names and d3-celestial's
  constellation lines. Do not edit the data by hand. T Coronae Borealis is
  left out, because the catalogue gives it the brightness of its 1866
  outburst, and Mira and chi Cygni are not drawn, because their brightness
  on a given night is unknown. The notes on `/stars/` say so.
- **One sky calculation serves three places.** `js/sky-map.js` works out and draws the sky for
  `/stars/`, the homepage's Tonight and The House, so they never disagree.
  Its scripts and their `?v=` are listed once, in `_data/sky_scripts.yml`.
  The homepage fetches them when Tonight comes near; The House only when its
  window is opened after dark, or when its balcony is dark.
- The moon's phase name and percentage come from `js/astronomy.js`
  everywhere, so The Moon, The House, Tonight and The Stars give the same
  moon. Positions of the moon and planets come from Astronomy Engine. The
  House draws the sun and the moon from `js/astronomy.js`, whose moon is
  checked against Astronomy Engine in `scripts/test-house.cjs`.
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
- **"read with rain" stays under the title.** Rain that is falling has
  to show where it can be stopped.
- **A selected passage can be kept, written about or highlighted, and
  only Highlight marks the page.** The author asked for notes and
  highlights on 10 October 2026, and asked that selecting, translating,
  keeping or writing a note never mark a passage by itself. The prompt
  over a selection offers Türkçe, Keep, Note and Highlight (`js/keep.js`,
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
    drawer, which opens the drawer over the page, as the header's does.
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
    was taken out then. The link carries its way back (see The way back).
    From the drawer, The Page's way back says "your drawer" and returns to
    the drawer as it was. From a passage on a page it names the piece, the
    word, the quiz, the book or The Reader and returns there. Taking out
    something with a note asks twice.
  - The mark is drawn with the CSS Custom Highlight API, so the page's
    text is never wrapped or changed. A browser without it is not offered
    Highlight, and paper never shows a mark. A passage is found by its
    words, so one whose words have since changed loses its mark and stays
    in the drawer.
- **Türkçe is found, not announced.** On 14 October 2026 a line in
  Turkish told browsers set to Turkish, in a piece's reading options and
  on a quiz's first panel, that a selected sentence opens in Turkish. The
  author asked the same day for it to be taken out. The translation runs
  on the free daily allowance of Cloudflare Workers AI, 10,000 Neurons a
  day, through `translate.hakanaltunn.workers.dev`. Once the allowance is
  used up, Cloudflare answers with error 3036 and the reader is told that
  the daily limit has been reached. Something whose use is limited should not be put forward,
  and a line for Turkish alone raises the question of why no other
  language is offered. Türkçe stays in the prompt over a selection. Do not
  add a line about it back unless the author asks.
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
- **Listening and offline saving were tried and taken out** in October 2026.
  Device voices are not on every device, and offline copies put the service
  worker in front of every page. "Print or save as PDF" is the way to keep
  a piece. Do not add them back unless the author asks; listening that works
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

## Words with Stories collections

- **Keep the complete alphabetical index alongside the collections.** The earlier A–Z layout lives at `/word/alphabetical/`, linked near the end of `/word/` as “All the words in alphabetical order.” It includes every existing entry, including words not yet assigned to a collection. Keep each word's URL unchanged and the alphabet jump navigation intact; collection reading arrows remain thematic.
- The public `/word/` index is organized into twelve curated thematic collections in `_data/word_collections.yml`. Each group has a plain introduction and an approximate historical order based on the older meanings, documented events or periods behind its words, rendered by `_includes/word-collection.html` on `/word/<group>/` pages. A word may belong to only one primary group.
- Existing individual `/word/<slug>/` URLs and all source citations remain unchanged. Arrows on grouped stories stay within their own group, and the label above the word returns to its collection.
- A word outside every group remains available by its URL, in site search and in the existing Words RSS feed, but waits off the curated Words index, the homepage random-card selection, The House's word cards and its "A new word" at the door until there is a meaningful group for it. The author asked on 13 October 2026 that The House follow the homepage here. The House's catalog still lists every word, marked `collected` or not, so a word a reader kept earlier keeps its current story in the drawer.
- Group order is chronological in broad outline, not a ranking of precise first English attestations. The date of a root, a historical event and a word's modern sense may differ; never invent a definitive date to resolve overlaps. New words take their approximate place without creating a contrived beginning or ending to the group.
- Optional connections live in `_data/word_bridges.yml` and appear after individual word sources. Use them only for grounded links, and state whether a link is an etymological relationship, a historical parallel or a shared theme. Do not imply shared word origins when there are none; unconnected entries are fine.
- Group stories must remain sourced and accurate. Shared themes do not establish shared etymology. Review both the individual story and its relationship to the group's introduction before assigning a word.
- Preserve the restrained typography and accessible ordinary links. Do not create empty or token groups merely to publish another word.
- On 13 October 2026 the author asked for the waiting words to be placed where a collection fits them. *algorithm*, *pamphlet* and *guy* joined The Names That Remained, *assassin*, *magazine* and *juggernaut* joined Words That Travelled, and *utopia*, *serendipity*, *x-ray* and *petrichor* became a ninth collection, Words Made on Purpose, for names whose first appearance can be traced to a page. Three loose sets of three were left waiting rather than made into small groups: *window*, *lens* and *camera* (seeing); *malaria*, *vaccine* and *muscle* (the body); *idiot*, *candidate* and *inaugurate* (public office). The same day *biscuit* and *emoji* joined Words That Travelled, and *text* and *Rosetta stone* joined Learning to Learn; the Rosetta stone's story lost two lines written for effect and a second statement of its definition. Six more wait because no collection's introduction fits their story: *climate* began with the angle of the sun, which is geography and holds no belief about the sky; *cobalt* is a miners' goblin and says nothing of what work is worth; *broadcast*, *farce*, *decimate* and *apron* have no collection near them.
- On 14 October 2026 the waiting words were placed and new collections were added: Seeing & Light (*window*, *focus*, *lens*, *camera*), The Body (*muscle*, *anatomy*, *placebo*, *malaria*, *vaccine*) and Public Life (*idiot*, *candidate*, *inaugurate*, *parliament*, *ballot*). *focus*, *anatomy*, *placebo*, *parliament* and *ballot* were new that day, and *cobalt* joined Work and Worth. The same day the author settled the rest. *silhouette* stays in The Names That Remained, whose introduction fits its uncertain story. Words That Changed Shape (*farce*, *apron*, *broadcast*) was taken down until it has enough words with a change of form to stand on: when suitable words come, look at them for this group, and it can return with them; meanwhile `/word/changing/` leads to the collections. *climate* and *decimate* wait until a group opens that fits them, so The Sky Above Us keeps its introduction about belief, and Public Life says nothing of military punishment. `scripts/test-house.cjs` does not depend on any word waiting: it checks that every word is listed for the drawer, and sets one aside in its own copy of the catalog to check that a waiting word is not announced as new.

## Words with Stories editorial standard

`Words with Stories` is a deliberately small, curated collection. A term should be added only when its story earns its place.

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
watercolor illustrations whose areas can be opened to learn about what is
shown. Apply the `Words with Stories` standards for curation, sourcing,
accuracy and plain prose to this section as well.

- **The catalogue is grouped by subject.** Space holds the black hole,
  the quasar, the Sun and the journey through the Solar System. Nebulae can follow,
  with birds, cats and other subject groups added as the collection grows.
  The group was called "The Space" until 9 October 2026, when the author
  renamed it. In English, space in the astronomical sense takes no article,
  and "the space" reads as a particular room or area. Each picture carries its
  group in its `category` field. Keep existing picture addresses stable
  when grouping them. Every group follows the same drawing, storytelling
  and sourcing standards.

- **The journey is to be made anew.** On 14 October 2026 the author said
  that the journey's paintings and the journey itself will change
  completely. Until the new one is finished it stays out of search; then
  add it, as the Search section describes.

- **Through the Solar System is a sourced watercolor journey.** In
  October 2026 the author clarified that realistic means scientifically
  grounded watercolor, like the black hole, rather than spacecraft
  photographs. The journey keeps its first address, `/pictures/space/`. It
  begins near Earth and opens connected watercolor
  scenes, following the Farm House's garden-to-veranda-to-room structure.
  Touching a world's body travels to its scene; touching its separate name
  label opens sourced information. A scene can carry several detail labels.
  Show only destinations available from the current scene. Beneath the
  picture, the way back and the way on sit together, each named for its
  world ("← The Moon", "Jupiter →"). The author asked for the way on on
  9 October 2026, so the next world never has to be found by touching it.
  A scene's `back` and `next` in the front matter set them.
  The journey covers Earth's vicinity, a closer Earth view, the Moon, Mars,
  Jupiter, Saturn, Uranus, Neptune, Pluto, Venus and Mercury, including the ISS near Earth,
  Io and Europa beside Jupiter, Titan and Enceladus beside Saturn, Miranda
  beside Uranus, Triton beside Neptune, and Charon beside Pluto. Keep recognizable geography, lunar markings, lighting,
  paper and brushwork consistent across connected views. Sizes, distances
  and viewpoints are arranged for exploration, explained below the picture.
  This is an illustrative journey rather than a live sky or a flight path.
  For the journey, the existing black-hole and quasar paintings are the visual
  references: layered pigment, rich neutral darks, selective detail and natural
  watercolor edges. On 9 October 2026 the author chose a newly composed
  Earth–Moon set made from scratch; the earlier Earth–Moon renders are not
  style references. They are kept in `pictures/space/retired/`, outside the
  published site. Keep the ISS tiny and close to Earth's limb, and leave
  breathing room around Earth in the closer scene. Use the approved new
  scenes to preserve geography and lighting when extending the journey.
  All eight planets now belong to the journey.
  In the approved Moon and Jupiter scenes, fine detail covers the whole
  globe. From Saturn on, keep detail selective, as the black hole does:
  gather it where a label points and leave the rest of the globe in broad
  washes. Saturn’s sourced ring note follows Galileo’s unresolved view in 1610
  and Huygens’s ring explanation, published in 1659. The other notes cover
  Saturn’s rotation, the Cassini Division, Titan’s haze and methane rain,
  and Enceladus’s ice and subsurface ocean. The moons are enlarged separately
  and their visible markings simplified, as the illustration note explains.
  An oval crop preserves Saturn’s rings in the small destination at Jupiter;
  `paint_ratio` controls this without changing existing round destinations.
  Uranus adds its atmospheric color, sideways rotation, the 1977 discovery
  of its rings through stellar occultation, and Miranda’s varied terrain and
  literary name. Miranda follows the large terrain divisions in NASA’s Voyager
  mosaic PIA01490. Its scale and terrain are illustrative; Uranus’s faint
  rings have enhanced contrast, disclosed below the painting. The angle of
  the rings on the page is a chosen view, not a measurement of axial tilt.
  Neptune follows Uranus with its discovery through orbital predictions,
  its revised blue-green color, the 1989 Great Dark Spot, and Triton’s
  retrograde orbit and polar streaks. Oxford’s 2024 color reconstruction
  guides the restrained palette. The storm is explicitly historical; Hubble
  found it had disappeared in 1994. Triton’s broad terrain follows Voyager
  mosaic PIA00317. Its enlargement and simplified deposits are disclosed.
  The next destination in the Uranus scene sits in clear upper-left space,
  away from the rings at upper right.
  Pluto adds its dwarf-planet classification, Sputnik Planitia’s nitrogen-ice
  convection, Charon’s discovery and mutual tidal locking, and the modeled
  transfer of material from Pluto to Charon’s reddish pole. Natural-color
  New Horizons views guide both globe portraits. They show separately
  arranged encounter hemispheres, with illustrative sizes and separation.
  Pluto now leads to Arrokoth in the Kuiper Belt. Its outline and broad
  markings follow New Horizons’ 2019 enhanced-color composite; the palette,
  simplified terrain and illustrative lighting are disclosed. Four sourced
  notes cover the Kuiper Belt, the flyby, the gentle-merger interpretation
  and surface chemistry. Use the primary spectroscopy paper for composition:
  methanol was detected, while water ice was not detected in that analysis.
  The pale neck label sits beside the junction. An oval crop carries both
  lobes into Pluto’s destination portrait, with the label toward the frame’s
  center. Return travel leads to Pluto.
  The Kuiper Belt now leads to Voyager 2, then a separate deep-space scene,
  then Voyager 1. On 11 October the author rejected both craft in one painting:
  each must be alone, with an intervening passage through space. The author
  also noted that planetary transitions do not use a distance scale. Keep
  that rule throughout: a passage changes viewpoint, and its length never
  measures the gap. Keep this separation. The author later added two small
  navigation portraits within deep space: Voyager 2 at upper left returns,
  Voyager 1 at upper right continues. Reuse crops of their own paintings.
  These are destinations in the interface, with body travel and separate
  information labels, not a view of neighboring spacecraft.
  The Kuiper Belt lies earlier in the journey, nearer
  the Sun; do not move it between the spacecraft. Hardware follows NASA/JPL
  model PIA14111 with simplified details. Neither Voyager visited Arrokoth.
  Seven notes cover the different routes, their separation, the heliopause,
  the Golden Record, RTG power and Pale Blue Dot. The separation note uses a dated Horizons
  calculation recorded in `scripts/voyager-separation.json`, rather than a live
  distance counter. Keep the record label beside its small cover.
  The heliopause is distinguished from the Sun’s gravitational reach and the
  inferred Oort Cloud. Use the 2018 crossing announcement for Voyager 2’s
  November 5 date; its general mission table contains a November 25 typo,
  and older FAQ text still predates the crossing. Avoid undated claims about
  current distances, instrument status or power. On 11 October the author
  chose to keep Carl Sagan and Pale Blue Dot within the Voyager material.
  The Golden Record note includes its contents, the pulsar address and the
  survival argument in Sagan and William Newman’s 1983 paper, page 120:
  long-lived technological civilizations may have had to control aggression
  to avoid self-destruction. Present it as their reasoning, with uncertainty
  preserved. The author recalled a story that Sagan persuaded colleagues
  using this argument; that specific meeting and outcome remain unverified.
  Do not substitute his separate Arecibo radio-broadcast argument for this
  idea. A label on Voyager 1’s instrument assembly opens Pale Blue Dot,
  with NASA’s photograph linked from the note. No separate Sagan scene or
  Pale Blue Dot destination is needed.
  On 11 October 2026 the author asked for a way home at the end. Voyager 1's
  way on and a small Earth portrait at its upper right lead back to Earth,
  where the inner branch to Venus begins. The portrait is a navigation link,
  disclosed in the illustration note. The author also asked for both Voyager
  paintings to be repainted so that they no longer repeat one view, along
  with Venus's lighting and Arrokoth's volume, and for a way into the
  deep-space passage that can be seen in each Voyager painting. The
  requests, their prompts and the coordinates to update afterward are in
  `scripts/space-art-direction.md`.
  Venus branches inward from Earth. Its opaque cloud cover has
  restrained contrast informed by Mariner 10 and ultraviolet observations;
  no surface terrain is visible. Magellan is an enlarged historical portrait,
  with its dish and two solar panels simplified from NASA/JPL’s mission image.
  The notes distinguish the 243-day rotation period from the 117-day solar day,
  and explain that Venus’s phases supported its solar orbit while also fitting
  Tycho’s alternative. Magellan’s radar maps and evidence of a 1991 eruption
  connect the visible spacecraft with the hidden ground. Mercury completes
  the eight planets, adding Caloris, its long solar day and evidence of polar
  ice. Its surface follows MESSENGER’s January 2008 view; the whole-globe
  painting does not show individual ice deposits.
  On 10 October 2026 the author corrected the route. Do not connect Venus
  directly to Pluto. Earth branches inward to Venus, then Mercury; the Moon
  leads through Mars and the outer planets to Pluto. An always-visible named
  branch link accompanies Earth’s painted Venus. These are exploration
  choices, not simultaneous apparent positions or a spacecraft flight plan.
  The Sun has its own full-page picture and sourced story at `/pictures/sun/`,
  distinct from the existing instrument at `/sun/`. Mercury shows a small Sun.
  Touching its body opens The Sun’s
  page; its label opens a short explanation ending with "Go to The Sun".
  The Sun page links back to Mercury and keeps the picture family’s frame.
  On the Pictures index it comes right after the journey’s card, as the
  author asked on 10 October 2026: a picture with a `journey_url` leads
  its group.
  Its composite view combines photospheric spots, a prominence and an enhanced
  corona; the page explains the observing methods and artistic colors. The
  story follows rotation, Cecilia Payne’s composition work, fusion, the
  corona’s spectrum and Parker Solar Probe. Do not describe the brush texture
  as resolved solar granules. On 13 October 2026 the author asked for the
  Sun's four notes to be told as the journey's notes are, each with how its
  part came to be seen or understood: Fraunhofer's dark lines for the
  photosphere, Hale's magnetic fields and Schwabe's cycle for the spots,
  the helium line of 1868 for the prominence and Lyot's coronagraph for the
  corona. The illustration note below the picture carries what the painting
  combines or strengthens; a note repeats it only when its explanation
  depends on it. The same day the black hole's notes took that form too:
  Cygnus X-1 for the disk, the 1919 eclipse for the bent light,
  Schwarzschild's solution for the shadow and the brighter side of M87's
  ring. The quasar's faint jet gained the apparent faster-than-light motion
  measured in 3C 279, and Earth's note in the journey gained the Blue
  Marble. The black hole's story lost its paragraph on wormholes, which did
  not help a reader see the picture, and is now titled "Drawn before it
  was seen". Small destinations at the right edge can use
  `label_edge: left` to keep their labels inside a phone’s picture.
  Complete all eight planets and selected important Solar System features
  before closing the journey with Voyager 1 and Voyager 2. Explain their
  positions and what crossing the heliopause means without claiming that
  they have passed every definition of the Solar System’s boundary.
  More distant objects are outside this journey’s agreed ending. After this
  work, build the Amazon rainforest exploration, then return to The Fragments
  for its final revision. The general AI note in Notes covers these pictures.
  Earth vicinity, Earth and Moon were approved as one coherent section before
  extending to Mars. The Moon’s small Mars destination reuses a crop of the
  Mars painting, preserving the approved lunar scene. Mars has sourced labels
  for its iron-bearing dust, Olympus Mons, Valles Marineris and north polar
  ice. Its painting emphasizes relief; the illustration note explains this.
  Mars now leads into the asteroid belt, with separate close portraits of
  Ceres and Vesta. Dawn images guide their terrain. The notes explain the
  belt’s empty space, Ceres’s discovery, Occator’s reflective salts and the
  evidence linking meteorites on Earth to Vesta. The portraits are enlarged
  separately; their separation is illustrative. Keep the salt label beside
  its deposits. Ceres’s small portrait connects Mars and Jupiter in both
  directions. Jupiter’s notes cover its interior, cloud bands,
  Great Red Spot, Io and Europa. Both moons are enlarged independently for
  their details, disclosed in the illustration note. Small cropped worlds
  connect the scenes without repainting approved assets.
  The opening view should leave ample space around a
  smaller Earth so arrival at its closer view is unmistakable. Choose the
  sourced details before painting a new scene. Preserve recognizable forms
  and reserve named landmarks for features verified against references.
  Name labels follow the Farm House's hover, focus and optional hint behavior.
  The pictures, the journey and the Farm House have no permanent white dots. Labels appear
  on hover or keyboard focus; Show places to look keeps names visible on
  every screen, including phones. Preserve full touch targets and keep
  labels close to their subjects without covering nearby travel targets.
  When names crowd a narrow painting, a spot's `hint_x` and `hint_y` move
  its label by a few pixels and leave its place where it is, as in the
  standalone pictures. They apply whenever the painting is 700 pixels wide
  or less, which includes short laptop screens and phones held sideways as
  well as phones. With Show places to look on, check every scene of a
  changed section at 360 pixels wide and on a 1366 × 768 screen.
  Worlds and details share one label style, the small sans-serif of the
  Farm House and the standalone pictures; they differ only in when their
  labels appear. In the list beneath a scene, a world that can be visited
  is named once and followed by "go there". Keep "go there": without it,
  a world's name in the list opened its information while the link back
  beneath it, carrying the same name, traveled there. The author kept it
  on 9 October 2026 after trying the list without it. Inside a sentence, a
  name keeps a lower-case article: "Travel to the Moon".
  Pale Blue Dot is now explained through Voyager 1, with Sagan’s role in the
  photo and the Golden Record. The full copyrighted passage would still need
  written permission if the author later chooses to include it.
  Preserve stable picture addresses, keyboard access, reduced motion,
  optional visible labels, native fallback reading, and fullscreen.

- Follow The Farm House's watercolor language: broad brush strokes,
  transparent washes, a limited value range, visible pencil, occasional
  unfinished edges and exposed paper. Paint from scientific or historical
  references when the subject calls for them; preserve the forms that an
  explanation relies on. The Farm House's fixed scenes remain its own set.
- Use The Farm House's way of exploring: quiet areas on the picture,
  optional labels, named choices on a small screen, and a closer view
  alongside each explanation. Provide keyboard access and a way back to the
  picture. Sources sit below the explanation as links, with the full source
  list below the picture.
- Every clickable explanation must be sourced. Verify its factual claims
  before writing, and link to sources that support those claims. Prefer
  museums, universities, academic publications, archives and official
  institutions; use multiple sources when useful.
- **The clickable details carry the picture's stories.** Every picture
  must have sourced details with stories worth telling. Each explanation
  should help the reader understand the part they opened and change how
  they see it. Let the subject determine the number of areas.
- **Choose the subject through its details first.** Ask whether there are
  enough story-worthy details to earn the picture's place; this is required.
  Then ask whether there is an interesting account of how we came to know
  what it shows. Such an account gives a candidate priority, but remains
  optional. Give a clear one-sentence answer to: "Why this picture rather
  than hundreds of others?" If the details cannot justify it, let it wait.
- Describe what an illustration shows without attributing its painting to
  "we". Use the subject directly or wording such as "shown here". The AI
  disclosure in Notes covers these pictures; do not repeat it in their
  source sections.
- Keep the illustration accurate enough to support its explanations.
  Distinguish observed features from reconstructions and artistic choices
  where that distinction matters.
- If a claim is disputed or cannot be confirmed, explain the uncertainty or
  leave it out. Keep the prose plain and unshowy, following the same writing
  rules as `Words with Stories`.
- **A separate story below the picture is optional.** Include it only
  when there is a worthwhile account to tell. Never add a long passage
  merely to fill the page; leaving it out is better than forcing it.
  Something that cannot be made well waits. Source each part as carefully
  as the clickable explanations. For scientific subjects, identify
  speculative ideas as such and distinguish mathematical predictions from
  observations. A sourced account of a theory is evidence that it was
  proposed. Its confirmation still requires evidence. If an anecdote is retained
  without a verifiable source, say that explicitly and do not present it
  as an established fact.
- **The reader should see more when they return to the picture.**
  Judge every explanation and separate story by asking, "After reading it,
  does the reader notice or understand more in the picture?" Clickable
  explanations open its details; a separate story connects them. Let the
  subject determine the story's length.
- **Let the subject choose its story and its opening.** "How do we know
  this?" is one useful way in: the observations, evidence and interpretations
  that let us understand what is shown. The history of its first drawing
  may belong here when it helps. Possible openings include the seismic
  evidence for Earth's interior, early microscope observations of cells,
  or changing fossil reconstructions of Iguanodon. The black-hole story
  already follows this approach. Other subjects may carry their stories
  through their lives or relationships. The following are possible examples:

  - A bird may have a migration journey, a story behind its name, or a
    meaning people have given it.
  - A nebula may be understood through its formation and the changes ahead
    of it, with the picture's details opening parts of that process.
  - A cat may lead to its history of living with people, or to the reason
    behind a behavior shown in the picture.

  Verify and source the particular claims before using any example. Keep
  observation, inference and artistic reconstruction clear; speculation
  follows the evidence, marked as such.
- **Three candidates are waiting their turn.** Each has a one-sentence
  answer to "Why this picture?" Each claim below still needs a primary
  source before anything is painted or written.

  - The white stork. In 1822 a stork reached Klütz in northern Germany
    with an African spear through its neck. It showed where storks spend
    the winter, at a time when some people believed birds hibernated. The
    bird is kept in the University of Rostock's zoological collection.
    Storks soar on rising warm air, which forms poorly over the sea, so
    many cross between Europe and Asia over the Bosphorus. That gives the
    picture a place in İstanbul.
  - The Crab Nebula. It is one of the few nebulae whose birth people wrote
    down: Chinese astronomers recorded a new star in 1054. Charles Messier
    came across it in 1758 while looking for a comet, and it became the
    first entry in his catalogue. The pulsar at its center was found in
    1968. A 1978 paper in Nature proposed that an account by the physician
    Ibn Butlān describes the same star, and later work placed it in
    Constantinople; a 2024 reassessment questions that connection. If the
    İstanbul thread is used, present it as disputed.
  - A cat. It would connect to Moris and to İstanbul's street cats.
    Possible details include its vertical pupils, the shine of its eyes at
    night, its whiskers and the slow blink. Verify the research behind each
    one.
- **Pictures and Words can point to each other.** Five word stories touch
  the sky: *consider*, *desire*, *disaster*, *influence* and *lunatic*.
  When an explanation shows what a word still carries, link to its page,
  such as the Moon to *lunatic*. The link between *desire* and the stars
  is uncertain, and its page says so.
- **The painting stands as a sheet on a light, quiet page.**
  `--picture-paper` in `css/pictures.css` is `#f8f7f2`, a shade under the
  site's own light paper; the image keeps its edges, as it does on the
  section's index and the homepage. The painting's warm paper was tried as
  the page color in October 2026 and taken out at the author's request:
  over a whole page it was too loud.
- **All pictures use labels without permanent dots.** On 10 October 2026
  the author extended the journey and Farm House behavior to the black hole
  and quasar. Hover and keyboard focus reveal labels; Show places to look
  keeps their names visible on phones as well as larger screens. A label sits on its place unless that covers the thing it names, such as a
  thin line; `label_side: right` in the picture's front matter puts it
  beside it. A broad subject in the journey, such as the Great Red Spot,
  also takes a `label_gap`, a share of the painting's width, so its label
  stays clear of it at every size. A label that shows opens its detail as its exploration area does; a hidden
  one takes no clicks.
- **A close view opens at the top of its dialog.** Reset the scroll after
  `showModal()`. A closed dialog cannot be scrolled. Open
  every detail on a phone as well as a desk, one after another, and check
  that each close view shows what its text names.
- The homepage shows one picture, chosen at random, under Words with
  Stories (`_includes/pictures-with-stories-home.html`). The journey
  through the Solar System takes its turn with its opening scene.
- **Full screen is optional.** Each picture offers it through its own
  control and keeps the whole sheet visible, with its proportions and
  clickable places intact. Explanations remain available in full screen.
  Keep an explicit exit and keyboard access; Escape closes an explanation
  before leaving the picture, and exit returns focus and the page position.
  If the browser cannot enter native full screen, fill its window instead.
  On short landscape screens the controls sit beside the painting to leave
  its height available. Pointer use hides focus outlines without moving focus;
  keyboard use restores them. Check both fullscreen paths on a desk and a
  phone, including a change of orientation.
  The way from one picture to another, such as Mercury to the Sun and back,
  keeps full screen, as the author asked on 10 October 2026, and the places
  to look. A browser ends its own full screen whenever a page opens
  and starts it again only from a tap, so the next picture fills the window
  instead. For that click `js/pictures.js` adds `screen=full` and
  `places=shown` to the address. The arriving page removes them, and its
  layout keeps it hidden until the picture fills the window, so it never
  shows first as an ordinary page.

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

## Search

- **Some places stay out of search.** `search-index.json` gathers the
  writing, the word stories, the standalone pictures, the instruments,
  each quiz by its rounds, the notes and the pages in the site's frame.
  On 14 October 2026 the author decided what stays out of it.
  - Through the Solar System waits until its new paintings and journey
    are finished. Then look at it again: a result for each scene, at
    `/pictures/space/#scene-<id>`, which opens that scene, would take a
    search for Jupiter or Voyager straight there.
  - The Farm House stays out. It is entered only from the study, and its
    story is found in the rooms.
  - The quizzes' questions and notes stay out. A quiz shuffles its
    questions, so a result could not lead to the one that matched, and
    many notes give the answer away.

## The way back

- **Wherever a reader goes from, they can go back there.** The author
  asked for this rule on 14 October 2026. A page, a box that opens over a
  page and the balcony each lead back to the place the reader came from,
  and that place is found as it was left: a box that was open is open
  again, with its own way back still in it. A box that opens over a page
  closes back to that page. A new way from one place to another carries
  its way back, and the way back says where it goes.
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

## The site's header and footer

- **Every page that is read or browsed carries them.** This includes the homepage, The
  House, the writing, the word pages, the section indexes (Words, Pictures,
  Trivia, Instruments), Moris and About. They come from
  `_layouts/default.html`, and a new page of this kind uses it. The House
  is entered like a room, but it keeps them: it does not fill the window,
  what it holds (the shelf, the desk, the drawer) is read, and it is first
  in the site's menu.
- **A place that fills the window has its own quiet frame.** This applies to the
  Farm House, each picture in Pictures with Stories and each instrument. The
  frame gives a way back and the place's own controls, and leaves the rest
  of the window to the picture or the tool. The author settled this in
  October 2026: do not add the site's header and footer to these places.
  Each frame keeps its own design; do not merge them into one. Fixing a
  fault in a frame is fine.
- **A new place takes its family's frame.** A new instrument takes the
  instruments' bar and a new picture the picture layout. Woodland paths or
  a river reached from the farm's garden are scenes of the Farm House and
  keep its frame; they do not become pages of their own.
- **The way back follows how an instrument was opened.** A link from the
  study to an instrument carries `from=house`, preserving any other query
  parameters. Its back link says "the study" and returns to `/house/#study`.
  A link from the balcony carries `from=balcony`; its back link says "the
  balcony" and returns to `/house/#balcony`. The author asked on 11 October
  2026 that the way back name the room it returns to. The link to The Page
  beside a note in the drawer carries `from=drawer` with the drawer's
  address, and its back link says "your drawer" and returns to the drawer
  as it was. Beside a note on a page it names that page (see The way back).
  Other entries keep the link to Instruments. `_includes/tool-back.html`
  provides this behavior on every instrument. Keep the origin in the URL so
  reloading preserves it and separate visits stay independent. House links
  also carry `v` to load updated pages through the service worker's cache.
  A picture returns to Pictures with Stories, or to the balcony when its sky
  opened it with `from=balcony` (`js/pictures.js`).
- **The House has a small menu in the header.** The author asked on
  13 October 2026: a pointer over The House, or the chevron beside it,
  opens "To the door", which goes to `/house/`, and "Your drawer", which
  opens the reader's drawer over the page they are on. The site's menu
  carries the same two under The House, which opens like its other
  sections. The header's menu stands outside the strip, which scrolls on
  a phone and would cut it off, and `js/site-nav.js` places it under The
  House as it opens. The chevron waits for the script; without it The
  House is the plain link it was. On 14 October 2026 the author asked
  that a click on the name open the menu as the chevron does, and no
  longer go to the door; "To the door" in the menu does that. A click
  that opens a new tab still goes to the door. The name is the menu's
  one control for the keyboard, so the chevron stays out of the tab
  order, and focus comes back to the name.
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
  in a page's front matter loads its script.
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
- **The Farm House belongs to The House.** It is entered only from there,
  through the Polaroid on a shelf in the study, so its "← the study"
  returns to the study (`/house/#study`). Do not give its frame the site's
  name as a link to the homepage; the visitor leaves the farm by the room
  they came from.

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

## The drawer over any page

- **It opens where the reader is.** The header's and the menu's "Your
  drawer" and the footer's icon open the drawer in a box over the page,
  and closing it leaves the reader where they were. In The House it is the
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

## Interface details

- **The House's places are quiet, as in the pictures.** The author asked for
  this on 11 October 2026. Nothing marks a thing in the study or on the
  balcony until a pointer or the keyboard comes to it, and then its name
  shows beside it. "Show places to look" shows every name in both rooms
  until the reader hides them again; on a phone it shows the numbers on the
  picture and the list of names under it. The author asked on 11 October
  2026 that the reader's browser remember the choice (`olae-places`), so
  the names are still there after The Page or on another visit. The Farm
  House and Pictures with Stories share the same choice: names shown in one
  are shown in all of them until the reader hides them. Each place covers its thing, with its centre
  and size in `--ax`, `--ay`, `--aw` and `--ah` in `css/house.css`, and its
  name stands beside it at `--lx`, `--ly`, so that the names never cover
  one another when they all show. Everything that could be chosen before
  can still be chosen. A small thing inside a larger one, such as the lamp
  against the window or the e-reader on the desk, stands a layer above it
  (`--z`), and a place under the pointer rises only within its own layer.
  A pointer that crossed the window once could not reach the lamp.
  `scripts/test-house.cjs` fails on a small place left below a larger one.
  On a phone a place grows to a finger's size, and the drawer's once
  reached up over the word cards so that they could hardly be touched;
  there it keeps to the drawer front.
- **A window is a native dialog.** The House's boxes, the drawer, the
  farm's details, the pictures' close views and Moris's gallery open with
  `showModal()`, so the page behind them is inert and Escape closes them.
  Moris's gallery was the last to move, on 14 October 2026: until then
  focus stayed on its cover, behind the dark, and Tab went on through the
  page.
- **The House's places fade into one another.** Leaving a room, for the
  other room or the door, its picture stays over the place coming in and
  fades away, as the farm's scenes do; from one room to the other it
  stands over the new room's picture. From the door, which is paper
  already, the room fades up from the paper. The author agreed to a fade
  on 14 October 2026. Its first form faded every place up from the paper,
  and at night the paper flashed white between the two dark rooms; the
  author saw it the same day. A page that opens on a room shows it at
  once, and reduced motion keeps it still (`setView` in `js/house.js`).
- **The gold speck is for the rooms.** In the study and on the balcony,
  and in any room after them, the pointer is a gold speck and leaves a
  trail (`js/cursor-trail.js`). At The House's door it is the reader's own
  pointer and leaves none, as the author asked on 13 October 2026.
  `js/house.js` marks the page `house-inside` while a room is open, and
  `--trail: none` stops the trail over any part of a page.
- **A disclosure uses the site's chevron.** It is the one in the drawer
  and on a piece's reading options. Its words sit where
  the layout puts them; the chevron hangs beside them and does not pull them
  off their line.
- **A picture never dims when it is chosen.** When a link carries a
  picture and words, a pointer over it dims only the words, by
  `--select-dim`. The picture keeps its full weight and is still part of
  the link. A faded picture reads as unavailable. A picture that is a link
  on its own, with no words, answers in its own way: Moris's gallery cover
  grows a little and the Farm House's photograph straightens.
  `scripts/test-hover.cjs` fails on any rule that dims a picture.
- **A picture inside a card is named by the card's words.** When a link
  carries a picture and words of its own, such as a title, a date or a
  teaser, the picture has `alt=""`. Otherwise a screen reader reads the
  whole description of the cover before the title, in every list of links.
  The description stays on the page where the picture is the subject: the
  piece's cover and the painting on its own page. A link with no words of
  its own still takes its picture's alt as its name. The author asked for
  this across the site on 13 October 2026. `scripts/test-content.cjs` holds
  the built pages and the scripts that build cards (`js/more-essays.js`,
  `js/series-nav.js`, `js/cafe-nav.js`) to it.
- **A pointer draws no line.** A link answers a pointer by dimming. A
  line under a link stays only when it is there at rest, as in the story's
  choices and the 404 page, and it dims with the link. Links in running
  text keep their underline. The header's strip has no line at all: the
  author took it out on 15 October 2026, when the header felt crowded with
  it. The frames and instruments
  that load their own stylesheet carry the same dim themselves, with 0.95
  for readers who ask for more contrast. Where a line used to show
  keyboard focus, the link has an outline instead.
  `scripts/test-hover.cjs` fails on a rule that draws a line under a
  pointer outside running text.

## Trivia editorial standard

`Trivia` contains quizzes. Adding one requires three files, as described
in `_data/trivia.yml`. These rules govern what belongs inside them.

- **Answer illustrations can follow the current work.** On 9 October 2026,
  students playing British Culture asked for pictures to help them understand
  the explanations. After the ongoing projects are finished, try small
  thumbnails beside revealed correct answers, beginning with British Culture.
  A thumbnail may open a larger view. Show it after answering so it does not
  give away the answer. Choose images only where they explain the subject;
  every question does not need one. Verify image identity, source and reuse
  permission. This is a future task, not part of the current Space expansion.

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
- Leave out questions whose answers go stale. Current holders, standing
  records and living people's roles can all change. The bank is not revisited on a schedule, so a question that
  needs one is a question that will become wrong.
- **The answer must not stand inside its own question.** Naming the bear names
  the station; ask it another way or ask something else.
- All four choices must be real candidates to somebody who does not know. Three
  obviously wrong ones turn the question into an inventory check.
  Distractors should be the same kind of thing as the answer—four monarchs,
  four counties, four novelists—and of roughly the same length.
- Write the right answer wherever it belongs in the list and think no further
  about it. The quiz shuffles both the questions and the choices for every
  game, so a pattern in the file is not a pattern a reader can see, and
  hand-balancing the positions only makes the file harder to read. This is worth
  saying because the first bank drifted badly—29 of its 50 answers were
  written second—which is why the shuffle exists.
- A negative question ("least typical", "not") is allowed but should stay rare,
  and the negative must be unmissable in the wording.
- Every question carries a `category`, and **a category is a round**: the bank
  is stored grouped, in the order the rounds should run, and the quiz reads the
  round count from that rather than from anything written down. Aim for six to
  fourteen questions in a round. A subject too thin for six belongs inside a
  neighboring round.
- Order the rounds so the quiz opens on the easiest ground and does not end on
  the narrowest.
- Every question also carries an `id`, unique in its bank. Readers keep
  questions in their drawer in The House by it, so it stays put when a
  question is reworded or moved; a new question gets a new id.
- Keep the prose plain, as everywhere else here, and let the content do the
  work.


