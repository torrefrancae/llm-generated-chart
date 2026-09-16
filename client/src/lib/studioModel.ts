import type { ChartPayload } from '@/lib/api';
import type { ChartTypeId } from '@/lib/chartTypes';
import { CHART_TYPES, isChartTypeId } from '@/lib/chartTypes';
import { DEFAULT_SOLAR, type SolarParams } from '@/lib/solarSystem';

export type StudioKind = 'solar' | ChartTypeId;

export type EchartParams = {
  title: string;
  categoryCount: number;
  seriesCount: number;
  showLegend: boolean;
  showLabels: boolean;
  stacked: boolean;
  horizontal: boolean;
  smooth: boolean;
  areaFill: boolean;
  donut: boolean;
  gaugeValue: number;
  gaugeMax: number;
};

export const DEFAULT_ECHART: EchartParams = {
  title: 'Demo series',
  categoryCount: 5,
  seriesCount: 2,
  showLegend: true,
  showLabels: true,
  stacked: false,
  horizontal: false,
  smooth: true,
  areaFill: false,
  donut: false,
  gaugeValue: 72,
  gaugeMax: 100,
};

export function defaultEchartFor(kind: ChartTypeId): EchartParams {
  const base = { ...DEFAULT_ECHART, title: CHART_TYPES.find((t) => t.id === kind)?.label || 'Demo' };
  if (kind === 'stacked-bar' || kind === 'stacked-area') return { ...base, stacked: true };
  if (kind === 'horizontal-bar') return { ...base, horizontal: true };
  if (kind === 'area' || kind === 'stacked-area') return { ...base, areaFill: true };
  if (kind === 'donut') return { ...base, donut: true };
  if (kind === 'line' || kind === 'multi-line') return { ...base, smooth: true };
  if (kind === 'pie' || kind === 'donut' || kind === 'rose' || kind === 'funnel') {
    return { ...base, seriesCount: 1, categoryCount: 5 };
  }
  if (kind === 'gauge') return { ...base, seriesCount: 1, categoryCount: 1 };
  return base;
}

function cats(n: number): string[] {
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu'];
  return names.slice(0, Math.max(2, Math.min(12, n)));
}

function series(count: number, points: number): Array<{ name: string; data: number[] }> {
  const labels = ['North', 'South', 'East', 'West', 'Core'];
  return Array.from({ length: Math.max(1, Math.min(5, count)) }, (_, s) => ({
    name: labels[s] || `Series ${s + 1}`,
    data: Array.from({ length: points }, (_, i) => Math.round(18 + ((s + 1) * 11 + i * 7) % 57)),
  }));
}

export function resolveChartType(kind: ChartTypeId, params: EchartParams): ChartTypeId {
  if (kind === 'bar' || kind === 'grouped-bar' || kind === 'stacked-bar' || kind === 'horizontal-bar') {
    if (params.horizontal) return 'horizontal-bar';
    if (params.stacked) return 'stacked-bar';
    if (params.seriesCount > 1) return 'grouped-bar';
    return 'bar';
  }
  if (kind === 'line' || kind === 'multi-line' || kind === 'area' || kind === 'stacked-area') {
    if (params.areaFill && params.stacked) return 'stacked-area';
    if (params.areaFill) return 'area';
    if (params.seriesCount > 1) return 'multi-line';
    return 'line';
  }
  if (kind === 'pie' || kind === 'donut') return params.donut ? 'donut' : 'pie';
  return kind;
}

export function buildPayloadFromParams(
  kind: ChartTypeId,
  params: EchartParams,
  topic = 'sample market'
): ChartPayload {
  const chartType = resolveChartType(kind, params);
  const categories = cats(params.categoryCount);
  const rows = series(params.seriesCount, categories.length);
  const slices = categories.map((name, i) => ({
    name,
    value: 12 + i * 8 + (i % 3) * 5,
  }));

  const flags = { showLegend: params.showLegend, showLabels: params.showLabels };

  if (['pie', 'donut', 'rose', 'treemap', 'sunburst', 'funnel'].includes(chartType)) {
    return {
      reply: `Updated ${chartType} from parameters.`,
      chartType,
      title: params.title || `${topic} mix`,
      subtitle: 'Live parameter preview',
      slices: slices.slice(0, params.categoryCount),
      ...flags,
    };
  }
  if (chartType === 'scatter' || chartType === 'bubble') {
    return {
      reply: `Updated ${chartType} from parameters.`,
      chartType,
      title: params.title || `${topic} correlation`,
      pairs: categories.map((_, i) => ({
        x: 10 + i * 8,
        y: 20 + ((i * 13) % 40),
        size: chartType === 'bubble' ? 12 + i * 4 : undefined,
      })),
      ...flags,
    };
  }
  if (chartType === 'gauge') {
    return {
      reply: 'Updated gauge from parameters.',
      chartType,
      title: params.title || 'Completion',
      value: params.gaugeValue,
      max: params.gaugeMax,
      ...flags,
    };
  }
  if (chartType === 'sankey' || chartType === 'graph') {
    return {
      reply: `Updated ${chartType} from parameters.`,
      chartType,
      title: params.title || `${topic} flow`,
      nodes: [{ name: 'Leads' }, { name: 'Trials' }, { name: 'Paid' }, { name: 'Churn' }],
      links: [
        { source: 'Leads', target: 'Trials', value: 40 + params.seriesCount * 5 },
        { source: 'Trials', target: 'Paid', value: 18 + params.categoryCount },
        { source: 'Trials', target: 'Churn', value: 12 },
      ],
      ...flags,
    };
  }

  return {
    reply: `Updated ${chartType} from parameters.`,
    chartType,
    title: params.title || `${topic} overview`,
    subtitle: 'Live parameter preview',
    categories,
    series: rows,
    ...flags,
  };
}

export function detectStudioKind(text: string): StudioKind | null {
  const t = text.toLowerCase();
  if (/\bsolar|planet|orbit|sun system|star system\b/.test(t)) return 'solar';
  for (const item of [...CHART_TYPES].sort((a, b) => b.label.length - a.label.length)) {
    const label = item.label.toLowerCase();
    if (t.includes(item.id.replace(/-/g, ' ')) || t.includes(label) || t.includes(item.id)) {
      return item.id;
    }
  }
  if (/\bbar\b/.test(t)) return 'bar';
  if (/\bline\b/.test(t)) return 'line';
  if (/\bpie\b/.test(t)) return 'pie';
  if (/\bradar\b/.test(t)) return 'radar';
  if (/\bfunnel\b/.test(t)) return 'funnel';
  if (/\bgauge\b/.test(t)) return 'gauge';
  return null;
}

export function isStudioKind(value: string): value is StudioKind {
  return value === 'solar' || isChartTypeId(value);
}

export { DEFAULT_SOLAR };
export type { SolarParams };
