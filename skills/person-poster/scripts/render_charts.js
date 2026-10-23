/* Native VChart initialization. Copy into the poster bundle; no spec translation. */
window.renderPosterCharts = async function renderPosterCharts(specs) {
  const entries = Object.entries(specs);
  if (entries.length && typeof window.VChart?.default !== 'function') {
    throw new Error('VChart runtime is unavailable');
  }
  const instances = [];
  try {
    for (const [id, source] of entries) {
      const mount = document.getElementById(`chart-${id}`);
      if (!mount || mount.clientWidth <= 0 || mount.clientHeight <= 0) {
        throw new Error(`Missing or empty chart mount: ${id}`);
      }
      const spec = structuredClone(source);
      if (spec.animation !== false) throw new Error(`Disable chart animation: ${id}`);
      const chart = new VChart.default(spec, { dom: mount });
      instances.push(chart);
      await chart.renderAsync();
    }
    return instances;
  } catch (error) {
    for (const chart of instances) chart.release();
    throw error;
  }
};
