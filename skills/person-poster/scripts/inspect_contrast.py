"""Measure solid text against its rendered background; not a visual-quality oracle."""
from __future__ import annotations

import io
import math
import re
from functools import lru_cache
from pathlib import Path

CONTRAST_POLICY = {'version': 'rendered-glyph-background-v2', 'displayWidthCssPx': 600,
                   'normalMinimum': 4.5, 'largeMinimum': 3.0,
                   'solidDeltaMinimum': 230, 'minimumSolidAreaCssPx2': 3}
PROBE = Path(__file__).with_name('contrast_probe.js').read_text(encoding='utf-8')


@lru_cache(maxsize=65536)
def luminance(color: tuple[int, int, int]) -> float:
    channels = [v / 255 for v in color]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]
    return sum(a * b for a, b in zip(linear, (.2126, .7152, .0722)))


def contrast_ratio(foreground, background) -> float:
    low, high = sorted((luminance(tuple(foreground)), luminance(tuple(background))))
    return (high + .05) / (low + .05)


def analyze(snapshot: dict, black, white, background) -> dict:
    if not black.size == white.size == background.size:
        raise ValueError('Contrast capture sizes differ; layout changed during measurement')
    black, white, background = (im.convert('RGB') for im in (black, white, background))
    bp, wp, bg = black.load(), white.load(), background.load()
    width, height = black.size
    dimensions = [snapshot.get('rootWidth'), snapshot.get('rootHeight')]
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or v <= 0
           for v in dimensions):
        raise ValueError('Invalid contrast root dimensions')
    capture = snapshot.get('capture', {'width': dimensions[0], 'height': dimensions[1],
                                       'offsetX': 0, 'offsetY': 0})
    if (any(isinstance(capture.get(k), bool) or not isinstance(capture.get(k), (int, float))
            or not math.isfinite(capture[k]) or capture[k] <= 0 for k in ('width', 'height'))
            or any(not isinstance(capture.get(k), (int, float)) or not math.isfinite(capture[k])
                   or capture[k] < 0 for k in ('offsetX', 'offsetY'))
            or capture['offsetX'] + dimensions[0] > capture['width'] + 1e-6
            or capture['offsetY'] + dimensions[1] > capture['height'] + 1e-6):
        raise ValueError('Invalid contrast capture dimensions')
    scale_x, scale_y = width / capture['width'], height / capture['height']
    ox, oy = capture['offsetX'], capture['offsetY']
    reading_scale = min(600 / snapshot['rootWidth'], 1)
    unknown, items, failures, sample_failures = list(snapshot['unmeasured']), [], [], []
    for text in snapshot['texts']:
        pixels = set()
        maximum_delta = 0
        for rect in text['rects']:
            if any(not isinstance(rect.get(k), (int, float)) or not math.isfinite(rect[k])
                   for k in ('x', 'y', 'width', 'height')):
                raise ValueError('Invalid contrast text rectangle')
            x0, y0 = max(0, math.floor((rect['x'] + ox) * scale_x)), max(0, math.floor((rect['y'] + oy) * scale_y))
            x1 = min(width, math.ceil((rect['x'] + rect['width'] + ox) * scale_x))
            y1 = min(height, math.ceil((rect['y'] + rect['height'] + oy) * scale_y))
            for y in range(y0, y1):
                for x in range(x0, x1):
                    # Inner glyph coverage, not antialiased fringes or empty text-box space.
                    delta = min(wp[x, y][i] - bp[x, y][i] for i in range(3))
                    maximum_delta = max(maximum_delta, delta)
                    if delta >= CONTRAST_POLICY['solidDeltaMinimum']:
                        pixels.add((x, y))
        solid_area = len(pixels) / (scale_x * scale_y)
        observed = {'samples': len(pixels), 'solidAreaCssPx2': solid_area, 'maximumDelta': maximum_delta}
        if len(pixels) < 3 or solid_area < CONTRAST_POLICY['minimumSolidAreaCssPx2']:
            unknown.append('No solid glyph samples: ' + text['text'][:100])
            sample_failures.append({**text, **observed, 'reason': 'insufficient-solid-area'})
            continue
        size = text['fontSizePx'] * reading_scale
        minimum = 3.0 if size >= 24 or (text['bold'] and size >= 18.667) else 4.5
        ratios = [contrast_ratio(text['color'], bg[x, y]) for x, y in pixels]
        bad = sum(ratio < minimum for ratio in ratios)
        if bad and text.get('strokeColor') and any(
                contrast_ratio(text['color'], bg[x, y]) < minimum and
                contrast_ratio(text['strokeColor'], bg[x, y]) >= minimum for x, y in pixels):
            unknown.append('Contrast depends on outline thickness: ' + text['text'][:100])
            continue
        item = {**text, **observed, 'readingFontSizePx': round(size, 3), 'minimum': minimum,
                'minimumObserved': round(min(ratios), 3), 'lowSamples': bad,
                'passed': bad == 0}
        items.append(item)
        if bad:
            failures.append(item)
    return {'passed': not failures and not unknown, 'policy': dict(CONTRAST_POLICY),
            'sampling': {'scaleX': scale_x, 'scaleY': scale_y,
                         'rootWidthCssPx': dimensions[0], 'rootHeightCssPx': dimensions[1],
                         'captureWidthCssPx': capture['width'], 'captureHeightCssPx': capture['height'],
                         'offsetXCssPx': ox, 'offsetYCssPx': oy},
            'texts': items, 'lowContrast': failures, 'unmeasured': unknown, 'sampleFailures': sample_failures,
            'scope': 'Solid DOM/VChart glyph interiors at their actual image/chart background; '
                     'does not recognize faces, semantic collisions or factual correctness.'}


