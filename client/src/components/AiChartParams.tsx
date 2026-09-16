import { CHART_TYPES } from '@/lib/chartTypes';
import styles from '@/components/AiChartParams.module.css';
import React from 'react';

interface Props {
  onPick: (prompt: string) => void;
}

export default function AiChartParams({ onPick }: Props) {
  return (
    <aside className={styles.panel} aria-label="Chart type parameters">
      <p className={styles.kicker}>Parameters</p>
      <h2 className={styles.title}>Chart types</h2>
      <p className={styles.copy}>Pick a type to seed the prompt. The dock below generates the viz.</p>
      <div className={styles.list}>
        {CHART_TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.item}
            title={item.hint}
            onClick={() => onPick(`Build a ${item.label.toLowerCase()} chart about weekend coffee sales`)}
          >
            <span className={styles.label}>{item.label}</span>
            <span className={styles.hint}>{item.hint}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
