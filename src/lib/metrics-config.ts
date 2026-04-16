import {
  FiDollarSign, FiEye, FiMousePointer, FiPercent,
  FiTrendingUp, FiShoppingCart, FiTarget, FiUsers, FiRadio, FiRepeat
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
    format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    getValue: (c) => c.spend,
  },
  {
    key: 'budget', label: 'Orçamento', shortLabel: 'Budget',
    icon: FiTarget, color: '#8b5cf6', aggregate: 'sum',
    format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    getValue: (c) => c.budget,
  },
  {
    key: 'impressions', label: 'Impressões', shortLabel: 'Impr.',
    icon: FiEye, color: '#3b82f6', aggregate: 'sum',
    format: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
    getValue: (c) => c.impressions,
  },
  {
    key: 'reach', label: 'Alcance', shortLabel: 'Alcance',
    icon: FiUsers, color: '#0ea5e9', aggregate: 'sum',
    format: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
    getValue: (c) => (c as any).reach || Math.floor(c.impressions * 0.7),
  },
  {
    key: 'frequency', label: 'Frequência', shortLabel: 'Freq.',
    icon: FiRepeat, color: '#a855f7', aggregate: 'avg',
    format: (v) => v.toFixed(2),
    getValue: (c) => (c as any).frequency || (c.impressions > 0 ? +(c.impressions / Math.max(Math.floor(c.impressions * 0.7), 1)).toFixed(2) : 0),
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
    key: 'cpm', label: 'CPM', shortLabel: 'CPM',
    icon: FiRadio, color: '#f97316', aggregate: 'avg',
    format: (v) => `R$ ${v.toFixed(2)}`,
    getValue: (c) => (c as any).cpm || (c.impressions > 0 ? +((c.spend / c.impressions) * 1000).toFixed(2) : 0),
  },
  {
    key: 'conversions', label: 'Conversões', shortLabel: 'Conv.',
    icon: FiShoppingCart, color: '#ef4444', aggregate: 'sum',
    format: (v) => v.toLocaleString('pt-BR'),
    getValue: (c) => c.conversions,
  },
  {
    key: 'leads', label: 'Leads', shortLabel: 'Leads',
    icon: FiTarget, color: '#ec4899', aggregate: 'sum',
    format: (v) => v.toLocaleString('pt-BR'),
    getValue: (c) => c.leads || 0,
  },
  {
    key: 'cpl', label: 'Custo por Lead', shortLabel: 'CPL',
    icon: FiDollarSign, color: '#f43f5e', aggregate: 'avg',
    format: (v) => `R$ ${v.toFixed(2)}`,
    getValue: (c) => c.cpl || 0,
  },
  {
    key: 'costPerResult', label: 'Custo por Resultado', shortLabel: 'CPR',
    icon: FiDollarSign, color: '#14b8a6', aggregate: 'avg',
    format: (v) => `R$ ${v.toFixed(2)}`,
    getValue: (c) => {
      const results = (c.conversions || 0) + (c.leads || 0);
      return results > 0 ? +(c.spend / results).toFixed(2) : 0;
    },
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
    if (m.aggregate === 'avg') {
      // Include all campaigns in average calculation (campaigns with 0 are still valid)
      result[m.key] = campaigns.length
        ? campaigns.reduce((sum, c) => sum + m.getValue(c), 0) / campaigns.length
        : 0;
    } else {
      result[m.key] = campaigns.reduce((sum, c) => sum + m.getValue(c), 0);
    }
  });
  return result;
}

/** Default metrics for dashboard */
export const DEFAULT_DASHBOARD_METRICS = ['spend', 'impressions', 'clicks', 'leads', 'conversions', 'roas'];

/** Period options (preset list) */
export const PERIOD_OPTIONS = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'last_7d', label: '7 dias' },
  { key: 'last_14d', label: '14 dias' },
  { key: 'last_30d', label: '30 dias' },
  { key: 'last_90d', label: '90 dias' },
  { key: 'custom', label: 'Personalizado' },
];

/** Convert a period preset key to a concrete { since, until } date range (for mock/chart data) */
export function periodToDateRange(period: string, customRange?: { since: string; until: string } | null): { since: Date; until: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'custom' && customRange) {
    return { since: new Date(customRange.since), until: new Date(customRange.until) };
  }

  switch (period) {
    case 'today':
      return { since: today, until: today };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { since: y, until: y };
    }
    case 'last_7d': {
      const s = new Date(today);
      s.setDate(s.getDate() - 7);
      return { since: s, until: today };
    }
    case 'last_14d': {
      const s = new Date(today);
      s.setDate(s.getDate() - 14);
      return { since: s, until: today };
    }
    case 'last_90d': {
      const s = new Date(today);
      s.setDate(s.getDate() - 90);
      return { since: s, until: today };
    }
    case 'last_30d':
    default: {
      const s = new Date(today);
      s.setDate(s.getDate() - 30);
      return { since: s, until: today };
    }
  }
}
