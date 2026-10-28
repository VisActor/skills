"""Initialize an empty poster canvas and owned runtime, never overwrite an original."""
import json
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
RUNTIME_FILES = ('render_charts.js', 'poster_bootstrap.js')


def initialize_bundle(root: Path, *, width: int, height: int) -> dict:
    if any(type(v) is not int or v <= 0 for v in (width, height)):
        raise ValueError('Canvas dimensions must be positive integer CSS pixels')
    root = root.resolve()
    files = {
        'manifest.json': {'html': 'index.html', 'png': 'preview.png', 'delivery': 'html+png',
                          'canvas': {'width': width, 'height': height}, 'charts': [], 'assets': [],
                          'displayBindings': 'display-map.json', 'managedRuntime': True,
                          'export': {'selector': '#infographic', 'width': width, 'height': height,
                                     'deviceScaleFactor': 2, 'viewport': {'width': width, 'height': height}}},
        'data.json': {}, 'display-map.json': {'version': 1, 'dom': [], 'charts': []},
        'fact-review.json': {'status': 'pending', 'checks': [], 'comparisons': []}}
    contents = {n: json.dumps(v, ensure_ascii=False, indent=2) + '\n' for n, v in files.items()}
    contents['index.html'] = f'''<!doctype html>
<html><head><meta charset="utf-8"><style>
body{{margin:0}}*{{box-sizing:border-box}}
#infographic{{width:{width}px;height:{height}px;position:relative;background:white;color:black}}
</style></head><body><main id="infographic"></main>
<script src="charts.generated.js"></script>
<script src="render_charts.js"></script>
<script src="poster_bootstrap.js"></script>
</body></html>
'''
    contents.update({name: (SCRIPTS / name).read_text(encoding='utf-8') for name in RUNTIME_FILES})
    if any((root / name).exists() or (root / name).is_symlink() for name in contents):
        raise ValueError('Refusing to overwrite existing poster inputs/runtime; review original first')
    root.mkdir(parents=True, exist_ok=True)
    for name, value in contents.items():
        (root / name).write_text(value, encoding='utf-8')
    return {'createdFiles': list(contents), 'nextAction': 'Add verified data, mappings, actual content and native specs; run build. Empty initialization is not a passed poster.'}
