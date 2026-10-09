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
- **This site is read as pages.** Its author reviews a change by
  looking at it, which for a long time meant merging first and looking after.
  Build the site and hand over the rendered pages that changed and
  the index they sit in before asking for a merge. The author needs to read
  the actual paragraph in its page.
- **Say what changed.** A pull request description
  names the work and its shape; the line-by-line reasoning behind an edit
  belongs in the conversation. The public description outlives it.
  "The prose was simplified" is the right altitude.

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
  moon visibility, room period, Moris's movement, wall clock, and any future
  outdoor space such as the balcony all use İstanbul time and coordinates
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

## The Sun, The Stars and Tonight

- **`js/bright-stars.js` is generated.** Change `scripts/build_sky_data.py`
  and run it with the three pinned sources named at its top: the Bright Star
  Catalogue, the IAU's catalogue of star names and d3-celestial's
  constellation lines. Do not edit the data by hand. T Coronae Borealis is
  left out, because the catalogue gives it the brightness of its 1866
  outburst, and Mira and chi Cygni are not drawn, because their brightness
  on a given night is unknown. The notes on `/stars/` say so.
- **One sky calculation serves three places.** `js/sky-map.js` works out and draws the sky for
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
- **"read with rain" stays under the title.** Rain that is falling has
  to show where it can be stopped.
- **A printed piece** opens with its kind (Essay or Short fiction) on the
  left and HAKANALTUN.IO on the right, then the title and date, centered, and
  ends with the footer's two lines, centered. Word pages have no print layout
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
  the quasar and the journey through the Solar System. Nebulae can follow,
  with birds, cats and other subject groups added as the collection grows.
  The group was called "The Space" until 9 October 2026, when the author
  renamed it. In English, space in the astronomical sense takes no article,
  and "the space" reads as a particular room or area. Each picture carries its
  group in its `category` field. Keep existing picture addresses stable
  when grouping them. Every group follows the same drawing, storytelling
  and sourcing standards.

- **Through the Solar System is a sourced watercolor journey.** In
  October 2026 the author clarified that realistic means scientifically
  grounded watercolor, like the black hole, rather than spacecraft
  photographs. The journey keeps its first address, `/pictures/space/`. It
  begins near Earth and opens connected watercolor
  scenes, following the Farm House's garden-to-veranda-to-room structure.
  Touching a world's body travels to its scene; touching its separate name
  label opens sourced information. A scene can carry several detail labels.
  Show only destinations available from the current scene, with a way back.
  The journey covers Earth's vicinity, a closer Earth view, the Moon, Mars and
  Jupiter, including the ISS near Earth and Io and Europa beside Jupiter. Keep recognizable geography, lunar markings, lighting,
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
  All eight planets remain the intended next scope after this small trial.
  In the approved Moon and Jupiter scenes, fine detail covers the whole
  globe. From Saturn on, keep detail selective, as the black hole does:
  gather it where a label points and leave the rest of the globe in broad
  washes. Saturn already has an account of how we came to know it. Galileo
  saw its rings in 1610 without recognizing them, and Christiaan Huygens
  explained them as a ring in the 1650s. Verify the details before writing.
  Earth vicinity, Earth and Moon were approved as one coherent section before
  extending to Mars. The Moon’s small Mars destination reuses a crop of the
  Mars painting, preserving the approved lunar scene. Mars has sourced labels
  for its iron-bearing dust, Olympus Mons, Valles Marineris and north polar
  ice. Its painting emphasizes relief; the illustration note explains this.
  Mars now leads to Jupiter, whose notes cover its interior, cloud bands,
  Great Red Spot, Io and Europa. Both moons are enlarged independently for
  their details, disclosed in the illustration note. Small cropped worlds
  connect the scenes without repainting approved assets.
  The opening view should leave ample space around a
  smaller Earth so arrival at its closer view is unmistakable. Choose the
  sourced details before painting a new scene. Preserve recognizable forms
  and reserve named landmarks for features verified against references.
  Name labels follow the Farm House's hover, focus and optional hint behavior.
  The journey and the Farm House have no permanent white dots. Labels appear
  on hover or keyboard focus; Show places to look keeps names visible on
  every screen, including phones. Preserve full touch targets and keep
  labels close to their subjects without covering nearby travel targets.
  Worlds and details share one label style, the small sans-serif of the
  Farm House and the standalone pictures; they differ only in when their
  labels appear. In the list beneath a scene, a world that can be visited
  is named once and followed by "go there". Inside a sentence, a name keeps
  a lower-case article: "Travel to the Moon".
  Pale Blue Dot and the Sagan passage can follow after the visual language
  is settled. The full copyrighted passage still needs written permission.
  Preserve stable picture addresses, keyboard access, reduced motion,
  optional visible labels, native fallback reading, and fullscreen.

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
- **Standalone pictures show faint dots from the first look.** The
  journey and Farm House use hover, focus and optional visible labels without
  permanent dots, as requested on 9 October 2026. A label sits on its place unless that covers the thing it names, such as a
  thin line; `label_side: right` in the picture's front matter puts it
  beside it. A broad subject in the journey, such as the Great Red Spot,
  also takes a `label_gap`, a share of the painting's width, so its label
  stays clear of it at every size. A label that shows opens its detail as the dot does; a hidden
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
  Check both paths on a desk and a phone, including a change of orientation.

## The homepage

- **Slate and green take turns down the page.** Every homepage section is
  named in one of the two accent lists in `css/style.css` ("Homepage accent
  rhythm"). A new section takes the color its place calls for, and every
  section after it moves to the other list. `scripts/test-pictures.cjs`
  fails when a section is missing from the lists or two neighbors share a
  color.

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
- **The way back follows how an instrument was opened.** A link from The
  House to an instrument carries `from=house`, preserving any other query
  parameters. Its back link says "The House" and returns to `/house/#study`.
  Other entries keep the link to Instruments. `_includes/tool-back.html`
  provides this behavior on every instrument. Keep the origin in the URL so
  reloading preserves it and separate visits stay independent. House links
  also carry `v` to load updated pages through the service worker's cache.
  A picture returns to Pictures with Stories.
- **The Farm House belongs to The House.** It is entered only from there,
  through the Polaroid on a shelf in the study, so its "← The House"
  returns to the study (`/house/#study`). Do not give its frame the site's
  name as a link to the homepage; the visitor leaves the farm by the room
  they came from.

## Interface details

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
- **A pointer draws no line.** A link answers a pointer by dimming. A
  line under a link stays only when it is there at rest, as in the menu
  strip, the story's choices and the 404 page, and it dims with the link.
  Links in running text keep their underline. The frames and instruments
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

