import { validateBusinessProtocols } from './business-protocol-validation.mjs';
// 独立于仓库运行时的结构检查；通过不代表来源可访问或图形已渲染。
export const editableConfigKeys = new Set([
  'statistics', 'businessContext', 'mappingSpec', 'modelSpec', 'marker', 'color', 'stackType', 'syncAxisDomain', 'theme',
  'templateVersion', 'dataTransposed', 'transposed', 'dataGroupSpec', 'markStyle',
  'markZIndexRange', 'barLink', 'trendLine', 'partitionArea',
  'smallMultiplesChartType', 'smallMultiplesColumns',
  'butterflyAxisPosition', 'dumbbellArrow', 'kpiCardLayout', 'kpiCardStyle', 'kpiCardStyleMap'
]);
const elementTypes = new Set([
  'chart', 'table', 'text', 'rect', 'oval', 'diamond', 'callout', 'image', 'svg',
  'straightLine', 'elbowLine', 'curveLine', 'chartConnectorLine'
]);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const ordinaryStackTemplates = new Set(['bar', 'area', 'mekko']);
const columnDataTypes = new Set(['number', 'date', 'text']);
const formatDataTypes = new Set(['digit', 'percent', 'permil']);
const inheritedFontKeys = ['fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'fontStyle'];

// 只检查样式中的确定性几何关系；不解释业务数据、target 或动态样式函数。
// 仅合并确定适用于全部图元的覆盖；业务组/单图元的匹配交给运行时。
// 局部 patch 不补默认值，也不修改输入。
export function validateTextureLayouts(input, location = 'input') {
  const failures = [];
  const skippedKeys = new Set(['data', 'values', 'target', 'selector', 'sourceInfo']);
  const layoutKeys = ['textureSize', 'texturePadding'];
  const textureKeys = ['texture', ...layoutKeys];
  const allGroup = 'EDITOR_ALL_DATA_GROUP';
  const hasTexture = style => object(style) && textureKeys.some(key => style[key] !== undefined);
  const inspectStyleTree = (value, path, policies = new Map()) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => inspectStyleTree(item, `${path}[${index}]`, policies));
      return;
    }
    if (!object(value)) return;
    const policy = policies.get(path);
    const style = { ...value };
    if (policy?.inheritNull) layoutKeys.forEach(key => { if (style[key] === null) delete style[key]; });
    if (policy?.allStyle) {
      textureKeys.forEach(key => {
        const override = policy.allStyle[key];
        // 编辑态空尺寸不写入图元；原始 spec 的空尺寸仍应检查。
        if (override !== undefined && !(override === null && layoutKeys.includes(key))) style[key] = override;
      });
    }
    if (!policy?.defer && style.texture !== null && typeof style.texture !== 'function') {
      const active = text(style.texture);
      const size = style.textureSize;
      const padding = style.texturePadding;
      const finiteSize = typeof size === 'number' && Number.isFinite(size) && size > 0;
      const finitePadding = typeof padding === 'number' && Number.isFinite(padding) && padding >= 0;
      if (size !== undefined && typeof size !== 'function' && !(size === null && !active) && !finiteSize) {
        failures.push(`${path}.textureSize: must be a finite positive number for an active texture.`);
      }
      if (padding !== undefined && typeof padding !== 'function' && !(padding === null && !active) && !finitePadding) {
        failures.push(`${path}.texturePadding: must be a finite non-negative number for an active texture.`);
      }
      if (finiteSize && finitePadding && size <= 2 * padding) {
        failures.push(`${path}: textureSize must exceed 2 * texturePadding; otherwise the texture has no drawable area.`);
      }
    }
    Object.entries(value).forEach(([key, child]) => {
      if (!skippedKeys.has(key)) inspectStyleTree(child, `${path}.${key}`, policies);
    });
  };
  const inspectChartOptions = (options, path) => {
    if (!object(options)) return;
    const config = object(options.config) ? options.config : {};
    const valueOf = key => config[key] !== undefined ? config[key] : options[key];
    const pathOf = key => `${path}${config[key] !== undefined ? '.config' : ''}.${key}`;
    const groups = object(valueOf('dataGroupSpec')) ? valueOf('dataGroupSpec') : {};
    const singles = valueOf('markStyle');
    const singleEntries = object(singles) || Array.isArray(singles) ? Object.entries(singles) : [];
    const singleOverrides = mark => singleEntries.some(([, entry]) => entry?.markName === mark && hasTexture(entry.style));
    const specificOverrides = mark => Object.entries(groups)
      .some(([group, entry]) => group !== allGroup && hasTexture(entry?.[mark]?.style));
    const policies = new Map();
    const addSeries = (spec, at) => {
      if (!object(spec)) return;
      Object.entries(spec).forEach(([mark, entry]) => {
        if (!object(entry?.style) || skippedKeys.has(mark)) return;
        policies.set(`${at}.${mark}.style`, {
          allStyle: groups[allGroup]?.[mark]?.style,
          defer: specificOverrides(mark) || singleOverrides(mark)
        });
      });
    };
    addSeries(options.spec, `${path}.spec`);
    array(options.spec?.series).forEach((spec, index) => addSeries(spec, `${path}.spec.series[${index}]`));
    const models = valueOf('modelSpec');
    array(models).forEach((model, index) => {
      if (model?.specKey === 'series') {
        addSeries(model.spec, `${pathOf('modelSpec')}${Array.isArray(models) ? `[${index}]` : ''}.spec`);
      }
    });
    Object.entries(groups).forEach(([group, entry]) => {
      if (!object(entry)) return;
      Object.keys(entry).forEach(mark => policies.set(`${pathOf('dataGroupSpec')}[${JSON.stringify(group)}].${mark}.style`, {
        inheritNull: true,
        defer: singleOverrides(mark) || (group === allGroup && specificOverrides(mark))
      }));
    });
    singleEntries.forEach(([id]) => policies.set(
      `${pathOf('markStyle')}${Array.isArray(singles) ? `[${id}]` : `.${id}`}.style`, { inheritNull: true }
    ));
    for (const key of ['spec', 'style']) inspectStyleTree(options[key], `${path}.${key}`, policies);
    for (const key of ['modelSpec', 'dataGroupSpec', 'markStyle', 'marker', 'trendLine', 'partitionArea', 'theme']) {
      const value = valueOf(key);
      const at = pathOf(key);
      if (key === 'dataGroupSpec' && object(value)) {
        // 这里的 key 是业务组名；data/target 等名称也应检查其样式。
        Object.entries(value).forEach(([group, style]) => inspectStyleTree(style, `${at}[${JSON.stringify(group)}]`, policies));
      } else {
        inspectStyleTree(value, at, policies);
      }
    }
  };
  const inspectElements = (elements, path, saved) => {
    if (!Array.isArray(elements)) return;
    elements.forEach((element, index) => {
      const key = saved ? 'attribute' : 'options';
      const at = `${path}[${index}].${key}`;
      if (element?.type === 'chart') inspectChartOptions(element[key], at);
      else inspectStyleTree(element?.[key], at);
    });
  };
  const inspectSaved = (layers, path) => {
    if (Array.isArray(layers)) layers.forEach((layer, index) => inspectElements(layer?.elements, `${path}[${index}].elements`, true));
  };
  if (Array.isArray(input)) inspectSaved(input, location);
  else if (object(input)) {
    const saved = input.editorData ?? input.browserData;
    if (saved !== undefined) inspectSaved(saved, `${location}.${input.editorData != null ? 'editorData' : 'browserData'}`);
    else if (object(input.commonOption)) inspectElements(input.commonOption.elements, `${location}.commonOption.elements`, false);
    else inspectElements(input.elements, `${location}.elements`, false);
  }
  return failures;
}

