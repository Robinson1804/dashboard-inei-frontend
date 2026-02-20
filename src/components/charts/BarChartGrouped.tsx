import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartGroupedProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { dataKey: string; name: string; color: string }[];
  title: string;
  height?: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `S/ ${(value / 1_000).toFixed(0)}K`;
  return `S/ ${value}`;
};

const BarChartGrouped = ({ data, xKey, bars, title, height = 300 }: BarChartGroupedProps) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {bars.map(bar => (
            <Bar key={bar.dataKey} dataKey={bar.dataKey} name={bar.name} fill={bar.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartGrouped;
