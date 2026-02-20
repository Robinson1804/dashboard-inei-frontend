/**
 * TimelineGantt — renders the 22-step OSCE procurement timeline in either
 * "gantt" (horizontal bars grouped by phase) or "stepper" (vertical list) mode.
 *
 * Field names align with AdquisicionProcesoResponse (snake_case):
 *   area_responsable, dias_planificados, fecha_inicio, fecha_fin, estado, fase
 */
import { CheckCircle, Clock, Circle, AlertTriangle } from 'lucide-react';
import type { TimelineHito } from '../../types';

interface TimelineGanttProps {
  hitos: TimelineHito[];
  mode: 'gantt' | 'stepper';
}

const getAreaColor = (area: string | null | undefined): string => {
  switch (area) {
    case 'OTIN':      return 'bg-orange-500 text-white';
    case 'DEC':       return 'bg-blue-500 text-white';
    case 'OTA':       return 'bg-green-600 text-white';
    case 'OTPP':      return 'bg-purple-500 text-white';
    case 'PROVEEDOR': return 'bg-slate-500 text-white';
    case 'COMITÉ':    return 'bg-pink-500 text-white';
    default:          return 'bg-slate-500 text-white';
  }
};

const StatusIcon = ({ estado }: { estado: string | null | undefined }) => {
  switch (estado) {
    case 'COMPLETADO':
      return <CheckCircle size={16} className="text-green-500" />;
    case 'EN_CURSO':
      return <Clock size={16} className="text-blue-500 animate-pulse" />;
    case 'OBSERVADO':
      return <AlertTriangle size={16} className="text-red-500" />;
    default:
      return <Circle size={16} className="text-slate-300" />;
  }
};

export const TimelineGantt = ({ hitos, mode }: TimelineGanttProps) => {
  if (mode === 'stepper') {
    return (
      <div className="relative pl-4 py-2">
        {/* Vertical connector line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200" />

        {hitos.map((hito, idx) => (
          <div key={idx} className="relative flex items-start mb-6 last:mb-0 group">
            <div
              className={`z-10 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center mr-4 flex-shrink-0
                ${hito.estado === 'COMPLETADO' ? 'border-green-500' : hito.estado === 'EN_CURSO' ? 'border-blue-500' : 'border-slate-300'}`}
            >
              <StatusIcon estado={hito.estado} />
            </div>
            <div className="flex-1 bg-white border border-slate-200 p-3 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-slate-800">{hito.hito}</h4>
                {/* fecha_inicio replaces camelCase fechaInicio */}
                <span className="text-xs text-slate-400">{hito.fecha_inicio ?? 'Pendiente'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {/* area_responsable replaces camelCase areaResponsable */}
                {hito.area_responsable && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getAreaColor(hito.area_responsable)}`}>
                    {hito.area_responsable}
                  </span>
                )}
                {/* dias_planificados replaces camelCase diasPlanificados */}
                {hito.dias_planificados !== null && hito.dias_planificados !== undefined && (
                  <span className="text-xs text-slate-500">{hito.dias_planificados} dias est.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Gantt mode — horizontal bars grouped by fase
  // ---------------------------------------------------------------------------
  const groupedHitos = {
    PREPARATORIA: hitos.filter((h) => h.fase === 'ACTUACIONES_PREPARATORIAS'),
    SELECCION:    hitos.filter((h) => h.fase === 'SELECCION'),
    EJECUCION:    hitos.filter((h) => h.fase === 'EJECUCION_CONTRACTUAL'),
  };

  const getBarWidth = (hito: TimelineHito): number => {
    if (hito.estado === 'COMPLETADO') return 100;
    if (hito.estado === 'EN_CURSO')   return 50 + Math.random() * 30;
    return 0;
  };

  const renderPhase = (title: string, items: TimelineHito[], bgClass: string) => (
    <div className={`p-4 rounded-lg border border-slate-200 mb-4 ${bgClass}`}>
      <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">{title}</h4>
      <div className="space-y-3">
        {items.map((hito, idx) => (
          <div key={idx} className="flex items-center">
            <div className="w-1/3 pr-4">
              <p className="text-xs font-medium text-slate-700 truncate" title={hito.hito}>
                {hito.hito}
              </p>
            </div>
            <div className="w-2/3 h-6 bg-white rounded-full overflow-hidden flex relative border border-slate-200">
              <div
                className={`h-full ${getAreaColor(hito.area_responsable)} opacity-80 flex items-center px-2 transition-all`}
                style={{ width: `${Math.max(10, getBarWidth(hito))}%` }}
              >
                {hito.area_responsable && (
                  <span className="text-[10px] text-white font-bold whitespace-nowrap">
                    {hito.area_responsable}
                  </span>
                )}
              </div>
              <div className="absolute right-2 top-1">
                <StatusIcon estado={hito.estado} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {groupedHitos.PREPARATORIA.length > 0 &&
        renderPhase('Fase 1: Actuaciones Preparatorias', groupedHitos.PREPARATORIA, 'bg-orange-50')}
      {groupedHitos.SELECCION.length > 0 &&
        renderPhase('Fase 2: Seleccion', groupedHitos.SELECCION, 'bg-blue-50')}
      {groupedHitos.EJECUCION.length > 0 &&
        renderPhase('Fase 3: Ejecucion Contractual', groupedHitos.EJECUCION, 'bg-green-50')}
    </div>
  );
};

export default TimelineGantt;
