import test from "node:test";
import assert from "node:assert/strict";
import { orders, historyExample, createHistoryModel, historyDifference, historyStoryPose, blendHistoryStory, visibleHistory } from "../../skills/creative-data-storytelling/assets/examples/time-history/scene.mjs";
import { journeys, detailStoryPose, blendDetailStory } from "../../skills/creative-data-storytelling/assets/examples/overview-detail/scene.mjs";
import { quantitativePose, blendQuantitative } from "../../skills/creative-data-storytelling/assets/examples/comparison/scene.mjs";
import { amountExample, createAmountModel, amountPose, blendAmounts } from "../../skills/creative-data-storytelling/assets/examples/amounts/scene.mjs";
import { blendUnits } from "../../skills/creative-data-storytelling/assets/examples/units/scene.mjs";
import { at } from "../../skills/creative-data-storytelling/assets/runtime/geometry.mjs";
import { createTransition } from "../../skills/creative-data-storytelling/assets/runtime/motion.mjs";
import { trendExample, createTrendModel, trendPose, blendTrend, revealedPath, trendMarks } from "../../skills/creative-data-storytelling/assets/examples/material-trend/scene.mjs";
import { basisExample, createBasisModel, basisPose, blendBasis, basisReading } from "../../skills/creative-data-storytelling/assets/examples/comparison-basis/scene.mjs";
import { stockExample, createStockModel, stockPose, blendStock, stockGeometry, stockTotals } from "../../skills/creative-data-storytelling/assets/examples/increment-stock/scene.mjs";
import { recordExample, createRecordModel, recordPose, blendRecords, recordGeometry } from "../../skills/creative-data-storytelling/assets/examples/record-comparison/scene.mjs";
import { recurrenceExample, createRecurrenceModel, recurrencePose, blendRecurrence, recurrenceGeometry } from "../../skills/creative-data-storytelling/assets/examples/sequence-recurrence/scene.mjs";
import { skylineExample, createSkylineModel, skylinePose, blendSkyline, skylineGeometry, skylineComparison, skylineTicks } from "../../skills/creative-data-storytelling/assets/examples/material-height/scene.mjs";

test("joining buildings retains real heights and one shared scale in every animation frame", () => {
  const model = createSkylineModel(), snapshot = structuredClone(skylineExample);
  const stops = [...model.stops.keys()];
  for (let i = 1; i < stops.length; i++) {
    const from = skylinePose(stops[i - 1], model), to = skylinePose(stops[i], model);
    const old = skylineGeometry(model, from).filter(row => row.reveal === 1);
    for (const t of [0, .1, .3, .5, .8, .9, 1]) {
      const pose = blendSkyline(from, to, t), frame = skylineGeometry(model, pose);
      for (const node of frame) {
        assert.equal(node.ground, at(pose.scale, 0));
        assert.ok(Math.abs(node.height / node.row.height + pose.scale.k) < 1e-10);
        assert.ok(Math.abs(node.imageY + node.row.art.topY * node.materialScale - node.roof) < 1e-8);
        assert.ok(node.clipHeight >= 0 && node.clipHeight <= node.height);
      }
      for (const node of old) {
        const retained = frame.find(row => row.id === node.id);
        assert.equal(retained.reveal, 1);
        assert.equal(retained.roof, at(pose.scale, node.row.height));
        assert.equal(retained.row, node.row);
      }
    }
  }
  assert.deepEqual(skylineExample, snapshot);
});

test("building material calibration uses visible endpoints, preserving aspect ratio with padded images", () => {
  const config = structuredClone(skylineExample);
  config.buildings[0].art = { image: "padded.svg", width: 500, height: 1400, topY: 120, baseY: 1170 };
  const model = createSkylineModel(config), node = skylineGeometry(model, skylinePose("start", model))[0];
  assert.ok(Math.abs(node.width / node.imageHeight - 500 / 1400) < 1e-10);
  assert.ok(Math.abs(node.imageY + 1170 * node.materialScale - node.ground) < 1e-8);
  assert.ok(Math.abs(node.imageY + 120 * node.materialScale - node.roof) < 1e-8);
  assert.throws(() => createSkylineModel({ ...config, domain: [0, 800] }), /calibrated/);
  config.buildings[0].art.baseY = 1500;
  assert.throws(() => createSkylineModel(config), /calibrated/);
});

