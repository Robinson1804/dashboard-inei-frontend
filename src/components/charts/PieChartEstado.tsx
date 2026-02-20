import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartEstadoProps {
  data: { name: string; value: number; color: string }[];
  title: string;
  centerTotal?: number | string;
  centerLabel?: string;
  height?: number;
}

const PieChartEstado = ({ data, title, centerTotal, centerLabel, height = 280 }: PieChartEstadoProps) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value as number} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        {centerTotal !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-10%' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{centerTotal}</p>
              {centerLabel && <p className="text-[10px] text-slate-500 uppercase">{centerLabel}</p>}
            </div>
          </div>
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-slate-600">{entry.name}</span>
            <span className="text-xs font-semibold text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChartEstado;
