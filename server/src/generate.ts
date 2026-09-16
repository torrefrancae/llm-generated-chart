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

export type GenerateOutcome =
  | { supported: true; kind: 'solar'; reply: string; partial?: boolean; warnings?: string[] }
  | { supported: true; kind: 'echart'; payload: ChartPayload; partial?: boolean; warnings?: string[] }
  | {
      supported: false;
      reason: string;
      suggestions: string[];
    };

const DEFAULT_SUGGESTIONS = [
  'Line chart of CPU usage over 60 minutes',
  'Candlestick chart of 12 trading sessions',
  'Stacked bar chart of Q3 product lines',
  'Donut chart of weekend traffic sources',
  'Radar chart of team skills across five traits',
  'Solar system with 12 fast planets and trails',
];

const MAX_POINTS = 60;

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

function asStringList(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw)) return fallback;
  const items = raw.map((item) => String(item).trim()).filter(Boolean).slice(0, 6);
  return items.length ? items : fallback;
}

function normalizePayload(obj: Record<string, unknown>, chartType: ChartTypeId): ChartPayload {
  return {
    reply: typeof obj.reply === 'string' ? obj.reply.slice(0, 500) : 'Here is a demo chart.',
    chartType,
    title: typeof obj.title === 'string' ? obj.title.slice(0, 120) : 'Demo chart',
    subtitle: typeof obj.subtitle === 'string' ? obj.subtitle.slice(0, 160) : undefined,
    categories: Array.isArray(obj.categories)
      ? obj.categories.map(String).slice(0, MAX_POINTS)
      : undefined,
    series: Array.isArray(obj.series)
      ? obj.series.slice(0, 8).map((s) => {
          const row = s as { name?: string; data?: unknown[] };
          return {
            name: String(row.name || 'Series'),
            data: Array.isArray(row.data)
              ? row.data.map((n) => Number(n) || 0).slice(0, MAX_POINTS)
              : [],
          };
        })
      : undefined,
    pairs: Array.isArray(obj.pairs)
      ? obj.pairs.slice(0, MAX_POINTS).map((p) => {
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

function payloadFitsType(payload: ChartPayload): boolean {
  const t = payload.chartType;
  if (t === 'candlestick') return Boolean(payload.ohlc?.length);
  if (['pie', 'donut', 'rose', 'treemap', 'sunburst', 'funnel'].includes(t)) {
    return Boolean(payload.slices?.length);
  }
  if (t === 'scatter' || t === 'bubble') return Boolean(payload.pairs?.length);
  if (t === 'gauge') return payload.value !== undefined;
  if (t === 'sankey' || t === 'graph') {
    return Boolean(payload.nodes?.length && payload.links?.length);
  }
  if (!payload.series?.length) return false;
  const pointCount = payload.series[0]?.data?.length || 0;
  if (pointCount < 2) return false;
  if (payload.categories?.length) {
    const catCount = payload.categories.length;
    /* Allow small mismatch after truncation, but reject empty or wildly mismatched axes. */
    if (Math.abs(catCount - pointCount) > 2 && Math.min(catCount, pointCount) < 8) return false;
  }
  return true;
}

function buildPrompt(message: string, history: ChatTurn[]): string {
  return [
    'You assess and optionally generate demo chart payloads for a portfolio showcase app.',
    'Return ONLY one JSON object. No markdown outside the JSON.',
    '',
    'STEP 1 - ASSESS MATCH:',
    `Allowed chartType values (exactly one must match, or reject): solar, ${CHART_TYPE_IDS.join(', ')}.`,
    'Match only when the user clearly wants one of those chart kinds.',
    'SOLAR RULE: If the user mentions planets, moons, orbits, or a solar/star system scene, chartType MUST be "solar".',
    'Example: "10 planets with 2-10 moons each" => solar. Never turn planet/moon scenes into bar/line charts.',
    'A plain line chart of time-series values (e.g. CPU % over 60 minutes) IS supported as chartType "line".',
    '',
    'PARTIAL MATCHES (important):',
    'If the core chart is supported but extras are not (dual-axis, secondary axis, combo bar+line overlay, 3D, geo maps, Gantt),',
    'still return the best single supported chart AND set:',
    '  "partial": true,',
    '  "warnings": ["short list of unsupported extras we skipped"]',
    'Example: dual-axis revenue bars + margin line => chartType "bar" or "multi-line" with partial/warnings.',
    'Only use supported:false when NOTHING on the allowed list can reasonably fulfill the request.',
    '',
    'If NOT supported, return exactly:',
    '{ "supported": false, "reason": "short honest reason", "suggestions": ["prompt1","prompt2","prompt3"] }',
    'Suggestions must be prompts that fit the allowed list.',
    '',
    'If supported and chartType is "solar", return:',
    '{ "supported": true, "chartType": "solar", "reply": "short confirmation", "partial?": false, "warnings?": [] }',
    '',
    'If supported and chartType is any other allowed id, return:',
    '{ "supported": true, "chartType": "<id>", "reply": "...", "title": "...", "subtitle?": "...",',
    '  "partial?": false, "warnings?": [],',
    '  "categories?": [], "series?": [{ "name": "", "data": [] }], "pairs?": [], "slices?": [],',
    '  "nodes?": [], "links?": [], "ohlc?": [], "value?": 0, "max?": 100 }',
    'Invent realistic dummy data. Never use real private credentials.',
    `Honor requested point counts up to ${MAX_POINTS} (e.g. 60 minute CPU samples => 60 categories + 60 values).`,
    'If the user asked for more than the cap, still generate up to the cap and add a warnings entry about the cap.',
    'Keep reply under 2 sentences.',
    'Recent turns:',
    ...history.slice(-6).map((t) => `${t.role}: ${t.content.slice(0, 300)}`),
    `user: ${message.slice(0, 600)}`,
  ].join('\n');
}

function readWarnings(obj: Record<string, unknown>): { partial: boolean; warnings: string[] } {
  const warnings = asStringList(obj.warnings, []).filter((item) => item.length > 0);
  const partial = obj.partial === true || warnings.length > 0;
  return { partial, warnings };
}

function toOutcome(raw: unknown): GenerateOutcome {
  const obj = (raw || {}) as Record<string, unknown>;

  if (obj.supported === false) {
    return {
      supported: false,
      reason:
        typeof obj.reason === 'string' && obj.reason.trim()
          ? obj.reason.trim().slice(0, 280)
          : 'That request does not match a chart type we cover.',
      suggestions: asStringList(obj.suggestions, DEFAULT_SUGGESTIONS),
    };
  }

  const chartTypeRaw = typeof obj.chartType === 'string' ? obj.chartType.trim() : '';
  const { partial, warnings } = readWarnings(obj);
  if (chartTypeRaw === 'solar') {
    return {
      supported: true,
      kind: 'solar',
      reply: typeof obj.reply === 'string' ? obj.reply.slice(0, 500) : 'Solar system ready.',
      partial: partial || undefined,
      warnings: warnings.length ? warnings : undefined,
    };
  }

  if (!isType(chartTypeRaw)) {
    return {
      supported: false,
      reason: `The model did not map this to one of our ${CHART_TYPE_IDS.length} chart types (or solar).`,
      suggestions: asStringList(obj.suggestions, DEFAULT_SUGGESTIONS),
    };
  }

  const payload = normalizePayload(obj, chartTypeRaw);
  if (!payloadFitsType(payload)) {
    return {
      supported: false,
      reason: `Matched "${chartTypeRaw}" but the generated data was incomplete or inconsistent, so we did not draw a wrong chart.`,
      suggestions: asStringList(obj.suggestions, DEFAULT_SUGGESTIONS),
    };
  }

  return {
    supported: true,
    kind: 'echart',
    payload,
    partial: partial || undefined,
    warnings: warnings.length ? warnings : undefined,
  };
}

async function promptOnce(key: string, message: string, history: ChatTurn[]): Promise<GenerateOutcome> {
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
  return toOutcome(extractJson(text));
}

export async function generateChartOutcome(message: string, history: ChatTurn[]): Promise<GenerateOutcome> {
  const keys = chartKeys();
  if (!keys.length) throw new Error('chart service unavailable');
  let last: unknown = new Error('chart service unavailable');
  for (const key of keys) {
    try {
      return await promptOnce(key, message, history);
    } catch (err) {
      last = err;
    }
  }
  if (last instanceof Error) throw last;
  throw new Error('chart generation failed');
}