test("building entry makes room first and comparison labels wait for complete evidence", () => {
  const model = createSkylineModel(), from = skylinePose("chicago", model), to = skylinePose("twins", model);
  const early = blendSkyline(from, to, .25);
  assert.equal(early.nodes.get("petronas").reveal, 0);
  assert.notEqual(early.nodes.get("empire").x, from.nodes.get("empire").x);
  for (const t of [.2, .45, .7, .85, 1]) {
    const frame = blendSkyline(from, to, t);
    for (const note of frame.annotations.values()) {
      assert.equal(frame.nodes.get(note.a).reveal, 1);
      assert.equal(frame.nodes.get(note.b).reveal, 1);
    }
  }
  const backward = blendSkyline(to, from, .35);
  assert.equal(backward.nodes.get("empire").x, to.nodes.get("empire").x);
  assert.ok(backward.nodes.get("petronas").reveal < 1);
});

test("height comparisons follow replacement data and do not assume every later record is taller", () => {
  const config = structuredClone(skylineExample);
  config.buildings.find(row => row.id === "petronas").height = 410;
  const model = createSkylineModel(config), pose = skylinePose("twins", model);
  const note = skylineComparison(model, pose, [...pose.annotations.values()][0]);
  assert.ok(Math.abs(note.value + 32.1) < 1e-8);
  assert.equal(note.a.roof, at(pose.scale, 442.1));
  assert.equal(note.b.roof, at(pose.scale, 410));
  assert.equal(note.small, true);
  assert.ok(note.y < Math.min(note.a.roof, note.b.roof) - 22);
  config.stops[1].pair = ["empire", "burj"];
  assert.throws(() => createSkylineModel(config), /visible buildings/);
});

test("height entry reverses from its intermediate pose and settles at a readable target", () => {
  const from = skylinePose("empire"), to = skylinePose("leap");
  const transition = createTransition(from, { blend: blendSkyline, duration: 1000 });
  transition.target(to, 0);
  const middle = transition.sample(470).pose;
  transition.target(from, 470);
  assert.deepEqual(transition.sample(470).pose, middle);
  assert.deepEqual(transition.sample(1600).pose, from);
});

test("a larger skyline view rescales old objects and ticks before revealing the taller newcomer", () => {
  const model = createSkylineModel(), from = skylinePose("empire", model), to = skylinePose("chicago", model);
  const midway = blendSkyline(from, to, .32), ready = blendSkyline(from, to, .7);
  assert.ok(midway.scale.k > from.scale.k && midway.scale.k < to.scale.k);
  assert.equal(midway.scale.b, from.scale.b);
  assert.equal(midway.nodes.get("willis").reveal, 0);
  assert.deepEqual(ready.scale, to.scale);
  assert.ok(ready.nodes.get("willis").reveal > 0);
  for (const pose of [from, midway, ready, to]) {
    for (const tick of skylineTicks(model, pose)) assert.equal(tick.y, at(pose.scale, tick.value));
    const shapes = skylineGeometry(model, pose).filter(row => row.reveal > 0);
    for (const shape of shapes) assert.ok(shape.roof >= 62 - 1e-8);
    assert.ok(Math.abs(shapes[0].height / shapes[1].height - shapes[0].row.height / shapes[1].row.height) < 1e-10);
  }
  const reverse = blendSkyline(to, from, .35);
  assert.deepEqual(reverse.scale, to.scale);
  assert.ok(reverse.nodes.get("willis").reveal < 1);
});

test("each chosen view covers its records and can refocus the same comparison without changing quantities", () => {
  const config = structuredClone(skylineExample);
  config.stops = [
    { id: "wide", through: "empire", axisMax: 600, focus: ["empire"] },
    { id: "close", through: "empire", axisMax: 400, focus: ["empire"], pair: ["chrysler", "empire"] },
  ];
  const model = createSkylineModel(config), from = skylinePose("wide", model), to = skylinePose("close", model);
  const middle = blendSkyline(from, to, .3);
  assert.ok(middle.scale.k < from.scale.k && middle.scale.k > to.scale.k);
  for (const node of skylineGeometry(model, middle).filter(row => row.reveal > 0)) {
    assert.ok(Math.abs(node.height / -middle.scale.k - node.row.height) < 1e-8);
  }
  config.stops[1].axisMax = 350;
  assert.throws(() => createSkylineModel(config), /cover all visible/);
});

test("joining records preserves every old quantity on one scale without summing lengths", () => {
  const model = createRecordModel(), snapshot = structuredClone(recordExample);
  const stops = recordExample.stops.filter(stop => !stop.pair).map(stop => stop.id);
  for (let i = 1; i < stops.length; i++) {
    const [before, after] = [stops[i - 1], stops[i]];
    const a = recordPose(before, model), b = recordPose(after, model);
    const old = recordGeometry(model, a).filter(row => row.reveal === 1);
    for (const t of [0, .2, .35, .6, .9, 1]) {
      const frame = recordGeometry(model, blendRecords(a, b, t));
      for (const row of frame) {
        assert.equal(row.zero, at(model.scale, 0));
        assert.equal(row.width, at(model.scale, row.row.value) - row.zero);
        assert.ok(row.clipWidth >= 0 && row.clipWidth <= row.width);
      }
      for (const row of old) {
        const retained = frame.find(node => node.id === row.id);
        assert.equal(retained.reveal, 1);
        assert.equal(retained.row, row.row);
        assert.equal(retained.end, row.end);
      }
    }
  }
  assert.deepEqual(recordExample, snapshot);
});

