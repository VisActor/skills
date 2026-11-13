#!/usr/bin/env node
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const installedRoot = fileURLToPath(new URL("../", import.meta.url));
const catalogPath = "assets/examples/catalog.json";

// list loads only the index; inspect also extracts the selected page's design notes.
export async function loadCatalog(root = installedRoot) {
  const catalog = JSON.parse(await readFile(path.join(root, catalogPath), "utf8"));
  if (catalog.version !== 1 || !Array.isArray(catalog.examples)) throw new Error("Unsupported example catalog");
  const ids = new Set();
  for (const entry of catalog.examples) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || ids.has(entry.id) || !entry.title ||
      !["opening", "story", "mechanism"].includes(entry.kind) ||
      typeof entry.design !== "string" || !entry.design ||
      !Array.isArray(entry.relations) || !Array.isArray(entry.dependencies) || !Array.isArray(entry.assets))
      throw new Error("Invalid or duplicate example entry: " + entry.id);
    if (entry.keywords !== undefined && (!Array.isArray(entry.keywords) ||
      entry.keywords.some((keyword) => typeof keyword !== "string" || !keyword.trim())))
      throw new Error("Invalid search keywords for example: " + entry.id);
    ids.add(entry.id);
  }
  for (const entry of catalog.examples) {
    if (entry.relatedExample && (!ids.has(entry.relatedExample) || entry.relatedExample === entry.id))
      throw new Error("Invalid related example: " + entry.relatedExample);
  }
  return catalog.examples;
}

function searchText(value) {
  return value.normalize("NFKC").toLowerCase().replace(/[-_\u2010-\u2015]/gu, " ");
}

export function listExamples(entries, query = "") {
  const terms = searchText(query).trim().split(/\s+/u).filter(Boolean);
  return entries.filter((entry) => {
    const text = searchText([entry.id, entry.title, ...entry.relations, ...(entry.keywords ?? []), entry.readerTask, entry.dataNeeds].join(" "));
    const words = new Set(text.match(/[a-z0-9]+/g) ?? []);
    // Chinese terms can match within phrases; Latin words must not match outline or baseline when searching for line.
    return terms.every((term) => /^[a-z0-9]+$/u.test(term) ? words.has(term) : text.includes(term));
  }).map(({ id, kind, title, readerTask }) => ({ id, kind, title, readerTask }));
}

async function resource(root, relativePath) {
  if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath))
    throw new Error("Example resources must use nonempty skill-relative paths");
  const target = path.resolve(root, relativePath), relative = path.relative(root, target);
  if (relative === ".." || relative.startsWith(".." + path.sep)) throw new Error("Resource escapes the skill: " + relativePath);
  let canonical;
  try { canonical = await realpath(target); }
  catch (error) { throw new Error(`Missing example resource: ${relativePath}`, { cause: error }); }
  const resolvedRelative = path.relative(root, canonical);
  if (resolvedRelative === ".." || resolvedRelative.startsWith(".." + path.sep))
    throw new Error("Resource resolves outside the skill: " + relativePath);
  const info = await stat(canonical);
  if (!info.isFile()) throw new Error("Expected a resource file: " + relativePath);
  return { relative: relativePath, path: target, bytes: info.size };
}

function noteText(html) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, name) => {
      if (name[0] !== "#") return entities[name.toLowerCase()];
      const point = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
        ? String.fromCodePoint(point) : entity;
    }).replace(/\s+/gu, " ").trim();
}

