# The House

Notes on how to build and change The House, for the sessions that work on
it. The rules a reader could read, with their reasons, are in
`COLOPHON.md`; a note here marked "(rule in `COLOPHON.md`)" carries out a
rule written there.

The House stays in İstanbul; `COLOPHON.md` says why, under Time, place
and sky.

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
  as every note on the site does (see Reading options in
  `_agents/reading.md`). With nothing
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

## The House's places

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

## Full screen and the House's colours

- **Full screen in both rooms** (rule in `COLOPHON.md`). "Full screen"
  stands beside "Show places to look" in each room (`[data-fullscreen]`),
  as it does under a picture. `js/house.js` asks the browser to put the
  whole page (`<html>`) in full screen, so the pointer's trail and the
  boxes over the room come along, and marks `#house` `is-fullscreen`; a
  browser that cannot, such as a phone's Safari, has the room fill its
  window instead (`position: fixed`). Everything outside `#house` on the
  way to `<body>` is made `inert` meanwhile. Going from one room to the
  other keeps it; the door, the button and Escape end it, and a box open
  over the room closes before Escape leaves the window's full screen.
  Leaving puts the page back where it was, or on the room the reader went
  on to.
- **The picture keeps its proportions in full screen.** Each scene stands
  in a `.house-stage`, which full screen makes a size container: the scene
  takes the stage's width or, where the stage is wider than the picture,
  its height, so the places (`cqw` in `css/house.css`) stay on their
  things. Three layouts: on a wide screen the room's name, time and
  controls stand above the picture and the way back below it; upright
  (`max-aspect-ratio: 4/5`) the picture is as wide as the screen and the
  list of places follows it; on a short screen lying on its side (a phone)
  everything but the picture stands in a column beside it, and the list
  scrolls there. Chrome now aligns blocks with `justify-items`, so the
  upright stage sets `place-items: normal`; without it the picture
  shrank to nothing. The fade between rooms lifts the leaving room at its
  measured height as well as its width, because a size container has no
  height of its own. Look at all three on a desk and a phone, both ways
  up, before changing one.
- **The status line keeps its room in full screen.** On 25 October 2026
  the author found the picture jumping when the lamp was lit: the empty
  line kept 1.4em, and its first words stood at the page's taller line
  height, so the picture shrank by a few pixels. Its line height now
  matches the room kept for it, and upright it keeps two lines, since a
  phone can break the longest message ("The lamp flickers. …"). On a
  short screen lying on its side it stands apart from the picture and
  moves nothing.
- **The House's own colours** (rule in `COLOPHON.md`). `wearTheme()` in
  `js/house.js` sets `data-house-theme` on `<html>` while a room is open:
  `day` in İstanbul's morning and day, `night` from its evening, read
  from the scenes' `data-hour`, so it turns with the lamps. At the door it
  is taken off. `css/house.css` sets the tokens on `<body>`, which every
  theme's own blocks reach only from `<html>` (Follow the sky paints
  inline on `<html>`), and sets `--surface-chrome` and `--surface-footer`
  directly, so no palette's `--chrome-rgb` reaches the header and footer.
  It sets the accent again too, the House's green from `--sec-l` by day
  and `--sec-accent-dark` by night, since Follow the sky and Midnight
  replace `--petrol` on `<body>`. The browser's own bar takes the House's
  header colour; `_includes/site-sky.html` leaves the `theme-color` metas
  alone while `data-house-theme` is set, and at the door the site's theme
  points them back.
- **The header and footer follow İstanbul's sun** (rule in
  `COLOPHON.md`). `headerNow()` in `js/house.js` paints them every minute
  on `<body>`'s own style, from `window.OLAE_SKY` (`_includes/sky-ramp.html`)
  with the House's coordinates: before sunrise `HEADER.night` up to
  `HEADER.horizon` as the night opens, by day `HEADER.horizon` to
  `HEADER.noon` along the sun's arc, and from the evening, while the page
  wears its dark (`data-house-theme="night"`), `HEADER.night`, a shade
  under the page as Follow the sky's header is by night. It first darkened
  from sunset until nine, and the author found it too light over the dark
  page the same day. The words are
  `wordsAt()` for İstanbul's sun, the same white as Follow the sky's. The
  author asked for both on 25 October 2026, saw a beige that keeps the
  site's 7:1 for the header's words (#5E5443 at noon) beside a lighter
  one, and chose the lighter: the words hold 5.6:1 and the quieter tier
  4.6:1, the floor. A lighter beige still would take the quieter tier
  under 4.5:1; one much lighter needs dark words by day.
  `scripts/test-house.cjs` checks both through a day. The words keep
  their white through the evening, losing it as the night closes, so the
  evening still moves in the header after the page has turned. The pointer's trail is lit by the House's colours, not
  the site's theme. Every tier holds 4.5:1; check a change against the
  bands as well as the paper.
