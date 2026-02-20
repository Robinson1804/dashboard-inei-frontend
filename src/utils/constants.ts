// ---------------------------------------------------------------------------
// Calendar constants
// ---------------------------------------------------------------------------

export const MESES: string[] = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const MESES_COMPLETOS: string[] = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ---------------------------------------------------------------------------
// Fiscal / domain thresholds
// ---------------------------------------------------------------------------

/** Unidad Impositiva Tributaria for fiscal year 2026 (S/ 5,500). */
export const UIT_2026 = 5_500;

/** Maximum monto for contrataciones menores (≤ 8 UIT = S/ 44,000). */
export const UMBRAL_8_UIT = 8 * UIT_2026; // 44,000

/** Current active fiscal year. */
export const ANIO_ACTUAL = 2026;

/** Earliest fiscal year available in the system. */
export const ANIO_INICIO = 2023;

// ---------------------------------------------------------------------------
// User roles
// ---------------------------------------------------------------------------

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  ESPECIALISTA: 'Especialista',
  CONSULTOR: 'Consultor',
} as const;

export type Rol = typeof ROLES[keyof typeof ROLES];

// ---------------------------------------------------------------------------
// Estados de adquisiciones (> 8 UIT — 22 step process)
// ---------------------------------------------------------------------------

export const ESTADOS_ADQUISICION = {
  EN_PROCESO: 'En Proceso',
  CONVOCADO: 'Convocado',
  ADJUDICADO: 'Adjudicado',
  DESIERTO: 'Desierto',
  CULMINADO: 'Culminado',
} as const;

export type EstadoAdquisicion =
  typeof ESTADOS_ADQUISICION[keyof typeof ESTADOS_ADQUISICION];

// ---------------------------------------------------------------------------
// Estados de contratos menores (≤ 8 UIT — 9 step process)
// ---------------------------------------------------------------------------

export const ESTADOS_CONTRATO = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En Proceso',
  OBSERVADO: 'Observado',
  CULMINADO: 'Culminado',
} as const;

export type EstadoContrato =
  typeof ESTADOS_CONTRATO[keyof typeof ESTADOS_CONTRATO];

// ---------------------------------------------------------------------------
// Estados de hitos (timeline steps)
// ---------------------------------------------------------------------------

export const ESTADOS_HITO = {
  PENDIENTE: 'PENDIENTE',
  EN_CURSO: 'EN_CURSO',
  COMPLETADO: 'COMPLETADO',
  OBSERVADO: 'OBSERVADO',
} as const;

export type EstadoHito = typeof ESTADOS_HITO[keyof typeof ESTADOS_HITO];

// ---------------------------------------------------------------------------
// Fases de adquisición
// ---------------------------------------------------------------------------

export const FASES_ADQUISICION = {
  ACTUACIONES_PREPARATORIAS: 'ACTUACIONES_PREPARATORIAS',
  SELECCION: 'SELECCION',
  EJECUCION_CONTRACTUAL: 'EJECUCION_CONTRACTUAL',
} as const;

// ---------------------------------------------------------------------------
// Tipos de objeto de gasto
// ---------------------------------------------------------------------------

export const TIPOS_OBJETO = {
  BIEN: 'Bien',
  SERVICIO: 'Servicio',
  CONSULTORIA: 'Consultoría',
  OBRA: 'Obra',
} as const;

// ---------------------------------------------------------------------------
// Niveles y estados de alertas
// ---------------------------------------------------------------------------

export const NIVELES_ALERTA = {
  CRITICA: 'critica',
  ADVERTENCIA: 'advertencia',
  INFORMATIVA: 'informativa',
} as const;

export const ESTADOS_ALERTA = {
  NO_LEIDA: 'no_leida',
  LEIDA: 'leida',
  RESUELTA: 'resuelta',
} as const;

// ---------------------------------------------------------------------------
// Formatos de importación (10 Excel formats)
// ---------------------------------------------------------------------------

export const FORMATOS_IMPORTACION = {
  CUADRO_AO_META: 'CUADRO_AO_META',
  TABLAS: 'TABLAS',
  FORMATO_1: 'FORMATO_1',
  FORMATO_2: 'FORMATO_2',
  FORMATO_04: 'FORMATO_04',
  FORMATO_5A: 'FORMATO_5A',
  FORMATO_5B: 'FORMATO_5B',
  FORMATO_5_RESUMEN: 'FORMATO_5_RESUMEN',
  FORMATO_3: 'FORMATO_3',
  ANEXO_01: 'ANEXO_01',
} as const;

// ---------------------------------------------------------------------------
// Semaforo thresholds (% ejecución)
// ---------------------------------------------------------------------------

export const SEMAFORO_THRESHOLDS = {
  VERDE_MIN: 90,   // >= 90% → verde (on track)
  AMARILLO_MIN: 70, // >= 70% and < 90% → amarillo (moderate)
                    // < 70% → rojo (critical)
} as const;

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ---------------------------------------------------------------------------
// API base config
// ---------------------------------------------------------------------------

export const API_BASE_URL = '/api';

// ---------------------------------------------------------------------------
// Design token color map (matches tailwind.config.ts / CSS vars)
// ---------------------------------------------------------------------------

export const COLORS = {
  primary: '#3b82f6',
  sidebar: '#1a2332',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  // Timeline area colors by responsible unit
  otin: '#f97316',   // orange
  dec: '#3b82f6',    // blue
  ota: '#10b981',    // green
  otpp: '#8b5cf6',   // purple
} as const;

// ---------------------------------------------------------------------------
// Area responsable labels
// ---------------------------------------------------------------------------

export const AREAS_RESPONSABLE = {
  OTIN: 'OTIN',
  OTA: 'OTA',
  DEC: 'DEC',
  OTPP: 'OTPP',
  PROVEEDOR: 'PROVEEDOR',
  COMITE: 'COMITÉ',
} as const;

// ---------------------------------------------------------------------------
// Fuentes de financiamiento
// ---------------------------------------------------------------------------

export const FUENTES_FINANCIAMIENTO = [
  { value: '00', label: 'Recursos Ordinarios' },
  { value: '09', label: 'Recursos Directamente Recaudados' },
  { value: '13', label: 'Donaciones y Transferencias' },
] as const;
