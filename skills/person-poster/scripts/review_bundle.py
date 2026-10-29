#!/usr/bin/env python3
"""Collect draft overview, DOM-located detail PNGs, text metrics and technical checks.

Uses package-local validators/inspection plus a browser screenshot session.
Does not write the final preview.png or certify factual/visual quality.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from types import SimpleNamespace

from browser_runtime import browser_launch_options, load_page
from display_contract import DISPLAY_SCRIPT, DISPLAY_VERSION, check_display
from export_html_png import append_query_param, start_static_server
from inspect_contrast import CONTRAST_POLICY, inspect_contrast
from inspect_html_layout import VISIBILITY_POLICY, inspect_layout
from inspect_readability import READING_POLICY, READING_SCRIPT, reading_report
from json_values import json_values_equal
from review_fingerprint import fingerprint
from validate_poster_bundle import validate_bundle


def save(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def compare_layout(layout: dict, snapshot: dict) -> list[str]:
    """Do not let independent browser loads certify different CSS scenes."""
    errors = []
    before, after = layout['root'], snapshot['root']
    if any(abs(before[key] - after[key]) > 1 for key in ('width', 'height')):
        errors.append('Review CSS root differs from inspected layout')
    inspected = [item for item in layout.get('items', []) if item['kind'] == 'required']
    current = snapshot['required']
    if len(inspected) != len(current):
        return errors + ['Review required-element coverage differs from inspected layout']
    for old, new in zip(inspected, current):
        moved = any(abs((old['rect'][axis] - before[axis]) -
                        (new['rect'][axis] - after[axis])) > 1 for axis in ('x', 'y'))
        resized = any(abs(old['rect'][key] - new['rect'][key]) > 1 for key in ('width', 'height'))
        if moved or resized or old['text'] != ' '.join(new['text'].split())[:120]:
            errors.append('Review element differs from inspected layout: ' + old['label'])
    return errors


def capture_display_preview(root, path: Path, width: int) -> dict:
    """Capture the existing layout at its intended reading size, then restore it.

    CSS transform keeps layout widths, canvas content and media queries intact.
    Screenshot scale='css' makes the reading-width file independent of draft DPR.
    """
    before = root.bounding_box()
    if not before or before["width"] <= 0:
        raise ValueError("Cannot measure root for display preview")
    target = min(width, before["width"])
    previous = root.evaluate("""(el, factor) => {
      const style = el.getAttribute('style');
      const transform = getComputedStyle(el).transform;
      el.style.transformOrigin = 'top left';
      el.style.transform = 'scale(' + factor + ') ' + (transform === 'none' ? '' : transform);
      return style;
    }""", target / before["width"])
    try:
        after = root.bounding_box()
        root.screenshot(path=str(path), scale="css")
        return {"file": path.name, "widthCssPx": after["width"], "heightCssPx": after["height"],
                "layoutWidthCssPx": before["width"], "screenshotScale": "css",
                "note": "Existing layout scaled for reading; visual acceptance remains manual"}
    finally:
        root.evaluate("""(el, previous) => {
          if (previous === null) el.removeAttribute('style');
          else el.setAttribute('style', previous);
        }""", previous)


def review(args: argparse.Namespace) -> dict:
    started = perf_counter()
    bundle = args.bundle.resolve()
    out = (args.output_dir or bundle / "review").resolve()
    # This directory owns generated review artifacts, never original inputs.
    source_manifest = bundle / "manifest.json"
    source_paths = [source_manifest]
    if source_manifest.exists():
        source_config = json.loads(source_manifest.read_text())
        if isinstance(source_config, dict):
            for key in ["html", "png"]:
                if isinstance(source_config.get(key), str):
                    source_paths.append(bundle / source_config[key])
            for group, key in [("assets", "file"), ("dependencies", "file"), ("charts", "spec")]:
                for entry in source_config.get(group, []) if isinstance(source_config.get(group, []), list) else []:
                    if isinstance(entry, dict) and isinstance(entry.get(key), str):
                        source_paths.append(bundle / entry[key])
    input_errors = []
    if source_manifest.exists():
        try:
            source_paths.extend(bundle / name for name in fingerprint(bundle))
        except (OSError, ValueError, KeyError, TypeError) as error:
            input_errors.append(f'Review input contract: {error}; repair manifest/inputs or run build for generated outputs')
    if any(path.resolve().is_relative_to(out) for path in source_paths):
        raise ValueError("Review directory must not contain original HTML, manifest, PNG, assets or specs")
    out.mkdir(parents=True, exist_ok=True)
    for owned in [out / name for name in ["overview.png", "display.png", "display-check.json", "display-snapshot.json", "layout-inspection.json", "text-and-chart-data.json", "readability.json", "contrast.json", "review.json", "supplemental-readability.json", "supplemental-display.png"]] + list(out.glob("detail-*.png")):
        owned.unlink(missing_ok=True)
    report = {"startedAtUtc": datetime.now(timezone.utc).isoformat(),
              "displayVersion": DISPLAY_VERSION,
              "readingPolicy": dict(READING_POLICY),
              "contrastPolicy": dict(CONTRAST_POLICY),
              "visibilityPolicy": dict(VISIBILITY_POLICY),
              "technicalPassed": False, "errors": list(input_errors), "warnings": [], "timings": {},
              "semanticAcceptance": "pending: verify source-to-value-to-label mappings",
              "visualAcceptance": "pending: inspect overview and details", "details": []}
    mark = perf_counter()
    validation = validate_bundle(bundle, require_png=False)
    report["preExportValidation"] = {"passed": validation.ok, "errors": validation.errors,
                                     "warnings": validation.warnings}
    report["errors"].extend(validation.errors)
    report["warnings"].extend(validation.warnings)
    report["timings"]["staticSeconds"] = round(perf_counter() - mark, 3)
    if not validation.ok or input_errors:
        report["timings"]["totalSeconds"] = round(perf_counter() - started, 3)
        save(out / "review.json", report)
        return report
    manifest = json.loads((bundle / "manifest.json").read_text())
    report['sourceFingerprint'] = fingerprint(bundle)
    width, height = manifest["canvas"]["width"], manifest["canvas"]["height"]
    if isinstance(width, bool) or isinstance(height, bool) or not all(math.isfinite(v) for v in [width, height]):
        raise ValueError("Canvas dimensions must be finite positive numbers")
    html = bundle / manifest["html"]
    selector = manifest.get("export", {}).get("selector", "#infographic")
    inspection_args = SimpleNamespace(html=str(html), manifest=str(bundle / "manifest.json"),
        selector=selector, serve=True, screenshot_mode=True, install_playwright=False,
        install_browser=False, viewport_width=math.ceil(width), viewport_height=math.ceil(height),
        device_scale_factor=args.device_scale_factor, wait_until="load", timeout=args.timeout_ms, settle_ms=0,
        ready_expression="window.__INFOGRAPHIC_READY__ === true", required_selector="[data-required]",
        decorative_selector="[data-decorative]", bottom_safe_px=64, footer_safe_px=96,
        min_overlap_area=24, overflow_tolerance=3)
    mark = perf_counter()
    try:
        layout = inspect_layout(inspection_args)
    except SystemExit as error:
        layout = {"passed": False, "errors": [f"Layout inspector failed with exit {error.code}"],
                  "required_count": 0}
    save(out / "layout-inspection.json", layout)
    report["timings"]["layoutSeconds"] = round(perf_counter() - mark, 3)
    report["errors"].extend(layout.get("errors", []))
    report["warnings"].extend(layout.get("warnings", []))
    report['visibility'] = {'passed': layout.get('visibility', {}).get('passed') is True}
    if layout.get("required_count", 0) == 0:
        report["errors"].append("No required elements measured; mark actual required content")
    if not layout.get("root"):
        report["captureSkipped"] = "Environment, readiness or root failed; fix that cause before another browser load"
        report["timings"]["totalSeconds"] = round(perf_counter() - started, 3)
        save(out / "review.json", report)
        return report

    # A second load supplies screenshots and metrics; readiness is checked independently.
    # Keeping the existing inspector avoids a second copy of its collision logic.
    server = None
    mark = perf_counter()
    try:
        from playwright.sync_api import sync_playwright
        server, url = start_static_server(html)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(**browser_launch_options())
            try:
                context = browser.new_context(viewport={"width": math.ceil(width), "height": math.ceil(height)},
                                              device_scale_factor=args.device_scale_factor)
                page = context.new_page()
                diagnostics = load_page(page, append_query_param(url, "screenshot", "1"),
                                        ready_expression="window.__INFOGRAPHIC_READY__ === true", timeout_ms=args.timeout_ms)
                root = page.locator(selector).first
                report["timings"]["renderSeconds"] = round(perf_counter() - mark, 3)
                mark = perf_counter()
                snapshot = page.evaluate("""(selector) => {
                  const root = document.querySelector(selector);
                  const ctx = document.createElement('canvas').getContext('2d');
                  const rb=root.getBoundingClientRect();
                  return {root:{x:rb.x,y:rb.y,width:rb.width,height:rb.height},
                    specs: window.__INFOGRAPHIC_CHARTS__ || {},
                    required: [...root.querySelectorAll('[data-required]')].filter(el=>{
                      const b=el.getBoundingClientRect(),s=getComputedStyle(el);
                      return b.width>0&&b.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0;
                    }).map(el => {
                      const s = getComputedStyle(el), b = el.getBoundingClientRect();
                      const text = (el.innerText || el.textContent || '').trim();
                      ctx.font = s.fontStyle + ' ' + s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily;
                      const lines = text.split(/\\n/).filter(Boolean).map(line => {
                        const m = ctx.measureText(line);
                        return {text:line, width:m.width, ascent:m.actualBoundingBoxAscent, descent:m.actualBoundingBoxDescent};
                      });
                      return {id:el.getAttribute('data-required'), text, fontFamily:s.fontFamily,
                        fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,
                        clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,
                        clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,
                        rect:{x:b.x,y:b.y,width:b.width,height:b.height},lineMetrics:lines};
                    })};
                }""", selector)
                save(out / "text-and-chart-data.json", snapshot)
                report['errors'].extend(compare_layout(layout, snapshot))
                display_snapshot = page.evaluate(DISPLAY_SCRIPT, selector)
                display = check_display(bundle, display_snapshot)
                save(out / 'display-snapshot.json', display_snapshot)
                save(out / 'display-check.json', display)
                report['display'] = {'passed': display['passed'], 'version': display['version']}
                report['errors'].extend('Display binding: ' + e for e in display['errors'])
                reading_snapshot = page.evaluate(READING_SCRIPT, selector)
                reading = reading_report(reading_snapshot, READING_POLICY['displayWidthCssPx'],
                                         READING_POLICY['minFontSizeCssPx'])
                save(out / 'readability.json', reading)
                report['readability'] = {key: reading[key] for key in
                                         ('passed', 'displayWidthCssPx', 'minFontSizeCssPx', 'unmeasured')}
                report['readability']['smallTextCount'] = len(reading['smallText'])
                if reading['smallText']:
                    report['errors'].append(f"Reading text below {reading['minFontSizeCssPx']}px at "
                                            f"{reading['displayWidthCssPx']}px width: "
                                            f"{len(reading['smallText'])} items; see readability.json")
                if reading['unmeasured']:
                    report['errors'].append('Reading text measurement incomplete; see readability.json')
                contrast = inspect_contrast(page, selector, debug_dir=out / 'contrast-debug')
                save(out / 'contrast.json', contrast)
                report['contrast'] = {'passed': contrast['passed'],
                                      'lowContrastCount': len(contrast['lowContrast']),
                                      'unmeasured': contrast['unmeasured'], 'sampling': contrast['sampling']}
                if contrast['lowContrast']:
                    report['errors'].append(f"Low text contrast against actual background: {len(contrast['lowContrast'])} items; see contrast.json")
                if contrast['unmeasured']:
                    report['errors'].append('Text contrast measurement incomplete; see contrast.json')
                report["chartSpecMatches"] = []
                for chart in manifest.get("charts", []):
                    expected = json.loads((bundle / chart["spec"]).read_text())
                    matches = json_values_equal(snapshot["specs"].get(chart["id"]), expected)
                    report["chartSpecMatches"].append({"id": chart["id"], "matches": matches})
                    if not matches:
                        report["errors"].append(f"Runtime spec differs from file: {chart['id']}")
                root.screenshot(path=str(out / "overview.png"))
                report["overview"] = "overview.png"
                report["displayPreview"] = capture_display_preview(root, out / "display.png",
                                                                    READING_POLICY['displayWidthCssPx'])
                requested = (getattr(args, 'display_width', 600),
                             getattr(args, 'min_reading_font_size', 12))
                if requested != (600, 12):
                    supplemental = reading_report(reading_snapshot, *requested)
                    save(out / 'supplemental-readability.json', supplemental)
                    report['supplementalDisplayPreview'] = capture_display_preview(
                        root, out / 'supplemental-display.png', requested[0])
                    report['warnings'].append('Custom reading parameters are supplemental only; '
                                              'technicalPassed always requires the 600px/12px baseline')
                locators = []
                if args.detail_selector:
                    for css in args.detail_selector:
                        nodes = root.locator(css)
                        if nodes.count() == 0:
                            report["errors"].append(f"Detail selector matched no element: {css}")
                        locators.extend((nodes.nth(i), css) for i in range(nodes.count()))
                else:
                    explicit = root.locator("[data-review]")
                    nodes = explicit if explicit.count() else root.locator("[data-chart-id], img[id]")
                    locators = [(nodes.nth(i), "auto") for i in range(nodes.count())]
                for index, (node, css) in enumerate(locators):
                    label = node.evaluate("el => el.getAttribute('data-review') || el.getAttribute('data-chart-id') || el.id || el.tagName")
                    slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", label).strip("-") or "region"
                    filename = f"detail-{index + 1:02d}-{slug}.png"
                    if not node.is_visible():
                        report["errors"].append(f"Detail region is not visible: {label}")
                        continue
                    node.screenshot(path=str(out / filename), timeout=args.timeout_ms)
                    report["details"].append({"label": label, "selector": css, "file": filename})
                report["timings"]["captureSeconds"] = round(perf_counter() - mark, 3)
                diagnostics.check()
                report["pageDiagnostics"] = diagnostics.report()
                context.close()
            finally:
                browser.close()
    except Exception as error:
        report["errors"].append(f"Preview capture: {error}")
    finally:
        if server:
            server.shutdown()
    report["technicalPassed"] = not report["errors"]
    report["timings"]["totalSeconds"] = round(perf_counter() - started, 3)
    save(out / "review.json", report)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--detail-selector", action="append", help="Root-relative CSS selector; repeatable")
    parser.add_argument("--device-scale-factor", type=float, default=2,
                        help="Native capture DPR, default 2; reading baseline stays 600 CSS px")
    parser.add_argument("--display-width", type=int, default=600, help="Supplemental reading-width PNG; baseline remains 600 CSS pixels")
    parser.add_argument("--min-reading-font-size", type=float, default=12,
                        help="Supplemental font-size diagnostic; acceptance baseline remains 12 CSS px")
    parser.add_argument("--timeout-ms", type=int, default=30000)
    args = parser.parse_args()
    if not math.isfinite(args.device_scale_factor) or args.device_scale_factor <= 0 or args.timeout_ms <= 0 or args.display_width <= 0 or not math.isfinite(args.min_reading_font_size) or args.min_reading_font_size <= 0:
        parser.error("Scale, display width and timeout must be finite and positive")
    try:
        result = review(args)
    except (OSError, ValueError, TypeError) as error:
        print(f"Review failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"technicalPassed": result["technicalPassed"], "errors": result["errors"],
                      "seconds": result["timings"]["totalSeconds"]}, ensure_ascii=False))
    return 0 if result["technicalPassed"] else 1


if __name__ == "__main__":
    sys.exit(main())
