"""Audit literal local references or preview a static artifact. Python standard library only."""

import argparse
import functools
import json
import os
import re
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlsplit

ORIGIN = "http://artifact.local"
TEXT_TYPES = {".html", ".htm", ".css", ".js", ".mjs"}
MIME = {".mjs": "text/javascript", ".js": "text/javascript", ".svg": "image/svg+xml",
        ".json": "application/json", ".csv": "text/csv", ".woff2": "font/woff2"}


def confined_path(root, name):
    """Check the lexical path before probing the filesystem, then check the symlink target."""
    base = str(root)
    prefix = os.path.join(base, "")

    def inside(path):
        if path == base:
            return base
        if path.startswith(prefix):
            return path
        raise ValueError("Resource escapes artifact root")

    candidate = inside(os.path.abspath(os.path.join(base, name)))
    return Path(inside(os.path.realpath(candidate)))


def local_file(root, url, *, redirect_directories=False):
    url_path = urlsplit(url).path
    name = unquote(url_path)
    if "\x00" in name:
        raise ValueError("NUL in resource URL")
    target = confined_path(root, name.lstrip("/"))
    if target.is_file():
        return target
    if not target.is_dir():
        raise FileNotFoundError("Missing local file")
    if redirect_directories and not url_path.endswith("/"):
        return target  # Let the HTTP handler issue its trailing-slash redirect.
    for name in ("index.html", "index.htm"):
        index = confined_path(root, target / name)
        if index.is_file():
            return index
    raise FileNotFoundError("No index file in directory")


def strip_js_comments(text):
    # Retain quoted URLs while ignoring comments; this is a literal scanner, not a JS parser.
    return re.sub(r'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`)|/\*[\s\S]*?\*/|//[^\n]*',
                  lambda m: m[1] or " ", text)


class Document(HTMLParser):
    def __init__(self, text, url):
        super().__init__(convert_charrefs=True)
        self.base = url
        self.refs, self.inline, self.notes = [], [], []
        self.content = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "base" and attrs.get("href"):
            self.base = urljoin(self.base, attrs["href"])
        for key in ("src", "href", "poster", "data"):
            if tag != "base" and attrs.get(key):
                self.refs.append(attrs[key])
        if "srcset" in attrs:
            if "data:" in attrs["srcset"]:
                self.notes.append("data URL srcset needs browser inspection")
            else:
                self.refs.extend(item.strip().split()[0] for item in attrs["srcset"].split(",") if item.strip())
        if attrs.get("style"):
            self.inline.append(("css", attrs["style"]))
        if tag in ("style", "script"):
            kind = "css" if tag == "style" else "js"
            if tag == "script" and attrs.get("type", "") not in ("", "module", "text/javascript", "application/javascript"):
                kind = "unscanned-script"
            self.content = [kind, ""]

    def handle_data(self, data):
        if self.content is not None:
            self.content[1] += data

    def handle_endtag(self, tag):
        if tag in ("style", "script") and self.content is not None:
            self.inline.append(tuple(self.content))
            self.content = None


