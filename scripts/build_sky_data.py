"""Write js/bright-stars.js, the stars and constellation lines of /stars/.

Run with the three pinned sources, downloaded by hand:

  catalog.gz  Yale Bright Star Catalogue, 5th revised edition
              https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz
  names.html  IAU Working Group on Star Names, the catalogue of star names
              https://iauarchive.eso.org/public/themes/naming_stars/
  lines.json  d3-celestial constellation lines, commit 7e720a3
              https://raw.githubusercontent.com/ofrohn/d3-celestial/7e720a3de062059d4c5400a379146a601d9010e0/data/constellations.lines.json

  python3 scripts/build_sky_data.py catalog.gz names.html lines.json

Nothing is fetched here: the checksums say the files are the ones the
committed data was made from.
"""
import gzip
import hashlib
import html
import json
import math
import re
import sys
from pathlib import Path

SHA256 = {
    "catalog": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed",
    "names": "67392808893e0d45fc7e5ded7cdb4eb12987fed62b0d03e8d89d631181f7646d",
    "lines": "294f66bef5d5cf50b1e17f16d2efa1d97a15131612c68dd935adef6e7373e13c",
}
LIMIT = 4.5          # every star to this visual magnitude is drawn
LEFT_OUT = {
    5958: "T CrB, a recurrent nova; the catalogue's 2.0 is its 1866 outburst",
}
UNKNOWN_BRIGHTNESS = {
    681: "Mira, 2.0 to 10.1",
    7564: "chi Cyg, 3.3 to 14.2",
}
GREEK = {
    "Alp": "α", "Bet": "β", "Gam": "γ", "Del": "δ", "Eps": "ε", "Zet": "ζ",
    "Eta": "η", "The": "θ", "Iot": "ι", "Kap": "κ", "Lam": "λ", "Mu": "μ",
    "Nu": "ν", "Xi": "ξ", "Omi": "ο", "Pi": "π", "Rho": "ρ", "Sig": "σ",
    "Tau": "τ", "Ups": "υ", "Phi": "φ", "Chi": "χ", "Psi": "ψ", "Ome": "ω",
}
SUPERSCRIPT = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
LICENSE = Path(__file__).resolve().parents[1] / "js/vendor/d3-celestial-LICENSE.txt"
OUT = Path(__file__).resolve().parents[1] / "js/bright-stars.js"


def checked(path, key):
    data = Path(path).read_bytes()
    if hashlib.sha256(data).hexdigest() != SHA256[key]:
        raise RuntimeError(f"{path}: not the pinned {key} file")
    return data


def designation(field, hr):
    """The catalogue's name field: Flamsteed number, Bayer letter and its
    superscript, constellation. The Bayer letter wins; HR is the fallback."""
    flamsteed, bayer, digit, con = field[0:3].strip(), field[3:6].strip(), field[6:7].strip(), field[7:10].strip()
    if bayer:
        if bayer not in GREEK:
            raise RuntimeError(f"HR {hr}: unknown Bayer letter {bayer!r}")
        return GREEK[bayer] + digit.translate(SUPERSCRIPT) + " " + con
    if flamsteed and con:
        return flamsteed + " " + con
    return f"HR {hr}"


def read_catalogue(data):
    stars = {}
    for raw in gzip.decompress(data).decode("latin-1").splitlines():
        line = raw.ljust(197)
        if not line[75:77].strip() or not line[102:107].strip():
            continue  # removed from the catalogue: novae, clusters, galaxies
        hr = int(line[0:4])
        ra = int(line[75:77]) + int(line[77:79]) / 60 + float(line[79:83]) / 3600
        dec = int(line[84:86]) + int(line[86:88]) / 60 + int(line[88:90]) / 3600
        stars[hr] = {
            "hr": hr, "ra": ra, "dec": -dec if line[83] == "-" else dec,
            "mag": float(line[102:107]), "designation": designation(line[4:14], hr),
        }
    return stars


def read_names(data):
    text = data.decode("utf-8")
    names = {}
    for name, desig in re.findall(r"<tr><td>(.*?)</td>\s*<td>(.*?)</td>", text):
        match = re.fullmatch(r"HR (\d+)", html.unescape(desig).strip())
        if match:
            names[int(match.group(1))] = html.unescape(name).strip()
    if len(names) < 300:
        raise RuntimeError("the names table did not parse")
    return names


