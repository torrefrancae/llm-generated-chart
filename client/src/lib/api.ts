import type { ChartTypeId } from '@/lib/chartTypes';
import { applyQuotaFields, readLocalQuota, type QuotaState, TRY_MAX } from '@/lib/quota';

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
  showLegend?: boolean;
  showLabels?: boolean;
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type GenerateOutcome =
  | { supported: true; kind: 'solar'; reply: string; partial?: boolean; warnings?: string[]; used?: number; left?: number; max?: number }
  | { supported: true; kind: 'echart'; payload: ChartPayload; partial?: boolean; warnings?: string[]; used?: number; left?: number; max?: number }
  | { supported: false; reason: string; suggestions: string[]; used?: number; left?: number; max?: number };

export class QuotaError extends Error {
  used: number;
  left: number;
  max: number;

  constructor(message: string, quota: QuotaState) {
    super(message);
    this.name = 'QuotaError';
    this.used = quota.used;
    this.left = quota.left;
    this.max = quota.max;
  }
}

const BASE = '/api/chart';

export function chartApiBase(): string {
  return BASE;
}

export async function fetchUsage(): Promise<QuotaState> {
  try {
    const res = await fetch(`${chartApiBase()}/usage`);
    const data = (await res.json()) as { used?: number; left?: number; max?: number };
    if (!res.ok) return readLocalQuota();
    return applyQuotaFields(data);
  } catch {
    return readLocalQuota();
  }
}

export async function generateChart(
  message: string,
  history: ChatTurn[]
): Promise<{ outcome: GenerateOutcome; quota: QuotaState }> {
  const res = await fetch(`${chartApiBase()}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: history.slice(-6) }),
  });
  const data = (await res.json()) as GenerateOutcome & {
    error?: string;
    used?: number;
    left?: number;
    max?: number;
  };
  const quota = applyQuotaFields(data);

  if (res.status === 429) {
    throw new QuotaError(data.error || `You have used all ${TRY_MAX} chart generates for now.`, quota);
  }
  if (!res.ok) {
    throw new Error(data.error || 'Chart generation failed');
  }
  return { outcome: data, quota };
}
