/**
 * Types for the Actividades Operativas module.
 *
 * All shapes mirror the Pydantic schemas defined in
 * backend/app/schemas/actividad_operativa.py.
 * Field names are snake_case to match the backend JSON exactly.
 */

// ---------------------------------------------------------------------------
// Semaforo — uppercase values as returned by the backend
// ---------------------------------------------------------------------------

/** Traffic-light state as returned by the backend (uppercase). */
export type SemaforoAO = 'VERDE' | 'AMARILLO' | 'ROJO';

// ---------------------------------------------------------------------------
// KPI summary cards — GET /actividades-operativas/kpis
// ---------------------------------------------------------------------------

/**
 * Aggregate KPI figures for the Actividades Operativas Dashboard header.
 * Mirrors backend KpiAOResponse.
 */
export interface KpiAOResponse {
  /** Total number of active operational activities. */
  total_aos: number;
  /** AOs with execution >= 90% (on-track). */
  verdes: number;
  /** AOs with execution 70-89% (at-risk). */
  amarillos: number;
  /** AOs with execution < 70% (critical). */
  rojos: number;
  /** Share of green AOs as a percentage (0-100). */
  porcentaje_verde: number;
  /** Share of yellow AOs as a percentage (0-100). */
  porcentaje_amarillo: number;
  /** Share of red AOs as a percentage (0-100). */
  porcentaje_rojo: number;
}

// ---------------------------------------------------------------------------
// Evolution chart — GET /actividades-operativas/programado-vs-ejecutado
// ---------------------------------------------------------------------------

/**
 * Monthly evolution data point for the AO programado vs ejecutado chart.
 * Backend returns a flat list[GraficoAOEvolucionItem].
 */
export interface GraficoAOEvolucionItem {
  /** Spanish month abbreviation shown on the X-axis (e.g. "Ene"). */
  mes: string;
  /** Total programmed amount for the month across all AOs (soles). */
  programado: number;
  /** Total executed amount for the month across all AOs (soles). */
  ejecutado: number;
}

// ---------------------------------------------------------------------------
// Paginated table — GET /actividades-operativas/tabla
// ---------------------------------------------------------------------------

/**
 * Single row in the Actividades Operativas summary table.
 * Mirrors backend AOTablaRow.
 */
export interface AOTablaRow {
  /** ActividadOperativa primary key. */
  id: number;
  /** CEPLAN strategic code, e.g. "AOI00000500001". */
  codigo_ceplan: string;
  /** Full activity name. */
  nombre: string;
  /** Abbreviation of the owning UnidadEjecutora. */
  ue_sigla: string;
  /** Sum of all monthly programado amounts in soles. */
  programado_total: number;
  /** Sum of all monthly ejecutado amounts in soles. */
  ejecutado_total: number;
  /** Execution rate: ejecutado / programado * 100. */
  ejecucion_porcentaje: number;
  /** Traffic-light state (uppercase). */
  semaforo: SemaforoAO;
}

/**
 * Paginated wrapper returned by GET /actividades-operativas/tabla.
 * Mirrors backend AOTablaResponse.
 */
export interface AOTablaResponse {
  /** The AO summary rows for the requested page. */
  rows: AOTablaRow[];
  /** Total matching rows ignoring pagination. */
  total: number;
  /** Current 1-based page number. */
  page: number;
  /** Rows per page as requested. */
  page_size: number;
}

// ---------------------------------------------------------------------------
// Drill-down — GET /actividades-operativas/{id}/drill-down
// ---------------------------------------------------------------------------

/**
 * One expenditure-classifier breakdown item within an AO drill-down.
 * Mirrors backend DrillDownTareaItem.
 */
export interface DrillDownTareaItem {
  /** Standard SIAF code, e.g. "2.3.1.5.1.2". */
  clasificador_codigo: string;
  /** Human-readable classifier name. */
  clasificador_descripcion: string;
  /** Total programado for this classifier across all months. */
  programado: number;
  /** Total ejecutado for this classifier across all months. */
  ejecutado: number;
  /** Execution rate for this classifier (0-100+). */
  ejecucion_porcentaje: number;
}

/**
 * Full drill-down view for a single ActividadOperativa.
 * Mirrors backend DrillDownAOResponse.
 */
export interface DrillDownAOResponse {
  /** ActividadOperativa primary key. */
  ao_id: number;
  /** Full activity name. */
  ao_nombre: string;
  /** CEPLAN code of the activity. */
  ao_codigo: string;
  /** Overall traffic-light state for this AO (uppercase). */
  semaforo: SemaforoAO;
  /** Total programado across all classifiers and months. */
  programado_total: number;
  /** Total ejecutado across all classifiers and months. */
  ejecutado_total: number;
  /** Breakdown by expenditure classifier. */
  tareas: DrillDownTareaItem[];
}

// ---------------------------------------------------------------------------
// Legacy aliases — kept for any components not yet migrated
// ---------------------------------------------------------------------------

/** @deprecated Use KpiAOResponse instead. */
export type KpiAO = KpiAOResponse;

/** @deprecated Use AOTablaRow instead. */
export type AORow = AOTablaRow;