function validateNumberPresentation(format, path) {
  if (!object(format)) return [];
  const failures = [];
  if (format.significantDigits !== undefined &&
      (!Number.isInteger(format.significantDigits) || format.significantDigits < 1 || format.significantDigits > 20)) {
    failures.push(`${path}.significantDigits: must be an integer from 1 to 20.`);
  }
  if (format.unitSymbol !== undefined && typeof format.unitSymbol !== 'string') {
    failures.push(`${path}.unitSymbol: must be a string.`);
  }
  if (object(format.contentFormat)) {
    Object.entries(format.contentFormat).forEach(([key, value]) => {
      failures.push(...validateNumberPresentation(value, `${path}.contentFormat[${JSON.stringify(key)}]`));
    });
  }
  return failures;
}

function validateComponentNumberPresentation(config, at) {
  const failures = [];
  const visit = (value, path) => {
    if (Array.isArray(value)) return value.forEach((item, i) => visit(item, `${path}[${i}]`));
    if (!object(value)) return;
    Object.entries(value).forEach(([key, item]) => {
      if (key === 'formatConfig') failures.push(...validateNumberPresentation(item, `${path}.${key}`));
      else if (!['data', 'target', 'selector'].includes(key)) visit(item, `${path}.${key}`);
    });
  };
  visit(config, `${at}.options.config`);
  return failures;
}

