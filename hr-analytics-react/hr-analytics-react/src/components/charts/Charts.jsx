import React, { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import { PALETTE } from './chartSetup.js';
import { fmtNum } from '../../utils/format.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { translateText } from '../../i18n.js';

const localize = (value, isEn) => (isEn ? translateText(value) : value);

// Ported from lineChart(ctx, labels, datasets, opts)
export function LineChart({ labels, datasets, opts = {}, height = 260 }) {
  const { isEn } = useLanguage();
  const data = useMemo(() => ({
    labels: labels.map((label) => localize(label, isEn)),
    datasets: datasets.map((d, i) => ({
      type: 'line',
      label: localize(d.label, isEn),
      data: d.data,
      borderColor: d.color || PALETTE.series[i % PALETTE.series.length],
      backgroundColor: (d.color || PALETTE.series[i % PALETTE.series.length]) + '22',
      fill: opts.fill !== false && datasets.length === 1,
      tension: 0.35,
      pointBackgroundColor: '#fff',
      pointBorderColor: d.color || PALETTE.series[i % PALETTE.series.length],
      pointBorderWidth: 2,
    })),
  }), [labels, datasets, opts.fill, isEn]);

  const options = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: datasets.length > 1, rtl: !isEn, position: 'top', align: 'end' } },
    scales: {
      x: { grid: { display: false }, ticks: { color: PALETTE.text } },
      y: { grid: { color: PALETTE.grid }, ticks: { color: PALETTE.text, callback: (v) => fmtNum(v) }, beginAtZero: opts.beginAtZero !== false },
    },
    interaction: { mode: 'index', intersect: false },
  }), [datasets.length, opts.beginAtZero, isEn]);

  return <div style={{ height }}><Chart type="line" data={data} options={options} /></div>;
}

// Ported from barChart(ctx, labels, datasets, opts)
export function BarChart({ labels, datasets, opts = {}, height = 260 }) {
  const { isEn } = useLanguage();
  const data = useMemo(() => ({
    labels: labels.map((label) => localize(label, isEn)),
    datasets: datasets.map((d, i) => ({
      label: localize(d.label, isEn), data: d.data, backgroundColor: d.color || PALETTE.series[i % PALETTE.series.length],
      borderRadius: 5, maxBarThickness: 34,
    })),
  }), [labels, datasets, isEn]);

  const options = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, indexAxis: opts.horizontal ? 'y' : 'x',
    plugins: { legend: { display: datasets.length > 1, rtl: !isEn, position: 'top', align: 'end' } },
    scales: {
      x: { grid: { display: !!opts.horizontal, color: PALETTE.grid }, ticks: { color: PALETTE.text } },
      y: { grid: { display: !opts.horizontal, color: PALETTE.grid }, ticks: { color: PALETTE.text } },
    },
  }), [opts.horizontal, datasets.length, isEn]);

  return <div style={{ height }}><Chart type="bar" data={data} options={options} /></div>;
}

// Ported from doughnutChart(ctx, labels, data, colors)
export function DoughnutChart({ labels, data: values, colors, height = 260 }) {
  const { isEn } = useLanguage();
  const data = useMemo(() => ({
    labels: labels.map((label) => localize(label, isEn)),
    datasets: [{ data: values, backgroundColor: colors || PALETTE.series, borderWidth: 3, borderColor: '#fff' }],
  }), [labels, values, colors, isEn]);

  const options = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'bottom', rtl: !isEn, labels: { padding: 14 } } },
  }), [isEn]);

  return <div style={{ height }}><Chart type="doughnut" data={data} options={options} /></div>;
}

// Ported from the dashboard's dual-axis bar+line trend chart (headcount vs net payroll)
export function DualAxisTrendChart({ labels, barData, lineData, barLabel, lineLabel, y1Title, y2Title, height = 260 }) {
  const { isEn } = useLanguage();
  const data = useMemo(() => ({
    labels: labels.map((label) => localize(label, isEn)),
    datasets: [
      { type: 'bar', label: localize(barLabel, isEn), data: barData, backgroundColor: PALETTE.brassLight, borderRadius: 5, yAxisID: 'y1', order: 2 },
      { type: 'line', label: localize(lineLabel, isEn), data: lineData, borderColor: PALETTE.ink, backgroundColor: PALETTE.ink + '15', tension: 0.35, yAxisID: 'y2', order: 1, pointBackgroundColor: '#fff', pointBorderColor: PALETTE.ink, pointBorderWidth: 2 },
    ],
  }), [labels, barData, lineData, barLabel, lineLabel, isEn]);

  const options = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { rtl: !isEn, position: 'top', align: 'end' } },
    scales: {
      y1: { position: 'left', grid: { color: PALETTE.grid }, title: { display: true, text: localize(y1Title, isEn) } },
      y2: { position: 'right', grid: { display: false }, title: { display: true, text: localize(y2Title, isEn) } },
    },
  }), [y1Title, y2Title, isEn]);

  return <div style={{ height }}><Chart type="bar" data={data} options={options} /></div>;
}
