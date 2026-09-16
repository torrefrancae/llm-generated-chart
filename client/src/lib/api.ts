import type { ChartTypeId } from '@/lib/chartTypes';

export type ChartSeries = {
  name: string;
  data: number[];
};

export type ChartPayload = {
  reply: string;
  chartType: ChartTypeId;
  title: string;
  subtitle?: string;
  categories?: string[];
  series?: ChartSeries[];
  pairs?: Array<{ x: number; y: number; size?: number; name?: string }>;
  slices?: Array<{ name: string; value: number }>;
  nodes?: Array<{ name: string }>;
  links?: Array<{ source: string; target: string; value: number }>;
  matrix?: number[][];
  ohlc?: Array<{ date: string; open: number; close: number; low: number; high: number }>;
  value?: number;
  max?: number;
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

const BASE = '/sample/ai-generate-app';

export function chartApiBase(): string {
  if (typeof window === 'undefined') return `${BASE}/api`;
  return `${BASE}/api`;
}

export async function generateChart(message: string, history: ChatTurn[]): Promise<ChartPayload> {
  const res = await fetch(`${chartApiBase()}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: history.slice(-6) }),
  });
  const data = (await res.json()) as ChartPayload & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Chart generation failed');
  }
  return data;
}
