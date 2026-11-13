#!/usr/bin/env node
// Local static stories only. Parse HTML/JS and use esbuild for modules and CSS;
// do not concatenate modules by removing import/export statements.
import { readFile, writeFile, mkdir, mkdtemp, rename, rm, copyFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
let toolsPromise;
export function loadTools() {
  return toolsPromise ??= (async () => {
    const manifest = path.join(here, "pack-deps");
    const lock = await readFile(path.join(manifest, "package-lock.json"));
    const fingerprint = createHash("sha256").update(lock).digest("hex").slice(0, 16);
    const cache = path.join(os.homedir(), ".cache", "creative-data-storytelling", "pack", fingerprint);
    const require = createRequire(path.join(cache, "package.json"));
    const ready = path.join(cache, ".ready");
    try { await stat(ready); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(path.dirname(cache), { recursive: true });
      const pending = await mkdtemp(`${cache}-install-`);
      try {
        for (const name of ["package.json", "package-lock.json"]) await copyFile(path.join(manifest, name), path.join(pending, name));
        process.stderr.write("首次准备离线打包工具：安装锁定依赖到用户缓存，不修改作品或 skill。\n");
        await new Promise((resolve, reject) => {
          const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm",
            ["ci", "--no-audit", "--no-fund", "--registry=https://registry.npmjs.org"], { cwd: pending, stdio: ["ignore", "ignore", "inherit"] });
          child.on("error", reject);
          child.on("exit", code => code === 0 ? resolve() : reject(new Error(`工具安装失败 (${code})；需要 Node.js/npm 与首次安装的网络连接。缓存：${cache}`)));
        });
        await writeFile(path.join(pending, ".ready"), fingerprint);
        try { await rename(pending, cache); }
        catch (error) {
          if (!["ENOTEMPTY", "EEXIST"].includes(error.code)) throw error;
          await stat(ready); // Another process completed the same immutable cache.
        }
      } finally { await rm(pending, { recursive: true, force: true }); }
    }
    const [html, js, bundle] = await Promise.all(["parse5", "acorn", "esbuild"].map(name => import(pathToFileURL(require.resolve(name)).href)));
    return { html, js, bundle };
  })();
}

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function setAttr(node, name, value) {
  const item = node.attrs.find(item => item.name === name);
  if (item) item.value = value;
  else node.attrs.push({ name, value });
}
function removeAttr(node, ...names) { node.attrs = node.attrs.filter(item => !names.includes(item.name)); }
function text(node) { return (node.childNodes ?? []).map(child => child.value ?? "").join(""); }
function setText(node, value) { node.childNodes = [{ nodeName: "#text", value, parentNode: node }]; }
function elements(node) { return [node, ...(node.childNodes ?? []).flatMap(elements), ...(node.content ? elements(node.content) : [])]; }
function remove(node) { node.parentNode.childNodes = node.parentNode.childNodes.filter(child => child !== node); }
const MIME = { ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".json": "application/json", ".csv": "text/csv", ".txt": "text/plain" };
const isData = value => /^data:/i.test(value);
const isRemote = value => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value) && !isData(value);
const literal = node => node?.type === "Literal" && typeof node.value === "string" ? node.value :
  node?.type === "TemplateLiteral" && !node.expressions.length ? node.quasis[0].value.cooked : null;

