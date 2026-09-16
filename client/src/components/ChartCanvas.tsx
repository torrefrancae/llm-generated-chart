import ReactECharts from 'echarts-for-react';
import type { ChartPayload } from '@/lib/api';
import { toEchartsOption } from '@/lib/echartsOption';
import styles from '@/components/ChartCanvas.module.css';

interface Props {
  payload: ChartPayload | null;
  busy?: boolean;
  refining?: boolean;
}

export default function ChartCanvas({ payload, busy = false, refining = false }: Props) {
  if (!payload) {
    return (
      <div className={styles.empty} aria-live="polite">
        <p className={styles.kicker}>{busy ? 'Loading' : 'Live canvas'}</p>
        <h2>{busy ? 'Preparing chart data...' : 'Use the prompt dock below'}</h2>
        <p>
          {busy
            ? 'Hang tight while dummy series are built for this chart type.'
            : 'Describe a chart type. Dummy data paints as soon as it is ready.'}
        </p>
        {busy ? <div className={styles.loader} aria-label="Loading chart data" /> : null}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {refining ? <p className={styles.refine}>Optional agent polish running in the background</p> : null}
      <ReactECharts
        option={toEchartsOption(payload)}
        style={{ height: '100%', width: '100%', minHeight: 280 }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