function validateStandardColumnFormats(options, at) {
  if (options.data?.type !== 'standard' || options.spec !== undefined || options.sourceType !== undefined) return [];
  let value = options.data.value;
  const valuePath = `${at}.options.data.value`;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); }
    catch { return [`${valuePath}: standard data string must contain valid JSON.`]; }
  }
  if (!object(value) || value.columnFormats === undefined) return [];
  if (!Array.isArray(value.columnFormats)) return [`${valuePath}.columnFormats: must be an array.`];
  const failures = [];
  const inspectType = (container, path, allowed) => {
    if (object(container) && container.dataType !== undefined && !allowed.has(container.dataType)) {
      failures.push(`${path}.dataType: unsupported value ${JSON.stringify(container.dataType)}; use ${[...allowed].join('/')}.`);
    }
  };
  value.columnFormats.forEach((column, index) => {
    const path = `${valuePath}.columnFormats[${index}]`;
    inspectType(column, path, columnDataTypes);
    inspectType(column?.dataFormat, `${path}.dataFormat`, formatDataTypes);
    failures.push(...validateNumberPresentation(column?.dataFormat, `${path}.dataFormat`));
    if (object(column?.dataFormat?.contentFormat)) {
      Object.entries(column.dataFormat.contentFormat).forEach(([content, format]) => {
        inspectType(format, `${path}.dataFormat.contentFormat[${JSON.stringify(content)}]`, formatDataTypes);
      });
    }
  });
  return failures;
}

// 新建 standard 图表的交付检查；与可接受局部编辑的结构校验分离。
// 调用侧根据用户明确样式授权提供精确字段路径；不读取 DSL 内的豁免或支持通配符。
export function validateNewChartDefaults(commonOption, location = 'commonOption', { authorizedStylePaths = [] } = {}) {
  const failures = [];
  const authorized = new Set(Array.isArray(authorizedStylePaths) ? authorizedStylePaths.filter(text) : []);
  const inspectInheritedFont = (style, path) => {
    if (!object(style)) return;
    inheritedFontKeys.forEach(key => {
      if (style[key] !== undefined && !authorized.has(`${path}.${key}`)) {
        failures.push(`${path}.${key}: new chart component text must inherit the theme; omit this override unless explicitly requested.`);
      }
    });
  };
  const inspectTitle = (spec, path) => {
    // 缺省标题、隐藏标题、仅样式 patch 保持兼容，不把它们当完整新标题。
    if (spec?.visible !== true || spec.textType !== 'rich' || !Array.isArray(spec.text)) return;
    let line = 0;
    spec.text.forEach((item, index) => {
      if (!object(item) || typeof item.text !== 'string') return;
      const lines = item.text.split(/\r?\n/);
      const levels = new Set();
      lines.forEach((part, partIndex) => {
        if (partIndex) line++;
        if (part.trim()) levels.add(line === 0 ? 'main' : 'secondary');
      });
      levels.forEach(level => {
        const expected = level === 'main' ? { fontSize: 22, fontWeight: '600', lineHeight: 28 } : { fontSize: 12, lineHeight: 18 };
        Object.entries(expected).forEach(([key, expectedValue]) => {
          const fieldPath = `${path}.text[${index}].${key}`;
          const valid = key === 'fontWeight' ? String(item[key]) === expectedValue : item[key] === expectedValue;
          if (!valid && !authorized.has(fieldPath)) failures.push(`${fieldPath}: new chart ${level} title requires ${expectedValue}; use a separate rich-text fragment for each font level.`);
        });
      });
    });
  };
  array(commonOption?.elements).forEach((element, index) => {
    const options = element?.options;
    if (element?.type !== 'chart' || options?.data?.type !== 'standard' ||
        !text(options.chartType) || options.spec !== undefined || options.sourceType !== undefined) return;
    const modelSpec = options.config?.modelSpec !== undefined ? options.config.modelSpec : options.modelSpec;
    const modelPath = `${location}.elements[${index}].options${options.config?.modelSpec !== undefined ? '.config' : ''}.modelSpec`;
    array(modelSpec).forEach((model, modelIndex) => {
      const specPath = `${modelPath}${Array.isArray(modelSpec) ? `[${modelIndex}]` : ''}.spec`;
      if (model?.specKey === 'title') inspectTitle(model.spec, specPath);
      if (model?.specKey === 'axes') {
        inspectInheritedFont(model.spec?.title?.style, `${specPath}.title.style`);
        inspectInheritedFont(model.spec?.label?.style, `${specPath}.label.style`);
      }
      if (model?.specKey === 'legends') inspectInheritedFont(model.spec?.item?.label?.style, `${specPath}.item.label.style`);
      if (model?.specKey === 'series') inspectInheritedFont(model.spec?.label?.style, `${specPath}.label.style`);
      if (model?.specKey === 'axes' && model.spec?.title?.visible === true &&
          model.spec.visible === undefined) {
        failures.push(`${modelPath}${Array.isArray(modelSpec) ? `[${modelIndex}]` : ''} (${model.id ?? 'axis'}).spec.visible: ` +
          'a visible axis title requires explicit parent visibility for new charts; set visible:true, ' +
          'or preserve visible:false only when the user explicitly requested a hidden axis.');
      }
    });
    const dataGroups = options.config?.dataGroupSpec !== undefined ? options.config.dataGroupSpec : options.dataGroupSpec;
    const groupsPath = `${location}.elements[${index}].options${options.config?.dataGroupSpec !== undefined ? '.config' : ''}.dataGroupSpec`;
    if (object(dataGroups)) Object.entries(dataGroups).forEach(([key, group]) => {
      inspectInheritedFont(group?.label?.style, `${groupsPath}[${JSON.stringify(key)}].label.style`);
    });
  });
  return failures;
}

