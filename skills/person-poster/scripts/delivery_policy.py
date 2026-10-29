"""Shared production-export checks and read-only delivery state.

These checks are consistency gates, not an authorization or source-truth oracle.
"""
from __future__ import annotations

import hashlib
import struct
from pathlib import Path

from display_contract import DISPLAY_VERSION
from inspect_contrast import CONTRAST_POLICY
from inspect_html_layout import VISIBILITY_POLICY
from inspect_readability import READING_POLICY
from material_policy import material_errors
from review_fingerprint import fingerprint
from verify_evidence import read_local, verify_evidence

DELIVERY_VERSION = 5


def checked_review(root: Path) -> dict:
    report = read_local(root, 'review/review.json')
    if report.get('technicalPassed') is not True or report.get('errors') != []:
        raise ValueError('Review failed: ' + '; '.join(str(e) for e in report.get('errors', [])) + '; see review/review.json')
    if report.get('readingPolicy') != READING_POLICY or report.get('contrastPolicy') != CONTRAST_POLICY:
        raise ValueError('Review policy differs from the fixed reading/contrast baseline; rerun review')
    if report.get('visibilityPolicy') != VISIBILITY_POLICY or report.get('visibility') != {'passed': True}:
        raise ValueError('Text visibility review missing or failed; rerun review')
    if (report.get('displayVersion') != DISPLAY_VERSION
            or report.get('display') != {'passed': True, 'version': DISPLAY_VERSION}
            or not read_local(root, 'manifest.json').get('displayBindings')):
        raise ValueError('Display binding review missing or obsolete; migrate and rerun review')
    display = read_local(root, 'review/display-check.json')
    if display.get('passed') is not True or display.get('errors') != [] or display.get('version') != DISPLAY_VERSION:
        raise ValueError('Display binding check failed; see review/display-check.json')
    if report.get('sourceFingerprint') != fingerprint(root):
        raise ValueError('Inputs changed since review; rerun review')
    return report


def usage_errors(root: Path, manifest: dict, acceptance: dict) -> list[str]:
    return material_errors(root, manifest, acceptance)



def check_exportable(root: Path) -> list[str]:
    """Check a current technical review and source/material records before export."""
    try:
        checked_review(root)
        preflight = read_local(root, 'preflight.json')
        if preflight.get('passed') is not True:
            return ['Preflight failed; rerun preflight before production export']
        errors = verify_evidence(root)['errors']
        if read_local(root, 'fact-review.json').get('status') != 'passed':
            errors.append('fact-review.status must be passed before production export')
        manifest = read_local(root, 'manifest.json')
        if manifest.get('assets'):
            errors.extend(usage_errors(root, manifest, read_local(root, 'acceptance.json')))
        return errors
    except (OSError, ValueError, KeyError, TypeError) as error:
        return [str(error)]


def check_export_target(root: Path, html: Path, output: Path, *, draft: bool) -> None:
    root, html, output = root.resolve(), html.resolve(), output.resolve()
    if not html.is_relative_to(root) or not output.is_relative_to(root):
        raise ValueError('Export/draft paths must stay inside the bundle')
    has_manifest = (root / 'manifest.json').is_file()
    manifest = read_local(root, 'manifest.json') if has_manifest else {}
    final = (root / manifest.get('png', 'preview.png')).resolve()
    if draft:
        if not output.is_relative_to(root / 'draft') or output == final:
            raise ValueError('Use draft/<name>.png; draft cannot overwrite the declared final PNG')
        inputs = fingerprint(root) if has_manifest else {}
        if output == html or any(output == (root / name).resolve() for name in inputs):
            raise ValueError('Draft output cannot overwrite a render input')
        return
    if not has_manifest:
        raise ValueError('Production export needs a manifest; for diagnosis use --draft and draft/<name>.png')
    if html != (root / manifest['html']).resolve() or output != final:
        raise ValueError('Production HTML/output must match the manifest')
    errors = check_exportable(root)
    if errors:
        raise ValueError('; '.join(errors))
    if any(output == (root / name).resolve() for name in fingerprint(root)):
        raise ValueError('Production output cannot overwrite a render input')


