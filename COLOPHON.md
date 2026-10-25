# The Colophon

## The first rules

Every change has to answer to these rules.

- **Give the reader something, and take nothing they did not choose to
  give.** Add no tracking or engagement tricks that pull a reader back or
  hold them longer than they meant to stay. What a reader keeps stays with
  them. The drawer lives in their own browser. The one thing the site asks
  for, an email address for new pieces, waits at the end of an essay and
  is theirs to give. Everything the site uses is listed below, under
  What the site uses. Add no other counter or analytics.
- **If something cannot be made well, it waits.** This holds for a
  half-made page, a drawing that does not work and a description that is
  not true.
- **The test is the reader’s first look.** Someone who opens a page should be
  drawn into it. A page that leaves them wondering what this nonsense is
  has failed that test.

## What the site uses

- **A visit counter.** GoatCounter counts visits to the pages that carry
  the site’s header. It sets no cookies and keeps only totals: visits per
  page, the pages and sites visitors came from, and their country,
  language, browser, system and screen width. It is not loaded on the Farm
  House, the pictures, the instruments or the search page.
- **The time zone.** The sky pages read the device’s time zone and take the
  nearest city on their list. Nothing asks for a location, and the time
  zone stays in the browser.
- **İstanbul’s weather.** The House asks Open-Meteo for the weather in
  İstanbul. Nothing about the reader goes with the request.
- **A passage to translate.** When a reader asks for a Turkish translation,
  the passage and the sentences around it go to the site’s own translation
  service on Cloudflare. The service keeps no copy.
- **An email address,** only if a reader gives one at the end of an essay.
  It goes to Buttondown, which sends the new pieces.
- **What a reader keeps,** the drawer, notes, highlights and reading
  choices, stays in their own browser.

## Prose and punctuation

- Write complete sentences. Use fragments only when they serve a clear
  purpose, including short interface labels and section headings.
- State the intended point directly. Avoid unnecessary negative examples.
- Use a rhetorical group of three only when every part is needed. Keep
  necessary lists of technical items or factual details intact.
- Keep the prose plain and use correct punctuation. Avoid ornate phrasing
  and polished endings written mainly to sound quotable. Use em dashes
  and colons only when needed.
- **Close up em dashes.** When a dash is needed, write `word—word`. Essays
  and new text in quizzes, word stories and notes follow this convention.
  Keep the spaced separator in page titles, including
  `Feeds — On Life & Everything` and instrument names.
- **Quotation marks and apostrophes are curly.** Write ’ for an
  apostrophe, in Turkish names too (İstanbul’daki), and ‘ ’ and “ ” for
  quotations, in everything a reader sees: prose, titles, teasers,
  descriptions, source titles, the data files and the text scripts write.
  Text that comes from elsewhere, such as an updated chapter of the book,
  gets its curly marks back before it goes in. The straight marks stay in
  code and addresses, around the value of an HTML attribute, and where a
  page is about the straight marks themselves, as The Marks and The Clean
  are. The author asked for this rule on 17 October 2026, and straight
  marks were then taken out of the word teasers and descriptions, the
  instruments’ cards and descriptions, a few source titles and one quiz.
- **The site’s ampersand is Cormorant Garamond Italic,** the one in its
  name, in titles, labels and italic text. Running prose set in upright EB
  Garamond keeps EB Garamond’s own &. EB Garamond’s own italic & is a
  joined “Et” that reads as a mistake. In a paragraph the name’s & is
  lighter and smaller than the upright letters around it, and there it
  usually stands inside someone else’s name, such as Fortnum & Mason, so
  the prose keeps an & with the weight of its letters. The author asked
  for the site’s & on 17 October 2026, and later that day for running
  prose to keep its own.

## Time, place and sky

The site has two deliberate ideas of place. Do not collapse them into one.

- **The general site follows the visitor’s sky.** The Follow the Sky
  theme, `/twilight/`, `/sun/`, `/stars/` and the homepage’s Tonight read
  the browser-reported IANA time zone. No location permission is
  requested. If the zone is unknown, keep the existing nominal-equatorial
  fallback rather than pretending to know the visitor’s latitude.
- **The House is in İstanbul.** Its calendar day, light, sunrise and sunset,
  moon visibility, room period, Moris’s movement, wall clock, and the
  balcony with its sky all use İstanbul time and coordinates
  (`Europe/Istanbul`, 41.015, 28.979). A visitor enters that place; the House
  does not move to the visitor.
- A link from The House to Twilight must preserve that place explicitly:
  `/twilight/?city=istanbul`. A normal site link to `/twilight/` should stay
  visitor-local and should not be labeled “İstanbul’s Twilight.”
- Keep labels honest about which clock they describe. General site copy may say
  “today’s twilight” or name the resolved city. House copy may say
  “İstanbul’s Twilight” because the House deliberately stays there.
