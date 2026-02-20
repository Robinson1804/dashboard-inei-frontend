/**
 * API client for the Contratos Menores (≤8 UIT) module.
 *
 * HTTP methods match the FastAPI router exactly (PUT, not PATCH, for updates).
 * Source of truth: backend/app/routers/contratos_menores.py
 */

import api from './client';
import type { FilterParams } from '../types';
import type {
  KpiContratosMenores,
  ContratoMenorRow,
  ContratoMenorDetalle,
  FraccionamientoAlerta,
  TablaContratosMenoresResponse,
  GraficoContratoMenorItem,
} from '../types/contratoMenor';

// ---------------------------------------------------------------------------
// Re-export types that page components need from a single import path
// ---------------------------------------------------------------------------

export type { GraficoContratoMenorItem };

// ---------------------------------------------------------------------------
// Create payload — matches ContratoMenorCreate backend schema exactly
// Backend auto-generates: codigo, estado (always 'PENDIENTE')
// NOT accepted by backend: proveedor_id, fecha_orden, codigo
// ---------------------------------------------------------------------------

export interface CreateContratoPayload {
  descripcion: string;
  tipo_objeto: string;
  /** Grouping category for fraccionamiento detection, e.g. "MATERIAL_ESCRITORIO" */
  categoria: string;
  ue_id: number;
  meta_id: number;
  /** Estimated value in soles — max S/44,000 (8 UIT) */
  monto_estimado: number;
}

// ---------------------------------------------------------------------------
// Update payload — matches ContratoMenorUpdate backend schema exactly
// All fields are optional; only supplied fields are applied.
// Backend uses PUT /{id}, not PATCH.
// ---------------------------------------------------------------------------

export interface UpdateContratoPayload {
  estado?: string;
  monto_ejecutado?: number;
  proveedor_id?: number;
  n_orden?: string;
  n_cotizaciones?: number;
}

// ---------------------------------------------------------------------------
// Proceso (hito) payloads — match ContratoMenorProcesoCreate / Update exactly
// Backend auto-calculates: orden (max+1 for the contract — do NOT send it)
// NOT accepted by backend create: fecha_fin
// ---------------------------------------------------------------------------

export interface CreateProcesoContratoPayload {
  hito: string;
  area_responsable: string;
  dias_planificados?: number;
  fecha_inicio: string;
}

export interface UpdateProcesoContratoPayload {
  fecha_fin?: string;
  estado?: 'COMPLETADO' | 'EN_CURSO' | 'PENDIENTE';
}

// ---------------------------------------------------------------------------
// GET /contratos-menores/kpis
// ---------------------------------------------------------------------------

/**
 * Retrieves KPI summary for contratos menores (≤8 UIT).
 * Returns: KpiContratosMenoresResponse — total, monto_total, completados,
 *          en_proceso, porcentaje_avance, alerta_fraccionamiento
 */
