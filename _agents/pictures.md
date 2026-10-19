# Pictures with Stories

Notes on how to build and change Pictures with Stories, for the sessions
that work on it. The rules a reader could read, with their reasons, are in
`COLOPHON.md`; a note here marked "(rule in `COLOPHON.md`)" carries out a
rule written there.

- **The catalogue is grouped by subject** (rule in `COLOPHON.md`). Each
  picture carries its group in its `category` field. Keep existing picture
  addresses stable when grouping them.

- **Through the Solar System uses one continuous camera scene.** The author
  approved the immersive pilot in October 2026, with illustrations and sourced
  spacecraft imagery. `pictures/space/index.html`, `css/space-journey.css`,
  `js/space-journey.js` and `js/space-field-notes.js` carry the experience.
  Its 74 views cover 23 bodies and fourteen wide views. Worlds keep their
  positions; the camera follows distinct, reversible curves. Keep gradual
  approach, decoded detail overlays, resize behavior, rapid retargeting,
  browser Back/Forward, keyboard navigation, reduced motion and Arrive now.
  Travel time and distance are illustrative. Credits distinguish false color,
  separate observations, models and illustrations. Do not invent surface detail.
  Captions use local shade, leaving the worlds visible. The site’s local fonts
  retain Cormorant Garamond Italic for the ampersand.
- **The entry invites discovery.** The journey dialog gives short controls,
  without an itinerary or descriptions of discoveries. The footer supplies
  practical navigation. The October 19 release slows normal camera paths by
  40 percent while preserving their different rhythms; reduced motion is immediate.
- **The Sun is part of the journey.** Its complete story and four sourced notes
  live in the reader. `/pictures/sun/` redirects directly to `/pictures/space/#sun`
  and carries query parameters, including the return to the balcony. `/sun/`
  remains the separate instrument. Black hole and quasar remain watercolor pages.
- **Keep old entry points.** `scene-*` fragments resolve to current views,
  including the asteroid belt, Kuiper Belt and both Voyagers. `space-entry.js`
  preserves the return to The House. The shared `olae-places` preference and
  `places=shown` keep visible names. The journey already fills the window;
  native fullscreen is offered when the browser supports it.
- **Keep the sourced reading available.** The 65 full notes are also in
  `_data/space_notes.json` for the no-JavaScript reading version and search.
  Update both from the same note data when editing prose. Camera and integration
  regressions belong in `scripts/test-space.cjs`.
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

The existing full-resolution journey imagery is served from the owned public
Pictures Space Site at `pictures-space-pilot-hakan.exacttulip1.chatgpt.site`.
Keep that Site and its asset paths published while this release references it.
`space-assets.json` records the source URLs and SHA-256 hashes for a future
mirror. New Voyager assets and the catalogue cover are stored in this repo.
