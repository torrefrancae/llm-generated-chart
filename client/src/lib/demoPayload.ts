import type { ChartPayload } from '@/lib/api';
import type { ChartTypeId } from '@/lib/chartTypes';

function days(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `D${i + 1}`);
}

export function demoPayload(chartType: ChartTypeId, topic = 'sample market'): ChartPayload {
  const categories = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
  const series = [
    { name: 'North', data: [42, 55, 38, 70, 48] },
    { name: 'South', data: [28, 33, 41, 36, 52] },
  ];
  const slices = categories.map((name, i) => ({ name, value: 20 + i * 9 }));
  switch (chartType) {
    case 'pie':
    case 'donut':
    case 'rose':
    case 'treemap':
    case 'sunburst':
    case 'funnel':
      return {
        reply: `Here is a ${chartType} view for ${topic}.`,
        chartType,
        title: `${topic} mix`,
        subtitle: 'Dummy data for showcase',
        slices,
      };
    case 'scatter':
    case 'bubble':
      return {
        reply: `Scatter-style ${chartType} for ${topic}.`,
        chartType,
        title: `${topic} correlation`,
        pairs: [
          { x: 12, y: 40, size: 18 },
          { x: 22, y: 55, size: 28 },
          { x: 31, y: 36, size: 16 },
          { x: 44, y: 70, size: 34 },
          { x: 51, y: 48, size: 22 },
        ],
      };
    case 'gauge':
      return {
        reply: `Gauge snapshot for ${topic}.`,
        chartType,
        title: 'Completion',
        value: 76,
        max: 100,
      };
    case 'sankey':
    case 'graph':
      return {
        reply: `Flow map for ${topic}.`,
        chartType,
        title: `${topic} flow`,
        nodes: [{ name: 'Leads' }, { name: 'Trials' }, { name: 'Paid' }, { name: 'Churn' }],
        links: [
          { source: 'Leads', target: 'Trials', value: 60 },
          { source: 'Trials', target: 'Paid', value: 28 },
          { source: 'Trials', target: 'Churn', value: 18 },
        ],
      };
    case 'candlestick':
      return {
        reply: `OHLC sample for ${topic}.`,
        chartType,
        title: `${topic} session`,
        ohlc: days(6).map((date, i) => ({
          date,
          open: 100 + i * 2,
          close: 102 + i * 3,
          low: 97 + i,
          high: 108 + i * 3,
        })),
      };
    case 'boxplot':
      return {
        reply: `Distribution for ${topic}.`,
        chartType,
        title: `${topic} spread`,
        categories,
        series: categories.map((name) => ({
          name,
          data: [10, 18, 24, 30, 42].map((v) => v + name.length),
        })),
      };
    default:
      return {
        reply: `Rendered a ${chartType} chart with dummy ${topic} data.`,
        chartType,
        title: `${topic} overview`,
        subtitle: 'Dummy data for showcase',
        categories: chartType === 'theme-river' ? days(8) : categories,
        series,
      };
  }
}
