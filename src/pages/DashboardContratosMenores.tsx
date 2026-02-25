import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  CheckCircle2,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Eye,
  CheckCircle,
  Clock,
  Circle,
  RefreshCw,
  Activity,
} from 'lucide-react';

import KpiCard from '@/components/ui/KpiCard';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import PieChartEstado from '@/components/charts/PieChartEstado';
import BarChartHorizontal from '@/components/charts/BarChartHorizontal';
import BarChartTimeline from '@/components/charts/BarChartTimeline';

import { getKpis, getGraficos, getTabla, getDetalle, getFraccionamiento } from '@/api/contratosMenores';
import { formatMonto, formatPercent } from '@/utils/formatters';
import { useFilters } from '@/hooks/useFilters';

import type { FilterField, FilterParams } from '@/types';
import type {
  EstadoContrato,
  ContratoMenorHito,
  ContratoMenorRow,
  GraficoContratoMenorItem,
} from '@/types/contratoMenor';

// ---------------------------------------------------------------------------
// Design tokens — estado values match backend uppercase constants exactly
// ---------------------------------------------------------------------------

const AREA_COLORS: Record<string, string> = {
  OTIN: 'bg-orange-100 text-orange-700',
  OTA:  'bg-green-100 text-green-700',
  DEC:  'bg-blue-100 text-blue-700',
  OTPP: 'bg-purple-100 text-purple-700',
  PROVEEDOR: 'bg-slate-100 text-slate-600',
  SG:   'bg-gray-100 text-gray-600',
};

/**
 * Badge styles keyed by backend estado values.
 * Backend returns uppercase: 'PENDIENTE' | 'EN_PROCESO' | 'ORDEN_EMITIDA' | 'EJECUTADO' | 'PAGADO'
 */
