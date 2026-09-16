import { CHART_TYPES } from '@/lib/chartTypes';
import { STUDIO_PROMPT_SAMPLES } from '@/lib/applyStudioPrompt';

export type ChartNotice = {
  title: string;
  body: string;
  covered: string[];
  suggestions: string[];
};

export const COVERED_CHART_LABELS = [
  'Solar system (D3)',
  ...CHART_TYPES.map((item) => item.label),
];

export function noticeFromLlmReject(reason: string, suggestions: string[]): ChartNotice {
  return {
    title: 'That request is not a match for our chart list',
    body: reason,
    covered: COVERED_CHART_LABELS,
    suggestions: suggestions.length ? suggestions.slice(0, 6) : STUDIO_PROMPT_SAMPLES.slice(0, 6),
  };
}

export function noticeForUnknownOrFailed(text: string, reason: 'unknown' | 'failed'): ChartNotice {
  const unknown = reason === 'unknown';
  return {
    title: unknown ? 'We could not match that chart type' : 'Chart generation failed',
    body: unknown
      ? `We could not map "${text.slice(0, 90)}${text.length > 90 ? '...' : ''}" to a supported chart. Here is the honest coverage list, then try one of the working prompts.`
      : 'The generator could not complete that request. Here is what this app covers, plus prompts that usually work.',
    covered: COVERED_CHART_LABELS,
    suggestions: STUDIO_PROMPT_SAMPLES.slice(0, 6),
  };
}
