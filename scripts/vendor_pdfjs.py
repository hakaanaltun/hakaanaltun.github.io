"""Restore the committed PDF.js bundle without making any network requests."""
import hashlib
import io
from pathlib import Path
import zipfile

VERSION = "6.3.289"
SHA256 = "ccf3ac1f43bce6e7e0550323512a33409b49906d688328b95ebfb77d5ca2e19f"

def main():
    bundle = Path(__file__).resolve().parent / "vendor" / f"pdfjs-{VERSION}.zip"
    data = bundle.read_bytes()
    if hashlib.sha256(data).hexdigest() != SHA256:
        raise RuntimeError("Bundled PDF.js checksum mismatch")
    target = Path(__file__).resolve().parents[1] / "js/vendor/pdfjs"
    copied = set()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for entry in archive.infolist():
            name = entry.filename
            if entry.is_dir() or Path(name).is_absolute() or ".." in Path(name).parts:
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
