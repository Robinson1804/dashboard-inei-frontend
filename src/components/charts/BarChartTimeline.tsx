import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartTimelineProps {
  data: { mes: string; valor: number }[];
  title: string;
  barColor?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}

const defaultFormatter = (value: number) => {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `S/ ${(value / 1_000).toFixed(0)}K`;
  return `S/ ${value}`;
};

const BarChartTimeline = ({ data, title, barColor = '#3b82f6', valueFormatter, height = 250 }: BarChartTimelineProps) => {
  const formatter = valueFormatter || defaultFormatter;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tickFormatter={formatter} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip formatter={(value) => formatter(value as number)} />
          <Bar dataKey="valor" fill={barColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartTimeline;