const ESTADO_BADGE: Record<EstadoContrato, { bg: string; text: string }> = {
  PENDIENTE:     { bg: 'bg-slate-100',  text: 'text-slate-600'  },
  EN_PROCESO:    { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  ORDEN_EMITIDA: { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  EJECUTADO:     { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  PAGADO:        { bg: 'bg-green-100',  text: 'text-green-700'  },
};

/** Human-readable labels for modal status badge */
const ESTADO_LABEL: Record<EstadoContrato, string> = {
  PENDIENTE:     'Pendiente',
  EN_PROCESO:    'En Proceso',
  ORDEN_EMITIDA: 'Orden Emitida',
  EJECUTADO:     'Ejecutado',
  PAGADO:        'Pagado',
};

const MODAL_STATUS_BADGE: Record<EstadoContrato, { label: string; color: string }> = {
  PENDIENTE:     { label: 'Pendiente',     color: 'bg-slate-100 text-slate-600'  },
  EN_PROCESO:    { label: 'En Proceso',    color: 'bg-blue-100 text-blue-700'    },
  ORDEN_EMITIDA: { label: 'Orden Emitida', color: 'bg-amber-100 text-amber-700'  },
  EJECUTADO:     { label: 'Ejecutado',     color: 'bg-indigo-100 text-indigo-700'},
  PAGADO:        { label: 'Pagado',        color: 'bg-green-100 text-green-700'  },
};

// ---------------------------------------------------------------------------
// Chart helpers — the backend returns a flat list for GET /graficos
// The two series (by-estado vs by-tipo_objeto) are distinguished by label value
// ---------------------------------------------------------------------------

/** Backend estado values — used to split the flat graficos list */
const ESTADOS_VALIDOS = new Set<string>([
  'PENDIENTE', 'EN_PROCESO', 'ORDEN_EMITIDA', 'EJECUTADO', 'PAGADO',
]);

/** Backend tipo_objeto values */
const TIPOS_OBJETO_VALIDOS = new Set<string>([
  'BIEN', 'SERVICIO', 'OBRA', 'CONSULTORIA',
]);

/** Color palette for estado chart items */
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:     '#94a3b8',
  EN_PROCESO:    '#3b82f6',
  ORDEN_EMITIDA: '#f59e0b',
  EJECUTADO:     '#6366f1',
  PAGADO:        '#10b981',
};

/** Color palette for tipo_objeto chart items */
const TIPO_OBJETO_COLORS: Record<string, string> = {
  BIEN:        '#3b82f6',
  SERVICIO:    '#10b981',
  OBRA:        '#f59e0b',
  CONSULTORIA: '#8b5cf6',
};

// ---------------------------------------------------------------------------
// Filter fields
// ---------------------------------------------------------------------------

const FILTER_FIELDS: FilterField[] = [
  {
    key: 'anio',
    label: 'Ano Fiscal',
    type: 'select',
    options: [
      { value: '2026', label: '2026' },
      { value: '2025', label: '2025' },
      { value: '2024', label: '2024' },
    ],
    placeholder: 'Todos',
  },
  {
    key: 'ue_id',
    label: 'DDNNTT',
    type: 'select',
    options: [
      { value: '1', label: 'OTIN' },
      { value: '2', label: 'OTA'  },
      { value: '3', label: 'DEC'  },
      { value: '4', label: 'OTPP' },
      { value: '5', label: 'SG'   },
    ],
    placeholder: 'Todas',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'PENDIENTE',     label: 'Pendiente'     },
      { value: 'EN_PROCESO',    label: 'En Proceso'    },
      { value: 'ORDEN_EMITIDA', label: 'Orden Emitida' },
      { value: 'EJECUTADO',     label: 'Ejecutado'     },
      { value: 'PAGADO',        label: 'Pagado'        },
    ],
    placeholder: 'Todos',
  },
  {
    key: 'tipo_objeto',
    label: 'Tipo de Objeto',
    type: 'select',
    options: [
      { value: 'BIEN',        label: 'Bien'        },
      { value: 'SERVICIO',    label: 'Servicio'    },
      { value: 'OBRA',        label: 'Obra'        },
      { value: 'CONSULTORIA', label: 'Consultoria' },
    ],
    placeholder: 'Todos',
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
// Stepper hito step component
// Uses snake_case fields from ContratoMenorHito (ContratoMenorProcesoResponse)
// ---------------------------------------------------------------------------

interface HitoStepProps {
  hito: ContratoMenorHito;
  isLast: boolean;
}

const HitoStep: React.FC<HitoStepProps> = ({ hito, isLast }) => {
  const getCircleStyle = (): string => {
    switch (hito.estado) {
      case 'COMPLETADO': return 'bg-green-500 border-green-500 text-white';
      case 'EN_CURSO':   return 'bg-blue-500 border-blue-500 text-white';
      default:           return 'bg-white border-slate-300 text-slate-400';
    }
  };

  const getIcon = (): React.ReactNode => {
    switch (hito.estado) {
      case 'COMPLETADO': return <CheckCircle size={14} />;
      case 'EN_CURSO':   return <Clock size={14} />;
      default:           return <Circle size={12} />;
    }
  };

  // area_responsable may be null; fall back to the default color
  const areaKey = hito.area_responsable ?? '';
  const areaStyle = AREA_COLORS[areaKey] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getCircleStyle()}`}>
          {getIcon()}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 mt-1 mb-1" style={{ minHeight: '24px' }} />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
            {String(hito.orden).padStart(2, '0')}
          </span>
          <span className="text-sm font-semibold text-slate-800">{hito.hito}</span>
          {hito.area_responsable && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${areaStyle}`}>
              {hito.area_responsable}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
          {hito.dias_planificados != null && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {hito.dias_planificados} {hito.dias_planificados === 1 ? 'dia' : 'dias'}
            </span>
          )}
          {hito.fecha_inicio && (
            <span>Inicio: <span className="font-medium text-slate-700">{hito.fecha_inicio}</span></span>
          )}
          {hito.fecha_fin && (
            <span>Fin: <span className="font-medium text-slate-700">{hito.fecha_fin}</span></span>
          )}
        </div>
      </div>
    </div>
  );
};

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

const columnHelper = createColumnHelper<ContratoMenorRow>();

