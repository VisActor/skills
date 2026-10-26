import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / "skills/person-poster/scripts"


@pytest.fixture
def poster_validator(monkeypatch):
    monkeypatch.syspath_prepend(str(SCRIPTS))
    # Other Skills have helpers with the same basename; keep imports isolated.
    names = ["validate_bundle", "validate_poster_bundle"]
    previous = {name: sys.modules.pop(name, None) for name in names}
    spec = importlib.util.spec_from_file_location(
        "validate_poster_bundle", SCRIPTS / "validate_poster_bundle.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    yield module
    for name in names:
        sys.modules.pop(name, None)
        if previous[name] is not None:
            sys.modules[name] = previous[name]


@pytest.fixture
def poster_layout(monkeypatch):
    monkeypatch.syspath_prepend(str(SCRIPTS))
    names = ['export_html_png', 'inspect_html_layout']
    previous = {name: sys.modules.pop(name, None) for name in names}
    try:
        yield __import__('inspect_html_layout')
    finally:
        for name in names:
            sys.modules.pop(name, None)
            if previous[name] is not None:
                sys.modules[name] = previous[name]


@pytest.fixture
def poster_dimensions():
    spec = importlib.util.spec_from_file_location('poster_dimensions', SCRIPTS / 'sync_manifest_dimensions.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def inspect_page(tmp_path, poster_layout):
    def inspect(html):
        path = tmp_path / 'index.html'
        path.write_text(html, encoding='utf-8')
        return poster_layout.inspect_layout(SimpleNamespace(
            html=str(path), manifest=None, selector='#infographic', serve=False,
            screenshot_mode=False, install_playwright=False, install_browser=False,
            viewport_width=1200, viewport_height=1000, device_scale_factor=1,
            wait_until='load', timeout=10000, settle_ms=0, ready_expression='',
            required_selector='[data-required]', decorative_selector='[data-decorative]',
            bottom_safe_px=64, footer_safe_px=96, min_overlap_area=24, overflow_tolerance=3))
    return inspect