// 仅检查可确定的字段层级；true/false 的选择取决于用户意图，不属于结构校验。
function validateAxisGroupLabelPlacement(options, at) {
  const failures = [];
  const inspectAxis = (axis, path) => {
    if (object(axis?.label) && Object.prototype.hasOwnProperty.call(axis.label, 'showAllGroupLayers')) {
      failures.push(`${path}.label.showAllGroupLayers: belongs on the axis; use ${path}.showAllGroupLayers instead.`);
    }
  };
  array(options.spec?.axes).forEach((axis, index) => {
    inspectAxis(axis, `${at}.options.spec.axes${Array.isArray(options.spec.axes) ? `[${index}]` : ''}`);
  });
  const config = object(options.config) ? options.config : {};
  const modelSpec = config.modelSpec !== undefined ? config.modelSpec : options.modelSpec;
  const modelPath = `${at}.options${config.modelSpec !== undefined ? '.config' : ''}.modelSpec`;
  array(modelSpec).forEach((model, index) => {
    if (model?.specKey === 'axes') {
      inspectAxis(model.spec, `${modelPath}${Array.isArray(modelSpec) ? `[${index}]` : ''}.spec`);
    }
  });
  return failures;
}

// modelSpec 是组件编辑包装，不能将原生 VChart axes 对象直接放入其中。
// 只检查可静态确定的协议；组件是否存在、target 是否唯一仍由运行时验证。
function validateModelSpec(options, at) {
  const config = object(options.config) ? options.config : {};
  const models = config.modelSpec !== undefined ? config.modelSpec : options.modelSpec;
  const path = `${at}.options${config.modelSpec !== undefined ? '.config' : ''}.modelSpec`;
  if (models == null) return [];
  if (!Array.isArray(models)) return [`${path}: must be an array of component edits, not raw VChart components.`];
  const failures = [];
  models.forEach((model, index) => {
    const entry = `${path}[${index}]`;
    if (!object(model)) {
      failures.push(`${entry}: must be a component edit object.`);
      return;
    }
    if (!text(model.specKey)) failures.push(`${entry}.specKey: requires a component collection key; axes edits use "axes".`);
    if (!object(model.spec)) failures.push(`${entry}.spec: requires an object containing the component patch; raw axis options do not belong at the modelSpec entry root.`);
    if (model.specKey !== 'axes') return;
    if (model.specIndex !== undefined && (!Number.isInteger(model.specIndex) || model.specIndex < 0)) {
      failures.push(`${entry}.specIndex: must be a non-negative integer.`);
    }
    if (model.target !== undefined) {
      if (model.id !== undefined || model.specIndex !== undefined) {
        failures.push(`${entry}: semantic axis target must not coexist with id/specIndex.`);
      }
      const target = model.target;
      if (!object(target) || !(text(target.field) || text(target.measure)) ||
          Object.keys(target).some(key => !['field', 'measure', 'orient'].includes(key)) ||
          ['field', 'measure'].some(key => target[key] !== undefined && !text(target[key])) ||
          target.orient !== undefined && !['left', 'right', 'top', 'bottom', 'angle', 'radius'].includes(target.orient)) {
        failures.push(`${entry}.target: requires business field or measure, with optional axis orient.`);
      }
    } else if (!(text(model.id) || typeof model.id === 'number' && Number.isFinite(model.id))) {
      failures.push(`${entry}.id: native axis edit requires a non-empty string or finite number; use a supported semantic target when identity is unknown.`);
    }
  });
  return failures;
}

