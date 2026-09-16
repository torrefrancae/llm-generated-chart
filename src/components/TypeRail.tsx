'use client';

import { CHART_TYPES } from '@/lib/chartTypes';
import styles from '@/components/TypeRail.module.css';

interface Props {
  onPick: (label: string) => void;
}

export default function TypeRail({ onPick }: Props) {
  return (
    <div className={styles.rail} aria-label="Chart types">
      {CHART_TYPES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={styles.chip}
          title={item.hint}
          onClick={() => onPick(`Build a ${item.label.toLowerCase()} chart about weekend coffee sales`)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
