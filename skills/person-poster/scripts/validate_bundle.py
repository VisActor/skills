#!/usr/bin/env python3
"""Validate an infographic production bundle."""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

ALLOWED_FACT_ROLES = {"primary", "derived", "source"}
VCHART_USAGE_PATTERN = re.compile(r"\b(?:new\s+VChart|VChart\.default)\b")


@dataclass
class ValidationResult:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def load_json(path: Path, result: ValidationResult) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        result.errors.append("Missing manifest.json")
    except json.JSONDecodeError as error:
        result.errors.append(f"Invalid manifest JSON: {error}")
    return {}


def as_relative_path(value: Any, field_name: str, result: ValidationResult) -> str | None:
    if not isinstance(value, str) or not value.strip():
        result.errors.append(f"Missing or invalid manifest field: {field_name}")
        return None
    if Path(value).is_absolute() or urlsplit(value).scheme or ".." in Path(value).parts or "\\" in value:
        result.errors.append(f"Manifest path must be relative: {field_name}")
        return None
    return value


def path_exists(root: Path, relative: str, label: str, result: ValidationResult) -> bool:
    candidate = (root / relative).resolve()
    if not candidate.is_relative_to(root.resolve()):
        result.errors.append(f"{label} path escapes bundle: {relative}")
        return False
    if not candidate.is_file():
        result.errors.append(f"Missing {label}: {relative}")
        return False
    return True


def html_contains_selector(html: str, selector: str) -> bool:
    if selector == "#infographic":
        return 'id="infographic"' in html or "id='infographic'" in html
    if selector.startswith("#"):
        ident = selector[1:]
        return f'id="{ident}"' in html or f"id='{ident}'" in html
    if selector.startswith("[data-chart-id="):
        normalized = selector.replace('\\"', '"')
        if normalized in html:
            return True
        value = normalized.removeprefix("[data-chart-id=").removesuffix("]").strip("\"'")
        return f'data-chart-id="{value}"' in html or f"data-chart-id='{value}'" in html
    return selector in html


def html_uses_vchart(html: str) -> bool:
    return bool(VCHART_USAGE_PATTERN.search(html))


VCHART_VERSION = "2.1.7"
VCHART_URL = f"https://unpkg.com/@visactor/vchart@{VCHART_VERSION}/build/index.min.js"


class ScriptParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources = []
        self.bodies = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            attributes = dict(attrs)
            if attributes.get("src"):
                self.sources.append(attributes["src"])
            self.current = ""

    def handle_data(self, data):
        if self.current is not None:
            self.current += data

    def handle_endtag(self, tag):
        if tag == "script" and self.current is not None:
            self.bodies.append(self.current)
            self.current = None


def chart_payload(html: str) -> dict:
    """Read a direct JSON assignment without splitting strings on semicolons."""
    parser = ScriptParser()
    parser.feed(html)
    assignments = []
    for body in parser.bodies:
        offset = 0
        pattern = re.compile(r"window\.__INFOGRAPHIC_CHARTS__\s*=\s*")
        while match := pattern.search(body, offset):
            value, consumed = json.JSONDecoder().raw_decode(body[match.end():])
            assignments.append(value)
            offset = match.end() + consumed
    if len(assignments) != 1 or not isinstance(assignments[0], dict):
        raise ValueError("Expected one direct JSON object assignment to window.__INFOGRAPHIC_CHARTS__")
    return assignments[0]


def html_has_chart_runtime_scripts(html: str, manifest: dict | None = None) -> bool:
    parser = ScriptParser()
    parser.feed(html)
    if VCHART_URL in parser.sources:
        return True
    for dep in (manifest or {}).get("dependencies", []):
        if (isinstance(dep, dict) and dep.get("name") == "@visactor/vchart"
                and dep.get("version") == VCHART_VERSION
                and dep.get("file") in parser.sources):
            return True
    return False


class FactMarkerParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.markers: list[dict[str, Any]] = []
        self._stack: list[dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {name.lower(): value or "" for name, value in attrs}
        marker = None
        if "data-fact-id" in attrs_dict:
            marker = {
                "fact_id": attrs_dict.get("data-fact-id", "").strip(),
                "role": attrs_dict.get("data-fact-role", "").strip().lower(),
                "text_parts": [],
                "tag": tag,
            }
            self.markers.append(marker)
        self._stack.append({"tag": tag, "marker": marker})

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {name.lower(): value or "" for name, value in attrs}
        if "data-fact-id" in attrs_dict:
            self.markers.append(
                {
                    "fact_id": attrs_dict.get("data-fact-id", "").strip(),
                    "role": attrs_dict.get("data-fact-role", "").strip().lower(),
                    "text_parts": [],
                    "tag": tag,
                }
            )

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self._stack) - 1, -1, -1):
            if self._stack[index]["tag"] == tag:
                del self._stack[index:]
                return

    def handle_data(self, data: str) -> None:
        if not data.strip():
            return
        for frame in self._stack:
            marker = frame.get("marker")
            if marker is not None:
                marker["text_parts"].append(data)


