import api from './client';
import type { ImportResult } from '../types/common';
import type { EstadoFormatosResponse, FormatoCatalogItem, HistorialImportacion } from '../types/importacion';

/**
 * Uploads a DDNNTT Excel file (Formato 1 through 5.B).
 *
 * POST /api/importacion/formatos
 *
 * Returns an ImportacionUploadResponse (typed as ImportResult) with:
 *   formato_detectado, registros_validos, registros_error,
 *   warnings: string[], errors: string[], metadata: Record<string, unknown>
 */
export async function uploadFormatos(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ImportResult>('/importacion/formatos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Uploads a datos maestros Excel file (Cuadro AO-META or reference tables).
 *
 * POST /api/importacion/datos-maestros
 */
export async function uploadDatosMaestros(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ImportResult>('/importacion/datos-maestros', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Uploads a SIAF (Sistema Integrado de Administracion Financiera) export file.
 *
 * POST /api/importacion/siaf
 */
export async function uploadSiaf(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ImportResult>('/importacion/siaf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Uploads a SIGA (Sistema Integrado de Gestion Administrativa) export file.
 *
 * POST /api/importacion/siga
 */
export async function uploadSiga(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ImportResult>('/importacion/siga', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Retrieves the import history log, optionally filtered by fiscal year.
 *
 * GET /api/importacion/historial?anio={anio}
 *
 * Returns a list of HistorialImportacion records (most-recent first):
 *   id, formato, archivo_nombre, fecha, usuario, ue,
 *   registros_ok, registros_error, estado ('EXITOSO'|'PARCIAL'|'FALLIDO')
 */
export async function getHistorial(anio?: number): Promise<HistorialImportacion[]> {
  const response = await api.get<HistorialImportacion[]>('/importacion/historial', {
    params: anio !== undefined ? { anio } : undefined,
  });
  return response.data;
}

/**
 * Lists the 10 available import formats with metadata.
 *
 * GET /api/importacion/formatos-catalogo
 */
export async function getFormatosCatalogo(): Promise<FormatoCatalogItem[]> {
  const response = await api.get<FormatoCatalogItem[]>('/importacion/formatos-catalogo');
  return response.data;
}

/**
 * Retrieves the import format status dashboard.
 *
 * GET /api/importacion/estado-formatos
 */
export async function getEstadoFormatos(): Promise<EstadoFormatosResponse> {
  const response = await api.get<EstadoFormatosResponse>('/importacion/estado-formatos');
  return response.data;
}

/**
 * Deletes imported data and history for a specific format.
 *
 * DELETE /api/importacion/limpiar-formato/{formato}
 */
export async function limpiarFormato(formato: string): Promise<{
  formato: string;
  registros_datos_eliminados: number;
  registros_historial_eliminados: number;
  tablas_afectadas: string[];
}> {
  const response = await api.delete(`/importacion/limpiar-formato/${formato}`);
  return response.data;
}

/**
 * Downloads the Excel template for the specified format as a blob.
 *
 * GET /api/importacion/plantilla/{formatoKey}
 */
export async function descargarPlantilla(formatoKey: string): Promise<void> {
  const response = await api.get(`/importacion/plantilla/${formatoKey}`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plantilla_${formatoKey}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
