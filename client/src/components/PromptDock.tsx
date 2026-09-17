import styles from '@/components/PromptDock.module.css';
import type { QuotaState } from '@/lib/quota';
import React from 'react';

interface Props {
  value: string;
  busy?: boolean;
  spent?: boolean;
  quota: QuotaState;
  placeholder: string;
  submitLabel?: string;
  samples: string[];
  status?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onSample: (value: string) => void;
}

export default function PromptDock({
  value,
  busy,
  spent,
  quota,
  placeholder,
  submitLabel = 'Generate',
  samples,
  status,
  onChange,
  onSubmit,
  onSample,
}: Props) {
  const canSubmit = Boolean(value.trim()) && !busy;
  return (
    <div className={styles.dock}>
      <div className={styles.head}>
        <p className={styles.label}>Prompt box</p>
        <p className={styles.quota} aria-live="polite">
          {spent
            ? `All ${quota.max} LLM generates used - solar prompts still work`
            : `${quota.left} of ${quota.max} LLM generates left`}
        </p>
      </div>
      <div className={styles.meter} aria-hidden>
        {Array.from({ length: quota.max }, (_, i) => (
          <span key={i} className={i < quota.left ? styles.pipOn : styles.pipOff} />
        ))}
      </div>
      {spent ? (
        <p className={styles.spent}>
          LLM chart generation is paused for this visitor. You can still run solar system prompts anytime.
          Come back later for more LLM charts.
        </p>
      ) : null}
      <div className={styles.samples} aria-label="Sample prompts">
        {samples.map((sample) => (
          <button key={sample} type="button" className={styles.chip} onClick={() => onSample(sample)} disabled={busy}>
            {sample}
          </button>
        ))}
      </div>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onSubmit(value);
        }}
      >
        <textarea
          id="chart-prompt-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            spent
              ? 'Solar still works, e.g. correct solar system with moons and labels'
              : placeholder
          }
          aria-label="Chart prompt"
          disabled={busy}
          rows={3}
        />
        <button type="submit" disabled={!canSubmit}>
          {busy ? 'Working...' : submitLabel}
        </button>
      </form>
      {status ? <p className={styles.status}>{status}</p> : null}
    </div>
  );
}
