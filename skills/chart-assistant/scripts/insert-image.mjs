#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const executeFile = promisify(execFile);
const hash = value => createHash('sha256').update(value).digest('hex');

// CLI 原始响应只在进程内处理，不能将素材 token 或其它响应字段透传到模型。
export async function runLark(args, { cwd } = {}) {
  let stdout;
  try {
    ({ stdout } = await executeFile('lark-cli', args, {
      encoding: 'utf8',
      timeout: 90000,
      maxBuffer: 2 * 1024 * 1024,
      cwd,
      env: { ...process.env, LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1', LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1' }
    }));
  } catch (error) {
    throw new Error(
      error.code === 'ENOENT'
        ? '当前宿主没有 lark-cli；请使用宿主已授权的飞书图片上传、插入和回读工具。PNG 已保留。'
        : '飞书命令未确认成功，请检查当前身份的授权、文档权限及插入回执；不要直接重试写入。PNG 已保留。'
    );
  }
  let result;
  try {
    result = JSON.parse(stdout);
  } catch {
    throw new Error('飞书命令返回了无法解析的结果；不要直接重试写入。');
  }
  if (result.ok === false || (typeof result.code === 'number' && result.code !== 0)) {
    throw new Error('飞书操作未确认成功，请检查当前身份的授权和文档权限；不要切换身份或直接重试写入。');
  }
  return result;
}

function findData(value, key) {
  for (let depth = 0; value && typeof value === 'object' && depth < 5; depth++, value = value.data) {
    if (key in value) return value;
  }
  throw new Error(`飞书响应缺少 ${key}，未确认操作结果。`);
}

function documentId(doc) {
  if (typeof doc !== 'string') throw new Error('必须指定目标文档。');
  if (/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(doc)) return doc;
  let url;
  try {
    url = new URL(doc);
  } catch {
    throw new Error('目标必须是文档 ID 或 Docx URL。');
  }
  const match = url.pathname.match(/^\/docx\/([a-zA-Z0-9_-]+)\/?$/);
  if (url.protocol !== 'https:' || !match)
    throw new Error('请先通过飞书工具将 Wiki 链接解析为 Docx document_id，再插入图片。');
  return match[1];
}

async function commandHelp(command) {
  try {
    return (await executeFile('lark-cli', ['docs', command, '--help'], {
      encoding: 'utf8', timeout: 10000, maxBuffer: 128 * 1024
    })).stdout;
  } catch {
    return '';
  }
}

export async function checkLark(run = runLark, { selection, before } = {}) {
  // 旧宿主继续使用其原生命令；新版以真实参数能力选择块定位，不按版本猜测。
  if (run !== runLark) return 'media';
  const media = await commandHelp('+media-insert');
  const hasFlag = (help, flag) => new RegExp(`^\\s*--${flag}(?:\\s|$)`, 'm').test(help);
  if (media && (!selection || (hasFlag(media, 'selection-with-ellipsis') && (!before || hasFlag(media, 'before')))))
    return 'media';
  if (selection) {
    const update = await commandHelp('+update');
    if (['block-id', 'revision-id', 'content', 'doc-format', 'command'].every(flag => hasFlag(update, flag)) &&
        /\bblock_insert_after\b/.test(update)) return 'block';
  }
  throw new Error(selection
    ? `当前宿主 lark-cli 不支持${before ? ' --before 段落前' : ''}指定位置插图：旧定位参数和块插入能力均不可用。尚未写入，PNG 已保留，不会改为追加。`
    : '当前宿主缺少 lark-cli docs +media-insert；可先交付 PNG，再用宿主飞书工具插图。');
}

const validId = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value);
const blockPath = (id, blockId) => `/open-apis/docx/v1/documents/${id}/blocks/${blockId}`;
async function getAPI(run, endpoint, as, params) {
  return run(['api', 'GET', endpoint, ...(params ? ['--params', JSON.stringify(params)] : []), '--as', as, '--json']);
}

