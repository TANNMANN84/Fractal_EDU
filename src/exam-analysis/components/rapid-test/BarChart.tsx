// src/components/rapid-test/BarChart.tsx

import React from 'react';

export interface BarChartData {
  label: string;
  preValue: number;
  postValue: number;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const maxValue = 100; // Assuming percentage
  const barWidth = 30;
  const barGap = 40;
  const chartHeight = 200;
  const labelHeight = 80;

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
      <h4 className="text-lg font-semibold text-gray-200 mb-4 text-center">{title}</h4>
      <svg
        width="100%"
        height={chartHeight + labelHeight}
        className="font-sans"
      >
        {data.map((item, index) => {
          const preHeight = (item.preValue / maxValue) * chartHeight;
          const postHeight = (item.postValue / maxValue) * chartHeight;
          const x = index * (barWidth * 2 + barGap) + barGap;

          return (
            <g key={item.label}>
              {/* Pre-test Bar */}
              <rect x={x} y={chartHeight - preHeight} width={barWidth} height={preHeight} fill="#4f46e5" />
              <text x={x + barWidth / 2} y={chartHeight - preHeight - 5} fill="#a5b4fc" textAnchor="middle" fontSize="12">
                {item.preValue.toFixed(1)}%
              </text>

              {/* Post-test Bar */}
              <rect x={x + barWidth + 5} y={chartHeight - postHeight} width={barWidth} height={postHeight} fill="#10b981" />
              <text x={x + barWidth + 5 + barWidth / 2} y={chartHeight - postHeight - 5} fill="#6ee7b7" textAnchor="middle" fontSize="12">
                {item.postValue.toFixed(1)}%
              </text>

              {/* Label */}
              <text x={x + barWidth + 2.5} y={chartHeight + 20} fill="#d1d5db" textAnchor="middle" fontSize="12" className="break-words">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BarChart;