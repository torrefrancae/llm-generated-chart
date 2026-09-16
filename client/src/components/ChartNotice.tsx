import type { ChartNotice } from '@/lib/chartNotice';
import styles from '@/components/ChartNotice.module.css';
import React from 'react';

interface Props {
  notice: ChartNotice;
  onSuggest: (prompt: string) => void;
}

export default function ChartNoticePanel({ notice, onSuggest }: Props) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <p className={styles.kicker}>Honest coverage</p>
      <h2 className={styles.title}>{notice.title}</h2>
      <p className={styles.body}>{notice.body}</p>

      <div className={styles.block}>
        <h3>Charts we cover</h3>
        <ul className={styles.covered}>
          {notice.covered.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={styles.block}>
        <h3>Try one of these prompts</h3>
        <div className={styles.suggestions}>
          {notice.suggestions.map((sample) => (
            <button key={sample} type="button" className={styles.chip} onClick={() => onSuggest(sample)}>
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