async function resolvePosition(run, id, as, selection, before) {
  const doc = findData(await getAPI(run, `/open-apis/docx/v1/documents/${id}`, as), 'document').document;
  if (doc.document_id !== id || !Number.isInteger(doc.revision_id) || doc.revision_id < 0)
    throw new Error('无法确认目标文档及版本，尚未插图。');
  const items = [];
  const seenPages = new Set();
  let pageToken;
  do {
    const page = findData(await getAPI(run, `/open-apis/docx/v1/documents/${id}/blocks`, as, {
      document_revision_id: doc.revision_id, page_size: 500, ...(pageToken ? { page_token: pageToken } : {})
    }), 'items');
    if (!Array.isArray(page.items)) throw new Error('文档块列表格式不正确，尚未插图。');
    items.push(...page.items);
    if (!page.has_more) break;
    if (typeof page.page_token !== 'string' || !page.page_token || seenPages.has(page.page_token))
      throw new Error('文档块列表未完整读取，尚未插图。');
    pageToken = page.page_token;
    seenPages.add(pageToken);
  } while (true);
  // 仅匹配块的正文文本，忽略样式和 mention 等非文本字段，不跨块拼接。
  const matches = items.filter(block => block.block_type !== 1 && Object.values(block).some(value =>
    Array.isArray(value?.elements) && value.elements.map(element => element.text_run?.content ?? '').join('').includes(selection)
  ));
  if (matches.length !== 1) throw new Error('目标文本必须唯一匹配一个正文块，请补充完整文本后再插图。');
  const target = matches[0];
  const root = items.find(block => block.block_id === id && block.block_type === 1);
  const index = root?.children?.indexOf(target.block_id) ?? -1;
  if (!validId(target.block_id) || target.parent_id !== id || index < 0)
    throw new Error('目标在表格或其它容器内部，请用宿主原生块工具指定容器内位置；不会插到容器外。');
  const insertAfter = before ? (index === 0 ? '0' : root.children[index - 1]) : target.block_id;
  if (insertAfter !== '0' && !validId(insertAfter)) throw new Error('无法确认目标前一兄弟块，尚未插图。');
  return { targetBlockId: target.block_id, parentBlockId: id, insertAfterBlockId: insertAfter, revisionId: doc.revision_id };
}

function modernInserted(result, id) {
  const doc = findData(result, 'document').document;
  const images = doc.new_blocks?.filter(block => block.block_type === 'image');
  if ((doc.document_id && doc.document_id !== id) || images?.length !== 1 || !validId(images[0].block_id) ||
      typeof images[0].block_token !== 'string' || !images[0].block_token || images[0].block_token.startsWith('@lcli_'))
    throw new Error('块插入结果未确认唯一且已绑定的图片，保留 pending 回执，请回读文档，不要重试写入。');
  return { block_id: images[0].block_id, document_id: id, file_token: images[0].block_token };
}

