import type { LucideIcon } from 'lucide-react';

export type SemaforoColor = 'verde' | 'amarillo' | 'rojo' | 'VERDE' | 'AMARILLO' | 'ROJO';

export interface KpiData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  delta?: string;
  deltaColor?: 'green' | 'amber' | 'red' | 'blue';
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'multiselect';
  options: FilterOption[];
  placeholder?: string;
}

export interface FilterState {
  [key: string]: string | string[];
}

export interface FilterParams {
  anio?: number;
  ue_id?: number;
  meta_id?: number;
  fuente?: string;
  ddnntt?: string;
  estado?: string;
  tipo_objeto?: string;
  /** @deprecated use tipo_procedimiento for adquisiciones endpoints */
  tipo_proceso?: string;
  /** Adquisiciones >8 UIT: OSCE procedure type (backend query param). */
  tipo_procedimiento?: string;
  fase?: string;
  [key: string]: string | number | undefined;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

/** Generic paginated API response wrapper (matches backend snake_case) */
export interface TablaResponse<T> {
  rows: T[];
  total: number;
  page: number;
  page_size: number;
}

/** Generic bar chart data point (flexible to match various backend responses) */
export interface GraficoBarItem {
  nombre?: string;
  name?: string;
  [key: string]: string | number | null | undefined;
}

/** Generic monthly/time-series data point */
export interface GraficoEvolucionItem {
  mes: string;
  [key: string]: string | number | null | undefined;
}

/** Authenticated user profile (matches backend UserResponse) */
export interface User {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  /** Convenience alias used by Header and other UI components */
  nombre?: string;
  rol: string;
  ue_id: number | null;
  activo: boolean;
}

/** Master data: Unidad Ejecutora (DDNNTT) */
export interface UnidadEjecutora {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string;
}

/** Master data: Meta Presupuestal */
export interface MetaPresupuestal {
  id: number;
  codigo: string;
  descripcion: string;
  ueId: number;
}

/** Master data: Actividad Operativa (maestro) */
export interface ActividadOperativaMaestro {
  id: number;
  codigo: string;
  nombre: string;
  metaId: number;
}

/** Master data: Clasificador de Gasto */
export interface ClasificadorGasto {
  id: number;
  codigo: string;
  descripcion: string;
  tipoGenerico: string;
}

/** Master data: Proveedor */
export interface Proveedor {
  id: number;
  ruc: string;
  razonSocial: string;
  tipo: string;
}

/** Import operation result (matches backend ImportacionUploadResponse) */
export interface ImportResult {
  formato_detectado: string;
  registros_validos: number;
  registros_error: number;
  warnings: string[];
  errors: string[];
  metadata: Record<string, unknown>;
}

/** Master data: Unidad Ejecutora extended with tipo and activo flags */
export interface UnidadEjecutoraMaestro extends UnidadEjecutora {
  tipo: 'SEDE' | 'DDNNTT';
  activo: boolean;
}

/** Master data: Proveedor extended with nombre_comercial */
export interface ProveedorMaestro extends Proveedor {
  nombre_comercial?: string;
  tipo_persona: 'PERSONA_NATURAL' | 'PERSONA_JURIDICA';
  activo: boolean;
}