export async function packHtml({ entry, output, root = path.dirname(path.resolve(entry)) }) {
  const tools = await loadTools();
  root = await realpath(root);
  entry = await realpath(entry);
  output = path.resolve(output);
  if (entry === output) throw new Error("输出不能覆盖源码入口");
  try {
    if (await realpath(output) === entry) throw new Error("输出不能覆盖源码入口");
    throw new Error(`输出已存在，保留原文件：${output}`);
  }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const files = new Set(), navigation = new Set();
  let embedded = 0, modules = 0;
  function inside(file) {
    const relative = path.relative(root, file);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
      throw new Error(`引用越出输入根目录：${file}；必要时用 --root 指定包含全部资源的目录`);
    return file;
  }
  async function local(ref, base) {
    if (isRemote(ref)) throw new Error(`需要联网的资源：${ref}（来自 ${base}）；先提供本地文件`);
    const url = new URL(ref, pathToFileURL(base));
    let filename = ref.startsWith("/") ? path.join(root, decodeURIComponent(url.pathname)) : fileURLToPath(url);
    try { filename = inside(await realpath(filename)); }
    catch (error) { throw new Error(`不能读取 ${ref}（来自 ${base}）：${error.message}`, { cause: error }); }
    if (!(await stat(filename)).isFile()) throw new Error(`不是文件：${filename}`);
    files.add(filename);
    return { filename, hash: url.hash };
  }
  async function embedFile(filename, hash = "") {
    const bytes = await readFile(filename);
    if (path.extname(filename).toLowerCase() === ".svg") {
      const svg = tools.html.parseFragment(bytes.toString("utf8"));
      for (const node of elements(svg)) {
        for (const item of node.attrs ?? []) if (["href", "src"].includes(item.name) && item.value && !item.value.startsWith("#") && !isData(item.value))
          throw new Error(`SVG 内仍引用其他资源：${filename} → ${item.value}；先制作独立 SVG`);
        const css = `${node.tagName === "style" ? text(node) : ""}\n${attr(node, "style") ?? ""}`;
        const urls = [...css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)].map(match => match[2].trim());
        if (/@import/i.test(css) || urls.some(url => !url.startsWith("#") && !isData(url)))
          throw new Error(`SVG 样式内仍引用其他资源：${filename}；先制作独立 SVG`);
      }
    }
    embedded++;
    return `data:${MIME[path.extname(filename).toLowerCase()] ?? "application/octet-stream"};base64,${bytes.toString("base64")}${hash}`;
  }
  async function dataUrl(ref, base) {
    if (!ref || ref.startsWith("#") || isData(ref)) return ref;
    const { filename, hash } = await local(ref, base);
    return embedFile(filename, hash);
  }
  async function rewriteJs(source, filename, sourceType = "module") {
    let tree;
    try { tree = tools.js.parse(source, { ecmaVersion: "latest", sourceType, locations: true }); }
    catch (error) { throw new Error(`${filename}：${error.message}`, { cause: error }); }
    const edits = [];
    const problem = (node, reason) => { throw new Error(`${filename}:${node.loc.start.line}：${reason}`); };
    async function urlArgument(node, base) {
      const value = literal(node);
      if (value === null) problem(node, "动态资源地址无法静态收集；改为显式本地 import、静态 fetch 或内联数据后重试");
      const valueUrl = await dataUrl(value, base);
      edits.push({ start: node.start, end: node.end, value: JSON.stringify(valueUrl) });
    }
    async function visit(node) {
      if (!node || typeof node !== "object") return;
      const moduleUrl = expression => expression?.type === "NewExpression" && expression.callee.name === "URL" &&
        expression.arguments[1]?.type === "MemberExpression" && expression.arguments[1].object?.type === "MetaProperty" &&
        expression.arguments[1].property?.name === "url";
      if (moduleUrl(node)) {
        const ref = literal(node.arguments[0]);
        if (ref === null) problem(node, "new URL 的资源路径需为静态字符串");
        edits.push({ start: node.start, end: node.end, value: `new URL(${JSON.stringify(await dataUrl(ref, filename))})` });
        return;
      }
      if (node.type === "CallExpression" && (node.callee.name === "fetch" ||
          node.callee.type === "MemberExpression" && ["window", "globalThis"].includes(node.callee.object.name) && node.callee.property.name === "fetch")) {
        const argument = node.arguments[0];
        if (!moduleUrl(argument)) await urlArgument(argument ?? node, entry);
      }
      if (node.type === "ImportExpression" && literal(node.source) === null) problem(node, "动态模块地址无法打包；使用静态 import");
      if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression" && (node.left.property.name ?? node.left.property.value) === "src")
        await urlArgument(node.right, entry);
      if (node.type === "CallExpression" && node.callee.type === "MemberExpression" && node.callee.property.name === "setAttribute" && literal(node.arguments[0]) === "src")
        await urlArgument(node.arguments[1], entry);
      if (node.type === "MemberExpression" && node.object?.type === "MetaProperty" && node.property?.name === "url")
        problem(node, "import.meta.url 仅支持静态 new URL(resource, import.meta.url)");
      for (const [key, value] of Object.entries(node)) {
        if (["loc", "start", "end"].includes(key)) continue;
        if (Array.isArray(value)) { for (const child of value) await visit(child); }
        else if (value && typeof value === "object") await visit(value);
      }
    }
    await visit(tree);
    for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end);
    return source;
  }
  const plugin = { name: "local-story-resources", setup(build) {
    build.onResolve({ filter: /.*/ }, async args => {
      if (isData(args.path) || args.path.startsWith("#")) {
        if (args.kind !== "url-token") throw new Error(`模块或样式导入需为本地文件：${args.path.slice(0, 100)}`);
        return { path: args.path, external: true };
      }
      if (isRemote(args.path)) throw new Error(`需要联网的依赖：${args.path}（来自 ${args.importer}）`);
      if (!args.path.startsWith(".") && !args.path.startsWith("/") && !["url-token", "import-rule", "entry-point"].includes(args.kind))
        throw new Error(`裸模块依赖 ${args.path}；先提供浏览器可用的本地模块`);
      const base = args.importer || path.join(args.resolveDir, "entry.mjs");
      const resolved = await local(args.path, base);
      if (args.kind === "url-token") return { path: await embedFile(resolved.filename, resolved.hash), external: true };
      return { path: resolved.filename, suffix: resolved.hash };
    });
    build.onLoad({ filter: /.*/ }, async args => {
      const filename = inside(await realpath(args.path)); files.add(filename);
      const ext = path.extname(filename).toLowerCase();
      const bytes = await readFile(filename);
      if ([".js", ".mjs", ".cjs"].includes(ext)) return { contents: await rewriteJs(bytes.toString("utf8"), filename), loader: "js", resolveDir: path.dirname(filename) };
      if ([".css", ".json"].includes(ext)) return { contents: bytes, loader: ext.slice(1), resolveDir: path.dirname(filename) };
      return { contents: `export default ${JSON.stringify(await embedFile(filename))}`, loader: "js" };
    });
  } };
  async function bundle(source, filename, loader) {
    const result = await tools.bundle.build({ stdin: { contents: loader === "js" ? await rewriteJs(source, filename) : source,
      loader, sourcefile: filename, resolveDir: path.dirname(filename) }, bundle: true, write: false,
      format: "esm", platform: "browser", target: "es2022", charset: "utf8", legalComments: "inline", logLevel: "silent",
      outfile: path.join(root, loader === "css" ? "_packed.css" : "_packed.js"), plugins: [plugin] });
    if (result.outputFiles.length !== 1) throw new Error(`${filename} 产生多种输出；将 CSS 独立链接后打包`);
    if (result.warnings.length) throw new Error(result.warnings.map(w => `${filename}：${w.text}`).join("\n"));
    return result.outputFiles[0].text;
  }

  inside(entry); files.add(entry);
  const document = tools.html.parse(await readFile(entry, "utf8"));
  for (const node of elements(document)) {
    if (!node.tagName) continue;
    const tag = node.tagName;
    if (tag === "base") throw new Error("请先将 <base> 的资源路径改为相对入口的本地引用");
    if (tag === "meta" && attr(node, "http-equiv")?.toLowerCase() === "content-security-policy")
      throw new Error("入口含 CSP；内联会改变策略要求，请使用目录交付或另行配置 CSP");
    if (attr(node, "srcset")) throw new Error("当前打包支持单一 src；请为交付选择图片，或保留目录交付的 srcset");
    if (["iframe", "object", "embed", "video", "audio"].includes(tag)) throw new Error(`暂不打包 <${tag}>；请使用目录交付`);
    if (tag === "link") {
      const rel = (attr(node, "rel") ?? "").toLowerCase().split(/\s+/);
      if (rel.some(value => ["preload", "modulepreload", "preconnect", "dns-prefetch"].includes(value))) { remove(node); continue; }
      if (rel.includes("stylesheet")) {
        const { filename } = await local(attr(node, "href"), entry);
        node.tagName = node.nodeName = "style";
        removeAttr(node, "href", "rel", "integrity", "crossorigin");
        setText(node, (await bundle(await readFile(filename, "utf8"), filename, "css")).replace(/<\/style/gi, "<\\/style"));
        continue;
      }
      if (rel.includes("icon")) setAttr(node, "href", await dataUrl(attr(node, "href"), entry));
    }
    if (tag === "style") {
      if (attr(node, "type") && attr(node, "type") !== "text/css") throw new Error("请先编译动态样式（如 Tailwind CDN），再离线打包");
      setText(node, (await bundle(text(node), entry, "css")).replace(/<\/style/gi, "<\\/style"));
    }
    if (attr(node, "style")) {
      const css = await bundle(`.packed{${attr(node, "style")}}`, entry, "css");
      setAttr(node, "style", css.slice(css.indexOf("{") + 1, css.lastIndexOf("}")).trim());
    }
    if (tag === "script") {
      const type = (attr(node, "type") ?? "").trim().toLowerCase();
      if (!["", "text/javascript", "application/javascript", "module"].includes(type)) {
        if (type === "importmap") throw new Error("当前工具使用本地相对模块引用，不处理 import map");
        continue;
      }
      const src = attr(node, "src"), module = type === "module";
      if (node.attrs.some(a => a.name === "async") || !module && src && node.attrs.some(a => a.name === "defer"))
        throw new Error("异步经典脚本的执行顺序需单独处理；改为一个本地 module 入口或保留目录交付");
      if (module && ++modules > 1) throw new Error("请把多个模块入口合并为一个入口，保持共享模块只执行一次");
      const filename = src ? (await local(src, entry)).filename : entry;
      let source = src ? await readFile(filename, "utf8") : text(node);
      if (module) source = await bundle(source, filename, "js");
      else {
        source = await rewriteJs(source, filename, "script");
        source = (await tools.bundle.transform(source, { loader: "js", charset: "utf8", target: "es2020", legalComments: "inline" })).code;
      }
      removeAttr(node, "src", "integrity", "crossorigin"); setText(node, source);
    }
    if (tag === "img" && attr(node, "src")) setAttr(node, "src", await dataUrl(attr(node, "src"), entry));
    if (tag === "image") for (const item of node.attrs.filter(a => a.name === "href")) item.value = await dataUrl(item.value, entry);
    if (tag === "use" && attr(node, "href") && !attr(node, "href").startsWith("#")) throw new Error("SVG use 的外部符号请先内联为本页 symbol");
    if (tag === "a" && attr(node, "href") && !attr(node, "href").startsWith("#")) navigation.add(attr(node, "href"));
  }
  if (files.has(output)) throw new Error("输出不能覆盖输入资源");
  const html = tools.html.serialize(document);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html, { flag: "wx" });
  return { output, bytes: Buffer.byteLength(html), sourceRoot: root, files: [...files].map(f => path.relative(root, f)),
    embeddedResources: embedded, navigationLinks: [...navigation],
    scope: "静态引用已打包；源码保留。运行时生成地址、浏览器行为及视觉效果仍需实际检查。", largeFile: Buffer.byteLength(html) > 10 * 1024 * 1024 };
}

const invokedPath = process.argv[1] ? await realpath(process.argv[1]).catch(error => {
  if (error.code === "ENOENT") return null;
  throw error;
}) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const { values, positionals } = parseArgs({ allowPositionals: true, options: { output: { type: "string" }, root: { type: "string" }, help: { type: "boolean" } } });
    if (values.help) process.stdout.write("node pack.mjs input/index.html --output delivery/story.html [--root input]\n本地模块、CSS、图片与静态 JSON/fetch → 单 HTML。首次安装工具依赖到用户缓存；不覆盖源码或已有输出。\n");
    else {
      if (positionals.length !== 1 || !values.output) throw new Error("用法：node pack.mjs input/index.html --output delivery/story.html [--root input]");
      console.log(JSON.stringify(await packHtml({ entry: positionals[0], output: values.output, root: values.root }), null, 2));
    }
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
