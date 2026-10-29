import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from init_bundle import initialize_bundle  # noqa: E402


def test_init_after_preflight_and_refuse_existing_inputs(tmp_path):
    (tmp_path / 'preflight.json').write_text('{"passed":true}')
    initialize_bundle(tmp_path, width=800, height=1200)
    m = json.loads((tmp_path / 'manifest.json').read_text())
    assert m['canvas'] == {'width': 800, 'height': 1200}
    assert m['export']['selector'] == '#infographic'
    assert json.loads((tmp_path / 'fact-review.json').read_text())['status'] == 'pending'
    before = {p.name: p.read_bytes() for p in tmp_path.iterdir() if p.is_file()}
    with pytest.raises(ValueError, match='existing'):
        initialize_bundle(tmp_path, width=600, height=400)
    assert before == {p.name: p.read_bytes() for p in tmp_path.iterdir() if p.is_file()}


@pytest.mark.parametrize('width', [True, 0, -1, 1.5])
def test_init_rejects_invalid_dimensions(tmp_path, width):
    with pytest.raises(ValueError):
        initialize_bundle(tmp_path, width=width, height=400)
    assert not list(tmp_path.iterdir())
