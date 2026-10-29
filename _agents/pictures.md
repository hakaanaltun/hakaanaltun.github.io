# Pictures with Stories

Notes on how to build and change Pictures with Stories, for the sessions
that work on it. The rules a reader could read, with their reasons, are in
`COLOPHON.md`; a note here marked "(rule in `COLOPHON.md`)" carries out a
rule written there.

- **The catalogue is grouped by subject** (rule in `COLOPHON.md`). Each
  picture carries its group in its `category` field. Keep existing picture
  addresses stable when grouping them.

- **A group's journey opens it as a wide window** (rule in `COLOPHON.md`).
  On 19 October 2026 equal thumbnail rows were tried first: shrunk to 160
  pixels, the realistic cover and the painted sheets still clashed, because
  at that size the eye reads the frame before the brushwork, a dark edge
  against an ivory paper one. The author chose to let size and order show
  the two kinds instead, so the same layout carries over to the next journey.
  `pictures-index.css` shows the journey's whole cover at its own 3:2, with
  its title and teaser beneath. A 2:1 band was tried first; the author asked
  the same day for the Earth to be whole, as on the homepage. The title
  and teaser come from the journey page's front matter, as on the
  homepage, so the teaser is written once. The watercolors follow
  as equal rows, each complete 3:2 sheet beside its words, keeping its paper
  edge. The homepage and the individual pictures keep their own layouts.

- **Through the Solar System uses one continuous camera scene.** The author
  approved the immersive pilot in October 2026, with illustrations and sourced
  spacecraft imagery. `pictures/space/index.html`, `css/space-journey.css`,
  `js/space-journey.js` and `js/space-field-notes.js` carry the experience.
  Its 74 views cover 23 bodies and fourteen wide views. `js/space-journey.js`
  opens with a note on how it is laid out; it was written in dense single
  lines until 23 October 2026, when it was set out to be read without
  changing the program. Keep new code in that form and the tables one entry
  to a line. Worlds keep their
  positions; the camera follows distinct, reversible curves. Keep gradual
  approach, decoded detail overlays, resize behavior, rapid retargeting,
  browser Back/Forward, keyboard navigation, reduced motion and Arrive now.
  Travel time and distance are illustrative. Credits distinguish false color,
  separate observations, models and illustrations. Do not invent surface detail.
  Captions use local shade, leaving the worlds visible: since 19 October 2026 a soft cloud that fades to nothing at its rim, because the earlier box showed its edges as a gray rectangle over the Sun, Venus and the Moon. Removing the shade was tried the same day; the Moon's close views and the Sun's label on a phone were then unreadable. The site’s local fonts
  retain Cormorant Garamond Italic for the ampersand.
- **The top of the window and the controls are read on a phone.** On
  19 October 2026 a walk through the journey on a phone found the site's
  name, The journey, Show places and full screen unreadable in eight close
  views where a world fills the window (the oceans, the atmosphere, Uranus's
  atmosphere, the Voyagers' instruments). `#sceneShade`'s top fade now
  reaches 190px (165px on a phone) and is darker where those words stand,
  and the words carry a soft shadow; it fades to nothing, so no edge shows.
  The same day the controls' smallest type was raised on phones, from 8–10px
  to 10–12px, and Back and full screen were given 44px to touch without
  moving anything around them.
- **The entry invites discovery.** The journey dialog gives short controls,
  without an itinerary or descriptions of discoveries. The footer supplies
  practical navigation. The October 19 follow-up lengthens normal camera paths
  by about 57 percent from the first release (1.1–5.6 seconds). History returns
  scale with distance too (1–3.2 seconds), replacing the abrupt half-second
  return. Different route rhythms remain; reduced motion is immediate.
- **Perspective travel is the default across the journey.** On 20 October
  2026 the author approved the extended Earth–Moon pilot for publication.
  It runs between different bodies, including selections from the wide
  views and the footer. The `flight=outside` query parameter retains the
  earlier camera for comparison; existing `flight=inside` links still work. Every
  region uses its global origin in the same projection, so planets, moons
  and both Voyagers turn into view and approach at their own depths. Earth–Moon
  retains its accepted rhythm. Other moon systems turn more gradually,
  Saturn’s neighborhood takes a broader look, and outward Voyager transfers
  orient earlier and take 6.8 seconds. Small sideways viewing offsets settle
  back into the registered destination.
  Inspection within one body keeps its existing movement. The Moon’s far
  side and Vesta’s alternate observation retain their existing transitions.
  During perspective transfers, photographic black mats are composited with
  lighten blending at both the region and body level so an image rectangle
  cannot blank out another world. This also combines overlapping illuminated
  areas; settled inspection views restore ordinary opaque composition.
  No surface imagery is invented. Arrive now, reduced motion, resize and
  interrupted travel keep the common navigation contract. Moon-to-Mars
  transfers finish the lens change during the initial turn, so Mars grows
  steadily toward its final size during the approach instead of overshooting
  and receding. Start at `/pictures/space/#earth`.
- **Use the Solar System as the reference for future journeys** (rule in
  `COLOPHON.md`: choosing a destination brings the reader close to it).
  The author settled this on 23 October 2026. Carry the interaction decisions
  above with the camera, not only its animation. Keep one shared scene with
  fixed subject positions, named destinations, optional labels, local zoom,
  sourced reading, decoded detail overlays, responsive framing, keyboard
  access and optional full screen. Content, imagery, coordinates and route
  rhythms belong to the new subject; keep the common navigation behavior.
  In `js/space-journey.js`, `stopViews` now names inspection views, matching
  globe buttons and the previous/next arrows. Explicit wide-view controls
  and old wide-view addresses keep their meaning.
  On 24 October 2026 the author clarified that the original forward-looking
  flight was the desired movement: the camera travels into the scene with
  worlds ahead, rather than watching them slide across a shallow view.
  Keep the original `flightProfile` and `flightPose` curve and perspective.
  Do not add per-world inspection waypoints or an automatic wide opening.
  `travelPlan` sets the base duration for two or more region intervals:
  6 seconds plus 3.5 seconds per additional interval, capped at 50 seconds.
  The author then asked for a very small speed increase: normal perspective
  transfers, including neighboring worlds, take 92 percent of their base
  duration. Earth–Neptune takes 21.62 seconds; Earth–Moon takes 4.784 seconds.
  Short inspection moves retain their timing; camera geometry is unchanged.
  The final pose is the selected inspection view. One animation owns the
  whole trip, so Arrive now reaches its final target; retargeting starts at
  the actual camera position and orientation. Back/Forward, reduced motion
  and resize settle at the same target. Intermediate worlds add no history.
  Keep regression cases for consistent entry controls, forward perspective
  in both directions and at responsive sizes, close arrival, retargeting,
  skip, resize, reduced motion and history when adapting this model.
- **Travel measures its viewport once per frame.** On 21 October 2026 the
  author reported pauses during transfers. Frame painting now shares one
  viewport measurement across every projected world and updates the hidden
  hit areas only at arrival. Keep geometry reads before style writes; reading
  the stage between each world's hit-area changes forces repeated layout.
  Wide views enable the existing globe buttons for every visible region,
  including a neighboring planet at the edge. Inspection retains its local
  zoom controls. Portrait tablets (at least 600 CSS pixels wide and taller
  than 1.2 times their width) center inspection at 40 percent of the height
  and reserve more space above the wide view, leaving room for the caption.
- **The Sun is part of the journey.** Its complete story and four sourced notes
  live in the reader. `/pictures/sun/` redirects directly to `/pictures/space/#sun`
  and carries query parameters, including the return to the balcony. `/sun/`
  remains the separate instrument. Black hole and quasar remain watercolor pages.
  The Sun's own watercolor page was retired on purpose (rule in
  `COLOPHON.md`); the painting is kept in `pictures/space/retired/` with the
  watercolor journey's paintings and its earlier covers, outside the
  published site.
