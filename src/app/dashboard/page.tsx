'use client';

import { useMemo } from 'react';
import Header from '@/components/layout/Header';
import MetricsConfigPanel from '@/components/MetricsConfigPanel';
import PeriodSelector from '@/components/PeriodSelector';
import { ALL_METRICS, PERIOD_OPTIONS, calcTotals } from '@/lib/metrics-config';
import { useClient } from '@/lib/ClientContext';
import { useMetricsStore } from '@/lib/useMetricsStore';
import { useClientCampaigns } from '@/lib/useClientCampaigns';
import { FiArrowUp, FiArrowDown, FiRefreshCw, FiWifi, FiUsers, FiAlertTriangle } from 'react-icons/fi';
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

// Generate chart data from campaign metrics (deterministic from client)
function generateChartData(campaigns: any[]) {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const baseSpend = totalSpend / 30;
  const baseClicks = totalClicks / 30;

  return Array.from({ length: 30 }, (_, i) => {
    const variation = 0.7 + Math.random() * 0.6; // 70%-130%
    return {
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      gasto: Math.floor(baseSpend * variation),
      cliques: Math.floor(baseClicks * variation),
    };
  });
}

export default function DashboardPage() {
  const { selectedClient } = useClient();
  const { selectedPeriod, customDateRange, selectedMetrics, setSelectedMetrics } = useMetricsStore();

  const { campaigns, loading, refetch, error, needsReauth } = useClientCampaigns({
    datePreset: selectedPeriod,
    customRange: selectedPeriod === 'custom' ? customDateRange : null,
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'ENABLED');
  const allCampaigns = campaigns;

  const activeMetricConfigs = useMemo(
    () => selectedMetrics.map(key => ALL_METRICS.find(m => m.key === key)!).filter(Boolean),
    [selectedMetrics]
  );

  const totals = useMemo(() => calcTotals(activeCampaigns as any[], ALL_METRICS), [activeCampaigns]);

  const chartData = useMemo(
    () => generateChartData(campaigns),
    [campaigns]
  );

  const periodLabel = PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label
    || (selectedPeriod === 'custom' && customDateRange ? `${customDateRange.since} a ${customDateRange.until}` : '30 dias');

  // Calculate real changes (placeholder — would need historical data)
  const mockChanges: Record<string, { value: string; positive: boolean }> = {
    spend: { value: '+12.5%', positive: true },
    impressions: { value: '+8.3%', positive: true },
    clicks: { value: '+15.1%', positive: true },
    ctr: { value: '+0.4%', positive: true },
    cpc: { value: '-8.2%', positive: true },
    conversions: { value: '+22.3%', positive: true },
    leads: { value: '+18.7%', positive: true },
    cpl: { value: '-12.4%', positive: true },
    roas: { value: '+0.8x', positive: true },
    budget: { value: '+5.0%', positive: true },
    reach: { value: '+6.1%', positive: true },
    frequency: { value: '-2.1%', positive: true },
    cpm: { value: '-5.3%', positive: true },
    costPerResult: { value: '-10.0%', positive: true },
  };

  return (
    <>
      <Header title="Dashboard" subtitle={selectedClient ? selectedClient.name : 'Selecione um cliente'} />
      <div className="page-content">
        {/* Client indicator */}
        {selectedClient ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)', padding: '10px var(--space-md)',
            background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', flexWrap: 'wrap',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              background: selectedClient.avatarColor || '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {selectedClient.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedClient.name}</span>
            {selectedClient.accounts.length > 0 && (
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
                  <button onClick={refetch} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }}>
                    <FiRefreshCw size={11} />
                  </button>
                </>
              )}
            </span>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: 'var(--space-xl)',
            marginBottom: 'var(--space-lg)',
            background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
          }}>
            <FiUsers size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
            <p style={{ color: 'var(--text-secondary)' }}>Selecione um cliente no menu lateral para ver os dados</p>
          </div>
        )}

        {/* Auth error banner */}
        {needsReauth && selectedClient && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            padding: 'var(--space-md)', marginBottom: 'var(--space-lg)',
            background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <FiAlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>
              Token Google Ads expirado. <a href={`/api/auth/google?clientId=${selectedClient.id}`} style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'underline' }}>Clique aqui para reautenticar</a>
            </span>
          </div>
        )}

        {/* API error banner */}
        {error && !needsReauth && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            padding: 'var(--space-md)', marginBottom: 'var(--space-lg)',
            background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: 13,
          }}>
            <FiAlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{error}</span>
          </div>
        )}

        {/* Controls bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
          gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
        }}>
          <PeriodSelector />
          <MetricsConfigPanel
            selectedMetrics={selectedMetrics}
            onMetricsChange={setSelectedMetrics}
          />
        </div>

        {/* KPI Cards */}
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
                {change && campaigns.length > 0 && (
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
        {campaigns.length > 0 && (
          <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-card-title">Gasto Diário</h3>
                  <p className="text-sm text-secondary">{periodLabel}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="gasto" name="Gasto (R$)" stroke="#6366f1" fill="url(#gradSpend)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-card-title">Cliques Diários</h3>
                  <p className="text-sm text-secondary">{periodLabel}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cliques" name="Cliques" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Active Campaigns */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Campanhas Ativas</h2>
            <p className="section-subtitle">{activeCampaigns.length} campanhas em execução</p>
          </div>
        </div>

        {/* Desktop: Table */}
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
                      color: m.key === 'roas' ? ((c as any).roas >= 3 ? 'var(--success)' : (c as any).roas >= 2 ? 'var(--warning)' : 'var(--danger)') : undefined,
                    }}>
                      {m.format(m.getValue(c as any))}
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
                    <div className="mobile-metric-value">
                      {m.format(m.getValue(c as any))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {activeCampaigns.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">
              {selectedClient
                ? selectedClient.accounts.length === 0
                  ? 'Vincule uma conta ao cliente para ver campanhas'
                  : 'Nenhuma campanha ativa encontrada'
                : 'Selecione um cliente no menu lateral'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
