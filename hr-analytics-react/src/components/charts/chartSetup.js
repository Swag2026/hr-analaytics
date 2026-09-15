import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BarController,
  LineController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  BarController, LineController, DoughnutController,
  Title, Tooltip, Legend, Filler
);

export const PALETTE = {
  ink: '#0E1B2E', brass: '#A9803E', brassLight: '#D9BD8C',
  success: '#1F7A5C', warning: '#B7791F', critical: '#AF2E2E', info: '#2A5D9C',
  grid: '#E4E1D8', text: '#666B78',
  series: ['#0E1B2E', '#A9803E', '#2A5D9C', '#1F7A5C', '#B7791F', '#AF2E2E', '#7C5D2A', '#8894A8'],
};

ChartJS.defaults.font.family = "'Tajawal', sans-serif";
ChartJS.defaults.color = PALETTE.text;
ChartJS.defaults.font.size = 12;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;
ChartJS.defaults.plugins.legend.labels.boxHeight = 8;
ChartJS.defaults.plugins.tooltip.backgroundColor = '#0E1B2E';
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.tooltip.titleFont = { family: "'Tajawal', sans-serif", weight: '700' };
ChartJS.defaults.plugins.tooltip.bodyFont = { family: "'Tajawal', sans-serif" };
ChartJS.defaults.elements.line.borderWidth = 2.5;
ChartJS.defaults.elements.point.radius = 3;
ChartJS.defaults.elements.point.hoverRadius = 5;

export { ChartJS };
