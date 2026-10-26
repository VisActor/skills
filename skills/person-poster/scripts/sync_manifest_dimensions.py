#!/usr/bin/env python3
"""Sync manifest/export height from a clean layout inspection report."""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

WIDTH_BLOCKERS = (
    "content exceeds width",
    "manifest canvas width",
    "manifest export width",
)
VERTICAL_SYNC_ALLOWED_ERRORS = (
    "content exceeds height",
    "manifest canvas height",
    "manifest export height",
    "bottom safe area",
)
TEXT_BLOCKERS = (
    "visible overflow",
    "ellipsis",
    "required elements overlap",
    "required/decorative overlap",
)
DEFAULT_HEIGHT_SLACK_PX = 16


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def as_number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if not math.isfinite(value):
        raise ValueError("Layout geometry must be finite")
    return float(value)


def blocker_errors(report: dict[str, Any]) -> list[str]:
    errors = [str(error) for error in report.get("errors") or []]
    blockers: list[str] = []
    for error in errors:
        lower = error.lower()
        if any(pattern in lower for pattern in WIDTH_BLOCKERS):
            blockers.append(error)
        elif any(pattern in lower for pattern in TEXT_BLOCKERS):
            blockers.append(error)
        elif any(pattern in lower for pattern in VERTICAL_SYNC_ALLOWED_ERRORS) or (
            "content exceeds" in lower and "height" in lower
        ):
            continue
        elif lower.startswith('required element outside #infographic: ') and bottom_only_overflow(report, error):
            continue
        else:
            blockers.append(error)
    return blockers


def bottom_only_overflow(report: dict[str, Any], error: str) -> bool:
    """Only permit a measured downward overflow; never infer geometry from error text."""
    root = report.get('root', {})
    for item in report.get('items', []):
        if item.get('kind') != 'required' or error != f"required element outside #infographic: {item.get('label')}":
            continue
        rect = item.get('rect', {})
        edges = ('left', 'top', 'right', 'bottom')
        if any(as_number(box.get(edge)) is None for box in (root, rect) for edge in edges):
            continue
        if (rect['left'] >= root['left'] and rect['right'] <= root['right']
                and rect['top'] >= root['top'] and rect['bottom'] > root['bottom']):
            return True
    return False


def required_horizontal_blockers(report: dict[str, Any], *, tolerance: float) -> list[str]:
    root = report.get("root") if isinstance(report.get("root"), dict) else {}
    root_left = as_number(root.get("left"))
    root_right = as_number(root.get("right"))
    if root_left is None or root_right is None:
        return []

    blockers: list[str] = []
    for item in report.get("items") or []:
        if not isinstance(item, dict) or item.get("kind") != "required":
            continue
        rect = item.get("rect") if isinstance(item.get("rect"), dict) else {}
        left = as_number(rect.get("left"))
        right = as_number(rect.get("right"))
        if left is None or right is None:
            continue
        if left < root_left - tolerance or right > root_right + tolerance:
            blockers.append(f"required element outside horizontal root bounds: {item.get('label') or '<unknown>'}")
    return blockers


def content_bottom_from_report(report: dict[str, Any], extra: float = 0) -> float | None:
    """Content bottom in root-relative CSS pixels, including the requested safe area."""
    root_top = as_number(report.get('root', {}).get('top', 0))
    if root_top is None:
        raise ValueError('Missing numeric root.top')
    bottoms: list[float] = []
    for item in report.get("items") or []:
        if not isinstance(item, dict) or item.get("kind") not in {"required", "decorative"}:
            continue
        rect = item.get("rect") if isinstance(item.get("rect"), dict) else {}
        bottom = as_number(rect.get("bottom"))
        if bottom is not None:
            safe = as_number(item.get('bottomSafePx', 0))
            if safe is None or safe < 0:
                raise ValueError('bottomSafePx must be a finite nonnegative number')
            bottoms.append(bottom - root_top + max(extra, safe))
    if not bottoms:
        return None
    return max(bottoms)


