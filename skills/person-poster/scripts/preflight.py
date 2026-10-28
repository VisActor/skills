#!/usr/bin/env python3
"""Probe the real Python/browser environment and collect font metrics before production.

No automatic installs, network lookups or provider discovery. Font samples are
diagnostic evidence, not proof that a named system font exists or covers all glyphs.
"""
from __future__ import annotations

import argparse
import importlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path
from time import perf_counter

from browser_runtime import PageDiagnostics, browser_launch_options


def probe_driver() -> dict:
    """Capture a failing driver's public CLI diagnostic without installing anything."""
    command = [sys.executable, "-m", "playwright", "--version"]
    report = {"command": command, "passed": False, "returncode": None,
              "timedOut": False, "outputTruncated": False}
    stdout = stderr = ""
    try:
        result = subprocess.run(command, capture_output=True, text=True,
                                encoding="utf-8", errors="replace", timeout=15)
        report.update(returncode=result.returncode, passed=result.returncode == 0)
        stdout, stderr = result.stdout, result.stderr
    except subprocess.TimeoutExpired as error:
        report.update(timedOut=True, error="Playwright CLI did not finish within 15 seconds")
        stdout, stderr = error.stdout or "", error.stderr or ""
    except OSError as error:
        report["error"] = str(error)
    for name, value in (("stdout", stdout), ("stderr", stderr)):
        if isinstance(value, bytes):
            value = value.decode("utf-8", errors="replace")
        if len(value) > 4096:
            report["outputTruncated"] = True
        report[name] = value[:4096]
    return report


def recovery_action(phase: str) -> str:
    if phase == "driver-startup":
        return ("Inspect driverProbe before installing Chromium: the Playwright driver failed to start. "
                "Use a supported interpreter and an isolated task-local environment as described in "
                "references/environment.md; rerun preflight and keep that interpreter/environment "
                "for review and export. Do not patch host caches or copy private runtime packages.")
    if phase == "browser-launch":
        return ("The Playwright driver started, but Chromium did not. Inspect the browser error; "
                "if its executable is missing, install Chromium with the same Python via "
                "-m playwright install chromium. For system libraries or permissions, follow "
                "references/environment.md; rerun preflight before generating assets.")
    if phase == "font-probe":
        return ("The browser launched but the font/sample probe failed. Inspect the reported error, "
                "fonts and output-directory permissions, then rerun preflight.")
    return ("Select Python 3.10+ with the dependencies in scripts/requirements.txt; "
            "follow references/environment.md and rerun preflight before generating assets.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("preflight.json"))
    parser.add_argument("--font", action="append", help="CSS font family to sample; repeatable")
    parser.add_argument("--text", default="人物数据海报 52岁 91岁 《代表作品》")
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sample = args.output.with_name(args.output.stem + ".font-sample.png")
    started = perf_counter()
    report = {"startedAtUtc": datetime.now(timezone.utc).isoformat(),
              "python": {"executable": sys.executable, "version": sys.version.split()[0]},
              "passed": False, "failureStage": None, "errors": [], "packages": {}, "timings": {},
              "fontSample": None,
              "notes": ["Font metrics may reflect fallback fonts; visually inspect the sample and current poster.",
                        "This checks environment execution, not data accuracy or total poster-generation time."]}
    if sys.version_info < (3, 10):
        report["errors"].append("Python 3.10+ is required; select a supported interpreter")
    for package, module in [("Pillow", "PIL"), ("playwright", "playwright.sync_api")]:
        try:
            importlib.import_module(module)
            report["packages"][package] = version(package)
        except (ImportError, ValueError) as error:
            report["errors"].append(f"Cannot load {package}: {error}")
    report["timings"]["importsSeconds"] = round(perf_counter() - started, 3)
    phase = "dependencies"
    if not report["errors"]:
        try:
            from playwright.sync_api import sync_playwright
            phase = "driver-startup"
            with sync_playwright() as playwright:
                phase = "browser-launch"
                mark = perf_counter()
                browser = playwright.chromium.launch(**browser_launch_options())
                report["timings"]["launchSeconds"] = round(perf_counter() - mark, 3)
                try:
                    phase = "font-probe"
                    page = browser.new_page(viewport={"width": 1200, "height": 800})
                    diagnostics = PageDiagnostics(page)
                    report["browserLaunchOptions"] = browser_launch_options()
                    page.set_content('<main id="probe" style="background:#faf6f0;color:#352b25;padding:24px;width:max-content;min-width:900px"></main>')
                    report["fontMetrics"] = page.evaluate("""async ({fonts, text}) => {
                      const root = document.querySelector('#probe');
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const result = [];
                      for (const family of fonts) {
                        await document.fonts.load('700 108px ' + family);
                        const label = document.createElement('div'); label.textContent = family;
                        label.style.cssText = 'font:16px sans-serif;margin-top:12px';
                        const sample = document.createElement('div'); sample.textContent = text;
                        sample.style.cssText = 'font-size:108px;font-weight:700;line-height:1.4;padding:16px 0;white-space:nowrap';
                        sample.style.fontFamily = family;
                        root.append(label, sample);
                        ctx.font = '700 108px ' + family;
                        const metrics = ctx.measureText(text);
                        result.push({requestedFamily: family, text, measuredWidth: metrics.width,
                          glyphAscent: metrics.actualBoundingBoxAscent, glyphDescent: metrics.actualBoundingBoxDescent,
                          lineBoxHeight: sample.clientHeight, scrollHeight: sample.scrollHeight});
                      }
                      await document.fonts.ready;
                      return result;
                    }""", {"fonts": args.font or ["serif", "sans-serif"], "text": args.text})
                    box = page.locator("#probe").bounding_box()
                    page.set_viewport_size({"width": max(1200, int(box["width"] + 8)),
                                            "height": max(800, int(box["height"] + 8))})
                    page.locator("#probe").screenshot(path=str(sample))
                    diagnostics.check()
                    report["pageDiagnostics"] = diagnostics.report()
                    report["fontSample"] = sample.name
                    report["browserVersion"] = browser.version
                    report["passed"] = True
                finally:
                    browser.close()
        except Exception as error:
            report["errors"].append(f"{phase}: {error}")
            if phase == "driver-startup":
                report["driverProbe"] = probe_driver()
    report["timings"]["totalSeconds"] = round(perf_counter() - started, 3)
    if not report["passed"]:
        report["failureStage"] = phase
        report["nextAction"] = recovery_action(phase)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"passed": report["passed"], "report": str(args.output),
                      "seconds": report["timings"]["totalSeconds"]}, ensure_ascii=False))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