// 只拒绝模板源码可以确定的组合；导入/未知来源及模型覆盖仍需实际运行时判断。
function validateLayerShareContent(options, at) {
  if (!ordinaryStackTemplates.has(options.chartType) || options.data?.type !== 'standard' ||
      options.spec !== undefined || options.sourceType !== undefined) return [];
  const config = object(options.config) ? options.config : {};
  const effective = key => config[key] !== undefined ? config[key] : options[key];
  if (array(effective('modelSpec')).some(model => object(model?.spec) &&
      Object.prototype.hasOwnProperty.call(model.spec, 'percent'))) return [];
  const markerPath = config.marker !== undefined ? `${at}.options.config.marker` : `${at}.options.marker`;
  return array(effective('marker')?.markLine).flatMap((marker, index) => {
    if (marker?.name !== 'hierarchy-diff-line') return [];
    const shares = array(marker.label).flatMap(label => array(label?.formatConfig?.content))
      .filter(content => content === 'layerShareDiff' || content === 'layerShareGrowthRate');
    return shares.length ? [
      `${markerPath}.markLine[${index}]: ${shares.join('/')} requires comparable percent stacks; ` +
      `${options.chartType} is an ordinary stack template. Use ${options.chartType}Percent for a percent chart, ` +
      'or layerValueDiff/layerGrowthRate for raw-value changes.'
    ] : [];
  });
}

const connectorPositions = new Set([
  'top-left', 'top-right', 'bottom-left', 'bottom-right', 'point',
  'outer-start', 'outer-end', 'inner-start', 'inner-end'
]);

function validateConnectorTarget(options, at, elements) {
  const failures = [];
  const target = options.target;
  if ('data' in options || 'points' in options) failures.push(`${at}: target must not coexist with data/points`);
  if (!object(target)) return [...failures, `${at}.target: must contain from/to endpoints`];
  for (const side of ['from', 'to']) {
    const endpoint = target[side];
    const path = `${at}.target.${side}`;
    if (!object(endpoint)) {
      failures.push(`${path}: endpoint must be an object`);
      continue;
    }
    if (!(text(endpoint.chartId) || typeof endpoint.chartId === 'number' && Number.isFinite(endpoint.chartId))) {
      failures.push(`${path}.chartId: requires a non-empty string or finite number`);
    } else if (!elements.some(element => element?.type === 'chart' && element.id === endpoint.chartId)) {
      failures.push(`${path}.chartId: must reference a chart in this canvas`);
    }
    if (!object(endpoint.selector) || !Object.keys(endpoint.selector).length ||
        !Object.values(endpoint.selector).every(value => value === null || typeof value === 'string' ||
          typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value))) {
      failures.push(`${path}.selector: requires non-empty business fields with scalar values`);
    }
    if (endpoint.measure !== undefined && !text(endpoint.measure)) failures.push(`${path}.measure: must be a non-empty field name`);
    const position = endpoint.position;
    if (!connectorPositions.has(position) && !(object(position) && Object.keys(position).length === 1 &&
        Number.isInteger(position.vertex) && position.vertex >= 0)) {
      failures.push(`${path}.position: unsupported semantic anchor`);
    }
  }
  if (options.lineType !== undefined && !['line', 'hv', 'vh'].includes(options.lineType)) {
    failures.push(`${at}.lineType: must be line/hv/vh`);
  }
  if (options.style !== undefined && !object(options.style)) failures.push(`${at}.style: must be an object`);
  if (options.zIndex !== undefined && !Number.isFinite(options.zIndex)) failures.push(`${at}.zIndex: must be finite`);
  return failures;
}

