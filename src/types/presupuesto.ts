/**
 * KPI summary returned by GET /presupuesto/kpis.
 *
 * Field names match the backend KpiPresupuestoResponse schema exactly
 * (snake_case, as serialised by FastAPI/Pydantic).
 */
export interface KpiPresupuesto {
  total_ues: number;
  total_metas: number;
  pim_total: number;
  certificado_total: number;
  devengado_total: number;
  ejecucion_porcentaje: number;
}

/**
 * Single row returned inside TablaPresupuestoResponse.rows.
 *
 * Matches the backend TablaPresupuestoRow schema. Fields that do not exist
 * in the backend (anio, compromiso, girado) are intentionally absent.
 */
export interface TablaPresupuestoRow {
  id: number;
  ue: string;
  meta: string;
  clasificador: string;
  descripcion: string;
  pim: number;
  certificado: number;
  devengado: number;
  saldo: number;
  ejecucion: number;
}

/**
 * Single bar-chart item returned by:
 *   GET /presupuesto/grafico-pim-certificado
 *   GET /presupuesto/grafico-ejecucion
 *
 * Uses the backend field name `nombre` (not `name`) and carries all four
 * budget amounts plus the execution percentage.
 */
export interface PresupuestoGraficoBarItem {
  nombre: string;
  pim: number;
  certificado: number;
  devengado: number;
  ejecucion_porcentaje: number;
}

/**
 * Single data point returned by GET /presupuesto/grafico-devengado-mensual.
 *
 * Contains the month label plus programado and ejecutado totals.
 */
export interface PresupuestoGraficoEvolucionItem {
  mes: string;
  programado: number;
  ejecutado: number;
}

/**
 * Paginated wrapper returned by GET /presupuesto/tabla.
 *
 * Uses `rows` and `page_size` to match the backend TablaPresupuestoResponse
 * schema exactly. Note: there is no `totalPages` field in the backend.
 */
export interface TablaPresupuestoResponse {
  rows: TablaPresupuestoRow[];
  total: number;
  page: number;
  page_size: number;
}
