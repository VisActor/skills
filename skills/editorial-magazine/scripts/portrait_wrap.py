#!/usr/bin/env python3
"""Read transparent portrait alpha and emit matched CSS exclusions for two text columns."""

import argparse
import json
from pathlib import Path

from PIL import Image


def contours(
    path, width=972, image_height=1112, flow_height=1200, gap=22, step=28, image_width=None
):
    image_width = width if image_width is None else image_width
    if (
        min(width, image_width, image_height, flow_height, step) <= 0
        or gap < 0
        or flow_height < image_height
        or image_width > width
    ):
        raise ValueError("Positive sizes required; flow height must cover image height")
    with Image.open(path) as im:
        if "A" not in im.getbands():
            raise ValueError("Use a transparent PNG portrait")
        alpha = im.getchannel("A")
        if alpha.getextrema()[0] == 255 or not alpha.getbbox():
            raise ValueError("Portrait must contain both foreground and transparent space")
        iw, ih = im.size
        scale = min(image_width / iw, image_height / ih)
        ox, oy = (width - iw * scale) / 2, (image_height - ih * scale) / 2
        px = alpha.load()
        rows = []
        for y in range(ih):
            xs = [x for x in range(iw) if px[x, y] > 32]
            rows.append((min(xs), max(xs) + 1) if xs else None)
    if not any(rows):
        raise ValueError("Portrait foreground alpha is too faint to form an exclusion")
    bands = []
    for top in range(0, flow_height, step):
        bottom = min(flow_height, top + step)
        # Include vertical clearance, and extend the nearest silhouette over empty caps.
        lo = max(0, int((top - gap - oy) / scale))
        hi = min(ih, int((bottom + gap - oy) / scale) + 1)
        found = [r for r in rows[lo:hi] if r]
        if not found:
            nearest = min(
                (y for y, r in enumerate(rows) if r),
                key=lambda y: abs(oy + y * scale - (top + bottom) / 2),
            )
            found = [rows[nearest]]
        left = max(0, min(width / 2, ox + min(r[0] for r in found) * scale - gap))
        right = min(width, max(width / 2, ox + max(r[1] for r in found) * scale + gap))
        bands.append((top, bottom, left, right))
    half = width / 2
    left_pts = [(half, 0)]
    right_pts = [(0, 0)]
    for top, bottom, left, right in bands:
        left_pts += [(left, top), (left, bottom)]
        right_pts += [(right - half, top), (right - half, bottom)]
    left_pts.append((half, flow_height))
    right_pts.append((0, flow_height))

    def polygon(points):
        return (
            "polygon("
            + ", ".join(f"{x / half * 100:.3f}% {y / flow_height * 100:.3f}%" for x, y in points)
            + ")"
        )

    return dict(
        canvasWidth=width,
        imageWidth=image_width,
        imageHeight=image_height,
        flowHeight=flow_height,
        gap=gap,
        imageFit="contain",
        imagePosition="center",
        leftShape=polygon(left_pts),
        rightShape=polygon(right_pts),
        minimumTextWidth=round(
            min(min(left_edge, width - right_edge) for _, _, left_edge, right_edge in bands),
            2,
        ),
    )


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--image", type=Path, required=True)
    p.add_argument("--width", type=int, default=972)
    p.add_argument("--image-width", type=int, help="Centered portrait width inside the text canvas")
    p.add_argument("--image-height", type=int, default=1112)
    p.add_argument("--flow-height", type=int, default=1200)
    p.add_argument("--gap", type=int, default=22)
    p.add_argument("--step", type=int, default=28)
    args = p.parse_args()
    print(
        json.dumps(
            contours(
                args.image,
                args.width,
                args.image_height,
                args.flow_height,
                args.gap,
                args.step,
                args.image_width,
            ),
            indent=2,
        )
    )
