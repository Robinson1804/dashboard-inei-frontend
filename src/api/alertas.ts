import api from './client';
import type { AlertaItem, AlertaResumen } from '../types';

export interface AlertaFilters {
  nivel?: 'critica' | 'advertencia' | 'informativa';
  estado?: 'no_leida' | 'leida' | 'resuelta';
  modulo?: string;
  ue_id?: number;
  anio?: number;
}

/**
 * Retrieves the list of alerts with optional filters.
 */
export async function getAlertas(filters?: AlertaFilters): Promise<AlertaItem[]> {
  const response = await api.get<AlertaItem[]>('/alertas/', { params: filters });
  return response.data;
}

/**
 * Returns a summary count of alerts grouped by level and read status.
 */
export async function getResumen(): Promise<AlertaResumen> {
  const response = await api.get<AlertaResumen>('/alertas/resumen');
  return response.data;
}

/**
 * Marks a specific alert as read.
 */
export async function marcarLeida(id: number): Promise<AlertaItem> {
  const response = await api.put<AlertaItem>(`/alertas/${id}/leer`);
  return response.data;
}

/**
 * Marks a specific alert as resolved.
 */
export async function marcarResuelta(id: number): Promise<AlertaItem> {
  const response = await api.put<AlertaItem>(`/alertas/${id}/resolver`);
  return response.data;
}
