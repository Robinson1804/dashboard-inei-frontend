/**
 * API module barrel export.
 * Import from '@/api' to access all API functions.
 *
 * Example:
 *   import { presupuesto, auth, alertas } from '@/api';
 *   const kpis = await presupuesto.getKpis({ anio: 2026 });
 */

export { default as apiClient } from './client';

export * as auth from './auth';
export * as presupuesto from './presupuesto';
export * as adquisiciones from './adquisiciones';
export * as contratosMenores from './contratosMenores';
export * as actividadesOperativas from './actividadesOperativas';
export * as alertas from './alertas';
export * as importacion from './importacion';
export * as datosMaestros from './datosMaestros';
export * as exportacion from './exportacion';
