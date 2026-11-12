"""Place full-body cutouts from one overview on matching transparent canvases."""

import argparse
from pathlib import Path

from PIL import Image


def align(inputs: list[Path], output: Path) -> None:
    cutouts = []
    for path in inputs:
        with Image.open(path) as source:
            image = source.convert("RGBA")
        alpha = image.getchannel("A")
        bounds = alpha.getbbox()
        if not bounds or alpha.getextrema()[0] != 0:
            raise ValueError(f"Expected a transparent cutout with a visible subject: {path}")
        cutouts.append(image.crop(bounds))

    height = min(1800, max(image.height for image in cutouts))
    widths = [max(1, round(image.width * height / image.height)) for image in cutouts]
    width = max(widths)
    output.mkdir(parents=True, exist_ok=True)
    for index, (image, subject_width) in enumerate(zip(cutouts, widths), 1):
        canvas = Image.new("RGBA", (width, height))
        subject = image.resize((subject_width, height), Image.Resampling.LANCZOS)
        canvas.paste(subject, ((width - subject_width) // 2, 0))
        canvas.save(output / f"look-{index:02}.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    align(args.inputs, args.output)
