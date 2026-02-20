/**
 * Types for the Contratos Menores (≤8 UIT) module.
 *
 * All field names are snake_case to match the FastAPI backend schemas exactly.
 * Source of truth: backend/app/schemas/contrato_menor.py
 */

// ---------------------------------------------------------------------------
// Domain enumerations — mirror backend constants exactly
// ---------------------------------------------------------------------------

/** Process state values returned by ContratoMenorResponse.estado */
export type EstadoContrato =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'ORDEN_EMITIDA'
  | 'EJECUTADO'
  | 'PAGADO';

/** Milestone step state for ContratoMenorProcesoResponse.estado */
export type EstadoProceso = 'COMPLETADO' | 'EN_CURSO' | 'PENDIENTE';

/**
 * Fraccionamiento alert rule type — scoped to the Contratos Menores module.
 * Named with module prefix to avoid collision with the generic TipoAlerta
 * in types/alerta.ts when re-exported via the types/index.ts barrel.
 */
export type TipoAlertaFraccionamiento = 'CANTIDAD' | 'MONTO';

// ---------------------------------------------------------------------------
// ContratoMenorProcesoResponse — mirrors backend exactly
// ---------------------------------------------------------------------------

/**
 * A single milestone step in the 9-step stepper timeline.
 * Matches: backend/app/schemas/contrato_menor.py — ContratoMenorProcesoResponse
 */
export interface ContratoMenorHito {
  id: number;
  contrato_menor_id: number;
  /** Sequential position 1–9 */
  orden: number;
  hito: string;
  area_responsable: string | null;
  dias_planificados: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: EstadoProceso | null;
}

// ---------------------------------------------------------------------------
// ContratoMenorResponse — mirrors backend exactly
// ---------------------------------------------------------------------------

/**
 * Full representation of a ContratoMenor record with resolved labels.
 * Matches: backend/app/schemas/contrato_menor.py — ContratoMenorResponse
 *
 * Used for both the paginated table rows (TablaContratosMenoresResponse.rows)
 * and the detail endpoint GET /{id}.  The detail endpoint populates the
 * `procesos` array; the table endpoint may return it empty.
 */
export interface ContratoMenorRow {
  id: number;
  codigo: string | null;
  anio: number | null;
  descripcion: string | null;
  tipo_objeto: string | null;
  categoria: string | null;
  estado: EstadoContrato | null;
  monto_estimado: number | null;
  monto_ejecutado: number | null;
  n_orden: string | null;
  n_cotizaciones: number;

  // Denormalised join fields
  ue_id: number | null;
  /** Abbreviation of the executing unit, e.g. "INEI-LIMA" */
  ue_sigla: string | null;
  meta_id: number | null;
  /** Budget meta code, e.g. "0012" */
  meta_codigo: string | null;
  proveedor_id: number | null;
  /** Supplier legal name once awarded */
  proveedor_razon_social: string | null;

  created_at: string | null;
  updated_at: string | null;

  /** Ordered list of the 9 milestone steps (populated by GET /{id}) */
  procesos: ContratoMenorHito[];
}

/**
 * Alias for the detail endpoint response (GET /contratos-menores/{id}).
 * The backend returns a flat ContratoMenorResponse — procesos is populated.
 */
export type ContratoMenorDetalle = ContratoMenorRow;

// ---------------------------------------------------------------------------
// KpiContratosMenoresResponse — mirrors backend exactly
// ---------------------------------------------------------------------------

/**
 * Aggregate figures for the KPI header cards.
 * Matches: backend/app/schemas/contrato_menor.py — KpiContratosMenoresResponse
 */
export interface KpiContratosMenores {
  /** Total number of minor contracts matching current filters */
  total: number;
  /** Sum of monto_estimado for all matching contracts */
  monto_total: number;
  /** Contracts in PAGADO or EJECUTADO state */
  completados: number;
  /** Contracts in EN_PROCESO or ORDEN_EMITIDA state */
  en_proceso: number;
  /** completados / total × 100 */
  porcentaje_avance: number;
  /** Number of active fraccionamiento alerts */
  alerta_fraccionamiento: number;
}

// ---------------------------------------------------------------------------
// GraficoContratoMenorItem — mirrors backend exactly
// ---------------------------------------------------------------------------

/**
 * Single data point for a distribution chart (by estado or by tipo_objeto).
 * Matches: backend/app/schemas/contrato_menor.py — GraficoContratoMenorItem
 *
 * The backend returns a flat list for GET /graficos — the frontend separates
 * the two series by inspecting the label values.
 */
export interface GraficoContratoMenorItem {
  /** Category label: estado value OR tipo_objeto value */
  label: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
}

// ---------------------------------------------------------------------------
// FraccionamientoAlerta — mirrors backend exactly
// ---------------------------------------------------------------------------

/**
 * A detected fraccionamiento pattern requiring review.
 * Matches: backend/app/schemas/contrato_menor.py — FraccionamientoAlerta
 */
export interface FraccionamientoAlerta {
  /** Abbreviation of the executing unit (DDNNTT) */
  ue_sigla: string;
  categoria: string;
  /** Month short name (e.g. "Ene") for CANTIDAD, or quarter (e.g. "T1") for MONTO */
  mes: string;
  cantidad_contratos: number;
  monto_acumulado: number;
  /** "CANTIDAD" — ≥3 contracts/month | "MONTO" — >8 UIT/quarter */
  tipo_alerta: TipoAlertaFraccionamiento;
  /** Human-readable explanation displayed on screen */
  detalle: string;
}

// ---------------------------------------------------------------------------
// TablaContratosMenoresResponse — mirrors backend exactly
// ---------------------------------------------------------------------------

/**
 * Paginated wrapper returned by GET /contratos-menores/tabla.
 * Matches: backend/app/schemas/contrato_menor.py — TablaContratosMenoresResponse
 */
export interface TablaContratosMenoresResponse {
  rows: ContratoMenorRow[];
  /** Total number of matching rows (ignoring pagination) */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of rows per page as requested */
  page_size: number;
}