test("record reflow makes room before revealing new bars and responds to replacement values", () => {
  const model = createRecordModel(), a = recordPose("reference", model), b = recordPose("latest", model);
  const early = blendRecords(a, b, .2), ready = blendRecords(a, b, .35);
  assert.equal(early.nodes.get("maple").reveal, 0);
  assert.equal(ready.nodes.get(model.baselineId).y, b.nodes.get(model.baselineId).y);
  const config = {
    metric: "板材长度", unit: "毫米", baselineId: "reference/甲", records: [
      { id: "reference/甲", value: 12 }, { id: "variant/乙", value: 40 }, { id: "variant/丙", value: 27 },
    ],
    stops: [
      { id: "one", visible: ["reference/甲"], focus: ["reference/甲"] },
      { id: "pair", visible: ["reference/甲", "variant/乙", "variant/丙"], focus: ["variant/乙", "variant/丙"], pair: ["variant/乙", "variant/丙"] },
    ],
  };
  const changed = createRecordModel(config), pose = recordPose("pair", changed);
  assert.equal([...pose.annotations.values()][0].value, 13);
  assert.ok(recordGeometry(changed, pose).every(row => Math.abs(row.width - row.row.value * changed.scale.k) < 1e-8));
  assert.throws(() => createRecordModel({ ...config, axis: { max: 20, ticks: [0, 20] } }), /cover every record/);
});

test("recurrence links wait for both source occurrences while source positions stay fixed", () => {
  const model = createRecurrenceModel(), snapshot = structuredClone(recurrenceExample);
  const a = recurrencePose("first", model), b = recurrencePose("reverse", model);
  for (const t of [0, .1, .25, .4, .6, .9, 1]) {
    const geometry = recurrenceGeometry(model, blendRecurrence(a, b, t));
    for (const node of geometry.nodes) assert.equal(node.x, at(model.x, node.row.scene.order));
    for (const link of geometry.links) {
      if (link.draw > 0) {
        assert.equal(geometry.nodes.find(node => node.id === link.from).reveal, 1);
        assert.equal(geometry.nodes.find(node => node.id === link.to).reveal, 1);
      }
    }
  }
  assert.equal(recurrenceGeometry(model, a).links.filter(link => link.draw > 0).length, 0);
  assert.ok(recurrenceGeometry(model, b).links.every(link => link.draw === 1));
  assert.deepEqual(recurrenceExample, snapshot);
});

test("recurrence geometry follows changed source positions and refuses unsupported links", () => {
  const changed = structuredClone(recurrenceExample);
  changed.scenes = changed.scenes.map(scene => ({ ...scene, order: scene.order * 3 }));
  changed.occurrences[1].sceneId = "holiday";
  const model = createRecurrenceModel(changed);
  assert.equal(recurrenceGeometry(model, recurrencePose("whole", model)).nodes[1].x, at(model.x, 12));
  changed.links[0].from = "missing";
  assert.throws(() => createRecurrenceModel(changed), /existing endpoints/);
  changed.links[0].from = "first-call"; changed.links[0].basis = "";
  assert.throws(() => createRecurrenceModel(changed), /evidence basis/);
});

test("joining records and recurrence arcs reverse from the sampled intermediate pose", () => {
  for (const [from, to, blend] of [
    [recordPose("reference"), recordPose("latest"), blendRecords],
    [recurrencePose("first"), recurrencePose("reverse"), blendRecurrence],
  ]) {
    const transition = createTransition(from, { blend, duration: 1000 });
    transition.target(to, 0);
    const middle = transition.sample(470).pose;
    transition.target(from, 470);
    assert.deepEqual(transition.sample(470).pose, middle);
    assert.deepEqual(transition.sample(1600).pose, from);
  }
});

