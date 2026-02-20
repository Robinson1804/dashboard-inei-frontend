import api from './client';
import type {
  UnidadEjecutora,
  MetaPresupuestal,
  ActividadOperativaMaestro,
  ClasificadorGasto,
  Proveedor,
} from '../types';

/**
 * Retrieves all unidades ejecutoras (DDNNTTs) registered in the system.
 */
export async function getUnidadesEjecutoras(): Promise<UnidadEjecutora[]> {
  const response = await api.get<UnidadEjecutora[]>('/datos-maestros/unidades-ejecutoras');
  return response.data;
}

/**
 * Retrieves metas presupuestales, optionally filtered by unidad ejecutora.
 */
export async function getMetasPresupuestales(ueId?: number): Promise<MetaPresupuestal[]> {
  const response = await api.get<MetaPresupuestal[]>('/datos-maestros/metas-presupuestales', {
    params: ueId !== undefined ? { ue_id: ueId } : undefined,
  });
  return response.data;
}

/**
 * Retrieves actividades operativas master data, optionally filtered by meta or UE.
 */
export async function getActividadesOperativas(
  metaId?: number,
  ueId?: number
): Promise<ActividadOperativaMaestro[]> {
  const params: Record<string, number> = {};
  if (metaId !== undefined) params['meta_id'] = metaId;
  if (ueId !== undefined) params['ue_id'] = ueId;

  const response = await api.get<ActividadOperativaMaestro[]>(
    '/datos-maestros/actividades-operativas',
    { params: Object.keys(params).length > 0 ? params : undefined }
  );
  return response.data;
}

/**
 * Retrieves clasificadores de gasto (budget classifiers),
 * optionally filtered by tipo generico (e.g., "2.3", "2.6").
 */
export async function getClasificadores(tipoGenerico?: string): Promise<ClasificadorGasto[]> {
  const response = await api.get<ClasificadorGasto[]>('/datos-maestros/clasificadores', {
    params: tipoGenerico !== undefined ? { tipo_generico: tipoGenerico } : undefined,
  });
  return response.data;
}

/**
 * Retrieves all registered proveedores (suppliers/vendors).
 */
export async function getProveedores(): Promise<Proveedor[]> {
  const response = await api.get<Proveedor[]>('/datos-maestros/proveedores');
  return response.data;
}
