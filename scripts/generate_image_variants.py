#!/usr/bin/env python3
"""Generate /images/480/ and /images/960/ downscales at build time, and the
same for the paintings in /pictures/assets/.

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

The paintings in pictures/assets/ get /pictures/assets/480/ and /960/ for
the cards on the Pictures index and the homepage, and the journey's scenes in
pictures/space/assets/ get theirs for its card in both places. Their variants are never
committed (.gitignore), and one older than its painting is made again, so a
repainted picture never shows its old card. `--pictures-only` makes just
these, for a local build: the session hook runs it so the cards show, and
it leaves images/ alone, where a local run would add untracked variants.
"""

import shutil
import sys
from pathlib import Path

from PIL import Image

IMAGES_DIR = Path("images")
PICTURES_DIRS = (Path("pictures/assets"), Path("pictures/space/assets"))
TARGET_WIDTHS = (480, 960)
EXTENSIONS = {".webp", ".jpg", ".jpeg", ".png"}
SAVE_OPTS = {
    ".webp": {"quality": 82, "method": 6},
    ".jpg": {"quality": 82, "optimize": True},
    ".jpeg": {"quality": 82, "optimize": True},
    ".png": {"optimize": True},
}

# A source photograph can be kept in its original format in the repository
# while the live site uses WebP. The mapping is explicit so the normal image
# pipeline stays unchanged for every other image. None needs it at present.
WEBP_DERIVATIVES = {}


def variant_dirs(root: Path):
    return {root / str(w) for w in TARGET_WIDTHS}


def source_images(root: Path):
    skip = variant_dirs(root)
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        if any(d in path.parents for d in skip):
            continue
        yield path


def make_variant(src: Path, width: int, root: Path = IMAGES_DIR,
                 refresh: bool = False) -> str:
    dest = root / str(width) / src.relative_to(root)
    if dest.exists() and not (refresh and dest.stat().st_mtime < src.stat().st_mtime):
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
    pictures_only = "--pictures-only" in sys.argv[1:]
    for src in ([] if pictures_only else source_images(IMAGES_DIR)):
        for width in TARGET_WIDTHS:
            counts[make_variant(src, width)] += 1
    for pictures_dir in PICTURES_DIRS:
        if not pictures_dir.is_dir():
            continue
        for src in source_images(pictures_dir):
            for width in TARGET_WIDTHS:
                counts[make_variant(src, width, pictures_dir, refresh=True)] += 1

    # Generate explicitly requested WebP derivatives after the normal variants.
    # If the source is already at or below a target width, WebP is still
    # encoded so the browser-facing path and format stay consistent.
    for src, rel_dest in ({} if pictures_only else WEBP_DERIVATIVES).items():
        if not src.exists():
            continue
        with Image.open(src) as im:
            im = im.convert("RGB")
            for width in TARGET_WIDTHS:
                dest = IMAGES_DIR / str(width) / rel_dest
                dest.parent.mkdir(parents=True, exist_ok=True)
                if im.width > width:
                    ratio = width / im.width
                    out = im.resize((width, max(1, round(im.height * ratio))), Image.LANCZOS)
                else:
                    out = im.copy()
                out.save(dest, format="WEBP", quality=90, method=6)

    print(
        f"variants: {counts['resized']} resized, "
        f"{counts['copied']} copied as-is, {counts['kept']} already present"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
