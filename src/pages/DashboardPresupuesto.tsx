import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { Wallet, FileCheck, HandCoins, CircleDollarSign, TrendingUp, RefreshCw, Building2, Target } from 'lucide-react';

import KpiCard from '@/components/ui/KpiCard';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import SemaforoChip from '@/components/ui/SemaforoChip';
import BarChartGrouped from '@/components/charts/BarChartGrouped';
import BarChartHorizontal from '@/components/charts/BarChartHorizontal';
import LineChartDual from '@/components/charts/LineChartDual';

import {
  getKpis,
  getGraficoPimCertificado,
  getGraficoEjecucion,
  getGraficoDevengadoMensual,
  getTabla,
} from '@/api/presupuesto';
import { getUnidadesEjecutoras, getMetasPresupuestales } from '@/api/datosMaestros';
import { formatMonto, formatPercent } from '@/utils/formatters';
import { useFilters } from '@/hooks/useFilters';

import type { FilterField, FilterParams } from '@/types';
import type { TablaPresupuestoRow } from '@/types/presupuesto';

// ---------------------------------------------------------------------------
// Column definitions — only fields present in the backend TablaPresupuestoRow
// (anio, compromiso, and girado are NOT returned by the backend)
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<TablaPresupuestoRow>();

const COLUMNS: ColumnDef<TablaPresupuestoRow, any>[] = [
  columnHelper.accessor('ue', {
    header: 'UE',
    cell: (info) => (
      <span className="text-xs font-medium text-slate-800 whitespace-normal max-w-[140px] block leading-snug">
        {info.getValue() as string}
      </span>
    ),
  }),
  columnHelper.accessor('meta', {
    header: 'Meta',
    cell: (info) => (
      <span className="inline-block bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        {info.getValue() as string}
      </span>
    ),
  }),
  columnHelper.accessor('clasificador', {
    header: 'Clasificador',
    cell: (info) => (
      <span className="font-mono text-xs text-slate-600">{info.getValue() as string}</span>
    ),
  }),
  columnHelper.accessor('descripcion', {
    header: 'Descripcion',
    cell: (info) => (
      <span
        className="block max-w-[220px] truncate text-slate-700 text-xs"
        title={info.getValue() as string}
      >
        {info.getValue() as string}
      </span>
    ),
  }),
  columnHelper.accessor('pim', {
    header: 'PIM',
    cell: (info) => (
      <span className="font-semibold text-slate-800 text-xs">
        {formatMonto(info.getValue() as number, false)}
      </span>
    ),
  }),
  columnHelper.accessor('certificado', {
    header: 'Certificado',
    cell: (info) => (
      <span className="text-xs text-slate-700">
        {formatMonto(info.getValue() as number, false)}
      </span>
    ),
  }),
  columnHelper.accessor('devengado', {
    header: 'Devengado',
    cell: (info) => (
      <span className="text-xs font-semibold text-slate-800">
        {formatMonto(info.getValue() as number, false)}
      </span>
    ),
  }),
  columnHelper.accessor('saldo', {
    header: 'Saldo',
    cell: (info) => (
      <span className="text-xs text-amber-700 font-medium">
        {formatMonto(info.getValue() as number, false)}
      </span>
    ),
  }),
  columnHelper.accessor('ejecucion', {
    header: '% Ejec.',
    cell: (info) => <SemaforoChip value={info.getValue() as number} />,
  }),
];

// ---------------------------------------------------------------------------
// Static filter fields (enhanced with API data at runtime)
// ---------------------------------------------------------------------------

