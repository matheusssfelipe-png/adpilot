import {
  FiDollarSign, FiEye, FiMousePointer, FiPercent,
  FiTrendingUp, FiShoppingCart, FiTarget
} from 'react-icons/fi';
import { Campaign } from './mock-data';

export interface MetricConfig {
  key: string;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
  format: (value: number) => string;
  getValue: (c: Campaign) => number;
  /** For KPI display - how to aggregate across campaigns */
  aggregate: 'sum' | 'avg';
}

export const ALL_METRICS: MetricConfig[] = [
  {
    key: 'spend', label: 'Gasto', shortLabel: 'Gasto',
    icon: FiDollarSign, color: '#6366f1', aggregate: 'sum',
    format: (v) => `R$ ${v.toLocaleString('pt-BR')}`,
    getValue: (c) => c.spend,
  },
  {
    key: 'budget', label: 'Orçamento', shortLabel: 'Budget',
    icon: FiTarget, color: '#8b5cf6', aggregate: 'sum',
    format: (v) => `R$ ${v.toLocaleString('pt-BR')}`,
    getValue: (c) => c.budget,
  },
  {
    key: 'impressions', label: 'Impressões', shortLabel: 'Impr.',
    icon: FiEye, color: '#3b82f6', aggregate: 'sum',
    format: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
    getValue: (c) => c.impressions,
  },
  {
    key: 'clicks', label: 'Cliques', shortLabel: 'Cliques',
    icon: FiMousePointer, color: '#06b6d4', aggregate: 'sum',
    format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
    getValue: (c) => c.clicks,
  },
  {
    key: 'ctr', label: 'CTR (%)', shortLabel: 'CTR',
    icon: FiPercent, color: '#22c55e', aggregate: 'avg',
    format: (v) => `${v.toFixed(2)}%`,
    getValue: (c) => c.ctr,
  },
  {
    key: 'cpc', label: 'CPC', shortLabel: 'CPC',
    icon: FiDollarSign, color: '#f59e0b', aggregate: 'avg',
    format: (v) => `R$ ${v.toFixed(2)}`,
    getValue: (c) => c.cpc,
  },
  {
    key: 'conversions', label: 'Conversões', shortLabel: 'Conv.',
    icon: FiShoppingCart, color: '#ef4444', aggregate: 'sum',
    format: (v) => v.toLocaleString('pt-BR'),
    getValue: (c) => c.conversions,
  },
  {
    key: 'roas', label: 'ROAS', shortLabel: 'ROAS',
    icon: FiTrendingUp, color: '#10b981', aggregate: 'avg',
    format: (v) => v > 0 ? `${v.toFixed(1)}x` : '—',
    getValue: (c) => c.roas,
  },
];

/** Calculate aggregated totals for a set of campaigns */
export function calcTotals(campaigns: Campaign[], metrics: MetricConfig[]): Record<string, number> {
  const result: Record<string, number> = {};
  metrics.forEach(m => {
    const values = campaigns.map(c => m.getValue(c)).filter(v => v > 0);
    if (m.aggregate === 'avg') {
      result[m.key] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    } else {
      result[m.key] = campaigns.reduce((sum, c) => sum + m.getValue(c), 0);
    }
  });
  return result;
}

/** Default metrics for dashboard */
export const DEFAULT_DASHBOARD_METRICS = ['spend', 'impressions', 'clicks', 'ctr', 'conversions', 'roas'];

/** Period options */
export const PERIOD_OPTIONS = [
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '14d', label: 'Últimos 14 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
  { key: '90d', label: 'Últimos 90 dias' },
  { key: 'custom', label: 'Personalizado' },
];
