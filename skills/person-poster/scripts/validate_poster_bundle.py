#!/usr/bin/env python3
"""Check native chart spec structure and bundle wiring, not the full VChart API."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from validate_bundle import (
    ValidationResult,
    chart_payload,
    path_exists,
)
from validate_bundle import (
    validate_bundle as validate_production_bundle,
)


def validate_chart_spec(spec: object) -> list[str]:
    """Check the local JSON-data contract without rejecting VChart extension fields."""
    if not isinstance(spec, dict):
        return ["chart spec must be an object"]
    errors = []
    if not isinstance(spec.get("type"), str) or not spec["type"].strip():
        errors.append("Native VChart spec requires type; old chart schemas must be converted")
    if spec.get("animation") is not False:
        errors.append("spec.animation must be false for deterministic poster export")
    owners = [spec]
    series = spec.get("series", [])
    if not isinstance(series, list) or any(not isinstance(item, dict) for item in series):
        errors.append("series must be an array of objects")
    else:
        owners.extend(series)
    found = False
    for owner in owners:
        if owner is not spec and owner.get("animation", False) is not False:
            errors.append("series.animation must not enable animation")
        if "data" not in owner:
            continue
        blocks = owner["data"]
        blocks = [blocks] if isinstance(blocks, dict) else blocks
        if not isinstance(blocks, list) or not blocks:
            errors.append("data must contain local data blocks")
            continue
        for block in blocks:
            if not isinstance(block, dict) or not isinstance(block.get("values"), list):
                errors.append("Each data block must contain a local values array")
            elif "url" in block:
                errors.append("Use local values instead of remote chart data")
            else:
                found = True
    if not found:
        errors.append("Native chart spec requires local data.values (at root or series)")
    return errors


def validate_bundle(root: Path, *, require_png: bool = True) -> ValidationResult:
    root = root.resolve()
    result = validate_production_bundle(root, require_png=require_png)
    try:
        manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return result
    if not isinstance(manifest, dict) or not isinstance(manifest.get("charts", []), list):
        return result
    payload = None
    html = manifest.get("html")
    if isinstance(html, str) and path_exists(root, html, "HTML", result):
        try:
            payload = chart_payload((root / html).read_text(encoding="utf-8"))
        except ValueError:
            pass  # Wiring validator reports invalid payloads for chart bundles.
    for entry in manifest.get("charts", []):
        if not isinstance(entry, dict) or not isinstance(entry.get("spec"), str):
            continue
        path = (root / entry["spec"]).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            continue
        try:
            spec = json.loads(path.read_text(encoding="utf-8"))
            result.errors.extend(
                f"chart {entry.get('id', '<unknown>')}: {message}"
                for message in validate_chart_spec(spec)
            )
            if payload is not None and payload.get(entry.get("id")) != spec:
                result.errors.append(f"Inline spec differs from file: {entry['spec']}")
        except (OSError, ValueError) as error:
            result.errors.append(f"Chart spec check failed for {entry['spec']}: {error}")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--phase", choices=["pre-export", "complete"], default="complete")
    args = parser.parse_args()
    result = validate_bundle(args.bundle, require_png=args.phase == "complete")
    for warning in result.warnings:
        print(f"Warning: {warning}", file=sys.stderr)
    for error in result.errors:
        print(f"Error: {error}", file=sys.stderr)
    if not result.ok:
        return 1
    print("Poster bundle and native chart spec checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
