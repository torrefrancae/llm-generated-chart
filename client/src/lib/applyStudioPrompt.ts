import { parseSolarPrompt } from '@/lib/parseSolarPrompt';
import {
  DEFAULT_ECHART,
  DEFAULT_SOLAR,
  defaultEchartFor,
  detectStudioKind,
  type EchartParams,
  type SolarParams,
  type StudioKind,
} from '@/lib/studioModel';

export type PromptApplyResult = {
  kind: StudioKind;
  solar: SolarParams;
  echart: EchartParams;
  topic: string;
  summary: string;
};

export const STUDIO_PROMPT_SAMPLES = [
  'Solar system with 12 fast planets and trails',
  'Stacked bar chart of Q3 product lines',
  'Donut chart of weekend traffic sources',
  'Radar chart of team skills across five traits',
  'Slow waltz solar system with moons',
  'Line chart with smooth trends over eight weeks',
  'Funnel chart from lead to paid',
  'Horizontal bar ranking of top markets',
];

export function applyStudioPrompt(
  raw: string,
  current: { kind: StudioKind; solar: SolarParams; echart: EchartParams }
): PromptApplyResult {
  const text = raw.trim();
  const kind = detectStudioKind(text) || current.kind;
  const topicMatch = text.match(/\b(?:of|about|for)\s+(.+)$/i);
  const topic = (topicMatch?.[1] || text).replace(/\b(chart|graph|plot|solar system|system)\b/gi, '').trim() || 'sample market';

  if (kind === 'solar') {
    const solar = parseSolarPrompt(text, current.solar);
    return {
      kind: 'solar',
      solar: solar.params,
      echart: current.echart,
      topic,
      summary: solar.summary,
    };
  }

  let echart = defaultEchartFor(kind);
  echart = { ...echart, title: topic.slice(0, 48) || echart.title };

  const countCats = text.match(/(\d+)\s*(categor(?:y|ies)|weeks?|months?|points?|slices?|traits?|days?|sessions?)/i);
  if (countCats) echart.categoryCount = Math.max(2, Math.min(12, Number(countCats[1])));

  const countSeries = text.match(/(\d+)\s*(series|lines?|groups?|squads?|product lines?)/i);
  if (countSeries) {
    echart.seriesCount = Math.max(1, Math.min(5, Number(countSeries[1])));
  } else {
    const listed = text.match(/\b(?:across|of)\s+([^.]+?)(?:\s+with\s+|\s+over\s+|$)/i);
    if (listed?.[1] && /,/.test(listed[1])) {
      const parts = listed[1]
        .split(/,| and /i)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2 && parts.length <= 5) echart.seriesCount = parts.length;
    }
  }

  if (/\bstacked\b/i.test(text)) echart.stacked = true;
  if (/\bhorizontal\b/i.test(text)) echart.horizontal = true;
  if (/\bdonut\b/i.test(text)) echart.donut = true;
  if (/\barea\b/i.test(text)) echart.areaFill = true;
  if (/\bsmooth\b/i.test(text)) echart.smooth = true;
  if (/\bno legend\b/i.test(text)) echart.showLegend = false;
  if (/\bno labels?\b/i.test(text)) echart.showLabels = false;

  return {
    kind,
    solar: current.solar,
    echart,
    topic,
    summary: `Showing ${kind.replace(/-/g, ' ')} with live parameters on the right.`,
  };
}

export function initialStudio() {
  return {
    kind: 'solar' as StudioKind,
    solar: DEFAULT_SOLAR,
    echart: DEFAULT_ECHART,
  };
}
