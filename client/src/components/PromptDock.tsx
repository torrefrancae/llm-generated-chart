import styles from '@/components/PromptDock.module.css';
import React from 'react';

interface Props {
  value: string;
  busy?: boolean;
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
  placeholder,
  submitLabel = 'Apply',
  samples,
  status,
  onChange,
  onSubmit,
  onSample,
}: Props) {
  return (
    <div className={styles.dock}>
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
          onSubmit(value);
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Prompt"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !value.trim()}>
          {busy ? 'Working...' : submitLabel}
        </button>
      </form>
      {status ? <p className={styles.status}>{status}</p> : null}
    </div>
  );
}
