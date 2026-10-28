import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from sync_display import sync_display  # noqa: E402


def fixture(root, content='<div id="count">wrong</div>', kind='value'):
    (root / 'index.html').write_text('<!doctype html><html><body>'+content+'</body></html>')
    entry = {'id': 'count', 'kind': kind, 'dataPointer': '/count', 'format': {'style': 'text'}, 'factIds': ['fact']}
    for name, data in {'manifest.json': {'html': 'index.html', 'displayBindings': 'display-map.json', 'charts': []},
                       'data.json': {'count': '<12 & 3>'},
                       'display-map.json': {'version': 1, 'dom': [entry], 'charts': []}}.items():
        (root / name).write_text(json.dumps(data))


def test_preview_apply_idempotence_and_escaping(tmp_path):
    fixture(tmp_path)
    before = (tmp_path / 'index.html').read_bytes()
    assert sync_display(tmp_path)['changed']
    assert (tmp_path / 'index.html').read_bytes() == before
    assert sync_display(tmp_path, apply=True)['applied']
    text = (tmp_path / 'index.html').read_text()
    assert 'data-display-id="count"' in text and '&lt;12 &amp; 3&gt;' in text
    assert not sync_display(tmp_path, apply=True)['changed']


@pytest.mark.parametrize('content', ['<div>wrong</div>', '<div id="count"><span>wrong</span></div>',
    '<div id="count">one</div><div id="count">two</div>', '<div id="count" data-display-id="other">wrong</div>'])
def test_invalid_targets_do_not_write(tmp_path, content):
    fixture(tmp_path, content)
    before = (tmp_path / 'index.html').read_bytes()
    with pytest.raises(ValueError):
        sync_display(tmp_path, apply=True)
    assert (tmp_path / 'index.html').read_bytes() == before


def test_claim_requires_evidence_before_writing(tmp_path):
    fixture(tmp_path, kind='claim')
    before = (tmp_path / 'index.html').read_bytes()
    with pytest.raises(ValueError):
        sync_display(tmp_path, apply=True)
    assert (tmp_path / 'index.html').read_bytes() == before


def test_unrelated_svg_and_script_are_preserved(tmp_path):
    fragment = '<svg><path d="M0 0 L2 3"/></svg><script>const n = "<tag>";</script>'
    fixture(tmp_path, fragment + '<div id="count">old</div>')
    sync_display(tmp_path, apply=True)
    assert fragment in (tmp_path / 'index.html').read_text()