def read_lines(data, stars):
    """Each vertex becomes the catalogue star at its position, so a line
    always ends on a drawn star."""
    by_dec = sorted(stars.values(), key=lambda s: s["dec"])
    lines = {}
    for feature in json.loads(data)["features"]:
        polylines = []
        for coordinates in feature["geometry"]["coordinates"]:
            chain = []
            for lon, lat in coordinates:
                ra = (lon % 360) / 15
                def gap(s):
                    return math.hypot(((s["ra"] - ra + 12) % 24 - 12) * 15 * math.cos(math.radians(lat)), s["dec"] - lat)
                near = [s for s in by_dec if abs(s["dec"] - lat) < 0.2]
                best = min(near, key=gap) if near else None
                if best is None or gap(best) > 0.15:
                    raise RuntimeError(f"{feature['id']}: no catalogue star at {lon}, {lat}")
                if not chain or chain[-1] != best["hr"]:
                    chain.append(best["hr"])
            if len(chain) > 1:
                polylines.append(chain)
        # Serpens comes in two features, head and tail, under one id.
        lines.setdefault(feature["id"], []).extend(polylines)
    return lines


def main():
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    stars = read_catalogue(checked(sys.argv[1], "catalog"))
    names = read_names(checked(sys.argv[2], "names"))
    lines = read_lines(checked(sys.argv[3], "lines"), {k: v for k, v in stars.items() if k not in LEFT_OUT})
    on_lines = {hr for polylines in lines.values() for chain in polylines for hr in chain}
    keep = sorted(hr for hr, s in stars.items()
                  if hr not in LEFT_OUT and (s["mag"] <= LIMIT or hr in on_lines)
                  and (hr not in UNKNOWN_BRIGHTNESS or hr in on_lines))
    rows = []
    for hr in keep:
        s = stars[hr]
        mag = None if hr in UNKNOWN_BRIGHTNESS else round(s["mag"], 2)
        row = [hr, round(s["ra"], 5), round(s["dec"], 4), mag, s["designation"]]
        if hr in names:
            row.append(names[hr])
        rows.append(json.dumps(row, ensure_ascii=False, separators=(",", ":")))
    license_text = LICENSE.read_text(encoding="utf-8").strip()
    header = f"""/* The stars and constellation lines of /stars/. Generated by
   scripts/build_sky_data.py from pinned sources; change that, not this.

   Stars: Yale Bright Star Catalogue, 5th revised edition (Hoffleit &
   Warren 1991), https://cdsarc.cds.unistra.fr/viz-bin/cat/V/50. J2000
   positions, without proper motion. Every star to visual magnitude {LIMIT},
   and the fainter stars the constellation lines pass through.
   Left out: {"; ".join(LEFT_OUT.values())}.
   Not drawn, because the page cannot know how bright they are tonight:
   the long-period variables {" and ".join(UNKNOWN_BRIGHTNESS.values())}. A
   line that passes through one keeps it, with a null magnitude.

   Names: IAU Working Group on Star Names, catalogue of star names,
   https://iauarchive.eso.org/public/themes/naming_stars/

   Each star: [HR number, right ascension in hours, declination in degrees,
   visual magnitude, designation, IAU name if it has one].

   Lines: d3-celestial by Olaf Frohn, after the IAU and Sky & Telescope
   constellation charts, https://github.com/ofrohn/d3-celestial. Each line
   is a run of HR numbers. Its licence:

{chr(10).join("   " + l if l else "" for l in license_text.splitlines())}
*/
"""
    body = "window.OLAE_STARS = [\n" + ",\n".join(rows) + "\n];\n"
    body += "window.OLAE_CONSTELLATION_LINES = " + json.dumps(lines, separators=(",", ":")) + ";\n"
    OUT.write_text(header + body, encoding="utf-8")
    named = sum(1 for hr in keep if hr in names)
    print(f"{len(keep)} stars ({named} named), {sum(len(v) for v in lines.values())} lines in {len(lines)} constellations -> {OUT.name}")


if __name__ == "__main__":
    main()
