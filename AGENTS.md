# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **Jekyll 4 static site** ("On Life & Everything", a personal blog) that is deployed to GitHub Pages via `.github/workflows/pages.yml`. Ruby, RubyGems, and Bundler 4.0.13 are pre-installed in the Cloud VM, and the startup update script runs `bundle install` (gems install into the git-ignored `vendor/bundle/`, configured by `.bundle/config`).

### Running the site (dev)
- Serve with live reload: `bundle exec jekyll serve --host 0.0.0.0 --port 4000` (open http://localhost:4000/). Run it in a long-lived tmux session, not a one-shot background process.
- Build only: `bundle exec jekyll build` (output goes to the git-ignored `_site/`).
- There is no separate lint or test suite; `bundle exec jekyll build` completing without errors is the effective build/lint check.

### Non-obvious notes
- URLs are "pretty": source files like `about.html` / `archive.html` are served at `/about/` and `/archive/` (trailing slash), NOT `/about.html`. Posts use the permalink pattern `/pieces/:slug.html` (set in `_config.yml`).
- `_config.yml` sets `future: true`, so posts dated in the future still render — expected for this repo.
- The production Pages workflow uses Ruby 3.3; the VM uses the apt-provided Ruby 3.2, which builds the site fine.

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

`Trivia` is quizzes, not a question dump. Adding one is three files and is
described in `_data/trivia.yml`; this is what belongs inside them.

- A question earns its place through its **note**, not its difficulty. The note
  is the only thing a reader keeps, so it must tell them something the question
  did not: the tower has been Elizabeth Tower since 2012; the settlement the
  Romans called Aquae Sulis. A note that restates the answer in other words
  should be rewritten or the question dropped.
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
- Keep the prose plain, as everywhere else here. A question is a question; it
  does not need a joke, a wink, or a flourish. The reader should remember the
  answer, not the phrasing.
