interface SemaforoChipProps {
  value: number;
  showLabel?: boolean;
}

const SemaforoChip = ({ value, showLabel = false }: SemaforoChipProps) => {
  let color: string;
  let label: string;

  if (value >= 90) {
    color = 'bg-green-100 text-green-700';
    label = 'Satisfecho';
  } else if (value >= 70) {
    color = 'bg-amber-100 text-amber-700';
    label = 'En Proceso';
  } else {
    color = 'bg-red-100 text-red-700';
    label = 'Crítico';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        value >= 90 ? 'bg-green-500' : value >= 70 ? 'bg-amber-500' : 'bg-red-500'
      }`} />
      {showLabel ? label : `${value.toFixed(1)}%`}
    </span>
  );
};

export default SemaforoChip;
