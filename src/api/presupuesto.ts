import api from './client';
import type { FilterParams } from '../types';
import type {
  KpiPresupuesto,
  PresupuestoGraficoBarItem,
  PresupuestoGraficoEvolucionItem,
  TablaPresupuestoRow,
  TablaPresupuestoResponse,
} from '../types/presupuesto';

/**
 * Retrieves budget KPI summary.
 *
 * Endpoint: GET /presupuesto/kpis
 * Response fields (snake_case from backend):
 *   total_ues, total_metas, pim_total, certificado_total,
 *   devengado_total, ejecucion_porcentaje
 */
export async function getKpis(filters?: FilterParams): Promise<KpiPresupuesto> {
  const response = await api.get<KpiPresupuesto>('/presupuesto/kpis', {
    params: filters,
  });
  return response.data;
}

/**
 * Returns bar-chart data comparing PIM vs Certificado vs Devengado grouped by
 * Unidad Ejecutora, ordered by PIM descending.
 *
 * Endpoint: GET /presupuesto/grafico-pim-certificado
 * Each item has: nombre, pim, certificado, devengado, ejecucion_porcentaje
 */
export async function getGraficoPimCertificado(
  filters?: FilterParams
): Promise<PresupuestoGraficoBarItem[]> {
  const response = await api.get<PresupuestoGraficoBarItem[]>(
    '/presupuesto/grafico-pim-certificado',
    { params: filters }
  );
  return response.data;
}

/**
 * Returns bar-chart data for UEs ranked by execution percentage (highest
 * first). Excludes UEs with no assigned budget.
 *
 * Endpoint: GET /presupuesto/grafico-ejecucion
 * Each item has: nombre, pim, certificado, devengado, ejecucion_porcentaje
 */
export async function getGraficoEjecucion(
  filters?: FilterParams
): Promise<PresupuestoGraficoBarItem[]> {
  const response = await api.get<PresupuestoGraficoBarItem[]>(
    '/presupuesto/grafico-ejecucion',
    { params: filters }
  );
  return response.data;
}

/**
 * Returns 12 monthly data points (Ene-Dic) for the programado vs ejecutado
 * line chart. Months with no data return zero values.
 *
 * Endpoint: GET /presupuesto/grafico-devengado-mensual
 * Each item has: mes, programado, ejecutado
 */
export async function getGraficoDevengadoMensual(
  filters?: FilterParams
): Promise<PresupuestoGraficoEvolucionItem[]> {
  const response = await api.get<PresupuestoGraficoEvolucionItem[]>(
    '/presupuesto/grafico-devengado-mensual',
    { params: filters }
  );
  return response.data;
}

/**
 * Returns a paginated page of budget detail rows.
 *
 * Endpoint: GET /presupuesto/tabla
 * Response shape: { rows: TablaPresupuestoRow[], total, page, page_size }
 */
export async function getTabla(
  filters?: FilterParams,
  page: number = 1,
  pageSize: number = 20
): Promise<TablaPresupuestoResponse> {
  const response = await api.get<TablaPresupuestoResponse>('/presupuesto/tabla', {
    params: { ...filters, page, page_size: pageSize },
  });
  return response.data;
}

// Re-export row type so consumers can import from a single location
export type { TablaPresupuestoRow };
