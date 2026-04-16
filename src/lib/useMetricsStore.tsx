'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DEFAULT_DASHBOARD_METRICS } from './metrics-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomDateRange {
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
}

interface MetricsStoreContextType {
  // Period
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  customDateRange: CustomDateRange | null;
  setCustomDateRange: (range: CustomDateRange | null) => void;

  // Metrics
  selectedMetrics: string[];
  setSelectedMetrics: (metrics: string[]) => void;

  // Helper – returns query-string params for API calls
  getDateParams: () => { datePreset?: string; since?: string; until?: string };
}

const MetricsStoreContext = createContext<MetricsStoreContextType | null>(null);

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_PERIOD = 'adpilot_period';
const STORAGE_KEY_CUSTOM_RANGE = 'adpilot_custom_range';
const STORAGE_KEY_METRICS = 'adpilot_metrics';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MetricsStoreProvider({ children }: { children: React.ReactNode }) {
  const initialised = useRef(false);

  const [selectedPeriod, _setSelectedPeriod] = useState<string>('last_30d');
  const [customDateRange, _setCustomDateRange] = useState<CustomDateRange | null>(null);
  const [selectedMetrics, _setSelectedMetrics] = useState<string[]>(DEFAULT_DASHBOARD_METRICS);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    _setSelectedPeriod(loadFromStorage(STORAGE_KEY_PERIOD, 'last_30d'));
    _setCustomDateRange(loadFromStorage(STORAGE_KEY_CUSTOM_RANGE, null));
    _setSelectedMetrics(loadFromStorage(STORAGE_KEY_METRICS, DEFAULT_DASHBOARD_METRICS));
  }, []);

  // Wrapped setters that also persist
  const setSelectedPeriod = useCallback((period: string) => {
    _setSelectedPeriod(period);
    saveToStorage(STORAGE_KEY_PERIOD, period);
  }, []);

  const setCustomDateRange = useCallback((range: CustomDateRange | null) => {
    _setCustomDateRange(range);
    saveToStorage(STORAGE_KEY_CUSTOM_RANGE, range);
  }, []);

  const setSelectedMetrics = useCallback((metrics: string[]) => {
    _setSelectedMetrics(metrics);
    saveToStorage(STORAGE_KEY_METRICS, metrics);
  }, []);

  // Build API query params
  const getDateParams = useCallback(() => {
    if (selectedPeriod === 'custom' && customDateRange) {
      return { since: customDateRange.since, until: customDateRange.until };
    }
    return { datePreset: selectedPeriod };
  }, [selectedPeriod, customDateRange]);

  return (
    <MetricsStoreContext.Provider value={{
      selectedPeriod,
      setSelectedPeriod,
      customDateRange,
      setCustomDateRange,
      selectedMetrics,
      setSelectedMetrics,
      getDateParams,
    }}>
      {children}
    </MetricsStoreContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMetricsStore() {
  const ctx = useContext(MetricsStoreContext);
  if (!ctx) throw new Error('useMetricsStore must be used within MetricsStoreProvider');
  return ctx;
}
