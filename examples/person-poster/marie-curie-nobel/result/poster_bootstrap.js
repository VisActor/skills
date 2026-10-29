/* Startup owned by the bundle build; all artwork remains in HTML/CSS/specs. */
window.bootstrapPoster = function bootstrapPoster() {
  if (window.__POSTER_START_PROMISE__) return window.__POSTER_START_PROMISE__;
  window.__INFOGRAPHIC_READY__ = false;
  window.__INFOGRAPHIC_ERROR__ = '';
  window.__POSTER_START_PROMISE__ = (async () => {
    if (document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }
    const config = window.__POSTER_CONFIG__ || {};
    const root = document.querySelector(config.selector || '#infographic');
    if (!root) throw new Error('Poster root not found');
    await document.fonts.ready;
    await Promise.all([...root.querySelectorAll('img')].map(async img => {
      if (!img.complete) await new Promise((resolve, reject) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', () => reject(new Error('Image failed: ' + img.getAttribute('src'))), { once: true });
      });
      if (!img.naturalWidth) throw new Error('Image failed: ' + img.getAttribute('src'));
      await img.decode();
    }));
    const specs = window.__INFOGRAPHIC_CHARTS__;
    if (!specs || typeof specs !== 'object') throw new Error('Missing generated chart payload; run build');
    if (Object.keys(specs).length && typeof window.VChart?.default !== 'function') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        if (!config.runtimeUrl) return reject(new Error('Missing generated runtime URL; run build'));
        script.src = config.runtimeUrl;
        script.onload = resolve;
        script.onerror = () => reject(new Error('VChart runtime failed: ' + script.src));
        document.head.appendChild(script);
      });
    }
    await window.renderPosterCharts(specs);
    if (root.querySelectorAll('[data-chart-id]').length !== window.__POSTER_INSTANCES__.length) {
      throw new Error('Chart instance/mount coverage mismatch');
    }
    window.__INFOGRAPHIC_READY__ = true;
  })().catch(error => {
    window.__INFOGRAPHIC_READY__ = false;
    window.__INFOGRAPHIC_ERROR__ = String(error.message || error);
    for (const chart of window.__POSTER_INSTANCES__ || []) chart.release();
    window.__POSTER_INSTANCES__ = [];
    throw error;
  });
  return window.__POSTER_START_PROMISE__;
};
window.bootstrapPoster().catch(error => console.error(error));