export async function insertImage(
  { imagePath, doc, width, as = 'user', selection, before = false, receiptPath },
  { run = runLark } = {}
) {
  const id = documentId(doc);
  if (!['user', 'bot'].includes(as)) throw new Error('as 必须是 user 或 bot。');
  if (width === undefined) throw new Error('必须显式指定 --width：使用导出回执 logicalWidth 取整或恢复回执 width；不能猜测 PNG 的显示尺寸。');
  if (before && !selection) throw new Error('--before 需要 --selection。');
  if (selection !== undefined && (typeof selection !== 'string' || !selection.trim())) throw new Error('selection 不能为空。');
  const file = path.resolve(imagePath);
  const png = await fs.readFile(file);
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    throw new Error('插图输入必须是 PNG 文件。');
  if (png.length < 24 || png.toString('ascii', 12, 16) !== 'IHDR') throw new Error('PNG 缺少有效尺寸。');
  if (!Number.isInteger(width) || width < 1 || width > 4096) throw new Error('文档显示宽度必须是 1–4096 的整数。');
  const contentHash = hash(png);
  const operation = { documentId: id, contentHash, width, as, selection: selection ?? null, before };
  const operationHash = hash(JSON.stringify(operation));
  const receiptFile = path.resolve(receiptPath ?? `${file}.${operationHash.slice(0, 12)}.feishu.json`);
  let receipt;
  try {
    receipt = JSON.parse(await fs.readFile(receiptFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (receipt && receipt.operationHash !== operationHash)
    throw new Error('回执属于其它图片、身份或插入位置，请使用对应回执。');
  if (receipt && !receipt.blockId)
    throw new Error(`上次写入结果不确定，请先检查目标文档及回执 ${receiptFile}，不要重复插入。`);
  if (!receipt) {
    const mode = await checkLark(run, { selection, before });
    const position = mode === 'block' ? await resolvePosition(run, id, as, selection, before) : {};
    receipt = { ...operation, operationHash, ...position, ...(mode === 'block' ? { intrinsicWidth: png.readUInt32BE(16), intrinsicHeight: png.readUInt32BE(20) } : {}), state: 'pending', createdAt: new Date().toISOString() };
    const args = mode === 'block' ? [
      'docs', '+update', '--doc', id, '--command', 'block_insert_after', '--block-id', position.insertAfterBlockId,
      '--revision-id', String(position.revisionId), '--doc-format', 'xml', '--content', '@./image.xml', '--as', as, '--json'
    ] : [
      'docs',
      '+media-insert',
      '--doc',
      id,
      '--file',
      `./${path.basename(file)}`,
      '--type',
      'image',
      '--width',
      String(width),
      '--as',
      as,
      '--json'
    ];
    if (mode === 'media' && selection) args.push('--selection-with-ellipsis', selection);
    if (mode === 'media' && before) args.push('--before');
    // 宿主附件可能有硬链接，CLI会拒绝；上传已校验字节的独立副本，保持摘要与实际素材一致。
    const uploadDir = await fs.mkdtemp(path.join(path.dirname(file), '.chart-image-upload-'));
    let inserted;
    try {
      await fs.writeFile(path.join(uploadDir, mode === 'block' ? 'image.png' : path.basename(file)), png, { flag: 'wx', mode: 0o600 });
      if (mode === 'block') await fs.writeFile(path.join(uploadDir, 'image.xml'), `<img path="@./image.png" width="${width}"/>`, { flag: 'wx', mode: 0o600 });
      // 写前留存状态，命令超时或进程中断后禁止盲目重放。
      await fs.writeFile(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      // CLI使用工作目录内的相对路径；原始PNG及回执留在原位置。
      const result = await run(args, { cwd: uploadDir });
      inserted = mode === 'block' ? modernInserted(result, id) : findData(result, 'block_id');
    } finally {
      await fs.rm(uploadDir, { recursive: true, force: true });
    }
    if (
      typeof inserted.block_id !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(inserted.block_id) ||
      (inserted.document_id && inserted.document_id !== id)
    ) {
      throw new Error(`插入结果与目标不一致，请检查回执 ${receiptFile}。`);
    }
    receipt = {
      ...receipt,
      state: 'inserted',
      blockId: inserted.block_id,
      ...(inserted.file_token ? { tokenHash: hash(inserted.file_token) } : {})
    };
    await fs.writeFile(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  }
  const response = await run([
    'api',
    'GET',
    `/open-apis/docx/v1/documents/${id}/blocks/${receipt.blockId}`,
    '--as',
    as,
    '--json'
  ]);
  const block = findData(response, 'block').block;
  if (
    block.block_id !== receipt.blockId ||
    block.block_type !== 27 ||
    typeof block.image?.token !== 'string' ||
    !block.image.token ||
    (receipt.tokenHash && hash(block.image.token) !== receipt.tokenHash)
  ) {
    throw new Error(`图片块回读未通过，请检查回执 ${receiptFile}；图片已保留，不自动重复插入。`);
  }
  if (receipt.targetBlockId) {
    const parent = findData(await getAPI(run, blockPath(id, receipt.parentBlockId), as), 'block').block;
    const children = parent.children;
    const targetIndex = children?.indexOf(receipt.targetBlockId) ?? -1;
    const imageIndex = children?.indexOf(receipt.blockId) ?? -1;
    const image = block.image;
    const displayWidth = image.width * (image.scale ?? 1);
    if (block.parent_id !== receipt.parentBlockId || parent.block_id !== receipt.parentBlockId ||
        targetIndex < 0 || imageIndex < 0 || imageIndex !== targetIndex + (before ? -1 : 1) ||
        image.width !== receipt.intrinsicWidth || image.height !== receipt.intrinsicHeight ||
        !Number.isFinite(displayWidth) || Math.abs(displayWidth - width) > 0.5)
      throw new Error(`图片位置或尺寸回读未通过，请检查回执 ${receiptFile}；不会重复插图。`);
  }
  receipt = { ...receipt, state: 'verified', verifiedAt: new Date().toISOString() };
  await fs.writeFile(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  return { documentId: id, blockId: receipt.blockId, verified: true, receiptPath: receiptFile };
}

export function parseInsertArgs(argv) {
  const allowed = new Set(['image', 'doc', 'width', 'as', 'selection', 'receipt']);
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (argv[i] === '--before') {
      result.before = true;
      continue;
    }
    if (!argv[i].startsWith('--') || !allowed.has(key) || !argv[i + 1] || argv[i + 1].startsWith('--'))
      throw new Error(
        '用法：insert-image.mjs --image <png> --doc <Docx ID/URL> [--width <显示宽度>] [--as user|bot] [--selection <text>] [--before] [--receipt <json>]'
      );
    if (key in result) throw new Error(`重复参数：${key}`);
    result[key] = argv[++i];
  }
  if (!result.image || !result.doc || result.width === undefined) throw new Error('必须指定 --image、--doc 和 --width（导出 logicalWidth 取整或原插图回执 width）。');
  return {
    imagePath: result.image,
    doc: result.doc,
    ...(result.width ? { width: Number(result.width) } : {}),
    as: result.as ?? 'user',
    selection: result.selection,
    before: result.before,
    receiptPath: result.receipt
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve()
    .then(() => insertImage(parseInsertArgs(process.argv.slice(2))))
    .then(result => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch(error => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
