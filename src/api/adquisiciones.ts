/**
 * Adquisiciones >8 UIT — API client.
 *
 * All endpoint URLs, HTTP methods, request payloads, and response types are
 * aligned with backend/app/routers/adquisiciones.py and
 * backend/app/schemas/adquisicion.py.
 *
 * Key contract notes:
 * - PUT  /{id}                    (not PATCH — backend defines PUT)
 * - PUT  /{id}/procesos/{pid}     (not PATCH)
 * - GET  /graficos                → list[GraficoAdquisicionItem] (flat array)
 * - GET  /kpis                    → KpiAdquisicionesResponse (snake_case fields)
 * - GET  /tabla                   → TablaAdquisicionesResponse (rows/total/page/page_size)
 * - GET  /{id}                    → AdquisicionDetalleFullResponse (nested)
 */

import api from './client';
import type { FilterParams } from '../types/common';
import type {
  KpiAdquisiciones,
  AdquisicionRow,
  AdquisicionDetalleFullResponse,
  TablaAdquisicionesResponse,
  GraficoAdquisicionItem,
  CreateAdquisicionPayload,
  UpdateAdquisicionPayload,
  CreateProcesoPayload,
  UpdateProcesoPayload,
  TimelineHito,
} from '../types/adquisicion';

// Re-export payload types so other modules can import them from here if needed
export type {
  CreateAdquisicionPayload,
  UpdateAdquisicionPayload,
  CreateProcesoPayload,
  UpdateProcesoPayload,
};

/**
 * Build filter query parameters that match the backend's _filter_params
 * dependency (uses anio, ue_id, meta_id, estado, tipo_procedimiento, fase).
 */
function buildAdquisicionesParams(filters?: FilterParams): Record<string, unknown> {
  if (!filters) return {};
  const params: Record<string, unknown> = {};
  if (filters.anio !== undefined)               params.anio = filters.anio;
  if (filters.ue_id !== undefined)              params.ue_id = filters.ue_id;
  if (filters.meta_id !== undefined)            params.meta_id = filters.meta_id;
  if (filters.estado !== undefined)             params.estado = filters.estado;
  if (filters.tipo_procedimiento !== undefined) params.tipo_procedimiento = filters.tipo_procedimiento;
  if (filters.fase !== undefined)               params.fase = filters.fase;
  return params;
}

// ---------------------------------------------------------------------------
// GET /adquisiciones/kpis
// ---------------------------------------------------------------------------

/**
 * Retrieves KPI summary for adquisiciones > 8 UIT.
 * Returns KpiAdquisicionesResponse: { total, monto_pim, monto_adjudicado,
 * avance_porcentaje, culminados, en_proceso, by_estado }.
 */
export async function getKpis(filters?: FilterParams): Promise<KpiAdquisiciones> {
  const response = await api.get<KpiAdquisiciones>('/adquisiciones/kpis', {
    params: buildAdquisicionesParams(filters),
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /adquisiciones/graficos
// ---------------------------------------------------------------------------

/**
 * Returns procurement distribution by estado as a flat array of
 * GraficoAdquisicionItem (estado, label, cantidad, porcentaje, monto).
 * Backend endpoint: GET /adquisiciones/graficos
 * Response model:   list[GraficoAdquisicionItem]
 */
export async function getGraficos(
  filters?: FilterParams
): Promise<GraficoAdquisicionItem[]> {
  const response = await api.get<GraficoAdquisicionItem[]>('/adquisiciones/graficos', {
    params: buildAdquisicionesParams(filters),
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /adquisiciones/tabla
// ---------------------------------------------------------------------------

/**
 * Returns a paginated page of AdquisicionResponse records.
 * Response shape: { rows: AdquisicionRow[], total, page, page_size }
 */
export async function getTabla(
  filters?: FilterParams,
  page: number = 1,
  pageSize: number = 20
): Promise<TablaAdquisicionesResponse> {
  const response = await api.get<TablaAdquisicionesResponse>('/adquisiciones/tabla', {
    params: { ...buildAdquisicionesParams(filters), page, page_size: pageSize },
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /adquisiciones/{id}
// ---------------------------------------------------------------------------

/**
 * Retrieves the full detail for a single adquisicion.
 * Response shape: { adquisicion: AdquisicionRow, detalle: ...|null, procesos: TimelineHito[] }
 */
export async function getDetalle(id: number): Promise<AdquisicionDetalleFullResponse> {
  const response = await api.get<AdquisicionDetalleFullResponse>(`/adquisiciones/${id}`);
  return response.data;
}

// ---------------------------------------------------------------------------
// POST /adquisiciones/
// ---------------------------------------------------------------------------

/**
 * Creates a new adquisicion record.
 * Payload: { descripcion, tipo_objeto, tipo_procedimiento, ue_id, meta_id,
 *            monto_referencial, codigo? }
 * Returns: AdquisicionResponse (the created record's header fields).
 */
export async function createAdquisicion(
  data: CreateAdquisicionPayload
): Promise<AdquisicionRow> {
  const response = await api.post<AdquisicionRow>('/adquisiciones/', data);
  return response.data;
}

// ---------------------------------------------------------------------------
// PUT /adquisiciones/{id}
// ---------------------------------------------------------------------------

/**
 * Partially updates an existing adquisicion.
 * Backend defines this as PUT (not PATCH) — using PUT to avoid HTTP 405.
 * Returns: AdquisicionResponse (the updated header fields).
 */
export async function updateAdquisicion(
  id: number,
  data: UpdateAdquisicionPayload
): Promise<AdquisicionRow> {
  const response = await api.put<AdquisicionRow>(`/adquisiciones/${id}`, data);
  return response.data;
}

// ---------------------------------------------------------------------------
// POST /adquisiciones/{adqId}/procesos
// ---------------------------------------------------------------------------

/**
 * Adds a new Gantt milestone to an existing adquisicion.
 * Returns: AdquisicionProcesoResponse (the created milestone).
 */
export async function createProceso(
  adqId: number,
  data: CreateProcesoPayload
): Promise<TimelineHito> {
  const response = await api.post<TimelineHito>(
    `/adquisiciones/${adqId}/procesos`,
    data
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// PUT /adquisiciones/{adqId}/procesos/{procesoId}
// ---------------------------------------------------------------------------

/**
 * Updates a specific Gantt milestone.
 * Backend defines this as PUT (not PATCH) — using PUT to avoid HTTP 405.
 * Returns: AdquisicionProcesoResponse (the updated milestone).
 */
export async function updateProceso(
  adqId: number,
  procesoId: number,
  data: UpdateProcesoPayload
): Promise<TimelineHito> {
  const response = await api.put<TimelineHito>(
    `/adquisiciones/${adqId}/procesos/${procesoId}`,
    data
  );
  return response.data;
}
