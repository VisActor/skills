"""Check material declarations for consistency, without certifying their truth."""
from pathlib import Path

USAGE_STATES = frozenset({'verified', 'unknown', 'restricted'})
UNKNOWN_TERMS = frozenset({'unknown', 'pending', 'unverified', '未知', '未核实', '待核实', ''})


def bitmap_assets(manifest: dict) -> list[dict]:
    return [asset for asset in manifest.get('assets', []) if isinstance(asset, dict) and (
        asset.get('kind') == 'bitmap' or Path(str(asset.get('file', ''))).suffix.lower()
        in {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'})]


def material_errors(root: Path, manifest: dict, acceptance: dict) -> list[str]:
    assets = bitmap_assets(manifest)
    if not assets:
        return []
    usage = acceptance.get('usage', {})
    if not isinstance(usage, dict) or usage.get('status') != 'passed':
        return ['Explicit usage.status=passed with source evidence is required for ready delivery']
    entries = usage.get('assets', [])
    if not isinstance(entries, list):
        return ['usage.assets must be an array']
    errors = []
    for asset in assets:
        name = asset.get('file')
        if asset.get('usageStatus') != 'verified':
            errors.append(f'Material usageStatus must be verified for current use: {name}; '
                          f'got {asset.get("usageStatus", "missing")!r}; acceptance cannot override it')
        terms = asset.get('usageTerms')
        if not isinstance(terms, str) or terms.strip().casefold() in UNKNOWN_TERMS:
            errors.append(f'Material usageTerms unknown or missing: {name}; record actual terms before verification')
        if not asset.get('sourceFile') or not asset.get('sourcePage'):
            errors.append(f'Material original/sourcePage missing: {name}')
        matches = [item for item in entries if isinstance(item, dict) and item.get('file') == name]
        if len(matches) != 1:
            errors.append(f'Material needs exactly one usage review: {name}')
            continue
        item = matches[0]
        basis = item.get('basis')
        if item.get('status') != 'passed' or not isinstance(basis, str) or not basis.strip():
            errors.append(f'Material usage evidence missing: {name}')
        evidence = item.get('evidence')
        if not isinstance(evidence, str) or not evidence:
            errors.append(f'Material source excerpt missing: {name}')
            continue
        path = (root / evidence).resolve()
        if Path(evidence).is_absolute() or not path.is_relative_to(root.resolve()) or not path.is_file() or path.stat().st_size == 0:
            errors.append(f'Material evidence file missing/outside bundle: {name}')
    return errors