async function readExplanation(preview) {
  const html = await readFile(preview.path, "utf8");
  const notes = html.match(/<details\b(?=[^>]*\sid\s*=\s*["']example-notes["'])[^>]*>([\s\S]*?)<\/details>/i)?.[1];
  if (!notes) throw new Error(`Missing #example-notes explanation: ${preview.relative}`);
  // Owned notes use paragraphs with inline markup; return no surrounding page markup or scripts.
  const blocks = [...notes.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => match[1]);
  const paragraphs = blocks.map(noteText).filter(Boolean);
  if (!paragraphs.length) throw new Error(`Empty #example-notes explanation: ${preview.relative}`);
  const links = [], seen = new Set();
  for (const block of blocks) {
    for (const match of block.matchAll(/<a\b[^>]*\shref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)) {
      const url = new URL(noteText(match[2]), pathToFileURL(preview.path));
      const target = url.protocol === "file:" ? fileURLToPath(url) + url.search + url.hash : url.href;
      const label = noteText(match[3]);
      const key = JSON.stringify([label, target]);
      if (!seen.has(key)) links.push({ label, target });
      seen.add(key);
    }
  }
  return { source: preview.path + "#example-notes", paragraphs, links };
}

export async function inspectExample(entries, id, root = installedRoot) {
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Unknown example '${id}'. Use list to see available ids.`);
  const canonicalRoot = await realpath(root);
  const [preview, code, dependencies, assets] = await Promise.all([
    resource(canonicalRoot, entry.preview), resource(canonicalRoot, entry.code),
    Promise.all(entry.dependencies.map((file) => resource(canonicalRoot, file))),
    Promise.all(entry.assets.map((file) => resource(canonicalRoot, file))),
  ]);
  const designFile = entry.design.split("#")[0];
  const design = await resource(canonicalRoot, designFile);
  const related = entry.relatedExample && entries.find((candidate) => candidate.id === entry.relatedExample);
  const relatedExample = related ? {
    id: related.id, kind: related.kind, title: related.title,
    preview: await resource(canonicalRoot, related.preview),
    code: await resource(canonicalRoot, related.code),
  } : undefined;
  const explanation = await readExplanation(preview);
  return {
    id: entry.id, kind: entry.kind, title: entry.title, relations: entry.relations, readerTask: entry.readerTask,
    explanation,
    dataNeeds: entry.dataNeeds, dataKind: entry.dataKind, process: entry.process,
    retain: entry.retain, adapt: entry.adapt, handoff: entry.handoff,
    read: { previewAndLayout: preview, dataAndAnimation: code },
    optional: { design: { ...design, anchor: entry.design.split("#")[1] ?? null }, ...(relatedExample && { relatedExample }) },
    copyAlongside: { dependencies, assets },
    readingBytes: preview.bytes + code.bytes,
    copyBytes: [preview, code, ...dependencies, ...assets].reduce((sum, file) => sum + file.bytes, 0),
    usage: "explanation 提取自所选 HTML 的 example-notes，用于理解叙事与视觉关系；预览用于观察构图与运动。改编实现时读 scene.mjs 的相关部分，调整装配时读 HTML。采用本例时复制 read 与 copyAlongside 所列文件，保持相对目录或同步修改引用；无需复制总览、目录或 relatedExample。运行依赖按接口导入，排错或扩展时再查源码。",
  };
}

// Keep validated resource details available to local tools; the CLI presents only
// what an author needs to choose, locate and copy the selected example.
async function inspectionView(details, root) {
  const code = details.read.dataAndAnimation;
  const lines = (await readFile(code.path, "utf8")).split("\n");
  const entryLines = {};
  // Navigation for the owned examples' named exports, not a JavaScript parser.
  lines.forEach((line, index) => {
    const name = line.match(/^export\s+(?:async\s+)?(?:function\s*\*?\s*|class\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)/)?.[1];
    if (name) entryLines[name] = index + 1;
  });
  const relative = target => path.isAbsolute(target) ? path.relative(root, target).split(path.sep).join("/") : target;
  const design = details.optional.design;
  return {
    id: details.id, kind: details.kind, title: details.title, root,
    dataNeeds: details.dataNeeds, dataKind: details.dataKind,
    explanation: {
      source: relative(details.explanation.source),
      paragraphs: details.explanation.paragraphs,
      links: details.explanation.links.map(link => ({ ...link, target: relative(link.target) })),
    },
    adapt: details.adapt,
    read: {
      code: { file: code.relative, bytes: code.bytes, lines: lines.length, entryLines },
      layout: details.read.previewAndLayout.relative,
    },
    design: design.relative + (design.anchor ? "#" + design.anchor : ""),
    ...(details.optional.relatedExample && { relatedExample: details.optional.relatedExample.id }),
    copyAlongside: {
      dependencies: details.copyAlongside.dependencies.map(file => file.relative),
      assets: details.copyAlongside.assets.map(file => file.relative),
    },
    usage: (details.kind === "mechanism" ? "本例抽出局部机制，动作解说供作者理解；改编为作品时，正文围绕自己的问题与发现重写，只保留读者必要的读法提示。" : "") +
      "本地路径相对 root。explanation 用于设计理解；改编实现时按 entryLines 定位 code 中的相关部分，调整装配时读 layout。采用本例时连同 copyAlongside 复制并保持相对目录；运行依赖按接口导入，排错或扩展时再查源码。",
  };
}

export async function runCli(args) {
  if (!args.length || ["--help", "help", "-h"].includes(args[0])) {
    return "node scripts/examples.mjs list [--query 关键词]\nnode scripts/examples.mjs inspect <id>\nlist 按中英文关键词与常见别名筛选简短候选；多个词需同时命中，无匹配时标明并返回完整短目录。inspect 返回所选设计解释、条件、改写入口与复制清单；路径相对 root，entryLines 标出源码入口，不返回 HTML 或 JS 源码。";
  }
  const [command, ...rest] = args;
  if (command === "list") {
    if (rest.length !== 0 && !(rest.length === 2 && rest[0] === "--query" && rest[1] && !rest[1].startsWith("--")))
      throw new Error("Usage: list [--query 关键词]");
    const entries = await loadCatalog(), query = rest[1] ?? "";
    const examples = listExamples(entries, query);
    if (examples.length || !query.trim()) return { examples };
    return {
      query, matchCount: 0, fallback: "catalog",
      message: "没有字面匹配。以下是完整短目录，并非匹配结果；按追问选择，再用 inspect <id> 查看具体说明。",
      examples: listExamples(entries),
    };
  }
  if (command === "inspect" && rest.length === 1 && !rest[0].startsWith("--")) {
    const root = await realpath(installedRoot);
    return inspectionView(await inspectExample(await loadCatalog(), rest[0]), root);
  }
  throw new Error("Usage: list [--query 关键词] | inspect <id>");
}

// macOS /var and /private/var (or a symlinked installation) can name the same script.
if (process.argv[1] && process.argv[1] !== "-" &&
    await realpath(path.resolve(process.argv[1])) === await realpath(fileURLToPath(import.meta.url))) {
  try {
    const result = await runCli(process.argv.slice(2));
    process.stdout.write(typeof result === "string" ? result + "\n" : JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    process.stderr.write("Example catalog: " + error.message + "\n");
    process.exitCode = 1;
  }
}
