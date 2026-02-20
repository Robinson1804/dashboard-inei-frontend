import { useState, useCallback } from 'react';
import type { FilterState } from '../types';

export function useFilters(initialState: FilterState = {}) {
  const [filters, setFilters] = useState<FilterState>(initialState);

  const applyFilters = useCallback((newFilters: FilterState) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const setFilter = useCallback((key: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return { filters, applyFilters, clearFilters, setFilter };
}
