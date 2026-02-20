import api from './client';
import type { FilterParams } from '../types';

type ModuloExport =
  | 'presupuesto'
  | 'adquisiciones'
  | 'contratos-menores'
  | 'actividades-operativas'
  | 'alertas';

/**
 * Downloads a helper to trigger browser file save dialog.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Exports data from a module as an Excel (.xlsx) file and triggers browser download.
 */
export async function exportExcel(
  modulo: ModuloExport,
  filters?: FilterParams
): Promise<Blob> {
  const response = await api.get<Blob>(`/exportacion/${modulo}/excel`, {
    params: filters,
    responseType: 'blob',
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(response.data, `INEI_${modulo}_${timestamp}.xlsx`);
  return response.data;
}

/**
 * Exports data from a module as a PDF file and triggers browser download.
 */
export async function exportPdf(
  modulo: ModuloExport,
  filters?: FilterParams
): Promise<Blob> {
  const response = await api.get<Blob>(`/exportacion/${modulo}/pdf`, {
    params: filters,
    responseType: 'blob',
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(response.data, `INEI_${modulo}_${timestamp}.pdf`);
  return response.data;
}
