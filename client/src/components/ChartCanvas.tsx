import ReactECharts from 'echarts-for-react';
import type { ChartPayload } from '@/lib/api';
import { toEchartsOption } from '@/lib/echartsOption';
import styles from '@/components/ChartCanvas.module.css';

interface Props {
  payload: ChartPayload | null;
  busy: boolean;
}

export default function ChartCanvas({ payload, busy }: Props) {
  if (!payload) {
    return (
      <div className={styles.empty} aria-live="polite">
        <p className={styles.kicker}>Live canvas</p>
        <h2>Use the prompt dock below</h2>
        <p>Pick a chart type on the right, or write a prompt to paint an ECharts demo.</p>
        {busy ? <div className={styles.loader} aria-label="Generating chart" /> : null}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {busy ? <div className={styles.loader} aria-label="Generating chart" /> : null}
      <ReactECharts
        option={toEchartsOption(payload)}
        style={{ height: '100%', width: '100%', minHeight: 420 }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
