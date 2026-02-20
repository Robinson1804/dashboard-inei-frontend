// ---------------------------------------------------------------------------
// Importacion module types — aligned with backend schemas
// ---------------------------------------------------------------------------

export type FormatoTipo =
  | 'CUADRO_AO_META'
  | 'TABLAS'
  | 'FORMATO_1'
  | 'FORMATO_2'
  | 'FORMATO_04'
  | 'FORMATO_5A'
  | 'FORMATO_5B'
  | 'FORMATO_5_RESUMEN'
  | 'FORMATO_3'
  | 'ANEXO_01'
  | 'DATOS_MAESTROS'
  | 'SIAF'
  | 'SIGA';

export type TabImportacion = 'formatos' | 'maestros' | 'siaf' | 'siga';

/**
 * Mirrors backend `FormatoCatalogItem`.
 *
 * GET /api/importacion/formatos-catalogo
 */
export interface FormatoCatalogItem {
  key: string;
  nombre: string;
  descripcion: string;
  hoja: string;
  columnas: number;
  fila_inicio: number;
  tiene_plantilla: boolean;
}

export type EstadoValidacion = 'pendiente' | 'validando' | 'valido' | 'con_errores';

export interface ArchivoImportacion {
  nombre: string;
  formato: FormatoTipo;
  tamano: number;
  estado: EstadoValidacion;
}

/**
 * Mirrors backend `ImportacionUploadResponse`.
 *
 * POST /api/importacion/{formatos|datos-maestros|siaf|siga}
 *
 * Fields:
 *   formato_detectado  — Short label of the detected format (e.g. "FORMATO_2", "SIAF").
 *   registros_validos  — Rows that passed validation and were persisted.
 *   registros_error    — Rows skipped due to validation errors.
 *   warnings           — Non-fatal issue messages (plain strings).
 *   errors             — Row-level or file-level error messages (plain strings).
 *   metadata           — Arbitrary audit context (archivo, hoja, ue_detectada, anio, etc.).
 */
export interface ImportacionUploadResponse {
  formato_detectado: string;
  registros_validos: number;
  registros_error: number;
  warnings: string[];
  errors: string[];
  metadata: Record<string, unknown>;
}

/**
 * Mirrors backend `HistorialImportacion`.
 *
 * GET /api/importacion/historial
 *
 * Fields:
 *   id              — Primary key.
 *   formato         — File format label used during import.
 *   archivo_nombre  — Original filename as submitted by the user.
 *   fecha           — ISO-8601 timestamp when the import was processed (UTC).
 *   usuario         — Username of the user who uploaded the file.
 *   ue              — Sigla of the UnidadEjecutora, or null for global imports.
 *   registros_ok    — Rows successfully persisted.
 *   registros_error — Rows rejected during validation.
 *   estado          — "EXITOSO" | "PARCIAL" | "FALLIDO" (uppercase from backend).
 */
export interface HistorialImportacion {
  id: number;
  formato: string;
  archivo_nombre: string;
  fecha: string;
  usuario: string;
  ue: string | null;
  registros_ok: number;
  registros_error: number;
  estado: 'EXITOSO' | 'PARCIAL' | 'FALLIDO';
}

// ---------------------------------------------------------------------------
// Format status dashboard (GET /api/importacion/estado-formatos)
// ---------------------------------------------------------------------------

export type CategoriaFormato = 'DATOS_MAESTROS' | 'FORMATOS_DDNNTT' | 'SISTEMAS_EXTERNOS';
export type EstadoCarga = 'SIN_CARGAR' | 'EXITOSO' | 'PARCIAL' | 'FALLIDO';

export interface FormatoEstadoItem {
  formato: string;
  plantilla_key: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaFormato;
  es_requerido: boolean;
  tiene_plantilla: boolean;
  impacto: string;
  upload_endpoint: string;
  ultima_carga: string | null;
  estado: EstadoCarga;
  registros_ok: number;
  usuario_ultima_carga: string | null;
}

export interface EstadoFormatosResponse {
  formatos: FormatoEstadoItem[];
  total: number;
  cargados_exitosos: number;
  cargados_parcial: number;
  sin_cargar: number;
  requeridos_faltantes: number;
}
