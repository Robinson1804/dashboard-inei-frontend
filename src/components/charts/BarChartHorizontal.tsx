import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface BarChartHorizontalProps {
  data: { name: string; value: number; color?: string }[];
  title: string;
  valueFormatter?: (value: number) => string;
  referenceLine?: { value: number; label: string };
  height?: number;
  barColor?: string;
}

const defaultFormatter = (value: number) => `${value.toFixed(1)}%`;

const getBarColor = (value: number) => {
  if (value >= 90) return '#10b981';
  if (value >= 70) return '#f59e0b';
  return '#ef4444';
};

const BarChartHorizontal = ({
  data,
  title,
  valueFormatter = defaultFormatter,
  referenceLine,
  height,
  barColor,
}: BarChartHorizontalProps) => {
  const chartHeight = height || Math.max(200, data.length * 40);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={75} />
          <Tooltip formatter={(value) => valueFormatter(value as number)} />
          {referenceLine && (
            <ReferenceLine x={referenceLine.value} stroke="#ef4444" strokeDasharray="3 3" label={{ value: referenceLine.label, fontSize: 10, fill: '#ef4444' }} />
          )}
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={index} fill={barColor || entry.color || getBarColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartHorizontal;
