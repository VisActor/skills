import { ChartType } from '../../src';
import { getChartSpecWithContext } from '../../src/atom/chartGenerator/spec';

describe('getChartSpecWithContext', () => {
  it('should generate correct basic liquid spec', () => {
    const data = [{ value: 0.76 }];
    const context = {
      chartTypeList: Object.values(ChartType),
      dataTable: data,
      command: 'Genarate a basic liquid chart',
      cell: {
        value: 'value'
      },
      chartType: ChartType.LiquidChart.toUpperCase()
    };
    const { chartType, spec } = getChartSpecWithContext(context);
    expect(chartType).toBe(ChartType.LiquidChart);
    expect(spec.type).toBe('liquid');
    expect(spec.valueField).toBe(context.cell.value);
    expect(spec.data.values).toEqual(data);
    expect(spec.indicatorSmartInvert).toBe(true);
  });

  it('should generate correct basic liquid spec with custom title', () => {
    const data = [{ title: '当前进度', value: 0.76 }];
    const context = {
      chartTypeList: Object.values(ChartType),
      dataTable: data,
      command: 'Genarate a basic liquid chart',
      cell: {
        x: 'title',
        value: 'value'
      },
      chartType: ChartType.LiquidChart.toUpperCase()
    };
    const { chartType, spec } = getChartSpecWithContext(context);
    expect(chartType).toBe(ChartType.LiquidChart);
    expect(spec.type).toBe('liquid');
    expect(spec.data.values).toEqual(data);
    expect(spec.valueField).toBe(context.cell.value);
    expect(spec.indicator.title.style.text).toBe('当前进度');
    expect(spec.indicatorSmartInvert).toBe(true);
  });
});
