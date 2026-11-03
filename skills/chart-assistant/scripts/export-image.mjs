#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import { open, link, unlink, access } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

// 产品域名依据 chart-editor-app/src/utils/http.ts；新入口须部署后才可线上使用。
export const DEFAULT_ENDPOINT = 'https://charteasy.visactor.com/api/v1/chart_assistant/export_image';
// 对齐 chart-editor-app/src/const/display-width.ts：818 宿主宽减左右各12，正常卡片内容宽794。
// 保持客户端自包含，不运行时导入编辑器仓库。
export const NORMAL_CARD_LAYOUT_WIDTH = 794;
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_INPUT_BYTES = 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function buildRequest(value, { width, height, layoutWidth, autoLayoutWidth, dpr = 2, background = 'transparent' } = {}) {
  for (const [name, number] of Object.entries({ width, height, layoutWidth, autoLayoutWidth, dpr })) {
    if (number !== undefined && (!Number.isInteger(number) || number < 1)) throw new Error(`${name} 必须是正整数`);
  }
  if (width > 4096 || height > 4096 || layoutWidth > 4096 || autoLayoutWidth > 4096 || dpr > 4) throw new Error('逻辑边长不得超过 4096，dpr 不得超过 4');
  if (width * height * dpr * dpr > 8_000_000) throw new Error('图片像素总量超过 8M');
  if (typeof background !== 'string' || !/^(transparent|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8})$/.test(background)) {
    throw new Error('background 必须为 transparent 或十六进制颜色');
  }
  let input;
  if (Array.isArray(value)) input = { type: 'editorData', editorData: value };
  else if (object(value)) {
    // 保存态优先，避免 record 中旧 commonOption 覆盖用户后续编辑。
    const saved = value.editorData ?? value.browserData;
    if (saved !== undefined) {
      if (!Array.isArray(saved)) throw new Error('保存态必须是 ILayerData[]');
      input = { type: 'editorData', editorData: saved };
    } else if (object(value.commonOption)) input = { type: 'commonOption', commonOption: value.commonOption };
    else if (Array.isArray(value.elements)) input = { type: 'commonOption', commonOption: value };
  }
  if (!input) throw new Error('输入必须是 commonOption、record 或 ILayerData[]');
  if (input.type === 'editorData' && input.editorData.length !== 1) throw new Error('图片导出只支持一个画布');
  const singleChart = input.type === 'commonOption' && input.commonOption.elements?.length === 1 && input.commonOption.elements[0]?.type === 'chart';
  if (layoutWidth !== undefined && !singleChart) throw new Error('layoutWidth 仅支持单图表 commonOption；保存态和多元素画布保留原布局');
  const targetLayoutWidth = layoutWidth ?? (singleChart ? autoLayoutWidth : undefined);
  return { protocol_version: '1.0', input, output: { format: 'png', ...(targetLayoutWidth !== undefined ? { layoutWidth: targetLayoutWidth } : {}), ...(width !== undefined ? { width } : {}), ...(height !== undefined ? { height } : {}), dpr, background } };
}

function requestPng(endpoint, payload, timeoutMs, maxResponseBytes) {
  const url = new URL(endpoint);
  if (url.username || url.password || url.hash || url.search) throw new Error('endpoint 不接受凭证、查询参数或片段');
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))
    throw new Error('endpoint 必须使用 HTTPS，本地 loopback 除外');
  return new Promise((resolveRequest, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const body = Buffer.from(JSON.stringify(payload));
    if (body.length > MAX_INPUT_BYTES) {
      reject(new Error('导出请求超过 1 MiB'));
      return;
    }
    const req = transport.request(
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'image/png', 'content-length': body.length }
      },
      res => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`图片导出失败：HTTP ${res.statusCode}；未生成图片`));
          req.destroy();
          return;
        }
        if (res.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'image/png') {
          res.resume();
          reject(new Error('服务未返回 image/png'));
          req.destroy();
          return;
        }
        const chunks = [];
        let size = 0;
        res.on('data', chunk => {
          size += chunk.length;
          if (size > maxResponseBytes) {
            const error = new Error('图片响应超过大小限制');
            reject(error);
            req.destroy(error);
          } else chunks.push(chunk);
        });
        res.on('error', reject);
        res.on('end', () => resolveRequest({ bytes: Buffer.concat(chunks), headers: res.headers }));
      }
    );
    const timer = setTimeout(() => req.destroy(new Error('图片导出请求超时')), timeoutMs);
    req.on('close', () => clearTimeout(timer));
    req.on('error', reject);
    req.end(body);
  });
}

