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
