#!/usr/bin/env python3
"""Prepare a transparent person asset through a provider-neutral file workflow.

Exit 0: alpha-format checks passed; PNG and geometry saved, visual review pending.
Exit 2: original needs background removal; read the JSON report and use any provider.
Exit 1: invalid input/result or preparation failed.
No background-removal service, model or external command is invoked.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sys
import tempfile
from pathlib import Path

from inspect_subject import inspect_subject


class PreparationParser(argparse.ArgumentParser):
    """Reserve exit 2 for workflow handoff rather than argument failures."""

    def error(self, message: str) -> None:
        self.print_usage(sys.stderr)
        self.exit(1, f"Error: {message}\n")


def image_alpha(path: Path, threshold: int) -> tuple[object, dict]:
    """Read one still image, separating genuine zero-alpha pixels from an alpha channel."""
    from PIL import Image

    with Image.open(path) as source:
        if getattr(source, "n_frames", 1) != 1:
            raise ValueError("Use a still image, not an animated asset")
        if source.getexif().get(274, 1) not in (None, 1):
            raise ValueError("Normalize image orientation through an image tool before preparation")
        image = source.convert("RGBA")
        source_mode = source.mode
    alpha = image.getchannel("A")
    counts = alpha.histogram()
    total = image.width * image.height
    return image, {"file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                   "size": [image.width, image.height], "sourceMode": source_mode,
                   "alphaRange": list(alpha.getextrema()),
                   "zeroAlphaFraction": counts[0] / total,
                   "foregroundFraction": sum(counts[threshold:]) / total,
                   "hasZeroAlphaPixels": counts[0] > 0}


def usable_alpha(info: dict, minimum: float) -> bool:
    return info["foregroundFraction"] > 0 and info["zeroAlphaFraction"] >= minimum


def write_report(path: Path, report: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def same_file(left: Path, right: Path) -> bool:
    return left.resolve() == right.resolve() or (left.exists() and right.exists() and left.samefile(right))


def prepare(args: argparse.Namespace) -> tuple[int, dict]:
    from PIL import Image, ImageChops

    original, original_info = image_alpha(args.image, args.alpha_threshold)
    if original_info["foregroundFraction"] == 0:
        raise ValueError("Original image contains no foreground at the selected alpha threshold")
    record = {"status": "checking", "input": original_info,
              "policy": {"minimumZeroAlphaFraction": args.min_transparent_fraction,
                         "alphaThreshold": args.alpha_threshold},
              "visualAcceptance": "pending: inspect face, hands, hair, props and halos"}

    # A provider may return a full-frame grayscale mask instead of altered RGB pixels.
    if args.mask is not None:
        with Image.open(args.mask) as source_mask:
            if source_mask.mode not in ("1", "L") or source_mask.size != original.size:
                raise ValueError("Mask must be grayscale and exactly match the original dimensions; no implicit resize")
            if source_mask.getexif().get(274, 1) not in (None, 1):
                raise ValueError("Normalize mask orientation before preparation")
            mask = source_mask.convert("L")
        candidate = original.copy()
        candidate.putalpha(ImageChops.multiply(original.getchannel("A"), mask))
        candidate_info = {"file": args.mask.name,
                          "sha256": hashlib.sha256(args.mask.read_bytes()).hexdigest(),
                          "size": list(candidate.size), "sourceMode": "original RGB + mask",
                          "alphaRange": list(candidate.getchannel("A").getextrema()),
                          "zeroAlphaFraction": candidate.getchannel("A").histogram()[0] / (candidate.width * candidate.height),
                          "foregroundFraction": sum(candidate.getchannel("A").histogram()[args.alpha_threshold:]) / (candidate.width * candidate.height)}
        route = "supplied-mask-original-rgb"
    elif args.cutout is not None:
        candidate, candidate_info = image_alpha(args.cutout, args.alpha_threshold)
        route = "supplied-cutout-result"
    elif usable_alpha(original_info, args.min_transparent_fraction):
        candidate, candidate_info, route = original, original_info, "transparent-original"
    else:
        record.update({"status": "needs-background-removal", "nextAction": {
            "task": "remove-background", "inputFile": str(args.image.resolve()),
            "outputFormat": "PNG", "transparentBackground": True,
            "preserve": ["person identity", "pose", "face", "hands", "hair", "clothing", "held props"],
            "provider": "caller-selected; no specific tool is required",
            "resume": "Run this command again with --cutout pointing to the resulting local image"
        }})
        return 2, record

    record["candidate"] = candidate_info
    record["route"] = route
    if not usable_alpha(candidate_info, args.min_transparent_fraction):
        record.update({"status": "invalid-cutout-result",
                       "error": "Result must contain foreground and enough genuine zero-alpha background; RGBA or white pixels alone do not qualify"})
        return 1, record

    # Use alpha > 0 rather than the geometry threshold, preserving faint hair/fringes.
    bounds = candidate.getchannel("A").getbbox()
    if args.crop == "tight":
        cropped = candidate.crop(bounds)
        prepared = Image.new("RGBA", (cropped.width + 2 * args.padding,
                                      cropped.height + 2 * args.padding), (0, 0, 0, 0))
        prepared.paste(cropped, (args.padding, args.padding))
        crop_info = {"mode": "tight", "alphaBounds": list(bounds), "padding": args.padding,
                     "candidateToOutputOffset": [args.padding - bounds[0], args.padding - bounds[1]]}
    else:
        prepared = candidate
        crop_info = {"mode": "keep", "alphaBounds": list(bounds), "padding": 0,
                     "candidateToOutputOffset": [0, 0]}

    args.output.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary = tempfile.mkstemp(prefix=".subject-", suffix=".png", dir=args.output.parent)
    os.close(handle)
    staged = Path(temporary)
    try:
        prepared.save(staged, format="PNG")
        _, final_info = image_alpha(staged, args.alpha_threshold)
        if not usable_alpha(final_info, args.min_transparent_fraction):
            raise ValueError("Prepared image lost the required transparent background; increase padding or keep the original frame")
        geometry = inspect_subject(staged, args.bands, args.alpha_threshold, args.place)
        geometry["image"] = args.output.name
        final_info["file"] = args.output.name
        final_info["format"] = "PNG"
        os.replace(staged, args.output)
        write_report(args.geometry, geometry)
        record.update({"status": "prepared", "output": final_info, "crop": crop_info,
                       "formatChecksPassed": True,
                       "cutoutAcceptance": "pending",
                       "nextAction": {
                           "task": "review-cutout-before-layout",
                           "inputFile": str(args.image.resolve()),
                           "preparedFile": str(args.output.resolve()),
                           "checks": ["background removed around the actual subject, not only at the canvas edge",
                                      "no retained rectangular backdrop or gradient-only disguise",
                                      "face, hands, hair, clothing and props preserved",
                                      "HTML uses this prepared file, not the original or an older result"],
                           "meaning": "Alpha checks do not certify semantic background removal; inspect the actual pixels"
                       },
                       "backgroundRemoval": {"requiredForOriginal": not usable_alpha(original_info, args.min_transparent_fraction),
                                             "resultSupplied": args.cutout is not None or args.mask is not None,
                                             "performedByThisScript": False},
                       "geometryFile": args.geometry.name})
        return 0, record
    finally:
        staged.unlink(missing_ok=True)


def main() -> int:
    parser = PreparationParser(description=__doc__)
    parser.add_argument("--image", required=True, type=Path, help="Original image, never overwritten")
    parser.add_argument("--output", required=True, type=Path, help="Verified transparent PNG destination")
    result = parser.add_mutually_exclusive_group()
    result.add_argument("--cutout", type=Path, help="Optional local background-removal result from any provider")
    result.add_argument("--mask", type=Path, help="Full-size grayscale mask: white foreground, black background; original RGB retained")
    parser.add_argument("--report", type=Path, help="Defaults to OUTPUT.asset.json; updated across workflow phases")
    parser.add_argument("--geometry", type=Path, help="Defaults to OUTPUT.geometry.json")
    parser.add_argument("--crop", choices=["tight", "keep"], default="tight")
    parser.add_argument("--padding", type=int, default=16, help="Transparent padding for tight crop, default 16 pixels")
    parser.add_argument("--alpha-threshold", type=int, default=128)
    parser.add_argument("--min-transparent-fraction", type=float, default=0.01,
                        help="Minimum fraction of genuinely zero-alpha pixels, default 0.01")
    parser.add_argument("--bands", type=int, default=16)
    parser.add_argument("--place", nargs=4, type=float, metavar=("LEFT", "TOP", "WIDTH", "HEIGHT"))
    parser.add_argument("--force", action="store_true", help="Replace an existing output/geometry, never an input")
    args = parser.parse_args()
    args.report = args.report or args.output.with_suffix(".asset.json")
    args.geometry = args.geometry or args.output.with_suffix(".geometry.json")
    if args.output.suffix.lower() != ".png":
        parser.error("--output must be a .png file")
    if args.padding < 0 or not 1 <= args.bands <= 256 or not 1 <= args.alpha_threshold <= 255:
        parser.error("Padding must be nonnegative, bands 1–256 and alpha threshold 1–255")
    if not math.isfinite(args.min_transparent_fraction) or not 0 < args.min_transparent_fraction < 1:
        parser.error("--min-transparent-fraction must be finite and between 0 and 1")
    if args.place is not None and (not all(math.isfinite(v) for v in args.place)
                                   or args.place[2] <= 0 or args.place[3] <= 0):
        parser.error("--place requires finite coordinates and positive dimensions")
    inputs = [args.image] + ([args.cutout] if args.cutout else []) + ([args.mask] if args.mask else [])
    outputs = [args.output, args.report, args.geometry]
    if any(same_file(target, source) for target in outputs for source in inputs):
        parser.error("Output/report/geometry paths must never overwrite an input")
    if any(same_file(outputs[i], outputs[j]) for i in range(3) for j in range(i)):
        parser.error("Output, report and geometry must have distinct paths")
    if not args.force and (args.output.exists() or args.geometry.exists()):
        parser.error("Output or geometry already exists; choose a new path or use --force")
    try:
        code, record = prepare(args)
    except (OSError, ValueError, ImportError) as error:
        code, record = 1, {"status": "failed", "error": str(error), "visualAcceptance": "not checked"}
    write_report(args.report, record)
    print(json.dumps({"status": record["status"], "report": str(args.report),
                      "output": str(args.output) if code == 0 else None}, ensure_ascii=False))
    return code


if __name__ == "__main__":
    sys.exit(main())
