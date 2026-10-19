#!/usr/bin/env bash
# The build Cloudflare runs for every push (see "Publishing" in AGENTS.md).
# It does what .github/workflows/pages.yml did for GitHub Pages, in the same
# order: image variants, the bundled PDF reader, the Jekyll build, the
# checks, and the comments taken out of the published styles and scripts.
# A failing step stops the build, and nothing is published.
#
# The checks run for main, where a build is published. A branch's build is
# a preview to look at; its checks run on the pull request on GitHub.
set -euo pipefail

pip install --quiet Pillow || pip install --quiet --user Pillow
python scripts/generate_image_variants.py
python scripts/vendor_pdfjs.py

npm ci
bundle config set --local path vendor/bundle
bundle install --quiet

JEKYLL_ENV=production bundle exec jekyll build

if [ "${WORKERS_CI_BRANCH:-}" = "main" ]; then
  npm test
fi

node scripts/strip-css-comments.cjs _site/css
node scripts/strip-js-comments.cjs _site/js
