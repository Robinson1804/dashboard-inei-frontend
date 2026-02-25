import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import {
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import KpiCard from '@/components/ui/KpiCard';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import SemaforoChip from '@/components/ui/SemaforoChip';
import LineChartDual from '@/components/charts/LineChartDual';
import PieChartEstado from '@/components/charts/PieChartEstado';

import {
  getKpis,
  getProgramadoVsEjecutado,
  getTabla,
} from '@/api/actividadesOperativas';
import { getUnidadesEjecutoras } from '@/api/datosMaestros';
import { formatMonto, formatPercent } from '@/utils/formatters';
import { useFilters } from '@/hooks/useFilters';

import type { FilterField, FilterParams } from '@/types';
import type { AOTablaRow } from '@/types/actividadOperativa';

// ---------------------------------------------------------------------------
// Filter fields
// ---------------------------------------------------------------------------

const BASE_FILTER_FIELDS: FilterField[] = [
  {
    key: 'anio',
    label: 'Ano Fiscal',
    type: 'select',
    placeholder: 'Todos los anos',
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
// Column definitions — field names match AOTablaRow (backend snake_case)
// ---------------------------------------------------------------------------

const colHelper = createColumnHelper<AOTablaRow>();

const buildColumns = (): ColumnDef<AOTablaRow, unknown>[] => [
  colHelper.accessor('codigo_ceplan', {
    header: 'Codigo CEPLAN',
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-primary">
        {info.getValue() as string}
      </span>
    ),
  }) as ColumnDef<AOTablaRow, unknown>,

  colHelper.accessor('nombre', {
    header: 'Nombre AO',
    cell: (info) => (
      <span className="max-w-xs block truncate" title={info.getValue() as string}>
        {info.getValue() as string}
      </span>
    ),
  }) as ColumnDef<AOTablaRow, unknown>,

  colHelper.accessor('ue_sigla', {
    header: 'UE',
    cell: (info) => (
      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
        {info.getValue() as string}
      </span>
    ),
  }) as ColumnDef<AOTablaRow, unknown>,

  colHelper.accessor('programado_total', {
    header: 'Programado (S/)',
    cell: (info) => (
      <span className="text-right block text-slate-700 text-xs">
        {formatMonto(info.getValue() as number, false)}
      </span>
    ),
  }) as ColumnDef<AOTablaRow, unknown>,

  colHelper.accessor('ejecutado_total', {
    header: 'Ejecutado (S/)',
    cell: (info) => (
      <span className="text-right block text-slate-700 text-xs">
        {formatMonto(info.getValue() as number, false)}
      </span>
    ),
  }) as ColumnDef<AOTablaRow, unknown>,

  colHelper.accessor('ejecucion_porcentaje', {
    header: '% Ejecucion',
    cell: (info) => (
      <SemaforoChip value={info.getValue() as number} showLabel={false} />
    ),
  }) as ColumnDef<AOTablaRow, unknown>,

  colHelper.accessor('semaforo', {
    header: 'Estado',
    cell: (info) => {
      const s = info.getValue() as string;
      const colorMap: Record<string, string> = {
        VERDE:    'bg-green-100 text-green-700',
        AMARILLO: 'bg-amber-100 text-amber-700',
        ROJO:     'bg-red-100 text-red-700',
      };
      const labelMap: Record<string, string> = {
        VERDE:    'Verde',
        AMARILLO: 'Amarillo',
        ROJO:     'Rojo',
      };
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${colorMap[s] ?? ''}`}>
          {labelMap[s] ?? s}
        </span>
      );
    },
  }) as ColumnDef<AOTablaRow, unknown>,
];

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
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive the deviation (brecha) for a table row.
 * The backend does not return a `desviacion` field, so we compute it client-side
 * as ejecutado_total - programado_total.
 */
const calcDesviacion = (row: AOTablaRow): number =>
  row.ejecutado_total - row.programado_total;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DashboardActividadesOperativas = () => {
  const { filters, applyFilters, clearFilters } = useFilters({ anio: '2026' });

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

  // Build API-compatible filter params.
  // The AO endpoints only accept `anio` and `ue_id` query params.
  const apiFilters = useMemo<FilterParams>(() => ({
    anio:  filters.anio  ? parseInt(filters.anio  as string, 10) : undefined,
    ue_id: filters.ue_id ? parseInt(filters.ue_id as string, 10) : undefined,
    mes:   filters.mes   ? parseInt(filters.mes   as string, 10) : undefined,
  }), [filters]);

  // -------------------------------------------------------------------
  // KPIs query
  // -------------------------------------------------------------------

  const {
    data: kpis,
    isLoading: kpisLoading,
    isError: kpisError,
    refetch: refetchKpis,
  } = useQuery({
    queryKey: ['ao', 'kpis', apiFilters],
    queryFn: () => getKpis(apiFilters),
    retry: 2,
  });

  // -------------------------------------------------------------------
  // Evolution chart query — backend returns list[GraficoAOEvolucionItem]
  // -------------------------------------------------------------------

  const {
    data: evolucionData,
    isLoading: chartLoading,
    isError: chartError,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ['ao', 'programado-vs-ejecutado', apiFilters],
    queryFn: () => getProgramadoVsEjecutado(apiFilters),
    retry: 2,
  });

  // -------------------------------------------------------------------
  // Table query — backend returns { rows, total, page, page_size }
  // -------------------------------------------------------------------

  const {
    data: tablaData,
    isLoading: tablaLoading,
    isError: tablaError,
    refetch: refetchTabla,
  } = useQuery({
    queryKey: ['ao', 'tabla', apiFilters],
    queryFn: () => getTabla(apiFilters, 1, 20),
    retry: 2,
  });

  // `rows` is the correct field name from AOTablaResponse (not `items`)
  const tableRows: AOTablaRow[] = tablaData?.rows ?? [];
  const mainColumns = useMemo(() => buildColumns(), []);

  // -------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------

  // Top 5 AOs with the greatest negative deviation (most under-executed)
  const top5Deviation = useMemo(() => {
    return [...tableRows]
      .sort((a, b) => calcDesviacion(a) - calcDesviacion(b))
      .slice(0, 5);
  }, [tableRows]);

  // Monthly chart — evolucionData is already the flat array the chart needs
  const mensualData = useMemo(
    () => (evolucionData ?? []) as unknown as Record<string, unknown>[],
    [evolucionData]
  );

  // Pie chart built from KPI semaforo counts (verdes/amarillos/rojos)
  const pieData = useMemo(() => {
    if (!kpis) return [];
    return [
      { name: 'Verde (>=90%)',    value: kpis.verdes,    color: '#10b981' },
      { name: 'Amarillo (70-89%)', value: kpis.amarillos, color: '#f59e0b' },
      { name: 'Rojo (<70%)',      value: kpis.rojos,     color: '#ef4444' },
    ];
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <FilterBar fields={filterFields} onApply={applyFilters} onClear={clearFilters} />

      {/* KPI cards */}
      {kpisError ? (
        <ErrorCard
          message="No se pudo cargar los KPIs de actividades operativas."
          onRetry={refetchKpis}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          {kpisLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-8 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
            ))
          ) : (
            <>
              {/* total_aos */}
              <KpiCard
                label="AOs Activas"
                value={kpis?.total_aos ?? 0}
                icon={ClipboardList}
                iconBgColor="bg-blue-100 text-blue-600"
              />
              {/* ejecucion global — computed as weighted average via porcentaje_verde */}
              <KpiCard
                label="% Verde (>=90%)"
                value={kpis ? formatPercent(kpis.porcentaje_verde) : '—'}
                icon={TrendingUp}
                iconBgColor="bg-indigo-100 text-indigo-600"
                highlight
              />
              {/* verdes */}
              <KpiCard
                label="Verde (>=90%)"
                value={kpis?.verdes ?? 0}
                icon={CheckCircle2}
                iconBgColor="bg-green-100 text-green-600"
                delta={kpis ? `${formatPercent(kpis.porcentaje_verde)}` : undefined}
                deltaColor="green"
              />
              {/* amarillos */}
              <KpiCard
                label="Amarillo (70-89%)"
                value={kpis?.amarillos ?? 0}
                icon={Clock}
                iconBgColor="bg-amber-100 text-amber-600"
                delta={kpis ? `${formatPercent(kpis.porcentaje_amarillo)}` : undefined}
                deltaColor="amber"
              />
              {/* rojos */}
              <KpiCard
                label="Rojo (<70%)"
                value={kpis?.rojos ?? 0}
                icon={AlertTriangle}
                iconBgColor="bg-red-100 text-red-600"
                delta={kpis ? `${formatPercent(kpis.porcentaje_rojo)}` : undefined}
                deltaColor="red"
              />
            </>
          )}
        </div>
      )}

      {/* Charts row 1 — line chart (evolution) */}
      {chartError ? (
        <ErrorCard
          message="No se pudo cargar los graficos de programacion vs ejecucion."
          onRetry={refetchChart}
        />
      ) : chartLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-64" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <LineChartDual
            title="Programacion vs Ejecucion Mensual (AOs)"
            data={mensualData}
            xKey="mes"
            lines={[
              { dataKey: 'programado', name: 'Programado', color: '#3b82f6', dashed: true },
              { dataKey: 'ejecutado',  name: 'Ejecutado',  color: '#10b981', dashed: false },
            ]}
            height={300}
            yFormatter={formatMonto}
          />
        </div>
      )}

      {/* Charts row 2 — pie + top-5 deviation table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart by semaforo */}
        {kpisLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-64" />
        ) : (
          <PieChartEstado
            title="Distribucion de AOs por Semaforo"
            data={pieData}
            centerTotal={kpis?.total_aos ?? 0}
            centerLabel="Total AOs"
            height={280}
          />
        )}

        {/* Top 5 deviation table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">
              Top 5 AOs con Mayor Brecha
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Actividades con mayor diferencia entre lo programado y lo ejecutado
            </p>
          </div>
          <div className="flex-1 overflow-x-auto">
            {tablaLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    {['Codigo', 'Nombre AO', 'UE', 'Programado', 'Ejecutado', '% Ejec.', 'Brecha'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top5Deviation.map((ao) => {
                    const desviacion = calcDesviacion(ao);
                    return (
                      <tr
                        key={ao.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-[11px] font-semibold text-primary">
                            {ao.codigo_ceplan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="block max-w-[150px] truncate text-xs text-slate-700"
                            title={ao.nombre}
                          >
                            {ao.nombre}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                            {ao.ue_sigla}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                          {formatMonto(ao.programado_total, false)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                          {formatMonto(ao.ejecutado_total, false)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <SemaforoChip value={ao.ejecucion_porcentaje} showLabel={false} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs font-bold ${desviacion < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {desviacion < 0 ? '' : '+'}{formatMonto(desviacion)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {top5Deviation.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-sm text-slate-400"
                      >
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Full data table */}
      {tablaError ? (
        <ErrorCard
          message="No se pudo cargar la tabla de actividades operativas."
          onRetry={refetchTabla}
        />
      ) : (
        <DataTable<AOTablaRow>
          title="Detalle de Actividades Operativas"
          data={tableRows}
          columns={mainColumns}
          pageSize={10}
          isLoading={tablaLoading}
        />
      )}
    </div>
  );
};

export default DashboardActividadesOperativas;
