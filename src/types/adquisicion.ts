// ---------------------------------------------------------------------------
// Adquisiciones >8 UIT — types aligned with backend schemas
// Source of truth: backend/app/schemas/adquisicion.py
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Enumerations (kept as union types; values match backend constants exactly)
// ---------------------------------------------------------------------------

/** Three phases of the OSCE 22-step procurement workflow. */
export type FaseAdquisicion =
  | 'ACTUACIONES_PREPARATORIAS'
  | 'SELECCION'
  | 'EJECUCION_CONTRACTUAL';

/** Per-milestone status values returned by the backend. */
export type EstadoHito = 'COMPLETADO' | 'EN_CURSO' | 'PENDIENTE' | 'OBSERVADO';

/**
 * Process-level state values returned by the backend in snake_UPPER_CASE.
 * These are the raw codes stored in the DB and returned by every endpoint.
 */
export type EstadoAdquisicion =
  | 'EN_ACTOS_PREPARATORIOS'
  | 'EN_SELECCION'
  | 'EN_EJECUCION'
  | 'ADJUDICADO'
  | 'CULMINADO'
  | 'DESIERTO'
  | 'NULO';

/** Responsible area codes. */
export type AreaResponsable =
  | 'OTIN'
  | 'OTA'
  | 'DEC'
  | 'OTPP'
  | 'PROVEEDOR'
  | 'COMITÉ';

// ---------------------------------------------------------------------------
// Gantt milestone — maps to AdquisicionProcesoResponse
// ---------------------------------------------------------------------------

/** Single Gantt-timeline milestone (AdquisicionProcesoResponse). */
export interface TimelineHito {
  id: number;
  adquisicion_id: number;
  orden: number;
  hito: string;
  fase: FaseAdquisicion | null;
  area_responsable: AreaResponsable | string | null;
  dias_planificados: number | null;
  fecha_inicio: string | null;    // ISO date string "YYYY-MM-DD"
  fecha_fin: string | null;
  fecha_real_inicio: string | null;
  fecha_real_fin: string | null;
  estado: EstadoHito | null;
  observacion: string | null;
}

// ---------------------------------------------------------------------------
// Main acquisition row — maps to AdquisicionResponse
// ---------------------------------------------------------------------------

/**
 * Acquisition list/detail record exactly as returned by the backend
 * (AdquisicionResponse).  All field names are snake_case matching the API.
 */
