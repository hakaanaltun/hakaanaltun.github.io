#!/usr/bin/env python3
"""Generate /images/480/ and /images/960/ downscales at build time.

The card templates (piece-card.html, all-work-row.html, more-essays.js) build
srcsets by path substitution — /images/x.webp -> /images/480/x.webp — and
assume those files exist. This script makes that assumption true for every
image, including ones uploaded through the CMS, without committing variants
to the repo.

Rules (matching the original manual pipeline):
  - originals wider than the target are resized to that width (aspect kept)
  - originals at or below the target width are copied as-is
  - a variant already present in the repo is left untouched (committed
    variants win, so hand-tuned crops survive)
  - directory structure under images/ is mirrored (e.g. images/moris/...)
"""

import shutil
import sys
from pathlib import Path

from PIL import Image

IMAGES_DIR = Path("images")
TARGET_WIDTHS = (480, 960)
EXTENSIONS = {".webp", ".jpg", ".jpeg", ".png"}
SAVE_OPTS = {
    ".webp": {"quality": 82, "method": 6},
    ".jpg": {"quality": 82, "optimize": True},
    ".jpeg": {"quality": 82, "optimize": True},
    ".png": {"optimize": True},
}


def variant_dirs():
    return {IMAGES_DIR / str(w) for w in TARGET_WIDTHS}


def source_images():
    skip = variant_dirs()
    for path in sorted(IMAGES_DIR.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        if any(d in path.parents for d in skip):
            continue
        yield path


def make_variant(src: Path, width: int) -> str:
    dest = IMAGES_DIR / str(width) / src.relative_to(IMAGES_DIR)
    if dest.exists():
        return "kept"
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        if im.width <= width:
            shutil.copy2(src, dest)
            return "copied"
        ratio = width / im.width
        resized = im.resize((width, max(1, round(im.height * ratio))), Image.LANCZOS)
        opts = SAVE_OPTS.get(src.suffix.lower(), {})
        resized.save(dest, **opts)
        return "resized"


def main() -> int:
    if not IMAGES_DIR.is_dir():
        print("images/ not found — run from the repo root", file=sys.stderr)
        return 1
    counts = {"kept": 0, "copied": 0, "resized": 0}
    for src in source_images():
        for width in TARGET_WIDTHS:
            counts[make_variant(src, width)] += 1
    print(
        f"variants: {counts['resized']} resized, "
        f"{counts['copied']} copied as-is, {counts['kept']} already present"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
