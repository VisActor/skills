#!/usr/bin/env python3
"""Check self-contained, static magazine HTML and export each data-page to PNG."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import zipfile
from pathlib import Path

AUDIT = r"""() => {
  const errors = [];
  const pages = [...document.querySelectorAll('[data-page]')];
  if (!pages.length) errors.push('No [data-page] elements');
  if (document.querySelector('script,iframe,canvas,video,audio,object,embed'))
    errors.push('Use static HTML/SVG/images only; remove scripts or embedded runtime media');
  const fonts = [...document.fonts].map(f => ({family:f.family,status:f.status}));
  for (const f of fonts) if (f.status === 'error') errors.push('Font failed: '+f.family);
  const describe = el => el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+' '+(el.textContent||'').trim().slice(0,45);
  const info = pages.map((page,index) => {
    const box = page.getBoundingClientRect(), style = getComputedStyle(page);
    if (page.parentElement.closest('[data-page]')) errors.push('Nested data-page');
    if (box.width < 1 || box.height < 1 || !Number.isInteger(box.width) || !Number.isInteger(box.height))
      errors.push(`Page ${index+1}: expected positive integer pixel dimensions`);
    if (style.transform !== 'none') errors.push(`Page ${index+1}: remove page transform`);
    if (!page.textContent.trim() && !page.querySelector('img,svg')) errors.push(`Page ${index+1}: empty`);
    const within = (a,b) => a.left >= b.left-1 && a.top >= b.top-1 && a.right <= b.right+1 && a.bottom <= b.bottom+1;
    // Content-image policy is explicit; decorative and explanatory SVG remain valid.
    for (const slot of page.querySelectorAll('[data-image-policy="raster"]')) {
      const images = slot.matches('img') ? [slot] : [...slot.querySelectorAll('img')];
      if (slot.matches('svg') || slot.querySelector('svg') || !images.length ||
          images.some(img => !/^data:image\/(png|jpe?g|webp|avif|gif);base64,/i.test(img.getAttribute('src') || ''))) {
        errors.push(`Page ${index+1}: content image requires acquired photo/generated illustration; replace SVG or missing asset`);
      }
    }
    for (const el of [page,...page.querySelectorAll('*')]) {
      if (el.closest('defs,title,desc,clipPath,mask,style')) continue;
      const css = getComputedStyle(el), r = el.getBoundingClientRect();
      if (css.display === 'none' || css.visibility === 'hidden' || (!r.width && !r.height)) continue;
      if (!within(r,box)) errors.push(`Page ${index+1}: outside page: ${describe(el)}`);
      const svg = el.ownerSVGElement;
      if (svg && !within(r,svg.getBoundingClientRect())) errors.push(`Page ${index+1}: outside SVG: ${describe(el)}`);
      // Visible font ascenders can exceed line-height without clipping copy.
      if (!svg && (el.scrollWidth > el.clientWidth+1 ||
          ((el === page || css.overflowY !== 'visible') && el.scrollHeight > el.clientHeight+1)) && css.display !== 'inline')
        errors.push(`Page ${index+1}: overflowing box: ${describe(el)}`);
      if (css.webkitLineClamp && css.webkitLineClamp !== 'none' && css.webkitLineClamp !== '0')
        errors.push(`Page ${index+1}: line clamp hides copy: ${describe(el)}`);
      if (el.tagName === 'IMG' && (!el.complete || !el.naturalWidth)) errors.push(`Page ${index+1}: broken image`);
      for (const child of el.childNodes) {
        if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim() || svg) continue;
        const range = document.createRange(); range.selectNodeContents(child);
        for (const rect of range.getClientRects()) {
          if (!within(rect,box)) errors.push(`Page ${index+1}: text outside page: ${describe(el)}`);
          if (css.overflow !== 'visible' && !within(rect,r)) errors.push(`Page ${index+1}: clipped text: ${describe(el)}`);
        }
      }
    }
    return {page:index+1,width:box.width,height:box.height,fontFamily:style.fontFamily};
  });
  return {pages:info,fonts,errors:[...new Set(errors)]};
}"""


def export(
    html: Path,
    output: Path,
    browser_path: str | None = None,
    font_mode: str = "auto",
    font_assets: Path | None = None,
    font_timeout: float = 20,
    *,
    expected_size: tuple[int, int] | None = None,
    inner_pages_only: bool = False,
) -> dict:
    if font_mode not in ("auto", "offline", "system") or font_timeout <= 0:
        raise ValueError("Invalid font mode or timeout")
    html = html.resolve(strict=True)
    output = output.resolve()
    if output.exists() and any(output.iterdir()):
        raise ValueError(f"Output directory must be empty: {output}")
    output.mkdir(parents=True, exist_ok=True)
    report = {"ok": False, "pages": [], "errors": [], "externalRequests": []}
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as pw:
            options = {"headless": True}
            if browser_path:
                options["executable_path"] = browser_path
            with pw.chromium.launch(**options) as browser:
                context = browser.new_context(
                    viewport={"width": 1600, "height": 1600},
                    device_scale_factor=1,
                    java_script_enabled=False,
                )

                def route_request(route):
                    request = route.request
                    if request.url == html.as_uri() and request.is_navigation_request():
                        route.continue_()
                    elif request.url.startswith("data:"):
                        route.continue_()
                    else:
                        report["externalRequests"].append(request.url)
                        route.abort()

                context.route("**/*", route_request)
                page = context.new_page()
                page.set_default_timeout(15000)
                page.goto(html.as_uri(), wait_until="load", timeout=30000)
                spec = importlib.util.spec_from_file_location(
                    "magazine_font_loading", Path(__file__).with_name("font_loading.py")
                )
                font_loader = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(font_loader)
                report["fontResolution"] = font_loader.resolve_fonts(
                    page,
                    context.request,
                    font_assets or Path(__file__).resolve().parent.parent / "assets",
                    font_mode,
                    font_timeout,
                )
                page.evaluate("""() => Promise.race([
                    Promise.all([document.fonts.ready,
                        ...[...document.images].map(i => i.decode().catch(() => {}))]),
                    new Promise((_, reject) => setTimeout(() => reject(Error('Resources timed out')), 15000))
                ])""")
                report.update(page.evaluate(AUDIT))
                if not inner_pages_only and page.locator("[data-page]").count() > 1:
                    biography_errors = page.evaluate("""() => {
                        const pages = [...document.querySelectorAll('[data-page]')];
                        if (!document.querySelector('[data-template="biography-cover"], .mc-bio, .panorama, [data-template="biography"], .bio-detail')) return [];
                        const overview = pages[1];
                        const hero = overview.querySelector('.bio-body .portrait img');
                        const flows = ['.chronology', '.topics'].map(side =>
                            overview.querySelector(side + ' .portrait-exclusion'));
                        if (!hero || flows.some(el => !el || getComputedStyle(el).shapeOutside === 'none' || el.offsetHeight === 0))
                            return ['人物全景页缺少中央抠图或左右轮廓绕排；请从 biography.html 保留第二页的正文结构和样式。'];
                        const canvas = document.createElement('canvas');
                        canvas.width = canvas.height = 64;
                        const ctx = canvas.getContext('2d');
                        if (!hero.naturalWidth) return ['人物全景页的中央肖像无法读取。'];
                        ctx.drawImage(hero, 0, 0, 64, 64);
                        const alpha = ctx.getImageData(0, 0, 64, 64).data.filter((_, i) => i % 4 === 3);
                        return alpha.some(a => a < 32) && alpha.some(a => a > 224) ? [] :
                            ['请使用有实际透明轮廓的主肖像并重新计算左右绕排。'];
                    }""")
                    report["errors"].extend(biography_errors)
                if expected_size is not None:
                    covers = page.locator('[data-page][data-page-role="cover"]')
                    first = page.locator("[data-page]").first
                    if not inner_pages_only and (
                        covers.count() != 1 or first.get_attribute("data-page-role") != "cover"
                    ):
                        report["errors"].append(
                            "完整组图须保留场景模板的独立封面，放在第 1 页，再接总览或正文。"
                        )
                    for meta in report["pages"]:
                        if (meta["width"], meta["height"]) != expected_size:
                            report["errors"].append(
                                f"第 {meta['page']} 页画布为 {meta['width']}×{meta['height']}，"
                                f"本次需要 {expected_size[0]}×{expected_size[1]}。"
                            )

                if report["externalRequests"]:
                    report["errors"].append(
                        "External resources blocked; inline CSS, fonts and images"
                    )
                if report["errors"]:
                    raise ValueError("Layout/resource checks failed; see report.json")
                pages = page.locator("[data-page]")
                for index, meta in enumerate(report["pages"]):
                    filename = f"page-{index + 1:02d}.png"
                    pages.nth(index).screenshot(
                        path=str(output / filename), animations="disabled", timeout=30000
                    )
                    meta["file"] = filename
                # Freeze resolved fonts and status into the delivered static document.
                final_html = (
                    page.content() if report["fontResolution"] else html.read_text(encoding="utf-8")
                )
                context.close()
        (output / "magazine.html").write_text(final_html, encoding="utf-8")
        with zipfile.ZipFile(output / "images.zip", "w", zipfile.ZIP_DEFLATED) as archive:
            for meta in report["pages"]:
                archive.write(output / meta["file"], meta["file"])
        report["ok"] = True
    except Exception as exc:
        report["errors"].append(str(exc))
        # Never leave partial screenshots looking like a successful delivery.
        for path in output.glob("page-*.png"):
            path.unlink()
        for name in ("images.zip", "magazine.html"):
            (output / name).unlink(missing_ok=True)
    (output / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--browser", help="Existing Chromium/Chrome executable")
    parser.add_argument("--font-mode", choices=["auto", "offline", "system"], default="auto")
    parser.add_argument(
        "--font-assets",
        type=Path,
        help="Optional assets directory containing fonts.json and licensed WOFF2",
    )
    parser.add_argument(
        "--font-timeout", type=float, default=20, help="Total CDN loading deadline in seconds"
    )
    parser.add_argument(
        "--inner-pages-only",
        action="store_true",
        help="Export requested interior pages without a cover",
    )
    parser.add_argument(
        "--page-size",
        nargs=2,
        type=int,
        metavar=("WIDTH", "HEIGHT"),
        default=(1080, 1440),
        help="Requested output dimensions in pixels (default mobile edition: 1080 1440)",
    )
    args = parser.parse_args()
    if min(args.page_size) <= 0:
        parser.error("--page-size requires two positive pixel dimensions")
    try:
        report = export(
            args.html,
            args.output,
            args.browser,
            args.font_mode,
            args.font_assets,
            args.font_timeout,
            expected_size=tuple(args.page_size),
            inner_pages_only=args.inner_pages_only,
        )
    except (OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
