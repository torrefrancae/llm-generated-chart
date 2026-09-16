export const CHART_TYPES = [
  { id: 'bar', label: 'Bar', hint: 'Compare categories side by side' },
  { id: 'grouped-bar', label: 'Grouped bar', hint: 'Compare series across categories' },
  { id: 'stacked-bar', label: 'Stacked bar', hint: 'Parts of a whole by category' },
  { id: 'horizontal-bar', label: 'Horizontal bar', hint: 'Ranked bars left to right' },
  { id: 'line', label: 'Line', hint: 'Trend over a sequence' },
  { id: 'multi-line', label: 'Multi line', hint: 'Several trends together' },
  { id: 'area', label: 'Area', hint: 'Filled trend volume' },
  { id: 'stacked-area', label: 'Stacked area', hint: 'Layered contribution over time' },
  { id: 'pie', label: 'Pie', hint: 'Share of a total' },
  { id: 'donut', label: 'Donut', hint: 'Share with a center focus' },
  { id: 'rose', label: 'Rose', hint: 'Nightingale radial proportions' },
  { id: 'scatter', label: 'Scatter', hint: 'Correlation between two values' },
  { id: 'bubble', label: 'Bubble', hint: 'Scatter with a third size axis' },
  { id: 'radar', label: 'Radar', hint: 'Profile across many traits' },
  { id: 'heatmap', label: 'Heatmap', hint: 'Intensity across a grid' },
  { id: 'calendar-heatmap', label: 'Calendar heatmap', hint: 'Daily intensity on a calendar' },
  { id: 'treemap', label: 'Treemap', hint: 'Nested sized rectangles' },
  { id: 'sunburst', label: 'Sunburst', hint: 'Hierarchy in rings' },
  { id: 'funnel', label: 'Funnel', hint: 'Stage conversion drop-off' },
  { id: 'gauge', label: 'Gauge', hint: 'Single KPI against a target' },
  { id: 'sankey', label: 'Sankey', hint: 'Flow between nodes' },
  { id: 'candlestick', label: 'Candlestick', hint: 'OHLC market style ranges' },
  { id: 'boxplot', label: 'Box plot', hint: 'Distribution quartiles' },
  { id: 'histogram', label: 'Histogram', hint: 'Frequency of value buckets' },
  { id: 'waterfall', label: 'Waterfall', hint: 'Stepwise gain and loss' },
  { id: 'polar-bar', label: 'Polar bar', hint: 'Bars on a radial axis' },
  { id: 'parallel', label: 'Parallel coordinates', hint: 'Many dimensions at once' },
  { id: 'theme-river', label: 'Theme river', hint: 'Stream of topics over time' },
  { id: 'pictorial-bar', label: 'Pictorial bar', hint: 'Bars with icon silhouettes' },
  { id: 'graph', label: 'Network graph', hint: 'Nodes and relationships' },
] as const;

export type ChartTypeId = (typeof CHART_TYPES)[number]['id'];

export function isChartTypeId(value: string): value is ChartTypeId {
  return CHART_TYPES.some((item) => item.id === value);
}
