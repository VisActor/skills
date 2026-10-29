"""Fingerprint declared render/data inputs, so editing invalidates previous review."""
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class LocalLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        value = attrs.get('src') if tag in ('script', 'img') else attrs.get('href') if tag == 'link' else None
        if value and not urlsplit(value).scheme and not value.startswith('//'):
            self.paths.append(unquote(urlsplit(value).path))


def fingerprint(root: Path) -> dict:
    root = root.resolve()
    manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    paths = {'manifest.json', manifest['html']}
    if (root / 'data.json').exists():
        paths.add('data.json')
    if (root / 'acceptance.json').is_file():
        acceptance = json.loads((root / 'acceptance.json').read_text(encoding='utf-8'))
        for entry in acceptance.get('usage', {}).get('assets', []):
            if isinstance(entry, dict) and isinstance(entry.get('evidence'), str):
                paths.add(entry['evidence'])
    for field, keys in [('charts', ['spec']), ('assets', ['file', 'sourceFile']), ('dependencies', ['file'])]:
        for entry in manifest.get(field, []):
            paths.update(entry[key] for key in keys if isinstance(entry.get(key), str))
    if manifest.get('displayBindings'):
        paths.add(manifest['displayBindings'])
        if (root / 'fact-review.json').exists():
            paths.add('fact-review.json')
            facts = json.loads((root / 'fact-review.json').read_text(encoding='utf-8'))
            for check in facts.get('checks', []):
                if isinstance(check, dict) and isinstance(check.get('evidence'), str):
                    paths.add(check['evidence'])
            from source_evidence import source_paths
            paths.update(source_paths(root, facts))
            if (root / 'evidence-extract.json').exists():
                paths.add('evidence-extract.json')
    parser = LocalLinks()
    parser.feed((root / manifest['html']).read_text(encoding='utf-8'))
    paths.update(str(Path(manifest['html']).parent / name) for name in parser.paths if name)
    result = {}
    for name in sorted(paths):
        path = (root / name).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError(f'Review input missing or outside bundle: {name}')
        result[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result
