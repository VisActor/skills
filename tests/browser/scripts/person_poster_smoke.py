"""Build fixed native-chart fixtures through an independently copied poster Skill."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
VCHART_URL = 'https://unpkg.com/@visactor/vchart@2.1.7/build/index.min.js'


def build_poster(case: dict, workspace: Path) -> None:
    inputs, output = workspace / 'inputs', workspace / 'outputs'
    skill = workspace / '.agents/skills/person-poster'
    config = json.loads((inputs / 'bundle.json').read_text())
    specs, charts, mounts = {}, [], []
    for name in config['examples']:
        if not isinstance(name, str) or Path(name).name != name:
            raise ValueError('Example must be a filename stem')
        spec = json.loads((skill / f'references/chart-examples/{name}.spec.json').read_text())
        specs[name] = spec
        relative = f'charts/{name}.spec.json'
        destination = output / relative
        destination.parent.mkdir(exist_ok=True)
        destination.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n')
        charts.append({'id': name, 'spec': relative, 'mount': f'#chart-{name}'})
        mounts.append(f'<section><h2>{name}</h2><div data-required="{name}" '
                      f'data-chart-id="{name}" id="chart-{name}" class="chart"></div></section>')
    if config.get('emptyMount') and mounts:
        mounts[0] = mounts[0].replace('class="chart"', 'class="chart" style="width:0"')
    dependencies = []
    if charts:
        runtime = ROOT / 'tests/browser/node_modules/@visactor/vchart/build/index.min.js'
        shutil.copy2(runtime, output / 'runtime.js')
        dependencies.append({'name': '@visactor/vchart', 'file': 'runtime.js',
                             'version': '2.1.7', 'source': VCHART_URL})
    shutil.copy2(skill / 'scripts/render_charts.js', output / 'render_charts.js')
    html = (inputs / 'page.html').read_text()
    html = html.replace('__CHART_MOUNTS__', ''.join(mounts))
    html = html.replace('__RUNTIME__', '<script src="runtime.js"></script>' if charts else '')
    html = html.replace('__CHART_DATA__', json.dumps(specs, ensure_ascii=True).replace('<', '\\u003c'))
    html = html.replace('__HEIGHT__', str(config['height']))
    (output / 'index.html').write_text(html)
    manifest = {'title': 'Native chart smoke fixture', 'html': 'index.html', 'png': 'preview.png',
                'delivery': config.get('delivery', 'html+png'),
                'canvas': {'width': 1200, 'height': config['height']},
                'charts': charts, 'dependencies': dependencies, 'assets': [],
                'export': {'selector': '#infographic', 'width': 1200, 'height': config['height'],
                           'deviceScaleFactor': 2, 'viewport': {'width': 1200, 'height': config['height']}}}
    if manifest['delivery'] == 'html':
        manifest.pop('png')
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')


def check_production_pipeline(workspace: Path, expected: dict) -> None:
    scripts = workspace / '.agents/skills/person-poster/scripts'
    output = workspace / 'outputs'
    manifest = json.loads((output / 'manifest.json').read_text())
    height = manifest['canvas']['height']
    export = [sys.executable, str(scripts / 'export_html_png.py'), '--html', str(output / 'index.html'),
              '--serve', '--viewport-width', '1200', '--viewport-height', str(height),
              '--device-scale-factor', '2', '--output', str(output / 'preview.png')]
    if expected.get('renderFailure'):
        result = subprocess.run(export + ['--timeout', '1500'], capture_output=True, text=True, timeout=30)
        (workspace.parent / 'expected-export-failure.log').write_text(result.stdout + result.stderr)
        if result.returncode == 0 or (output / 'preview.png').exists():
            raise RuntimeError('Failed chart rendering must not export a successful PNG')
        return
    review = [sys.executable, str(scripts / 'review_bundle.py'), '--bundle', str(output)]
    if expected.get('reviewFailureContains'):
        result = subprocess.run(review, capture_output=True, text=True, timeout=120)
        (workspace.parent / 'expected-review-failure.log').write_text(result.stdout + result.stderr)
        report = json.loads((output / 'review/review.json').read_text())
        layout = json.loads((output / 'review/layout-inspection.json').read_text())
        errors = layout.get('errors', [])
        if (result.returncode == 0 or report.get('technicalPassed') is not False
                or report.get('preExportValidation', {}).get('passed') is not True
                or layout.get('passed') is not False
                or not all(any(text in error for error in errors) for text in expected['reviewFailureContains'])
                or (output / 'preview.png').exists()):
            raise RuntimeError('Expected measured layout failure with no final PNG')
        return
    commands = [
        [sys.executable, str(scripts / 'preflight.py'), '--output', str(output / 'preflight.json')],
        review,
    ]
    if manifest.get('delivery', 'html+png') == 'html+png':
        commands.append(export)
    commands.append([sys.executable, str(scripts / 'validate_poster_bundle.py'), str(output)])
    for index, command in enumerate(commands):
        result = subprocess.run(command, capture_output=True, text=True, timeout=120)
        (workspace.parent / f'production-{index}.log').write_text(result.stdout + result.stderr)
        if result.returncode:
            raise RuntimeError(f'Poster production step {index} failed: {result.stderr[-1000:]}')
    if (output / 'preview.png').exists() != expected['pngExpected']:
        raise RuntimeError('Final PNG existence differs from pngExpected')
    if expected['pngExpected']:
        from PIL import Image
        with Image.open(output / 'preview.png') as image:
            if image.size != (2400, height * 2):
                raise RuntimeError(f'Wrong PNG dimensions: {image.size}')
