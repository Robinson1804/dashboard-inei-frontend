import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  delta?: string;
  deltaColor?: 'green' | 'amber' | 'red' | 'blue';
  highlight?: boolean;
}

const deltaIcons = {
  green: TrendingUp,
  red: TrendingDown,
  amber: Minus,
  blue: null,
};

const deltaColors = {
  green: 'text-green-600 bg-green-50',
  amber: 'text-amber-600 bg-amber-50',
  red: 'text-red-600 bg-red-50',
  blue: 'text-blue-600 bg-blue-50',
};

const KpiCard = ({ label, value, icon: Icon, iconBgColor, delta, deltaColor = 'green', highlight }: KpiCardProps) => {
  const DeltaIcon = deltaIcons[deltaColor];

  return (
    <div className={`bg-white p-5 rounded-xl border shadow-sm ${
      highlight ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {delta && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${deltaColors[deltaColor]}`}>
              {DeltaIcon && <DeltaIcon size={12} />}
              {delta}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          <Icon size={20} className="text-current" />
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
