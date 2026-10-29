(selector) => {
  const root = document.querySelector(selector);
  if (!root) throw new Error('Display root not found');
  const dom = [], unboundText = [], unmeasured = [];
  const visible = el => {
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    }
    return [...el.getClientRects()].some(r => r.width > 0 && r.height > 0);
  };
  const elements = [root, ...root.querySelectorAll('*')];
  for (const el of elements) {
    if (el.closest('script,style,noscript')) continue;
    const shown = visible(el), id = el.getAttribute('data-display-id');
    if (id !== null) {
      const rect = el.getBoundingClientRect();
      dom.push({id, text: (el.innerText ?? el.textContent).trim(), visible: shown,
        nested: [...el.children].some(child => child.tagName !== 'BR'),
        rect: {x:rect.x, y:rect.y, width:rect.width, height:rect.height}});
    }
    if (!shown) continue;
    for (const pseudo of ['::before', '::after']) {
      const s = getComputedStyle(el, pseudo);
      if (s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 &&
          !['none', 'normal', '""', "''"].includes(s.content)) {
        unmeasured.push('Generated content ' + pseudo + ': ' + s.content);
      }
    }
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if (![...range.getClientRects()].some(r => r.width > 0 && r.height > 0)) continue;
      if (el instanceof SVGElement) unmeasured.push('SVG text: ' + node.textContent.trim());
      else if (id === null) unboundText.push({text:node.textContent.trim(), element:el.id || el.tagName});
    }
    if (el.matches('input,textarea,select') && (el.value || el.placeholder)) {
      unmeasured.push('Form control text: ' + (el.value || el.placeholder));
    }
    if (el.matches('canvas') && !el.closest('[data-chart-id]')) unmeasured.push('Unregistered canvas text/content');
  }
  return {dom, unboundText, unmeasured, chartSpecs:window.__INFOGRAPHIC_CHARTS__ || {}};
}
