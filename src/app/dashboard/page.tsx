'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import MetricsConfigPanel from '@/components/MetricsConfigPanel';
import { mockCampaigns } from '@/lib/mock-data';
import { ALL_METRICS, DEFAULT_DASHBOARD_METRICS, PERIOD_OPTIONS, calcTotals } from '@/lib/metrics-config';
import { useAdAccount } from '@/lib/AdAccountContext';
import { useRealCampaigns } from '@/lib/useRealCampaigns';
import { FiArrowUp, FiArrowDown, FiRefreshCw, FiWifi } from 'react-icons/fi';
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

// Generate chart data based on account (deterministic seed from accountId)
function generateChartData(accountId: string) {
  const seed = accountId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2026, 2, i + 1).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    meta: Math.floor(((Math.sin(seed + i * 0.7) + 1) / 2) * 500 + 300),
    google: Math.floor(((Math.cos(seed + i * 0.5) + 1) / 2) * 400 + 200),
    clicks: Math.floor(((Math.sin(seed + i * 1.1) + 1) / 2) * 2000 + 800),
  }));
}

export default function DashboardPage() {
  const { selectedAccount } = useAdAccount();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_DASHBOARD_METRICS);
  const [selectedPeriod, setSelectedPeriod] = useState('last_30d');
  
  // Pass selectedPeriod to hook so it refetches when period changes
  const { campaigns: realCampaigns, loading, isRealData, refetch } = useRealCampaigns(selectedPeriod);

  // Use real campaigns if available, otherwise mock
  const accountCampaigns = useMemo(() => {
    if (isRealData && realCampaigns.length > 0) {
      // Convert real campaigns to mock format for compatibility with metrics system
      return realCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status as any,
        objective: c.objective,
        platform: c.platform as 'meta' | 'google',
        accountId: c.accountId,
        budget: c.budget,
        spend: c.spend,
        impressions: c.impressions,
        clicks: c.clicks,
        ctr: c.ctr,
        cpc: c.cpc,
        conversions: c.conversions,
        leads: c.leads,
        cpl: c.cpl,
        roas: c.roas,
        startDate: c.startDate || new Date().toISOString(),
        endDate: c.stopDate || new Date().toISOString(),
      }));
    }
    // Fallback to mock data
    return selectedAccount
      ? mockCampaigns.filter(c => c.accountId === selectedAccount.id)
      : mockCampaigns;
  }, [selectedAccount, realCampaigns, isRealData]);

  const activeCampaigns = accountCampaigns.filter(c => c.status === 'ACTIVE');
  const allCampaigns = accountCampaigns;

  const activeMetricConfigs = useMemo(
    () => selectedMetrics.map(key => ALL_METRICS.find(m => m.key === key)!).filter(Boolean),
    [selectedMetrics]
  );
  const totals = useMemo(() => calcTotals(activeCampaigns, ALL_METRICS), [activeCampaigns]);

  const chartData = useMemo(
    () => generateChartData(selectedAccount?.id || 'default'),
    [selectedAccount]
  );

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
      <Header title="Dashboard" subtitle={selectedAccount ? selectedAccount.name : 'Visão geral'} />
      <div className="page-content">
        {/* Account indicator */}
        {selectedAccount && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)', padding: '10px var(--space-md)',
            background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', flexWrap: 'wrap',
          }}>
            <span className={`badge ${selectedAccount.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
              {selectedAccount.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedAccount.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>• {selectedAccount.businessName}</span>
            {isRealData && (
              <span className="badge badge-active" style={{ fontSize: 10 }}>
                <FiWifi size={10} /> Dados reais
              </span>
            )}
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {loading ? (
                <span style={{ fontSize: 12, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiRefreshCw size={12} className="spin" /> Carregando...
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {allCampaigns.length} campanhas • {activeCampaigns.length} ativas
                  </span>
                  {isRealData && (
                    <button onClick={refetch} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }}>
                      <FiRefreshCw size={11} />
                    </button>
                  )}
                </>
              )}
            </span>
          </div>
        )}

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
              <AreaChart data={chartData}>
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
              <BarChart data={chartData}>
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

        {activeCampaigns.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">Nenhuma campanha ativa nesta conta</p>
            <p className="text-sm text-secondary">Troque de conta ou crie uma nova campanha</p>
          </div>
        )}
      </div>
    </>
  );
}
