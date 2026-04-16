'use client';

import { use, useState, useEffect } from 'react';
import { mockKPIs, mockChartData, mockCampaigns } from '@/lib/mock-data';
import { FiTrendingUp, FiBarChart2, FiDollarSign, FiEye, FiMousePointer, FiShoppingCart } from 'react-icons/fi';
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

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [clientName, setClientName] = useState('');

  // Validate the client token
  useEffect(() => {
    // Simple token validation (in production, verify against a database)
    if (token && token.length >= 8) {
      setIsValid(true);
      // Extract client name from token or fetch from API
      setClientName('Empresa ABC');
    } else {
      setIsValid(false);
    }
  }, [token]);

  if (isValid === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Link inválido</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Este link de acesso não é válido ou expirou.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        height: 64, background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--space-xl)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{
            width: 36, height: 36, background: 'var(--accent-gradient)',
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'white',
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AdPilot — Portal do Cliente
          </span>
        </div>
        <span className="text-sm text-secondary">{clientName}</span>
      </header>

      <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)', marginTop: 'var(--space-lg)' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
            Dashboard de Performance
          </h1>
          <p className="text-secondary">Acompanhe os resultados das suas campanhas em tempo real</p>
        </div>

        {/* KPIs */}
        <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          {[
            { label: 'Gasto Total', value: mockKPIs.totalSpend.value, icon: FiDollarSign, color: '#6366f1' },
            { label: 'Impressões', value: mockKPIs.impressions.value, icon: FiEye, color: '#8b5cf6' },
            { label: 'Cliques', value: mockKPIs.clicks.value, icon: FiMousePointer, color: '#3b82f6' },
            { label: 'Conversões', value: mockKPIs.conversions.value, icon: FiShoppingCart, color: '#22c55e' },
            { label: 'ROAS', value: mockKPIs.roas.value, icon: FiTrendingUp, color: '#f59e0b' },
            { label: 'CPA', value: mockKPIs.cpa.value, icon: FiBarChart2, color: '#ef4444' },
          ].map((kpi, i) => (
            <div key={i} className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-card-label">{kpi.label}</span>
                <div className="kpi-card-icon" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                  <kpi.icon />
                </div>
              </div>
              <div className="kpi-card-value">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Gastos por Plataforma</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="gMeta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877f2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1877f2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGoogle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34a853" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34a853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="meta" name="Meta Ads" stroke="#1877f2" fill="url(#gMeta)" strokeWidth={2} />
                <Area type="monotone" dataKey="google" name="Google Ads" stroke="#34a853" fill="url(#gGoogle)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Cliques Diários</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="clicks" name="Cliques" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaigns Summary */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Campanhas Ativas</h3>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Plataforma</th>
                  <th>Impressões</th>
                  <th>Cliques</th>
                  <th>Conversões</th>
                  <th>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {mockCampaigns.filter(c => c.status === 'ACTIVE').map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                        {c.platform === 'meta' ? 'Meta' : 'Google'}
                      </span>
                    </td>
                    <td>{c.impressions.toLocaleString('pt-BR')}</td>
                    <td>{c.clicks.toLocaleString('pt-BR')}</td>
                    <td>{c.conversions.toLocaleString('pt-BR')}</td>
                    <td style={{ color: c.roas >= 3 ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
                      {c.roas > 0 ? `${c.roas}x` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0 var(--space-lg)', color: 'var(--text-tertiary)', fontSize: 13 }}>
          Powered by AdPilot • Relatório atualizado em tempo real
        </div>
      </div>
    </div>
  );
}
