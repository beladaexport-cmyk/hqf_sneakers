export const SIZE_CHART = [
  { eu: '36', cm: 22.0 },
  { eu: '36.5', cm: 22.5 },
  { eu: '37.5', cm: 23.0 },
  { eu: '38', cm: 23.5 },
  { eu: '38.5', cm: 24.0 },
  { eu: '39', cm: 24.5 },
  { eu: '40', cm: 25.0 },
  { eu: '40.5', cm: 25.5 },
  { eu: '41', cm: 26.0 },
  { eu: '42', cm: 26.5 },
  { eu: '42.5', cm: 27.0 },
  { eu: '43', cm: 27.5 },
  { eu: '44', cm: 28.0 },
  { eu: '44.5', cm: 28.5 },
  { eu: '45', cm: 29.0 },
  { eu: '45.5', cm: 29.5 },
  { eu: '46', cm: 30.0 },
  { eu: '47', cm: 30.5 },
  { eu: '47.5', cm: 31.0 },
  { eu: '48.5', cm: 32.0 },
];

export const SIZE_CHART_MAP: Record<string, number> = Object.fromEntries(
  SIZE_CHART.map((s) => [s.eu, s.cm])
);
