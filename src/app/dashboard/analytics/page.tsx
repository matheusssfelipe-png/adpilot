'use client';

import { useMemo } from 'react';
import Header from '@/components/layout/Header';
import MetricsConfigPanel from '@/components/MetricsConfigPanel';
import PeriodSelector from '@/components/PeriodSelector';
import { mockCampaigns, mockChartData } from '@/lib/mock-data';
import { ALL_METRICS, PERIOD_OPTIONS, calcTotals } from '@/lib/metrics-config';
import { useAdAccount } from '@/lib/AdAccountContext';
import { useMetricsStore } from '@/lib/useMetricsStore';
import { useRealCampaigns } from '@/lib/useRealCampaigns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const platformData = [
  { name: 'Meta Ads', value: 6170, color: '#1877f2' },
  { name: 'Google Ads', value: 6270, color: '#34a853' },
];

const objectiveData = [
  { name: 'Conversões', value: 700 },
  { name: 'Alcance', value: 150 },
  { name: 'Search', value: 310 },
  { name: 'Display', value: 45 },
  { name: 'P. Max', value: 520 },
];

const demographicData = [
  { age: '18-24', male: 15, female: 22 },
  { age: '25-34', male: 28, female: 35 },
  { age: '35-44', male: 22, female: 18 },
  { age: '45-54', male: 12, female: 10 },
  { age: '55-64', male: 5, female: 4 },
  { age: '65+', male: 2, female: 1 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13,
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color || entry.fill, fontWeight: 600 }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { selectedAccount } = useAdAccount();
  const { selectedPeriod, customDateRange, selectedMetrics, setSelectedMetrics } = useMetricsStore();
  const customRange = selectedPeriod === 'custom' ? customDateRange : null;

  // Connect to real data
  const { campaigns: realCampaigns, isRealData } = useRealCampaigns(selectedPeriod, customRange);

  // Use real campaigns if available, otherwise mock
  const accountCampaigns = useMemo(() => {
    if (isRealData && realCampaigns.length > 0) {
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
        leads: c.leads || 0,
        cpl: c.cpl || 0,
        roas: c.roas,
        startDate: c.startDate || new Date().toISOString(),
        endDate: c.stopDate || new Date().toISOString(),
      }));
    }
    return selectedAccount
      ? mockCampaigns.filter(c => c.accountId === selectedAccount.id)
      : mockCampaigns;
  }, [selectedAccount, realCampaigns, isRealData]);

  const activeMetrics = useMemo(
    () => selectedMetrics.map(key => ALL_METRICS.find(m => m.key === key)!).filter(Boolean),
    [selectedMetrics]
  );
  const totals = useMemo(() => calcTotals(accountCampaigns, ALL_METRICS), [accountCampaigns]);

  const rankedCampaigns = [...accountCampaigns].filter(c => c.roas > 0).sort((a, b) => b.roas - a.roas);

  const periodLabel = PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label
    || (selectedPeriod === 'custom' && customDateRange ? `${customDateRange.since} a ${customDateRange.until}` : '30 dias');

  return (
    <>
      <Header title="Análises" subtitle="Análise detalhada de performance" />
      <div className="page-content">
        {/* Controls */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
          gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)',
        }}>
          {/* Period — uses global store */}
          <PeriodSelector />
          <MetricsConfigPanel selectedMetrics={selectedMetrics} onMetricsChange={setSelectedMetrics} />
        </div>

        {/* Dynamic KPI Summary Cards */}
        <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          {activeMetrics.map(m => (
            <div key={m.key} className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-card-label">{m.label}</span>
                <div className="kpi-card-icon" style={{ background: `${m.color}15`, color: m.color }}>
                  <m.icon />
                </div>
              </div>
              <div className="kpi-card-value" style={{ fontSize: 22 }}>{m.format(totals[m.key])}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Impressões ao Longo do Tempo</h3>
              <p className="text-sm text-secondary">{periodLabel}</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="impressions" name="Impressões" stroke="#6366f1" fill="url(#gradImp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Distribuição por Plataforma</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4} strokeWidth={0}>
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-lg)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {platformData.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                  <span className="text-sm">{p.name}</span>
                  <span className="text-sm text-secondary">R$ {p.value.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Conversões por Objetivo</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={objectiveData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Conversões" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Demografia do Público</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={demographicData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="age" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="male" name="Masculino" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" name="Feminino" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking Table - Desktop */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Ranking de Campanhas por ROAS</h3>
          </div>

          {/* Desktop table */}
          <div className="table-container desktop-only" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Campanha</th>
                  <th>Plataforma</th>
                  {activeMetrics.slice(0, 4).map(m => <th key={m.key}>{m.shortLabel}</th>)}
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {rankedCampaigns.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: i === 0 ? '#fbbf24' : 'var(--text-tertiary)' }}>
                      {i === 0 ? '🏆' : `#${i + 1}`}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                        {c.platform === 'meta' ? 'Meta' : 'Google'}
                      </span>
                    </td>
                    {activeMetrics.slice(0, 4).map(m => (
                      <td key={m.key} style={{
                        fontWeight: m.key === 'roas' ? 800 : 400,
                        color: m.key === 'roas' ? (m.getValue(c) >= 5 ? 'var(--success)' : m.getValue(c) >= 3 ? 'var(--accent-primary-hover)' : 'var(--warning)') : undefined,
                      }}>
                        {m.format(m.getValue(c))}
                      </td>
                    ))}
                    <td>
                      <div style={{
                        height: 6, borderRadius: 3, background: 'var(--bg-glass)',
                        width: '100%', maxWidth: 120, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${Math.min((c.roas / 8) * 100, 100)}%`,
                          background: c.roas >= 5 ? 'var(--success)' : c.roas >= 3 ? 'var(--accent-primary)' : 'var(--warning)',
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile ranking cards */}
          <div className="mobile-only">
            {rankedCampaigns.map((c, i) => (
              <div key={c.id} className="mobile-campaign-card">
                <div className="mobile-campaign-card-header">
                  <div>
                    <div className="mobile-campaign-card-name">
                      <span style={{ color: i === 0 ? '#fbbf24' : 'var(--text-tertiary)', marginRight: 6 }}>
                        {i === 0 ? '🏆' : `#${i + 1}`}
                      </span>
                      {c.name}
                    </div>
                  </div>
                  <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                    {c.platform === 'meta' ? 'Meta' : 'Google'}
                  </span>
                </div>
                <div className="mobile-campaign-card-metrics">
                  {activeMetrics.slice(0, 6).map(m => (
                    <div key={m.key} className="mobile-metric">
                      <div className="mobile-metric-label">{m.shortLabel}</div>
                      <div className="mobile-metric-value" style={{
                        color: m.key === 'roas' ? (m.getValue(c) >= 5 ? 'var(--success)' : 'var(--warning)') : undefined,
                      }}>
                        {m.format(m.getValue(c))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Performance bar */}
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    height: 6, borderRadius: 3, background: 'var(--bg-glass)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${Math.min((c.roas / 8) * 100, 100)}%`,
                      background: c.roas >= 5 ? 'var(--success)' : c.roas >= 3 ? 'var(--accent-primary)' : 'var(--warning)',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
