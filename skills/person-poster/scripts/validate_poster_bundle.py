#!/usr/bin/env python3
"""Check native chart spec structure and bundle wiring, not the full VChart API."""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

from inspect_contrast import CONTRAST_POLICY
from inspect_readability import READING_POLICY
from json_values import json_values_equal
from validate_bundle import (
    ValidationResult,
    as_relative_path,
    chart_payload,
    path_exists,
)
from validate_bundle import (
    validate_bundle as validate_production_bundle,
)
from workflow_timing import validate_timings


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


def chart_spec_warnings(spec: object) -> list[str]:
    """Flag observed mistakes without rejecting native extensions or guessing defaults."""
    if not isinstance(spec, dict):
        return []
    warnings = []
    label = spec.get('label')
    if isinstance(label, dict) and isinstance(label.get('format'), list):
        warnings.append('label.format rule arrays are not the verified native label API; '
                        'use label.style for font size and verify actual visible labels. '
                        'Do not replace missing values with zero to hide labels')
    if spec.get("type") == "bar" and "colors" in spec:
        warnings.append("Top-level colors is not the verified bar color mapping; "
                        "check native color encoding and rendered category colors")
    if spec.get("type") == "pie":
        inner, outer = spec.get("innerRadius"), spec.get("outerRadius")
        mark = spec.get("pie")
        style = mark.get("style") if isinstance(mark, dict) else None
        overrides = isinstance(style, dict) and any(k in style for k in ("innerRadius", "outerRadius"))
        if not overrides and all(type(v) in (int, float) and math.isfinite(v) for v in (inner, outer)):
            if inner >= outer:
                warnings.append("pie innerRadius >= outerRadius; both use the same layout radius. "
                                "Check ring thickness and labels at the delivery reading width")
    series = spec.get("series")
    if isinstance(series, list):
        for index, child in enumerate(series):
            warnings.extend(f"series[{index}]: {message}" for message in chart_spec_warnings(child))
    return warnings


def validate_records(root: Path, result: ValidationResult, *, required: bool = False) -> None:
    """Check record structure and time consistency, not the recorded conclusions."""
    def reject_constant(value: str) -> None:
        raise ValueError(f"Non-JSON constant: {value}")

    for name in ("fact-review.json", "acceptance.json", "workflow-timings.json"):
        path = root / name
        if not path.exists() and not path.is_symlink():
            messages = result.errors if required else result.warnings
            messages.append(f"Missing delivery record: {name}")
            continue
        if not path_exists(root, name, "Delivery record", result):
            continue
        try:
            record = json.loads(path.read_text(encoding="utf-8"), parse_constant=reject_constant)
            if not isinstance(record, dict) or not record:
                raise ValueError("must be a non-empty JSON object")
            if name == 'workflow-timings.json':
                result.errors.extend(f'{name}: {error}' for error in validate_timings(record))
            if name == 'acceptance.json' and required:
                technical = record.get('technical')
                if technical is None and 'technicalPassed' not in record:
                    raise ValueError('final acceptance requires an explicit technical status; '
                                     'use pending/failed for incomplete work, not visual approval alone')
                if technical is not None and (not isinstance(technical, dict) or
                        technical.get('status') not in ('pending', 'passed', 'failed')):
                    raise ValueError('technical.status must be pending, passed or failed; record manual exceptions separately')
                if 'technicalPassed' in record and type(record['technicalPassed']) is not bool:
                    raise ValueError('technicalPassed must be a boolean')
                if isinstance(technical, dict) and 'technicalPassed' in record and (
                        record['technicalPassed'] != (technical['status'] == 'passed')):
                    raise ValueError('technicalPassed contradicts technical.status')
                passed = record.get('technicalPassed') is True or (
                    isinstance(technical, dict) and technical.get('status') == 'passed')
                if not passed:
                    result.warnings.append('acceptance.json: technical acceptance is not passed; '
                                           'valid record structure does not certify delivery readiness')
                if passed:
                    report_path = record.get('reviewReport', 'review/review.json')
                    if not isinstance(report_path, str) or not report_path:
                        raise ValueError('technical claim requires a bundle-relative reviewReport path')
                    if not as_relative_path(report_path, 'technical claim reviewReport', result):
                        continue
                    if not path_exists(root, report_path, 'technical claim reviewReport', result):
                        continue
                    report = json.loads((root / report_path).read_text(encoding='utf-8'),
                                        parse_constant=reject_constant)
                    if not isinstance(report, dict) or report.get('technicalPassed') is not True or report.get('errors') != []:
                        raise ValueError('technical claim contradicts reviewReport; rerun review after fixes or retain a non-passed status')
                    reading = report.get('readability')
                    contrast = report.get('contrast', {})
                    if (report.get('contrastPolicy') != CONTRAST_POLICY or not isinstance(contrast, dict)
                            or contrast.get('passed') is not True or type(contrast.get('lowContrastCount')) is not int
                            or contrast['lowContrastCount'] != 0 or contrast.get('unmeasured') != []):
                        raise ValueError('technical claim requires actual-background text contrast coverage; rerun review')
                    if report.get('readingPolicy') != READING_POLICY or not isinstance(reading, dict):
                        raise ValueError('technical claim requires the fixed reading baseline and all-visible text coverage; rerun review')
                    width, minimum = reading.get('displayWidthCssPx'), reading.get('minFontSizeCssPx')
                    if (type(width) not in (int, float) or not math.isfinite(width) or not 0 < width <= 600
                            or type(minimum) not in (int, float) or not math.isfinite(minimum) or minimum < 12
                            or reading.get('passed') is not True or reading.get('smallTextCount') != 0
                            or type(reading.get('smallTextCount')) is not int or reading.get('unmeasured') != []):
                        raise ValueError('technical claim does not satisfy the 600px/12px reading baseline')
        except (OSError, ValueError) as error:
            result.errors.append(f"Invalid delivery record {name}: {error}")


