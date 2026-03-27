'use client';

import Header from '@/components/layout/Header';
import { mockKPIs, mockChartData, mockCampaigns } from '@/lib/mock-data';
import { FiDollarSign, FiEye, FiMousePointer, FiPercent, FiTrendingUp, FiShoppingCart, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const kpiConfig = [
  { key: 'totalSpend', label: 'Gasto Total', icon: FiDollarSign, color: '#6366f1' },
  { key: 'impressions', label: 'Impressões', icon: FiEye, color: '#8b5cf6' },
  { key: 'clicks', label: 'Cliques', icon: FiMousePointer, color: '#3b82f6' },
  { key: 'ctr', label: 'CTR', icon: FiPercent, color: '#22c55e' },
  { key: 'conversions', label: 'Conversões', icon: FiShoppingCart, color: '#f59e0b' },
  { key: 'roas', label: 'ROAS', icon: FiTrendingUp, color: '#ef4444' },
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
        <p key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.value.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const activeCampaigns = mockCampaigns.filter(c => c.status === 'ACTIVE');

  return (
    <>
      <Header title="Dashboard" subtitle="Visão geral das suas campanhas" />
      <div className="page-content">
        {/* KPI Cards */}
        <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          {kpiConfig.map(({ key, label, icon: Icon, color }) => {
            const data = mockKPIs[key as keyof typeof mockKPIs];
            return (
              <div key={key} className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-card-label">{label}</span>
                  <div className="kpi-card-icon" style={{ background: `${color}15`, color }}>
                    <Icon />
                  </div>
                </div>
                <div className="kpi-card-value">{data.value}</div>
                <span className={`kpi-card-change ${data.positive ? 'positive' : 'negative'}`}>
                  {data.positive ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                  {data.change}
                </span>
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
                <p className="text-sm text-secondary">Últimos 30 dias</p>
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
                <p className="text-sm text-secondary">Últimos 30 dias</p>
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

        {/* Active Campaigns - Desktop Table */}
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
                <th>Gasto</th>
                <th>Impressões</th>
                <th>Cliques</th>
                <th>CTR</th>
                <th>ROAS</th>
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
                  <td>R$ {c.spend.toLocaleString('pt-BR')}</td>
                  <td>{c.impressions.toLocaleString('pt-BR')}</td>
                  <td>{c.clicks.toLocaleString('pt-BR')}</td>
                  <td>{c.ctr}%</td>
                  <td style={{ color: c.roas >= 3 ? 'var(--success)' : c.roas >= 2 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>
                    {c.roas}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Cards */}
        <div className="mobile-only">
          {activeCampaigns.map(c => (
            <div key={c.id} className="mobile-campaign-card">
              <div className="mobile-campaign-card-header">
                <div>
                  <div className="mobile-campaign-card-name">{c.name}</div>
                  <div className="mobile-campaign-card-objective">{c.objective}</div>
                </div>
                <div className="mobile-campaign-card-badges">
                  <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                    {c.platform === 'meta' ? 'Meta' : 'Google'}
                  </span>
                </div>
              </div>
              <div className="mobile-campaign-card-metrics">
                <div className="mobile-metric">
                  <div className="mobile-metric-label">Gasto</div>
                  <div className="mobile-metric-value">R$ {c.spend.toLocaleString('pt-BR')}</div>
                </div>
                <div className="mobile-metric">
                  <div className="mobile-metric-label">CTR</div>
                  <div className="mobile-metric-value">{c.ctr}%</div>
                </div>
                <div className="mobile-metric">
                  <div className="mobile-metric-label">ROAS</div>
                  <div className="mobile-metric-value" style={{
                    color: c.roas >= 3 ? 'var(--success)' : c.roas >= 2 ? 'var(--warning)' : 'var(--danger)'
                  }}>{c.roas}x</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