export interface AdquisicionRow {
  id: number;
  codigo: string;
  anio: number | null;
  ue_id: number | null;
  /** Resolved abbreviation, e.g. "INEI-LIMA". */
  ue_sigla: string | null;
  meta_id: number | null;
  /** Resolved meta code, e.g. "0003". */
  meta_codigo: string | null;
  descripcion: string;
  tipo_objeto: string | null;
  tipo_procedimiento: string | null;
  /** Raw backend estado, e.g. "EN_SELECCION". */
  estado: EstadoAdquisicion | null;
  /** Phase string, e.g. "SELECCION". */
  fase_actual: FaseAdquisicion | null;
  monto_referencial: number | null;
  monto_adjudicado: number | null;
  proveedor_id: number | null;
  proveedor_razon_social: string | null;
  /** ISO datetime string "YYYY-MM-DDTHH:mm:ss". */
  created_at: string;
  /** ISO datetime string "YYYY-MM-DDTHH:mm:ss". */
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Extended detail record — maps to AdquisicionDetalleResponse
// ---------------------------------------------------------------------------

/** 1:1 extended detail (SEACE / PLADICOP references). */
export interface AdquisicionDetalleRecord {
  id: number;
  adquisicion_id: number;
  n_expediente: string | null;
  n_proceso_seace: string | null;
  n_proceso_pladicop: string | null;
  bases_url: string | null;
  resolucion_aprobacion: string | null;
  fecha_aprobacion_expediente: string | null;   // ISO date "YYYY-MM-DD"
  observaciones: string | null;
}

// ---------------------------------------------------------------------------
// Full detail response — maps to AdquisicionDetalleFullResponse
// GET /adquisiciones/{id}
// ---------------------------------------------------------------------------

/**
 * Nested shape returned by GET /adquisiciones/{id}.
 * Combines header, extended detail, and the ordered Gantt timeline.
 */
export interface AdquisicionDetalleFullResponse {
  adquisicion: AdquisicionRow;
  detalle: AdquisicionDetalleRecord | null;
  procesos: TimelineHito[];
}

// ---------------------------------------------------------------------------
// Paginated table — maps to TablaAdquisicionesResponse
// GET /adquisiciones/tabla
// ---------------------------------------------------------------------------

/**
 * Paginated table response for GET /adquisiciones/tabla.
 * Note: field names match the backend (rows/total/page/page_size),
 * NOT the generic frontend TablaResponse<T> shape (which uses items/pageSize).
 */
export interface TablaAdquisicionesResponse {
  rows: AdquisicionRow[];
  total: number;
  page: number;
  page_size: number;
}

// ---------------------------------------------------------------------------
// KPI aggregates — maps to KpiAdquisicionesResponse
// GET /adquisiciones/kpis
// ---------------------------------------------------------------------------

/**
 * KPI header cards for the Adquisiciones dashboard.
 * All field names are snake_case matching KpiAdquisicionesResponse.
 */
export interface KpiAdquisiciones {
  total: number;
  monto_pim: number;
  monto_adjudicado: number;
  /** 0–100 percentage of ADJUDICADO + CULMINADO processes. */
  avance_porcentaje: number;
  culminados: number;
  en_proceso: number;
  /** Count per estado code, e.g. { "EN_SELECCION": 8, ... } */
  by_estado: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Chart data — maps to GraficoAdquisicionItem
// GET /adquisiciones/graficos → list[GraficoAdquisicionItem]
// ---------------------------------------------------------------------------

/**
 * Single slice of the distribution chart returned as a flat array by
 * GET /adquisiciones/graficos.
 */
export interface GraficoAdquisicionItem {
  estado: string;
  label: string;
  cantidad: number;
  porcentaje: number;
  monto: number;
}

// ---------------------------------------------------------------------------
// Write payloads — map to AdquisicionCreate / AdquisicionUpdate
// ---------------------------------------------------------------------------

/**
 * POST /adquisiciones — create a new procurement record.
 * Field names match AdquisicionCreate exactly.
 */
export interface CreateAdquisicionPayload {
  descripcion: string;
  tipo_objeto: string;
  /** OSCE procedure type, e.g. "LICITACION_PUBLICA". */
  tipo_procedimiento: string;
  ue_id: number;
  meta_id: number;
  monto_referencial: number;
  /** Omit to let the backend auto-generate ADQ-{anio}-{seq}. */
  codigo?: string | null;
}

/**
 * PUT /adquisiciones/{id} — partial update (all fields optional).
 * Field names match AdquisicionUpdate exactly.
 */
export interface UpdateAdquisicionPayload {
  descripcion?: string | null;
  tipo_objeto?: string | null;
  tipo_procedimiento?: string | null;
  ue_id?: number | null;
  meta_id?: number | null;
  monto_referencial?: number | null;
  monto_adjudicado?: number | null;
  estado?: EstadoAdquisicion | null;
  fase_actual?: FaseAdquisicion | null;
  proveedor_id?: number | null;
}

// ---------------------------------------------------------------------------
// Gantt milestone write payloads — AdquisicionProcesoCreate / Update
// ---------------------------------------------------------------------------

/** POST /adquisiciones/{id}/procesos — add a Gantt milestone. */
export interface CreateProcesoPayload {
  orden: number;
  hito: string;
  fase?: FaseAdquisicion | null;
  area_responsable?: AreaResponsable | string | null;
  dias_planificados?: number | null;
  fecha_inicio?: string | null;   // ISO date "YYYY-MM-DD"
  estado?: EstadoHito;
}

/** PUT /adquisiciones/{id}/procesos/{proceso_id} — update a milestone. */
export interface UpdateProcesoPayload {
  fecha_fin?: string | null;
  fecha_real_inicio?: string | null;
  fecha_real_fin?: string | null;
  estado?: EstadoHito | null;
  observacion?: string | null;
}
