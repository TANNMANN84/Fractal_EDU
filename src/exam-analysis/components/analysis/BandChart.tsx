// src/components/analysis/BandChart.tsx

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BandChartProps {
  title: string;
  data: Record<string, number>;
  chartId: string;
}

const BandChart: React.FC<BandChartProps> = ({ title, data, chartId }) => {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: '# of Students',
        data: Object.values(data),
        backgroundColor: 'rgba(139, 92, 246, 0.8)', // A nice violet color
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: true, text: title, color: '#e5e7eb' } },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#9ca3af', stepSize: 1 }, grid: { color: '#374151' } },
      x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
    },
  };

  return (
    <div id={chartId} className="bg-gray-800/50 p-4 rounded-lg">
      <Bar options={chartOptions} data={chartData} />
    </div>
  );
};

export default BandChart;