const DashboardContratosMenores: React.FC = () => {
  const { filters, applyFilters, clearFilters } = useFilters({ anio: '2026' });
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  // Build API filter params from UI filter state
  // Backend expects ue_id as a number (not a ddnntt string)
  const apiFilters = useMemo<FilterParams>(() => ({
    anio:       filters.anio    ? parseInt(filters.anio as string, 10)   : undefined,
    ue_id:      filters.ue_id   ? parseInt(filters.ue_id as string, 10)  : undefined,
    meta_id:    filters.meta_id ? parseInt(filters.meta_id as string, 10): undefined,
    estado:     (filters.estado as string)      || undefined,
    tipo_objeto:(filters.tipo_objeto as string) || undefined,
    mes:        filters.mes     ? parseInt(filters.mes as string, 10)    : undefined,
  }), [filters]);

  const anio = apiFilters.anio ?? 2026;

  // ----- KPIs -----
  const {
    data: kpis,
    isLoading: kpisLoading,
    isError: kpisError,
    refetch: refetchKpis,
  } = useQuery({
    queryKey: ['contratos-menores', 'kpis', apiFilters],
    queryFn:  () => getKpis(apiFilters),
    retry: 2,
  });

  // ----- Graficos — flat list from backend -----
  const {
    data: graficosRaw,
    isLoading: graficosLoading,
    isError: graficosError,
    refetch: refetchGraficos,
  } = useQuery({
    queryKey: ['contratos-menores', 'graficos', apiFilters],
    queryFn:  () => getGraficos(apiFilters),
    retry: 2,
  });

  // Split flat graficos list into the two series the UI needs
  const graficos = useMemo(() => {
    const items: GraficoContratoMenorItem[] = graficosRaw ?? [];
    const porEstado    = items.filter((i) => ESTADOS_VALIDOS.has(i.label));
    const porTipoObjeto = items.filter((i) => TIPOS_OBJETO_VALIDOS.has(i.label));
    return { porEstado, porTipoObjeto };
  }, [graficosRaw]);

  // ----- Table -----
  const {
    data: tablaData,
    isLoading: tablaLoading,
    isError: tablaError,
    refetch: refetchTabla,
  } = useQuery({
    queryKey: ['contratos-menores', 'tabla', apiFilters],
    queryFn:  () => getTabla(apiFilters, 1, 20),
    retry: 2,
  });

  // ----- Fraccionamiento alerts -----
  const {
    data: fraccionamiento,
    isLoading: fracLoading,
  } = useQuery({
    queryKey: ['contratos-menores', 'fraccionamiento', anio],
    queryFn:  () => getFraccionamiento(anio),
    retry: 1,
  });

  // ----- Contract detail (modal) -----
  const {
    data: detalle,
    isLoading: detalleLoading,
  } = useQuery({
    queryKey: ['contratos-menores', 'detalle', selectedRowId],
    queryFn:  () => getDetalle(selectedRowId!),
    enabled:  selectedRowId !== null,
    retry: 1,
  });

  // Backend response uses `rows` (not `items`)
  const tableRows: ContratoMenorRow[] = tablaData?.rows ?? [];
  const hasFraccionamiento = (fraccionamiento?.length ?? 0) > 0;

  // Progress calculation — uses detalle.procesos (not detalle.hitos)
  const hitoProgress = useMemo(() => {
    if (!detalle) return { completed: 0, total: 0 };
    const total     = detalle.procesos.length;
    const completed = detalle.procesos.filter((p) => p.estado === 'COMPLETADO').length;
    return { completed, total };
  }, [detalle]);

  // ----- Column definitions — all field names are snake_case -----
  const columns = useMemo<ColumnDef<ContratoMenorRow, unknown>[]>(
    () => [
      columnHelper.accessor('codigo', {
        header: 'Codigo',
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-blue-600">
            {(info.getValue() as string | null) ?? '—'}
          </span>
        ),
      }),
      columnHelper.accessor('descripcion', {
        header: 'Descripcion',
        cell: (info) => (
          <span
            className="block max-w-[220px] truncate text-slate-700 text-xs"
            title={(info.getValue() as string | null) ?? ''}
          >
            {(info.getValue() as string | null) ?? '—'}
          </span>
        ),
      }),
      // ue_sigla replaces the old camelCase `ue` field
      columnHelper.accessor('ue_sigla', {
        header: 'DDNNTT',
        cell: (info) => {
          const sigla = (info.getValue() as string | null) ?? '';
          // Extract the DDNNTT abbreviation from strings like "INEI-LIMA" → "INEI"
          const ddnntt = sigla.split('-')[0] || sigla;
          const style = AREA_COLORS[ddnntt] ?? 'bg-slate-100 text-slate-600';
          return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style}`}>
              {sigla || '—'}
            </span>
          );
        },
      }),
      // tipo_objeto replaces the old camelCase `tipoObjeto` field
      columnHelper.accessor('tipo_objeto', {
        header: 'Tipo',
        cell: (info) => (
          <span className="text-xs text-slate-600">
            {(info.getValue() as string | null) ?? '—'}
          </span>
        ),
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: (info) => {
          const estado = info.getValue() as EstadoContrato | null;
          if (!estado) return <span className="text-xs text-slate-400">—</span>;
          const badge = ESTADO_BADGE[estado] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };
          const label = ESTADO_LABEL[estado] ?? estado;
          return (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
              {label}
            </span>
          );
        },
      }),
      // monto_estimado replaces the old `monto` field
      columnHelper.accessor('monto_estimado', {
        header: 'Monto Estim. (S/)',
        cell: (info) => {
          const v = info.getValue() as number | null;
          return (
            <span className="text-xs font-semibold text-slate-800 tabular-nums">
              {v != null && v > 0 ? formatMonto(v, false) : '—'}
            </span>
          );
        },
      }),
      // proveedor_razon_social replaces the old `proveedor` field
      columnHelper.accessor('proveedor_razon_social', {
        header: 'Proveedor',
        cell: (info) => {
          const v = (info.getValue() as string | null) ?? '';
          return (
            <span
              className="block max-w-[160px] truncate text-xs text-slate-600"
              title={v}
            >
              {v || '—'}
            </span>
          );
        },
      }),
      // n_orden replaces the old `fechaOrden` field (backend has no fechaOrden)
      columnHelper.accessor('n_orden', {
        header: 'N. Orden',
        cell: (info) => (
          <span className="text-xs text-slate-600 tabular-nums">
            {(info.getValue() as string | null) ?? '—'}
          </span>
        ),
      }),
      // n_cotizaciones replaces the old `diasTranscurridos` field
      columnHelper.accessor('n_cotizaciones', {
        header: 'Cotizaciones',
        cell: (info) => {
          const n = info.getValue() as number;
          // Highlight in red if below the required minimum of 3
          const color = n < 3 ? 'text-red-600' : 'text-slate-600';
          return (
            <span className={`text-xs font-semibold tabular-nums ${color}`}>
              {n}
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
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
            title="Ver detalle"
          >
            <Eye size={15} />
          </button>
        ),
      }),
    ] as ColumnDef<ContratoMenorRow, unknown>[],
    []
  );

  const selectedRow = tableRows.find((r) => r.id === selectedRowId);

  // Resolve estado for modal badge — handles nullable values from backend
  const modalEstado: EstadoContrato | undefined =
    (detalle?.estado ?? selectedRow?.estado) as EstadoContrato | undefined;

  return (
    <div className="space-y-6">
      {/* Fraccionamiento alert banner */}
      {!fracLoading && hasFraccionamiento && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-800">Alerta de Fraccionamiento Detectada</p>
            <p className="text-xs text-red-700 mt-0.5">
              Se detectaron {fraccionamiento!.length} alertas de posible fraccionamiento.{' '}
              {fraccionamiento![0]?.ue_sigla && (
                <>
                  {fraccionamiento![0].ue_sigla} registra contratos acumulados de{' '}
                  {formatMonto(fraccionamiento![0].monto_acumulado)}, superando el umbral de 8 UIT
                  (S/ 44,000).
                </>
              )}{' '}
              Revise el detalle antes de emitir nuevas ordenes.
            </p>
          </div>
          <button className="flex-shrink-0 text-xs font-semibold text-red-700 border border-red-300 bg-white hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Ver Alertas
          </button>
        </div>
      )}

      {/* Filter bar */}
      <FilterBar fields={FILTER_FIELDS} onApply={applyFilters} onClear={clearFilters} />

      {/* KPI cards
          Backend fields: total, monto_total, completados, en_proceso,
                          porcentaje_avance, alerta_fraccionamiento
          (No montoEjecutado or ejecucionPorcentaje in the backend schema) */}
      {kpisError ? (
        <ErrorCard message="No se pudo cargar los KPIs de contratos menores." onRetry={refetchKpis} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpisLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-8 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
            ))
          ) : (
            <>
              <KpiCard
                label="Total Contratos"
                value={kpis?.total ?? 0}
                icon={FileText}
                iconBgColor="bg-blue-100 text-blue-600"
              />
              <KpiCard
                label="Completados"
                value={kpis?.completados ?? 0}
                icon={CheckCircle2}
                iconBgColor="bg-green-100 text-green-600"
              />
              <KpiCard
                label="En Proceso"
                value={kpis?.en_proceso ?? 0}
                icon={Activity}
                iconBgColor="bg-blue-100 text-blue-600"
              />
              <KpiCard
                label="% Avance"
                value={kpis ? formatPercent(kpis.porcentaje_avance) : '—'}
                icon={TrendingUp}
                iconBgColor="bg-purple-100 text-purple-600"
              />
              <KpiCard
                label="Monto Total"
                value={kpis ? formatMonto(kpis.monto_total) : '—'}
                icon={Wallet}
                iconBgColor="bg-amber-100 text-amber-600"
              />
              <KpiCard
                label="Alertas Fracc."
                value={kpis?.alerta_fraccionamiento ?? 0}
                icon={AlertTriangle}
                iconBgColor={
                  (kpis?.alerta_fraccionamiento ?? 0) > 0
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-500'
                }
              />
            </>
          )}
        </div>
      )}

      {/* Charts row
          Backend GET /graficos returns a flat list of GraficoContratoMenorItem.
          We split into por-estado and por-tipo_objeto series. */}
      {graficosError ? (
        <ErrorCard message="No se pudo cargar los graficos de contratos menores." onRetry={refetchGraficos} />
      ) : graficosLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PieChartEstado
            title="Estado de Contratos"
            data={graficos.porEstado.map((item) => ({
              name: ESTADO_LABEL[item.label as EstadoContrato] ?? item.label,
              value: item.cantidad,
              color: ESTADO_COLORS[item.label] ?? '#3b82f6',
            }))}
            centerTotal={kpis?.total ?? 0}
            centerLabel="Total"
          />
          <BarChartHorizontal
            title="Monto por Tipo de Objeto"
            data={graficos.porTipoObjeto.map((item) => ({
              name: item.label,
              value: item.monto,
              color: TIPO_OBJETO_COLORS[item.label] ?? '#3b82f6',
            }))}
            valueFormatter={formatMonto}
            height={260}
          />
        </div>
      )}

      {/* Data table — uses tablaData.rows (backend field), not .items */}
      {tablaError ? (
        <ErrorCard message="No se pudo cargar la tabla de contratos menores." onRetry={refetchTabla} />
      ) : (
        <DataTable
          title="Listado de Contratos Menores"
          data={tableRows}
          columns={columns}
          onRowClick={(row) => setSelectedRowId(row.id)}
          pageSize={10}
          isLoading={tablaLoading}
        />
      )}

      {/* Contract detail modal
          Backend GET /{id} returns ContratoMenorResponse — flat object.
          Timeline steps are in `procesos` (not `hitos`).
          Uses snake_case fields throughout. */}
      {selectedRowId !== null && (
        <Modal
          isOpen={selectedRowId !== null}
          onClose={() => setSelectedRowId(null)}
          title={
            detalle?.descripcion ??
            selectedRow?.descripcion ??
            'Detalle de Contrato Menor'
          }
          codeBadge={detalle?.codigo ?? selectedRow?.codigo ?? undefined}
          statusBadge={modalEstado ? MODAL_STATUS_BADGE[modalEstado] : undefined}
          maxWidth="max-w-2xl"
          footer={
            <button
              onClick={() => setSelectedRowId(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          }
        >
          {detalleLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-2 w-16 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : detalle ? (
            <>
              {/* Contract metadata — snake_case field names */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                {[
                  { label: 'DDNNTT',       value: detalle.ue_sigla ?? '—' },
                  { label: 'Tipo Objeto',  value: detalle.tipo_objeto ?? '—' },
                  { label: 'Categoria',    value: detalle.categoria ?? '—' },
                  { label: 'Meta',         value: detalle.meta_codigo ?? '—' },
                  {
                    label: 'Monto Estimado',
                    value: detalle.monto_estimado != null && detalle.monto_estimado > 0
                      ? formatMonto(detalle.monto_estimado, false)
                      : '—',
                  },
                  {
                    label: 'Monto Ejecutado',
                    value: detalle.monto_ejecutado != null && detalle.monto_ejecutado > 0
                      ? formatMonto(detalle.monto_ejecutado, false)
                      : '—',
                  },
                  { label: 'Proveedor',    value: detalle.proveedor_razon_social ?? '—' },
                  { label: 'N. Orden',     value: detalle.n_orden ?? '—' },
                  { label: 'Cotizaciones', value: String(detalle.n_cotizaciones) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Hito progress bar — uses detalle.procesos */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Progreso del Proceso
                  </p>
                  <span className="text-xs font-semibold text-slate-500">
                    {hitoProgress.completed} / {hitoProgress.total} hitos completados
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${hitoProgress.total > 0
                        ? (hitoProgress.completed / hitoProgress.total) * 100
                        : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stepper timeline — iterates detalle.procesos (not detalle.hitos) */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4">
                  Linea de Tiempo — {detalle.procesos.length} Hitos
                </p>
                {detalle.procesos.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Sin hitos registrados para este contrato.
                  </p>
                ) : (
                  <div className="pl-1">
                    {detalle.procesos.map((proceso, idx) => (
                      <HitoStep
                        key={proceso.id}
                        hito={proceso}
                        isLast={idx === detalle.procesos.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">
              No se pudo cargar el detalle.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default DashboardContratosMenores;