test("trend uses same-period yearly changes, preserves source dates and changes only vertical positions", () => {
  const snapshot = structuredClone(trendExample), model = createTrendModel();
  const price = trendPose("rise", model), rate = trendPose("rate", model);
  assert.equal(model.primary.points.length, 16);
  assert.equal(model.byId.get("bread").points.length, 30);
  assert.ok(Math.abs(model.primary.points.at(-1).yoy - (7.75 / 7.45 - 1) * 100) < 1e-10);
  assert.ok(model.primary.points.find(p => p.id === "burger-2022-1").yoy < 0);
  for (const t of [0, 0.2, 0.5, 0.8, 1]) {
    const frame = blendTrend(price, rate, t);
    for (const [id, node] of frame.nodes) {
      assert.equal(node.x, price.nodes.get(id).x);
      assert.equal(node.row, price.nodes.get(id).row);
      assert.ok(Number.isFinite(node.y));
    }
  }
  assert.equal(blendTrend(price, rate, 0.5).annotations.size, 0);
  const broken = structuredClone(trendExample);
  broken.series[0].observations.find(p => p.id === "burger-2022-1").previousId = "burger-2021-2";
  assert.throws(() => createTrendModel(broken), /prior-year record/);
  const absent = structuredClone(trendExample);
  absent.series[0].observations = absent.series[0].observations.filter(p => p.id !== "burger-2016-1");
  assert.throws(() => createTrendModel(absent), /prior-year record/);
  assert.deepEqual(trendExample, snapshot);
});

test("chronological reveal retains earlier material marks at their actual observations without image leaders", () => {
  const model = createTrendModel(), from = trendPose("early", model), to = trendPose("pause", model);
  const earlier = new Set(trendMarks(model, from).filter(p => p.opacity > 0).map(p => p.id));
  for (const t of [0, 0.2, 0.5, 0.8, 1]) {
    const frame = blendTrend(from, to, t), marks = trendMarks(model, frame).filter(p => p.opacity > 0);
    assert.ok([...earlier].every(id => marks.some(p => p.id === id)));
    for (const mark of marks) {
      assert.equal(mark.x, frame.nodes.get(mark.id).x);
      assert.equal(mark.y, frame.nodes.get(mark.id).y);
      assert.ok(mark.row.image.endsWith(".svg"));
      assert.equal(mark.point, frame.nodes.get(mark.id).row);
    }
  }
  const a = trendPose("rate", model), b = trendPose("bread", model);
  for (const t of [0, 0.2, 0.5, 0.8, 1]) {
    const pose = blendTrend(a,b,t), line = pose.lines.get("burger");
    assert.equal(line.reveal, model.primary.points.length - 1);
    assert.equal(line.opacity, 1);
    assert.deepEqual(revealedPath(line.row,pose.nodes,line.reveal).end,pose.nodes.get(model.primary.points.at(-1).id));
  }
  const compared = trendMarks(model,b).filter(p => p.opacity > 0);
  assert.deepEqual(compared.map(p=>p.id), [model.primary.points.at(-1).id,model.byId.get("bread").comparisonMarkId]);
  assert.ok(compared.every(p=>p.x===b.nodes.get(p.id).x && p.y===b.nodes.get(p.id).y));
});

test("raw-only material trends need no frequency or prior-year data and preserve observations through interruption", () => {
  const config = { primaryId: "cups", metric: "零售价", unit: "元", startDate: "2020-01-01", endDate: "2023-01-01",
    series: [{ id: "cups", name: "杯子", image: "cup.svg", observations: [1200, 1500, 1300, 1800].map((value, i) =>
      ({ id: "cup-" + i, date: `${2020 + i}-01-01`, value })) }],
    stops: [{ id: "start", basis: "raw", visible: ["cups"], throughId: "cup-0" },
      { id: "end", basis: "raw", visible: ["cups"], throughId: "cup-3" }] };
  const snapshot = structuredClone(config), model = createTrendModel(config);
  assert.equal(model.rateScale, null);
  assert.deepEqual(model.rateTicks, []);
  assert.ok(model.rawTicks.length < 20);
  const start = trendPose("start", model), end = trendPose("end", model);
  assert.equal([...end.annotations.values()][0].text, "1,800 元");
  const transition = createTransition(start, { blend: blendTrend, duration: 1000 });
  transition.target(end, 0);
  const middle = transition.sample(500).pose;
  assert.ok(trendMarks(model, middle).some(mark => mark.opacity > 0 && mark.id === "cup-0"));
  assert.ok([...middle.nodes.values()].every(node => Number.isFinite(node.x) && Number.isFinite(node.y)));
  transition.target(start, 500);
  assert.deepEqual(transition.sample(500).pose, middle);
  assert.deepEqual(transition.sample(1600).pose, start);
  assert.deepEqual(config, snapshot);
  const withRate = { ...config, stops: [...config.stops, { id: "rate", basis: "yoy", visible: ["cups"] }] };
  assert.throws(() => createTrendModel(withRate), /frequency/);
  assert.throws(() => createTrendModel({ ...withRate, series: [{ ...config.series[0], frequency: 1 }] }), /prior-year/);
});

