'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import MetricsConfigPanel from '@/components/MetricsConfigPanel';
import { mockChartData, mockCampaigns } from '@/lib/mock-data';
import { ALL_METRICS, DEFAULT_DASHBOARD_METRICS, PERIOD_OPTIONS, calcTotals } from '@/lib/metrics-config';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13,
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.value.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_DASHBOARD_METRICS);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const activeCampaigns = mockCampaigns.filter(c => c.status === 'ACTIVE');
  const activeMetricConfigs = useMemo(
    () => selectedMetrics.map(key => ALL_METRICS.find(m => m.key === key)!).filter(Boolean),
    [selectedMetrics]
  );
  const totals = useMemo(() => calcTotals(activeCampaigns, ALL_METRICS), []);

  // Simulated change percentages for KPIs
  const mockChanges: Record<string, { value: string; positive: boolean }> = {
    spend: { value: '+12.5%', positive: true },
    budget: { value: '+5.0%', positive: true },
    impressions: { value: '+8.3%', positive: true },
    clicks: { value: '+15.1%', positive: true },
    ctr: { value: '+0.4%', positive: true },
    cpc: { value: '-8.2%', positive: true },
    conversions: { value: '+22.3%', positive: true },
    roas: { value: '+0.8x', positive: true },
  };

  return (
    <>
      <Header title="Dashboard" subtitle="Visão geral das suas campanhas" />
      <div className="page-content">
        {/* Controls bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
          gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
        }}>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
            {PERIOD_OPTIONS.filter(p => p.key !== 'custom').map(p => (
              <button
                key={p.key}
                className={`btn btn-sm ${selectedPeriod === p.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedPeriod(p.key)}
              >
                {p.label.replace('Últimos ', '')}
              </button>
            ))}
          </div>
          <MetricsConfigPanel
            selectedMetrics={selectedMetrics}
            onMetricsChange={setSelectedMetrics}
          />
        </div>

        {/* KPI Cards — dynamic based on selected metrics */}
        <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          {activeMetricConfigs.map(metric => {
            const change = mockChanges[metric.key];
            return (
              <div key={metric.key} className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-card-label">{metric.label}</span>
                  <div className="kpi-card-icon" style={{ background: `${metric.color}15`, color: metric.color }}>
                    <metric.icon />
                  </div>
                </div>
                <div className="kpi-card-value">{metric.format(totals[metric.key])}</div>
                {change && (
                  <span className={`kpi-card-change ${change.positive ? 'positive' : 'negative'}`}>
                    {change.positive ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                    {change.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3 className="chart-card-title">Gastos por Plataforma</h3>
                <p className="text-sm text-secondary">{PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="gradMeta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877f2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1877f2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGoogle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34a853" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34a853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="meta" name="Meta" stroke="#1877f2" fill="url(#gradMeta)" strokeWidth={2} />
                <Area type="monotone" dataKey="google" name="Google" stroke="#34a853" fill="url(#gradGoogle)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3 className="chart-card-title">Cliques Diários</h3>
                <p className="text-sm text-secondary">{PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="clicks" name="Cliques" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Campanhas Ativas</h2>
            <p className="section-subtitle">{activeCampaigns.length} campanhas em execução</p>
          </div>
        </div>

        {/* Desktop: Table — columns match selected metrics */}
        <div className="table-container desktop-only">
          <table>
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Plataforma</th>
                {activeMetricConfigs.map(m => <th key={m.key}>{m.shortLabel}</th>)}
              </tr>
            </thead>
            <tbody>
              {activeCampaigns.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                      {c.platform === 'meta' ? 'Meta' : 'Google'}
                    </span>
                  </td>
                  {activeMetricConfigs.map(m => (
                    <td key={m.key} style={{
                      fontWeight: m.key === 'roas' ? 700 : 400,
                      color: m.key === 'roas' ? (m.getValue(c) >= 3 ? 'var(--success)' : m.getValue(c) >= 2 ? 'var(--warning)' : 'var(--danger)') : undefined,
                    }}>
                      {m.format(m.getValue(c))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Campaign cards */}
        <div className="mobile-only">
          {activeCampaigns.map(c => (
            <div key={c.id} className="mobile-campaign-card">
              <div className="mobile-campaign-card-header">
                <div>
                  <div className="mobile-campaign-card-name">{c.name}</div>
                  <div className="mobile-campaign-card-objective">{c.objective}</div>
                </div>
                <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                  {c.platform === 'meta' ? 'Meta' : 'Google'}
                </span>
              </div>
              <div className="mobile-campaign-card-metrics">
                {activeMetricConfigs.slice(0, 6).map(m => (
                  <div key={m.key} className="mobile-metric">
                    <div className="mobile-metric-label">{m.shortLabel}</div>
                    <div className="mobile-metric-value" style={{
                      color: m.key === 'roas' ? (m.getValue(c) >= 3 ? 'var(--success)' : 'var(--warning)') : undefined,
                    }}>
                      {m.format(m.getValue(c))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