def delivery_fingerprint(root: Path) -> dict:
    """Bind final state to both render inputs and the evidence used by verify."""
    result = fingerprint(root)
    manifest = read_local(root, 'manifest.json')
    paths = {'preflight.json', 'review/review.json', 'review/display-check.json', 'fact-review.json', 'acceptance.json'}
    if manifest.get('delivery') != 'html':
        paths.update({'export-check.json', manifest.get('png', 'preview.png')})
    from source_evidence import source_paths
    paths.update(source_paths(root, read_local(root, 'fact-review.json')))
    for asset in read_local(root, 'acceptance.json').get('usage', {}).get('assets', []):
        paths.add(asset['evidence'])
    for name in sorted(paths):
        path = (root / name).resolve()
        if not path.is_relative_to(root.resolve()) or not path.is_file():
            raise ValueError(f'Delivery evidence missing or outside bundle: {name}')
        result[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result


def delivery_status(root: Path) -> dict:
    """Read only. A previous success is usable only for exactly its checked inputs."""
    if not (root / 'delivery-check.json').is_file():
        return {'status': 'draft', 'errors': ['No final verification; run verify before claiming completion']}
    try:
        receipt = read_local(root, 'delivery-check.json')
        if receipt.get('passed') is not True:
            return {'status': 'blocked', 'errors': receipt.get('errors') or ['Final verification did not pass']}
        if receipt.get('contractVersion') != DELIVERY_VERSION:
            return {'status': 'draft', 'errors': ['Delivery contract changed; migrate bindings and rerun review/export/verify']}
        current = delivery_fingerprint(root)
        if receipt.get('deliveryFingerprint') != current:
            return {'status': 'draft', 'errors': ['Delivery inputs/evidence changed; rerun the affected checks and verify']}
        checked_review(root)
        return {'status': 'ready', 'errors': [], 'deliveryFingerprint': current,
                'scope': 'Recorded checks passed; source truth and visual quality require independent review'}
    except (OSError, ValueError, KeyError, TypeError) as error:
        return {'status': 'blocked', 'errors': [str(error)]}


def delivery_handoff(root: Path) -> dict:
    """Describe actual files using the sole delivery state; never promote a PNG to success."""
    state = delivery_status(root)
    artifacts = []
    try:
        manifest = read_local(root, 'manifest.json')
    except (OSError, ValueError, TypeError):
        manifest = {}
    ready = state['status'] == 'ready'
    from diagnostic_preview import REPORT_NAME
    for name, label in [(manifest.get('html', 'index.html'), '可编辑 HTML' if ready else '草稿 HTML'),
                        (manifest.get('png', 'preview.png'), '已验证 PNG' if ready else '未验证图片'),
                        (REPORT_NAME, '诊断报告图（未完成；外框不属于原海报）'),
                        ('review/review.json', '最终检查报告'),
                        ('layout-review/review.json', '粗排检查报告')]:
        if isinstance(name, str):
            path = (root / name).resolve()
            if path.is_relative_to(root.resolve()) and path.is_file():
                artifacts.append({'file': name, 'label': label})
    formal = [item for item in artifacts if ready and item['file'] in
              (manifest.get('html', 'index.html'), manifest.get('png', 'preview.png'))]
    diagnostic = [item for item in artifacts if item not in formal]
    next_action = '交付已核验文件，保留来源和验收记录。' if ready else (
        '先呈现诊断草稿并说明正式未完成，再请求允许调整与阅读要求冲突的字号或布局；调整后重新验收，不能豁免门禁。'
        if any('Reading' in error for error in state['errors']) else
        '修复所列失败后重新验收；当前仅可提供草稿，诊断截图不能代表完成。')
    return {**state, 'summary': '当前记录检查通过' if ready else '草稿/未完成：' + '; '.join(state['errors']),
            'artifacts': artifacts, 'formalArtifacts': formal, 'diagnosticArtifacts': diagnostic,
            'nextAction': next_action,
            'allowedActions': ['deliver-formal'] if ready else
                ['share-diagnostic', 'request-constraint-change', 'repair-and-recheck', 'stop']}


def delivery_package(root: Path) -> dict:
    """Only verified files are formal; never publish a loose final-named PNG on failure."""
    state = delivery_handoff(root)
    diagnostics, unverified = [], []
    from diagnostic_preview import REPORT_NAME
    from verify_evidence import read_local as read_record
    for item in state['diagnosticArtifacts']:
        if item['file'] == REPORT_NAME:
            try:
                record = read_record(root, 'draft/diagnostic-preview.json')
                raw = (root / record['raw']).resolve()
                if not raw.is_relative_to(root / 'draft') or not raw.is_file():
                    raise ValueError('Missing raw diagnostic')
                if record['file'] != REPORT_NAME or record['sha256'] != hashlib.sha256((root / REPORT_NAME).read_bytes()).hexdigest() or record['rawSha256'] != hashlib.sha256(raw.read_bytes()).hexdigest():
                    raise ValueError('Stale diagnostic report')
                def dimensions(path):
                    content = path.read_bytes()
                    if content[:8] != b'\x89PNG\r\n\x1a\n' or content[12:16] != b'IHDR':
                        raise ValueError('Invalid diagnostic PNG')
                    return list(struct.unpack('>II', content[16:24]))
                if dimensions(raw) != record['originalPixels'] or dimensions(root / REPORT_NAME) != record['reportPixels']:
                    raise ValueError('Diagnostic dimensions differ from metadata')
                item = {**item, 'originalPixels': record['originalPixels'], 'reportPixels': record['reportPixels']}
            except (OSError, ValueError, KeyError, TypeError, struct.error):
                unverified.append(item)
                continue
        if item['label'] == '未验证图片':
            unverified.append(item)
        else:
            diagnostics.append(item)
    def with_hash(items):
        return [{**item, 'sha256': hashlib.sha256((root / item['file']).read_bytes()).hexdigest()} for item in items]
    formal = with_hash(state['formalArtifacts'])
    diagnostics.sort(key=lambda item: item['file'] != REPORT_NAME)
    diagnostics = with_hash(diagnostics)
    heading = '正式交付已完成。' if state['status'] == 'ready' else '正式交付未完成。'
    lines = [heading, '', f"状态：{state['status']}"]
    lines.extend('- ' + str(error) for error in state['errors'])
    lines.extend(['', '正式交付文件：' if formal else '可提供的草稿及诊断记录：'])
    lines.extend(f"- {item['label']}：{item['file']}" for item in (formal if formal else diagnostics))
    for item in diagnostics:
        if 'reportPixels' in item:
            report_size = '×'.join(map(str, item['reportPixels']))
            original_size = '×'.join(map(str, item['originalPixels']))
            lines.append(f"报告图 {report_size} 像素（含未完成外框）；原海报区域 {original_size} 像素。")
    lines.extend(['', state['nextAction']])
    if unverified:
        lines.extend(['', '另有未验证图片，未列入交付清单。'])
    return {'status': state['status'], 'errors': state['errors'], 'formalArtifacts': formal,
            'diagnosticArtifacts': diagnostics, 'unverifiedArtifacts': unverified,
            'nextAction': state['nextAction'], 'allowedActions': state['allowedActions'], 'reply': '\n'.join(lines) + '\n'}
