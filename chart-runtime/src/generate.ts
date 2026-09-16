import { Agent } from '@cursor/sdk';
import * as path from 'path';
import { chartKeys } from './key';

const SANDBOX = path.resolve(__dirname, '../sandbox');

export const CHART_TYPE_IDS = [
  'bar',
  'grouped-bar',
  'stacked-bar',
  'horizontal-bar',
  'line',
  'multi-line',
  'area',
  'stacked-area',
  'pie',
  'donut',
  'rose',
  'scatter',
  'bubble',
  'radar',
  'heatmap',
  'calendar-heatmap',
  'treemap',
  'sunburst',
  'funnel',
  'gauge',
  'sankey',
  'candlestick',
  'boxplot',
  'histogram',
  'waterfall',
  'polar-bar',
  'parallel',
  'theme-river',
  'pictorial-bar',
  'graph',
] as const;

export type ChartTypeId = (typeof CHART_TYPE_IDS)[number];

export type ChartPayload = {
  reply: string;
  chartType: ChartTypeId;
  title: string;
  subtitle?: string;
  categories?: string[];
  series?: Array<{ name: string; data: number[] }>;
  pairs?: Array<{ x: number; y: number; size?: number; name?: string }>;
  slices?: Array<{ name: string; value: number }>;
  nodes?: Array<{ name: string }>;
  links?: Array<{ source: string; target: string; value: number }>;
  matrix?: number[][];
  ohlc?: Array<{ date: string; open: number; close: number; low: number; high: number }>;
  value?: number;
  max?: number;
};

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no json object');
  return JSON.parse(raw.slice(start, end + 1));
}

function isType(value: string): value is ChartTypeId {
  return (CHART_TYPE_IDS as readonly string[]).includes(value);
}

function normalize(raw: unknown): ChartPayload {
  const obj = (raw || {}) as Record<string, unknown>;
  const chartType = typeof obj.chartType === 'string' && isType(obj.chartType) ? obj.chartType : 'bar';
  return {
    reply: typeof obj.reply === 'string' ? obj.reply.slice(0, 500) : 'Here is a demo chart.',
    chartType,
    title: typeof obj.title === 'string' ? obj.title.slice(0, 120) : 'Demo chart',
    subtitle: typeof obj.subtitle === 'string' ? obj.subtitle.slice(0, 160) : undefined,
    categories: Array.isArray(obj.categories) ? obj.categories.map(String).slice(0, 24) : undefined,
    series: Array.isArray(obj.series)
      ? obj.series.slice(0, 8).map((s) => {
          const row = s as { name?: string; data?: unknown[] };
          return {
            name: String(row.name || 'Series'),
            data: Array.isArray(row.data) ? row.data.map((n) => Number(n) || 0).slice(0, 32) : [],
          };
        })
      : undefined,
    pairs: Array.isArray(obj.pairs)
      ? obj.pairs.slice(0, 40).map((p) => {
          const row = p as { x?: number; y?: number; size?: number; name?: string };
          return {
            x: Number(row.x) || 0,
            y: Number(row.y) || 0,
            size: row.size === undefined ? undefined : Number(row.size) || 12,
            name: row.name ? String(row.name) : undefined,
          };
        })
      : undefined,
    slices: Array.isArray(obj.slices)
      ? obj.slices.slice(0, 16).map((s) => {
          const row = s as { name?: string; value?: number };
          return { name: String(row.name || 'Item'), value: Number(row.value) || 0 };
        })
      : undefined,
    nodes: Array.isArray(obj.nodes)
      ? obj.nodes.slice(0, 24).map((n) => ({ name: String((n as { name?: string }).name || 'Node') }))
      : undefined,
    links: Array.isArray(obj.links)
      ? obj.links.slice(0, 40).map((l) => {
          const row = l as { source?: string; target?: string; value?: number };
          return {
            source: String(row.source || ''),
            target: String(row.target || ''),
            value: Number(row.value) || 1,
          };
        })
      : undefined,
    ohlc: Array.isArray(obj.ohlc)
      ? obj.ohlc.slice(0, 40).map((d) => {
          const row = d as { date?: string; open?: number; close?: number; low?: number; high?: number };
          return {
            date: String(row.date || ''),
            open: Number(row.open) || 0,
            close: Number(row.close) || 0,
            low: Number(row.low) || 0,
            high: Number(row.high) || 0,
          };
        })
      : undefined,
    value: obj.value === undefined ? undefined : Number(obj.value) || 0,
    max: obj.max === undefined ? undefined : Number(obj.max) || 100,
  };
}

function buildPrompt(message: string, history: ChatTurn[]): string {
  return [
    'You generate demo chart payloads for a portfolio showcase app.',
    'Return ONLY one JSON object. No markdown outside the JSON.',
    `Allowed chartType values: ${CHART_TYPE_IDS.join(', ')}.`,
    'Invent realistic dummy data. Never use real private credentials.',
    'JSON shape: { reply, chartType, title, subtitle?, categories?, series?, pairs?, slices?, nodes?, links?, ohlc?, value?, max? }',
    'Pick the best chartType for the user request. Keep reply under 2 sentences.',
    'Recent turns:',
    ...history.slice(-6).map((t) => `${t.role}: ${t.content.slice(0, 300)}`),
    `user: ${message.slice(0, 600)}`,
  ].join('\n');
}

export async function generateChartPayload(message: string, history: ChatTurn[]): Promise<ChartPayload> {
  const keys = chartKeys();
  if (!keys.length) throw new Error('missing cursor api key');
  let last: unknown = new Error('missing cursor api key');
  for (const key of keys) {
    try {
      const result = await Agent.prompt(buildPrompt(message, history), {
        apiKey: key,
        model: { id: 'auto' },
        local: { cwd: SANDBOX, settingSources: [] },
      });
      if (result.status !== 'finished') {
        throw new Error(`chart agent ${result.status}`);
      }
      const text = (result.result || '').trim();
      if (!text) throw new Error('chart agent quiet');
      return normalize(extractJson(text));
    } catch (err) {
      last = err;
    }
  }
  if (last instanceof Error) throw last;
  throw new Error('chart generation failed');
}
