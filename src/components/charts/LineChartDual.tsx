import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartDualProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: { dataKey: string; name: string; color: string; dashed?: boolean }[];
  title: string;
  height?: number;
  yFormatter?: (value: number) => string;
}

const defaultFormatter = (value: number) => {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `S/ ${(value / 1_000).toFixed(0)}K`;
  return `S/ ${value}`;
};

const LineChartDual = ({ data, xKey, lines, title, height = 300, yFormatter }: LineChartDualProps) => {
  const formatter = yFormatter || defaultFormatter;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tickFormatter={formatter} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip formatter={(value) => formatter(value as number)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map(line => (
            <Area
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              fill={line.color}
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray={line.dashed ? '5 5' : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartDual;
