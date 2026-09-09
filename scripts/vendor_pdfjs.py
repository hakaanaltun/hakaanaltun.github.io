"""Fetch the pinned Mozilla distribution at build time; serve it on our own site."""
import hashlib
import io
from pathlib import Path
import urllib.request
import zipfile

VERSION = "6.3.289"
SHA256 = "51683fac4aff7dd31ed91e9ab735a2098a78d50899d1ec529aed6dc8aa19400d"
URL = f"https://github.com/mozilla/pdf.js/releases/download/v{VERSION}/pdfjs-{VERSION}-legacy-dist.zip"

def main():
    with urllib.request.urlopen(URL, timeout=90) as response:
        data = response.read(32 * 1024 * 1024 + 1)
    if hashlib.sha256(data).hexdigest() != SHA256:
        raise RuntimeError("PDF.js distribution checksum mismatch")
    target = Path(__file__).resolve().parents[1] / "js/vendor/pdfjs"
    copied = set()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for entry in archive.infolist():
            name = entry.filename
            if entry.is_dir() or ".." in Path(name).parts:
                continue
            if name not in ("build/pdf.mjs", "build/pdf.worker.mjs", "LICENSE") and not name.startswith(("web/cmaps/", "web/standard_fonts/", "web/wasm/")):
                continue
            destination = target / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(archive.read(entry))
            copied.add(name)
    for required in ("build/pdf.mjs", "build/pdf.worker.mjs", "LICENSE"):
        if required not in copied:
            raise RuntimeError(f"Missing PDF.js asset: {required}")
    for directory in ("cmaps", "standard_fonts", "wasm"):
        if not any(name.startswith(f"web/{directory}/") for name in copied):
            raise RuntimeError(f"Missing PDF.js assets: {directory}")
    print(f"PDF.js {VERSION}: verified and installed {len(copied)} assets")

if __name__ == "__main__":
    main()
