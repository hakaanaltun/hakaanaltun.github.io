# AGENTS.md

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
- Keep the prose plain, as everywhere else here, and let the content do the
  work.
