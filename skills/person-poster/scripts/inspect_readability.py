"""Measure rendered text at delivery width, not exported bitmap density.

This is a configurable font-size check, not a visual quality certificate.
All visible text is measured, including text marked decorative.
CSS rotation/3D transforms and rich-text chart marks remain explicitly unmeasured.
"""
from __future__ import annotations

import math

READING_POLICY = {"displayWidthCssPx": 600, "minFontSizeCssPx": 12,
                  "textCoverage": "all-visible-dom-and-chart-text-v1"}

READING_SCRIPT = r"""(selector) => {
  const root = document.querySelector(selector);
  const texts = [], unmeasured = [];
  if (!root) throw new Error('Reading root not found');
  const visible = el => {
    for (let node = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    }
    return el.getClientRects().length > 0;
  };
  const cssScale = el => {
    let scale = 1;
    for (let node = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      const m = new DOMMatrixReadOnly(s.transform === 'none' ? undefined : s.transform);
      if (!m.is2D || Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 ||
          (s.rotate && s.rotate !== 'none')) return null;
      scale *= Math.abs(m.d);
      if (s.scale && s.scale !== 'none') {
        const parts = s.scale.split(/\s+/).map(Number);
        scale *= Math.abs(parts[1] ?? parts[0]);
      }
      scale *= Number(s.zoom) || 1;
    }
    return scale;
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement;
    const text = node.textContent.trim().replace(/\s+/g, ' ');
    if (!text || !el || el.closest('script,style,noscript') || !visible(el)) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    if (![...range.getClientRects()].some(b => b.width > 0 && b.height > 0)) continue;
    const s = getComputedStyle(el), scale = cssScale(el);
    if (scale === null || el instanceof SVGElement) {
      unmeasured.push('DOM transform/SVG: ' + text.slice(0,120)); continue;
    }
    texts.push({source:'dom', text, element:el.id || el.className || el.tagName.toLowerCase(),
      fontFamily:s.fontFamily, fontSizePx:parseFloat(s.fontSize) * scale});
  }
  const mounts = [...root.querySelectorAll('[data-chart-id]')];
  const charts = window.__POSTER_INSTANCES__ || [];
  charts.forEach(chart => {
    const container = chart.getContainer?.();
    const mount = mounts.find(el => el === container || el.contains(container));
    if (!mount || !visible(mount)) return;
    const scale = cssScale(mount), stage = chart.getStage?.();
    if (scale === null || !stage) { unmeasured.push('Chart text: ' + mount.dataset.chartId); return; }
    const seen = new Set();
    function walk(g, shown = true) {
      if (!g || seen.has(g)) return;
      seen.add(g);
      const a = g.attribute || {}, theme = g.getGraphicTheme?.() || {};
      shown = shown && a.visible !== false && a.opacity !== 0;
      if (shown && g.type === 'text') {
        const text = String(a.text ?? '').trim(), m = g.globalTransMatrix;
        if (text) {
          const size = Number(a.fontSize ?? theme.fontSize);
          if (!m || !Number.isFinite(size)) unmeasured.push('Chart font: ' + text.slice(0,120));
          else texts.push({source:'chart', chart:mount.dataset.chartId, text,
            fontFamily:a.fontFamily ?? theme.fontFamily,
            fontSizePx:size * Math.hypot(m.c, m.d) * scale});
        }
      } else if (shown && g.type === 'richtext') unmeasured.push('Chart rich text: ' + mount.dataset.chartId);
      g.forEachChildren?.(child => walk(child, shown));
    }
    walk(stage);
  });
  if (mounts.length && charts.length !== mounts.length) unmeasured.push('Chart instance/mount coverage mismatch');
  return {rootWidth:root.getBoundingClientRect().width, texts, unmeasured};
}"""


def reading_report(snapshot: dict, display_width: float, min_font_size: float = 12) -> dict:
    width = snapshot['rootWidth']
    if not all(type(v) in (int, float) and math.isfinite(v) and v > 0
               for v in (width, display_width, min_font_size)):
        raise ValueError('Reading width and minimum font size must be finite and positive')
    target = min(display_width, width)
    texts = [{**item, 'readingFontSizePx': round(item['fontSizePx'] * target / width, 3)}
             for item in snapshot['texts']]
    small = [item for item in texts if item['readingFontSizePx'] < min_font_size - 0.01]
    unknown = snapshot.get('unmeasured', [])
    return {'passed': not small and not unknown, 'displayWidthCssPx': target,
            'minFontSizeCssPx': min_font_size, 'texts': texts, 'smallText': small,
            'unmeasured': unknown,
            'scope': 'Rendered DOM and VChart text size only; contrast, clipping and meaning need separate review'}
