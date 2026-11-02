#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportImage, parseArgs, NORMAL_CARD_LAYOUT_WIDTH } from './export-image.mjs';
import { insertImage } from './insert-image.mjs';

// 文档正文的默认显示宽度，独立于小组件内794px的图表布局。
export const DEFAULT_DOCUMENT_DISPLAY_WIDTH = 820;

export function parseDeliveryArgs(argv) {
  const exportArgs = [];
  const delivery = {};
  const names = new Set(['doc', 'as', 'selection', 'receipt', 'display-width']);
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--before') {
      delivery.before = true;
      continue;
    }
    if (names.has(arg.slice(2))) {
      const key = arg.slice(2);
      if (key in delivery || !argv[index + 1] || argv[index + 1].startsWith('--'))
        throw new Error(`无效或重复参数：${arg}`);
      delivery[key] = argv[++index];
    } else exportArgs.push(arg);
  }
  if (!delivery.doc && Object.keys(delivery).length)
    throw new Error('--as/--selection/--before/--receipt/--display-width 需要 --doc。');
  return { exportOptions: parseArgs(exportArgs), delivery };
}

export async function deliverImage({ exportOptions, delivery = {} }, deps = {}) {
  const exportFn = deps.exportImage ?? exportImage;
  const insertFn = deps.insertImage ?? insertImage;
  const image = await exportFn({ ...exportOptions, ...(delivery.doc ? { autoLayoutWidth: NORMAL_CARD_LAYOUT_WIDTH } : {}) });
  if (!delivery.doc) return { image };
  try {
    const document = await insertFn({
      imagePath: image.path,
      doc: delivery.doc,
      width: delivery['display-width'] !== undefined ? Number(delivery['display-width']) : DEFAULT_DOCUMENT_DISPLAY_WIDTH,
      as: delivery.as ?? 'user',
      selection: delivery.selection,
      before: delivery.before,
      receiptPath: delivery.receipt
    });
    return { image, document };
  } catch (error) {
    throw new Error(
      `PNG 已保存至 ${image.path}；飞书插图未完成：${error.message}。恢复时使用 insert-image.mjs 及原回执，无需重新渲染。`
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve()
    .then(() => deliverImage(parseDeliveryArgs(process.argv.slice(2))))
    .then(result => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch(error => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
