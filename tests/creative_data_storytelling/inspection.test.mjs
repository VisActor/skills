import test from "node:test";
import assert from "node:assert/strict";
import { createInspection } from "../../skills/creative-data-storytelling/assets/runtime/inspection.mjs";

// Contract double: real SVG/HTML geometry and scrolling are checked in the browser.
function fixture() {
  let time = 0, onWait = () => {};
  const selectors = new Map(), children = [], attributes = new Map();
  const view = { innerWidth: 1280, innerHeight: 720, performance: { now: () => time },
    getComputedStyle: element => element.style,
    setTimeout(fn, ms) { queueMicrotask(() => { time += ms; onWait(time); fn(); }); },
  };
  const doc = { defaultView: view,
    fonts: { check: () => true },
    getElementById: id => children.find(child => child.id === id),
    querySelector: selector => selectors.get(selector) ?? null,
    querySelectorAll: selector => selectors.get(selector) ?? [],
    createElement() { return Object.assign(new EventTarget(), { textContent: "", setAttribute(k,v) { attributes.set(k,v); },
      getAttribute: k => attributes.get(k) ?? null, remove() { children.splice(children.indexOf(this), 1); } }); },
    body: { append: node => children.push(node) },
  };
  const element = (text = "", x = 10, y = 10, width = 80, height = 20) => ({
    ownerDocument: doc, isConnected: true, textContent: text, style: { display: "block", visibility: "visible", opacity: "1", font: "16px sans-serif" },
    rect: { x,y,width,height }, getBoundingClientRect() { return { ...this.rect }; }, getClientRects() { return [this.rect]; },
  });
  const root = element("", 0,0,800,500), label = element("0");
  selectors.set("#readout", label);
  const state = { target: { id: "all", revision: 1 }, rendered: { revision: 1, final: true },
    size: { width: 800, height: 500 }, disposed: false, error: null };
  const connection = { stage: { element: root, status: () => structuredClone(state) } };
  return { root,label,element,state,connection,selectors,children,doc,view,
    wait: fn => { onWait = fn; },
    make: checks => createInspection(connection, { checks }),
  };
}
const readout = () => ({ targets: [{ id: "value", element: "#readout", expected: 0 }],
  bounds: [{ type: "inside", ids: ["value"], within: "$stage" }] });

test("each capture retains detail for code and publishes only coverage and issues by default", async () => {
  const f = fixture(), probe = f.make(readout);
  const a = await probe.capture({ target: "all" }), b = await probe.capture({ target: "all" });
  assert.equal(a.phase, "captured");
  assert.equal(a.measured.items[0].match, true);
  assert.ok(b.captureId > a.captureId);
  assert.equal(b.stage.target.revision, a.stage.target.revision);
  const summary = JSON.parse(probe.output.textContent);
  assert.equal(summary.captureId, b.captureId);
  assert.deepEqual(summary.coverage, { targets: ["value"], readouts: ["value"], relationships: 1, groups: [], skipped: [] });
  assert.deepEqual(summary.issues, []);
  assert.equal(Object.hasOwn(summary, "measured"), false);
  assert.deepEqual(summary.viewport, b.viewport);
  probe.dispose(); assert.equal(f.children.length, 0);
});

test("expected target and revision prevent an old final from satisfying a new check", async () => {
  const f = fixture(), probe = f.make(readout);
  f.wait(time => {
    if (time === 32) { f.state.target = { id: "focus", revision: 2 }; f.state.rendered.final = false; }
    if (time === 64) f.state.rendered = { revision: 2, final: true };
  });
  const result = await probe.capture({ target: "focus", after: 1 });
  assert.equal(result.phase, "captured");
  assert.equal(result.stage.rendered.revision, 2);
});

test("timeout reports a missing expected update instead of accepting a previous final", async () => {
  const f = fixture(), probe = f.make(readout);
  const result = await probe.capture({ target: "all", after: 1, timeout: 64 });
  assert.equal(result.phase, "timeout");
  assert.equal(typeof result.reason, "string");
  assert.equal(result.observation, null);
  assert.deepEqual(result.pending, { condition: "target", expected: {id:"all",after:1}, observed:{id:"all",revision:1} });
});

test("replaced labels are resolved again and two observations use the current DOM", async () => {
  const f = fixture(), probe = f.make(readout); f.label.textContent = "old";
  f.wait(time => { if (time === 32) { f.label.isConnected = false; f.selectors.set("#readout", f.element("0",30)); } });
  const result = await probe.capture({ target: "all" });
  assert.equal(result.phase, "captured");
  assert.equal(result.measured.items[0].actual, "0");
  assert.equal(result.measured.items[0].box.x, 30);
});

