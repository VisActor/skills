#!/usr/bin/env python3
"""
Export a rendered standalone infographic HTML file to a PNG.

The script opens the HTML, waits for the infographic readiness marker, and
screenshots a target element such as #infographic.

Examples:
  python3 export_html_png.py --html index.html --selector "#infographic" --draft --output draft/preview.png
  python3 export_html_png.py --html index.html --selector "#infographic" --serve --draft --output draft/preview.png
"""

import argparse
import functools
import importlib
import math
import subprocess
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, quote, urlencode, urlsplit, urlunsplit

from browser_runtime import browser_launch_options, load_page

DEFAULT_READY_EXPRESSION = "window.__INFOGRAPHIC_READY__ === true"
DEFAULT_PLAYWRIGHT_PACKAGE = "playwright>=1.59,<2"


class QuietStaticHandler(SimpleHTTPRequestHandler):
    """Static file handler without noisy access logs."""

    def log_message(self, format, *args):  # noqa: A002 - matches base class signature
        return


def append_query_param(url, key, value):
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query[key] = value
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def build_file_url(html_path, screenshot_mode):
    url = html_path.resolve().as_uri()
    if screenshot_mode:
        url = append_query_param(url, "screenshot", "1")
    return url


def start_static_server(html_path):
    root = html_path.resolve().parent
    handler = functools.partial(QuietStaticHandler, directory=str(root))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    relative_path = html_path.resolve().relative_to(root).as_posix()
    url = f"http://127.0.0.1:{server.server_port}/{quote(relative_path)}"
    return server, url


def run_command(command, description):
    print(f"{description}: {' '.join(command)}", file=sys.stderr)
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as error:
        print(
            f"Error: {description} failed with exit code {error.returncode}",
            file=sys.stderr,
        )
        sys.exit(error.returncode)


def install_playwright_package(args):
    command = [sys.executable, "-m", "pip", "install"]
    if args.pip_user:
        command.append("--user")
    command.append(args.playwright_package)
    run_command(command, "Installing Python Playwright package")
    importlib.invalidate_caches()


def install_chromium_browser():
    command = [sys.executable, "-m", "playwright", "install", "chromium"]
    run_command(command, "Installing Playwright Chromium browser")


def load_playwright(args):
    try:
        from playwright.sync_api import Error as PlaywrightError
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except ModuleNotFoundError:
        if args.install_playwright:
            install_playwright_package(args)
            try:
                from playwright.sync_api import Error as PlaywrightError
                from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
                from playwright.sync_api import sync_playwright
            except ModuleNotFoundError:
                print(
                    "Error: Python Playwright is still not importable after installation.",
                    file=sys.stderr,
                )
                sys.exit(1)

            install_chromium_browser()
            return sync_playwright, PlaywrightTimeoutError, PlaywrightError

        print(
            "Error: Python Playwright is not installed.\n"
            "Install it with:\n"
            f'  python3 -m pip install "{DEFAULT_PLAYWRIGHT_PACKAGE}"\n'
            "  python3 -m playwright install chromium\n"
            "Or rerun this script with --install-playwright.",
            file=sys.stderr,
        )
        sys.exit(1)

    if args.install_browser:
        install_chromium_browser()

    return sync_playwright, PlaywrightTimeoutError, PlaywrightError


def launch_chromium(playwright, PlaywrightError, args):
    try:
        return playwright.chromium.launch(**browser_launch_options())
    except PlaywrightError as error:
        message = str(error)
        should_install = args.install_browser or args.install_playwright
        if should_install and (
            "Executable doesn't exist" in message
            or "Please run the following command" in message
            or "playwright install" in message
        ):
            install_chromium_browser()
            return playwright.chromium.launch(**browser_launch_options())

        print(
            "Error: failed to launch Playwright Chromium.\n"
            f"{message}\n"
            "If Chromium is missing, rerun this script with --install-browser.",
            file=sys.stderr,
        )
        sys.exit(1)


