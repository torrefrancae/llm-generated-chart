'use client';

import ChartCanvas from '@/components/ChartCanvas';
import TypeRail from '@/components/TypeRail';
import { generateChart, type ChartPayload, type ChatTurn } from '@/lib/api';
import { demoPayload } from '@/lib/demoPayload';
import { isChartTypeId } from '@/lib/chartTypes';
import styles from '@/components/Studio.module.css';
import React from 'react';

export default function Studio() {
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [payload, setPayload] = React.useState<ChartPayload | null>(null);
  const [thread, setThread] = React.useState<ChatTurn[]>([]);
  const lock = React.useRef(false);

  const run = React.useCallback(async (message: string) => {
    const text = message.trim();
    if (!text || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
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
  }, [thread]);

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.brand}>AI Chart Generator</p>
        <h1>Describe the chart. Watch dummy data become a polished viz.</h1>
        <p className={styles.lede}>
          Thirty chart styles, one chat box. Built as a separate sample app under
          /sample/ai-generate-app.
        </p>
      </header>

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
              <p className={styles.hint}>Try: stacked bar of Q3 product lines, or a radar of team skills.</p>
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
    </div>
  );
}