def save_sample_crops(report: dict, images, directory: Path) -> None:
    """Only own numbered debug PNGs, never caller files or symlink targets."""
    if directory.is_symlink():
        raise ValueError('Contrast diagnostic directory must not be a symlink')
    if directory.exists():
        for path in directory.iterdir():
            if re.fullmatch(r'sample-\d{4,}-(black|white|clear)\.png', path.name):
                if path.is_symlink():
                    raise ValueError('Contrast diagnostic file must not be a symlink')
                if path.is_file():
                    path.unlink()
    if not report['sampleFailures']:
        return
    directory.mkdir(parents=True, exist_ok=True)
    sx, sy = report['sampling']['scaleX'], report['sampling']['scaleY']
    ox, oy = report['sampling']['offsetXCssPx'], report['sampling']['offsetYCssPx']
    width, height = images[0].size
    for index, text in enumerate(report['sampleFailures'], 1):
        rects = text['rects']
        if not rects:
            continue
        box = (max(0, math.floor((min(r['x'] for r in rects) + ox - 2) * sx)),
               max(0, math.floor((min(r['y'] for r in rects) + oy - 2) * sy)),
               min(width, math.ceil((max(r['x'] + r['width'] for r in rects) + ox + 2) * sx)),
               min(height, math.ceil((max(r['y'] + r['height'] for r in rects) + oy + 2) * sy)))
        if box[2] <= box[0] or box[3] <= box[1]:
            continue
        text['debugFiles'] = []
        for mode, image in zip(('black', 'white', 'clear'), images):
            name = f'sample-{index:04d}-{mode}.png'
            image.crop(box).save(directory / name)
            text['debugFiles'].append(directory.name + '/' + name)


def inspect_contrast(page, selector: str, *, debug_dir: Path | None = None) -> dict:
    from PIL import Image

    root = page.locator(selector).first
    root.scroll_into_view_if_needed()
    snapshot = page.evaluate(PROBE, selector)
    x, y = snapshot['rootDocumentX'], snapshot['rootDocumentY']
    clip = {'x': math.floor(x), 'y': math.floor(y),
            'width': math.ceil(x + snapshot['rootWidth']) - math.floor(x),
            'height': math.ceil(y + snapshot['rootHeight']) - math.floor(y)}
    snapshot['capture'] = {'width': clip['width'], 'height': clip['height'],
                           'offsetX': x - clip['x'], 'offsetY': y - clip['y']}
    images = []
    try:
        for mode in ('black', 'white', 'clear'):
            page.evaluate('(mode) => window.__POSTER_CONTRAST_PROBE__.paint(mode)', mode)
            images.append(Image.open(io.BytesIO(page.screenshot(full_page=True, clip=clip, scale='device'))).convert('RGB'))
            current = root.evaluate('e=>{const b=e.getBoundingClientRect();return [b.left+scrollX,b.top+scrollY,b.width,b.height]}')
            if any(abs(a - b) > 1e-6 for a, b in zip(current, (x, y, snapshot['rootWidth'], snapshot['rootHeight']))):
                raise ValueError('Contrast root dimensions or position changed during capture')
        dpr = page.evaluate('window.devicePixelRatio')
        if any(abs(actual - round(expected * dpr)) > 1 for actual, expected in zip(images[0].size, (clip['width'], clip['height']))):
            raise ValueError('Contrast capture was clipped or rescaled')
        report = analyze(snapshot, *images)
        report['sampling'].update(screenshotScale='device',
                                  devicePixelRatio=dpr,
                                  fontsStatus=page.evaluate('document.fonts.status'))
        if debug_dir is not None:
            save_sample_crops(report, images, debug_dir)
        return report
    finally:
        page.evaluate("() => {window.__POSTER_CONTRAST_PROBE__.paint('restore'); delete window.__POSTER_CONTRAST_PROBE__;}")
