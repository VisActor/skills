import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { useLocalAssets } from './local-browser-assets.mjs';
import { withRequiredChecks } from './browser-checks.mjs';

const directory = path.resolve(process.argv[2]);
const outputs = path.join(directory, 'workspace/outputs');
const expected = JSON.parse(await fs.readFile(path.join(directory, 'expectations.json'), 'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(outputs, 'manifest.json'), 'utf8'));
const specs = Object.fromEntries(await Promise.all(manifest.charts.map(async chart =>
  [chart.id, JSON.parse(await fs.readFile(path.join(outputs, chart.spec), 'utf8'))])));
const checks = [], errors = [], requests = [], failedRequests = [];
let browser;
const server = http.createServer(async (req, res) => {
  try {
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = await fs.realpath(path.resolve(outputs, '.' + relative));
    if (!file.startsWith((await fs.realpath(outputs)) + path.sep)) {
      res.writeHead(403); res.end(); return;
    }
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript',
      '.json':'application/json','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  browser = await chromium.launch({ channel: 'chromium', headless: true });
  const page = await browser.newPage({viewport: {width: 1200, height: manifest.canvas.height}});
  const origin = `http://127.0.0.1:${server.address().port}`;
  const failures = await useLocalAssets(page, origin, path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => requests.push(request.url()));
  page.on('requestfailed', request => failedRequests.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(response.url()); });
  await page.goto(`${origin}/${expected.html}`, {waitUntil:'load'});
  await page.waitForFunction(() => window.__INFOGRAPHIC_READY__ === true || window.__INFOGRAPHIC_ERROR__, null, {timeout: 15000});
  const state = await page.evaluate(() => ({
    ready: window.__INFOGRAPHIC_READY__, error: window.__INFOGRAPHIC_ERROR__ || null,
    specs: window.__INFOGRAPHIC_CHARTS__,
    actual: (window.__POSTER_INSTANCES__ || []).map(chart => chart.getSpec()),
    geometry: (window.__POSTER_INSTANCES__ || []).map(chart =>
      chart.getChart().getAllSeries().filter(series => series.type === 'bar').flatMap(series =>
        series.getSeriesMark().getGraphics().map(graphic => ({
          datum: graphic.context.data[0],
          fill: graphic.attribute.fill,
          bounds: graphic.globalAABBBounds,
          ...Object.fromEntries(['x', 'x1', 'y', 'y1', 'width', 'height'].map(key => [key, graphic.attribute[key]])),
        })))),
    textGraphics: (window.__POSTER_INSTANCES__ || []).map(chart => {
      const texts = [];
      function walk(graphic, visible = true) {
        if (!graphic) return;
        const a = graphic.attribute || {};
        visible = visible && a.visible !== false && a.opacity !== 0;
        if (graphic.type === 'text' && visible) {
          texts.push({text:String(a.text), bounds:graphic.globalAABBBounds});
        }
        graphic.forEachChildren?.(child => { walk(child, visible); });
      }
      chart.getComponents().filter(c => ['label', 'cartesianAxis-band', 'discreteLegend'].includes(c.type))
        .forEach(c => c.getVRenderComponents().forEach(g => walk(g)));
      return texts;
    }),
    mounts: [...document.querySelectorAll('[data-chart-id]')].map(el =>
      ({id:el.dataset.chartId, width:el.clientWidth, height:el.clientHeight})),
    runtime: typeof window.VChart !== 'undefined',
  }));
  checks.push({name:'nativeSpecsUnchanged', passed:JSON.stringify(state.specs) === JSON.stringify(specs)});
  if (expected.renderFailure) {
    checks.push({name:'renderFailure', passed:state.ready === false && !!state.error});
  } else {
    checks.push({name:'ready', passed:state.ready === true && !state.error});
    checks.push({name:'chartDataMatches', passed:state.actual.length === expected.chartCount &&
      manifest.charts.every((entry, i) => JSON.stringify(state.actual[i]?.data) === JSON.stringify(specs[entry.id].data))});
    const bars = manifest.charts.flatMap((entry, index) => {
      const spec = specs[entry.id];
      if (spec.type !== 'bar') return [];
      const horizontal = spec.direction === 'horizontal';
      const field = horizontal ? spec.xField : spec.yField;
      const categories = horizontal ? spec.yField : spec.xField;
      const category = Array.isArray(categories) ? categories[0] : categories;
      const graphics = state.geometry[index];
      const spans = graphics.map(g => ({
        value: g.datum[field],
        size: Math.abs(horizontal ? (g.x1 ?? g.x + g.width) - g.x : (g.y1 ?? g.y + g.height) - g.y),
      }));
      const positive = spans.filter(row => row.value > 0);
      const ratio = positive.length ? positive[0].size / positive[0].value : 0;
      const order = [...new Set(spec.data[0].values.map(row => row[category]))];
      const positions = order.map(value => {
        const group = graphics.filter(g => g.datum[category] === value);
        return group.reduce((sum, g) => sum + (horizontal ? g.y : g.x), 0) / group.length;
      });
      return [{id:entry.id, passed:graphics.length === spec.data[0].values.length &&
        spans.every(row => Number.isFinite(row.size) && Math.abs(row.size - row.value * ratio) < 0.5) &&
        positions.every((pos, i) => Number.isFinite(pos) && (i === 0 || pos > positions[i - 1])),
        spans, positions}];
    });
    // Only fixed, unrotated bar fixtures opt in. This is not a general readability detector.
    if (expected.labelTexts) {
      const labels = expected.labelTexts.map(item => {
        const index = manifest.charts.findIndex(chart => chart.id === item.chartId);
        const texts = state.textGraphics[index] || [];
        const mount = state.mounts.find(m => m.id === item.chartId);
        const clipped = texts.filter(({bounds:b}) => !mount ||
          ![b.x1,b.y1,b.x2,b.y2].every(Number.isFinite) ||
          b.x1 < -1 || b.y1 < -1 || b.x2 > mount.width + 1 || b.y2 > mount.height + 1);
        const overlaps = texts.flatMap((a,i) => texts.slice(i+1).filter(b =>
          Math.min(a.bounds.x2,b.bounds.x2) - Math.max(a.bounds.x1,b.bounds.x1) > 1 &&
          Math.min(a.bounds.y2,b.bounds.y2) - Math.max(a.bounds.y1,b.bounds.y1) > 1
        ).map(b => [a.text,b.text]));
        const actual = texts.map(t => t.text).sort();
        return {chartId:item.chartId, actual, clipped, overlaps, passed:
          JSON.stringify(actual) === JSON.stringify([...item.expected].sort()) &&
          clipped.length === 0 && overlaps.length === 0};
      });
      checks.push({name:'barLabelGeometry', passed:labels.length > 0 && labels.every(l => l.passed), labels});
    }
    if (expected.colorMappings) {
      const mappings = expected.colorMappings.map(mapping => {
        const index = manifest.charts.findIndex(chart => chart.id === mapping.chartId);
        const graphics = state.geometry[index] || [];
        const actual = graphics.map(g => ({category:g.datum[mapping.field], fill:g.fill}));
        const categories = new Set(actual.map(g => String(g.category)));
        return {...mapping, actual, passed:actual.length > 0 &&
          categories.size === Object.keys(mapping.expected).length &&
          Object.keys(mapping.expected).every(key => categories.has(key)) &&
          actual.every(g => typeof g.fill === 'string' &&
            g.fill.toLowerCase() === mapping.expected[g.category]?.toLowerCase())};
      });
      checks.push({name:'barColorMapping', passed:mappings.length > 0 && mappings.every(m => m.passed), mappings});
    }
    if (bars.length) checks.push({name:'barGeometry', passed:bars.every(bar => bar.passed), bars});
    if (!expected.chartCount) {
      checks.push({name:'noChartRuntime', passed:!state.runtime && !requests.some(url => url.endsWith('/runtime.js'))});
    } else {
      const marks = await page.evaluate(() => [...document.querySelectorAll('[data-chart-id]')].map(mount => {
        const canvases = [...mount.querySelectorAll('canvas')];
        const nonblank = canvases.some(canvas => {
          const ctx = canvas.getContext('2d');
          if (!ctx || !canvas.width || !canvas.height) return false;
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let painted = 0;
          for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) painted++;
          return painted > 100;
        });
        return {id:mount.dataset.chartId, nonblank};
      }));
      checks.push({name:'nonBlankCharts', passed:marks.length === expected.chartCount && marks.every(mark => mark.nonblank), marks});
      for (const entry of manifest.charts) {
        await page.locator(entry.mount).screenshot({path:path.join(directory, `${entry.id}.png`)});
      }
    }
  }
  await page.locator('#infographic').screenshot({path:path.join(directory, 'overview.png')});
  await fs.writeFile(path.join(directory, 'runtime-specs.json'), JSON.stringify(state, null, 2) + '\n');
  checks.push({name:'pageErrors', passed:errors.length === 0, errors});
  checks.push({name:'localAssets', passed:failures.length === 0 && failedRequests.length === 0, failures, failedRequests});
  checks.push({name:'noPrivateRequests', passed:requests.every(url => !/bytedance\.net|byted-static|code\.byted|@dp\//.test(url))});
} catch (error) {
  checks.push({name:'browserExecution', passed:false, error:String(error)});
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
const report = {checks:withRequiredChecks(checks, expected.requiredChecks), requests};
await fs.writeFile(path.join(directory, 'checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.checks.map(({name,passed}) => ({name,passed}))));
process.exitCode = report.checks.every(check => check.passed) ? 0 : 1;
