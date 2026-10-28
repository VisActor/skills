import sys
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from browser_runtime import browser_launch_options, load_page  # noqa: E402


@pytest.mark.parametrize(('body', 'error'), [
    ('<script>window.__INFOGRAPHIC_READY__=true;</script>', None),
    ('<script>const broken = ;</script>', 'SyntaxError'),
    ('<script src="file:///missing-poster-script.js"></script>', 'requestfailed'),
    ('<script>throw new Error("poster test error")</script>', 'poster test error'),
])
def test_actual_page_errors_are_diagnostic(tmp_path, body, error):
    source = tmp_path / 'index.html'
    source.write_text(body)
    with sync_playwright() as p:
        browser = p.chromium.launch(**browser_launch_options())
        try:
            page = browser.new_page()
            if error:
                with pytest.raises(RuntimeError, match=error) as caught:
                    load_page(page, source.as_uri(), ready_expression='window.__INFOGRAPHIC_READY__ === true', timeout_ms=2000)
                assert 'pageDiagnostics' in str(caught.value) and 'index.html' in str(caught.value)
            else:
                assert load_page(page, source.as_uri(), ready_expression='window.__INFOGRAPHIC_READY__ === true').report()['stage'] == 'ready'
        finally:
            browser.close()
