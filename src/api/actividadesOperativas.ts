/**
 * API client for the Actividades Operativas module.
 *
 * All return types match the exact JSON shapes produced by
 * backend/app/routers/actividades_operativas.py.
 */

import api from './client';
import type { FilterParams } from '../types/common';
import type {
  KpiAOResponse,
  GraficoAOEvolucionItem,
  AOTablaRow,
  AOTablaResponse,
  DrillDownAOResponse,
} from '../types/actividadOperativa';

// ---------------------------------------------------------------------------
// GET /actividades-operativas/kpis
// ---------------------------------------------------------------------------

/**
 * Retrieves aggregate KPI figures for the Actividades Operativas header cards.
 *
 * Backend response shape: KpiAOResponse
 *   { total_aos, verdes, amarillos, rojos,
 *     porcentaje_verde, porcentaje_amarillo, porcentaje_rojo }
 */
export async function getKpis(filters?: FilterParams): Promise<KpiAOResponse> {
  const response = await api.get<KpiAOResponse>(
    '/actividades-operativas/kpis',
    { params: filters }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /actividades-operativas/programado-vs-ejecutado
// ---------------------------------------------------------------------------

/**
 * Returns monthly programado vs ejecutado evolution for the AO line chart.
 *
 * Backend response shape: list[GraficoAOEvolucionItem]
 *   A flat array of { mes, programado, ejecutado } — exactly 12 items (Ene-Dic).
 *
 * NOTE: The backend returns a flat array, NOT an object with mensual/porMeta keys.
 */
export async function getProgramadoVsEjecutado(
  filters?: FilterParams
): Promise<GraficoAOEvolucionItem[]> {
  const response = await api.get<GraficoAOEvolucionItem[]>(
    '/actividades-operativas/programado-vs-ejecutado',
    { params: filters }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /actividades-operativas/tabla
// ---------------------------------------------------------------------------

/**
 * Returns a paginated page of AO summary rows with semaforo indicators.
 *
 * Backend response shape: AOTablaResponse
 *   { rows: AOTablaRow[], total, page, page_size }
 *
 * NOTE: The array field is `rows` (not `items`), and the pagination field is
 * `page_size` (not `pageSize`). There is no `totalPages` field.
 */
export async function getTabla(
  filters?: FilterParams,
  page: number = 1,
  pageSize: number = 20
): Promise<AOTablaResponse> {
  const response = await api.get<AOTablaResponse>(
    '/actividades-operativas/tabla',
    { params: { ...filters, page, page_size: pageSize } }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// GET /actividades-operativas/{id}/drill-down
// ---------------------------------------------------------------------------

/**
 * Retrieves classifier-level drill-down data for a single ActividadOperativa.
 *
 * Backend response shape: DrillDownAOResponse
 *   { ao_id, ao_nombre, ao_codigo, semaforo, programado_total, ejecutado_total,
 *     tareas: DrillDownTareaItem[] }
 *
 * Each tarea: { clasificador_codigo, clasificador_descripcion,
 *               programado, ejecutado, ejecucion_porcentaje }
 */
export async function getDrillDown(aoId: number): Promise<DrillDownAOResponse> {
  const response = await api.get<DrillDownAOResponse>(
    `/actividades-operativas/${aoId}/drill-down`
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Re-export types for consumers that import from this module
// ---------------------------------------------------------------------------

export type {
  KpiAOResponse,
  GraficoAOEvolucionItem,
  AOTablaRow,
  AOTablaResponse,
  DrillDownAOResponse,
};
