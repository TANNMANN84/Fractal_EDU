// src/components/analysis/AnalysisChart.tsx

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
import { AnalysisDataItem } from '../../utils/analysisHelpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalysisChartProps {
  title: string;
  data: Record<string, AnalysisDataItem>;
  chartId: string;
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ title, data, chartId }) => {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: 'Performance %',
        data: Object.values(data).map(item => (item.total > 0 ? (item.scored / item.total) * 100 : 0)),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { min: 0, max: 100, ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#9ca3af' } } },
  };

  return (
    <div id={chartId} className="bg-gray-800/50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-200 mb-2 text-center">{title}</h3>
      <Bar options={chartOptions} data={chartData} />
    </div>
  );
};

export default AnalysisChart;