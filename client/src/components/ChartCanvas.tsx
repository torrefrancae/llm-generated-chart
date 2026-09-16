import ReactECharts from 'echarts-for-react';
import type { ChartPayload } from '@/lib/api';
import { toEchartsOption } from '@/lib/echartsOption';
import styles from '@/components/ChartCanvas.module.css';

interface Props {
  payload: ChartPayload | null;
  busy?: boolean;
}

export default function ChartCanvas({ payload, busy = false }: Props) {
  if (!payload) {
    return (
      <div className={styles.empty} aria-live="polite">
        <p className={styles.kicker}>{busy ? 'Loading' : 'Live canvas'}</p>
        <h2>{busy ? 'Generating chart data...' : 'Use the prompt box below'}</h2>
        <p>
          {busy
            ? 'Waiting for the chart response. Nothing is drawn until data is ready.'
            : 'Describe a chart type. The stage stays empty until generation finishes.'}
        </p>
        {busy ? <div className={styles.loader} aria-label="Loading chart data" /> : null}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <ReactECharts
        option={toEchartsOption(payload)}
        style={{ height: '100%', width: '100%', minHeight: 280 }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