def collect_fact_markers(html: str) -> list[dict[str, Any]]:
    parser = FactMarkerParser()
    parser.feed(html)
    markers: list[dict[str, Any]] = []
    for marker in parser.markers:
        markers.append(
            {
                "fact_id": marker["fact_id"],
                "role": marker["role"],
                "text": " ".join(" ".join(marker["text_parts"]).split()),
                "tag": marker["tag"],
            }
        )
    return markers


def validate_fact_markers(markers: list[dict[str, Any]], result: ValidationResult) -> None:
    grouped: dict[str, list[dict[str, Any]]] = {}
    display_ids: dict[str, str] = {}
    for marker in markers:
        fact_id = str(marker.get("fact_id") or "").strip()
        role = str(marker.get("role") or "").strip().lower()
        if not fact_id:
            result.errors.append("data-fact-id must not be empty")
            continue
        if role not in ALLOWED_FACT_ROLES:
            result.errors.append(
                f'data-fact-id "{fact_id}" must declare data-fact-role as primary, derived, or source'
            )
            continue
        key = " ".join(fact_id.lower().split())
        display_ids.setdefault(key, fact_id)
        grouped.setdefault(key, []).append(marker)

    for key, items in grouped.items():
        fact_id = display_ids[key]
        primary_count = sum(1 for item in items if item.get("role") == "primary")
        if primary_count == 0:
            result.errors.append(f'data-fact-id "{fact_id}" has no primary owner')
        if primary_count > 1:
            result.errors.append(f'data-fact-id "{fact_id}" has multiple primary owners')
        if len(items) >= 3:
            result.errors.append(
                f'data-fact-id "{fact_id}" appears {len(items)} times; keep one primary owner and at most one derived/source mention'
            )


def validate_canvas(manifest: dict[str, Any], result: ValidationResult) -> None:
    canvas = manifest.get("canvas")
    if not isinstance(canvas, dict):
        result.errors.append("Missing or invalid canvas")
        return
    for key in ["width", "height"]:
        value = canvas.get(key)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
            result.errors.append(f"canvas.{key} must be a positive number")