def audit(root, entry="index.html"):
    root = Path(root).resolve(strict=True)
    if not root.is_dir():
        raise ValueError("Artifact root must be a directory")
    entry_url = urljoin(ORIGIN + "/", quote(entry.lstrip("/"), safe="/"))
    report = {"root": str(root), "entry": entry, "files": [], "errors": [], "external": [], "unresolved": [],
              "scope": "Literal local references only; dynamic URLs, JS execution, data correctness and visual quality require browser or task-specific checks."}
    visited, files, queue = set(), set(), [(entry_url, entry_url, "entry")]

    def add(ref, base, document, source, module=False):
        ref = ref.strip()
        if not ref or ref.startswith(("#", "data:", "blob:", "mailto:", "tel:", "javascript:")):
            return
        if module and not ref.startswith((".", "/")) and not urlsplit(ref).scheme:
            report["unresolved"].append({"source": source, "reference": ref, "reason": "bare import: inspect import map or build output"})
            return
        url = urljoin(base, ref)
        if not url.startswith(ORIGIN + "/"):
            report["external"].append({"source": source, "url": url})
            return
        queue.append((url, document, source))

    def scan(text, kind, base, document, source):
        if kind == "css":
            text = re.sub(r"/\*[\s\S]*?\*/", "", text)
            for m in re.finditer(r'''url\(\s*["']?([^\s)'";]+)["']?\s*\)|@import\s+["']([^"']+)["']''', text):
                add(m[1] or m[2], base, document, source)
        elif kind == "js":
            text = strip_js_comments(text)
            for m in re.finditer(r'''\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)''', text):
                add(m[1] or m[2], base, document, source, module=True)
            for m in re.finditer(r'''\bfetch\(\s*["']([^"']+)["']\s*[,)]''', text):
                add(m[1], document, document, source)
            for m in re.finditer(r'''new\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)''', text):
                add(m[1], base, document, source)
            if re.search(r'''\b(?:fetch|import)\s*\(\s*[^\s"']''', text):
                report["unresolved"].append({"source": source, "reason": "computed fetch/import URL: inspect in browser"})
        elif text.strip():
            report["unresolved"].append({"source": source, "reason": "non-JavaScript inline data/import map not traversed"})

    while queue:
        url, document, source = queue.pop(0)
        try:
            target = local_file(root, url)
            name = target.relative_to(root).as_posix()
            key = (name, document)
            if key in visited:
                continue
            visited.add(key)
            files.add(name)
            suffix = target.suffix.lower()
            if suffix not in TEXT_TYPES:
                continue
            text = target.read_text(encoding="utf-8")
            # Directory URLs must keep their slash for relative resources.
            base = ORIGIN + "/" + quote(name, safe="/")
            if suffix in (".html", ".htm"):
                doc = Document(text, base)
                for ref in doc.refs:
                    add(ref, doc.base, doc.base, name)
                for kind, inline in doc.inline:
                    scan(inline, kind, doc.base, doc.base, name)
                report["unresolved"].extend({"source": name, "reason": note} for note in doc.notes)
            else:
                scan(text, "css" if suffix == ".css" else "js", base, document, name)
        except (OSError, ValueError) as exc:
            report["errors"].append({"source": source, "url": url, "reason": str(exc)})
    report["files"] = sorted(files)
    for field in ("errors", "external", "unresolved"):
        report[field] = list({json.dumps(row, sort_keys=True): row for row in report[field]}.values())
    report["status"] = "failed" if report["errors"] else "local-references-checked"
    return report


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, **MIME}

    def send_head(self):
        try:
            return super().send_head()
        except ValueError:
            self.send_error(403, "Forbidden resource path")
        except FileNotFoundError:
            self.send_error(404, "File not found")
        return None

    def translate_path(self, path):
        return str(local_file(Path(self.directory), path, redirect_directories=True))

    def list_directory(self, path):
        self.send_error(404, "No index.html in directory")
        return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def make_server(root, port=0):
    root = Path(root).resolve(strict=True)
    if not root.is_dir():
        raise ValueError("Artifact root must be a directory")
    return ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=str(root)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("audit", "serve"))
    parser.add_argument("root", type=Path, help="Actual delivered artifact directory")
    parser.add_argument("--entry", default="index.html", help="Root-relative HTML entry")
    parser.add_argument("--port", type=int, default=0, help="0 chooses a free port; occupied explicit ports fail")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("Port must be between 0 and 65535")
    try:
        report = audit(args.root, args.entry)
        if args.command == "audit":
            print(json.dumps(report, ensure_ascii=False, indent=2))
            return 1 if report["errors"] else 0
        root = Path(report["root"])
        local_file(root, "/" + quote(args.entry.lstrip("/"), safe="/"))
        with make_server(root, args.port) as server:
            port = server.server_address[1]
            print(json.dumps({"event": "ready", "pid": os.getpid(), "root": str(root), "port": port,
                              "url": f"http://127.0.0.1:{port}/" + quote(args.entry.lstrip("/"), safe="/"),
                              "audit": report}, ensure_ascii=False), flush=True)
            server.serve_forever()
    except KeyboardInterrupt:
        return 0
    except (OSError, ValueError) as exc:
        parser.exit(1, f"Artifact preview failed: {exc}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
