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

export function chartApiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === '127.0.0.1' || host === 'localhost') {
      return process.env.NEXT_PUBLIC_CHART_API_BASE || 'http://127.0.0.1:3093';
    }
  }
  return process.env.NEXT_PUBLIC_CHART_API_BASE || '/api/chart';
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
