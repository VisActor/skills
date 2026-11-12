import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadCatalog, listExamples, inspectExample, runCli } from "../../skills/creative-data-storytelling/scripts/examples.mjs";

const root = fileURLToPath(new URL("../../skills/creative-data-storytelling/", import.meta.url));
const exec = promisify(execFile);

async function explanationFixture(t, html) {
  const temporary = await mkdtemp(path.join(tmpdir(), "story-explanation-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const installed = await realpath(temporary);
  const entry = {
    id: "fixture", kind: "story", title: "Fixture", relations: [],
    preview: "assets/examples/fixture/index.html", code: "assets/examples/fixture/scene.mjs",
    design: "references/design.md#relation", dependencies: [], assets: [],
  };
  const preview = path.join(installed, entry.preview);
  await mkdir(path.dirname(preview), { recursive: true });
  await mkdir(path.join(installed, "references"));
  await writeFile(preview, html);
  await writeFile(path.join(installed, entry.code), "throw new Error('SOURCE_BODY_SENTINEL');");
  await writeFile(path.join(installed, "references/design.md"), "# Relation");
  return { installed, entry, preview };
}

test("discovery returns bounded metadata and filters relationship terms without loading source bodies", async () => {
  const entries = await loadCatalog();
  const selected = listExamples(entries, "整体 局部");
  assert.deepEqual(selected.map((entry) => [entry.id, entry.kind]), [["overview-detail", "story"], ["comparison", "mechanism"]]);
  assert.equal(listExamples(entries, "not-a-matching-keyword").length, 0);
  assert.ok(listExamples(entries).every((entry) => !Object.hasOwn(entry, "code") && !Object.hasOwn(entry, "dependencies")));
});

test("CLI queries with matches return only matching candidates", async () => {
  const entries = await loadCatalog();
  assert.deepEqual(await runCli(["list", "--query", "整体 局部"]), {
    examples: listExamples(entries, "整体 局部"),
  });
});

test("CLI listing without search terms remains a plain compact catalog", async () => {
  const expected = { examples: listExamples(await loadCatalog()) };
  assert.deepEqual(await runCli(["list"]), expected);
  assert.deepEqual(await runCli(["list", "--query", "  "]), expected);
});

test("bilingual chart, narrative and material keywords find relevant examples", async () => {
  const entries = await loadCatalog();
  for (const [query, id] of [
    ["流向", "cohort-flow"], ["sankey diagram", "cohort-flow"],
    ["堆积面积图", "records-composition"], ["stacked area chart", "records-composition"],
    ["柱状图", "record-comparison"], ["bar chart", "record-comparison"],
    ["折线图", "time-history"], ["line chart", "time-history"],
    ["象形图", "material-height"], ["pictorial chart", "material-height"],
    ["单位换算", "unit-scale"], ["unit conversion", "unit-scale"],
    ["人均", "comparison-basis"], ["per capita", "comparison-basis"],
    ["累计", "increment-stock"], ["cumulative", "increment-stock"],
    ["图像标记", "material-trend"], ["image marker", "material-trend"],
    ["口袋", "object-fit"], ["pocket", "object-fit"],
    ["多个约束", "multi-constraint"], ["multiple constraints", "multi-constraint"],
    ["弧线图", "sequence-recurrence"], ["arc diagram", "sequence-recurrence"],
    ["时间对齐", "sequence"], ["temporal alignment", "sequence"],
    ["群体分布", "person-coverage"], ["population distribution", "person-coverage"],
    ["单元图", "units"], ["unit chart", "units"],
  ]) {
    assert.ok(listExamples(entries, query).some(entry => entry.id === id), `${query}: missing ${id}`);
  }
  for (const query of ["河流图", "streamgraph"]) {
    assert.ok(!listExamples(entries, query).some(entry => entry.id === "records-composition"));
  }
});

test("keyword search normalizes bilingual input and matches whole Latin words with AND terms", () => {
  const entry = (id, keywords) => ({ id, title: id, kind: "mechanism", relations: [], keywords });
  const entries = [entry("curve", ["line chart", "折线图"]), entry("contour", ["outline", "baseline", "linear"]),
    entry("bars", ["bar chart", "条形图"])];
  for (const query of ["BAR CHART", "bar-chart", "ｂａｒ　ｃｈａｒｔ", "bar 条形图"]) {
    assert.deepEqual(listExamples(entries, query).map(item => item.id), ["bars"]);
  }
  assert.deepEqual(listExamples(entries, "line").map(item => item.id), ["curve"]);
  assert.deepEqual(listExamples(entries, "line 条形图"), []);
  assert.ok(listExamples(entries).every(item => !Object.hasOwn(item, "keywords")));
});

test("catalog keywords are optional and reject malformed search metadata", async (t) => {
  const fixture = await explanationFixture(t, '<details id="example-notes"><p>Fixture.</p></details>');
  const catalogPath = path.join(fixture.installed, "assets/examples/catalog.json");
  await writeFile(catalogPath, JSON.stringify({ version: 1, examples: [fixture.entry] }));
  assert.equal((await loadCatalog(fixture.installed)).length, 1);
  for (const keywords of ["line chart", [""], [null], [42]]) {
    await writeFile(catalogPath, JSON.stringify({ version: 1, examples: [{ ...fixture.entry, keywords }] }));
    await assert.rejects(loadCatalog(fixture.installed), /Invalid search keywords/);
  }
});

test("CLI zero-match fallback lists the catalog without requiring example pages or source", async (t) => {
  const installed = await mkdtemp(path.join(tmpdir(), "story-catalog-fallback-"));
  t.after(() => rm(installed, { recursive: true, force: true }));
  const entries = await loadCatalog();
  await mkdir(path.join(installed, "scripts"), { recursive: true });
  await mkdir(path.join(installed, "assets/examples"), { recursive: true });
  await cp(path.join(root, "scripts/examples.mjs"), path.join(installed, "scripts/examples.mjs"));
  await writeFile(path.join(installed, "assets/examples/catalog.json"), JSON.stringify({ version: 1, examples: entries }));
  const query = "__unmatched_catalog_query_8349__";
  const { stdout } = await exec(process.execPath, [path.join(installed, "scripts/examples.mjs"), "list", "--query", query], { cwd: tmpdir() });
  const result = JSON.parse(stdout);
  assert.equal(result.query, query);
  assert.equal(result.matchCount, 0);
  assert.equal(result.fallback, "catalog");
  assert.ok(typeof result.message === "string" && result.message.trim());
  assert.deepEqual(result.examples, listExamples(entries));
});

test("inspect returns only selected design paragraphs with readable entities and resolved links", async (t) => {
  const fixture = await explanationFixture(t, `
    <style>STYLE_SENTINEL</style><p>PAGE_SENTINEL</p>
    <details data-id="example-notes"><p>UNSELECTED_SENTINEL</p></details>
    <details class="scope" id='example-notes'>
      <summary>SUMMARY_SENTINEL</summary>
      <p><strong>Reason:</strong> A &amp; B keep <code>x &lt; 10</code>; &#215; &#x4EBA;&nbsp;units.</p>
      <p>Use <a href="../../../references/design.md#relation">the <em>design</em></a> and <a href="#middle">the middle</a>.</p>
      <p><a href="https://example.com/?a=1&amp;b=2">external reference</a></p>
    </details><script>SCRIPT_SENTINEL</script>`);
  const inspected = await inspectExample([fixture.entry], fixture.entry.id, fixture.installed);
  assert.deepEqual(inspected.explanation, {
    source: fixture.preview + "#example-notes",
    paragraphs: [
      "Reason: A & B keep x < 10; × 人 units.",
      "Use the design and the middle.",
      "external reference",
    ],
    links: [
      { label: "the design", target: path.join(fixture.installed, "references/design.md") + "#relation" },
      { label: "the middle", target: fixture.preview + "#middle" },
      { label: "external reference", target: "https://example.com/?a=1&b=2" },
    ],
  });
  assert.doesNotMatch(JSON.stringify(inspected), /SENTINEL/);
});

test("inspect reads explanation updates from HTML and reports missing or empty notes", async (t) => {
  const fixture = await explanationFixture(t, '<details id="example-notes"><p>First explanation.</p></details>');
  const inspect = () => inspectExample([fixture.entry], fixture.entry.id, fixture.installed);
  assert.deepEqual((await inspect()).explanation.paragraphs, ["First explanation."]);
  await writeFile(fixture.preview, '<details id="example-notes"><p>Revised explanation.</p></details>');
  assert.deepEqual((await inspect()).explanation.paragraphs, ["Revised explanation."]);
  await writeFile(fixture.preview, '<details id="example-notes"><summary>No explanation</summary></details>');
  await assert.rejects(inspect(), /Empty #example-notes.*fixture\/index.html/);
  await writeFile(fixture.preview, '<p>No notes section.</p>');
  await assert.rejects(inspect(), /Missing #example-notes.*fixture\/index.html/);
});

test("each selected entry resolves to existing resources inside the installed skill", async () => {
  const entries = await loadCatalog();
  for (const entry of entries) {
    const inspected = await inspectExample(entries, entry.id);
    assert.ok(inspected.readingBytes > 0);
    assert.ok(inspected.explanation.paragraphs.length > 0);
    for (const file of [...Object.values(inspected.read), ...inspected.copyAlongside.dependencies, ...inspected.copyAlongside.assets]) {
      assert.ok(file.path.startsWith(root));
      assert.ok(file.bytes > 0);
    }
  }
  await assert.rejects(inspectExample(entries, "missing"), /Unknown example/);
  await assert.rejects(runCli(["list", "--query"]), /Usage/);
});

test("CLI inspection preserves design notes and a complete copy manifest with one path root", async () => {
  const entries = await loadCatalog();
  for (const entry of entries) {
    const full = await inspectExample(entries, entry.id);
    const view = await runCli(["inspect", entry.id]);
    assert.deepEqual(view.explanation.paragraphs, full.explanation.paragraphs);
    assert.equal(view.dataNeeds, full.dataNeeds);
    assert.equal(view.adapt, full.adapt);
    assert.equal(view.design, entry.design);
    assert.equal(path.resolve(view.root, view.design.split("#")[0]), full.optional.design.path);
    assert.equal(path.resolve(view.root, view.explanation.source), full.explanation.source);
    assert.deepEqual(view.explanation.links.map(link => ({ ...link,
      target: /^[a-z]+:/i.test(link.target) ? link.target : path.resolve(view.root, link.target),
    })), full.explanation.links);
    const files = [view.read.layout, view.read.code.file, ...view.copyAlongside.dependencies, ...view.copyAlongside.assets];
    const expected = [...Object.values(full.read), ...full.copyAlongside.dependencies, ...full.copyAlongside.assets];
    assert.deepEqual(files.map(file => path.resolve(view.root, file)), expected.map(file => file.path));
    assert.ok(files.every(file => !path.isAbsolute(file)));
    assert.ok(!Object.hasOwn(view, "process") && !Object.hasOwn(view, "retain") && !Object.hasOwn(view, "handoff"));
  }
});

test("CLI entry lines locate the selected module without printing its source", async () => {
  const view = await runCli(["inspect", "unit-scale"]);
  const source = await readFile(path.resolve(view.root, view.read.code.file), "utf8");
  const lines = source.split("\n");
  assert.equal(view.read.code.lines, lines.length);
  assert.equal(view.read.code.bytes, Buffer.byteLength(source));
  assert.match(lines[view.read.code.entryLines.unitScaleExample - 1], /^export const unitScaleExample\b/);
  assert.match(lines[view.read.code.entryLines.blendUnitScale - 1], /^export function blendUnitScale\b/);
  assert.match(lines[view.read.code.entryLines.mountUnitScale - 1], /^export function mountUnitScale\b/);
  assert.doesNotMatch(JSON.stringify(view), /export function|<svg\b|<script\b/);
});

test("catalog and selected module still work after copying the skill away from the checkout", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "story-catalog-"));
  try {
    const installed = path.join(temporary, "standalone-skill");
    await cp(root, installed, { recursive: true });
    const { stdout } = await exec(process.execPath, [path.join(installed, "scripts/examples.mjs"), "inspect", "overview-detail"], { cwd: temporary });
    const inspected = JSON.parse(stdout);
    assert.equal(inspected.root, await realpath(installed));
    assert.ok((await stat(path.resolve(inspected.root, inspected.read.code.file))).isFile());
    assert.ok((await stat(path.resolve(inspected.root, inspected.explanation.source.split("#")[0]))).isFile());
    assert.ok(inspected.explanation.paragraphs.length > 0);
    const { stdout: count } = await exec(process.execPath, ["--input-type=module", "-e",
      "import { detailStoryPose } from './standalone-skill/assets/examples/overview-detail/scene.mjs'; console.log(detailStoryPose('compare').nodes.size);"], { cwd: temporary });
    assert.equal(Number(count.trim()), 12);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("catalog resources cannot traverse or symlink outside the skill", async () => {
  const entries = await loadCatalog(), temporary = await mkdtemp(path.join(tmpdir(), "story-catalog-escape-"));
  try {
    const installed = path.join(temporary, "skill");
    await cp(root, installed, { recursive: true });
    const outside = path.join(temporary, "outside.txt");
    await writeFile(outside, "outside");
    await symlink(outside, path.join(installed, "escaped.txt"));
    for (const preview of ["../outside.txt", "escaped.txt"]) {
      const changed = [{ ...entries[0], preview }];
      await assert.rejects(inspectExample(changed, entries[0].id, installed), /outside|escapes/);
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("a selected example runs from its declared files without the gallery or another example", async () => {
  const entries = await loadCatalog();
  const temporary = await mkdtemp(path.join(tmpdir(), "story-example-bundles-"));
  try {
    for (const entry of entries) {
      const selected = await inspectExample(entries, entry.id);
      const files = [...Object.values(selected.read), ...selected.copyAlongside.dependencies, ...selected.copyAlongside.assets];
      const bundle = path.join(temporary, entry.id);
      for (const file of files) {
        const target = path.join(bundle, file.relative);
        await mkdir(path.dirname(target), { recursive: true });
        await cp(file.path, target);
      }
      await assert.rejects(stat(path.join(bundle, "assets/examples/index.html")), { code: "ENOENT" });
      await assert.rejects(stat(path.join(bundle, "assets/examples/catalog.json")), { code: "ENOENT" });
      // Check local scripts, images and styles, including dependencies of dependencies.
      // Navigation back to the optional gallery is not a rendering dependency.
      for (const file of files.filter(file => /\.(?:mjs|html|css)$/.test(file.relative))) {
        const target = path.join(bundle, file.relative);
        const source = await readFile(target, "utf8");
        const references = new Set();
        for (const match of source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)) references.add(match[1]);
        for (const match of source.matchAll(/(?:\bsrc\s*=|\bimage\s*:)\s*["']([^"']+)["']/g)) references.add(match[1]);
        for (const tag of source.matchAll(/<link\b[^>]*>/g)) {
          const href = tag[0].match(/href=["']([^"']+)["']/)?.[1];
          if (href) references.add(href);
        }
        for (const reference of references) {
          if (/^(?:[a-z]+:|#|\/)/i.test(reference)) continue;
          const dependency = path.resolve(path.dirname(target), reference);
          assert.ok(dependency.startsWith(bundle + path.sep), `${entry.id}: dependency escapes bundle`);
          assert.ok((await stat(dependency)).isFile(), `${entry.id}: missing ${reference}`);
        }
      }
      // Modules must be importable independently; mounting is verified in the browser.
      await import(pathToFileURL(path.join(bundle, selected.read.dataAndAnimation.relative)).href);
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
