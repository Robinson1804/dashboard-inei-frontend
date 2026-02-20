import type { SemaforoColor } from '@/types';

/**
 * Formats a number as Peruvian Sol currency.
 * Automatically abbreviates millions (M) and thousands (K).
 */
export function formatMonto(value: number, abbreviated = true): string {
  if (!isFinite(value)) return 'S/ —';
  const abs = Math.abs(value);
  if (abbreviated) {
    if (abs >= 1_000_000) {
      return `S/ ${(value / 1_000_000).toFixed(2)}M`;
    }
    if (abs >= 1_000) {
      return `S/ ${(value / 1_000).toFixed(0)}K`;
    }
  }
  return `S/ ${value.toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Formats a number as a percentage string with one decimal place.
 */
export function formatPercent(value: number, decimals = 1): string {
  if (!isFinite(value)) return '—%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Returns the semáforo color classification for a given execution percentage.
 * Verde:    >= 90%
 * Amarillo: >= 70% and < 90%
 * Rojo:     < 70%
 */
export function getSemaforoColor(pct: number): SemaforoColor {
  if (pct >= 90) return 'verde';
  if (pct >= 70) return 'amarillo';
  return 'rojo';
}

/**
 * Returns Tailwind CSS color classes for a semáforo level.
 */
export function getSemaforoClasses(nivel: SemaforoColor): {
  bg: string;
  text: string;
  dot: string;
  border: string;
} {
  const n = nivel.toLowerCase();
  switch (n) {
    case 'verde':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        dot: 'bg-green-500',
        border: 'border-green-200',
      };
    case 'amarillo':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        border: 'border-amber-200',
      };
    case 'rojo':
    default:
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        dot: 'bg-red-500',
        border: 'border-red-200',
      };
  }
}

/**
 * Formats a date string or ISO date to a localized Peruvian display format.
 */
export function formatFecha(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a datetime string to a localized display with time.
 */
export function formatFechaHora(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a numeric value as full Peruvian soles with 2 decimal places.
 * Example: 1234567.89 → "S/ 1,234,567.89"
 * Use formatMonto(value, false) for the same result via the main function.
 */
export function formatMontoCompleto(value: number): string {
  if (!isFinite(value)) return 'S/ —';
  return `S/ ${value.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Returns a Tailwind CSS class string for semaforo color chips.
 * Compatible with the design tokens: success (#10b981), warning (#f59e0b), danger (#ef4444).
 */
export function getSemaforoClass(nivel: SemaforoColor): string {
  const classMap: Record<string, string> = {
    verde: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    amarillo: 'bg-amber-100 text-amber-700 border border-amber-200',
    rojo: 'bg-red-100 text-red-700 border border-red-200',
  };
  return classMap[nivel.toLowerCase()] ?? classMap.rojo;
}

/**
 * Formats a plain number with thousands separators (no currency symbol).
 * Example: 1234567 → "1,234,567"
 */
export function formatNumber(value: number): string {
  if (!isFinite(value)) return '—';
  return value.toLocaleString('es-PE');
}
