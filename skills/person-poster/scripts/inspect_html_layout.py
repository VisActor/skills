#!/usr/bin/env python3
"""Inspect rendered infographic HTML for required-text clipping and overlap."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from export_html_png import (
    DEFAULT_PLAYWRIGHT_PACKAGE,
    append_query_param,
    build_file_url,
    launch_chromium,
    load_playwright,
    start_static_server,
)


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def manifest_number(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)


def load_manifest_context(html_path: Path, manifest_arg: str | None) -> dict[str, object]:
    manifest_path = Path(manifest_arg).resolve() if manifest_arg else html_path.parent / "manifest.json"
    context: dict[str, object] = {
        "path": str(manifest_path),
        "found": manifest_path.exists(),
        "canvasWidth": None,
        "canvasHeight": None,
        "exportWidth": None,
        "exportHeight": None,
        "warnings": [],
        "errors": [],
    }
    if not manifest_path.exists():
        context["warnings"] = [f"manifest.json not found; skipped manifest canvas height check: {manifest_path}"]
        return context

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        context["errors"] = [f"manifest.json is not valid JSON: {exc}"]
        return context

    if not isinstance(manifest, dict):
        context["errors"] = ["manifest.json must contain an object"]
        return context

    canvas = manifest.get("canvas", {})
    if isinstance(canvas, dict):
        context["canvasWidth"] = manifest_number(canvas.get("width"))
        context["canvasHeight"] = manifest_number(canvas.get("height"))

    export = manifest.get("export", {})
    if isinstance(export, dict):
        viewport = export.get("viewport", {})
        viewport_width = viewport.get("width") if isinstance(viewport, dict) else None
        viewport_height = viewport.get("height") if isinstance(viewport, dict) else None
        context["exportWidth"] = manifest_number(export.get("width")) or manifest_number(viewport_width)
        context["exportHeight"] = manifest_number(export.get("height")) or manifest_number(viewport_height)

    return context


def apply_manifest_canvas_checks(
    report: dict[str, object],
    manifest_context: dict[str, object],
    *,
    overflow_tolerance: float,
    root_selector: str,
) -> dict[str, object]:
    report["manifest"] = {
        "path": manifest_context.get("path"),
        "found": manifest_context.get("found"),
        "canvasWidth": manifest_context.get("canvasWidth"),
        "canvasHeight": manifest_context.get("canvasHeight"),
        "exportWidth": manifest_context.get("exportWidth"),
        "exportHeight": manifest_context.get("exportHeight"),
    }
    errors = list(report.get("errors") or [])
    warnings = list(report.get("warnings") or [])
    errors.extend(str(item) for item in manifest_context.get("errors", []))
    warnings.extend(str(item) for item in manifest_context.get("warnings", []))

    root = report.get("root", {})
    root_scroll_width = None
    root_scroll_height = None
    if isinstance(root, dict):
        root_scroll_width = manifest_number(root.get("scrollWidth"))
        if root_scroll_width is None:
            root_scroll_width = manifest_number(root.get("width"))
        root_scroll_height = manifest_number(root.get("scrollHeight"))
        if root_scroll_height is None:
            root_scroll_height = manifest_number(root.get("height"))

    if root_scroll_width is not None:
        canvas_width = manifest_context.get("canvasWidth")
        if isinstance(canvas_width, (int, float)) and root_scroll_width > canvas_width + overflow_tolerance:
            errors.append(
                f"manifest canvas width {canvas_width:g}px is less than rendered "
                f"{root_selector} scrollWidth {root_scroll_width:g}px"
            )

        export_width = manifest_context.get("exportWidth")
        if isinstance(export_width, (int, float)) and root_scroll_width > export_width + overflow_tolerance:
            errors.append(
                f"manifest export width {export_width:g}px is less than rendered "
                f"{root_selector} scrollWidth {root_scroll_width:g}px"
            )

    if root_scroll_height is not None:
        canvas_height = manifest_context.get("canvasHeight")
        if isinstance(canvas_height, (int, float)) and root_scroll_height > canvas_height + overflow_tolerance:
            errors.append(
                f"manifest canvas height {canvas_height:g}px is less than rendered "
                f"{root_selector} scrollHeight {root_scroll_height:g}px"
            )

        export_height = manifest_context.get("exportHeight")
        if isinstance(export_height, (int, float)) and root_scroll_height > export_height + overflow_tolerance:
            errors.append(
                f"manifest export height {export_height:g}px is less than rendered "
                f"{root_selector} scrollHeight {root_scroll_height:g}px"
            )

    report["errors"] = errors
    report["warnings"] = warnings
    report["passed"] = len(errors) == 0
    return report


def inspect_layout(args) -> dict[str, object]:
    html_path = Path(args.html)
    if not html_path.exists():
        return {"passed": False, "errors": [f"HTML file not found: {html_path}"], "warnings": []}
    manifest_context = load_manifest_context(html_path, args.manifest)

    server = None
    if args.serve:
        server, url = start_static_server(html_path)
        if args.screenshot_mode:
            url = append_query_param(url, "screenshot", "1")
    else:
        url = build_file_url(html_path, args.screenshot_mode)

    sync_playwright, PlaywrightTimeoutError, PlaywrightError = load_playwright(args)

    try:
        with sync_playwright() as playwright:
            browser = launch_chromium(playwright, PlaywrightError, args)
            context = browser.new_context(
                viewport={"width": args.viewport_width, "height": args.viewport_height},
                device_scale_factor=args.device_scale_factor,
            )
            page = context.new_page()
            page.goto(url, wait_until=args.wait_until, timeout=args.timeout)
            if args.ready_expression:
                try:
                    page.wait_for_function(args.ready_expression, timeout=args.timeout)
                except PlaywrightTimeoutError:
                    error_message = page.evaluate("window.__INFOGRAPHIC_ERROR__ || ''")
                    detail = f": {error_message}" if error_message else ""
                    return {
                        "passed": False,
                        "errors": [f"timed out waiting for readiness marker{detail}"],
                        "warnings": [],
                    }
            if args.settle_ms > 0:
                page.wait_for_timeout(args.settle_ms)
            report = page.evaluate(
                """
                (config) => {
                  const root = document.querySelector(config.rootSelector);
                  const errors = [];
                  const warnings = [];
                  const items = [];
                  const pairs = [];
                  if (!root) {
                    return { passed: false, errors: [`root selector not found: ${config.rootSelector}`], warnings, items, pairs };
                  }
                  const rootRect = root.getBoundingClientRect();
                  const rootStyle = window.getComputedStyle(root);
                  const isVisible = (el, rect, style) => {
                    return rect.width > 0 && rect.height > 0 &&
                      style.display !== "none" &&
                      style.visibility !== "hidden" &&
                      Number(style.opacity || 1) !== 0;
                  };
                  const describe = (el) => {
                    const requiredLabel = el.getAttribute("data-required");
                    const decorativeLabel = el.getAttribute("data-decorative");
                    const semanticLabel = (value) => value && value !== "true" ? value : "";
                    return semanticLabel(requiredLabel) ||
                      semanticLabel(decorativeLabel) ||
                      el.getAttribute("aria-label") ||
                      el.id ||
                      (el.className && String(el.className).split(/\\s+/).filter(Boolean).slice(0, 2).join(".")) ||
                      el.tagName.toLowerCase();
                  };
                  const numericZIndex = (style) => {
                    const value = Number.parseInt(style.zIndex, 10);
                    return Number.isFinite(value) ? value : null;
                  };
                  const stackIndex = (el) => {
                    let current = el;
                    let index = 0;
                    let found = false;
                    while (current && current !== document.documentElement) {
                      const style = window.getComputedStyle(current);
                      const value = numericZIndex(style);
                      if (style.position !== "static" && value !== null) {
                        index = found ? Math.max(index, value) : value;
                        found = true;
                      }
                      current = current.parentElement;
                    }
                    return index;
                  };
                  const clipsOverflow = (value) => {
                    return value === "hidden" || value === "clip" || value === "auto" || value === "scroll";
                  };
                  const axisAligned = (el) => {
                    for (let node = el; node; node = node.parentElement) {
                      const style = getComputedStyle(node);
                      const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
                      if (!matrix.is2D || matrix.a <= 0 || matrix.d <= 0 ||
                          Math.abs(matrix.b) > 1e-6 || Math.abs(matrix.c) > 1e-6 ||
                          (style.rotate && style.rotate !== 'none') ||
                          (style.scale && style.scale !== 'none' && style.scale.split(/\\s+/).some(v => Number(v) <= 0))) return false;
                    }
                    return true;
                  };
                  const warnUnsupportedClip = (el) => {
                    const style = getComputedStyle(el);
                    if (style.clipPath !== 'none' || (style.maskImage && style.maskImage !== 'none') ||
                        (style.clip && style.clip !== 'auto') || !axisAligned(el)) {
                      const warning = `Complex clipping/transform requires manual visual review: ${describe(el)}`;
                      if (!warnings.includes(warning)) warnings.push(warning);
                    }
                  };
                  const checkAncestorClipping = (item) => {
                    warnUnsupportedClip(item.element);
                    for (let ancestor = item.element.parentElement; ancestor; ancestor = ancestor.parentElement) {
                      warnUnsupportedClip(ancestor);
                      const style = getComputedStyle(ancestor);
                      // Out-of-flow descendants escape overflow ancestors below their containing block.
                      let escapes = false;
                      for (let node = item.element; node && node !== ancestor; node = node.parentElement) {
                        const position = getComputedStyle(node).position;
                        if ((position === 'absolute' || position === 'fixed') &&
                            (!node.offsetParent || !ancestor.contains(node.offsetParent))) {
                          escapes = true;
                          break;
                        }
                      }
                      if ((clipsOverflow(style.overflowX) || clipsOverflow(style.overflowY)) &&
                          !escapes && axisAligned(ancestor) && ancestor.offsetWidth && ancestor.offsetHeight) {
                        const box = ancestor.getBoundingClientRect();
                        const sx = box.width / ancestor.offsetWidth, sy = box.height / ancestor.offsetHeight;
                        const left = box.left + ancestor.clientLeft * sx;
                        const top = box.top + ancestor.clientTop * sy;
                        const right = left + ancestor.clientWidth * sx;
                        const bottom = top + ancestor.clientHeight * sy;
                        const axes = [];
                        if (clipsOverflow(style.overflowX) &&
                            (item.rect.left < left - config.overflowTolerance || item.rect.right > right + config.overflowTolerance)) axes.push('x');
                        if (clipsOverflow(style.overflowY) &&
                            (item.rect.top < top - config.overflowTolerance || item.rect.bottom > bottom + config.overflowTolerance)) axes.push('y');
                        if (axes.length) errors.push(`required element clipped by ancestor: ${item.label} / ${describe(ancestor)} (axis ${axes.join(',')})`);
                      }
                      if (ancestor === root) break;
                    }
                  };
                  const rootOverflowX = root.scrollWidth > root.clientWidth + config.overflowTolerance;
                  if (rootOverflowX) {
                    const clippingNote = clipsOverflow(rootStyle.overflowX)
                      ? " fixed clipping"
                      : "";
                    errors.push(
                      `${config.rootSelector} content exceeds${clippingNote} width; keep required content and decorative overflow inside the root, or update canvas/export width intentionally`
                    );
                  }
                  const rootOverflowY = root.scrollHeight > root.clientHeight + config.overflowTolerance;
                  if (rootOverflowY) {
                    const clippingNote = clipsOverflow(rootStyle.overflowY)
                      ? " fixed clipping"
                      : "";
                    errors.push(
                      `${config.rootSelector} content exceeds${clippingNote} height; set root height to rendered scrollHeight or use content-driven canvas height`
                    );
                  }
                  const needsFooterSafeArea = (item) => {
                    const label = String(item.label || "").toLowerCase();
                    const text = String(item.text || "").toLowerCase();
                    return /(footer|source|date|url|cta|closing)/.test(label) ||
                      /(source|数据来源|来源|官网|http|www\\.)/.test(text);
                  };
                  const rectObject = (rect) => ({
                    x: Math.round(rect.x * 10) / 10,
                    y: Math.round(rect.y * 10) / 10,
                    width: Math.round(rect.width * 10) / 10,
                    height: Math.round(rect.height * 10) / 10,
                    top: Math.round(rect.top * 10) / 10,
                    right: Math.round(rect.right * 10) / 10,
                    bottom: Math.round(rect.bottom * 10) / 10,
                    left: Math.round(rect.left * 10) / 10,
                  });
                  const collect = (selector, kind) => {
                    return Array.from(document.querySelectorAll(selector))
                      .map((el, index) => {
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        if (!isVisible(el, rect, style)) return null;
                        return {
                          element: el,
                          index,
                          kind,
                          label: describe(el),
                          text: (el.innerText || el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 120),
                          rect,
                          overflowX: el.scrollWidth > el.clientWidth + config.overflowTolerance,
                          overflowY: el.scrollHeight > el.clientHeight + config.overflowTolerance,
                          textOverflow: style.textOverflow,
                          overflow: style.overflow,
                          overflowXCss: style.overflowX,
                          overflowYCss: style.overflowY,
                          whiteSpace: style.whiteSpace,
                          stackIndex: stackIndex(el),
                        };
                      })
                      .filter(Boolean);
                  };
                  const required = collect(config.requiredSelector, "required");
                  const decorative = collect(config.decorativeSelector, "decorative");
                  const overlapArea = (a, b) => {
                    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
                    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
                    return width * height;
                  };
                  const pushItem = (item) => {
                    items.push({
                      kind: item.kind,
                      label: item.label,
                      text: item.text,
                      rect: rectObject(item.rect),
                      overflowX: item.overflowX,
                      overflowY: item.overflowY,
                      textOverflow: item.textOverflow,
                      overflow: item.overflow,
                      overflowXCss: item.overflowXCss,
                      overflowYCss: item.overflowYCss,
                      whiteSpace: item.whiteSpace,
                      stackIndex: item.stackIndex,
                      bottomSafePx: item.kind === 'required'
                        ? (needsFooterSafeArea(item) ? Math.max(config.bottomSafePx, config.footerSafePx) : config.bottomSafePx)
                        : 0,
                    });
                  };
                  decorative.forEach(pushItem);
                  for (const item of required) {
                    pushItem(item);
                    checkAncestorClipping(item);
                    const clippedByRoot = item.rect.left < rootRect.left - 1 ||
                      item.rect.top < rootRect.top - 1 ||
                      item.rect.right > rootRect.right + 1 ||
                      item.rect.bottom > rootRect.bottom + 1;
                    if (clippedByRoot) {
                      errors.push(`required element outside ${config.rootSelector}: ${item.label}`);
                    }
                    const clippedX = item.overflowX && clipsOverflow(item.overflowXCss);
                    const clippedY = item.overflowY && clipsOverflow(item.overflowYCss);
                    if (clippedX || clippedY) {
                      errors.push(`required element content overflows box: ${item.label}`);
                    } else if (item.overflowX || item.overflowY) {
                      errors.push(`required element has visible overflow; reserve more space: ${item.label}`);
                    }
                    if (item.textOverflow === "ellipsis" || item.text.includes("…")) {
                      errors.push(`required element uses ellipsis: ${item.label}`);
                    }
                    const bottomGap = rootRect.bottom - item.rect.bottom;
                    const bottomSafePx = needsFooterSafeArea(item)
                      ? Math.max(config.bottomSafePx, config.footerSafePx)
                      : config.bottomSafePx;
                    if (bottomGap < bottomSafePx) {
                      errors.push(`required element violates bottom safe area: ${item.label}`);
                    }
                  }
                  const allPairs = [];
                  for (let i = 0; i < required.length; i += 1) {
                    for (let j = i + 1; j < required.length; j += 1) {
                      allPairs.push([required[i], required[j], "required-required"]);
                    }
                    for (const deco of decorative) {
                      allPairs.push([required[i], deco, "required-decorative"]);
                    }
                  }
                  for (const [a, b, kind] of allPairs) {
                    if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
                    if (kind === "required-decorative" && b.stackIndex < a.stackIndex) continue;
                    const area = overlapArea(a.rect, b.rect);
                    if (area > config.minOverlapArea) {
                      const message = `${kind} overlap: ${a.label} / ${b.label}`;
                      errors.push(message);
                      pairs.push({ kind, a: a.label, b: b.label, area: Math.round(area) });
                    }
                  }
                  if (required.length === 0) {
                    warnings.push(`no required elements found with selector ${config.requiredSelector}`);
                  }
                  return {
                    passed: errors.length === 0,
                    errors,
                    warnings,
                    required_count: required.length,
                    decorative_count: decorative.length,
                    root: {
                      ...rectObject(rootRect),
                      clientWidth: root.clientWidth,
                      clientHeight: root.clientHeight,
                      offsetWidth: root.offsetWidth,
                      offsetHeight: root.offsetHeight,
                      boxSizing: rootStyle.boxSizing,
                      verticalBoxExtra: ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
                        .reduce((sum, key) => sum + (Number.parseFloat(rootStyle[key]) || 0), 0),
                      scrollWidth: root.scrollWidth,
                      scrollHeight: root.scrollHeight,
                      overflowX: rootStyle.overflowX,
                      overflowY: rootStyle.overflowY,
                    },
                    items,
                    pairs,
                  };
                }
                """,
                {
                    "rootSelector": args.selector,
                    "requiredSelector": args.required_selector,
                    "decorativeSelector": args.decorative_selector,
                    "bottomSafePx": args.bottom_safe_px,
                    "footerSafePx": args.footer_safe_px,
                    "minOverlapArea": args.min_overlap_area,
                    "overflowTolerance": args.overflow_tolerance,
                },
            )
            context.close()
            browser.close()
            return apply_manifest_canvas_checks(
                report,
                manifest_context,
                overflow_tolerance=args.overflow_tolerance,
                root_selector=args.selector,
            )
    finally:
        if server:
            server.shutdown()


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect rendered infographic HTML layout")
    parser.add_argument("--html", required=True, help="Generated HTML file path")
    parser.add_argument("--manifest", help="Optional manifest.json path; defaults to manifest.json beside --html")
    parser.add_argument("--selector", default="#infographic", help="Infographic root selector")
    parser.add_argument("--required-selector", default="[data-required]", help="Required element selector")
    parser.add_argument("--decorative-selector", default="[data-decorative]", help="Decorative element selector")
    parser.add_argument("--output", help="Optional JSON report path")
    parser.add_argument("--viewport-width", type=int, default=1600)
    parser.add_argument("--viewport-height", type=int, default=1800)
    parser.add_argument("--device-scale-factor", type=float, default=1)
    parser.add_argument("--timeout", type=int, default=30000)
    parser.add_argument("--settle-ms", type=int, default=200)
    parser.add_argument("--ready-expression", default="", help="Optional readiness expression")
    parser.add_argument(
        "--wait-until",
        default="load",
        choices=["commit", "domcontentloaded", "load", "networkidle"],
    )
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--screenshot-mode", dest="screenshot_mode", action="store_true", default=True)
    parser.add_argument("--no-screenshot-mode", dest="screenshot_mode", action="store_false")
    parser.add_argument("--install-playwright", action="store_true")
    parser.add_argument("--install-browser", action="store_true")
    parser.add_argument("--playwright-package", default=DEFAULT_PLAYWRIGHT_PACKAGE)
    parser.add_argument("--pip-user", action="store_true")
    parser.add_argument("--bottom-safe-px", type=int, default=64)
    parser.add_argument("--footer-safe-px", type=int, default=96)
    parser.add_argument("--min-overlap-area", type=float, default=24)
    parser.add_argument("--overflow-tolerance", type=float, default=3)
    args = parser.parse_args()

    report = inspect_layout(args)
    if args.output:
        write_json(Path(args.output), report)
    else:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report.get("passed") else 1


if __name__ == "__main__":
    sys.exit(main())