const BASE_FILTER_FIELDS: FilterField[] = [
  {
    key: 'anio',
    label: 'Ano',
    type: 'select',
    placeholder: 'Todos los anos',
    options: [
      { value: '2024', label: '2024' },
      { value: '2025', label: '2025' },
      { value: '2026', label: '2026' },
    ],
  },
  {
    key: 'ue',
    label: 'Unidad Ejecutora',
    type: 'select',
    placeholder: 'Todas las UEs',
    options: [],
  },
  {
    key: 'meta',
    label: 'Meta Presupuestal',
    type: 'select',
    placeholder: 'Todas las metas',
    options: [],
  },
  {
    key: 'fuenteFinanciamiento',
    label: 'Fuente de Financiamiento',
    type: 'select',
    placeholder: 'Todas las fuentes',
    options: [
      { value: 'RO', label: 'Recursos Ordinarios (RO)' },
      { value: 'RDR', label: 'Recursos Directamente Recaudados (RDR)' },
      { value: 'DON', label: 'Donaciones y Transferencias' },
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
// Skeleton loading components
// ---------------------------------------------------------------------------

const KpiSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-24 bg-slate-200 rounded" />
      <div className="w-10 h-10 bg-slate-200 rounded-lg" />
    </div>
    <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
    <div className="h-3 w-20 bg-slate-100 rounded" />
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
    <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
    <div className="h-64 bg-slate-100 rounded-lg" />
  </div>
);

// ---------------------------------------------------------------------------
// Error state component
// ---------------------------------------------------------------------------

interface ErrorCardProps {
  message: string;
  onRetry: () => void;
}

const ErrorCard = ({ message, onRetry }: ErrorCardProps) => (
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

const DashboardPresupuesto = () => {
  const { filters, applyFilters, clearFilters } = useFilters({ anio: '2026' });

  const apiFilters = useMemo<FilterParams>(() => ({
    anio: filters.anio ? parseInt(filters.anio as string, 10) : undefined,
    ue_id: filters.ue ? parseInt(filters.ue as string, 10) : undefined,
    meta_id: filters.meta ? parseInt(filters.meta as string, 10) : undefined,
    fuente: (filters.fuenteFinanciamiento as string) || undefined,
    mes: filters.mes ? parseInt(filters.mes as string, 10) : undefined,
  }), [filters]);

  // Fetch KPIs
  const {
    data: kpis,
    isLoading: kpisLoading,
    isError: kpisError,
    refetch: refetchKpis,
  } = useQuery({
    queryKey: ['presupuesto', 'kpis', apiFilters],
    queryFn: () => getKpis(apiFilters),
    retry: 2,
  });

  // Fetch PIM vs Certificado chart
  const {
    data: graficoPimCert,
    isLoading: graficoPimLoading,
    isError: graficoPimError,
    refetch: refetchGraficoPim,
  } = useQuery({
    queryKey: ['presupuesto', 'grafico-pim-cert', apiFilters],
    queryFn: () => getGraficoPimCertificado(apiFilters),
    retry: 2,
  });

  // Fetch Ejecucion por DDNNTT chart
  const {
    data: graficoEjecucion,
    isLoading: graficoEjecLoading,
    isError: graficoEjecError,
    refetch: refetchGraficoEjec,
  } = useQuery({
    queryKey: ['presupuesto', 'grafico-ejecucion', apiFilters],
    queryFn: () => getGraficoEjecucion(apiFilters),
    retry: 2,
  });

  // Fetch monthly devengado chart
  const {
    data: graficoMensual,
    isLoading: graficoMensualLoading,
    isError: graficoMensualError,
    refetch: refetchGraficoMensual,
  } = useQuery({
    queryKey: ['presupuesto', 'grafico-mensual', apiFilters],
    queryFn: () => getGraficoDevengadoMensual(apiFilters),
    retry: 2,
  });

  // Fetch tabla
  const {
    data: tablaData,
    isLoading: tablaLoading,
    isError: tablaError,
    refetch: refetchTabla,
  } = useQuery({
    queryKey: ['presupuesto', 'tabla', apiFilters],
    queryFn: () => getTabla(apiFilters, 1, 20),
    retry: 2,
  });

  // Fetch datos maestros for filter dropdowns
  const { data: unidades } = useQuery({
    queryKey: ['maestros', 'unidades-ejecutoras'],
    queryFn: getUnidadesEjecutoras,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const { data: metas } = useQuery({
    queryKey: ['maestros', 'metas-presupuestales'],
    queryFn: () => getMetasPresupuestales(),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Build filter fields with API data
  const filterFields: FilterField[] = useMemo(() => {
    return BASE_FILTER_FIELDS.map((field) => {
      if (field.key === 'ue' && unidades) {
        return {
          ...field,
          options: unidades.map((ue) => ({
            value: String(ue.id),
            label: `${ue.codigo} - ${ue.sigla}`,
          })),
        };
      }
      if (field.key === 'meta' && metas) {
        return {
          ...field,
          options: metas.map((m) => ({
            value: String(m.id),
            label: `${m.codigo} - ${m.descripcion}`,
          })),
        };
      }
      return field;
    });
  }, [unidades, metas]);

  // ---------------------------------------------------------------------------
  // KPI display values — mapped from snake_case backend fields
  // ---------------------------------------------------------------------------
  const kpiPim = kpis ? formatMonto(kpis.pim_total) : '—';
  const kpiCertificado = kpis ? formatMonto(kpis.certificado_total) : '—';
  const kpiComprometido = kpis ? formatMonto(kpis.comprometido_total) : '—';
  const kpiDevengado = kpis ? formatMonto(kpis.devengado_total) : '—';
  const kpiEjecucion = kpis ? formatPercent(kpis.ejecucion_porcentaje) : '—';
  const kpiTotalUes = kpis ? String(kpis.total_ues) : '—';
  const kpiTotalMetas = kpis ? String(kpis.total_metas) : '—';

  // ---------------------------------------------------------------------------
  // Chart data — `nombre` is the backend X-axis label (not `name`)
  // ---------------------------------------------------------------------------

  // PIM vs Certificado grouped bar chart
  const pimCertData = useMemo(() => {
    if (!graficoPimCert) return [];
    return graficoPimCert.map((item) => ({
      // Recharts needs a stable key for the X axis; use `nombre` directly
      nombre: item.nombre,
      pim: item.pim,
      certificado: item.certificado,
      devengado: item.devengado,
    }));
  }, [graficoPimCert]);

  // Execution percentage horizontal bar chart
  // Backend returns ejecucion_porcentaje (0-100); BarChartHorizontal expects
  // { name, value } shape — map accordingly.
  const ejecucionData = useMemo(() => {
    if (!graficoEjecucion) return [];
    return graficoEjecucion.map((item) => ({
      name: item.nombre,
      value: item.ejecucion_porcentaje,
    }));
  }, [graficoEjecucion]);

  // Monthly line chart — backend returns { mes, programado, ejecutado }
  const mensualData = useMemo(() => {
    if (!graficoMensual) return [];
    return graficoMensual;
  }, [graficoMensual]);

  // Table rows — backend response uses `.rows`, NOT `.items`
  const tableRows: TablaPresupuestoRow[] = tablaData?.rows ?? [];

  return (
    <div className="space-y-6">
      {/* 1. Filter bar */}
      <FilterBar
        fields={filterFields}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* 2. KPI cards */}
      {kpisError ? (
        <ErrorCard
          message="No se pudo cargar los KPIs presupuestales."
          onRetry={refetchKpis}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
          {kpisLoading ? (
            Array.from({ length: 7 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                label="Unidades Ejecutoras"
                value={kpiTotalUes}
                icon={Building2}
                iconBgColor="bg-slate-100 text-slate-600"
              />
              <KpiCard
                label="Metas Presupuestales"
                value={kpiTotalMetas}
                icon={Target}
                iconBgColor="bg-violet-100 text-violet-600"
              />
              <KpiCard
                label="PIM Total"
                value={kpiPim}
                icon={Wallet}
                iconBgColor="bg-blue-100 text-blue-600"
              />
              <KpiCard
                label="Certificado (CCP)"
                value={kpiCertificado}
                icon={FileCheck}
                iconBgColor="bg-amber-100 text-amber-600"
              />
              <KpiCard
                label="Comprometido"
                value={kpiComprometido}
                icon={HandCoins}
                iconBgColor="bg-orange-100 text-orange-600"
              />
              <KpiCard
                label="Devengado"
                value={kpiDevengado}
                icon={CircleDollarSign}
                iconBgColor="bg-emerald-100 text-emerald-600"
              />
              <KpiCard
                label="% Ejecucion"
                value={kpiEjecucion}
                icon={TrendingUp}
                iconBgColor="bg-purple-100 text-purple-600"
                delta="Meta: 85%"
                deltaColor="blue"
                highlight
              />
            </>
          )}
        </div>
      )}

      {/* 3. Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {graficoPimLoading ? (
          <ChartSkeleton />
        ) : graficoPimError ? (
          <ErrorCard message="Error al cargar grafico PIM vs Certificado." onRetry={refetchGraficoPim} />
        ) : (
          <BarChartGrouped
            title="PIM vs Certificado por UE"
            data={pimCertData}
            xKey="nombre"
            bars={[
              { dataKey: 'pim', name: 'PIM', color: '#3b82f6' },
              { dataKey: 'certificado', name: 'Certificado', color: '#10b981' },
              { dataKey: 'devengado', name: 'Devengado', color: '#f59e0b' },
            ]}
            height={300}
          />
        )}

        {graficoEjecLoading ? (
          <ChartSkeleton />
        ) : graficoEjecError ? (
          <ErrorCard message="Error al cargar grafico de ejecucion." onRetry={refetchGraficoEjec} />
        ) : (
          <BarChartHorizontal
            title="% Ejecucion por UE"
            data={ejecucionData}
            valueFormatter={(v: number) => `${v.toFixed(1)}%`}
            referenceLine={{ value: 90, label: 'Meta 90%' }}
            height={300}
          />
        )}
      </div>

      {/* 4. Monthly evolution chart */}
      {/* Backend returns { mes, programado, ejecutado } — keys used as dataKey below */}
      {graficoMensualLoading ? (
        <ChartSkeleton />
      ) : graficoMensualError ? (
        <ErrorCard message="Error al cargar evolucion mensual." onRetry={refetchGraficoMensual} />
      ) : (
        <LineChartDual
          title="Evolucion Mensual: Programado vs Ejecutado 2026"
          data={(mensualData as unknown) as Record<string, unknown>[]}
          xKey="mes"
          lines={[
            { dataKey: 'programado', name: 'Programado', color: '#3b82f6', dashed: true },
            { dataKey: 'ejecutado', name: 'Ejecutado', color: '#10b981' },
          ]}
          height={320}
        />
      )}

      {/* 5. Detail table */}
      {tablaError ? (
        <ErrorCard message="Error al cargar la tabla de detalle presupuestal." onRetry={refetchTabla} />
      ) : (
        <DataTable
          title="Detalle Presupuestal"
          data={tableRows}
          columns={COLUMNS}
          pageSize={10}
          isLoading={tablaLoading}
        />
      )}
    </div>
  );
};

export default DashboardPresupuesto;
