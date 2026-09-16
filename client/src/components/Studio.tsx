import AiChartParams from '@/components/AiChartParams';
import ChartCanvas from '@/components/ChartCanvas';
import PromptDock from '@/components/PromptDock';
import SolarControls from '@/components/SolarControls';
import SolarSystemChart from '@/components/SolarSystemChart';
import { generateChart, type ChartPayload, type ChatTurn } from '@/lib/api';
import { demoPayload } from '@/lib/demoPayload';
import { isChartTypeId } from '@/lib/chartTypes';
import { parseSolarPrompt, SOLAR_PROMPT_SAMPLES } from '@/lib/parseSolarPrompt';
import { DEFAULT_SOLAR, type SolarParams } from '@/lib/solarSystem';
import styles from '@/components/Studio.module.css';
import React from 'react';

type Stage = 'solar' | 'ai';

const AI_SAMPLES = [
  'Stacked bar of Q3 product lines',
  'Radar of team skills',
  'Funnel from lead to paid',
  'Donut of weekend traffic sources',
];

export default function Studio() {
  const [stage, setStage] = React.useState<Stage>('solar');
  const [solar, setSolar] = React.useState<SolarParams>(DEFAULT_SOLAR);
  const [solarPrompt, setSolarPrompt] = React.useState('');
  const [solarStatus, setSolarStatus] = React.useState(
    'Solar lab ready. Use a sample prompt or type your own to reshape the system.'
  );
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [aiStatus, setAiStatus] = React.useState('Pick a chart type or write a prompt below.');
  const [payload, setPayload] = React.useState<ChartPayload | null>(null);
  const [thread, setThread] = React.useState<ChatTurn[]>([]);
  const lock = React.useRef(false);

  const applySolarPrompt = React.useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const result = parseSolarPrompt(text, solar);
      setSolar(result.params);
      setSolarStatus(result.summary);
      setSolarPrompt('');
    },
    [solar]
  );

  const runAi = React.useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || lock.current) return;
      lock.current = true;
      setBusy(true);
      setAiStatus('Generating chart...');
      setThread((prev) => [...prev, { role: 'user', content: text }]);
      try {
        const next = await generateChart(text, thread);
        setPayload(next);
        setThread((prev) => [...prev, { role: 'assistant', content: next.reply }]);
        setAiStatus(next.reply);
      } catch (err) {
        const fallbackType = [...text.toLowerCase().matchAll(/[a-z-]+/g)]
          .map((m) => m[0])
          .find((token) => isChartTypeId(token));
        const fallback = demoPayload(fallbackType || 'bar', 'local demo');
        setPayload(fallback);
        setThread((prev) => [...prev, { role: 'assistant', content: fallback.reply }]);
        setAiStatus(
          `${err instanceof Error ? err.message : 'Agent offline'}. Showing local demo data.`
        );
      } finally {
        setBusy(false);
        lock.current = false;
        setAiPrompt('');
      }
    },
    [thread]
  );

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <p className={styles.brand}>AI Chart Generator</p>
          <div className={styles.tabs} role="tablist" aria-label="Studio mode">
            <button
              type="button"
              role="tab"
              aria-selected={stage === 'solar'}
              className={stage === 'solar' ? styles.tabOn : styles.tab}
              onClick={() => setStage('solar')}
            >
              Solar lab
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stage === 'ai'}
              className={stage === 'ai' ? styles.tabOn : styles.tab}
              onClick={() => setStage('ai')}
            >
              AI charts
            </button>
          </div>
        </div>
        <div className={styles.heroBottom}>
          <h1>Chart stage left, parameters right, prompt dock below.</h1>
          <p className={styles.lede}>
            Same studio format for the D3 solar system and the ECharts AI demos.
          </p>
        </div>
      </header>

      <section className={styles.workspace} aria-label={stage === 'solar' ? 'Solar studio' : 'AI chart studio'}>
        <div className={styles.stage}>
          {stage === 'solar' ? (
            <SolarSystemChart params={solar} />
          ) : (
            <ChartCanvas payload={payload} busy={busy} />
          )}
        </div>

        {stage === 'solar' ? (
          <SolarControls
            params={solar}
            onChange={(next) => {
              setSolar(next);
              setSolarStatus('Manual dial update. Prompt dock can still rewrite these.');
            }}
            onPreset={(next, label) => {
              setSolar(next);
              setSolarStatus(`${label} loaded into the parameter panel.`);
            }}
          />
        ) : (
          <AiChartParams
            onPick={(prompt) => {
              setAiPrompt(prompt);
              void runAi(prompt);
            }}
          />
        )}

        {stage === 'solar' ? (
          <PromptDock
            value={solarPrompt}
            placeholder="Describe the system, e.g. 12 fast planets with trails and no moons"
            submitLabel="Apply"
            samples={SOLAR_PROMPT_SAMPLES}
            status={solarStatus}
            onChange={setSolarPrompt}
            onSubmit={applySolarPrompt}
            onSample={(sample) => {
              setSolarPrompt(sample);
              applySolarPrompt(sample);
            }}
          />
        ) : (
          <PromptDock
            value={aiPrompt}
            busy={busy}
            placeholder="Describe an ECharts demo, e.g. stacked bar of Q3 sales"
            submitLabel="Generate"
            samples={AI_SAMPLES}
            status={aiStatus}
            onChange={setAiPrompt}
            onSubmit={(value) => void runAi(value)}
            onSample={(sample) => {
              setAiPrompt(sample);
              void runAi(sample);
            }}
          />
        )}
      </section>
    </div>
  );
}
