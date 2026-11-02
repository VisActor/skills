const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value));

/** 独立产品包的协议预检；实际统计算法和图面由编辑器验证。 */
export function validateBusinessProtocols(options, at) {
  const failures = [];
  const fail = message => failures.push(`${at}.options.config: ${message}`);
  const context = options.config?.businessContext;
  if (context !== undefined) {
    if (!object(context) || context.version !== 1 || !Array.isArray(context.comparisons) || Object.keys(context).some(key => !['version', 'comparisons', 'bulletComparisons'].includes(key))) {
      fail('businessContext requires version:1 and comparisons array');
    } else {
      const seen = new Set();
      const markers = options.config?.marker?.markLine ?? options.marker?.markLine ?? [];
      context.comparisons.forEach(comparison => {
        if (!object(comparison) || typeof comparison.markerId !== 'string' || !comparison.markerId.trim() ||
            !['high', 'low', 'unknown'].includes(comparison.metricDirection) ||
            Object.keys(comparison).some(key => !['markerId', 'metricDirection'].includes(key)) || seen.has(comparison.markerId)) {
          fail('businessContext comparison requires a unique markerId and explicit high/low/unknown direction');
        } else {
          seen.add(comparison.markerId);
          const marker = (Array.isArray(markers) ? markers : [markers]).find(marker => marker?.id === comparison.markerId);
          if (!marker || !['hierarchy-diff-line', 'total-diff-line', 'growth-line'].includes(marker.name)) fail(`businessContext marker ${comparison.markerId} must reference a supported difference or growth marker`);
        }
      });
      if (context.bulletComparisons !== undefined) {
        if (options.chartType !== 'bullet' || !Array.isArray(context.bulletComparisons)) {
          fail('bulletComparisons requires native bullet and an array');
        } else {
          const categories = new Set();
          const mapping = options.config?.mappingSpec;
          const roles = Array.isArray(mapping?.y) ? mapping.y : [mapping?.y];
          let source = options.data?.value;
          if (typeof source === 'string') { try { source = JSON.parse(source); } catch { source = undefined; } }
          const sourceRows = source?.data;
          const sourceFields = source?.columns;
          if (options.data?.type !== 'standard' || !Array.isArray(sourceRows) || !Array.isArray(sourceFields) ||
              typeof mapping?.x !== 'string' || !sourceFields.includes(mapping.x)) {
            fail('bulletComparisons requires a standard source and explicit category mapping');
          }
          context.bulletComparisons.forEach(comparison => {
            const category = comparison?.category;
            const categoryKey = `${typeof category}:${JSON.stringify(category)}`;
            if (!object(comparison) || Object.keys(comparison).some(key => !['category', 'actualField', 'targetField', 'metricDirection'].includes(key)) ||
                !((typeof category === 'string' && category.length > 0) || (typeof category === 'number' && Number.isFinite(category))) ||
                typeof comparison.actualField !== 'string' || !comparison.actualField.trim() ||
                typeof comparison.targetField !== 'string' || !comparison.targetField.trim() ||
                comparison.actualField === comparison.targetField ||
                !['high', 'low', 'unknown'].includes(comparison.metricDirection) || categories.has(categoryKey)) {
              fail('bulletComparisons requires unique categories, distinct actual/target fields and explicit direction');
            }
            categories.add(categoryKey);
            if (roles[0] !== comparison?.actualField || roles[1] !== comparison?.targetField ||
                !sourceFields?.includes(comparison?.actualField) || !sourceFields?.includes(comparison?.targetField) ||
                !sourceRows?.some(row => row?.[mapping?.x] === category &&
                  finite(row?.[comparison.actualField]) && finite(row?.[comparison.targetField]))) {
              fail('bulletComparisons must bind mapped actual/target numeric values for an existing category');
            }
          });
        }
      }
    }
  }
  const type = options.chartType;
  const statistics = options.config?.statistics;
  if (!['histogram', 'boxPlot'].includes(type)) {
    if (statistics !== undefined) fail('statistics requires native histogram or boxPlot template');
    return failures;
  }
  if (!object(statistics) || statistics.kind !== type) {
    fail(`${type} requires an explicit matching statistics protocol`);
    return failures;
  }
  if (options.data?.type !== 'standard') fail('statistics requires standard source data');
  let value = options.data?.value;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { value = undefined; } }
  const mapping = options.config?.mappingSpec;
  const columns = value?.columns;
  const rows = value?.data;
  const histogram = type === 'histogram';
  const samples = statistics.input === 'samples';
  const allowed = histogram ? ['kind', 'input', 'measure', ...(samples ? ['boundaries', 'closure'] : [])]
    : ['kind', 'input', ...(samples ? ['quartileMethod', 'whiskerMethod', 'whiskerMultiplier'] : [])];
  if (Object.keys(statistics).some(key => !allowed.includes(key))) fail('statistics contains unsupported keys');
  if (!samples && statistics.input !== (histogram ? 'bins' : 'fiveNumber')) fail('unsupported statistics input');
  if (histogram) {
    if (!['count', 'density'].includes(statistics.measure)) fail('histogram measure must be count or density');
    if (samples && (statistics.closure !== 'left-closed-last-inclusive' || !Array.isArray(statistics.boundaries) || statistics.boundaries.length < 2 ||
        statistics.boundaries.some((value, index, values) => !Number.isFinite(value) || (index > 0 && value <= values[index - 1])))) fail('histogram requires strictly increasing explicit boundaries and left-closed-last-inclusive closure');
  } else if (samples && (!['linear-r7', 'linear-r6', 'tukey-hinges'].includes(statistics.quartileMethod) ||
      !['tukey', 'min-max'].includes(statistics.whiskerMethod) ||
      (statistics.whiskerMethod === 'tukey' ? statistics.whiskerMultiplier !== 1.5 : statistics.whiskerMultiplier !== undefined))) {
    fail('boxPlot samples require an explicit R7/R6/Tukey-hinges quartile and Tukey 1.5 IQR or min-max whisker');
  }
  const numeric = samples ? ['value'] : histogram ? ['binStart', 'binEnd', 'count'] : ['min', 'q1', 'median', 'q3', 'max'];
  const required = [...numeric, ...(!histogram && !samples ? ['category'] : [])];
  if (!object(mapping) || !Array.isArray(columns) || !Array.isArray(rows) || !rows.length) {
    fail('statistics requires explicit mapping and non-empty standard rows/columns');
    return failures;
  }
  required.forEach(key => { if (typeof mapping[key] !== 'string' || !columns.includes(mapping[key])) fail(`statistics mapping.${key} must reference a source column`); });
  const mappingKeys = [...required, ...(!histogram && samples ? ['group'] : []), ...(!histogram && !samples ? ['outliers'] : [])];
  if (Object.keys(mapping).some(key => !mappingKeys.includes(key))) fail('statistics mapping contains unsupported roles');
  const mapped = [...required, ...(mapping.group !== undefined ? ['group'] : [])].map(key => mapping[key]);
  if (new Set(mapped).size !== mapped.length) fail('statistics roles must bind distinct source fields');
  if (mapping.group !== undefined && (!samples || histogram || typeof mapping.group !== 'string' || !columns.includes(mapping.group))) fail('boxPlot group must reference a source column');
  if (mapping.outliers !== undefined && (samples || histogram || typeof mapping.outliers !== 'string' || !columns.includes(mapping.outliers) || mapped.includes(mapping.outliers))) fail('boxPlot outliers must bind a distinct source column');
  const cell = (row, key) => Array.isArray(row) ? row[columns.indexOf(mapping[key])] : row?.[mapping[key]];
  const categories = new Set();
  const categoryTypes = new Set();
  const validCategory = value => (typeof value === 'string' && value.trim() !== '') || (typeof value === 'number' && Number.isFinite(value));
  rows.forEach((row, index) => {
    const categoryRole = !histogram && !samples ? 'category' : !histogram && mapping.group !== undefined ? 'group' : undefined;
    if (categoryRole) {
      const category = cell(row, categoryRole);
      if (!validCategory(category)) fail(`statistics row ${index} requires a non-empty string or finite numeric category`);
      categoryTypes.add(typeof category);
      if (!samples) {
        if (categories.has(category)) fail('fiveNumber categories must be unique');
        categories.add(category);
      }
    }
    if (numeric.some(key => !finite(cell(row, key)))) { fail(`statistics row ${index} requires finite numeric values`); return; }
    if (histogram && samples && Array.isArray(statistics.boundaries) && (Number(cell(row, 'value')) < statistics.boundaries[0] || Number(cell(row, 'value')) > statistics.boundaries.at(-1))) fail(`statistics row ${index} falls outside explicit bin boundaries`);
    if (histogram && !samples && (!(Number(cell(row, 'binStart')) < Number(cell(row, 'binEnd'))) || !Number.isSafeInteger(Number(cell(row, 'count'))) || Number(cell(row, 'count')) < 0)) fail(`statistics row ${index} requires increasing bin bounds and non-negative integer count`);
    if (!histogram && !samples && numeric.some((key, index) => index > 0 && Number(cell(row, key)) < Number(cell(row, numeric[index - 1])))) fail(`statistics row ${index} requires min <= q1 <= median <= q3 <= max`);
    if (!histogram && !samples && mapping.outliers !== undefined) {
      let outliers = cell(row, 'outliers');
      if (typeof outliers === 'string') { try { outliers = JSON.parse(outliers); } catch { outliers = undefined; } }
      if (!Array.isArray(outliers) || outliers.some(point => typeof point !== 'number' || !Number.isFinite(point) ||
          !(point < Number(cell(row, 'min')) || point > Number(cell(row, 'max'))))) {
        fail(`statistics row ${index} outliers must be a finite JSON number array outside the given whiskers`);
      }
    }
  });
  if (!histogram && samples && statistics.quartileMethod === 'linear-r6') {
    const group = mapping.group;
    const counts = new Map();
    rows.forEach(row => { const key = group ? `${typeof cell(row, 'group')}:${JSON.stringify(cell(row, 'group'))}` : '__all__'; counts.set(key, (counts.get(key) ?? 0) + 1); });
    if ([...counts.values()].some(count => count < 3)) fail('linear-r6 requires at least three samples in every group');
  }
  if (categoryTypes.size > 1) fail('statistics categories must use a consistent type');
  if (histogram && !samples && numeric.every(key => typeof mapping[key] === 'string')) {
    const ordered = [...rows].sort((a, b) => Number(cell(a, 'binStart')) - Number(cell(b, 'binStart')));
    if (ordered.some((row, index) => index > 0 && Number(cell(row, 'binStart')) !== Number(cell(ordered[index - 1], 'binEnd')))) fail('histogram bins must be contiguous and non-overlapping');
    const total = rows.reduce((sum, row) => sum + Number(cell(row, 'count')), 0);
    if (!Number.isSafeInteger(total)) fail('histogram total count must be a safe integer');
    if (statistics.measure === 'density' && total <= 0) fail('histogram density requires a positive total count');
    ordered.forEach(row => { const width = Number(cell(row, 'binEnd')) - Number(cell(row, 'binStart')); if (!Number.isFinite(width) || (statistics.measure === 'density' && !Number.isFinite(Number(cell(row, 'count')) / total / width))) fail('histogram derived width and density must be finite'); });
  }
  return failures;
}
