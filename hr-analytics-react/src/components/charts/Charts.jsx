import React from 'react';
import { Chart } from 'react-chartjs-2';
import { PALETTE } from './chartSetup.js';
import { fmtNum } from '../../utils/format.js';

// Ported from lineChart(ctx, labels, datasets, opts)
export function LineChart({ labels, datasets, opts = {}, height = 260 }) {
  const data = {
    labels,
    datasets: datasets.map((d, i) => ({
      type: 'line',
      label: d.label,
      data: d.data,
      borderColor: d.color || PALETTE.series[i % PALETTE.series.length],
      backgroundColor: (d.color || PALETTE.series[i % PALETTE.series.length]) + '22',
      fill: opts.fill !== false && datasets.length === 1,
      tension: 0.35,
      pointBackgroundColor: '#fff',
      pointBorderColor: d.color || PALETTE.series[i % PALETTE.series.length],
      pointBorderWidth: 2,
    })),
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: datasets.length > 1, rtl: true, position: 'top', align: 'end' } },
    scales: {
      x: { grid: { display: false }, ticks: { color: PALETTE.text } },
      y: { grid: { color: PALETTE.grid }, ticks: { color: PALETTE.text, callback: (v) => fmtNum(v) }, beginAtZero: opts.beginAtZero !== false },
    },
    interaction: { mode: 'index', intersect: false },
  };
  return <div style={{ height }}><Chart type="line" data={data} options={options} /></div>;
}

// Ported from barChart(ctx, labels, datasets, opts)
export function BarChart({ labels, datasets, opts = {}, height = 260 }) {
  const data = {
    labels,
    datasets: datasets.map((d, i) => ({
      label: d.label, data: d.data, backgroundColor: d.color || PALETTE.series[i % PALETTE.series.length],
      borderRadius: 5, maxBarThickness: 34,
    })),
  };
  const options = {
    responsive: true, maintainAspectRatio: false, indexAxis: opts.horizontal ? 'y' : 'x',
    plugins: { legend: { display: datasets.length > 1, rtl: true, position: 'top', align: 'end' } },
    scales: {
      x: { grid: { display: !!opts.horizontal, color: PALETTE.grid }, ticks: { color: PALETTE.text } },
      y: { grid: { display: !opts.horizontal, color: PALETTE.grid }, ticks: { color: PALETTE.text } },
    },
  };
  return <div style={{ height }}><Chart type="bar" data={data} options={options} /></div>;
}

// Ported from doughnutChart(ctx, labels, data, colors)
export function DoughnutChart({ labels, data: values, colors, height = 260 }) {
  const data = { labels, datasets: [{ data: values, backgroundColor: colors || PALETTE.series, borderWidth: 3, borderColor: '#fff' }] };
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'bottom', rtl: true, labels: { padding: 14 } } },
  };
  return <div style={{ height }}><Chart type="doughnut" data={data} options={options} /></div>;
}

// Ported from the dashboard's dual-axis bar+line trend chart (headcount vs net payroll)
export function DualAxisTrendChart({ labels, barData, lineData, barLabel, lineLabel, y1Title, y2Title, height = 260 }) {
  const data = {
    labels,
    datasets: [
      { type: 'bar', label: barLabel, data: barData, backgroundColor: PALETTE.brassLight, borderRadius: 5, yAxisID: 'y1', order: 2 },
      { type: 'line', label: lineLabel, data: lineData, borderColor: PALETTE.ink, backgroundColor: PALETTE.ink + '15', tension: 0.35, yAxisID: 'y2', order: 1, pointBackgroundColor: '#fff', pointBorderColor: PALETTE.ink, pointBorderWidth: 2 },
    ],
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { rtl: true, position: 'top', align: 'end' } },
    scales: {
      y1: { position: 'left', grid: { color: PALETTE.grid }, title: { display: true, text: y1Title } },
      y2: { position: 'right', grid: { display: false }, title: { display: true, text: y2Title } },
    },
  };
  return <div style={{ height }}><Chart type="bar" data={data} options={options} /></div>;
}
