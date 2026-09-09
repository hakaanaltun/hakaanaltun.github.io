# Bundled PDF.js

`pdfjs-6.3.289.zip` is the permanent, repository-owned copy of the PDF.js
assets used by The Reader. Site builds unpack this local file and do not
download PDF.js from Mozilla, npm, or a CDN.

The bundle contains the exact 201 files from the successful production build
of commit `97061d4b9adc27b6e3a111768dab0589b783c11a`: the legacy library and
worker, character maps, standard fonts, WebAssembly helpers, and licenses.
No library code was changed when these files were repackaged.

Original upstream release:
https://github.com/mozilla/pdf.js/releases/tag/v6.3.289

Original `pdfjs-6.3.289-legacy-dist.zip` SHA-256 (verified by that build):
`51683fac4aff7dd31ed91e9ab735a2098a78d50899d1ec529aed6dc8aa19400d`

Committed bundle SHA-256 (verified on every build):
`ccf3ac1f43bce6e7e0550323512a33409b49906d688328b95ebfb77d5ca2e19f`

PDF.js is licensed under Apache-2.0. The bundle retains its root `LICENSE`
and the third-party license files supplied with fonts and WebAssembly assets.
Updates are deliberate: replace the bundle, update the version and checksum
in `scripts/vendor_pdfjs.py`, and run the PDF parser check before publishing.
