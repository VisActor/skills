"""Local fallback for the U2Net human segmentation ONNX model (CPU)."""

import argparse
from pathlib import Path
from tempfile import TemporaryDirectory

from inspect_cutout import inspect
from PIL import Image, ImageOps


def remove(source, destination, model):
    import numpy as np
    import onnxruntime as ort

    if source.resolve() == destination.resolve() or destination.suffix.lower() != ".png":
        raise ValueError("Choose a separate PNG output path")
    with Image.open(source) as image:
        rgb = ImageOps.exif_transpose(image).convert("RGB")
    # U2Net human segmentation uses RGB at 320 square and ImageNet normalization.
    sample = np.asarray(rgb.resize((320, 320), Image.Resampling.LANCZOS), dtype=np.float32)
    sample /= max(float(sample.max()), 1)
    sample -= np.array([0.485, 0.456, 0.406], dtype=np.float32)
    sample /= np.array([0.229, 0.224, 0.225], dtype=np.float32)
    session = ort.InferenceSession(str(model), providers=["CPUExecutionProvider"])
    prediction = session.run(
        [session.get_outputs()[0].name],
        {session.get_inputs()[0].name: sample.transpose(2, 0, 1)[None]},
    )[0][0, 0]
    span = float(np.ptp(prediction))
    if not np.isfinite(prediction).all() or span < 1e-6:
        raise ValueError("No distinguishable person in prediction")
    mask = ((prediction - prediction.min()) * (255 / span)).clip(0, 255).astype("uint8")
    rgb.putalpha(Image.fromarray(mask).resize(rgb.size, Image.Resampling.LANCZOS))
    destination.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=destination.parent) as tmp:
        candidate = Path(tmp) / "portrait.png"
        rgb.save(candidate)
        inspect(candidate)
        candidate.replace(destination)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True, help="Existing u2net_human_seg.onnx")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        remove(args.image, args.output, args.model)
    except (ImportError, OSError, ValueError, RuntimeError) as error:
        parser.exit(1, f"Portrait segmentation failed: {error}\n")
