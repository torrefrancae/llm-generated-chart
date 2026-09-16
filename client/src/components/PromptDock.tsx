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
  const locked = Boolean(busy || spent);
  return (
    <div className={styles.dock}>
      <div className={styles.head}>
        <p className={styles.label}>Prompt box</p>
        <p className={styles.quota} aria-live="polite">
          {spent
            ? `All ${quota.max} LLM generates used`
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
          Chart generation is paused for this visitor. Solar presets still work. Come back later for more LLM charts.
        </p>
      ) : null}
      <div className={styles.samples} aria-label="Sample prompts">
        {samples.map((sample) => (
          <button key={sample} type="button" className={styles.chip} onClick={() => onSample(sample)} disabled={locked}>
            {sample}
          </button>
        ))}
      </div>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (locked) return;
          onSubmit(value);
        }}
      >
        <textarea
          id="chart-prompt-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={spent ? 'LLM generate limit reached for now' : placeholder}
          aria-label="Chart prompt"
          disabled={locked}
          rows={3}
        />
        <button type="submit" disabled={locked || !value.trim()}>
          {busy ? 'Working...' : spent ? 'Limit reached' : submitLabel}
        </button>
      </form>
      {status ? <p className={styles.status}>{status}</p> : null}
    </div>
  );
}
