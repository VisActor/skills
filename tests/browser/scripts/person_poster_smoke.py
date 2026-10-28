"""Build fixed native-chart fixtures through an independently copied poster Skill."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
VCHART_URL = 'https://unpkg.com/@visactor/vchart@2.1.7/build/index.min.js'


def build_poster(case: dict, workspace: Path) -> None:
    inputs, output = workspace / 'inputs', workspace / 'outputs'
    skill = workspace / '.agents/skills/person-poster'
    config = json.loads((inputs / 'bundle.json').read_text())
    if config.get('buildEntry'):
        subprocess.run([sys.executable, str(skill / 'scripts/poster_workflow.py'), 'init',
                        '--bundle', str(output), '--width', '1200', '--height', str(config['height'])],
                       check=True, capture_output=True, text=True)
    if ('examples' in config) == ('specsFile' in config):
        raise ValueError('Choose exactly one of examples or specsFile')
    if 'specsFile' in config:
        source = (inputs / config['specsFile']).resolve()
        if not source.is_relative_to(inputs.resolve()):
            raise ValueError('Specs file must stay inside inputs')
        specs = json.loads(source.read_text())
        if not isinstance(specs, dict):
            raise ValueError('Specs file must contain an object')
    else:
        specs = {}
        for name in config['examples']:
            if not isinstance(name, str) or not re.fullmatch(r'[a-zA-Z0-9_-]+', name):
                raise ValueError('Example must be a filename stem')
            specs[name] = json.loads((skill / f'references/chart-examples/{name}.spec.json').read_text())
    charts, mounts = [], []
    mapping = json.loads((inputs / 'display-map.json').read_text())
    data = json.loads((inputs / 'data.json').read_text())
    for name in ['fact-review.json', 'source.txt', *config.get('sourceFiles', [])]:
        if not isinstance(name, str) or Path(name).name != name:
            raise ValueError('Source fixture names must be flat filenames')
        if (inputs / name).is_file():
            shutil.copy2(inputs / name, output / name)
    for name, spec in specs.items():
        if not isinstance(name, str) or not re.fullmatch(r'[a-zA-Z0-9_-]+', name):
            raise ValueError('Chart id must be a filename stem')
        relative = f'charts/{name}.spec.json'
        destination = output / relative
        destination.parent.mkdir(exist_ok=True)
        destination.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n')
        charts.append({'id': name, 'spec': relative, 'mount': f'#chart-{name}'})
        mounts.append(f'<section><h2 data-display-id="chart-title-{name}">{escape(name)}</h2><div data-required="{name}" '
                      f'data-chart-id="{name}" id="chart-{name}" class="chart"></div></section>')
        mapping['dom'].append({'id': f'chart-title-{name}', 'kind': 'label', 'text': name})
        # Fixed input specs are synthetic source data for this API smoke, not historical evidence.
        def datasets(value, prefix=''):
            if isinstance(value, dict):
                for key, child in value.items():
                    path = prefix + '/' + key.replace('~', '~0').replace('/', '~1')
                    if key == 'data':
                        entries = child if isinstance(child, list) else [child]
                        for i, entry in enumerate(entries):
                            if isinstance(entry, dict) and 'values' in entry:
                                yield path + (f'/{i}' if isinstance(child, list) else '') + '/values', entry['values']
                    yield from datasets(child, path)
            elif isinstance(value, list):
                for i, child in enumerate(value):
                    yield from datasets(child, prefix + f'/{i}')
        links = []
        for index, (path, values) in enumerate(datasets(spec)):
            key = f'{name}-{index}'
            data[key] = values
            links.append({'specPointer': path, 'dataPointer': '/' + key})
        mapping['charts'].append({'id': name, 'data': links})
    for name, value in [('data.json', data), ('display-map.json', mapping)]:
        (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
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
    html = html.replace('__RUNTIME__', '<script src="runtime.js"></script>' if charts and config.get('runtimeMode') != 'managed' else '')
    html = html.replace('__CHART_DATA__', json.dumps(specs, ensure_ascii=True).replace('<', '\\u003c'))
    html = html.replace('__HEIGHT__', str(config['height']))
    (output / 'index.html').write_text(html)
    manifest = {'displayBindings': 'display-map.json', 'title': 'Native chart smoke fixture', 'html': 'index.html', 'png': 'preview.png',
                'delivery': config.get('delivery', 'html+png'),
                'canvas': {'width': 1200, 'height': config['height']},
                'charts': charts, 'dependencies': dependencies, 'assets': [],
                'export': {'selector': '#infographic', 'width': 1200, 'height': config['height'],
                           'deviceScaleFactor': 2, 'viewport': {'width': 1200, 'height': config['height']}}}
    if manifest['delivery'] == 'html':
        manifest.pop('png')
    if config.get('buildEntry'):
        manifest['managedRuntime'] = True
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    if config.get('buildEntry'):
        subprocess.run([sys.executable, str(skill / 'scripts/poster_workflow.py'), 'preflight', '--bundle', str(output)], check=True, capture_output=True, text=True, timeout=120)
        result = subprocess.run([sys.executable, str(skill / 'scripts/poster_workflow.py'), 'build', '--bundle', str(output)],
                                capture_output=True, text=True, timeout=120)
        (workspace.parent / 'build-entry.log').write_text(result.stdout + result.stderr)
        if result.returncode:
            raise RuntimeError('Build entry fixture failed: ' + result.stdout + result.stderr)



def check_production_pipeline(workspace: Path, expected: dict) -> None:
    scripts = workspace / '.agents/skills/person-poster/scripts'
    output = workspace / 'outputs'
    manifest = json.loads((output / 'manifest.json').read_text())
    height = manifest['canvas']['height']
    diagnostic_png = output / 'draft/preview.png'
    export = [sys.executable, str(scripts / 'export_html_png.py'), '--html', str(output / 'index.html'),
              '--draft', '--serve', '--viewport-width', '1200', '--viewport-height', str(height),
              '--device-scale-factor', '2', '--output', str(diagnostic_png)]
    if expected.get('renderFailure'):
        result = subprocess.run(export + ['--timeout', '1500'], capture_output=True, text=True, timeout=30)
        (workspace.parent / 'expected-export-failure.log').write_text(result.stdout + result.stderr)
        if result.returncode == 0 or diagnostic_png.exists():
            raise RuntimeError('Failed chart rendering must not export a successful PNG')
        return
    review = [sys.executable, str(scripts / 'review_bundle.py'), '--bundle', str(output)]
    config = json.loads((workspace / 'inputs/bundle.json').read_text())
    if 'reviewDisplayWidth' in config:
        review.extend(['--display-width', str(config['reviewDisplayWidth'])])
    if config.get('workflowAction') == 'layout':
        preflight = subprocess.run([sys.executable, str(scripts / 'preflight.py'), '--output', str(output / 'preflight.json')], capture_output=True, text=True)
        if preflight.returncode:
            raise RuntimeError('Layout fixture preflight failed: ' + preflight.stderr)
        review = [sys.executable, str(scripts / 'poster_workflow.py'), 'layout', '--bundle', str(output)]
    directory = 'layout-review' if config.get('workflowAction') == 'layout' else 'review'
    if expected.get('technicalFailureContains'):
        result = subprocess.run(review, capture_output=True, text=True, timeout=120)
        (workspace.parent / 'expected-technical-failure.log').write_text(result.stdout + result.stderr)
        report = json.loads((output / directory / 'review.json').read_text())
        if result.returncode == 0 or report['technicalPassed'] or not all(
            any(text in error for error in report['errors']) for text in expected['technicalFailureContains']
        ) or (output / 'preview.png').exists():
            raise RuntimeError('Expected technical failure without a final PNG')
        return
    if expected.get('reviewFailureContains'):
        result = subprocess.run(review, capture_output=True, text=True, timeout=120)
        (workspace.parent / 'expected-review-failure.log').write_text(result.stdout + result.stderr)
        report = json.loads((output / directory / 'review.json').read_text())
        layout = json.loads((output / directory / 'layout-inspection.json').read_text())
        errors = layout.get('errors', [])
        if (result.returncode == 0 or report.get('technicalPassed') is not False
                or report.get('preExportValidation', {}).get('passed') is not True
                or layout.get('passed') is not False
                or not all(any(text in error for error in errors) for text in expected['reviewFailureContains'])
                or diagnostic_png.exists()):
            raise RuntimeError('Expected measured layout failure with no final PNG')
        return
    commands = [
        [sys.executable, str(scripts / 'preflight.py'), '--output', str(output / 'preflight.json')],
        review,
    ]
    if manifest.get('delivery', 'html+png') == 'html+png':
        commands.append(export)
    commands.append([sys.executable, str(scripts / 'validate_poster_bundle.py'), str(output), '--phase', 'pre-export'])
    for index, command in enumerate(commands):
        result = subprocess.run(command, capture_output=True, text=True, timeout=120)
        (workspace.parent / f'production-{index}.log').write_text(result.stdout + result.stderr)
        if command == review and expected.get('readingBaselinePassed') is False:
            report = json.loads((output / 'review/review.json').read_text())
            reading = report.get('readability', {})
            if (result.returncode != 1 or report.get('technicalPassed') is not False
                    or reading.get('passed') is not False or not reading.get('smallTextCount')
                    or reading.get('displayWidthCssPx') != 600 or reading.get('minFontSizeCssPx') != 12
                    or reading.get('unmeasured') != [] or not report.get('errors')
                    or any(not e.startswith('Reading text below 12px at 600px width:')
                           for e in report['errors'])):
                raise RuntimeError('API fixture expected only its recorded 600px reading failure')
            # Continue diagnostic API screenshots only; never certify failed output as delivery.
            continue
        if result.returncode:
            raise RuntimeError(f'Poster production step {index} failed: {result.stderr[-1000:]}')
    if diagnostic_png.exists() != expected['pngExpected']:
        raise RuntimeError('Diagnostic PNG existence differs from pngExpected')
    if expected['pngExpected']:
        from PIL import Image
        with Image.open(diagnostic_png) as image:
            if image.size != (2400, height * 2):
                raise RuntimeError(f'Wrong PNG dimensions: {image.size}')
