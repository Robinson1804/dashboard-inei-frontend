import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  CheckCircle2,
  Eye,
  MailOpen,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

import KpiCard from '@/components/ui/KpiCard';
import FilterBar from '@/components/ui/FilterBar';
import { getAlertas, getResumen, marcarLeida, marcarResuelta } from '@/api/alertas';
import { useFilters } from '@/hooks/useFilters';

import type { Alerta, FilterField } from '@/types';

// ---------------------------------------------------------------------------
// Filter field definitions
// ---------------------------------------------------------------------------

const filterFields: FilterField[] = [
  {
    key: 'nivel',
    label: 'Nivel',
    type: 'select',
    options: [
      { value: 'ROJO',     label: 'Rojo (Crítica)'     },
      { value: 'AMARILLO',  label: 'Amarillo (Advertencia)' },
      { value: 'VERDE',     label: 'Verde (Informativa)'    },
    ],
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'no_leida', label: 'No leída'  },
      { value: 'leida',    label: 'Leída'     },
      { value: 'resuelta', label: 'Resuelta'  },
    ],
  },
  {
    key: 'modulo',
    label: 'Módulo',
    type: 'select',
    options: [
      { value: 'PRESUPUESTO',             label: 'Presupuesto'             },
      { value: 'ADQUISICIONES',            label: 'Adquisiciones'           },
      { value: 'CONTRATOS_MENORES',        label: 'Contratos Menores'       },
      { value: 'ACTIVIDADES_OPERATIVAS',   label: 'Actividades Operativas'  },
    ],
  },
];

// ---------------------------------------------------------------------------
// Level config for icons and colors
// ---------------------------------------------------------------------------

const nivelConfig: Record<string, {
  icon: typeof AlertTriangle;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  ROJO: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-l-red-500',
    label: 'Crítica',
  },
  AMARILLO: {
    icon: AlertCircle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-l-amber-500',
    label: 'Advertencia',
  },
  VERDE: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-l-blue-500',
    label: 'Informativa',
  },
};

const defaultNivelConfig = nivelConfig['VERDE'];

// ---------------------------------------------------------------------------
// Helper to derive estado from booleans
// ---------------------------------------------------------------------------
function getEstado(alerta: Alerta): 'no_leida' | 'leida' | 'resuelta' {
  if (alerta.resuelta) return 'resuelta';
  if (alerta.leida) return 'leida';
  return 'no_leida';
}

// ---------------------------------------------------------------------------
// Alert card sub-component
// ---------------------------------------------------------------------------

interface AlertaCardProps {
  alerta: Alerta;
  onMarcarLeida: (id: number) => void;
  onToggleResuelta: (id: number) => void;
  isUpdating?: boolean;
}