def validate_bundle(root: Path, *, require_png: bool = True, require_records: bool = False) -> ValidationResult:
    root = root.resolve()
    result = validate_production_bundle(root, require_png=require_png)
    validate_records(root, result, required=require_records)
    try:
        manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return result
    if not isinstance(manifest, dict) or not isinstance(manifest.get("charts", []), list):
        return result
    if require_records and not manifest.get('displayBindings'):
        result.warnings.append('Missing displayBindings; structural diagnosis only, migrate before formal delivery')
    if manifest.get('displayBindings'):
        path_exists(root, manifest['displayBindings'], 'Display bindings', result)
    payload = None
    html = manifest.get("html")
    if isinstance(html, str) and path_exists(root, html, "HTML", result):
        try:
            payload = chart_payload((root / html).read_text(encoding="utf-8"), root=root, html_path=root / html)
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
            result.warnings.extend(
                f"chart {entry.get('id', '<unknown>')}: {message}"
                for message in chart_spec_warnings(spec)
            )
            if payload is not None and not json_values_equal(payload.get(entry.get("id")), spec):
                result.errors.append(f"Inline spec differs from file: {entry['spec']}")
        except (OSError, ValueError) as error:
            result.errors.append(f"Chart spec check failed for {entry['spec']}: {error}")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--phase", choices=["pre-export", "complete"], default="complete")
    parser.add_argument("--require-records", action="store_true",
                        help="Require fact, acceptance and timing JSON records; checks structure, not truth")
    args = parser.parse_args()
    result = validate_bundle(args.bundle, require_png=args.phase == "complete", require_records=args.require_records)
    for warning in result.warnings:
        print(f"Warning: {warning}", file=sys.stderr)
    for error in result.errors:
        print(f"Error: {error}", file=sys.stderr)
    if not result.ok:
        return 1
    print("Poster bundle and native chart spec checks passed")
    if args.require_records:
        print("Delivery record JSON checks passed; factual, usage and visual conclusions still require evidence review")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