test("missing, hidden, inactive and wrong readouts stay visible in the report", async () => {
  const f = fixture(); f.label.style.opacity = "0";
  f.selectors.set("#wrong", f.element("9"));
  const probe = f.make(() => ({ targets: [
    { id: "missing", element: "#absent", expected: 2 },
    { id: "hidden", element: "#readout", expected: 0 },
    { id: "later", element: "#later", when: false },
    { id: "wrong", element: "#wrong", expected: 7 },
  ], bounds: [{ type: "inside", ids: ["later"], within: "$stage" }] }));
  const result = await probe.capture({ target: "all" });
  assert.deepEqual(result.measured.items.map(item => item.status), ["missing","hidden","not-applicable","measured"]);
  assert.equal(result.measured.items[3].match, false);
  assert.deepEqual(result.bounds.notApplicable, [0]);
  const summary = JSON.parse(probe.output.textContent);
  assert.equal(summary.phase, "captured"); // Collection can finish with actual problems.
  assert.deepEqual(summary.issues, [
    {type:"unavailable",id:"missing",status:"missing"},
    {type:"unavailable",id:"hidden",status:"hidden"},
    {type:"readout",id:"wrong",expected:"7",actual:"9"},
  ]);
  assert.deepEqual(summary.coverage.targets, ["wrong"]);
});

test("layout waits for the measured container size and declared fonts/images, with bounded failure", async () => {
  const f = fixture(); f.root.rect.width = 600; f.doc.fonts.check = () => false;
  const probe = f.make(readout);
  f.wait(time => { if (time === 32) f.state.size.width = 600; });
  const result = await probe.capture({ target: "all", timeout: 96 });
  assert.equal(result.phase, "timeout");
  assert.equal(result.observation.measured.items[0].status, "loading");
  assert.deepEqual(result.pending, {condition:"resources",items:[{id:"value",waiting:["font"]}]});
  f.doc.fonts.check = () => true;
  Object.assign(f.label, { tagName: "IMG", complete: true, naturalWidth: 0 });
  const broken = await probe.capture({ target: "all" });
  assert.equal(broken.measured.items[0].status, "resource-error");
});

test("fast reversal supersedes a pending target, and concurrent requests cannot overwrite the latest", async () => {
  const f = fixture(); f.state.rendered.final = false;
  const probe = f.make(readout);
  f.wait(() => { f.state.target = { id: "focus", revision: 2 }; });
  const reversed = await probe.capture({ target: "all" });
  assert.equal(reversed.phase, "superseded");
  f.wait(() => {}); f.state.rendered = { revision: 2, final: true };
  const older = probe.capture({ target: "focus" }), latest = probe.capture({ target: "focus" });
  assert.equal((await older).phase, "superseded");
  const result = await latest;
  assert.equal(result.phase, "captured");
  assert.equal(JSON.parse(probe.output.textContent).captureId, result.captureId);
});

test("groups compare data identities to mounted records/options and retain missing and duplicate counts", async () => {
  const f = fixture();
  f.selectors.set("option", ["a","a","c"].map(value => Object.assign(f.element(), { value })));
  const probe = f.make(() => ({ groups: [{ id: "choices", elements: "option", expected: ["a","b"], key: el => el.value }] }));
  const result = await probe.capture({ target: "all" });
  assert.deepEqual(result.groups[0], { id:"choices",status:"counted",expectedCount:2,actualCount:3,
    duplicates:1,missingCount:1,unexpectedCount:1,missing:["b"],unexpected:["c"] });
  const summary = JSON.parse(probe.output.textContent);
  assert.deepEqual(summary.coverage.groups, ["choices"]);
  assert.equal(summary.issues[0].type, "identities");
  assert.deepEqual(summary.issues[0].unexpected, ["c"]);
});

test("unknown targets, invalid group identities and capture options fail explicitly", async () => {
  const f = fixture(), probe = f.make(() => ({ bounds: [{type:"inside",ids:["typo"],within:"$stage"}] }));
  const result = await probe.capture({ target: "all" });
  assert.equal(result.phase, "error"); assert.match(result.error.message, /unknown target/);
  await assert.rejects(probe.capture({ target: "all", timeout: Infinity }), /Capture requires/);
  await assert.rejects(probe.capture({ target: "all", detail: "true" }), /boolean detail/);
  probe.dispose();
  const other = f.make(() => ({ groups: [{ id:"invalid",expected:[undefined],elements:()=>[],key:el=>el.id }] }));
  assert.equal((await other.capture({ target:"all" })).phase, "error");
});

