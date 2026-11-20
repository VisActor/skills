import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, mkdir, rm, symlink, cp } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { loadTools, packHtml } from "../../skills/creative-data-storytelling/scripts/pack.mjs";

async function fixture(t, files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "story-pack-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), content);
  }
  return { root, entry: path.join(root, "index.html"), output: path.join(root, "delivery.html") };
}
const walk = node => [node, ...(node.childNodes ?? []).flatMap(walk)];
const get = (node, name) => node.attrs?.find(a => a.name === name)?.value;

test("packs local modules, styles, image and static data without modifying sources", async t => {
  const f = await fixture(t, {
    "index.html": '<link rel="stylesheet" href="styles/main.css"><img src="images/mark.svg"><script type="module" src="src/main.mjs"></script>',
    "src/main.mjs": 'import { n } from "./value.mjs"; import data from "./rows.json"; import art from "../images/mark.svg"; globalThis.answer = [n, data.value, art]; globalThis.fetched = fetch("./src/rows.json").then(r=>r.json()); globalThis.asset = new URL("../images/mark.svg", import.meta.url).href;',
    "src/value.mjs": "export const n = 21;",
    "src/rows.json": '{"value":42}',
    "styles/main.css": '@import "./color.css"; body { background-image:url(../images/mark.svg) }',
    "styles/color.css": "body { color: red }",
    "images/mark.svg": '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"/></defs><style>circle{fill:url(#g)}</style><circle r="2"/></svg>',
  });
  const before = await readFile(f.entry, "utf8"), report = await packHtml(f);
  const { html } = await loadTools(), nodes = walk(html.parse(await readFile(f.output, "utf8")));
  const source = nodes.find(n => n.tagName === "script").childNodes[0].value;
  const ctx = vm.createContext({ fetch, URL }); vm.runInContext(source, ctx);
  assert.deepEqual([ctx.answer[0], ctx.answer[1], (await ctx.fetched).value], [21, 42, 42]);
  assert.match(ctx.asset, /^data:image\/svg\+xml;base64,/);
  assert.match(ctx.answer[2], /^data:image\/svg\+xml;base64,/);
  assert.match(get(nodes.find(n => n.tagName === "img"), "src"), /^data:/);
  assert.match(nodes.find(n => n.tagName === "style").childNodes[0].value, /data:image\/svg\+xml/);
  assert.equal(await readFile(f.entry, "utf8"), before);
  assert.equal(report.files.length, 7);
});

test("classic scripts keep execution order and shared globals", async t => {
  const f = await fixture(t, { "index.html": '<script>let shared=3;</script><script>globalThis.answer=shared+4; globalThis.closing="<"+"/script>";</script>' });
  await packHtml(f);
  const { html } = await loadTools(), nodes = walk(html.parse(await readFile(f.output, "utf8")));
  const ctx = vm.createContext({});
  for (const n of nodes.filter(n => n.tagName === "script")) vm.runInContext(n.childNodes[0].value, ctx);
  assert.equal(ctx.answer, 7);
  assert.equal(ctx.closing, "</script>");
});

const svgMark = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="red"/></svg>';

for (const setter of [
  'document.querySelector("#marker").setAttribute("href", "./images/mark.svg")',
  'const marker = document.getElementById("marker"); marker.setAttribute("href", "./images/mark.svg")',
  'document.querySelector("#marker").setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "./images/mark.svg")',
]) test(`packs SVG image resources assigned by ${setter.split(";").at(-1).trim()}`, async t => {
  const f = await fixture(t, {
    "index.html": `<svg><image id="marker"/></svg><script>${setter};</script>`,
    "images/mark.svg": svgMark,
  });
  f.output = path.join(f.root, "delivery", "story.html");
  const report = await packHtml(f);
  const { html } = await loadTools(), nodes = walk(html.parse(await readFile(f.output, "utf8")));
  const attributes = new Map();
  const marker = { setAttribute: (name, value) => attributes.set(name, value),
    setAttributeNS: (_ns, name, value) => attributes.set(name, value) };
  vm.runInNewContext(nodes.find(n => n.tagName === "script").childNodes[0].value,
    { document: { querySelector: () => marker, getElementById: () => marker } });
  const uri = attributes.get("href") ?? attributes.get("xlink:href");
  assert.match(uri, /^data:image\/svg\+xml;base64,/);
  assert.equal(Buffer.from(uri.split(",")[1], "base64").toString(), svgMark);
  assert.ok(report.files.includes("images/mark.svg"));
});

test("packs script-created SVG images while preserving navigation hrefs", async t => {
  const f = await fixture(t, {
    "index.html": '<a id="source">来源</a><script type="module" src="src/main.mjs"></script>',
    "src/main.mjs": 'const ns="http://www.w3.org/2000/svg"; const marker=document.createElementNS(ns,"image"); marker.setAttribute("href","./images/mark.svg"); const link=document.querySelector("#source"); link.setAttribute("href","https://example.com/source");',
    "images/mark.svg": svgMark,
  });
  await packHtml(f);
  const { html } = await loadTools(), nodes = walk(html.parse(await readFile(f.output, "utf8")));
  const values = {};
  vm.runInNewContext(nodes.find(n => n.tagName === "script").childNodes[0].value, {
    document: { createElementNS: () => ({ setAttribute: (_name, value) => { values.image = value; } }),
      querySelector: () => ({ setAttribute: (_name, value) => { values.link = value; } }) },
  });
  assert.match(values.image, /^data:image\/svg\+xml;base64,/);
  assert.equal(values.link, "https://example.com/source");
});

