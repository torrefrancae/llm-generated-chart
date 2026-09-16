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
    'Ask for a solar system, bar chart, donut, radar, or any other style. The right panel follows that chart.'
  );
  const [refining, setRefining] = React.useState(false);
  const [payload, setPayload] = React.useState<ChartPayload | null>(null);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    if (kind === 'solar') return;
    setPayload(buildPayloadFromParams(kind, echart, topic));
  }, [kind, echart, topic]);

  const applyPrompt = React.useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const local = applyStudioPrompt(text, { kind, solar, echart });
      const id = ++requestId.current;
      setKind(local.kind);
      setSolar(local.solar);
      setEchart(local.echart);
      setTopic(local.topic);
      setPrompt('');

      if (local.kind === 'solar') {
        setRefining(false);
        setStatus(`${local.summary} Ready now.`);
        return;
      }

      /* Local dummy chart paints immediately. Agent polish is optional and silent on the canvas. */
      setPayload(buildPayloadFromParams(local.kind, local.echart, local.topic));
      setStatus(`${local.summary} Dummy data is ready. Optional agent polish may follow.`);
      setRefining(true);

      try {
        const next = await generateChart(text, []);
        if (id !== requestId.current) return;
        setPayload(next);
        setKind(next.chartType);
        setStatus(`${next.reply} Agent polish applied.`);
      } catch {
        if (id !== requestId.current) return;
        if (isChartTypeId(local.kind)) {
          setStatus(`${local.summary} Showing local dummy data.`);
        }
      } finally {
        if (id === requestId.current) setRefining(false);
      }
    },
    [kind, solar, echart]
  );

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.brand}>AI Chart Generator</p>
        <p className={styles.lede}>
          One stage, dynamic parameters. Prompt any chart type and tune it on the right.
        </p>
      </header>

      <section className={styles.workspace} aria-label="Chart studio">
        <div className={styles.stage}>
          {kind === 'solar' ? (
            <SolarSystemChart params={solar} />
          ) : (
            <ChartCanvas payload={payload} busy={false} refining={refining} />
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
            setEchart(next);
            setStatus('Chart parameters updated on local dummy data.');
          }}
          onPresetSolar={(next, label) => {
            setKind('solar');
            setSolar(next);
            setStatus(`${label} loaded.`);
          }}
        />

        <PromptDock
          value={prompt}
          busy={false}
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