export async function exportImage({
  inputPath,
  outputPath,
  width,
  height,
  layoutWidth,
  autoLayoutWidth,
  dpr = 2,
  background = 'transparent',
  endpoint = DEFAULT_ENDPOINT,
  timeoutMs = 60_000,
  maxResponseBytes = MAX_BYTES
}) {
  if (!inputPath || !outputPath) throw new Error('必须提供 inputPath 和 outputPath');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isSafeInteger(maxResponseBytes) || maxResponseBytes <= 0)
    throw new Error('无效的超时或响应大小限制');
  const path = resolve(outputPath);
  try {
    await access(path);
    throw new Error('输出文件已存在，请选择新路径');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const file = await open(inputPath, 'r');
  let value;
  try {
    if ((await file.stat()).size > MAX_INPUT_BYTES) throw new Error('输入超过 1 MiB');
    value = JSON.parse(await file.readFile('utf8'));
  } finally {
    await file.close();
  }
  const payload = buildRequest(value, { width, height, layoutWidth, autoLayoutWidth, dpr, background });
  const { bytes, headers } = await requestPng(endpoint, payload, timeoutMs, maxResponseBytes);
  if (
    bytes.length < 45 ||
    !bytes.subarray(0, 8).equals(PNG_SIGNATURE) ||
    bytes.readUInt32BE(8) !== 13 ||
    bytes.toString('ascii', 12, 16) !== 'IHDR'
  )
    throw new Error('服务返回无效 PNG');
  const pixelWidth = bytes.readUInt32BE(16),
    pixelHeight = bytes.readUInt32BE(20);
  if (!pixelWidth || !pixelHeight || pixelWidth * pixelHeight > 8_000_000) throw new Error('PNG 实际尺寸无效或超过 8M');
  const numberHeader = (name, fallback) => {
    const raw = headers[name];
    if (raw === undefined) return fallback;
    if (typeof raw !== 'string' || !/^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(raw)) throw new Error('PNG 尺寸响应头无效');
    const number = Number(raw);
    if (!Number.isFinite(number) || number <= 0) throw new Error('PNG 尺寸响应头无效');
    return number;
  };
  if (numberHeader('x-image-width', pixelWidth) !== pixelWidth || numberHeader('x-image-height', pixelHeight) !== pixelHeight) throw new Error('PNG 实际尺寸与响应头不符');
  const imageDpr = numberHeader('x-image-dpr', dpr);
  if (imageDpr !== dpr) throw new Error('PNG 倍率与请求不符');
  const logicalWidth = numberHeader('x-image-logical-width', pixelWidth / imageDpr);
  const logicalHeight = numberHeader('x-image-logical-height', pixelHeight / imageDpr);
  // 内容边界可能有小数，导出栅格取整最多产生一个像素误差。
  if (Math.abs(logicalWidth * imageDpr - pixelWidth) > 1 || Math.abs(logicalHeight * imageDpr - pixelHeight) > 1) throw new Error('PNG 逻辑尺寸与像素尺寸不符');
  const temporary = resolve(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  try {
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    // 同目录 hard link 原子发布且拒绝覆盖，包括并发创建的目标文件。
    await link(temporary, path);
  } finally {
    await unlink(temporary).catch(() => {});
  }
  const receipt = { path, width: pixelWidth, height: pixelHeight, logicalWidth, logicalHeight, dpr: imageDpr };
  for (const [field, header] of [
    ['requestId', 'x-request-id'],
    ['renderVersion', 'x-render-version']
  ]) {
    if (typeof headers[header] === 'string' && /^[\w.:-]{1,128}$/.test(headers[header]))
      receipt[field] = headers[header];
  }
  return receipt;
}

export function parseArgs(argv) {
  const options = {};
  const names = {
    input: 'inputPath',
    output: 'outputPath',
    width: 'width',
    'layout-width': 'layoutWidth',
    height: 'height',
    dpr: 'dpr',
    background: 'background',
    endpoint: 'endpoint'
  };
  for (let index = 0; index < argv.length; index++) {
    const name = argv[index].replace(/^--/, '');
    if (
      !argv[index].startsWith('--') ||
      !names[name] ||
      !argv[index + 1] ||
      argv[index + 1].startsWith('--') ||
      names[name] in options
    )
      throw new Error(`无效参数：${argv[index]}`);
    options[names[name]] = ['width', 'height', 'dpr', 'layout-width'].includes(name) ? Number(argv[++index]) : argv[++index];
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  Promise.resolve()
    .then(() => exportImage(parseArgs(process.argv.slice(2))))
    .then(receipt => process.stdout.write(`${JSON.stringify(receipt)}\n`))
    .catch(error => {
      process.stderr.write(`图片导出失败：${error.message}\n`);
      process.exitCode = 1;
    });
}