- The moon’s phase itself is global at a given instant, but whether the moon is
  above the House’s horizon is an İstanbul calculation. Do not confuse phase
  with local visibility.
- For an unknown zone, Tonight gives only the sun’s times and the moon’s
  phase. A map or a compass direction would claim a place the site does not
  know.

## The way back

- **Wherever a reader goes from, they can go back there.** The author
  asked for this rule on 14 October 2026. A page, a box that opens over a
  page and the balcony each lead back to the place the reader came from,
  and that place is found as it was left: a box that was open is open
  again, with its own way back still in it. A box that opens over a page
  closes back to that page. A new way from one place to another carries
  its way back, and the way back says where it goes.

## Reading and keeping

- **“Original” is the published page.** Text size and line spacing change
  a piece only after a reader picks something else.
- **“read with rain” stays under the title.** Rain that is falling has
  to show where it can be stopped.
- **A selected passage can be kept, written about or highlighted, and only
  Highlight marks the page.** The author asked for notes and highlights on
  10 October 2026, and asked that selecting, translating, keeping or
  writing a note never mark a passage by itself.
- **Türkçe is found, not announced.** On 14 October 2026 a line in Turkish
  told browsers set to Turkish, in a piece’s reading options and on a
  quiz’s first panel, that a selected sentence opens in Turkish. The
  author asked the same day for it to be taken out. Something whose use is
  limited should not be put forward, and a line for Turkish alone raises
  the question of why no other language is offered. Türkçe stays in the
  prompt over a selection. Do not add a line about it back unless the
  author asks.
- **Listening and offline saving were tried and taken out** in October 2026.
  Device voices are not on every device, and offline copies put the service
  worker in front of every page. “Print or save as PDF” is the way to keep
  a piece. Do not add them back unless the author asks; listening that works
  for everyone would need recorded audio.

## The site’s header and footer

- **Every page that is read or browsed carries them.** This includes the
  homepage, The House, the writing, the word pages, the section indexes
  (Words, Pictures, Trivia, Instruments), Moris and About. The House is
  entered like a room, but it keeps them: it does not fill the window,
  what it holds (the shelf, the desk, the drawer) is read, and it is first
  in the site’s menu. A reader can still ask for full screen in the study
  or on the balcony, as on a picture. The room then fills the screen with
  its own controls and the way out, going from one room to the other keeps
  it, and the header and footer come back when the reader leaves it or
  goes to the door. The author asked for this on 25 October 2026.
- **Inside, The House wears its own colours.** At the door the page keeps
  the theme the reader chose. In the study and on the balcony the page,
  its header and its footer take the rooms’ colours instead: their cream
  in the morning, by day and in the evening, and a warm dark at night.
  Like the rooms’ light, they follow İstanbul’s hour. The
  author asked for this on 25 October 2026, when the light slate of Follow
  the sky by day did not suit the rooms. The same day the author asked for
  the header and footer to move with İstanbul’s sun as Follow the sky’s
  move with the reader’s: a beige by day, lightest at noon, darkening
  after sunset, and dark with the page at night, with their words taking white as the sky
  opens and losing it as the night closes. Shown a beige that keeps the
  site’s usual contrast for those words beside a lighter one, the author
  chose the lighter; the words still read at the accessible minimum or
  better at every hour. The page first turned dark with the evening, and
  the author found it too dark the same day: the rooms show their own
  evening, so the page keeps its cream until night. The author also
  asked for the night’s dark to be a little lighter than the near-black
  it first was.
- **A place that fills the window has its own quiet frame.** This applies to the
  Farm House, each picture in Pictures with Stories and each instrument. The
  frame gives a way back and the place’s own controls, and leaves the rest
  of the window to the picture or the tool. The author settled this in
  October 2026: do not add the site’s header and footer to these places.
  Each frame keeps its own design; do not merge them into one. Fixing a
  fault in a frame is fine. Every frame answers a pointer as the rest of
  the site does (see Interface details).

## Interface details

- **A pointer dims what it is over, everywhere.** A link or a button
  answers a pointer in one way across the whole site: it fades a little,
  and its colour, its border and its size stay as they are. This holds in
  the frames and the instruments as on the pages. A control that rests
  faint fades a little further from where it stands. Only pictures answer
  differently, as the next rule says, and a colour offered as a choice is
  a picture of that colour. A name or a control that comes into view when
  a pointer comes near, as the places in a picture do, is not an answer
  and stays as it is. The author asked for one answer everywhere on
  24 October 2026, after finding two links that did nothing. Until then
  the instruments brightened their controls, several buttons took on a
  colour, and some links and buttons did not answer at all.
- **A picture never dims when it is chosen.** When a link carries a
  picture and words, a pointer over it dims only the words. The picture
  keeps its full weight and is still part of the link. A faded picture
  reads as unavailable.
