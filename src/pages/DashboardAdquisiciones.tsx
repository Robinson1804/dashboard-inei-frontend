import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import {
  ClipboardList,
  CheckCircle,
  Wallet,
  BadgeDollarSign,
  Target,
  Eye,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import KpiCard from '@/components/ui/KpiCard';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import PieChartEstado from '@/components/charts/PieChartEstado';
import BarChartGrouped from '@/components/charts/BarChartGrouped';
import BarChartHorizontal from '@/components/charts/BarChartHorizontal';

import { getKpis, getGraficos, getTabla, getDetalle } from '@/api/adquisiciones';
import { getUnidadesEjecutoras } from '@/api/datosMaestros';
import { formatMonto, formatPercent } from '@/utils/formatters';
import { useFilters } from '@/hooks/useFilters';

import type { FilterField, FilterParams } from '@/types/common';
import type {
  EstadoAdquisicion,
  FaseAdquisicion,
  TimelineHito,
  AdquisicionRow,
  GraficoAdquisicionItem,
} from '@/types/adquisicion';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const AREA_COLORS: Record<string, string> = {
  OTIN: '#f97316',
  DEC: '#3b82f6',
  OTA: '#10b981',
  OTPP: '#8b5cf6',
  PROVEEDOR: '#6b7280',
  'COMITE': '#ec4899',
};

/**
 * Backend estados are uppercase snake_case (EN_ACTOS_PREPARATORIOS, etc.).
 * Map each to display-friendly badge colours.
 */
const ESTADO_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  EN_ACTOS_PREPARATORIOS: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Actos Preparatorios' },
  EN_SELECCION:           { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'En Seleccion'          },
  EN_EJECUCION:           { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'En Ejecucion'          },
  ADJUDICADO:             { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Adjudicado'            },
  CULMINADO:              { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Culminado'             },
  DESIERTO:               { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Desierto'              },
  NULO:                   { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400',  label: 'Nulo'                  },
};

const ESTADO_MODAL_BADGE: Record<string, string> = {
  EN_ACTOS_PREPARATORIOS: 'bg-orange-100 text-orange-700',
  EN_SELECCION:           'bg-blue-100 text-blue-700',
  EN_EJECUCION:           'bg-indigo-100 text-indigo-700',
  ADJUDICADO:             'bg-green-100 text-green-700',
  CULMINADO:              'bg-purple-100 text-purple-700',
  DESIERTO:               'bg-red-100 text-red-700',
  NULO:                   'bg-slate-100 text-slate-600',
};

/** Map the string phase name from the backend to a numbered badge. */
const FASE_BADGE: Record<FaseAdquisicion, { label: string; bg: string; text: string }> = {
  ACTUACIONES_PREPARATORIAS: { label: 'F1', bg: 'bg-orange-100', text: 'text-orange-700' },
  SELECCION:                 { label: 'F2', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  EJECUCION_CONTRACTUAL:     { label: 'F3', bg: 'bg-green-100',  text: 'text-green-700'  },
};

const FASE_LABEL: Record<FaseAdquisicion, string> = {
  ACTUACIONES_PREPARATORIAS: 'Actuaciones Preparatorias',
  SELECCION: 'Seleccion',
  EJECUCION_CONTRACTUAL: 'Ejecucion Contractual',
};

// ---------------------------------------------------------------------------
// ProcessFlowBoard constants
// ---------------------------------------------------------------------------

const NODES_PER_ROW = 6;

const PHASES_CONFIG = [
  {
    key: 'ACTUACIONES_PREPARATORIAS',
    label: 'Actuaciones Preparatorias',
    shortLabel: 'F1',
    badgeBg:     'bg-orange-400',
    progressBar: 'bg-orange-400',
    sectionBg:   'bg-slate-50',
  },
  {
    key: 'SELECCION',
    label: 'Seleccion',
    shortLabel: 'F2',
    badgeBg:     'bg-violet-500',
    progressBar: 'bg-violet-500',
    sectionBg:   'bg-slate-50',
  },
  {
    key: 'EJECUCION_CONTRACTUAL',
    label: 'Ejecucion Contractual',
    shortLabel: 'F3',
    badgeBg:     'bg-emerald-500',
    progressBar: 'bg-emerald-500',
    sectionBg:   'bg-slate-50',
  },
];

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/** Colours used for the pie/bar chart slices, keyed by estado code. */
const ESTADO_CHART_COLOR: Record<string, string> = {
  EN_ACTOS_PREPARATORIOS: '#f97316',
  EN_SELECCION:           '#3b82f6',
  EN_EJECUCION:           '#6366f1',
  ADJUDICADO:             '#10b981',
  CULMINADO:              '#8b5cf6',
  DESIERTO:               '#ef4444',
  NULO:                   '#94a3b8',
};

// ---------------------------------------------------------------------------
// Filter fields
// ---------------------------------------------------------------------------

const BASE_FILTER_FIELDS: FilterField[] = [
  {
    key: 'anioFiscal',
    label: 'Ano Fiscal',
    type: 'select',
    options: [
      { value: '2026', label: '2026' },
      { value: '2025', label: '2025' },
      { value: '2024', label: '2024' },
    ],
  },
  {
    key: 'ue_id',
    label: 'Unidad Ejecutora',
    type: 'select',
    placeholder: 'Todas las UEs',
    options: [],
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'EN_ACTOS_PREPARATORIOS', label: 'Actos Preparatorios' },
      { value: 'EN_SELECCION',           label: 'En Seleccion'         },
      { value: 'EN_EJECUCION',           label: 'En Ejecucion'         },
      { value: 'ADJUDICADO',             label: 'Adjudicado'           },
      { value: 'CULMINADO',              label: 'Culminado'            },
      { value: 'DESIERTO',               label: 'Desierto'             },
      { value: 'NULO',                   label: 'Nulo'                 },
    ],
  },
  {
    key: 'tipo_procedimiento',
    label: 'Tipo de Proceso',
    type: 'select',
    options: [
      { value: 'LICITACION_PUBLICA',       label: 'Licitacion Publica'        },
      { value: 'CONCURSO_PUBLICO',         label: 'Concurso Publico'          },
      { value: 'SUBASTA_INVERSA',          label: 'Subasta Inversa'           },
      { value: 'COMPARACION_PRECIOS',      label: 'Comparacion de Precios'    },
      { value: 'CONTRATACION_DIRECTA',     label: 'Contratacion Directa'      },
      { value: 'CATALOGO_ELECTRONICO',     label: 'Catalogo Electronico'      },
      { value: 'DIALOGO_COMPETITIVO',      label: 'Dialogo Competitivo'       },
    ],
  },
  {
    key: 'mes',
    label: 'Mes',
    type: 'select',
    placeholder: 'Todos los meses',
    options: [
      { value: '1',  label: 'Enero'      },
      { value: '2',  label: 'Febrero'    },
      { value: '3',  label: 'Marzo'      },
      { value: '4',  label: 'Abril'      },
      { value: '5',  label: 'Mayo'       },
      { value: '6',  label: 'Junio'      },
      { value: '7',  label: 'Julio'      },
      { value: '8',  label: 'Agosto'     },
      { value: '9',  label: 'Septiembre' },
      { value: '10', label: 'Octubre'    },
      { value: '11', label: 'Noviembre'  },
      { value: '12', label: 'Diciembre'  },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const EstadoBadge: React.FC<{ estado: EstadoAdquisicion | string | null }> = ({ estado }) => {
  if (!estado) return null;
  const s = ESTADO_BADGE[estado] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: estado };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const FaseBadge: React.FC<{ fase: FaseAdquisicion | string | null }> = ({ fase }) => {
  if (!fase) return null;
  const f = FASE_BADGE[fase as FaseAdquisicion];
  if (!f) return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
      {fase}
    </span>
  );
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${f.bg} ${f.text}`}>
      {f.label}
    </span>
  );
};


const AreaBadge: React.FC<{ area: string | null }> = ({ area }) => {
  if (!area) return null;
  const color = AREA_COLORS[area] ?? '#94a3b8';
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {area}
    </span>
  );
};

// ---------------------------------------------------------------------------
// ProcessFlowBoard — visual pipeline view for hitos inside modal
// ---------------------------------------------------------------------------

const HitoNode: React.FC<{ hito: TimelineHito }> = ({ hito }) => {
  const statusCfg: Record<string, { label: string; cls: string }> = {
    COMPLETADO: { label: 'COMPLETADO', cls: 'bg-green-100 text-green-700'   },
    EN_CURSO:   { label: 'EN CURSO',   cls: 'bg-blue-100 text-blue-700'    },
    OBSERVADO:  { label: 'OBSERVADO',  cls: 'bg-amber-100 text-amber-700'  },
    PENDIENTE:  { label: 'PENDIENTE',  cls: 'bg-slate-100 text-slate-500'  },
  };
  const status = statusCfg[hito.estado ?? 'PENDIENTE'] ?? statusCfg['PENDIENTE'];

  return (
    <div className="flex flex-col items-center flex-shrink-0 w-[175px]">
      {/* Card */}
      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col gap-2 min-h-[120px]">
        {/* Number badge */}
        <span className="self-start inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold tracking-wide">
          #{hito.orden}
        </span>
        {/* Title */}
        <p className="text-[12px] font-semibold text-slate-800 leading-snug line-clamp-3 flex-1">
          {hito.hito}
        </p>
        {/* Area + days */}
        <div className="flex items-center justify-between gap-1 mt-auto pt-1 border-t border-slate-50">
          <AreaBadge area={hito.area_responsable} />
          {hito.dias_planificados != null && (
            <span className="text-[11px] text-slate-400 font-medium">{hito.dias_planificados}d</span>
          )}
        </div>
      </div>
      {/* Status badge below card */}
      <span className={`mt-2 inline-block text-[10px] font-bold px-3 py-1 rounded-full tracking-wide ${status.cls}`}>
        {status.label}
      </span>
    </div>
  );
};

const ProcessFlowBoard: React.FC<{ hitos: TimelineHito[] }> = ({ hitos }) => {
  const hitosByPhase = useMemo(() => {
    const map = new Map<string, TimelineHito[]>();
    hitos.forEach((h) => {
      const key = h.fase ?? 'SIN FASE';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    });
    return map;
  }, [hitos]);

  const completedCount = hitos.filter((h) => h.estado === 'COMPLETADO').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center pb-1">
        <h4 className="text-base font-bold text-slate-800">Flujo del Proceso de Contratacion</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {hitos.length} Hitos · {completedCount} completados
        </p>
      </div>

      {/* Phase summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {PHASES_CONFIG.map(({ key, label, shortLabel, badgeBg, progressBar }) => {
          const phaseHitos = hitosByPhase.get(key) ?? [];
          const phaseCompleted = phaseHitos.filter((h) => h.estado === 'COMPLETADO').length;
          const phasePct = phaseHitos.length > 0 ? Math.round((phaseCompleted / phaseHitos.length) * 100) : 0;
          return (
            <div key={key} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${badgeBg}`}>
                  <span className="text-white text-sm font-black">{shortLabel}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {phaseCompleted}/{phaseHitos.length} · {phasePct}%
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${progressBar}`}
                  style={{ width: `${phasePct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase sections */}
      {PHASES_CONFIG.map(({ key, label, shortLabel, badgeBg, sectionBg }) => {
        const phaseHitos = hitosByPhase.get(key) ?? [];
        if (phaseHitos.length === 0) return null;
        const rows = chunkArray(phaseHitos, NODES_PER_ROW);
        return (
          <div key={key} className={`${sectionBg} rounded-2xl border border-slate-100 p-5`}>
            {/* Phase header */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${badgeBg}`}>
                <span className="text-white text-sm font-black">{shortLabel}</span>
              </div>
              <h4 className="text-base font-bold text-slate-800">{label}</h4>
            </div>
            {/* Node rows */}
            <div className="space-y-6">
              {rows.map((rowHitos, rowIdx) => (
                <div key={rowIdx} className="flex items-start gap-1 flex-wrap">
                  {rowHitos.map((hito, nodeIdx) => (
                    <React.Fragment key={hito.orden}>
                      <HitoNode hito={hito} />
                      {nodeIdx < rowHitos.length - 1 && (
                        <span className="self-center text-slate-300 text-lg font-light flex-shrink-0 px-0.5">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detail panel skeleton
// ---------------------------------------------------------------------------

const DetailSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="h-2 w-16 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-lg" />
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Error card
// ---------------------------------------------------------------------------

const ErrorCard = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
    <p className="text-sm font-semibold text-red-700">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
    >
      <RefreshCw size={14} />
      Reintentar
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<AdquisicionRow>();

const DashboardAdquisiciones: React.FC = () => {
  const { filters, applyFilters, clearFilters } = useFilters({ anioFiscal: '2026' });
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  // Fetch unidades ejecutoras for dynamic filter dropdown
  const { data: unidades } = useQuery({
    queryKey: ['maestros', 'unidades-ejecutoras'],
    queryFn: getUnidadesEjecutoras,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Build filter fields with dynamic UE options
  const filterFields: FilterField[] = useMemo(() => {
    return BASE_FILTER_FIELDS.map((field) => {
      if (field.key === 'ue_id' && unidades) {
        return {
          ...field,
          options: unidades.map((ue) => ({
            value: String(ue.id),
            label: `${ue.sigla} - ${ue.nombre}`,
          })),
        };
      }
      return field;
    });
  }, [unidades]);

  // Map the UI filter keys to the exact backend query parameter names
  const apiFilters = useMemo<FilterParams>(() => ({
    anio: filters.anioFiscal ? parseInt(filters.anioFiscal as string, 10) : undefined,
    ue_id: filters.ue_id ? parseInt(filters.ue_id as string, 10) : undefined,
    estado: (filters.estado as string) || undefined,
    tipo_procedimiento: (filters.tipo_procedimiento as string) || undefined,
    mes: filters.mes ? parseInt(filters.mes as string, 10) : undefined,
  }), [filters]);

  const {
    data: kpis,
    isLoading: kpisLoading,
    isError: kpisError,
    refetch: refetchKpis,
  } = useQuery({
    queryKey: ['adquisiciones', 'kpis', apiFilters],
    queryFn: () => getKpis(apiFilters),
    retry: 2,
  });

  const {
    data: graficosRaw,
    isLoading: graficosLoading,
    isError: graficosError,
    refetch: refetchGraficos,
  } = useQuery({
    queryKey: ['adquisiciones', 'graficos', apiFilters],
    queryFn: () => getGraficos(apiFilters),
    retry: 2,
  });

  const {
    data: tablaData,
    isLoading: tablaLoading,
    isError: tablaError,
    refetch: refetchTabla,
  } = useQuery({
    queryKey: ['adquisiciones', 'tabla', apiFilters],
    queryFn: () => getTabla(apiFilters, 1, 20),
    retry: 2,
  });

  // Fetch detail only when a row is selected
  const {
    data: detalleResponse,
    isLoading: detalleLoading,
  } = useQuery({
    queryKey: ['adquisiciones', 'detalle', selectedRowId],
    queryFn: () => getDetalle(selectedRowId!),
    enabled: selectedRowId !== null,
    retry: 1,
  });

  // Backend returns { rows: AdquisicionRow[], total, page, page_size }
  const tableRows = tablaData?.rows ?? [];

  // ---------------------------------------------------------------------------
  // Column definitions — all accessor keys match AdquisicionRow (snake_case)
  // ---------------------------------------------------------------------------
  const columns = useMemo<ColumnDef<AdquisicionRow, unknown>[]>(
    () => [
      columnHelper.accessor('codigo', {
        header: 'Codigo',
        cell: (info) => (
          <span className="font-mono text-xs text-blue-600 font-bold">{info.getValue() as string}</span>
        ),
      }),
      columnHelper.accessor('descripcion', {
        header: 'Descripcion',
        cell: (info) => (
          <span className="max-w-xs block truncate text-slate-700 text-xs" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      }),
      // ue_sigla is the resolved abbreviation from the backend join
      columnHelper.accessor('ue_sigla', {
        header: 'UE',
        cell: (info) => {
          const val = info.getValue() as string | null;
          if (!val) return <span className="text-slate-400 text-xs">—</span>;
          return <AreaBadge area={val.split('-')[0] ?? val} />;
        },
      }),
      columnHelper.accessor('tipo_objeto', {
        header: 'Tipo Objeto',
        cell: (info) => (
          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
            {(info.getValue() as string | null) ?? '—'}
          </span>
        ),
      }),
      columnHelper.accessor('tipo_procedimiento', {
        header: 'Procedimiento',
        cell: (info) => {
          const raw = (info.getValue() as string | null) ?? '—';
          // Convert LICITACION_PUBLICA -> Licitacion Publica for readability
          const label = raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <span className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded font-medium max-w-[120px] truncate block" title={label}>
              {label}
            </span>
          );
        },
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: (info) => <EstadoBadge estado={info.getValue() as EstadoAdquisicion | null} />,
      }),
      columnHelper.accessor('fase_actual', {
        header: 'Fase',
        cell: (info) => <FaseBadge fase={info.getValue() as FaseAdquisicion | null} />,
      }),
      columnHelper.accessor('monto_referencial', {
        header: 'Monto Ref.',
        cell: (info) => {
          const val = info.getValue() as number | null;
          return (
            <span className="text-sm font-semibold text-slate-800 tabular-nums">
              {val !== null && val !== undefined ? formatMonto(val) : '—'}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRowId(row.original.id);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
        ),
      }),
    ] as ColumnDef<AdquisicionRow, unknown>[],
    []
  );

  // ---------------------------------------------------------------------------
  // Chart data — graficosRaw is GraficoAdquisicionItem[] (flat array)
  // We derive both the pie chart and the horizontal bar chart from this single array.
  // ---------------------------------------------------------------------------
  const pieData = useMemo(() => {
    const items: GraficoAdquisicionItem[] = graficosRaw ?? [];
    return items.map((item) => ({
      name: item.label,
      value: item.cantidad,
      color: ESTADO_CHART_COLOR[item.estado] ?? '#94a3b8',
    }));
  }, [graficosRaw]);

  const barEstadoData = useMemo(() => {
    const items: GraficoAdquisicionItem[] = graficosRaw ?? [];
    return items.map((item) => ({
      name: item.label,
      value: item.cantidad,
      color: ESTADO_CHART_COLOR[item.estado] ?? '#94a3b8',
    }));
  }, [graficosRaw]);

  // ---------------------------------------------------------------------------
  // KPI field references — backend: { total, monto_pim, monto_adjudicado,
  //   avance_porcentaje, culminados, en_proceso, by_estado }
  // ---------------------------------------------------------------------------
  const totalAdquisiciones = kpis?.total ?? 0;

  // Resolve detail sub-resources from the nested backend response
  const detalleAdq = detalleResponse?.adquisicion ?? null;
  const detalleHitos = detalleResponse?.procesos ?? [];

  const selectedRowEstado = tableRows.find((r) => r.id === selectedRowId)?.estado ?? null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Adquisiciones &gt; 8 UIT</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Seguimiento de procesos mayores a S/ 44,000 — Ley 32069 · UIT 2026: S/ 5,500
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
          Ano Fiscal {filters.anioFiscal ?? '2026'}
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar fields={filterFields} onApply={applyFilters} onClear={clearFilters} />

      {/* KPI cards */}
      {kpisError ? (
        <ErrorCard message="No se pudo cargar los KPIs de adquisiciones." onRetry={refetchKpis} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {kpisLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-8 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
            ))
          ) : (
            <>
              <KpiCard
                label="Requerimientos"
                value={kpis?.total ?? 0}
                icon={ClipboardList}
                iconBgColor="bg-blue-100 text-blue-600"
              />
              <KpiCard
                label="Culminados"
                value={kpis?.culminados ?? 0}
                icon={CheckCircle}
                iconBgColor="bg-green-100 text-green-600"
                delta={
                  kpis && kpis.total > 0
                    ? `${formatPercent((kpis.culminados / kpis.total) * 100)} del total`
                    : undefined
                }
                deltaColor="green"
              />
              <KpiCard
                label="Monto PIM"
                value={kpis ? formatMonto(kpis.monto_pim) : '—'}
                icon={Wallet}
                iconBgColor="bg-amber-100 text-amber-600"
              />
              <KpiCard
                label="Adjudicado"
                value={kpis ? formatMonto(kpis.monto_adjudicado) : '—'}
                icon={BadgeDollarSign}
                iconBgColor="bg-indigo-100 text-indigo-600"
                delta={
                  kpis && kpis.monto_pim > 0
                    ? `${formatPercent((kpis.monto_adjudicado / kpis.monto_pim) * 100)} del PIM`
                    : undefined
                }
                deltaColor="blue"
              />
              <KpiCard
                label="Avance Global"
                value={kpis ? formatPercent(kpis.avance_porcentaje) : '—'}
                icon={Target}
                iconBgColor="bg-blue-100 text-blue-600"
                highlight
              />
            </>
          )}
        </div>
      )}

      {/* Charts grid */}
      {graficosError ? (
        <ErrorCard message="No se pudo cargar los graficos de adquisiciones." onRetry={refetchGraficos} />
      ) : graficosLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie: distribution by estado (cantidad) */}
          <PieChartEstado
            data={pieData}
            title="Estado de Adquisiciones"
            centerTotal={totalAdquisiciones}
            centerLabel="Total"
            height={280}
          />
          {/* Horizontal bar: cantidad per estado */}
          <BarChartHorizontal
            data={barEstadoData}
            title="Cantidad por Estado"
            valueFormatter={(v: number) => `${v}`}
            height={280}
          />
          {/* Bar grouped: monto referencial per estado */}
          <BarChartGrouped
            data={(graficosRaw ?? []).map((item: GraficoAdquisicionItem) => ({
              estado: item.label,
              monto: item.monto,
            }))}
            xKey="estado"
            bars={[{ dataKey: 'monto', name: 'Monto Ref. (S/)', color: '#3b82f6' }]}
            title="Monto Referencial por Estado"
            height={280}
          />
        </div>
      )}

      {/* Data table */}
      {tablaError ? (
        <ErrorCard message="No se pudo cargar la tabla de adquisiciones." onRetry={refetchTabla} />
      ) : (
        <DataTable
          title="Listado de Adquisiciones"
          data={tableRows}
          columns={columns}
          onRowClick={(row) => setSelectedRowId(row.id)}
          pageSize={10}
          isLoading={tablaLoading}
        />
      )}

      {/* Detail modal */}
      {selectedRowId !== null && (
        <Modal
          isOpen={selectedRowId !== null}
          onClose={() => setSelectedRowId(null)}
          title={
            detalleAdq?.descripcion ??
            tableRows.find((r) => r.id === selectedRowId)?.descripcion ??
            'Detalle de Adquisicion'
          }
          codeBadge={
            detalleAdq?.codigo ??
            tableRows.find((r) => r.id === selectedRowId)?.codigo
          }
          statusBadge={
            selectedRowEstado
              ? {
                  label: ESTADO_BADGE[selectedRowEstado]?.label ?? selectedRowEstado,
                  color: ESTADO_MODAL_BADGE[selectedRowEstado] ?? 'bg-slate-100 text-slate-600',
                }
              : undefined
          }
          maxWidth="max-w-[1500px]"
          footer={
            <button
              onClick={() => setSelectedRowId(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          }
        >
          {detalleLoading ? (
            <DetailSkeleton />
          ) : detalleAdq ? (
            <>
              {/* Metadata summary — fields from AdquisicionResponse (snake_case) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {[
                  { label: 'UE',              value: detalleAdq.ue_sigla ?? '—' },
                  { label: 'Meta',            value: detalleAdq.meta_codigo ?? '—' },
                  { label: 'Tipo Proceso',    value: detalleAdq.tipo_procedimiento?.replace(/_/g, ' ') ?? '—' },
                  { label: 'Tipo Objeto',     value: detalleAdq.tipo_objeto ?? '—' },
                  { label: 'Monto Referencial', value: detalleAdq.monto_referencial !== null && detalleAdq.monto_referencial !== undefined ? formatMonto(detalleAdq.monto_referencial) : '—' },
                  { label: 'Adjudicado',      value: detalleAdq.monto_adjudicado !== null && detalleAdq.monto_adjudicado !== undefined ? formatMonto(detalleAdq.monto_adjudicado) : '—' },
                  { label: 'Proveedor',       value: detalleAdq.proveedor_razon_social ?? '—' },
                  { label: 'Anio Fiscal',     value: detalleAdq.anio?.toString() ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Process flow board — driven by procesos from the nested response */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Hitos del Proceso
                  {detalleHitos.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      ({detalleHitos.length} hitos)
                    </span>
                  )}
                </h3>
                {detalleHitos.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">
                    No hay hitos registrados para este proceso.
                  </p>
                ) : (
                  <ProcessFlowBoard hitos={detalleHitos} />
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No se pudo cargar el detalle.</p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default DashboardAdquisiciones;