def target_height_from_report(
    report: dict[str, Any],
    *,
    bottom_safe_px: int,
    height_slack_px: int,
    trim_blank_tail: bool = False,
    blank_tail_threshold_px: int = 180,
) -> tuple[int, bool]:
    root = report.get("root") if isinstance(report.get("root"), dict) else {}
    height = as_number(root.get('height'))
    scroll_height = as_number(root.get("scrollHeight"))
    if scroll_height is None:
        scroll_height = as_number(root.get("height"))
    if scroll_height is None or scroll_height <= 0:
        raise ValueError("layout inspection report does not include root.scrollHeight")
    if height is not None and height <= 0:
        raise ValueError('root.height must be positive')
    offset_height = as_number(root.get('offsetHeight'))
    if height is not None and offset_height is not None and abs(height - offset_height) > 1:
        raise ValueError('Transformed root dimensions require manual CSS sizing and remeasurement')
    current_height = max(scroll_height, height or scroll_height)
    extra = max(0, bottom_safe_px)
    if extra == 0:
        extra = max(0, height_slack_px)
    content_bottom = content_bottom_from_report(report, extra)
    if content_bottom is None:
        if trim_blank_tail:
            raise ValueError('Cannot trim without measured content')
        return math.ceil(current_height), False
    content_target = max(1, math.ceil(content_bottom))
    if trim_blank_tail and current_height - content_target >= max(0, blank_tail_threshold_px) and content_target < current_height:
        return content_target, True
    return math.ceil(max(current_height, content_target)), False


def update_manifest_heights(manifest: dict[str, Any], target_height: int) -> None:
    canvas = manifest.setdefault("canvas", {})
    if not isinstance(canvas, dict):
        raise ValueError("manifest.canvas must be an object")
    canvas["height"] = target_height

    export = manifest.setdefault("export", {})
    if not isinstance(export, dict):
        raise ValueError("manifest.export must be an object")
    export["height"] = target_height
    viewport = export.setdefault("viewport", {})
    if not isinstance(viewport, dict):
        raise ValueError('manifest.export.viewport must be an object')
    viewport["height"] = target_height


def update_infographic_block(block: str, target_height: int) -> str:
    prefix_match = re.match(r"(?P<prefix>#infographic\s*\{)(?P<body>.*)(?P<suffix>\})", block, flags=re.S)
    if not prefix_match:
        return block
    prefix = prefix_match.group("prefix")
    inner = prefix_match.group("body")
    suffix = prefix_match.group("suffix")
    declaration = re.compile(r'(?P<prefix>(?:^|;)\s*(?:min-height|height)\s*:\s*)(?P<value>[^;{}]+)(?=;|$)')
    supported = False

    def replace(match: re.Match) -> str:
        nonlocal supported
        value = match['value'].strip()
        if re.fullmatch(r'[\d.]+px', value):
            supported = True
            return match['prefix'] + f'{target_height}px'
        if value == 'var(--canvas-height)':
            supported = True
            return match.group(0)
        if value == 'auto':
            return match.group(0)
        raise ValueError(f'Unsupported root height: {value}; adjust CSS manually and remeasure')

    inner = declaration.sub(replace, inner)
    if not supported or re.search(r'(?:^|;)\s*max-height\s*:', inner):
        raise ValueError('Unsupported root sizing; use a single explicit px height/min-height or --canvas-height')
    return f"{prefix}{inner}{suffix}"


def update_html_root_height(html_text: str, target_height: int) -> tuple[str, bool]:
    class RootStyleParser(HTMLParser):
        def handle_starttag(self, tag, attrs):
            attributes = dict(attrs)
            if attributes.get('id') == 'infographic' and re.search(
                r'(?:^|;)\s*(?:height|min-height|max-height|--canvas-height)\s*:', attributes.get('style', '')
            ):
                raise ValueError('Unsupported inline root sizing; adjust CSS manually and remeasure')

    RootStyleParser().feed(html_text)
    blocks = list(re.finditer(r'#infographic\s*\{[^}]*\}', html_text, flags=re.S))
    if len(blocks) != 1:
        raise ValueError('Unsupported root CSS: expected one #infographic rule; adjust manually and remeasure')
    block = blocks[0]
    updated_block = update_infographic_block(block.group(0), target_height)
    updated = html_text[:block.start()] + updated_block + html_text[block.end():]
    if 'var(--canvas-height)' in updated_block:
        declarations = list(re.finditer(r'--canvas-height\s*:\s*([^;{}]+)', updated))
        if len(declarations) != 1 or not re.fullmatch(r'[\d.]+px', declarations[0][1].strip()):
            raise ValueError('Unsupported --canvas-height definition; use one explicit px declaration')
        match = declarations[0]
        updated = updated[:match.start(1)] + f'{target_height}px' + updated[match.end(1):]
    return updated, updated != html_text


