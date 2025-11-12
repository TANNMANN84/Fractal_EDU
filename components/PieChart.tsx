
import React from 'react';

interface PieChartData {
    label: string;
    value: number;
    color: string;
}

interface PieChartProps {
    data: PieChartData[];
    title: string;
    onSliceClick?: (label: string) => void;
}

const PieChart: React.FC<PieChartProps> = ({ data, title, onSliceClick }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);

    const gradientStops = data.reduce((acc, item, index) => {
        const start = acc.currentPercent;
        const end = start + (total > 0 ? (item.value / total) * 100 : 0);
        acc.stops.push(`${item.color} ${start}% ${end}%`);
        acc.currentPercent = end;
        return acc;
    }, { stops: [] as string[], currentPercent: 0 });

    const conicGradient = `conic-gradient(${gradientStops.stops.join(', ')})`;

    return (
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg">
            <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">{title}</h5>
            <div className="flex justify-center items-center">
                 <div
                    className="w-20 h-20 rounded-full"
                    style={{ background: conicGradient }}
                />
            </div>
            <ul className="mt-2 text-xs text-left space-y-1">
                {data.map(item => (
                    <li
                        key={item.label}
                        className="flex items-center p-1 -m-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => onSliceClick?.(item.label)}
                    >
                        <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></span>
                        <span className="dark:text-gray-300">{item.label}: <strong>{item.value}</strong> ({total > 0 ? ((item.value/total)*100).toFixed(0) : 0}%)</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PieChart;
