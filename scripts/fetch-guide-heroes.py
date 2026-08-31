# Pulls 1280px Commons renditions for the published guide heroes into
# assets/places/lg/. Run from landing/:
#   python scripts/fetch-guide-heroes.py
#
# The 500px thumbs in assets/places/ stay as they are: those feed the phone
# replicas, where a small file is the point. A guide page renders its hero at
# up to 900px wide, so the same thumb would be an upscale — and "original,
# well-lit images" is the whole reason these pages are worth indexing.
#
# Special:FilePath?width= is used rather than a hand-built /thumb/ URL because
# the thumb path needs the file's md5 shards; the redirect knows them already.
#
# Everything is then cropped to one 3:2 band. The sources run from 16:9 to
# portrait, and a guide page that changes shape per place reads as broken
# rather than as varied.

import io
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "places" / "lg"
WIDTH = 1280

MAX_W = 1200
RATIO = 3 / 2
QUALITY = 82

# Fraction of the surplus height taken off the top when a portrait source is
# cropped down to the band. Below 0.5 keeps the horizon rather than centring on
# whatever happens to be mid-frame.
TOP_BIAS = 0.35

# local name -> Commons File: title (from assets/places/ATTRIBUTION.txt)
FILES = {
    "ganalu.jpg": "Ganalu_Falls.jpg",
    "gundamagere.jpg": "Gundamagere_Lake.jpg",
    "rayakottai.jpg": "Dilapidated_Structure_-1_, Tip_Sultan_Fort, Rayakottai, Tamilnadu, India.JPG",
    "kakkadampoyil.jpg": "Kakkadampoyil_Kerala_Western_Ghats_DSC09436.jpg",
    "muthathi.jpg": "Bank_of_River_Kaveri_at_Muthathi, Karnataka.jpg",
    "kinnakorai.jpg": "Kinnakorai_from_Manjur.jpg",
}

UA = "LighthouseLandingBuild/1.0 (https://letsgolighthouse.co.in; hello@letsgolighthouse.co.in)"


def to_band(data):
    im = Image.open(io.BytesIO(data))
    im = im.convert("RGB")
    w, h = im.size

    if w / h > RATIO:
        keep = round(h * RATIO)
        off = (w - keep) // 2
        im = im.crop((off, 0, off + keep, h))
    else:
        keep = round(w / RATIO)
        off = round((h - keep) * TOP_BIAS)
        im = im.crop((0, off, w, off + keep))

    if im.width > MAX_W:
        im = im.resize((MAX_W, round(MAX_W / RATIO)), Image.LANCZOS)

    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=QUALITY, progressive=True, optimize=True)
    return buf.getvalue(), im.size


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for local, title in FILES.items():
        quoted = urllib.parse.quote(title.replace(" ", "_"))
        url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quoted}?width={WIDTH}"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as res:
            data = res.read()
        out, (w, h) = to_band(data)
        (OUT / local).write_bytes(out)
        print(f"{local}: {w}x{h}, {len(out) // 1024} KB")


if __name__ == "__main__":
    main()
