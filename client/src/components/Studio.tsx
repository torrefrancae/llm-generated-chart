import ChartCanvas from '@/components/ChartCanvas';
import DynamicParams from '@/components/DynamicParams';
import PromptDock from '@/components/PromptDock';
import SolarSystemChart from '@/components/SolarSystemChart';
import { generateChart, type ChartPayload } from '@/lib/api';
import { applyStudioPrompt, STUDIO_PROMPT_SAMPLES } from '@/lib/applyStudioPrompt';
import { isChartTypeId } from '@/lib/chartTypes';
import {
  buildPayloadFromParams,
  DEFAULT_ECHART,
  DEFAULT_SOLAR,
  payloadHasData,
  type EchartParams,
  type SolarParams,
  type StudioKind,
} from '@/lib/studioModel';
import styles from '@/components/Studio.module.css';
import React from 'react';

export default function Studio() {
  const [kind, setKind] = React.useState<StudioKind>('solar');
  const [solar, setSolar] = React.useState<SolarParams>(DEFAULT_SOLAR);
  const [echart, setEchart] = React.useState<EchartParams>(DEFAULT_ECHART);
  const [topic, setTopic] = React.useState('sample market');
  const [prompt, setPrompt] = React.useState('');
  const [status, setStatus] = React.useState(
    'Ask for a chart type below. The stage waits for real generated data before drawing.'
  );
  const [waiting, setWaiting] = React.useState(false);
  const [payload, setPayload] = React.useState<ChartPayload | null>(null);
  const requestId = React.useRef(0);
  /* When false, param changes from a prompt must not paint local placeholder data over the agent chart. */
  const allowParamPaint = React.useRef(true);

  const paintFromParams = React.useCallback(
    (nextKind: StudioKind, nextEchart: EchartParams, nextTopic: string) => {
      if (nextKind === 'solar' || !isChartTypeId(nextKind)) {
        setPayload(null);
        return;
      }
      setPayload(buildPayloadFromParams(nextKind, nextEchart, nextTopic));
    },
    []
  );

  const applyPrompt = React.useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const local = applyStudioPrompt(text, { kind, solar, echart });
      const id = ++requestId.current;
      setPrompt('');
      setStatus('Generating chart...');
      allowParamPaint.current = false;

      setKind(local.kind);
      setSolar(local.solar);
      setEchart(local.echart);
      setTopic(local.topic);

      if (local.kind === 'solar') {
        setPayload(null);
        setWaiting(false);
        setStatus(`${local.summary} Ready now.`);
        allowParamPaint.current = true;
        return;
      }

      /* Do not flash local placeholder data. Wait for the agent, then draw once. */
      setPayload(null);
      setWaiting(true);

      try {
        const next = await generateChart(text, []);
        if (id !== requestId.current) return;
        if (payloadHasData(next)) {
          setPayload(next);
          setKind(next.chartType);
          setStatus(next.reply || 'Chart ready.');
        } else {
          paintFromParams(local.kind, local.echart, local.topic);
          setStatus('Agent returned incomplete data. Showing local fallback.');
          allowParamPaint.current = true;
        }
      } catch {
        if (id !== requestId.current) return;
        paintFromParams(local.kind, local.echart, local.topic);
        setStatus('Agent unavailable. Showing local fallback dummy data.');
        allowParamPaint.current = true;
      } finally {
        if (id === requestId.current) setWaiting(false);
      }
    },
    [kind, solar, echart, paintFromParams]
  );

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.brand}>AI Chart Generator</p>
        <p className={styles.lede}>
          Prompt any chart type. The stage loads first, then draws when data is ready.
        </p>
      </header>

      <section className={styles.workspace} aria-label="Chart studio">
        <div className={styles.stage}>
          {kind === 'solar' ? (
            <SolarSystemChart params={solar} />
          ) : (
            <ChartCanvas payload={waiting ? null : payloadHasData(payload) ? payload : null} busy={waiting} />
          )}
        </div>

        <DynamicParams
          kind={kind}
          solar={solar}
          echart={echart}
          onSolar={(next) => {
            setSolar(next);
            setStatus('Solar parameters updated.');
          }}
          onEchart={(next) => {
            allowParamPaint.current = true;
            setEchart(next);
            if (kind !== 'solar' && isChartTypeId(kind) && !waiting) {
              paintFromParams(kind, next, topic);
            }
            setStatus('Parameters updated.');
          }}
          onPresetSolar={(next, label) => {
            setKind('solar');
            setSolar(next);
            setPayload(null);
            setWaiting(false);
            allowParamPaint.current = true;
            setStatus(`${label} loaded.`);
          }}
        />

        <PromptDock
          value={prompt}
          busy={waiting}
          placeholder="Ask for a chart, e.g. stacked bar of Q3 sales, or solar system with 10 fast planets"
          submitLabel="Generate"
          samples={STUDIO_PROMPT_SAMPLES}
          status={status}
          onChange={setPrompt}
          onSubmit={(value) => void applyPrompt(value)}
          onSample={(sample) => void applyPrompt(sample)}
        />
      </section>
    </div>
  );
}
