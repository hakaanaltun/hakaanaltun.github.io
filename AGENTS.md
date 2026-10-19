# AGENTS.md

## Where the rules are

The rules every change answers to are in `COLOPHON.md`, written so that it
could be published as the site's Colophon. Read it at the start of every
session. How each part of the site is made is in `_agents/`, one file to
an area: read the one for the area you work on before changing anything
there, and read them all before a change that crosses the site.

| Working on | Read |
| --- | --- |
| The House: the study, the balcony, its sky, weather and sound | `_agents/house.md` |
| The Farm House | `_agents/farm-house.md` |
| Pictures with Stories and the journey through the Solar System | `_agents/pictures.md` |
| Words with Stories | `_agents/words.md` |
| Trivia | `_agents/trivia.md` |
| The instruments, The Desk and their drawer | `_agents/instruments.md` |
| Reading options, keeping, notes, highlights, the drawer and the way back | `_agents/reading.md` |
| The Sun, The Stars, Tonight and whose sky they follow | `_agents/sky.md` |
| The header, footer, homepage, search, type, punctuation in the build and interface details | `_agents/site.md` |

## Where a new note goes

- **A rule a reader could read goes in `COLOPHON.md`, with its reason.**
  Write it so it could be published: no file paths, scripts, tests or
  `?v=`, and nothing that gives away what The House, the farm or a quiz
  keeps for readers to find. The author asked for the colophon to be set
  apart this way on 17 October 2026.
- **How a rule is carried out goes in its area's file in `_agents/`.**
  Name the rule there with "(rule in `COLOPHON.md`)" and do not write it
  out again, so the two never disagree.
- **What every session needs to work stays here:** building, checking,
  branches and handing over.

## Working on the site

This repository is a **Jekyll 4 static site** called "On Life & Everything",
a personal blog built and published by Cloudflare (see Publishing, below).
Ruby, RubyGems and Bundler 4.0.13 are preinstalled in the Cloud VM. At the
start of a cloud session, `.claude/hooks/session-start.sh` installs the gems
and the npm packages for the checks, restores the bundled PDF.js and makes
the Pictures cards' downscales. Gems go into the git-ignored
`vendor/bundle/`, as configured by `.bundle/config`.

### Running the site (dev)

- Serve the site with live reload using
  `bundle exec jekyll serve --host 0.0.0.0 --port 4000`, and open
  http://localhost:4000/. Run it in a long-lived tmux session.
- Build the site with `bundle exec jekyll build`. Output goes to the
  git-ignored `_site/`.
- Run `bundle exec jekyll build`, followed by `npm test`. Outside a cloud
  session, run `python3 scripts/vendor_pdfjs.py`,
  `python3 scripts/generate_image_variants.py --pictures-only` (it needs
  Pillow) and `npm ci` first. The PDF checks need the bundled PDF.js, and
  the Pictures cards need their downscales. CI runs the same checks on every
  pull request. Several checks read the built `_site/`.
  `scripts/test-content.cjs` checks the editorial rules that can be tested
  in code. These cover quiz-bank structure and rounds, word-story footnotes
  numbered in first-cited order, closed-up em dashes, the word joiners the
  build puts before them, links within the site and curly quotes. It reports every
  problem it finds in one run.
- `npm run links` fetches every cited source address. It runs weekly from
  `.github/workflows/links.yml`. Because it depends on other sites being up,
  it is kept out of pull-request checks. Only a page that is gone fails it.

### Publishing

- **Cloudflare builds and publishes the site; GitHub keeps the files.** The
  author asked for the move on 19 October 2026, after an evening when GitHub
  took up to half an hour to start each build and longer still to mark it
  finished, while the next merge waited behind it. Cloudflare builds each
  push itself, in a queue only this site uses, publishes `main` at
  hakanaltun.io, and gives every other branch a preview address of its own
  (`<version>-hakanaltun-io.hakanaltunn.workers.dev`, shown on the build) to
  look at before it is merged. `.github/workflows/pages.yml` now only checks
  pull requests and publishes nothing.