export function validateCommonOption(commonOption, location = 'commonOption') {
  const failures = validateTextureLayouts(commonOption, location);
  if (!Array.isArray(commonOption?.elements) || !commonOption.elements.length) {
    return [`${location}: commonOption.elements must be non-empty`];
  }
  const ids = new Set();
  const source = commonOption.source;
  if (source?.showSource === true) {
    const sourceName = typeof source.sourceName === 'string' ? source.sourceName : source.sourceName?.zh ?? source.sourceName?.en;
    const pageUrl = typeof source.pageUrl === 'string' ? source.pageUrl : source.pageUrl?.zh ?? source.pageUrl?.en;
    if (!text(sourceName) || !text(pageUrl)) failures.push(`${location}.source: visible source requires non-empty sourceName and pageUrl`);
  }
  commonOption.elements.forEach((element, index) => {
    const at = `${location}.elements[${index}]`;
    if (!object(element)) {
      failures.push(`${at}: element must be an object`);
      return;
    }
    if (!elementTypes.has(element.type)) failures.push(`${at}: unsupported element type ${element.type}`);
    if (element.id != null && ids.has(element.id)) failures.push(`${at}: duplicate element id ${element.id}`);
    if (element.id != null) ids.add(element.id);
    const position = element.position;
    if (position !== undefined) {
      if (!object(position) || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(position[key])) || position.width <= 0 || position.height <= 0) {
        failures.push(`${at}: invalid position`);
      }
    } else if (commonOption.elements.length > 1 && !(element.type === 'chartConnectorLine' && object(element.options) && 'target' in element.options)) {
      failures.push(`${at}: multiple elements require explicit positions`);
    }
    if ('rect' in element || 'attribute' in element) failures.push(`${at}: commonOption element must not use rect/attribute`);
    if (['chartType', 'data', 'config'].some(key => key in element)) failures.push(`${at}: chartType/data/config must be nested in options`);
    const options = element.options;
    if (!object(options)) {
      failures.push(`${at}: options must be an object`);
      return;
    }
    if (element.type === 'chart') {
      const modes = [options.spec !== undefined, options.chartType !== undefined || options.data !== undefined, options.sourceType !== undefined];
      if (modes.filter(Boolean).length !== 1) {
        failures.push(`${at}: choose exactly one chart input: spec, chartType+data, or sourceType`);
      } else if (modes[0]) {
        if (!object(options.spec)) failures.push(`${at}: spec must be an object`);
      } else if (modes[1]) {
        if (!text(options.chartType) || !object(options.data)) failures.push(`${at}: built-in chart requires options.chartType and options.data`);
        if (options.chartType === 'vseedDsl') failures.push(`${at}: vseedDsl requires sourceType and vseedDsl`);
      } else if (options.sourceType === 'aeolus') {
        if (!text(options.sourceInfo?.url)) failures.push(`${at}: aeolus requires sourceInfo.url`);
      } else if (options.sourceType === 'vseedDsl') {
        if (!object(options.vseedDsl)) failures.push(`${at}: vseedDsl requires a DSL object`);
      } else {
        failures.push(`${at}: unsupported sourceType ${options.sourceType}`);
      }
    }
    if (element.type === 'chartConnectorLine' && 'target' in options) {
      failures.push(...validateConnectorTarget(options, `${at}.options`, commonOption.elements));
    }
    const config = options.config;
    if (config !== undefined) {
      if (!object(config)) failures.push(`${at}.options.config: must be an object`);
      else Object.keys(config).forEach(key => {
        if (!editableConfigKeys.has(key)) failures.push(`${at}.options.config: unsupported key ${key}`);
      });
    }
    if (element.type === 'chart') {
      failures.push(...validateBusinessProtocols(options, at));
      failures.push(...validateModelSpec(options, at));
      failures.push(...validateStandardColumnFormats(options, at));
      failures.push(...validateComponentNumberPresentation(options.config, at));
      failures.push(...validateLayerShareContent(options, at));
      failures.push(...validateAxisGroupLabelPlacement(options, at));
    }
  });
  return failures;
}