test("a trend series unused by rate readings does not need synthetic year-ago observations", () => {
  const config = structuredClone(trendExample);
  config.stops = config.stops.filter(stop => stop.id !== "beef");
  const row = config.series.find(row => row.id === "beef");
  row.observations = row.observations.filter(point => point.date >= config.startDate);
  row.observations.forEach(point => { delete point.previousId; });
  delete row.frequency;
  const model = createTrendModel(config), pose = trendPose("bread", model);
  assert.equal(pose.lines.get("beef").opacity, 0);
  assert.ok([...pose.nodes.values()].every(node => Number.isFinite(node.y)));
  assert.ok(model.primary.points.every(point => Number.isFinite(point.yoy)));
});

test("basis comparison preserves raw totals in equal shares and derives final person rates from the same records", () => {
  const model = createBasisModel(), shares = basisPose("shares", model), rate = basisPose("rate", model);
  for (const row of model.rows) {
    const parts = [...shares.nodes.values()].filter(node => node.row.id === row.id);
    assert.equal(parts.length, row.population / model.quantum);
    assert.ok(Math.abs(parts.reduce((sum, part) => sum + part.width, 0) - (at(model.rawScale, row.amount) - at(model.rawScale, 0))) < 1e-8);
    const selected = rate.nodes.get(`${row.id}/0`);
    assert.equal(selected.x, at(model.rateScale, 0));
    assert.equal(selected.width, at(model.rateScale, row.amount / row.population) - selected.x);
    assert.equal(parts.filter(part => rate.nodes.get(part.id).opacity === 1).length, 1);
    assert.equal(basisReading(model, row, "rate"), `${row.rate} 册 / 人`);
  }
  const alternate = createBasisModel({ ...basisExample, rows: basisExample.rows.map((row, i) => ({ ...row, amount: i ? 30 : 240 })) });
  assert.deepEqual(alternate.rows.map(row => row.rate), [6, 2]);
  assert.throws(() => createBasisModel({ ...basisExample, quantum: 7 }), /whole population groups/);
  assert.throws(() => createBasisModel({ ...basisExample, rows: basisExample.rows.map(row => ({ ...row, population: 0 })) }), /population must be positive/);
});

test("annual columns preserve year, identity and quantity through scale change and cumulative assembly", () => {
  const snapshot = structuredClone(stockExample), model = createStockModel();
  const annual = stockGeometry(model,stockPose("annual",model)), assembled = stockGeometry(model,stockPose("accumulate",model));
  assert.deepEqual(stockTotals(model,3),[1920,2500]);
  assert.ok(annual.segments.every(p => p.start === 0));
  const from = stockPose("annual",model), to = stockPose("accumulate",model);
  for (const t of [0,.15,.3,.45,.6,.75,.9,1]) {
    const pose=blendStock(from,to,t), geometry=stockGeometry(model,pose);
    for (const segment of geometry.segments) {
      const original=annual.segments.find(p=>p.id===segment.id);
      assert.equal(segment.x,original.x);
      assert.equal(segment.row,original.row);
      assert.ok(Math.abs(segment.end-segment.start-segment.row.amount)<1e-8);
      assert.ok(Math.abs(segment.height / -geometry.scale.k-segment.row.amount)<1e-8);
    }
  }
  for (const archive of model.archives) {
    const segments=assembled.segments.filter(p=>p.archive.id===archive.id);
    assert.equal(segments[0].start,archive.base);
    for(let i=1;i<segments.length;i++) assert.equal(segments[i].start,segments[i-1].end);
    assert.equal(segments.at(-1).end,archive.total);
  }
  assert.ok(assembled.connectors.every(p=>p.opacity===1));
  assert.deepEqual(stockExample,snapshot);
  assert.throws(()=>stockTotals(model,1.5),/completed observation/);
  assert.throws(()=>createStockModel({...stockExample,archives:stockExample.archives.map(a=>({...a,additions:[{id:"negative",year:2022,amount:-1}]}))}),/nonnegative/);
});

test("cumulative assembly changes scale before lifting and recomputes replacement quantities", () => {
  const model=createStockModel(), flat=stockGeometry(model,{assembly:.25,focus:0});
  assert.equal(flat.zoom,1);
  assert.ok(flat.segments.every(p=>p.start===0));
  const changed=createStockModel({...stockExample,archives:stockExample.archives.map((a,i)=>({...a,base:i?400:100,additions:a.additions.map((r,j)=>({...r,amount:i?20:50*(j+1)}))}))});
  assert.deepEqual(stockTotals(changed,3),[400,460]);
  const end=stockGeometry(changed,stockPose("compare",changed));
  assert.deepEqual(end.segments.filter(p=>p.row.year===2024).map(p=>p.end),[400,460]);
  assert.equal(stockPose("compare",changed).annotations.get("gap").value,60);
});

