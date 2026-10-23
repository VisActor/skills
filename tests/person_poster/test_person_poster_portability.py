import json
import shutil
import subprocess
import sys
from pathlib import Path

from test_bundle import write_bundle


def test_copied_skill_runs_outside_checkout(tmp_path):
    source = Path(__file__).resolve().parents[2] / 'skills/person-poster'
    installed = tmp_path / 'installed skill'
    shutil.copytree(source, installed, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    bundle = tmp_path / 'user project'
    bundle.mkdir()
    write_bundle(bundle)
    command = [sys.executable, str(installed / 'scripts/validate_poster_bundle.py'),
               str(bundle), '--phase', 'pre-export']
    result = subprocess.run(command, cwd=tmp_path, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    manifest = json.loads((bundle / 'manifest.json').read_text())
    manifest['delivery'] = 'html'
    manifest.pop('png')
    (bundle / 'manifest.json').write_text(json.dumps(manifest))
    result = subprocess.run(command[:-2], cwd=tmp_path, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    for script in installed.glob('scripts/*.py'):
        result = subprocess.run([sys.executable, str(script), '--help'],
                                cwd=tmp_path, capture_output=True, text=True)
        assert result.returncode == 0, (script.name, result.stderr)
