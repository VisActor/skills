#!/usr/bin/env python3
"""Run poster tools with a verified interpreter, real command timings and delivery gates."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from build_display import build_display
from bundle_contract import check_build_inputs
from delivery_policy import (
    DELIVERY_VERSION,
    check_exportable,
    checked_review,
    delivery_fingerprint,
    delivery_handoff,
    delivery_package,
    delivery_status,
    usage_errors,
)
from init_bundle import initialize_bundle
from review_fingerprint import fingerprint
from validate_poster_bundle import validate_bundle
from verify_evidence import read_local, verify_evidence

SCRIPTS = Path(__file__).resolve().parent
ACTIONS = ('init', 'preflight', 'data', 'facts', 'build', 'layout', 'review', 'draft', 'export', 'verify', 'status', 'handoff', 'finish')


def save(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def run_tool(root: Path, name: str, command: list[str], timeout_seconds: float | None = None) -> int:
    start = datetime.now(timezone.utc).isoformat()
    limit = timeout_seconds if timeout_seconds is not None else (600 if name.startswith('install-') else 180)
    code, timed_out = 1, False
    log_dir = root / 'tool-logs'
    log_dir.mkdir(exist_ok=True)
    log_path = log_dir / (name + '-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f') + '.log')
    try:
        with log_path.open('w', encoding='utf-8') as output:
            process = subprocess.Popen(command, stdout=output, stderr=subprocess.STDOUT,
                                       start_new_session=os.name == 'posix')
            try:
                code = process.wait(timeout=limit)
            except subprocess.TimeoutExpired:
                timed_out, code = True, 124
                if os.name == 'posix':
                    os.killpg(process.pid, signal.SIGKILL)
                else:
                    process.kill()
                process.wait()
                output.write(f'\nTool timed out after {limit} seconds; no successful completion.\n')
        print(log_path.read_text(encoding='utf-8', errors='replace')[-16000:], end='')
        return code
    finally:
        end = datetime.now(timezone.utc).isoformat()
        path = root / 'tool-timings.json'
        record = read_local(root, path.name) if path.exists() else {'status': 'partial', 'commands': []}
        record['commands'].append({'name': name, 'command': command, 'startedAt': start,
                                   'endedAt': end, 'exitCode': code, 'timedOut': timed_out,
                                   'timeoutSeconds': limit, 'log': str(log_path.relative_to(root))})
        save(path, record)


def prepare(root: Path, python: str, bootstrap: bool) -> int:
    command = [python, str(SCRIPTS / 'preflight.py'), '--output', str(root / 'preflight.json')]
    code = run_tool(root, 'preflight', command)
    if code == 0 or not bootstrap:
        return code
    if code == 124:
        return code
    report = read_local(root, 'preflight.json')
    phase = report.get('failureStage')
    recoverable = phase in ('dependencies', 'driver-startup') or (
        phase == 'browser-launch' and any("Executable doesn't exist" in e for e in report.get('errors', [])))
    if not recoverable:
        return code
    shutil.copyfile(root / 'preflight.json', root / 'preflight.initial.json')
    env = Path(tempfile.mkdtemp(prefix='.person-poster-env-', dir=root.parent))
    env_python = env / ('Scripts/python.exe' if sys.platform == 'win32' else 'bin/python')
    steps = [('create-environment', [python, '-m', 'venv', str(env)]),
             ('install-dependencies', [str(env_python), '-m', 'pip', 'install', '-r', str(SCRIPTS / 'requirements.txt')]),
             ('install-browser', [str(env_python), '-m', 'playwright', 'install', 'chromium']),
             ('preflight-recovery', [str(env_python), *command[1:]])]
    for name, cmd in steps:
        code = run_tool(root, name, cmd)
        if code:
            return code
    return 0


def checked_python(root: Path) -> str:
    report = read_local(root, 'preflight.json')
    if report.get('passed') is not True:
        raise ValueError('Preflight failed: recover the environment before review/export; unfinished output is a draft')
    python = report['python']['executable']
    if not Path(python).is_file():
        raise ValueError('Verified interpreter no longer exists; rerun preflight')
    return python


def check_facts(root: Path) -> int:
    try:
        report = verify_evidence(root)
        if read_local(root, 'fact-review.json').get('status') != 'passed':
            report['errors'].append('fact-review.status must be passed; inspect source truth and scope first')
            report['passed'] = False
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        report = {'passed': False, 'errors': [str(error)]}
    save(root / 'evidence-check.json', report)
    print(json.dumps(report, ensure_ascii=False))
    return 0 if report['passed'] else 1


def render_draft(root: Path) -> int:
    python = checked_python(root)
    manifest = read_local(root, 'manifest.json')
    canvas, export = manifest['canvas'], manifest.get('export', {})
    code = run_tool(root, 'draft', [python, str(SCRIPTS / 'export_html_png.py'),
        '--bundle', str(root), '--html', str(root / manifest['html']), '--serve', '--draft',
        '--selector', export.get('selector', '#infographic'),
        '--viewport-width', str(canvas['width']), '--viewport-height', str(canvas['height']),
        '--device-scale-factor', '2', '--output', str(root / 'draft/preview.png')])
    if code == 0:
        code = run_tool(root, 'diagnostic-report', [python, str(SCRIPTS / 'diagnostic_preview.py'), '--bundle', str(root)])
    return code


def save_handoff(root: Path) -> dict:
    state = delivery_handoff(root)
    lines = [state['summary'], '', state['nextAction'], '', '文件：']
    lines.extend(f"- {item['label']}：{item['file']}" for item in state['artifacts'])
    save_path = root / 'delivery-summary.md'
    save_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return state


def verify_ready(root: Path) -> list[str]:
    checked_python(root)
    checked_review(root)
    result = validate_bundle(root, require_records=True)
    errors = list(result.errors)
    facts = verify_evidence(root)
    save(root / 'evidence-check.json', facts)
    errors.extend(facts['errors'])
    acceptance = read_local(root, 'acceptance.json')
    for dimension in ('technical', 'factual', 'visual'):
        if not isinstance(acceptance.get(dimension), dict) or acceptance[dimension].get('status') != 'passed':
            errors.append(f'{dimension}.status must be passed for ready delivery')
    if read_local(root, 'fact-review.json').get('status') != 'passed':
        errors.append('fact-review.status must be passed for ready delivery')
    manifest = read_local(root, 'manifest.json')
    errors.extend(usage_errors(root, manifest, acceptance))
    if manifest.get('delivery') != 'html':
        export = read_local(root, 'export-check.json')
        png = (root / manifest.get('png', 'preview.png')).resolve()
        if not png.is_relative_to(root.resolve()) or not png.is_file():
            errors.append('Final PNG is missing or outside bundle')
        elif (export.get('passed') is not True or export.get('sourceFingerprint') != fingerprint(root)
              or export.get('pngSha256') != hashlib.sha256(png.read_bytes()).hexdigest()):
            errors.append('Final PNG does not match the successful export receipt; rerun export')
    return errors


def _execute(root: Path, action: str, *, python: str = sys.executable, bootstrap: bool = False, width: int | None = None, height: int | None = None) -> int:
    if action == 'init':
        print(json.dumps(initialize_bundle(root, width=width, height=height), ensure_ascii=False))
        return 0
    if action == 'finish':
        try:
            code = execute(root, 'verify')
        except (OSError, ValueError, KeyError, IndexError, TypeError):
            code = 1
        if code and (root / 'draft/preview.png').is_file():
            try:
                run_tool(root, 'diagnostic-report', [checked_python(root), str(SCRIPTS / 'diagnostic_preview.py'), '--bundle', str(root)])
            except (OSError, ValueError) as error:
                print(f'Diagnostic report unavailable: {error}; provide text diagnostics only', file=sys.stderr)
        package = delivery_package(root)
        save(root / 'delivery-package.json', {k: v for k, v in package.items() if k != 'reply'})
        (root / 'delivery-reply.md').write_text(package['reply'], encoding='utf-8')
        print(json.dumps(package, ensure_ascii=False))
        return code
    if action in ('status', 'handoff'):
        state = save_handoff(root) if action == 'handoff' else delivery_status(root)
        print(json.dumps(state, ensure_ascii=False))
        return 0 if state['status'] == 'ready' else 1
    if action == 'draft':
        return render_draft(root)
    root.mkdir(parents=True, exist_ok=True)
    if not (root / 'workflow-timings.json').exists():
        save(root / 'workflow-timings.json', {'status': 'partial', 'stages': [],
             'limitations': ['Research/layout times not inferred. Actual tool calls are recorded in tool-timings.json.']})
    save(root / 'delivery-check.json', {'passed': False, 'errors': [f'{action} started; final verification required']})
    if action == 'data':
        from source_evidence import materialize_data
        print(json.dumps(materialize_data(root), ensure_ascii=False))
        return check_facts(root)
    if action == 'facts':
        return check_facts(root)
    if action == 'build':
        report = {**check_build_inputs(root), 'phase': 'inputs', 'buildPassed': False,
                  'layoutPassed': False, 'changedFiles': []}
        save(root / 'build-check.json', report)
        if not report['passed']:
            return 1
        if check_facts(root):
            report.update(passed=False, phase='facts', errors=read_local(root, 'evidence-check.json')['errors'])
            save(root / 'build-check.json', report)
            return 1
        try:
            checked_python(root)
            built = build_display(root)
        except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
            report.update(passed=False, phase='generate', errors=[str(error)])
            save(root / 'build-check.json', report)
            return 1
        report.update(built, phase='layout', buildPassed=True)
        save(root / 'build-check.json', report)
        code = _execute(root, 'layout')
        errors = read_local(root, 'layout-review/review.json').get('errors', []) if (root / 'layout-review/review.json').exists() else ['Layout did not finish; see tool log']
        report.update(passed=code == 0, layoutPassed=code == 0, errors=errors,
                      nextAction='Review rendered output.' if code == 0 else 'Build completed; repair layout/reading failures and rerun. Do not replace payload or bypass export.')
        save(root / 'build-check.json', report)
        return code
    if action == 'preflight':
        return prepare(root, python, bootstrap)
    if action == 'export':
        save(root / 'export-check.json', {'passed': False, 'errors': ['Export not completed']})
    python = checked_python(root)
    if action in ('review', 'layout'):
        command = [python, str(SCRIPTS / 'review_bundle.py'), '--bundle', str(root)]
        if action == 'layout':
            command.extend(['--output-dir', str(root / 'layout-review')])
        return run_tool(root, action, command)
    if action == 'export':
        errors = check_exportable(root)
        if errors:
            raise ValueError('; '.join(errors))
        facts = verify_evidence(root)
        save(root / 'evidence-check.json', facts)
        if not facts['passed']:
            raise ValueError('Source comparison failed; see evidence-check.json')
        manifest = read_local(root, 'manifest.json')
        if manifest.get('delivery') == 'html':
            return 0
        canvas, export = manifest['canvas'], manifest.get('export', {})
        save(root / 'export-check.json', {'passed': False, 'errors': ['Export not completed']})
        code = run_tool(root, 'export', [python, str(SCRIPTS / 'export_html_png.py'),
             '--bundle', str(root), '--html', str(root / manifest['html']), '--serve', '--selector', export.get('selector', '#infographic'),
             '--viewport-width', str(canvas['width']), '--viewport-height', str(canvas['height']),
             '--device-scale-factor', '2', '--output', str(root / manifest.get('png', 'preview.png'))])
        if code == 0:
            png = root / manifest.get('png', 'preview.png')
            save(root / 'export-check.json', {'passed': True, 'sourceFingerprint': fingerprint(root),
                 'pngSha256': hashlib.sha256(png.read_bytes()).hexdigest()})
        return code
    save(root / 'delivery-check.json', {'passed': False, 'errors': ['Verification not completed']})
    try:
        errors = verify_ready(root)
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        save(root / 'delivery-check.json', {'passed': False, 'errors': [str(error)]})
        raise
    save(root / 'delivery-check.json', {'passed': not errors, 'errors': errors, 'contractVersion': DELIVERY_VERSION,
         'deliveryFingerprint': delivery_fingerprint(root) if not errors else None,
         'scope': 'Reproducible gates plus recorded judgments; source truth and visual quality still need independent review.'})
    if errors:
        raise ValueError('; '.join(errors))
    print('Delivery gates passed; retain source and visual evidence with the bundle')
    return 0


def execute(root: Path, action: str, *, python: str = sys.executable, bootstrap: bool = False, width: int | None = None, height: int | None = None) -> int:
    if action not in ACTIONS:
        raise ValueError(f'Unknown workflow action: {action}')
    try:
        code = _execute(root, action, python=python, bootstrap=bootstrap, width=width, height=height)
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        if action not in ('status', 'handoff', 'draft'):
            root.mkdir(parents=True, exist_ok=True)
            save(root / 'delivery-check.json', {'passed': False, 'errors': [str(error)], 'action': action})
        raise
    if code and action not in ('status', 'handoff', 'draft', 'finish'):
        report_name = {'preflight': 'preflight.json', 'layout': 'layout-review/review.json',
                       'review': 'review/review.json', 'export': 'export-check.json',
                       'verify': 'delivery-check.json', 'facts': 'evidence-check.json', 'data': 'evidence-check.json',
                       'init': 'delivery-check.json', 'build': 'build-check.json'}[action]
        errors = [f'{action} exited {code}; see {report_name} and tool-timings.json']
        try:
            report = read_local(root, report_name)
            if code != 124:
                errors = report.get('errors') or errors
        except (OSError, ValueError, TypeError):
            pass
        save(root / 'delivery-check.json', {'passed': False, 'errors': errors,
                                          'action': action, 'report': report_name, 'exitCode': code})
    return code


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=ACTIONS)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--width', type=int, help='CSS width for new init only')
    parser.add_argument('--height', type=int, help='CSS height for new init only')
    parser.add_argument('--python', default=sys.executable, help='Interpreter to try for preflight')
    parser.add_argument('--prepare-env', action='store_true', help='Allow one task-local venv recovery with package/browser installation')
    args = parser.parse_args()
    try:
        return execute(args.bundle.resolve(), args.action, python=args.python, bootstrap=args.prepare_env, width=args.width, height=args.height)
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        print(f'Workflow blocked: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
