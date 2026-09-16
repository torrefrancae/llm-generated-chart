import type { EChartsOption } from 'echarts';
import type { ChartPayload } from '@/lib/api';
import { PALETTE, ink, muted } from '@/lib/theme';

function axisStyle() {
  return {
    axisLabel: { color: muted },
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.18)' } },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
  };
}

function titleBlock(payload: ChartPayload) {
  return {
    text: payload.title,
    subtext: payload.subtitle || '',
    left: 'left',
    textStyle: { color: ink, fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700 },
    subtextStyle: { color: muted, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 12 },
  };
}

export function toEchartsOption(payload: ChartPayload): EChartsOption {
  const cats = payload.categories || [];
  const series = payload.series || [];
  const slices = payload.slices || [];
  const common = {
    color: [...PALETTE],
    backgroundColor: 'transparent',
    title: titleBlock(payload),
    tooltip: { trigger: 'item' as const },
    legend: {
      show: payload.showLegend !== false,
      textStyle: { color: muted },
      top: 36,
    },
    grid: { left: 40, right: 18, top: 72, bottom: 36 },
  };

  switch (payload.chartType) {
    case 'bar':
    case 'grouped-bar':
    case 'stacked-bar':
    case 'horizontal-bar':
    case 'pictorial-bar': {
      const horizontal = payload.chartType === 'horizontal-bar';
      return {
        ...common,
        tooltip: { trigger: 'axis' },
        xAxis: horizontal
          ? { type: 'value', ...axisStyle() }
          : { type: 'category', data: cats, ...axisStyle() },
        yAxis: horizontal
          ? { type: 'category', data: cats, ...axisStyle() }
          : { type: 'value', ...axisStyle() },
        series: series.map((s, i) => ({
          type: 'bar',
          name: s.name,
          stack: payload.chartType === 'stacked-bar' ? 'total' : undefined,
          data: s.data,
          barMaxWidth: 42,
          itemStyle: {
            borderRadius: horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0],
            color: PALETTE[i % PALETTE.length],
          },
          symbol: payload.chartType === 'pictorial-bar' ? 'roundRect' : undefined,
        })),
      };
    }
    case 'line':
    case 'multi-line':
    case 'area':
    case 'stacked-area':
      return {
        ...common,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: cats, boundaryGap: false, ...axisStyle() },
        yAxis: { type: 'value', ...axisStyle() },
        series: series.map((s) => ({
          type: 'line',
          name: s.name,
          data: s.data,
          smooth: true,
          areaStyle:
            payload.chartType === 'area' || payload.chartType === 'stacked-area'
              ? { opacity: 0.28 }
              : undefined,
          stack: payload.chartType === 'stacked-area' ? 'total' : undefined,
          symbolSize: 8,
        })),
      };
    case 'pie':
    case 'donut':
    case 'rose':
      return {
        ...common,
        series: [
          {
            type: 'pie',
            radius: payload.chartType === 'donut' ? ['48%', '72%'] : payload.chartType === 'rose' ? [24, '72%'] : '68%',
            roseType: payload.chartType === 'rose' ? 'radius' : undefined,
            data: slices,
            label: { color: ink },
            itemStyle: { borderRadius: 8, borderColor: '#0b1220', borderWidth: 2 },
          },
        ],
      };
    case 'scatter':
    case 'bubble':
      return {
        ...common,
        tooltip: { trigger: 'item' },
        xAxis: { type: 'value', ...axisStyle() },
        yAxis: { type: 'value', ...axisStyle() },
        series: [
          {
            type: 'scatter',
            data: (payload.pairs || []).map((p) =>
              payload.chartType === 'bubble' ? [p.x, p.y, p.size || 20] : [p.x, p.y]
            ),
            symbolSize: (val: number | number[]) =>
              payload.chartType === 'bubble' && Array.isArray(val) ? Math.max(12, Number(val[2]) || 20) : 14,
          },
        ],
      };
    case 'radar': {
      const max = Math.max(10, ...series.flatMap((s) => s.data));
      return {
        ...common,
        radar: {
          indicator: cats.map((name) => ({ name, max })),
          axisName: { color: muted },
        },
        series: series.map((s) => ({
          type: 'radar',
          name: s.name,
          data: [{ value: s.data, name: s.name }],
          areaStyle: { opacity: 0.2 },
        })),
      };
    }
    case 'heatmap':
    case 'calendar-heatmap':
      return {
        ...common,
        tooltip: { position: 'top' },
        xAxis: { type: 'category', data: cats, ...axisStyle() },
        yAxis: {
          type: 'category',
          data: series.map((s) => s.name),
          ...axisStyle(),
        },
        visualMap: {
          min: 0,
          max: Math.max(1, ...series.flatMap((s) => s.data)),
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: 8,
          textStyle: { color: muted },
          inRange: { color: ['#134e4a', '#2dd4bf', '#fbbf24'] },
        },
        series: [
          {
            type: 'heatmap',
            data: series.flatMap((s, yi) => s.data.map((v, xi) => [xi, yi, v])),
          },
        ],
      };
    case 'treemap':
    case 'sunburst':
      return {
        ...common,
        series: [
          {
            type: payload.chartType,
            data: slices.map((s) => ({ name: s.name, value: s.value })),
            radius: payload.chartType === 'sunburst' ? [0, '85%'] : undefined,
            label: { color: ink },
          },
        ],
      };
    case 'funnel':
      return {
        ...common,
        series: [
          {
            type: 'funnel',
            data: slices,
            sort: 'descending',
            label: { color: ink },
            itemStyle: { borderColor: '#0b1220', borderWidth: 2 },
          },
        ],
      };
    case 'gauge':
      return {
        ...common,
        series: [
          {
            type: 'gauge',
            min: 0,
            max: payload.max || 100,
            progress: { show: true, width: 14 },
            axisLine: { lineStyle: { width: 14 } },
            detail: { formatter: '{value}', color: ink },
            data: [{ value: payload.value || 0, name: payload.title }],
          },
        ],
      };
    case 'sankey':
      return {
        ...common,
        series: [
          {
            type: 'sankey',
            data: payload.nodes || [],
            links: payload.links || [],
            lineStyle: { color: 'gradient', curveness: 0.5 },
            label: { color: ink },
          },
        ],
      };
    case 'candlestick':
      return {
        ...common,
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: (payload.ohlc || []).map((d) => d.date),
          ...axisStyle(),
        },
        yAxis: { type: 'value', scale: true, ...axisStyle() },
        series: [
          {
            type: 'candlestick',
            data: (payload.ohlc || []).map((d) => [d.open, d.close, d.low, d.high]),
          },
        ],
      };
    case 'boxplot':
      return {
        ...common,
        tooltip: { trigger: 'item' },
        xAxis: { type: 'category', data: cats, ...axisStyle() },
        yAxis: { type: 'value', ...axisStyle() },
        series: [
          {
            type: 'boxplot',
            data: series.map((s) => s.data),
          },
        ],
      };
    case 'histogram':
      return {
        ...common,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: cats, ...axisStyle() },
        yAxis: { type: 'value', ...axisStyle() },
        series: series.map((s) => ({ type: 'bar', name: s.name, data: s.data, barWidth: '90%' })),
      };
    case 'waterfall': {
      const values = series[0]?.data || [];
      const helpers: number[] = [];
      let total = 0;
      values.forEach((v, i) => {
        if (i === 0) {
          helpers.push(0);
          total = v;
        } else if (i === values.length - 1) {
          helpers.push(0);
        } else {
          helpers.push(total);
          total += v;
        }
      });
      return {
        ...common,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: cats, ...axisStyle() },
        yAxis: { type: 'value', ...axisStyle() },
        series: [
          { type: 'bar', stack: 'all', data: helpers, itemStyle: { color: 'transparent' } },
          { type: 'bar', stack: 'all', data: values, itemStyle: { borderRadius: [8, 8, 0, 0] } },
        ],
      };
    }
    case 'polar-bar':
      return {
        ...common,
        polar: {},
        angleAxis: { type: 'category', data: cats },
        radiusAxis: {},
        series: series.map((s) => ({ type: 'bar', data: s.data, coordinateSystem: 'polar', name: s.name })),
      };
    case 'parallel':
      return {
        ...common,
        parallelAxis: cats.map((name, i) => ({ dim: i, name })),
        series: [
          {
            type: 'parallel',
            lineStyle: { width: 2 },
            data: series.map((s) => s.data),
          },
        ],
      };
    case 'theme-river':
      return {
        ...common,
        singleAxis: { type: 'time', top: 80, bottom: 40, axisLabel: { color: muted } },
        series: [
          {
            type: 'themeRiver',
            data: series.flatMap((s) =>
              cats.map((c, i) => [c, s.data[i] || 0, s.name] as [string, number, string])
            ),
            label: { show: false },
          },
        ],
      };
    case 'graph':
      return {
        ...common,
        series: [
          {
            type: 'graph',
            layout: 'force',
            roam: true,
            data: (payload.nodes || []).map((n) => ({ name: n.name, symbolSize: 28 })),
            links: payload.links || [],
            label: { show: true, color: ink },
            force: { repulsion: 180 },
            lineStyle: { color: 'source', curveness: 0.2 },
          },
        ],
      };
    default:
      return {
        ...common,
        xAxis: { type: 'category', data: cats, ...axisStyle() },
        yAxis: { type: 'value', ...axisStyle() },
        series: series.map((s) => ({ type: 'bar', name: s.name, data: s.data })),
      };
  }
}