test("all new explanations can reverse from an unfinished frame without snapping to an endpoint", () => {
  for (const [from, to, blend] of [
    [trendPose("bread"), trendPose("beef"), blendTrend],
    [basisPose("shares"), basisPose("rate"), blendBasis],
    [stockPose("annual"), stockPose("accumulate"), blendStock],
  ]) {
    const transition = createTransition(from, { blend, duration: 1000 });
    transition.target(to, 0);
    const interrupted = transition.sample(450).pose;
    transition.target(from, 450);
    assert.deepEqual(transition.sample(450).pose, interrupted);
    assert.deepEqual(transition.sample(1600).pose, from);
  }
});

test("unit release accepts arbitrary stable ids and keeps finite geometry when redirected", () => {
  const nodes = new Map(["球员-甲", "player-alpha", "record/🎵"].map((id, i) =>
    [id, { id, row: { id }, x: i * 30, y: 50, area: 64, opacity: 1 }]));
  const from = { mode: "cover", nodes, scale: { k: 1, b: 0 }, axisOpacity: 0 };
  const to = { ...from, mode: "distribution", axisOpacity: 1,
    nodes: new Map([...nodes].map(([id, node]) => [id, { ...node, x: node.x + 150, y: 250 }])) };
  const snapshot = structuredClone(from);
  for (const t of [0, 0.2, 0.5, 0.8, 1]) {
    const frame = blendUnits(from, to, t);
    assert.deepEqual([...frame.nodes.keys()], [...nodes.keys()]);
    assert.ok([...frame.nodes.values()].every((node) => Number.isFinite(node.x) && Number.isFinite(node.y) && node.area === 64));
  }
  const middle = blendUnits(from, to, 0.5);
  const reordered = blendUnits({ ...from, nodes: new Map([...from.nodes].reverse()) }, to, 0.5);
  for (const [id, node] of middle.nodes) assert.deepEqual(reordered.nodes.get(id), node);
  const transition = createTransition(from, { blend: blendUnits, duration: 1000 });
  transition.target(to, 0);
  const beforeReverse = transition.sample(400).pose;
  transition.target(from, 400);
  assert.deepEqual(transition.sample(400).pose, beforeReverse);
  assert.deepEqual(transition.sample(1500).pose, from);
  assert.deepEqual(from, snapshot);
});

const alternateAmounts = {
  base: { id: "stock", name: "期初", amount: 12.5, color: "#aaa" },
  additions: [
    { id: "first", name: "一批", amount: 2.25, color: "#456" },
    { id: "none", name: "二批", amount: 0, color: "#678" },
    { id: "last", name: "三批", amount: 25, color: "#789" },
  ],
  unit: "万吨", digits: 2,
};

test("amount geometry, annotations and shared readings derive from replacement data", () => {
  const snapshot = structuredClone(alternateAmounts), model = createAmountModel(alternateAmounts);
  assert.equal(model.added.total, 27.25);
  assert.equal(model.total.total, 39.75);
  const pose = amountPose("base", model);
  assert.equal(pose.nodes.get("stock").end, 12.5);
  assert.equal(pose.nodes.get("first").start, 12.5);
  assert.equal(pose.nodes.get("last").end, model.total.total);
  assert.equal(pose.annotations.get("cumulative-total").value, model.total.total);
  assert.ok(pose.annotations.get("cumulative-total").text.endsWith(model.format.format(model.total.total)));
  assert.ok(at(model.scale, model.total.total) < 805);
  assert.deepEqual(alternateAmounts, snapshot);
  const zero = createAmountModel({ ...alternateAmounts, base: { ...alternateAmounts.base, amount: 0 },
    additions: alternateAmounts.additions.map((row) => ({ ...row, amount: 0 })) });
  assert.ok(Number.isFinite(at(zero.scale, 0)));
  assert.equal(new Set(zero.ticks.map(zero.format.number)).size, zero.ticks.length);
});

test("unfolding and adding the base preserve each increment length including reverse transitions", () => {
  const model = createAmountModel(alternateAmounts);
  const poses = ["whole", "parts", "base", "total", "whole"].map((mode) => amountPose(mode, model));
  for (let i = 1; i < poses.length; i++) for (const t of [0, 0.2, 0.5, 0.8, 1]) {
    const frame = blendAmounts(poses[i - 1], poses[i], t);
    for (const row of model.additions) {
      const segment = frame.nodes.get(row.id);
      assert.ok(Math.abs(segment.end - segment.start - row.amount) < 1e-8);
      assert.equal(segment.row, row);
    }
  }
  const transition = createTransition(poses[1], { blend: blendAmounts, duration: 1000 });
  transition.target(poses[2], 0);
  const middle = transition.sample(500).pose;
  transition.target(poses[0], 500);
  assert.deepEqual(transition.sample(500).pose, middle);
  assert.deepEqual(transition.sample(1600).pose, poses[0]);
});

