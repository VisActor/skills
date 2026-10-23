import { getChartSpecWithContext } from '../../src/atom/chartGenerator/spec';
import type { GenerateChartCellContext } from '../../src/atom/chartGenerator/type';
import { ChartType } from '../../src/types';
import { DataType } from '../../src/types/base';
import { ROLE } from '../../src/types/base';

it('Linechart', () => {
  const context = {
    chartTypeList: [
      'Bar Chart',
      'Line Chart',
      'Area Chart',
      'Pie Chart',
      'Scatter Plot',
      'Word Cloud',
      'Rose Chart',
      'Radar Chart',
      'Sankey Chart',
      'Funnel Chart',
      'Dual Axis Chart',
      'Waterfall Chart',
      'Box Plot',
      'Linear Progress chart',
      'Circular Progress chart',
      'Liquid Chart',
      'Bubble Circle Packing',
      'Map Chart',
      'Range Column Chart',
      'Sunburst Chart',
      'Treemap Chart',
      'Gauge Chart',
      'Basic Heat Map',
      'Venn Chart',
      'Dynamic Bar Chart'
    ],
    dataTable: [
      { time: '2:00', value: 38 },
      { time: '4:00', value: 56 },
      { time: '6:00', value: 10 },
      { time: '8:00', value: 70 },
      { time: '10:00', value: 36 },
      { time: '12:00', value: 94 },
      { time: '14:00', value: 24 },
      { time: '16:00', value: 44 },
      { time: '18:00', value: 36 },
      { time: '20:00', value: 68 },
      { time: '22:00', value: 22 }
    ],
    command: 'Generate a line chart with time on the x-axis and value on the y-axis',
    cell: {
      x: 'time',
      y: 'value',
      category: 'time'
    },
    transpose: false,
    chartType: ChartType.LineChart.toUpperCase(),
    fieldInfo: [
      {
        fieldName: 'time',
        type: 'string',
        role: 'dimension'
      },
      {
        fieldName: 'value',
        type: 'number',
        role: 'dimension'
      }
    ]
  };
  const { chartType, spec } = getChartSpecWithContext(context);
  expect(chartType).toBe(ChartType.LineChart);
  expect(spec.type).toBe('line');
});
