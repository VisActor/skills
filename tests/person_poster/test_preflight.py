import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'


@pytest.fixture
def preflight():
    spec = importlib.util.spec_from_file_location('poster_preflight', SCRIPTS / 'preflight.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_driver_probe_uses_selected_python_and_bounds_output(preflight, monkeypatch):
    calls = []

    def run(command, **kwargs):
        calls.append((command, kwargs))
        return SimpleNamespace(returncode=1, stdout='', stderr='driver-path-error\n' + 'x' * 9000)

    monkeypatch.setattr(preflight.subprocess, 'run', run)
    monkeypatch.setattr(preflight.sys, 'executable', '/selected environment/python')
    result = preflight.probe_driver()
    assert calls[0][0] == ['/selected environment/python', '-m', 'playwright', '--version']
    assert calls[0][1]['timeout'] == 15
    assert calls[0][1].get('shell', False) is False
    assert not result['passed'] and result['returncode'] == 1
    assert result['stderr'].startswith('driver-path-error')
    assert len(result['stderr']) <= 4200
    assert result['outputTruncated']


@pytest.mark.parametrize('error', [
    subprocess.TimeoutExpired(['python'], 15, stderr=b'partial\xff'),
    OSError('cannot start selected interpreter'),
])
def test_driver_probe_failure_is_reported(preflight, monkeypatch, error):
    def run(*args, **kwargs):
        raise error

    monkeypatch.setattr(preflight.subprocess, 'run', run)
    result = preflight.probe_driver()
    assert not result['passed']
    assert result['error']
    if isinstance(error, subprocess.TimeoutExpired):
        assert result['timedOut']
        assert 'partial' in result['stderr']
    json.dumps(result)


@pytest.mark.parametrize('failure,cli_passed', [
    ('dependencies', False), ('driver-startup', False), ('driver-startup', True),
    ('browser-launch', False), ('font-probe', False),
])
def test_preflight_reports_actual_failure_stage(preflight, monkeypatch, tmp_path, failure, cli_passed):
    output = tmp_path / 'preflight.json'
    monkeypatch.setattr(sys, 'argv', ['preflight.py', '--output', str(output)])
    monkeypatch.setattr(preflight, 'version', lambda name: '1.0')

    def import_module(name):
        if failure == 'dependencies':
            raise ImportError('dependency missing')
        return SimpleNamespace()

    class Driver:
        def __enter__(self):
            if failure == 'driver-startup':
                raise RuntimeError('Connection closed while reading from the driver')
            return SimpleNamespace(chromium=SimpleNamespace(launch=self.launch))

        def launch(self, **kwargs):
            if failure == 'browser-launch':
                raise RuntimeError("Executable doesn't exist")
            return SimpleNamespace(new_page=self.new_page, close=lambda: closed.append(True))

        def new_page(self, **kwargs):
            raise RuntimeError('font sample failed')

        def __exit__(self, *args):
            return False

    probes = []
    closed = []
    monkeypatch.setattr(preflight.importlib, 'import_module', import_module)
    monkeypatch.setitem(sys.modules, 'playwright.sync_api', SimpleNamespace(sync_playwright=Driver))
    monkeypatch.setattr(preflight, 'probe_driver', lambda: probes.append(True) or {'passed': cli_passed})
    assert preflight.main() == 1
    report = json.loads(output.read_text())
    assert report['failureStage'] == failure
    assert not report['passed'] and report['fontSample'] is None
    assert len(probes) == (1 if failure == 'driver-startup' else 0)
    assert ('isolated' in report['nextAction']) == (failure == 'driver-startup')
    assert len(closed) == (1 if failure == 'font-probe' else 0)
