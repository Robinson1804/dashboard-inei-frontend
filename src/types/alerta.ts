export type NivelAlerta = 'critica' | 'advertencia' | 'informativa';

export type TipoAlerta =
  | 'sub_ejecucion'
  | 'ejecucion_moderada'
  | 'sobre_ejecucion'
  | 'saldo_bajo'
  | 'adquisicion_estancada'
  | 'contrato_estancado'
  | 'fraccionamiento_cantidad'
  | 'fraccionamiento_monto';

export type EstadoAlerta = 'no_leida' | 'leida' | 'resuelta';

export interface Alerta {
  id: number;
  tipo: string | null;
  nivel: string | null;
  titulo: string | null;
  descripcion: string | null;
  ue_sigla: string | null;
  modulo: string | null;
  entidad_id: number | null;
  entidad_tipo: string | null;
  leida: boolean;
  resuelta: boolean;
  fecha_generacion: string;
}

export interface AlertaResumen {
  total: number;
  no_leidas: number;
  rojas: number;
  amarillas: number;
  by_modulo: Record<string, number>;
}

/** Alias used by API module - same shape as Alerta */
export type AlertaItem = Alerta;