- The Worker is `hakanaltun-io` in the author's Cloudflare account; its
  builds, logs and domains are under Workers & Pages. hakanaltun.io is its
  custom domain, and a redirect rule on the zone sends `www.` to the bare
  domain. The four A records that pointed at GitHub Pages are still in the
  zone's DNS, unused while the custom domain stands; they can go.
- Cloudflare runs `scripts/cloudflare-build.sh`, which does what
  `.github/workflows/pages.yml` does, in the same order, and runs the checks
  for `main` only. `wrangler.jsonc` serves `_site/` as it is.
- **Addresses stay as they were.** Cloudflare would redirect `/pieces/x.html`
  to `/pieces/x`; `wrangler.jsonc` turns that off (`html_handling: "none"`),
  and `workers/site.mjs` does the two things GitHub Pages did on its own: a
  folder's address is its `index.html`, and `/about` leads on to `/about/`.
  Every other missing address gets `404.html`. The script runs only for
  addresses that are not a file, so pages and images are served directly.
  `scripts/test-site-worker.mjs` checks it against the built site.

### Non-obvious notes

- URLs use the "pretty" format. Source files such as `about.html` and
  `archive.html` are served at `/about/` and `/archive/`, with trailing
  slashes. Posts use the permalink pattern `/pieces/:slug.html`, set in
  `_config.yml`.
- **Old addresses send the reader on.** Pieces were served at
  `/essays/<slug>.html` until 30 May 2026, and search engines still list
  some of them. Each has a small page in `essays/`, in the same form as
  `pieces/handled.html`: `sitemap: false`, `noindex,follow`, an immediate
  refresh and a canonical link. `/essays/` leads to Writing, and `/writing/`
  and `/instruments/`, the menu's own names, lead to Writing and
  Instruments. When a page moves, point every old address at its new place.
  `scripts/test-content.cjs` fails on an address that moves on twice.
- `_config.yml` sets `future: true`, so posts dated in the future render
  as intended.
- Cloudflare's build uses its own Ruby (3.4 in October 2026) and the
  pull-request check uses Ruby 3.3; the Gemfile carries the gems Ruby 3.4
  no longer bundles, so both build the same site. The VM's apt-provided Ruby
  3.2 also builds the site.
- `style.css` and `palettes.css` are linked once in `_includes/head.html`
  for every page that uses the default layout. Bump the `?v=` there when
  either changes.
- **A changed stylesheet or script needs a new `?v=` everywhere it is
  loaded.** `scripts/test-asset-versions.cjs` compares a pull request with
  its base branch and fails on any page, include or `_data` list that
  still loads a changed file in `css/` or `js/` under its old stamp. A
  stylesheet whose rules are unchanged, with only its comments edited,
  needs no bump. One was missed on 12 October 2026 and needed a pull
  request of its own.
- The published stylesheets and scripts carry no comments. After the
  checks, deployment runs `scripts/strip-css-comments.cjs` on `_site/css`
  and `scripts/strip-js-comments.cjs` on `_site/js`, and fails if any rule
  or program would change. The scripts in `js/vendor/` keep theirs, with
  their licences. Keep writing comments in `css/` and `js/`, where a local
  build keeps them. Styles and scripts inside a page's own `<style>` and
  `<script>` remain untouched.
- **The Colophon is not published for now.** `colophon.html` showed this
  file at `/colophon/` until the author took the page down on
  8 October 2026. On 17 October 2026 the author asked for the colophon to
  be set apart as if it were to be published: its text is now
  `COLOPHON.md`, which `_plugins/colophon_md.rb` reads without processing
  Liquid. `_config.yml` excludes this file, `COLOPHON.md` and
  `colophon.html`, so taking `colophon.html` out of that list brings the
  page back. `scripts/test-content.cjs` checks the dashes and the words
  split across line breaks in `COLOPHON.md`, this file and `_agents/`, and
  the curly marks in `COLOPHON.md`. A split word would appear on the page
  as two (`hand- balancing`).