- **Keep old entry points.** `scene-*` fragments resolve to current views,
  including the asteroid belt, Kuiper Belt and both Voyagers. `space-entry.js`
  preserves the return to The House. The shared `olae-places` preference and
  `places=shown` keep visible names. The journey already fills the window;
  native fullscreen is offered when the browser supports it.
- **Keep the sourced reading available.** The 65 full notes are also in
  `_data/space_notes.json` for the no-JavaScript reading version and search.
  Update both from the same note data when editing prose; since
  23 October 2026 `scripts/test-space.cjs` fails when the two copies differ.
  Camera and integration regressions belong there too.
  Prior implementation decisions remain in `space-watercolor-history.md` as
  historical notes, not current visual requirements.

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
- **A pointer dims what it is over** (rule in `COLOPHON.md`). The
  journey's links and buttons dim with one rule at the end of
  `css/space-journey.css`; its places show their names, and the Pale Blue
  Dot keeps its weight. The pictures' sources and close buttons dim in
  `css/pictures.css`.
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

The Voyager v20 images remove the gray backdrop from the NASA/JPL model
using Imagegen, preserving the registered pose and hardware. Their alpha
background keeps them in the shared space. They are labeled as adapted
illustrations, not unmodified NASA images. The generation request preserved
the dish, record, booms and camera position, removed the studio halo and
lifted the darkest surfaces slightly. WebP sizes share the same composition.

The journey's imagery is served from the site itself, from
`pictures/space/images/`. On 19 October 2026 it was copied byte for byte from
the pilot site at `pictures-space-pilot-hakan.exacttulip1.chatgpt.site`, each
file checked against the SHA-256 that `space-assets.json` records, so the
journey no longer depends on that site staying published. Four of the copies
were PNG files of 1.5 to 2.3 MB: `earth`, `moon`, `earth-atmosphere-detail`
and `mars-master`. The page uses WebP copies of them at quality 92, about a
tenth of the size, which took the opening view from about 4.5 MB to about
1.8 MB. The PNG originals, and the earlier non-v12 Europa and Jupiter images
that nothing loads, are kept in `pictures/space/retired/`. The folder is not
one the image variant script reads, so no downscales are made for it.
`scripts/test-space.cjs` fails if the journey loads anything from the pilot
site again, or names an image that is not in the folder. New Voyager assets
and the catalogue cover stay in `pictures/space/assets/`.

The journey card uses `journey-cover-v2.webp` in the catalogue, homepage and
sharing metadata. Its realistic Earth and Moon represent the immersive
interior. Indigo shadows, restrained warm light and subtle texture connect
it to the black-hole and quasar covers without watercolor marks or paper
edges. The author explicitly requested this balance on October 19. The
Imagegen brief was a realistic scientific Earth–Moon composition in 3:2,
with coherent geography, natural volume, deep blue space and gentle warm
sunlight; no text, itinerary, extra planets, brushwork or decorative border.

- **A field note can name a word** (rule in `COLOPHON.md`). `"word"` in a
  note, in both `js/space-field-notes.js` and `_data/space_notes.json`,
  adds a line after its text (`#infoWord`, `js/space-journey.js`) and in
  the reading version without JavaScript. Following it puts the note in
  the address as `?note=`, so the way back opens it again. A word page
  opens the journey with `from=word` and `back=`; `js/space-entry.js` then
  makes the way back say "the word" and return there.
