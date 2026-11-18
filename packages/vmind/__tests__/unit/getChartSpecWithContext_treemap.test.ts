import { ChartType } from '../../src';
import { getChartSpecWithContext } from '../../src/atom/chartGenerator/spec';
import { parseCSVData } from '../../src/utils/dataTable';

describe('getChartSpecWithContext', () => {
  it('should generate correct basic treemap spec', () => {
    const { dataset } = parseCSVData(`Category-0,Category-1,Category-2,Category-3,value
query,methods,add,,593
query,AggregateExpression,,,1616
util,math,DenseMatrix,,3165
animate,interpolate,ArrayInterpolator,,1983
flex,FlareVis,,,4116`);
    const context = {
      chartTypeList: Object.values(ChartType),
      dataTable: dataset,
      command: 'Genarate a basic treemap chart',
      cell: {
        color: ['Category-0', 'Category-1', 'Category-2', 'Category-3'],
        size: 'value'
      },
      chartType: ChartType.TreemapChart.toUpperCase()
    };
    const { chartType, spec } = getChartSpecWithContext(context);
    expect(chartType).toBe(ChartType.TreemapChart);
    expect(spec.type).toBe('treemap');
    expect(spec.categoryField).toBe('name');
    expect(spec.valueField).toBe('value');
    expect(spec.label.visible).toBe(true);
  });

  it('should generate correct basic treemap spec with one color', () => {
    const { dataset } = parseCSVData(`Category-0,value
add,593
average,287
count,277
FlareVis,4116`);
    const context = {
      chartTypeList: Object.values(ChartType),
      dataTable: dataset,
      command: 'Genarate a basic treemap chart',
      cell: {
        color: 'Category-0',
        size: 'value'
      },
      chartType: ChartType.TreemapChart.toUpperCase()
    };
    const { chartType, spec } = getChartSpecWithContext(context);
    expect(chartType).toBe(ChartType.TreemapChart);
    expect(spec.type).toBe('treemap');
    expect(spec.categoryField).toBe('name');
    expect(spec.valueField).toBe('value');
    expect(spec.label.visible).toBe(true);
  });
});
