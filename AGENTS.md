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
