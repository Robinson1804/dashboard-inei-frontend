import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import type { FilterField, FilterState } from '../../types';

interface FilterBarProps {
  fields: FilterField[];
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

const FilterBar = ({ fields, onApply, onClear }: FilterBarProps) => {
  const [filters, setFilters] = useState<FilterState>({});

  const handleChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter size={16} className="text-slate-500" />
        <span className="text-sm font-semibold text-slate-700">Filtros</span>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        {fields.map(field => (
          <div key={field.key} className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">{field.label}</label>
            <select
              value={(filters[field.key] as string) || ''}
              onChange={e => handleChange(field.key, e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{field.placeholder || 'Todos'}</option>
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={14} />
            Limpiar
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
