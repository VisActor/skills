"""The fixed VChart dependency and generated bootstrap contract."""
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

VCHART_VERSION = '2.1.7'
VCHART_URL = f'https://unpkg.com/@visactor/vchart@{VCHART_VERSION}/build/index.min.js'
MANAGED_SCRIPTS = ('charts.generated.js', 'render_charts.js', 'poster_bootstrap.js')


def runtime_url(manifest: dict) -> str:
    dependencies = [x for x in manifest.get('dependencies', []) if isinstance(x, dict) and x.get('name') == '@visactor/vchart']
    if not dependencies:
        return VCHART_URL
    if len(dependencies) != 1 or dependencies[0].get('version') != VCHART_VERSION:
        raise ValueError('Managed VChart dependency must declare exactly one fixed version ' + VCHART_VERSION)
    dependency = dependencies[0]
    if 'file' in dependency:
        name = dependency['file']
        if not isinstance(name, str) or not name or Path(name).is_absolute() or '..' in Path(name).parts or urlsplit(name).scheme or '\\' in name:
            raise ValueError('Managed VChart dependency file must be bundle-relative')
        return name
    if dependency.get('url') != VCHART_URL:
        raise ValueError('Managed VChart URL must be pinned to ' + VCHART_URL)
    return VCHART_URL


def runtime_config(manifest: dict) -> dict:
    return {'selector': manifest.get('export', {}).get('selector', '#infographic'),
            'runtimeUrl': runtime_url(manifest),
            'mounts': {item['id']: item.get('mount', '#chart-' + item['id']) for item in manifest.get('charts', [])}}


class Scripts(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.scripts = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.scripts.append(dict(attrs))


def managed_runtime_errors(root: Path, manifest: dict, html_text: str) -> list[str]:
    if manifest.get('managedRuntime') is not True:
        return []
    try:
        expected = runtime_config(manifest)
        paths = []
        for script in Scripts(html_text).scripts:
            src = script.get('src', '')
            parts = urlsplit(src)
            path = (root / manifest['html']).parent / unquote(parts.path)
            if not parts.scheme and not src.startswith('//') and path.resolve() in [(root / x).resolve() for x in MANAGED_SCRIPTS]:
                if 'async' in script or 'defer' in script or script.get('type', '') not in ('', 'text/javascript'):
                    raise ValueError('Managed scripts must execute in generated/bridge/bootstrap order without async/defer/module')
                paths.append(path.resolve().name)
        if tuple(paths) != MANAGED_SCRIPTS:
            raise ValueError('Load managed scripts exactly once in generated/bridge/bootstrap order')
        for name in MANAGED_SCRIPTS[1:]:
            path = (root / name).resolve()
            if not path.is_relative_to(root.resolve()) or path.read_bytes() != Path(__file__).with_name(name).read_bytes():
                raise ValueError('Managed runtime changed or obsolete: ' + name + '; rerun build')
        generated = (root / MANAGED_SCRIPTS[0]).read_text(encoding='utf-8')
        matches = list(re.finditer(r'window\.__POSTER_CONFIG__\s*=\s*', generated))
        if len(matches) != 1:
            raise ValueError('Expected one generated poster config; rerun build')
        value, _ = json.JSONDecoder().raw_decode(generated[matches[0].end():])
        if value != expected:
            raise ValueError('Generated runtime config differs from manifest; rerun build')
        if expected['runtimeUrl'] != VCHART_URL:
            path = (root / expected['runtimeUrl']).resolve()
            if not path.is_relative_to(root.resolve()) or not path.is_file():
                raise ValueError('Managed local VChart runtime missing/outside bundle')
    except (OSError, ValueError, KeyError, TypeError) as error:
        return [str(error)]
    return []