def export_png(args):
    # Imported lazily: review uses this module's HTTP helpers without export gates.
    from delivery_policy import check_export_target
    html_path = Path(args.html)
    root = Path(args.bundle).resolve() if getattr(args, 'bundle', None) else html_path.resolve().parent
    check_export_target(root, html_path, Path(args.output), draft=getattr(args, 'draft', False))
    if not html_path.exists():
        print(f"Error: HTML file not found: {html_path}", file=sys.stderr)
        sys.exit(1)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

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
            diagnostics = load_page(page, url, ready_expression=args.ready_expression,
                                    timeout_ms=args.timeout, wait_until=args.wait_until)

            if args.full_page:
                if args.settle_ms > 0:
                    page.wait_for_timeout(args.settle_ms)
                page.screenshot(path=str(output_path), full_page=True)
            else:
                locator = page.locator(args.selector).first
                try:
                    locator.wait_for(state="visible", timeout=args.timeout)
                except PlaywrightTimeoutError:
                    print(
                        f"Error: selector '{args.selector}' not found or not visible within {args.timeout} ms",
                        file=sys.stderr,
                    )
                    sys.exit(1)
                box = locator.bounding_box(timeout=args.timeout)
                if box:
                    next_width = max(args.viewport_width, math.ceil(box["x"] + box["width"]))
                    next_height = max(args.viewport_height, math.ceil(box["y"] + box["height"]))
                    if (
                        next_width != args.viewport_width
                        or next_height != args.viewport_height
                    ):
                        page.set_viewport_size({"width": next_width, "height": next_height})
                        try:
                            locator.wait_for(state="visible", timeout=args.timeout)
                        except PlaywrightTimeoutError:
                            print(
                                f"Error: selector '{args.selector}' not found or not visible within {args.timeout} ms",
                                file=sys.stderr,
                            )
                            sys.exit(1)

                if args.settle_ms > 0:
                    page.wait_for_timeout(args.settle_ms)

                locator.screenshot(path=str(output_path))

            diagnostics.check()
            context.close()
            browser.close()
    finally:
        if server:
            server.shutdown()

    print(f"Generated PNG: {output_path}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description="Export a rendered standalone infographic HTML file to PNG",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 export_html_png.py --html index.html --selector "#infographic" --draft --output draft/preview.png
  python3 export_html_png.py --html index.html --selector "#infographic" --serve --draft --output draft/preview.png
        """,
    )
    parser.add_argument("--bundle", help="Bundle root (defaults to HTML parent)")
    parser.add_argument("--draft", action="store_true", help="Diagnostic screenshot only, output under draft/; never certifies delivery")
    parser.add_argument("--html", required=True, help="Generated HTML file path")
    parser.add_argument("--output", "-o", required=True, help="Output PNG file path")
    parser.add_argument("--selector", default="#infographic", help="Element selector to screenshot")
    parser.add_argument(
        "--viewport-width",
        type=int,
        default=1600,
        help="Browser viewport width in CSS pixels",
    )
    parser.add_argument(
        "--viewport-height",
        type=int,
        default=1200,
        help="Browser viewport height in CSS pixels",
    )
    parser.add_argument(
        "--device-scale-factor",
        type=float,
        default=2,
        help="Device scale factor for higher resolution screenshots",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30000,
        help="Navigation, selector, and readiness timeout in milliseconds",
    )
    parser.add_argument(
        "--settle-ms",
        type=int,
        default=200,
        help="Extra wait after readiness before screenshot",
    )
    parser.add_argument(
        "--ready-expression",
        default=DEFAULT_READY_EXPRESSION,
        help="JavaScript expression that must evaluate truthy before screenshot",
    )
    parser.add_argument(
        "--wait-until",
        default="networkidle",
        choices=["commit", "domcontentloaded", "load", "networkidle"],
        help="Playwright page.goto wait condition",
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Serve the HTML directory over local HTTP instead of opening file://",
    )
    parser.add_argument(
        "--full-page",
        action="store_true",
        help="Capture the full page instead of the selected element",
    )
    parser.add_argument(
        "--screenshot-mode",
        dest="screenshot_mode",
        action="store_true",
        default=True,
        help="Append screenshot=1 to enable template screenshot mode",
    )
    parser.add_argument(
        "--no-screenshot-mode",
        dest="screenshot_mode",
        action="store_false",
        help="Do not append screenshot=1",
    )
    parser.add_argument(
        "--install-playwright",
        action="store_true",
        help="Install the Python Playwright package and Chromium if missing",
    )
    parser.add_argument(
        "--install-browser",
        action="store_true",
        help="Install Playwright Chromium before screenshotting",
    )
    parser.add_argument(
        "--playwright-package",
        default=DEFAULT_PLAYWRIGHT_PACKAGE,
        help="Package spec passed to pip when --install-playwright is used",
    )
    parser.add_argument(
        "--pip-user",
        action="store_true",
        help="Add --user to pip install when --install-playwright is used",
    )

    try:
        export_png(parser.parse_args())
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f'Export blocked: {error}', file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