- **A picture inside a card is named by the card’s words.** When a link
  carries a picture and words of its own, such as a title, a date or a
  teaser, the picture has `alt=""`. Otherwise a screen reader reads the
  whole description of the cover before the title, in every list of links.
  The description stays on the page where the picture is the subject: the
  piece’s cover and the painting on its own page. A link with no words of
  its own still takes its picture’s alt as its name. The author asked for
  this across the site on 13 October 2026.
- **A pointer draws no line.** A link answers a pointer by dimming. A line
  under a link stays only when it is there at rest, as in the story’s
  choices and the 404 page, and it dims with the link. Links in running
  text keep their underline. The header’s strip has no line at all: the
  author took it out on 15 October 2026, when the header felt crowded with
  it. Where a line used to show keyboard focus, the link has an outline
  instead.

## Search

- **Some places stay out of search.** On 14 October 2026 the author
  decided what stays out of it.
  - The quizzes’ questions and notes stay out. A quiz shuffles its
    questions, so a result could not lead to the one that matched, and
    many notes give the answer away.

## Words with Stories editorial standard

Words with Stories is a deliberately small, curated collection. A term should be added only when its story earns its place.

- Prefer words or expressions in which an older meaning, image, object, belief, or event still leaves a visible trace in the modern term. Examples include *bosh* retaining Turkish *boş*, *quarantine* retaining forty, *nightmare* retaining the old *mare*, *influence* carrying the old idea of something flowing in from the stars, and *Rosetta stone* turning a historical object into a metaphor for a key to understanding.
- The story should change how the reader sees the term. A merely correct etymology is not enough.
- There should be a clear one-sentence answer to: “Why this term rather than hundreds of other interesting etymologies?” If there is not, leave it out.
- Myth, folklore, historical belief, and legend are allowed when they genuinely explain the term’s development or continuing image. Mere association with mythology is not enough; otherwise the collection would expand without a meaningful boundary.
- Every story must be sourced. Prefer museums, universities, academic publications, dictionaries with etymological scholarship, archives, or official institutions. Use multiple sources for historical claims when useful.
- If a popular story is disputed or cannot be confirmed, say so explicitly or do not use it. Do not preserve a neat story at the expense of accuracy.
- Treat *nightmare* and *quarantine* as roughly the lower editorial threshold. Candidates with a weaker transformation, residue, surprise, or narrative reason should normally be rejected.
- Words, idioms, and fixed expressions may all qualify in future; the same editorial threshold applies.
- Keep the prose plain and unshowy. Sentences should carry the content rather than compete with it. Avoid polished, aphoristic endings or lines written mainly to sound quotable. The reader should remember the story more than the sentence.
- The part-of-speech label must match the specific sense being explained on the page. Do not list every part of speech the spelling can have; label the entry as the reader encounters it in that story and example.

## Words with Stories collections

- **Keep the complete alphabetical index alongside the collections.** The earlier A–Z layout lives at `/word/alphabetical/`, linked near the end of `/word/` as “All the words in alphabetical order.” It includes every existing entry, including words not yet assigned to a collection. Keep each word’s URL unchanged and the alphabet jump navigation intact; collection reading arrows remain thematic.
- The public `/word/` index is organized into curated thematic
  collections. Each group has a plain introduction and an approximate
  historical order based on the older meanings, documented events or
  periods behind its words. A word may belong to only one primary group.
- Existing individual `/word/<slug>/` URLs and all source citations remain unchanged. Arrows on grouped stories stay within their own group, and the label above the word returns to its collection.
- A word outside every group remains available by its URL, in site search
  and in the existing Words RSS feed, but waits off the curated Words
  index, the homepage random-card selection, The House’s word cards and
  its “A new word” at the door until there is a meaningful group for it.
- Group order is chronological in broad outline, not a ranking of precise first English attestations. The date of a root, a historical event and a word’s modern sense may differ; never invent a definitive date to resolve overlaps. New words take their approximate place without creating a contrived beginning or ending to the group.
- Optional connections appear after individual word sources. Use them only
  for grounded links, and state whether a link is an etymological
  relationship, a historical parallel or a shared theme. Do not imply
  shared word origins when there are none; unconnected entries are fine.
- Group stories must remain sourced and accurate. Shared themes do not establish shared etymology. Review both the individual story and its relationship to the group’s introduction before assigning a word.
- Preserve the restrained typography and accessible ordinary links. Do not create empty or token groups merely to publish another word.

## Pictures with Stories editorial standard

Pictures with Stories uses detailed illustrations whose areas can be opened
to learn about what is shown. The Solar System journey combines realistic
illustrations with credited spacecraft imagery, moving through connected
views as the reader approaches each world. The black hole and quasar keep
their watercolor illustrations. Apply the Words with Stories standards for curation, sourcing,
accuracy and plain prose to this section as well.

