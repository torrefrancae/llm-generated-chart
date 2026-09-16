import ChartCanvas from '@/components/ChartCanvas';
import SolarControls from '@/components/SolarControls';
import SolarSystemChart from '@/components/SolarSystemChart';
import TypeRail from '@/components/TypeRail';
import { generateChart, type ChartPayload, type ChatTurn } from '@/lib/api';
import { demoPayload } from '@/lib/demoPayload';
import { isChartTypeId } from '@/lib/chartTypes';
import { DEFAULT_SOLAR, type SolarParams } from '@/lib/solarSystem';
import styles from '@/components/Studio.module.css';
import React from 'react';

type Stage = 'solar' | 'ai';

export default function Studio() {
  const [stage, setStage] = React.useState<Stage>('solar');
  const [solar, setSolar] = React.useState<SolarParams>(DEFAULT_SOLAR);
  const [note, setNote] = React.useState('Classic Sol loaded. Click any sample to reshape the system.');
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [payload, setPayload] = React.useState<ChartPayload | null>(null);
  const [thread, setThread] = React.useState<ChatTurn[]>([]);
  const lock = React.useRef(false);

  const run = React.useCallback(
    async (message: string) => {
      const text = message.trim();
      if (!text || lock.current) return;
      lock.current = true;
      setBusy(true);
      setError('');
      setStage('ai');
      setThread((prev) => [...prev, { role: 'user', content: text }]);
      try {
        const next = await generateChart(text, thread);
        setPayload(next);
        setThread((prev) => [...prev, { role: 'assistant', content: next.reply }]);
      } catch (err) {
        const fallbackType = [...text.toLowerCase().matchAll(/[a-z-]+/g)]
          .map((m) => m[0])
          .find((token) => isChartTypeId(token));
        const fallback = demoPayload(fallbackType || 'bar', 'local demo');
        setPayload(fallback);
        setThread((prev) => [...prev, { role: 'assistant', content: fallback.reply }]);
        setError(err instanceof Error ? err.message : 'Could not reach the chart agent');
      } finally {
        setBusy(false);
        lock.current = false;
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
          <h1>Living solar system, then thirty chart styles on demand.</h1>
          <p className={styles.lede}>
            D3 opening scene with one-tap presets. Switch to AI charts when you want ECharts demos.
          </p>
        </div>
      </header>

      {stage === 'solar' ? (
        <section className={styles.solarLayout} aria-label="Solar system showcase">
          <div className={styles.solarStage}>
            <SolarSystemChart params={solar} />
            <p className={styles.solarNote}>{note}</p>
          </div>
          <SolarControls
            params={solar}
            onChange={(next) => {
              setSolar(next);
              setNote('Custom mix. Keep dialing or jump to a sample.');
            }}
            onPreset={(next, label) => {
              setSolar(next);
              setNote(`${label} applied. Orbits and moons update live.`);
            }}
          />
        </section>
      ) : (
        <>
          <TypeRail
            onPick={(prompt) => {
              setInput(prompt);
              void run(prompt);
            }}
          />
          <div className={styles.grid}>
            <section className={styles.chat} aria-label="Chart chat">
              <div className={styles.thread}>
                {thread.length === 0 ? (
                  <p className={styles.hint}>
                    Ask for a stacked bar, radar, funnel, or any of the thirty styles. Dummy data only.
                  </p>
                ) : (
                  thread.map((turn, i) => (
                    <div key={`${turn.role}-${i}`} className={turn.role === 'user' ? styles.user : styles.bot}>
                      {turn.content}
                    </div>
                  ))
                )}
              </div>
              <form
                className={styles.composer}
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = input;
                  setInput('');
                  void run(value);
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Talk about a chart..."
                  aria-label="Chart request"
                  disabled={busy}
                />
                <button type="submit" disabled={busy || !input.trim()}>
                  {busy ? 'Painting...' : 'Generate'}
                </button>
              </form>
              {error ? <p className={styles.error}>{error}. Showing local demo data.</p> : null}
            </section>
            <ChartCanvas payload={payload} busy={busy} />
          </div>
        </>
      )}
    </div>
  );
}
