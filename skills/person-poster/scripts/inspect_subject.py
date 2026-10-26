#!/usr/bin/env python3
"""Read an image's alpha silhouette and optionally map centered contain placement.

Requires Pillow. Writes JSON only; never rewrites or removes image pixels.
Bounds use [left, top, right, bottom], with right/bottom exclusive.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def map_bounds(bounds: tuple[int, int, int, int], placement: dict) -> list[float]:
    """Map source bounds to CSS pixels using the reported centered contain fit."""
    left, top = placement["imageOrigin"]
    scale = placement["scale"]
    x0, y0, x1, y1 = bounds
    return [round(left + x0 * scale, 3), round(top + y0 * scale, 3),
            round(left + x1 * scale, 3), round(top + y1 * scale, 3)]


def inspect_subject(image_path: Path, bands: int, threshold: int,
                    box: list[float] | None = None) -> dict:
    """Return conservative horizontal-band bounds without modifying the image."""
    from PIL import Image

    with Image.open(image_path) as source:
        width, height = source.size
        original_mode = source.mode
        # Browser-oriented JPEG placement is outside this raw-pixel measurement model.
        if source.getexif().get(274, 1) not in (None, 1):
            raise ValueError("EXIF orientation is not normalized; use browser-measured geometry for this image")
        alpha = source.convert("RGBA").getchannel("A")

    histogram = alpha.histogram()
    total = width * height
    mask = alpha.point(lambda value: 255 if value >= threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("No subject pixels meet the alpha threshold; inspect the image or lower the threshold")

    placement = None
    if box is not None:
        left, top, box_width, box_height = box
        scale = min(box_width / width, box_height / height)
        origin = [left + (box_width - width * scale) / 2,
                  top + (box_height - height * scale) / 2]
        placement = {"fit": "contain", "objectPosition": "center center",
                     "elementBox": box, "scale": scale, "imageOrigin": origin}

    occupied = []
    # Divide source pixels exactly once, including when bands exceed image height.
    for index in range(min(bands, height)):
        y0 = index * height // min(bands, height)
        y1 = (index + 1) * height // min(bands, height)
        local = mask.crop((0, y0, width, y1)).getbbox()
        if local is None:
            continue
        bounds = (local[0], y0 + local[1], local[2], y0 + local[3])
        band = {"index": index, "sourceBand": [y0, y1],
                "sourceBounds": list(bounds),
                "normalizedBounds": [round(bounds[0] / width, 6), round(bounds[1] / height, 6),
                                     round(bounds[2] / width, 6), round(bounds[3] / height, 6)]}
        if placement is not None:
            band["canvasBounds"] = map_bounds(bounds, placement)
        occupied.append(band)

    report = {"image": image_path.name, "imageSize": [width, height],
              "sourceMode": original_mode, "alphaRange": list(alpha.getextrema()),
              "hasTransparentPixels": histogram[255] < total,
              "hasZeroAlphaPixels": histogram[0] > 0,
              "transparentPixelFraction": round(histogram[0] / total, 6),
              "partialAlphaPixelFraction": round(sum(histogram[1:255]) / total, 6),
              "alphaThreshold": threshold, "sourceBounds": list(bbox),
              "occupiedBands": occupied,
              "limitations": ["Band bounds are conservative, not a pixel-perfect exclusion mask.",
                              "Semantic regions such as face, hands and instruments require visual inspection.",
                              "Low-alpha fringes may extend beyond threshold bounds."]}
    if placement is not None:
        report["placement"] = placement
        report["canvasBounds"] = map_bounds(bbox, placement)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True, help="Existing image to inspect, never modified")
    parser.add_argument("--output", type=Path, help="Write JSON here, or print JSON when omitted")
    parser.add_argument("--bands", type=int, default=16, help="Horizontal bands, 1–256 (default 16)")
    parser.add_argument("--alpha-threshold", type=int, default=128, help="Minimum included alpha, 1–255")
    parser.add_argument("--place", nargs=4, type=float, metavar=("LEFT", "TOP", "WIDTH", "HEIGHT"),
                        help="Centered contain element box in CSS pixels; no transform, border or padding")
    args = parser.parse_args()
    if not 1 <= args.bands <= 256:
        parser.error("--bands must be between 1 and 256")
    if not 1 <= args.alpha_threshold <= 255:
        parser.error("--alpha-threshold must be between 1 and 255")
    if args.place is not None and (not all(math.isfinite(v) for v in args.place)
                                   or args.place[2] <= 0 or args.place[3] <= 0):
        parser.error("--place requires finite coordinates and positive width/height")
    if args.output is not None and args.output.resolve() == args.image.resolve():
        parser.error("--output must differ from --image; this tool never modifies the image")

    try:
        report = inspect_subject(args.image, args.bands, args.alpha_threshold, args.place)
    except ImportError:
        parser.error("Pillow is required; use a Python environment with Pillow installed")
    except (OSError, ValueError) as error:
        parser.error(str(error))
    payload = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output is None:
        print(payload, end="")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
        print(f"Subject geometry written: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