- **The catalogue is grouped by subject.** Space holds the black hole, the
  quasar and the journey through the Solar System, including the Sun. Nebulae can
  follow, with birds, cats and other subject groups added as the
  collection grows. The group was called “The Space” until 9 October 2026,
  when the author renamed it. In English, space in the astronomical sense
  takes no article, and “the space” reads as a particular room or area.
  Every group follows the same drawing, storytelling and sourcing
  standards.

- **A subject appears once, and a group opens with its journey.** The Sun
  had a watercolor of its own until October 2026; it now lives only in the
  journey, where it means more as one stop on the way. What a journey does
  not reach is painted in watercolor. On the catalogue the journey comes
  first, as a wide view, and the watercolors follow beneath it as smaller
  pictures. They are two kinds of picture, a place to move through and a
  single painting, and the layout says so rather than setting them side by
  side as equals.

- **Choosing a destination brings the reader close to it.** The Solar
  System journey sets the pattern for future journeys: move through the
  places between departure and arrival at a measured pace, looking ahead
  through the worlds and finishing close to the chosen destination. Every
  way of choosing that subject leads to the same arrival.
  A wide view remains available whenever the reader wants their bearings.
  The reader can change course, arrive immediately or retrace their steps;
  reduced motion keeps the same destinations without the moving journey.

- For watercolor pictures, follow The Farm House’s watercolor language: broad brush strokes,
  transparent washes, a limited value range, visible pencil, occasional
  unfinished edges and exposed paper. Paint from scientific or historical
  references when the subject calls for them; preserve the forms that an
  explanation relies on. The Farm House’s fixed scenes remain its own set.
- Use The Farm House’s way of exploring: quiet areas on the picture,
  optional labels, named choices on a small screen, and a closer view
  alongside each explanation. Provide keyboard access and a way back to the
  picture. Sources sit below the explanation as links, with the full source
  list below the picture.
- Every clickable explanation must be sourced. Verify its factual claims
  before writing, and link to sources that support those claims. Prefer
  museums, universities, academic publications, archives and official
  institutions; use multiple sources when useful.
- **The clickable details carry the picture’s stories.** Every picture
  must have sourced details with stories worth telling. Each explanation
  should help the reader understand the part they opened and change how
  they see it. Let the subject determine the number of areas.
- **Choose the subject through its details first.** Ask whether there are
  enough story-worthy details to earn the picture’s place; this is required.
  Then ask whether there is an interesting account of how we came to know
  what it shows. Such an account gives a candidate priority, but remains
  optional. Give a clear one-sentence answer to: “Why this picture rather
  than hundreds of others?” If the details cannot justify it, let it wait.
- Describe what an illustration shows without attributing its painting to
  “we”. Use the subject directly or wording such as “shown here”. The AI
  disclosure in Notes covers these pictures; do not repeat it in their
  source sections.
- Keep the illustration accurate enough to support its explanations.
  Distinguish observed features from reconstructions and artistic choices
  where that distinction matters.
- If a claim is disputed or cannot be confirmed, explain the uncertainty or
  leave it out. Keep the prose plain and unshowy, following the same writing
  rules as Words with Stories.
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
  Judge every explanation and separate story by asking, “After reading it,
  does the reader notice or understand more in the picture?” Clickable
  explanations open its details; a separate story connects them. Let the
  subject determine the story’s length.
- **Let the subject choose its story and its opening.** “How do we know
  this?” is one useful way in: the observations, evidence and interpretations
  that let us understand what is shown. The history of its first drawing
  may belong here when it helps. Possible openings include the seismic
  evidence for Earth’s interior, early microscope observations of cells,
  or changing fossil reconstructions of Iguanodon. The black-hole story
  already follows this approach. Other subjects may carry their stories
  through their lives or relationships. The following are possible examples:

  - A bird may have a migration journey, a story behind its name, or a
    meaning people have given it.
  - A nebula may be understood through its formation and the changes ahead
    of it, with the picture’s details opening parts of that process.
  - A cat may lead to its history of living with people, or to the reason
    behind a behavior shown in the picture.

  Verify and source the particular claims before using any example. Keep
  observation, inference and artistic reconstruction clear; speculation
  follows the evidence, marked as such.
- **Pictures and Words can point to each other.** Five word stories touch
  the sky: *consider*, *desire*, *disaster*, *influence* and *lunatic*.
  When an explanation shows what a word still carries, link to its page,
  such as the Moon to *lunatic*. The link between *desire* and the stars
  is uncertain, and its page says so.

## Trivia editorial standard

Trivia contains quizzes. These rules govern what belongs inside them.

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
  records and living people’s roles can all change. The bank is not revisited on a schedule, so a question that
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
- A negative question (“least typical”, “not”) is allowed but should stay rare,
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

