import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../skills/person-poster/scripts/render_charts.js', import.meta.url), 'utf8');

function harness({empty = false, fail = false} = {}) {
  const inputs = [], released = [];
  class Chart {
    constructor(spec) { this.spec = spec; inputs.push(spec); }
    async renderAsync() { this.spec.data[0].values.push({x: 'mutated'}); if (fail) throw new Error('render failed'); }
    release() { released.push(this); }
  }
  const context = { window: {}, VChart: {default: Chart}, structuredClone,
    document: {getElementById: () => ({clientWidth: empty ? 0 : 500, clientHeight: 300})} };
  context.window.VChart = context.VChart;
  vm.runInNewContext(source, context);
  return {render:context.window.renderPosterCharts, inputs, released};
}

const spec = () => ({type:'bar', animation:false, data:[{values:[{x:'A', y:1}]}]});

test('native spec is isolated from renderer mutations', async () => {
  const h = harness(), original = spec();
  assert.equal((await h.render({a:original})).length, 1);
  assert.deepEqual(original, spec());
  assert.equal(h.inputs[0].data[0].values.length, 2);
});

test('failed rendering releases created instances and rejects', async () => {
  const h = harness({fail:true});
  await assert.rejects(h.render({a:spec()}), /render failed/);
  assert.equal(h.released.length, 1);
});

test('empty mount cannot be reported as ready', async () => {
  const h = harness({empty:true});
  await assert.rejects(h.render({a:spec()}), /empty chart mount/);
  assert.equal(h.inputs.length, 0);
});

test('HTML-only bundles do not require a chart constructor', async () => {
  const context = {window:{}, structuredClone};
  vm.runInNewContext(source, context);
  assert.equal((await context.window.renderPosterCharts({})).length, 0);
});

test('missing runtime and enabled animation reject', async () => {
  const context = {window:{}, structuredClone};
  vm.runInNewContext(source, context);
  await assert.rejects(context.window.renderPosterCharts({a:spec()}), /unavailable/);
  const h = harness();
  await assert.rejects(h.render({a:{...spec(), animation:true}}), /Disable chart animation/);
});