const AlertaCard: React.FC<AlertaCardProps> = ({
  alerta,
  onMarcarLeida,
  onToggleResuelta,
  isUpdating = false,
}) => {
  const config = nivelConfig[alerta.nivel ?? ''] ?? defaultNivelConfig;
  const Icon = config.icon;
  const estado = getEstado(alerta);
  const isResolved = estado === 'resuelta';
  const isUnread = estado === 'no_leida';

  const fechaStr = alerta.fecha_generacion
    ? new Date(alerta.fecha_generacion).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
        isResolved
          ? 'border-slate-200 opacity-60'
          : isUnread
          ? `border-l-4 ${config.borderColor} border-slate-200`
          : 'border-slate-200'
      } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
          <Icon size={20} className={config.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={`text-sm font-bold ${isResolved ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {alerta.titulo}
            </h4>
            {isUnread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
              alerta.nivel === 'ROJO'     ? 'bg-red-100 text-red-700' :
              alerta.nivel === 'AMARILLO' ? 'bg-amber-100 text-amber-700' :
                                            'bg-blue-100 text-blue-700'
            }`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">{fechaStr}</p>
          <p className="text-sm text-slate-600 mb-3">{alerta.descripcion}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {alerta.ue_sigla && (
              <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {alerta.ue_sigla}
              </span>
            )}
            {alerta.modulo && (
              <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize">
                {alerta.modulo.replace(/_/g, ' ').toLowerCase()}
              </span>
            )}
            {alerta.tipo && (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {alerta.tipo.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isUnread && (
            <button
              onClick={() => onMarcarLeida(alerta.id)}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <Eye size={12} />
              Marcar leída
            </button>
          )}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isResolved}
              onChange={() => onToggleResuelta(alerta.id)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="text-xs text-slate-500">Resuelta</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const Alertas = () => {
  const queryClient = useQueryClient();
  const { filters, applyFilters, clearFilters } = useFilters();
  const [page, setPage] = useState(1);

  // Build API query params from filters
  const apiParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.nivel) params.nivel = filters.nivel as string;
    if (filters.modulo) params.modulo = filters.modulo as string;
    // estado filter: map to leida/resuelta booleans
    if (filters.estado === 'no_leida') { params.leida = 'false'; params.resuelta = 'false'; }
    else if (filters.estado === 'leida') { params.leida = 'true'; params.resuelta = 'false'; }
    else if (filters.estado === 'resuelta') { params.resuelta = 'true'; }
    return params;
  }, [filters]);

  // Fetch alerts
  const {
    data: alertasData,
    isLoading: alertasLoading,
    isError: alertasError,
    refetch: refetchAlertas,
  } = useQuery({
    queryKey: ['alertas', 'lista', apiParams],
    queryFn: () => getAlertas(apiParams as any),
    retry: 1,
  });

  // Fetch summary
  const { data: resumen } = useQuery({
    queryKey: ['alertas', 'resumen'],
    queryFn: getResumen,
    retry: 1,
  });

  const alertas = alertasData ?? [];

  // Computed summary from local data
  const rojas      = useMemo(() => alertas.filter((a) => a.nivel === 'ROJO' && !a.resuelta).length, [alertas]);
  const amarillas  = useMemo(() => alertas.filter((a) => a.nivel === 'AMARILLO' && !a.resuelta).length, [alertas]);
  const noLeidas   = useMemo(() => alertas.filter((a) => !a.leida).length, [alertas]);
  const resueltas  = useMemo(() => alertas.filter((a) => a.resuelta).length, [alertas]);

  // Mutations
  const marcarLeidaMutation = useMutation({
    mutationFn: (id: number) => marcarLeida(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });

  const marcarResueltaMutation = useMutation({
    mutationFn: ({ id }: { id: number; resuelta: boolean }) =>
      marcarResuelta(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });

  // Mark all unread alerts as read — calls marcarLeida for each individually
  const marcarTodasLeidasMutation = useMutation({
    mutationFn: async () => {
      const unread = alertas.filter((a) => !a.leida);
      await Promise.all(unread.map((a) => marcarLeida(a.id)));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });

  const PAGE_SIZE = 10;
  const pagedAlertas = alertas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(alertas.length / PAGE_SIZE);
  const hasMore = page < totalPages;

  return (
    <div className="space-y-6">
      {/* KPI summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Críticas (Rojas)"
          value={resumen?.rojas ?? rojas}
          icon={AlertTriangle}
          iconBgColor="bg-red-100 text-red-600"
        />
        <KpiCard
          label="Advertencias (Amarillas)"
          value={resumen?.amarillas ?? amarillas}
          icon={AlertCircle}
          iconBgColor="bg-amber-100 text-amber-600"
        />
        <KpiCard
          label="No Leídas"
          value={resumen?.no_leidas ?? noLeidas}
          icon={Bell}
          iconBgColor="bg-blue-100 text-blue-600"
        />
        <KpiCard
          label="Resueltas"
          value={resueltas}
          icon={CheckCircle2}
          iconBgColor="bg-green-100 text-green-600"
        />
      </div>

      {/* Filters */}
      <FilterBar fields={filterFields} onApply={applyFilters} onClear={clearFilters} />

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{alertas.length} alertas encontradas</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void refetchAlertas()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RefreshCw size={12} />
            Actualizar
          </button>
          <button
            onClick={() => marcarTodasLeidasMutation.mutate()}
            disabled={noLeidas === 0 || marcarTodasLeidasMutation.isPending}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MailOpen size={14} />
            Marcar todas leídas
          </button>
        </div>
      </div>

      {/* Alert list */}
      {alertasLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : alertasError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-red-700 mb-3">No se pudo cargar las alertas.</p>
          <button
            onClick={() => void refetchAlertas()}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pagedAlertas.map((alerta) => (
            <AlertaCard
              key={alerta.id}
              alerta={alerta}
              onMarcarLeida={(id) => marcarLeidaMutation.mutate(id)}
              onToggleResuelta={(id) => {
                const current = alertas.find((a) => a.id === id);
                if (current) {
                  marcarResueltaMutation.mutate({ id, resuelta: current.resuelta });
                }
              }}
              isUpdating={
                (marcarLeidaMutation.isPending && marcarLeidaMutation.variables === alerta.id) ||
                (marcarResueltaMutation.isPending && marcarResueltaMutation.variables?.id === alerta.id)
              }
            />
          ))}

          {pagedAlertas.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Bell size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">No hay alertas con los filtros seleccionados</p>
            </div>
          )}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronDown size={16} />
            Cargar más alertas ({alertas.length - page * PAGE_SIZE} restantes)
          </button>
        </div>
      )}
    </div>
  );
};

export default Alertas;
