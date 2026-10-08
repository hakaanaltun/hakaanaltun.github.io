#!/bin/bash
# Gets a cloud session ready to build and check the site, so the first
# `bundle exec jekyll build && npm test` works without setting anything up.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Jekyll and its plugins, into the git-ignored vendor/bundle (.bundle/config).
bundle install --quiet

# jsdom and css-tree for the checks in scripts/.
npm install --no-audit --no-fund --loglevel=error

# The Reader's PDF.js, unpacked from scripts/vendor/ for the PDF checks.
python3 scripts/vendor_pdfjs.py >/dev/null

# The Pictures cards' downscales, which the deploy makes on GitHub.
python3 -c 'import PIL' 2>/dev/null || pip install --quiet Pillow
python3 scripts/generate_image_variants.py --pictures-only >/dev/null
