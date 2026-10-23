import sys
from pathlib import Path
from types import SimpleNamespace

import pytest


@pytest.mark.parametrize('override', [None, 'playwright==1.61.0'])
def test_optional_install_uses_selected_python_and_declared_range(poster_layout, monkeypatch, override):
    exporter = sys.modules['export_html_png']
    commands = []
    monkeypatch.setattr(exporter, 'run_command', lambda command, description: commands.append(command))
    monkeypatch.setattr(exporter.sys, 'executable', '/selected environment/python')
    declared = (Path(exporter.__file__).parent / 'requirements.txt').read_text().splitlines()
    assert exporter.DEFAULT_PLAYWRIGHT_PACKAGE in declared
    package = override or exporter.DEFAULT_PLAYWRIGHT_PACKAGE
    exporter.install_playwright_package(SimpleNamespace(pip_user=False, playwright_package=package))
    assert commands == [['/selected environment/python', '-m', 'pip', 'install', package]]


@pytest.mark.parametrize('script', ['export_html_png', 'inspect_html_layout'])
def test_cli_install_default_is_bounded(poster_layout, monkeypatch, script):
    import argparse
    import runpy

    exporter = sys.modules['export_html_png']
    captured = []
    path = Path(poster_layout.__file__).with_name(script + '.py')
    parse_args = argparse.ArgumentParser.parse_args

    # Exercise real defaults, then stop before installation or browser launch.
    def capture(parser, *args, **kwargs):
        captured.append(parse_args(parser, *args, **kwargs))
        raise StopIteration

    monkeypatch.setattr(argparse.ArgumentParser, 'parse_args', capture)
    monkeypatch.setattr(sys, 'argv', [str(path), '--html', 'poster.html', '--install-playwright'])
    if script == 'export_html_png':
        sys.argv += ['--output', 'preview.png']
    with pytest.raises(StopIteration):
        runpy.run_path(str(path), run_name='__main__')
    assert captured[0].playwright_package == exporter.DEFAULT_PLAYWRIGHT_PACKAGE
