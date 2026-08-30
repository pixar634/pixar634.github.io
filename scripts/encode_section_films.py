"""Encode the Moody and Return Clock section films for the landing.

Masters are 1280x720. The 1080p `-uhd` cut is an exact 1.5x lanczos of that.
The `-4k` cut is an exact 2x of the 1080p file (3840x2160). That is still an
upscale — it will look sharper on a large display than stretching 720p in
the browser, but it is not camera 4K.

Library: imageio-ffmpeg (bundles an ffmpeg binary).

  py -3 -m pip install imageio-ffmpeg
  py -3 landing/scripts/encode_section_films.py
"""

from __future__ import annotations

import os
import subprocess
import sys

try:
    import imageio_ffmpeg
except ImportError:
    sys.exit("pip install imageio-ffmpeg  (bundles the ffmpeg binary this script shells out to)")

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "assets", "video"))

FILMS = ("mood-bg", "clock-bg")


def run(args: list[str]) -> None:
    print("+", " ".join(args[1:8]), "...")
    subprocess.run(args, check=True)


def encode(src: str, dst: str, width: int, height: int, crf: str, level: str) -> str:
    if not os.path.isfile(src):
        sys.exit("missing source: " + src)
    vf = (
        f"scale={width}:{height}:flags=lanczos,"
        "unsharp=5:5:0.35:5:5:0.0,"
        "format=yuv420p"
    )
    run([
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-stats",
        "-i", src, "-an",
        "-vf", vf,
        "-c:v", "libx264",
        "-profile:v", "high", "-level", level,
        "-preset", "medium", "-crf", crf,
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
        dst,
    ])
    kb = os.path.getsize(dst) / 1024
    print(f"  wrote {os.path.basename(dst)}  {kb:.0f} KB")
    return dst


def main() -> None:
    print("ffmpeg", FFMPEG)
    for stem in FILMS:
        master = os.path.join(ROOT, stem + ".mp4")
        uhd = os.path.join(ROOT, stem + "-uhd.mp4")
        fourk = os.path.join(ROOT, stem + "-4k.mp4")
        if not os.path.isfile(uhd):
            encode(master, uhd, 1920, 1080, "20", "4.1")
        encode(uhd, fourk, 3840, 2160, "22", "5.1")


if __name__ == "__main__":
    main()