def sync_dimensions(args: argparse.Namespace) -> dict[str, Any]:
    bundle_dir = Path(args.bundle).resolve()
    layout_path = Path(args.layout).resolve()
    manifest_path = Path(args.manifest).resolve() if args.manifest else bundle_dir / "manifest.json"
    report = read_json(layout_path)
    blockers = blocker_errors(report)
    blockers.extend(required_horizontal_blockers(report, tolerance=args.tolerance))
    if blockers:
        return {
            "ok": False,
            "changed": False,
            "targetHeight": None,
            "errors": blockers,
            "message": "Fix horizontal, text, overlap, and ellipsis layout errors before syncing manifest height.",
        }

    target_height, trimmed_blank_tail = target_height_from_report(
        report,
        bottom_safe_px=args.bottom_safe_px,
        height_slack_px=args.height_slack_px,
        trim_blank_tail=args.trim_blank_tail,
        blank_tail_threshold_px=args.blank_tail_threshold_px,
    )
    manifest = read_json(manifest_path)
    before_manifest = json.dumps(manifest, sort_keys=True, ensure_ascii=False)
    update_manifest_heights(manifest, target_height)
    changed = json.dumps(manifest, sort_keys=True, ensure_ascii=False) != before_manifest
    html_changed = False

    if args.update_html_root_height:
        root = report.get('root', {})
        if root.get('boxSizing') == 'content-box' and (as_number(root.get('verticalBoxExtra')) or 0) > 0:
            raise ValueError('Unsupported content-box padding/border; use border-box or resize manually and remeasure')
        html_rel = manifest.get("html") or "index.html"
        if not isinstance(html_rel, str) or html_rel.startswith("/") or html_rel.startswith("file://"):
            raise ValueError(f"manifest.html must be a safe relative path: {html_rel!r}")
        html_path = (bundle_dir / html_rel).resolve()
        try:
            html_path.relative_to(bundle_dir)
        except ValueError as exc:
            raise ValueError(f"manifest.html must stay within bundle: {html_rel!r}") from exc
        html_text = html_path.read_text(encoding="utf-8")
        updated_html, html_changed = update_html_root_height(html_text, target_height)
        if args.apply and html_changed:
            html_path.write_text(updated_html, encoding="utf-8")

    if args.apply and changed:
        write_json(manifest_path, manifest)

    return {
        "ok": True,
        "changed": bool(changed or html_changed),
        "targetHeight": target_height,
        "trimmedBlankTail": trimmed_blank_tail,
        "errors": [],
        "warnings": ([] if content_bottom_from_report(report) is not None else
                     ['No measured content; preserved root extent without adding slack']),
        "manifest": str(manifest_path),
        "htmlRootHeightUpdated": html_changed,
        "applied": bool(args.apply),
        "requiresLayoutRecheck": bool(changed or html_changed),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync infographic manifest/export height from layout inspection")
    parser.add_argument("--bundle", required=True, help="Bundle directory containing manifest.json and index.html")
    parser.add_argument("--layout", required=True, help="layout-inspection.json produced by inspect_html_layout.py")
    parser.add_argument("--manifest", default=None, help="Optional explicit manifest path")
    parser.add_argument("--bottom-safe-px", type=int, default=0)
    parser.add_argument("--height-slack-px", type=int, default=DEFAULT_HEIGHT_SLACK_PX)
    parser.add_argument("--trim-blank-tail", action="store_true")
    parser.add_argument("--blank-tail-threshold-px", type=int, default=180)
    parser.add_argument("--tolerance", type=float, default=1.0)
    parser.add_argument("--update-html-root-height", action="store_true")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    try:
        result = sync_dimensions(args)
    except Exception as exc:
        result = {"ok": False, "changed": False, "errors": [str(exc)]}

    output_text = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        Path(args.output).write_text(output_text, encoding="utf-8")
    else:
        sys.stdout.write(output_text)
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
