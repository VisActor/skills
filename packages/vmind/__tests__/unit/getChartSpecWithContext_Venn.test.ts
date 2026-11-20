import { getChartSpecWithContext } from '../../src/atom/chartGenerator/spec';
import { ChartType } from '../../src/types';
import * as vChart from '@visactor/vchart';

jest.mock('@visactor/vchart', () => ({
  registerVennChart: jest.fn()
}));

const dataTable_2 = [
  { group: 'A', category: 'A', size: 8 },
  { group: 'B', size: 10 },
  { group: 'C', category: 'C', size: null },
  { group: 'A∩B', category: 'A', size: 4 },
  { group: 'A∩B', category: 'B', size: 4 }
];

const dataTable_4 = [
  { group: 'A', category: 'A', size: 8 },
  { group: 'B', category: 'B', size: 10 },
  { group: 'C', category: 'C', size: 12 },

  { group: 'A∩B', category: 'A', size: 4 },
  { group: 'A∩B', category: 'B', size: 4 },

  { group: 'A∩C', category: 'A', size: 4 },
  { group: 'A∩C', category: 'C', size: 4 },

  { group: 'B∩C', category: 'B', size: 4 },
  { group: 'B∩C', category: 'C', size: 4 },

  { group: 'A∩B∩C', category: 'A', size: 2 },
  { group: 'A∩B∩C', category: 'B', size: 2 },
  { group: 'A∩B∩C', category: 'C', size: 2 }
];

const datatemplate_4 = {
  values: [
    { sets: ['A'], value: 8 },
    { sets: ['B'], value: 10 },
    { sets: ['C'], value: 12 },
    { sets: ['A', 'B'], value: 4 },
    { sets: ['A', 'C'], value: 4 },
    { sets: ['B', 'C'], value: 4 },
    { sets: ['A', 'B', 'C'], value: 2 }
  ]
};

describe('getChartSpecWithContext - Venn Chart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should transform data to venn format', () => {
    const context = {
      chartType: ChartType.VennChart.toUpperCase(),
      dataTable: dataTable_4,
      cell: {
        color: ['group', 'category'],
        size: 'size'
      }
    };

    const result = getChartSpecWithContext(context);

    expect(result.spec).toBeDefined();
    expect(result.spec.type).toBe('venn');
    expect(result.spec.data).toEqual(datatemplate_4);
  });

  it('should set correct venn diagram fields', () => {
    const context = {
      chartType: ChartType.VennChart.toUpperCase(),
      dataTable: dataTable_4,
      cell: {
        color: ['group', 'category'],
        size: 'size'
      }
    };
    const result = getChartSpecWithContext(context);

    expect(result.spec.valueField).toBe('value');
    expect(result.spec.categoryField).toBe('sets');
    expect(result.spec.seriesField).toBe('sets');
  });

  it('should register venn chart when type is venn', () => {
    const context = {
      chartType: ChartType.VennChart.toUpperCase(),
      dataTable: dataTable_4,
      cell: {
        color: ['group', 'category'],
        size: 'size'
      }
    };
    const result = getChartSpecWithContext(context);
    expect(result).toBeDefined();
    expect(vChart.registerVennChart).toHaveBeenCalled();
  });

  it('should handle missing values in dataTable gracefully', () => {
    const context = {
      chartType: ChartType.VennChart.toUpperCase(),
      dataTable: dataTable_2,
      cell: {
        color: ['group', 'category'],
        size: 'size'
      }
    };

    const result = getChartSpecWithContext(context);
    expect(result.spec).toBeDefined();
  });

  it('should handle missing dataTable fields gracefully', () => {
    const context = {
      chartType: ChartType.VennChart.toUpperCase(),
      cell: {
        color: ['group', 'category'],
        size: 'size'
      },
      dataTable: [{}]
    };

    const result = getChartSpecWithContext(context);
    expect(result.spec).toBeDefined();
  });

  it('should handle missing cell fields gracefully', () => {
    const context = {
      chartType: ChartType.VennChart.toUpperCase(),
      dataTable: dataTable_2,
      cell: {}
    };

    const result = getChartSpecWithContext(context);
    expect(result.spec).toBeDefined();
  });
});