export async function getKpis(filters?: FilterParams): Promise<KpiContratosMenores> {
  const response = await api.get<KpiContratosMenores>('/contratos-menores/kpis', {
    params: filters,
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /contratos-menores/graficos
// ---------------------------------------------------------------------------

/**
 * Returns distribution chart data for contratos menores.
 *
 * The backend returns a flat list of GraficoContratoMenorItem covering BOTH
 * distribution-by-estado and distribution-by-tipo_objeto in a single array.
 * The frontend separates the two series by inspecting each item's `label`
 * value (estado labels: PENDIENTE/EN_PROCESO/ORDEN_EMITIDA/EJECUTADO/PAGADO;
 * tipo_objeto labels: BIEN/SERVICIO/OBRA/CONSULTORIA).
 *
 * Endpoint: GET /api/contratos-menores/graficos
 * Response model: list[GraficoContratoMenorItem]
 */
export async function getGraficos(
  filters?: FilterParams
): Promise<GraficoContratoMenorItem[]> {
  const response = await api.get<GraficoContratoMenorItem[]>(
    '/contratos-menores/graficos',
    { params: filters }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /contratos-menores/tabla
// ---------------------------------------------------------------------------

/**
 * Returns paginated contratos menores table with optional filters.
 * Response shape: { rows, total, page, page_size }  (NOT items/pageSize)
 */
export async function getTabla(
  filters?: FilterParams,
  page: number = 1,
  pageSize: number = 20
): Promise<TablaContratosMenoresResponse> {
  const response = await api.get<TablaContratosMenoresResponse>(
    '/contratos-menores/tabla',
    { params: { ...filters, page, page_size: pageSize } }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /contratos-menores/{id}
// ---------------------------------------------------------------------------

/**
 * Retrieves full detail for a single contrato menor, including the 9-step
 * stepper timeline in the `procesos` array.
 *
 * The backend returns a flat ContratoMenorResponse — NOT a nested
 * { contrato, procesos } object.  The `procesos` field is part of the
 * top-level response object.
 */
export async function getDetalle(id: number): Promise<ContratoMenorDetalle> {
  const response = await api.get<ContratoMenorDetalle>(`/contratos-menores/${id}`);
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /contratos-menores/fraccionamiento
// ---------------------------------------------------------------------------

/**
 * Retrieves fraccionamiento alerts for a given fiscal year.
 * Detects potential splitting of contracts to avoid the 8 UIT threshold.
 * `anio` is required by the backend (not optional).
 */
export async function getFraccionamiento(anio: number): Promise<FraccionamientoAlerta[]> {
  const response = await api.get<FraccionamientoAlerta[]>(
    '/contratos-menores/fraccionamiento',
    { params: { anio } }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// POST /contratos-menores/
// ---------------------------------------------------------------------------

/**
 * Creates a new contrato menor record.
 * Backend auto-generates: codigo, estado ('PENDIENTE'), anio.
 * Required fields: descripcion, tipo_objeto, categoria, ue_id, meta_id,
 *                  monto_estimado (max 44,000).
 */
export async function createContrato(
  data: CreateContratoPayload
): Promise<ContratoMenorDetalle> {
  const response = await api.post<ContratoMenorDetalle>('/contratos-menores/', data);
  return response.data;
}

// ---------------------------------------------------------------------------
// PUT /contratos-menores/{id}
// ---------------------------------------------------------------------------

/**
 * Partially updates an existing contrato menor.
 * Uses PUT (not PATCH) — the backend router only exposes PUT /{id}.
 * Sending PATCH would cause HTTP 405 Method Not Allowed.
 */
export async function updateContrato(
  id: number,
  data: UpdateContratoPayload
): Promise<ContratoMenorDetalle> {
  const response = await api.put<ContratoMenorDetalle>(`/contratos-menores/${id}`, data);
  return response.data;
}

// ---------------------------------------------------------------------------
// POST /contratos-menores/{id}/procesos
// ---------------------------------------------------------------------------

/**
 * Adds a new milestone step (hito) to a contrato menor's stepper timeline.
 * Backend auto-calculates `orden` (max+1); do NOT include it in the payload.
 * Returns the newly created ContratoMenorProcesoResponse (single step object).
 */
export async function createProceso(
  contratoId: number,
  data: CreateProcesoContratoPayload
): Promise<ContratoMenorRow> {
  const response = await api.post<ContratoMenorRow>(
    `/contratos-menores/${contratoId}/procesos`,
    data
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// PUT /contratos-menores/{id}/procesos/{proceso_id}
// ---------------------------------------------------------------------------

/**
 * Updates a specific milestone step within a contrato menor.
 * Uses PUT (not PATCH) — the backend router only exposes PUT /{id}/procesos/{pid}.
 * Allowed fields: fecha_fin (actual completion date), estado.
 */
export async function updateProceso(
  contratoId: number,
  procesoId: number,
  data: UpdateProcesoContratoPayload
): Promise<ContratoMenorRow> {
  const response = await api.put<ContratoMenorRow>(
    `/contratos-menores/${contratoId}/procesos/${procesoId}`,
    data
  );
  return response.data;
}
