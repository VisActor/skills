import hashlib
import json
import sys
from pathlib import Path

import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from diagnostic_preview import create_diagnostic_preview  # noqa: E402


def test_report_preserves_original_and_visible_label_after_rename(tmp_path):
    raw = tmp_path/'draft/preview.png'
    raw.parent.mkdir()
    Image.new('RGB',(1200,900),'blue').save(raw)
    before = raw.read_bytes()
    record = create_diagnostic_preview(tmp_path, raw)
    report = Image.open(tmp_path/record['file']).convert('RGB')
    assert raw.read_bytes() == before
    assert report.size[0] == 1200 and report.size[1] > 900
    original = Image.open(raw).convert('RGB')
    assert report.crop((0,record['bannerHeight'],1200,report.height)).tobytes() == original.tobytes()
    banner = report.crop((0,0,1200,record['bannerHeight']))
    assert len(banner.getcolors(banner.width*banner.height)) > 1
    renamed = tmp_path/'普通名称.png'
    renamed.write_bytes((tmp_path/record['file']).read_bytes())
    assert hashlib.sha256(renamed.read_bytes()).hexdigest() == record['sha256']
    Image.new('RGB',(1200,900),'red').save(raw)
    changed = create_diagnostic_preview(tmp_path, raw)
    assert changed['rawSha256'] != record['rawSha256']
    assert json.loads((tmp_path/'draft/diagnostic-preview.json').read_text()) == changed


def test_diagnostic_cannot_read_outside_bundle(tmp_path):
    with pytest.raises(ValueError):
        create_diagnostic_preview(tmp_path, tmp_path.parent/'outside.png')