## Starting a session

Every session starts cold and remembers nothing of the last one, so what was
learned the hard way is written down here instead.

- **Build the working branch from `main`, before writing anything.** Branch
  names are reused across sessions here, so a branch that looks ready to
  continue may be carrying a pull request that was merged days ago. New
  commits stacked on merged history produce a pull request nobody can read.
  Start with `git fetch origin main && git checkout -B <branch> origin/main`.
- **A merge can land while you are still pushing, and nothing will say so.**
  This happened twice in one session: a prose fix was pushed after its pull
  request had already been merged, so it sat on the branch and never reached
  the site—and it was only caught later, by chance. Before opening anything
  new, check that the last commit you pushed is an ancestor of `origin/main`
  (`git merge-base --is-ancestor <sha> origin/main`) and carry over whatever
  is not. Ask to be told when a pull request is merged; it is cheaper than
  finding out.
- **Every test closes the windows it opens.** A jsdom window left open
  keeps its timers running, and the checks then never finish. On
  12 October 2026 one such check held the deploy queue for over an hour,
  and two merges waited behind it. The checks now stop after twenty
  minutes, and since 19 October 2026 they no longer stand between a merge
  and the site: GitHub only checks pull requests.
- **This site is read as pages.** Its author reviews a change by
  looking at it, which for a long time meant merging first and looking after.
  Build the site and hand over the rendered pages that changed and
  the index they sit in before asking for a merge. The author needs to read
  the actual paragraph in its page.
- **Say what changed.** A pull request description
  names the work and its shape; the line-by-line reasoning behind an edit
  belongs in the conversation. The public description outlives it.
  "The prose was simplified" is the right altitude.
- **Hand the pull request over as soon as it is open.** Do not wait for
  its checks to finish before telling the author. Their result shows on
  the pull request, and a failing check shows at the merge button. Run
  what can be run before pushing; if a check fails after the handover,
  say so and fix it. The author asked for this on 14 October 2026, after
  sessions kept stopping for minutes to watch the checks.

## Before showing anything

These rules record what went wrong on the day The House opened, so that
it does not go wrong again.

- **Look at it before anyone else does.** Passing checks say a page works. Its appearance still has to be judged. Build the site, open the page in a browser and look at
  every state it has: each hour of The House, a phone, the dark themes. A
  drawing can only be judged by looking at it. A Moris drawn from coordinates
  and never rendered reached the author, and it was not a cat.
- **Say "I can't" at the start.** Some things cannot be done well from here,
  and a likeness drawn by writing SVG coordinates is one of them. Say so
  before trying. The author should hear it before seeing the attempt.
- **Describe a photograph from the photograph.** Look at it before writing its
  alt text or a line under it, and ask the author about whatever the picture
  cannot settle, including where he is and what he is looking at. A line written for the
  drawn room was put under a photograph of somewhere else.
- **Report only what you have reproduced.** A problem named before it is
  confirmed costs trust twice, once when it is said and again when it is taken
  back. That day a header "covering" the room turned out to be a scrolled
  page, and "broken" photographs were only missing from a local build.
- **`/images/480/` and `/images/960/` are made at every build** by
  `scripts/generate_image_variants.py`, in `scripts/cloudflare-build.sh` and
  in the pull-request check. A
  local build has only the variants that are committed, so an image missing
  locally may be fine on the site. Check the live address before calling it
  broken. The same script makes `/pictures/assets/480/` and `/960/` for the
  Pictures cards on the index and the homepage, and
  `/pictures/space/assets/480/` and `/960/` for the journey's card in both
  places. These are never committed.
  In a cloud session the hook makes them for a local build; elsewhere, run
  the script with `--pictures-only`.
