'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { mockCampaigns, mockChartData } from '@/lib/mock-data';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const pieColors = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

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
  const [period, setPeriod] = useState('30d');

  const totalConversions = mockCampaigns.reduce((s, c) => s + c.conversions, 0);
  const totalSpend = mockCampaigns.reduce((s, c) => s + c.spend, 0);
  const avgRoas = (mockCampaigns.filter(c => c.roas > 0).reduce((s, c) => s + c.roas, 0) / mockCampaigns.filter(c => c.roas > 0).length).toFixed(1);

  return (
    <>
      <Header title="Análises" subtitle="Análise detalhada de performance" />
      <div className="page-content">
        {/* Period selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
          <div className="tabs">
            {['7d', '14d', '30d', '90d'].map(p => (
              <button key={p} className={`tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                {p === '7d' ? '7 dias' : p === '14d' ? '14 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="text-sm text-secondary">Total Conversões</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{totalConversions.toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="text-sm text-secondary">Total Gasto</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>R$ {totalSpend.toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="text-sm text-secondary">ROAS Médio</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary-hover)' }}>{avgRoas}x</div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Impressões ao Longo do Tempo</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
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
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={4} strokeWidth={0}>
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)', marginTop: 'var(--space-sm)' }}>
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={objectiveData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Conversões" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Demografía do Público</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={demographicData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="age" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="male" name="Masculino" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" name="Feminino" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Ranking de Campanhas por ROAS</h3>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Campanha</th>
                  <th>Plataforma</th>
                  <th>Conversões</th>
                  <th>Gasto</th>
                  <th>ROAS</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {[...mockCampaigns].filter(c => c.roas > 0).sort((a, b) => b.roas - a.roas).map((c, i) => (
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
                    <td>{c.conversions.toLocaleString('pt-BR')}</td>
                    <td>R$ {c.spend.toLocaleString('pt-BR')}</td>
                    <td style={{ fontWeight: 800, color: c.roas >= 5 ? 'var(--success)' : c.roas >= 3 ? 'var(--accent-primary-hover)' : 'var(--warning)' }}>
                      {c.roas}x
                    </td>
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
        </div>
      </div>
    </>
  );
}
