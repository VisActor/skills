/* Native VChart initialization. Copy into the poster bundle; no spec translation. */
window.renderPosterCharts = async function renderPosterCharts(specs) {
  if (window.__POSTER_RENDER_PROMISE__) return window.__POSTER_RENDER_PROMISE__;
  window.__POSTER_INSTANCES__ = [];
  window.__POSTER_RENDER_PROMISE__ = (async () => {
    const entries = Object.entries(specs);
    if (entries.length && typeof window.VChart?.default !== 'function') {
      throw new Error('VChart runtime is unavailable');
    }
    const instances = [];
    try {
      for (const [id, source] of entries) {
        const selector = window.__POSTER_CONFIG__?.mounts?.[id];
        const found = selector ? document.querySelectorAll(selector) : [document.getElementById(`chart-${id}`)].filter(Boolean);
        if (found.length !== 1) throw new Error(`Expected one chart mount: ${id} (${selector || 'chart-' + id})`);
        const mount = found[0];
        if (!mount || mount.clientWidth <= 0 || mount.clientHeight <= 0) {
          throw new Error(`Missing or empty chart mount: ${id}`);
        }
        const spec = structuredClone(source);
        if (spec.animation !== false) throw new Error(`Disable chart animation: ${id}`);
        const chart = new VChart.default(spec, { dom: mount });
        instances.push(chart);
        await chart.renderAsync();
      }
      window.__POSTER_INSTANCES__ = instances;
      return instances;
    } catch (error) {
      for (const chart of instances) chart.release();
      window.__POSTER_INSTANCES__ = [];
      throw error;
    }
  })();
  return window.__POSTER_RENDER_PROMISE__;
};
