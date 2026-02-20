interface AlertBadgeProps {
  count: number;
}

const AlertBadge = ({ count }: AlertBadgeProps) => {
  if (count <= 0) return null;

  return (
    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default AlertBadge;
