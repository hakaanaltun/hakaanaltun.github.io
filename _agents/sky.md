# The Sun, The Stars and Tonight

Notes on how to build and change the sky, for the sessions that work on
it. The rules a reader could read, with their reasons, are in
`COLOPHON.md`; a note here marked "(rule in `COLOPHON.md`)" carries out a
rule written there.

## Whose sky (rule in `COLOPHON.md`)

- The visitor's browser-reported IANA time zone is resolved through
  `_data/cities.yml`.

## The Sun, The Stars and Tonight

- **`js/bright-stars.js` is generated.** Change `scripts/build_sky_data.py`
  and run it with the three pinned sources named at its top: the Bright Star
  Catalogue, the IAU's catalogue of star names and d3-celestial's
  constellation lines. Do not edit the data by hand. T Coronae Borealis is
  left out, because the catalogue gives it the brightness of its 1866
  outburst, and Mira and chi Cygni are not drawn, because their brightness
  on a given night is unknown. The notes on `/stars/` say so.
- **One sky calculation serves three places.** `js/sky-map.js` works out and draws the sky for
  `/stars/`, the homepage's Tonight and The House, so they never disagree.
  Its scripts and their `?v=` are listed once, in `_data/sky_scripts.yml`.
  The homepage fetches them when Tonight comes near; The House only when its
  window is opened after dark, or when its balcony is dark.
- The moon's phase name and percentage come from `js/astronomy.js`
  everywhere, so The Moon, The House, Tonight and The Stars give the same
  moon. Positions of the moon and planets come from Astronomy Engine. The
  House draws the sun and the moon from `js/astronomy.js`, whose moon is
  checked against Astronomy Engine in `scripts/test-house.cjs`.
- `scripts/test-window-sky.cjs` checks the star data, both instruments and
  Tonight.