test("keeps SVG fragment and embedded image hrefs unchanged", async t => {
  const embedded = `data:image/svg+xml;base64,${Buffer.from(svgMark).toString("base64")}`;
  const f = await fixture(t, { "index.html": `<svg><image id="marker"/></svg><script>const marker=document.querySelector("#marker"); marker.setAttribute("href","#local"); marker.setAttribute("href",${JSON.stringify(embedded)});</script>` });
  const report = await packHtml(f);
  const { html } = await loadTools(), nodes = walk(html.parse(await readFile(f.output, "utf8")));
  const values = [];
  vm.runInNewContext(nodes.find(n => n.tagName === "script").childNodes[0].value,
    { document: { querySelector: () => ({ setAttribute: (_name, value) => values.push(value) }) } });
  assert.deepEqual(values, ["#local", embedded]);
  assert.equal(report.embeddedResources, 0);
});

for (const asset of [
  'import asset from "../images/mark.svg";',
  'const asset = new URL("../images/mark.svg", import.meta.url).href;',
]) test(`supports explicit image resources for opaque targets: ${asset}`, async t => {
  const f = await fixture(t, {
    "index.html": '<script type="module" src="src/main.mjs"></script>',
    "src/main.mjs": `${asset} globalThis.paint = target => target.setAttribute("href", asset);`,
    "images/mark.svg": svgMark,
  });
  await packHtml(f);
  const { html } = await loadTools(), nodes = walk(html.parse(await readFile(f.output, "utf8")));
  const ctx = vm.createContext({ URL });
  vm.runInContext(nodes.find(n => n.tagName === "script").childNodes[0].value, ctx);
  let uri;
  ctx.paint({ setAttribute: (_name, value) => { uri = value; } });
  assert.equal(Buffer.from(uri.split(",")[1], "base64").toString(), svgMark);
});

test("copied tool works independently and retains top-level await in an inline module", async t => {
  const f = await fixture(t, {
    "index.html": '<script type="module">const data=await (await fetch("./rows.json")).json(); globalThis.__packedTest=data.n;</script>',
    "rows.json": '{"n":31}',
  });
  const scriptRoot=fileURLToPath(new URL("../../skills/creative-data-storytelling/scripts/",import.meta.url));
  await cp(path.join(scriptRoot,"pack.mjs"),path.join(f.root,"pack.mjs"));
  await cp(path.join(scriptRoot,"pack-deps"),path.join(f.root,"pack-deps"),{recursive:true});
  const {stdout}=await promisify(execFile)(process.execPath,[path.join(f.root,"pack.mjs"),f.entry,"--output",f.output]);
  assert.equal(JSON.parse(stdout).bytes>0,true);
  const {html}=await loadTools(), nodes=walk(html.parse(await readFile(f.output,"utf8")));
  const source=nodes.find(n=>n.tagName==='script').childNodes[0].value;
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  assert.equal(globalThis.__packedTest,31);
  delete globalThis.__packedTest;
});

for (const [name, source, expected] of [
  ["CDN script", '<script src="https://example.com/a.js"></script>', /需要联网/],
  ["dynamic fetch", '<script>fetch(window.location.hash);</script>', /动态资源地址/],
  ["missing image", '<img src="missing.png">', /不能读取/],
  ["multiple module entries", '<script type="module"></script><script type="module"></script>', /多个模块入口/],
  ["responsive image set", '<img srcset="a.png 1x,b.png 2x">', /srcset/],
  ["external CSS", '<style>@import "https://example.com/a.css";</style>', /需要联网/],
  ["missing script-assigned SVG image", '<svg><image id="marker"/></svg><script>document.querySelector("#marker").setAttribute("href","missing.svg");</script>', /不能读取/],
  ["remote script-assigned SVG image", '<svg><image id="marker"/></svg><script>document.querySelector("#marker").setAttribute("href","https://example.com/mark.svg");</script>', /需要联网/],
  ["dynamic SVG image href", '<svg><image id="marker"/></svg><script>document.querySelector("#marker").setAttribute("href",location.hash.slice(1));</script>', /动态资源地址/],
  ["ambiguous href target", '<script>function attach(marker){marker.setAttribute("href","mark.svg")}</script>', /无法确认.*href/],
  ["shadowed href target", '<svg><image id="marker"/></svg><script>const marker=document.querySelector("#marker"); function attach(marker){marker.setAttribute("href","mark.svg")}</script>', /无法确认.*href/],
]) test(`rejects ${name} without publishing partial output`, async t => {
  const f = await fixture(t, { "index.html": source });
  await assert.rejects(packHtml(f), expected);
  await assert.rejects(readFile(f.output), { code: "ENOENT" });
});

test("refuses source replacement, existing output, and symlink escape", async t => {
  const f = await fixture(t, { "index.html": '<img src="outside.txt">', "sub/index.html": "test" });
  await assert.rejects(packHtml({ ...f, output: f.entry }), /覆盖源码/);
  await writeFile(f.output, "keep");
  await assert.rejects(packHtml(f), /输出已存在/);
  assert.equal(await readFile(f.output, "utf8"), "keep");
  await rm(f.output);
  await symlink(path.join(f.root, "index.html"), path.join(f.root, "sub", "outside.txt"));
  await writeFile(path.join(f.root, "sub", "index.html"), '<img src="outside.txt">');
  await assert.rejects(packHtml({ ...f, root: path.join(f.root, "sub"), entry: path.join(f.root, "sub/index.html") }), /越出输入根目录/);
});
