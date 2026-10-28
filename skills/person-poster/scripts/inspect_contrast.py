"""Measure solid text against its rendered background; not a visual-quality oracle."""
from __future__ import annotations

import io
import math
from functools import lru_cache
from pathlib import Path

CONTRAST_POLICY = {'version': 'rendered-glyph-background-v1', 'displayWidthCssPx': 600,
                   'normalMinimum': 4.5, 'largeMinimum': 3.0}
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
    scale = width / snapshot['rootWidth']
    reading_scale = min(600 / snapshot['rootWidth'], 1)
    unknown, items, failures = list(snapshot['unmeasured']), [], []
    for text in snapshot['texts']:
        pixels = set()
        for rect in text['rects']:
            x0, y0 = max(0, math.floor(rect['x'] * scale)), max(0, math.floor(rect['y'] * scale))
            x1 = min(width, math.ceil((rect['x'] + rect['width']) * scale))
            y1 = min(height, math.ceil((rect['y'] + rect['height']) * scale))
            for y in range(y0, y1):
                for x in range(x0, x1):
                    # Inner glyph coverage, not antialiased fringes or empty text-box space.
                    if min(wp[x, y][i] - bp[x, y][i] for i in range(3)) >= 230:
                        pixels.add((x, y))
        if len(pixels) < 3:
            unknown.append('No solid glyph samples: ' + text['text'][:100])
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
        item = {**text, 'readingFontSizePx': round(size, 3), 'minimum': minimum,
                'minimumObserved': round(min(ratios), 3), 'samples': len(ratios), 'lowSamples': bad,
                'passed': bad == 0}
        items.append(item)
        if bad:
            failures.append(item)
    return {'passed': not failures and not unknown, 'policy': dict(CONTRAST_POLICY),
            'texts': items, 'lowContrast': failures, 'unmeasured': unknown,
            'scope': 'Solid DOM/VChart glyph interiors at their actual image/chart background; '
                     'does not recognize faces, semantic collisions or factual correctness.'}


def inspect_contrast(page, selector: str) -> dict:
    from PIL import Image

    snapshot = page.evaluate(PROBE, selector)
    root = page.locator(selector).first
    images = []
    try:
        for mode in ('black', 'white', 'clear'):
            page.evaluate('(mode) => window.__POSTER_CONTRAST_PROBE__.paint(mode)', mode)
            images.append(Image.open(io.BytesIO(root.screenshot(scale='css'))).convert('RGB'))
        return analyze(snapshot, *images)
    finally:
        page.evaluate("() => {window.__POSTER_CONTRAST_PROBE__.paint('restore'); delete window.__POSTER_CONTRAST_PROBE__;}")
