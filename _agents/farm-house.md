# The Farm House

Notes on how to build and change the Farm House, for the sessions that
work on it. The rules a reader could read, with their reasons, are in
`COLOPHON.md`; a note here marked "(rule in `COLOPHON.md`)" carries out a
rule written there.

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
  punctuation, following the prose rules in `COLOPHON.md`. Fictional details should fit the established story.
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

## Its frame

- **The Farm House belongs to The House.** It is entered only from there,
  through the Polaroid on a shelf in the study, so its "← the study"
  returns to the study (`/house/#study`). Do not give its frame the site's
  name as a link to the homepage; the visitor leaves the farm by the room
  they came from.