def validate_bundle(root: Path, *, require_png: bool = True) -> ValidationResult:
    result = ValidationResult()
    root = root.resolve()
    manifest_path = root / "manifest.json"
    manifest = load_json(manifest_path, result)
    if not isinstance(manifest, dict) or not manifest:
        result.errors.append("manifest must be a non-empty object")
        return result

    html_rel = as_relative_path(manifest.get("html"), "html", result)
    delivery = manifest.get("delivery", "html+png")
    if delivery not in ("html", "html+png"):
        result.errors.append('delivery must be "html" or "html+png"')
    png_rel = None
    if delivery != "html" or "png" in manifest:
        png_rel = as_relative_path(manifest.get("png"), "png", result)
    if html_rel:
        path_exists(root, html_rel, "HTML", result)
    if png_rel and require_png and delivery != "html":
        path_exists(root, png_rel, "PNG", result)

    validate_canvas(manifest, result)

    html_text = ""
    if html_rel and path_exists(root, html_rel, "HTML", result):
        html_text = (root / html_rel).read_text(encoding="utf-8")
        validate_fact_markers(collect_fact_markers(html_text), result)

    export = manifest.get("export")
    selector = "#infographic"
    if isinstance(export, dict) and isinstance(export.get("selector"), str):
        selector = export["selector"]
    if html_text and not html_contains_selector(html_text, selector):
        result.errors.append(f"HTML does not contain export selector: {selector}")

    charts = manifest.get("charts", [])
    if not isinstance(charts, list):
        result.errors.append("charts must be an array")
        charts = []
    ids = set()
    for chart in charts:
        if not isinstance(chart, dict):
            result.errors.append("chart entry must be an object")
            continue
        chart_id = chart.get("id")
        if "schema" in chart:
            result.errors.append("Old chart schema entries require conversion to native spec; renaming alone is insufficient")
        spec_rel = as_relative_path(chart.get("spec"), "charts[].spec", result)
        mount = chart.get("mount")
        if not isinstance(chart_id, str) or not chart_id:
            result.errors.append("chart entry missing id")
        elif chart_id in ids:
            result.errors.append(f"Duplicate chart id: {chart_id}")
        else:
            ids.add(chart_id)
        if spec_rel:
            path_exists(root, spec_rel, "chart spec", result)
        if not isinstance(mount, str) or not mount:
            result.errors.append(f"chart {chart_id or '<unknown>'} missing mount")
        elif html_text and not html_contains_selector(html_text, mount):
            result.errors.append(f"HTML does not contain chart mount: {mount}")
    dependencies = manifest.get("dependencies", [])
    if not isinstance(dependencies, list):
        result.errors.append("dependencies must be an array")
        dependencies = []
    for dep in dependencies:
        if not isinstance(dep, dict):
            result.errors.append("dependency must be an object")
            continue
        if "file" in dep:
            local = as_relative_path(dep["file"], "dependencies[].file", result)
            if local:
                path_exists(root, local, "dependency", result)
    runtime = html_has_chart_runtime_scripts(html_text, {"dependencies": dependencies})
    if charts and html_text:
        try:
            payload = chart_payload(html_text)
            if set(payload) != ids:
                result.errors.append("Inline chart ids must match manifest charts")
        except (ValueError, TypeError) as error:
            result.errors.append(f"Invalid inline chart specs: {error}")
        if not runtime:
            result.errors.append("Chart bundles require the pinned VChart script or a manifest-declared local copy")
    if not charts and html_text and (runtime or html_uses_vchart(html_text)):
        result.errors.append("HTML-only bundles must not include unused VChart runtime")

    assets = manifest.get("assets", [])
    if not isinstance(assets, list):
        result.errors.append("assets must be an array")
        assets = []
    for asset in assets:
        if not isinstance(asset, dict):
            result.errors.append("asset entry must be an object")
            continue
        asset_rel = as_relative_path(asset.get("file"), "assets[].file", result)
        if asset_rel:
            path_exists(root, asset_rel, "asset", result)
        kind = asset.get("kind")
        if kind is not None and kind not in {"bitmap", "svg"}:
            result.errors.append("assets[].kind must be bitmap or svg")
        raster_source = asset.get("rasterSource")
        if raster_source is not None and raster_source not in {
            "user-provided",
            "web-sourced",
            "image-generated",
            "browser-rendered",
            "fallback-svg",
        }:
            result.errors.append(
                "assets[].rasterSource must be user-provided, web-sourced, image-generated, browser-rendered, "
                f"or fallback-svg; got {raster_source!r}"
            )
        prompt = asset.get("prompt")
        if prompt is not None:
            prompt_rel = as_relative_path(prompt, "assets[].prompt", result)
            if prompt_rel:
                path_exists(root, prompt_rel, "asset prompt", result)
        source_file = asset.get("sourceFile")
        if source_file is not None:
            source_rel = as_relative_path(source_file, "assets[].sourceFile", result)
            if source_rel:
                path_exists(root, source_rel, "asset sourceFile", result)
        bitmap_status = asset.get("bitmapStatus")
        if bitmap_status is not None and not isinstance(bitmap_status, str):
            result.errors.append("assets[].bitmapStatus must be a string")
        elif bitmap_status is not None and bitmap_status != "generation-unavailable":
            result.errors.append('assets[].bitmapStatus must be "generation-unavailable"')
        image_generation_status = asset.get("imageGenerationStatus")
        if image_generation_status is not None and not isinstance(image_generation_status, str):
            result.errors.append("assets[].imageGenerationStatus must be a string")
        elif image_generation_status is not None and image_generation_status != "generation-unavailable":
            result.errors.append('assets[].imageGenerationStatus must be "generation-unavailable"')

    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an infographic production bundle")
    parser.add_argument("bundle", help="Path to bundle directory containing manifest.json")
    parser.add_argument("--phase", choices=["pre-export", "complete"], default="complete",
                        help="Pre-export skips only final PNG existence; complete is the default")
    args = parser.parse_args()

    result = validate_bundle(Path(args.bundle), require_png=args.phase == "complete")
    for warning in result.warnings:
        print(f"Warning: {warning}", file=sys.stderr)
    for error in result.errors:
        print(f"Error: {error}", file=sys.stderr)
    if not result.ok:
        return 1
    print("Bundle validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