test("DOM transport can opt into detail without changing the capture checks", async () => {
  const f = fixture(), probe = f.make(readout);
  probe.output.setAttribute("data-request", JSON.stringify({target:"all",detail:true}));
  probe.output.dispatchEvent(new Event("story-inspect"));
  for (let i=0; i<5; i++) await Promise.resolve();
  const report = JSON.parse(probe.output.textContent);
  assert.equal(report.phase, "captured");
  assert.equal(report.measured.items[0].actual, "0");
  assert.equal(report.bounds.checked, 1);
});

test("timeouts distinguish unmet observations without calling them rendering failures", async t => {
  for (const [condition, setup] of [
    ["render", f => { f.state.rendered.final = false; }],
    ["size", f => { f.root.rect.width = 600; }],
    ["resources", f => { Object.assign(f.label, {tagName:"IMG",complete:false,textContent:""}); }],
    ["stability", f => { f.wait(() => { f.label.rect.x++; }); }],
  ]) await t.test(condition, async () => {
    const f = fixture(); setup(f);
    const probe = f.make(readout), result = await probe.capture({target:"all",timeout:64});
    assert.equal(result.phase, "timeout");
    assert.equal(result.pending.condition, condition);
    assert.equal(result.stage.error, null);
    assert.deepEqual(JSON.parse(probe.output.textContent).pending, result.pending);
  });
});

test("unrelated fonts and images do not block a declared non-text mark", async () => {
  const f = fixture();
  f.doc.fonts.check = () => false;
  const mark = f.element();
  f.selectors.set("#mark", mark);
  f.selectors.set("#unused-image", Object.assign(f.element(), {tagName:"IMG",complete:false}));
  const probe = f.make(() => ({targets:[{id:"mark",element:"#mark"}]}));
  assert.equal((await probe.capture({target:"all"})).phase, "captured");
});

test("a size change discards a stale observation before reporting incomplete coverage", async () => {
  const f = fixture(), probe = f.make(readout);
  f.wait(() => { f.root.rect.width = 600; });
  const result = await probe.capture({target:"all",timeout:64});
  assert.equal(result.pending.condition, "size");
  assert.equal(result.observation, null);
  assert.deepEqual(JSON.parse(probe.output.textContent).coverage.targets, []);
});

test("brief reports retain actual spatial candidates and skipped relationships", async () => {
  const f = fixture(); f.label.rect.x = 790;
  const probe = f.make(() => ({targets:[{id:"value",element:"#readout"},{id:"absent",element:"#absent"}],
    bounds:[{type:"inside",ids:["value","absent"],within:"$stage"}]}));
  await probe.capture({target:"all"});
  const summary = JSON.parse(probe.output.textContent);
  assert.equal(summary.issues.find(item => item.type === "outside").edges.right, 70);
  assert.equal(summary.coverage.relationships, 1);
  assert.deepEqual(summary.coverage.skipped[0].unavailable, [{id:"absent",status:"missing"}]);
});

test("DOM requests preserve capture identity and report malformed input", async () => {
  const f = fixture(), probe = f.make(readout);
  probe.output.setAttribute("data-request", JSON.stringify({target:"all"}));
  probe.output.dispatchEvent(new Event("story-inspect"));
  for (let i=0; i<5; i++) await Promise.resolve();
  const first = JSON.parse(probe.output.textContent);
  assert.equal(first.phase, "captured");
  probe.output.setAttribute("data-request", "{"); probe.output.dispatchEvent(new Event("story-inspect"));
  const invalid = JSON.parse(probe.output.textContent);
  assert.ok(invalid.captureId > first.captureId); assert.equal(invalid.phase,"error");
});

test("stage failures and disposal terminate pending capture without claiming completion", async () => {
  const f = fixture(), probe = f.make(readout);
  f.state.error = {phase:"render",message:"broken"};
  assert.equal((await probe.capture({target:"all"})).phase,"error");
  f.state.error = null; f.state.rendered.final = false;
  const pending = probe.capture({target:"all"}); probe.dispose();
  assert.equal((await pending).phase,"disposed");
  assert.equal(f.children.length,0);
});
