import { getChartSpecWithContext } from '../../src/atom/chartGenerator/spec';
import { ChartType } from '../../src/types';
import { DataType, DataRole } from '@visactor/generate-vchart';

const dataTable = [
  {
    brand_name: 'HUAWEI',
    market_share: 0.194
  },
  {
    brand_name: 'OPPO',
    market_share: 0.146
  },
  {
    brand_name: 'VIVO',
    market_share: 0.17
  },
  {
    brand_name: 'APPLE',
    market_share: 0.141
  },
  {
    brand_name: 'HONOR',
    market_share: 0.137
  },
  {
    brand_name: 'XIAOMI',
    market_share: 0.166
  },
  {
    brand_name: 'OTHERS',
    market_share: 0.046
  }
];

describe('getChartSpecWithContext - Circular Progress', () => {
  it('should generate correct basic Pie Chart spec', () => {
    const context = {
      chartTypeList: Object.values(ChartType),
      dataTable: dataTable,
      transpose: false,
      command: 'Generate a circular progress chart',
      fieldInfo: [
        {
          fieldName: 'brand_name',
          type: DataType.STRING,
          role: DataRole.DIMENSION
        },
        {
          fieldName: 'market_share',
          type: DataType.RATIO,
          role: DataRole.MEASURE
        }
      ],
      cell: {
        value: 'market_share',
        category: 'brand_name'
      },
      chartType:'CIRCULAR_PROGRESS',
      spec: {
        type: 'circularProgress',
        valueField: 'market_share',
        categoryField: 'brand_name'
      }
    };
    const { chartType, spec } = getChartSpecWithContext(context);
    expect(chartType).toBe('Circular Progress');
    expect(spec.type).toBe('circularProgress');
    expect(spec.valueField).toBe('market_share');
    expect(spec.categoryField).toBe('brand_name');
    expect(spec.data.values).toEqual(dataTable);
  });
});