test("amount examples reject a reused base id or a negative increment before drawing", () => {
  assert.throws(() => createAmountModel({ ...amountExample, base: { ...amountExample.base, id: "first" } }), /unique/);
  assert.throws(() => createAmountModel({ ...amountExample, additions: [{ id: "negative", amount: -1 }] }), /nonnegative/);
});

test("revealing later history retains earlier observations and never invents an interpolated record", () => {
  const from = historyStoryPose("fall"), to = historyStoryPose("recovery");
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    const pose = blendHistoryStory(from, to, progress), visible = visibleHistory(orders, pose.through);
    assert.deepEqual(visible.slice(0, 5), orders.slice(0, 5));
    assert.ok(visible.every((row) => orders.includes(row) && row.year <= pose.through));
  }
  assert.throws(() => createHistoryModel({ ...historyExample, rows: [orders[1], orders[0]] }), /increasing/);
});

const alternateHistory = {
  rows: [8, 10, 10, 12, 15].map((value, i) => ({ id: `reading-${i}`, year: 2000 + i, value })),
  baselineId: "reading-1", metric: "模拟年度利用量", unit: "万吨",
  stops: [
    { id: "start", throughId: "reading-1" },
    { id: "same", throughId: "reading-2", showComparison: true },
    { id: "above", throughId: "reading-3", showComparison: true },
  ],
};

test("history adaptation derives the scale and comparison from configured records, not default years or the final row", () => {
  const snapshot = structuredClone(alternateHistory), model = createHistoryModel(alternateHistory);
  const pose = historyStoryPose("above", model);
  assert.equal(pose.through, 2003);
  assert.equal(model.readings.get("above").row, alternateHistory.rows[3]);
  assert.equal(model.readings.get("above").delta, 2);
  assert.equal(historyDifference(model, "above"), "高 2 万吨");
  assert.equal(historyDifference(model, "same"), "与基准持平");
  assert.equal(historyDifference(createHistoryModel(historyExample), "compare"), "低 3 万单");
  assert.equal(at(model.scales.x, 2000), 75);
  assert.equal(at(model.scales.x, 2004), 1020);
  assert.ok(model.rows.every((row) => at(model.scales.y, row.value) >= 65 && at(model.scales.y, row.value) <= 470));
  assert.deepEqual(alternateHistory, snapshot);
});

test("a changed comparison retires the old endpoint claim before revealing the new one and can reverse in flight", () => {
  const model = createHistoryModel(alternateHistory), a = historyStoryPose("same", model), b = historyStoryPose("above", model);
  const middle = blendHistoryStory(a, b, 0.5), arriving = blendHistoryStory(a, b, 0.9);
  assert.deepEqual([...middle.annotations.values()].map((item) => item.role), ["baseline"]);
  assert.equal(arriving.through, 2003);
  assert.equal([...arriving.annotations.values()].find((item) => item.role === "gap").row, alternateHistory.rows[3]);
  const transition = createTransition(a, { blend: blendHistoryStory, duration: 1000 });
  transition.target(b, 0);
  const beforeReverse = transition.sample(500).pose;
  transition.target(a, 500);
  assert.deepEqual(transition.sample(500).pose, beforeReverse);
  assert.deepEqual(transition.sample(1600).pose, a);
});

test("invalid history references and clipping domains fail before rendering", () => {
  assert.throws(() => createHistoryModel({ ...alternateHistory, baselineId: "missing" }), /baselineId/);
  assert.throws(() => createHistoryModel({ ...alternateHistory, stops: [{ id: "missing", throughId: "unknown" }] }), /endpoints/);
  assert.throws(() => createHistoryModel({ ...alternateHistory, stops: alternateHistory.stops.toReversed() }), /in order/);
  assert.throws(() => createHistoryModel({ ...alternateHistory, axis: { domain: [10, 15] } }), /cover every/);
  const flat = createHistoryModel({ ...alternateHistory, rows: alternateHistory.rows.map((row) => ({ ...row, value: 0 })) });
  assert.ok(Number.isFinite(at(flat.scales.y, 0)));
});

