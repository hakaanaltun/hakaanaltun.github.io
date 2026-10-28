# Words with Stories

Notes on how to build and change Words with Stories, for the sessions that
work on it. The rules a reader could read, with their reasons, are in
`COLOPHON.md`; a note here marked "(rule in `COLOPHON.md`)" carries out a
rule written there.

## Collections (rules in `COLOPHON.md`)

The collections are listed in `_data/word_collections.yml` and rendered by
`_includes/word-collection.html` on `/word/<group>/` pages. Optional
connections live in `_data/word_bridges.yml`.

- A word outside every group (rule in `COLOPHON.md`): the author asked on
  13 October 2026 that The House follow the homepage here. The House's
  catalog still lists every word, marked `collected` or not, so a word a
  reader kept earlier keeps its current story in the drawer.
- **A word's page lists its collection at the right edge.** The author asked
  on 15 October 2026 for the book's Contents panel on the word pages. Its
  tab reads "Collection", and the frame lists the collection's words in
  its order, with the word being read marked and not a link, and "The
  collection" and "All collections" at its foot. The author asked for the
  way to its own collection the same day, when the frame led only to all
  of them. When the list is longer than the frame, the
  frame scrolls itself to the word being read. A word outside every group
  has no panel. On a screen under 640px tall the middle of the right edge
  reaches the tab, so the arrows go to the foot there, as they do under
  840px wide (`_includes/word-story.html`).
- On 13 October 2026 the author asked for the waiting words to be placed where a collection fits them. *algorithm*, *pamphlet* and *guy* joined The Names That Remained, *assassin*, *magazine* and *juggernaut* joined Words That Travelled, and *utopia*, *serendipity*, *x-ray* and *petrichor* became a ninth collection, Words Made on Purpose, for names whose first appearance can be traced to a page. Three loose sets of three were left waiting rather than made into small groups: *window*, *lens* and *camera* (seeing); *malaria*, *vaccine* and *muscle* (the body); *idiot*, *candidate* and *inaugurate* (public office). The same day *biscuit* and *emoji* joined Words That Travelled, and *text* and *Rosetta stone* joined Learning to Learn; the Rosetta stone's story lost two lines written for effect and a second statement of its definition. Six more wait because no collection's introduction fits their story: *climate* began with the angle of the sun, which is geography and holds no belief about the sky; *cobalt* is a miners' goblin and says nothing of what work is worth; *broadcast*, *farce*, *decimate* and *apron* have no collection near them.
- On 14 October 2026 the waiting words were placed and new collections were added: Seeing & Light (*window*, *focus*, *lens*, *camera*), The Body (*muscle*, *anatomy*, *placebo*, *malaria*, *vaccine*) and Public Life (*idiot*, *candidate*, *inaugurate*, *parliament*, *ballot*). *focus*, *anatomy*, *placebo*, *parliament* and *ballot* were new that day, and *cobalt* joined Work and Worth. The same day the author settled the rest. *silhouette* stays in The Names That Remained, whose introduction fits its uncertain story. Words That Changed Shape (*farce*, *apron*, *broadcast*) was taken down until it has enough words with a change of form to stand on: when suitable words come, look at them for this group, and it can return with them; meanwhile `/word/changing/` leads to the collections. *climate* and *decimate* wait until a group opens that fits them, so The Sky Above Us keeps its introduction about belief, and Public Life says nothing of military punishment. `scripts/test-house.cjs` does not depend on any word waiting: it checks that every word is listed for the drawer, and sets one aside in its own copy of the catalog to check that a waiting word is not announced as new.
- On 18 October 2026 six words were added: *meander* and *divan* joined Words That Travelled, *thrill* The Inner Life and *saturnine* The Sky Above Us. *calculate* and *clue* brought Words That Changed Shape back, with *farce*, *apron* and *broadcast*, and `/word/changing/` is its page again; its introduction names the two new turns. Three bridges were added, each a shared story rather than a shared origin: *meander* and *clue*, *saturnine* and *melancholy*, *divan* and *magazine*. *climate* and *decimate* still wait. Left out: *cipher*, which *zero* already tells, and *sincere*, whose “without wax” story is a folk etymology.
- Later on 18 October 2026 the author asked for the remaining candidates too. *jovial* and *mercurial* joined The Sky Above Us beside *saturnine*; *checkmate*, *hazard*, *sherbet* and *bergamot* joined Words That Travelled; *chauvinism* joined The Names That Remained, whose introduction allows a story that has grown in the telling; and *tragedy* joined Words That Changed Shape. *hazard*, *tragedy*, *chauvinism* and *bergamot* each say plainly what is uncertain in them. Four bridges were added: *jovial* and *saturnine*, *tragedy* and *farce*, *checkmate* and *calculate*, *chauvinism* and *quixotic*.
- On 28 October 2026 How We Judge was added at `/word/judging/`, for changes
  in praise, blame and respect. *silly*, *villain*, *nice*, *awful* and
  *prestige* are new; *dunce* moved from The Names That Remained. The order
  follows the stories’ broad historical settings, beginning with Old
  English and medieval usage, then the scholarly disputes behind *dunce*
  and the seventeenth-century borrowing of *prestige*. *idiot* stays in
  Public Life and *gossip* in Living Together, with thematic bridges to
  *dunce* and *villain*. *nice* and *silly* also link to each other.
  *freelance* joined Work and Worth between *cobalt* and *sabotage*; its
  story distinguishes nineteenth-century usage from the medieval soldiers
  it described. *climate* and *decimate* still wait.
