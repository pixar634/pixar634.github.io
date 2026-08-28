"""Stitch a dark Bangalore raster for the landing Explore mock.

Carto's public `dark_all` CDN now watermarks every tile with
"API KEY REQUIRED", so we pull OSM's own raster (ODbL) and invert it
into a night map. Attribution on the page: © OpenStreetMap.
"""
import io
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

Z = 10
WEST, SOUTH, EAST, NORTH = 77.16, 12.78, 77.84, 13.56
UA = "LighthouseLanding/1.0 (https://letsgolighthouse.co.in; OSM tiles for a static landing mock)"


def deg2num(lat, lon, zoom):
    n = 2**zoom
    xtile = n * ((lon + 180.0) / 360.0)
    lat_rad = math.radians(lat)
    ytile = n * (1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2.0
    return xtile, ytile


def num2deg(xtile, ytile, zoom):
    n = 2**zoom
    lon = xtile / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * ytile / n)))
    return math.degrees(lat_rad), lon


def osm_night(im: Image.Image) -> Image.Image:
    """CSS-equivalent of invert(1) hue-rotate(180deg), then crush to brand dark."""
    im = ImageOps.invert(im.convert("RGB"))
    r, g, b = im.split()
    im = Image.merge("RGB", (b, g, r))
    im = ImageEnhance.Brightness(im).enhance(0.42)
    im = ImageEnhance.Contrast(im).enhance(1.2)
    im = ImageEnhance.Color(im).enhance(0.35)
    return im


def main():
    x0, y_north = deg2num(NORTH, WEST, Z)
    x1, y_south = deg2num(SOUTH, EAST, Z)
    tx0, tx1 = math.floor(x0), math.ceil(x1)
    ty0, ty1 = math.floor(min(y_north, y_south)), math.ceil(max(y_north, y_south))
    cols, rows = tx1 - tx0, ty1 - ty0
    tile = 256
    out = Image.new("RGB", (cols * tile, rows * tile), (15, 15, 18))
    for x in range(tx0, tx1):
        for y in range(ty0, ty1):
            url = f"https://tile.openstreetmap.org/{Z}/{x}/{y}.png"
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                im = Image.open(io.BytesIO(r.read())).convert("RGB")
            if im.size != (tile, tile):
                im = im.resize((tile, tile), Image.Resampling.LANCZOS)
            out.paste(osm_night(im), ((x - tx0) * tile, (y - ty0) * tile))
            print("ok", x, y)
    nlat, wlon = num2deg(tx0, ty0, Z)
    slat, elon = num2deg(tx1, ty1, Z)
    dest = Path(__file__).resolve().parent
    jpg = dest / "blr-dark.jpg"
    out.save(jpg, "JPEG", quality=86, optimize=True)
    print("BOUNDS", nlat, wlon, slat, elon)
    print("SAVED", jpg, jpg.stat().st_size, out.size)


if __name__ == "__main__":
    main()
