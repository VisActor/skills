import platform
import shutil
import subprocess
import sys
from pathlib import Path

import pytest


@pytest.fixture(scope='module')
def foreground_binary(tmp_path_factory):
    if sys.platform != 'darwin' or not shutil.which('swiftc'):
        pytest.skip('Optional adapter CLI checks require macOS and Swift')
    if int(platform.mac_ver()[0].split('.')[0]) < 14:
        pytest.skip('Optional adapter requires macOS 14+')
    source = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts/macos_foreground.swift'
    binary = tmp_path_factory.mktemp('swift-adapter') / 'foreground'
    subprocess.run(['swiftc', str(source), '-o', str(binary)], check=True, capture_output=True, timeout=120)
    return binary


@pytest.mark.parametrize('prefix', [
    [], ['--'], ['--', '--'],
    ['-frontend', '-interpret', 'script.swift', '--'],
    ['-frontend', '-interpret', 'script.swift', '--', '--'],
])
def test_argument_routes_reach_image_validation(foreground_binary, tmp_path, prefix):
    output = tmp_path / 'new output'
    result = subprocess.run([str(foreground_binary), *prefix, str(tmp_path / 'missing photo.jpg'), str(output)],
                            capture_output=True, text=True, timeout=10)
    assert result.returncode == 1
    assert 'Input image is unreadable' in result.stderr
    assert not output.exists()


def test_adapter_preserves_nonempty_output(foreground_binary, tmp_path):
    output = tmp_path / 'existing'
    output.mkdir()
    marker = output / 'keep.txt'
    marker.write_text('keep this evidence')
    result = subprocess.run([str(foreground_binary), '--', 'missing.jpg', str(output)],
                            capture_output=True, text=True, timeout=10)
    assert result.returncode == 1 and 'not empty' in result.stderr
    assert marker.read_text() == 'keep this evidence'


@pytest.mark.parametrize('arguments', [
    ['--', 'one', 'two', 'three'],
    ['--', 'unexpected', '--', 'one', 'two'],
])
def test_adapter_rejects_extra_arguments(foreground_binary, arguments):
    result = subprocess.run([str(foreground_binary), *arguments],
                            capture_output=True, text=True, timeout=10)
    assert result.returncode == 1 and 'Usage:' in result.stderr