test("detail extraction keeps a fixed zero and accurate bar lengths throughout rescaling", () => {
  const from = detailStoryPose("select"), to = detailStoryPose("compare");
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    const pose = blendDetailStory(from, to, progress), a = pose.nodes.get("river"), b = pose.nodes.get("hill");
    assert.equal(a.row, journeys[3]);
    assert.equal(b.row, journeys[9]);
    const pixelsPerMinute = at(pose.scale, 1) - at(pose.scale, 0);
    assert.equal(at(pose.scale, 0), at(from.scale, 0));
    for (const node of [a, b]) {
      assert.ok(Math.abs((at(pose.scale, node.row.minutes) - at(pose.scale, 0)) / pixelsPerMinute - node.row.minutes) < 1e-8);
    }
    assert.ok(Math.abs((at(pose.scale, b.row.minutes) - at(pose.scale, a.row.minutes)) / pixelsPerMinute - 12) < 1e-8);
  }
  assert.throws(() => detailStoryPose("compare", journeys, ["river", "unknown"]), /selected ids/);
  assert.throws(() => detailStoryPose("overview", journeys.map((row, i) => i ? row : { ...row, minutes: -1 })), /nonnegative/);
  assert.ok(Number.isFinite(detailStoryPose("overview", journeys.map((row) => ({ ...row, minutes: 0 }))).scale.k));
});

test("detail extraction accepts a larger label column and more rows without changing identity or zero", () => {
  const rows = Array.from({ length: 16 }, (_, i) => ({ id: "route-" + i, label: "经过老城区的路线 " + i, minutes: 12 + i * 3, km: 5 }));
  const selected = ["route-1", "route-14"], layout = { width: 1240, height: 660, left: 420, right: 1140,
    secondaryX: 320, bottom: 560, rowGap: 30, compareTop: 180, compareGap: 230 };
  const a = detailStoryPose("select", rows, selected, layout), b = detailStoryPose("compare", rows, selected, layout);
  for (const t of [0, .25, .5, .9, 1]) {
    const pose = blendDetailStory(a, b, t);
    assert.equal(at(pose.scale, 0), layout.left);
    for (const node of pose.nodes.values()) {
      assert.equal(node.row, rows.find(row => row.id === node.id));
      assert.ok(node.y >= pose.layout.top && node.y < pose.layout.bottom);
    }
  }
  assert.equal(b.nodes.get(selected[1]).y, layout.compareTop + layout.compareGap);
  assert.throws(() => detailStoryPose("overview", rows, selected), /layout.*room/);
  assert.throws(() => detailStoryPose("compare", rows, selected, { ...layout, compareGap: 500 }), /layout.*room/);
});

test("sample bars retain zero, source values and identity during extraction and changing comparison partners", () => {
  const targets = [quantitativePose("overview"), quantitativePose("locate"), quantitativePose("compare"),
    quantitativePose("explore", "A"), quantitativePose("explore", "D"), quantitativePose("overview")];
  for (let i = 1; i < targets.length; i++) {
    const from = targets[i - 1], to = targets[i];
    for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
      const pose = blendQuantitative(from, to, progress);
      assert.equal(at(pose.scale, 0), at(from.scale, 0));
      assert.equal(pose.nodes.get("P").row, from.nodes.get("P").row);
      for (const node of pose.nodes.values()) {
        const length = at(pose.scale, node.value) - at(pose.scale, 0);
        assert.ok(Math.abs(length / pose.scale.k - node.row.value) < 1e-8);
      }
    }
  }
});

test("sample extraction can reverse midway without jumping or exposing an obsolete difference", () => {
  const from = quantitativePose("locate"), to = quantitativePose("compare");
  assert.equal(blendQuantitative(from, to, 0.5).annotations.size, 0);
  const transition = createTransition(from, { blend: blendQuantitative, duration: 1000 });
  transition.target(to, 0);
  const middle = transition.sample(500).pose;
  transition.target(quantitativePose("overview"), 500);
  assert.deepEqual(transition.sample(500).pose, middle);
  assert.equal(transition.sample(1600).moving, false);
});

test("comparison annotations wait for geometry and reversing an unfinished extraction does not jump", () => {
  const from = detailStoryPose("select"), to = detailStoryPose("compare");
  assert.equal(blendDetailStory(from, to, 0.5).annotations.size, 0);
  const arriving = blendDetailStory(from, to, 0.9);
  assert.ok(arriving.annotations.get("time-gap").opacity > 0);
  assert.deepEqual(arriving.scale, to.scale);
  const transition = createTransition(from, { blend: blendDetailStory, duration: 1000 });
  transition.target(to, 0);
  const middle = transition.sample(500).pose;
  transition.target(detailStoryPose("overview"), 500);
  assert.deepEqual(transition.sample(500).pose, middle);
  assert.equal(transition.sample(1600).moving, false);
});
