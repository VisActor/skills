"""Output-contract tests for the portable preview tool; no story-specific expectations."""

import importlib.util
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("preview", ROOT / "skills/unit-data-storytelling/scripts/preview.py")
preview = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(preview)


class PreviewTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def put(self, name, text=""):
        target = self.root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text)

    def test_follows_html_css_and_modules_with_distinct_fetch_base(self):
        self.put("index.html", '<script type="module" src="js/app.mjs"></script><link rel="stylesheet" href="css/site.css">')
        self.put("js/app.mjs", "import {x} from './motion.mjs'; fetch('data.json'); new URL('../image.svg', import.meta.url);")
        self.put("js/motion.mjs", "export const x=1;")
        self.put("css/site.css", "a {background:url('../image.svg')}")
        self.put("data.json", "{}")
        self.put("image.svg", "<svg/>")
        result = preview.audit(self.root)
        self.assertEqual((result["errors"], len(result["files"])), ([], 6))

    def test_reports_missing_files_with_referring_source(self):
        self.put("index.html", '<img src="missing.webp?v=2#fragment">')
        self.assertEqual(preview.audit(self.root)["errors"][0]["source"], "index.html")

    def test_does_not_claim_to_validate_remote_or_dynamic_resources(self):
        self.put("index.html", '<script src="https://example.com/x.js"></script><script>fetch(path); import("d3");</script>')
        r = preview.audit(self.root)
        self.assertEqual((len(r["external"]), len(r["unresolved"]), r["errors"]), (1, 2, []))

    def test_ignores_fragment_data_urls_and_commented_imports(self):
        self.put("index.html", '<a href="#topic">jump</a><img src="data:image/png;base64,abc"><script>// import x from "./gone.js";\nconst x="https://example.com";</script>')
        self.assertEqual(preview.audit(self.root)["errors"], [])

    def test_resolves_directory_entries_and_base_href(self):
        self.put("index.html", '<a href="article/">read</a>')
        self.put("article/index.html", '<base href="/assets/"><img src="photo.png">')
        self.put("assets/photo.png")
        self.assertIn("assets/photo.png", preview.audit(self.root)["files"])

    def test_external_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as outside:
            secret = Path(outside) / "private.txt"
            secret.write_text("private")
            (self.root / "link.txt").symlink_to(secret)
            self.put("index.html", '<a href="link.txt">escape</a>')
            self.assertIn("escapes", preview.audit(self.root)["errors"][0]["reason"])

    def start(self):
        server = preview.make_server(self.root)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        def close():
            server.shutdown()
            server.server_close()
            thread.join()
        self.addCleanup(close)
        return f"http://127.0.0.1:{server.server_address[1]}", server.server_address[1]

    def test_http_serves_modules_and_data_with_correct_mime(self):
        self.put("app.mjs", "export const a=1;")
        self.put("rows.csv", "a,b\n1,2\n")
        base, _ = self.start()
        for name, expected in [("app.mjs", "text/javascript"), ("rows.csv", "text/csv")]:
            with urllib.request.urlopen(base + "/" + name) as response:
                self.assertEqual(response.headers.get_content_type(), expected)

    def test_missing_resource_is_404_not_fallback_html(self):
        self.put("index.html", "exists")
        base, _ = self.start()
        with self.assertRaises(urllib.error.HTTPError) as failure:
            urllib.request.urlopen(base + "/missing.js")
        self.assertEqual(failure.exception.code, 404)

    def test_occupied_port_fails_without_replacing_server(self):
        _, port = self.start()
        with self.assertRaises(OSError):
            preview.make_server(self.root, port)

    def test_http_blocks_encoded_escape_and_symlinks(self):
        (self.root / "outside").symlink_to(self.root.parent)
        base, _ = self.start()
        for target in ["/%2e%2e/private.txt", "/outside/private.txt"]:
            with self.assertRaises(urllib.error.HTTPError) as failure:
                urllib.request.urlopen(base + target)
            self.assertEqual(failure.exception.code, 403)


if __name__ == "__main__":
    unittest.main()
