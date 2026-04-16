'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import PeriodSelector from '@/components/PeriodSelector';
import { ALL_METRICS, PERIOD_OPTIONS, calcTotals } from '@/lib/metrics-config';
import { useClient } from '@/lib/ClientContext';
import { useMetricsStore } from '@/lib/useMetricsStore';
import { useClientCampaigns } from '@/lib/useClientCampaigns';
import {
  FiFileText, FiDownload, FiSend, FiCalendar, FiEye,
  FiChevronUp, FiChevronDown, FiCheck, FiX, FiSettings, FiUsers,
} from 'react-icons/fi';

interface SavedReport {
  id: string;
  name: string;
  period: string;
  metrics: string[];
  campaigns: string[];
  createdAt: string;
}

export default function ReportsPage() {
  const { selectedClient } = useClient();
  const { selectedPeriod, customDateRange, selectedMetrics, setSelectedMetrics } = useMetricsStore();
  const customRange = selectedPeriod === 'custom' ? customDateRange : null;

  // Report config state
  const [showCreate, setShowCreate] = useState(false);
  const [reportName, setReportName] = useState('');

  // Report-specific metrics
  const [reportMetrics, setReportMetrics] = useState<string[]>(selectedMetrics);

  useEffect(() => {
    if (!showCreate) setReportMetrics(selectedMetrics);
  }, [selectedMetrics, showCreate]);

  const { campaigns, loading, refetch } = useClientCampaigns({
    datePreset: selectedPeriod,
    customRange,
  });

  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  useEffect(() => {
    setSelectedCampaigns(campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'ENABLED').map(c => c.id));
  }, [campaigns]);

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const activeMetrics = useMemo(
    () => reportMetrics.map(key => ALL_METRICS.find(m => m.key === key)!).filter(Boolean),
    [reportMetrics]
  );

  const filteredCampaigns = useMemo(
    () => campaigns.filter(c => selectedCampaigns.includes(c.id)),
    [campaigns, selectedCampaigns]
  );

  const toggleMetric = (key: string) => {
    setReportMetrics(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const moveMetric = (key: string, direction: 'up' | 'down') => {
    setReportMetrics(prev => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const toggleCampaign = (id: string) => {
    setSelectedCampaigns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    ALL_METRICS.forEach(m => {
      if (m.aggregate === 'avg') {
        const values = filteredCampaigns.map(c => m.getValue(c as any)).filter(v => v > 0);
        result[m.key] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      } else {
        result[m.key] = filteredCampaigns.reduce((sum, c) => sum + m.getValue(c as any), 0);
      }
    });
    return result;
  }, [filteredCampaigns]);

  const periodLabel = PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label
    || (selectedPeriod === 'custom' && customDateRange ? `${customDateRange.since} a ${customDateRange.until}` : 'Período personalizado');

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    const newReport: SavedReport = {
      id: `r${Date.now()}`,
      name: reportName || 'Novo Relatório',
      period: periodLabel,
      metrics: [...reportMetrics],
      campaigns: [...selectedCampaigns],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSavedReports(prev => [newReport, ...prev]);
    setGenerating(false);
    setShowCreate(false);
    setShowPreview(true);
    setReportName('');
  };

  return (
    <>
      <Header title="Relatórios" subtitle={selectedClient?.name || 'Relatórios personalizados'} />
      <div className="page-content">
        {!selectedClient && (
          <div style={{
            textAlign: 'center', padding: 'var(--space-xl)',
            background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
          }}>
            <FiUsers size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
            <p style={{ color: 'var(--text-secondary)' }}>Selecione um cliente no menu lateral para criar relatórios</p>
          </div>
        )}

        {selectedClient && (
          <>
            {/* Top Actions */}
            <div className="page-top-bar">
              <p className="text-secondary">{savedReports.length} relatórios salvos</p>
              <button className="btn btn-primary" onClick={() => { setShowCreate(!showCreate); setShowPreview(false); }}>
                <FiSettings /> Criar Relatório
              </button>
            </div>

            {/* Report Builder */}
            {showCreate && (
              <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📊 Configurar Relatório
                </h3>

                <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="input-label">Nome do Relatório</label>
                  <input className="input" placeholder={`Relatório - ${selectedClient.name}`} value={reportName} onChange={e => setReportName(e.target.value)} />
                </div>

                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>📅 Período</label>
                  <PeriodSelector />
                </div>

                {/* Metrics Selector */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>
                    📈 Métricas ({reportMetrics.length} selecionadas)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {ALL_METRICS.map(metric => {
                      const isActive = reportMetrics.includes(metric.key);
                      const order = reportMetrics.indexOf(metric.key);
                      return (
                        <div key={metric.key} style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                          padding: '8px var(--space-md)',
                          background: isActive ? 'var(--accent-primary-glow)' : 'var(--bg-glass)',
                          border: `1px solid ${isActive ? 'var(--border-accent)' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)', opacity: isActive ? 1 : 0.6,
                        }}>
                          <button onClick={() => toggleMetric(metric.key)} style={{
                            width: 22, height: 22, borderRadius: 4,
                            background: isActive ? metric.color : 'var(--bg-glass)',
                            border: `2px solid ${isActive ? metric.color : 'var(--border-color)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'white', flexShrink: 0,
                          }}>
                            {isActive && <FiCheck size={12} />}
                          </button>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: `${metric.color}20`, color: metric.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <metric.icon size={14} />
                          </div>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: isActive ? 600 : 400 }}>{metric.label}</span>
                          {isActive && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 4 }}>#{order + 1}</span>}
                          {isActive && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <button className="btn" style={{ padding: '1px 4px', fontSize: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 3, cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => moveMetric(metric.key, 'up')}><FiChevronUp size={12} /></button>
                              <button className="btn" style={{ padding: '1px 4px', fontSize: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 3, cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => moveMetric(metric.key, 'down')}><FiChevronDown size={12} /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Campaign Selector */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="input-label">🎯 Campanhas ({selectedCampaigns.length} selecionadas)</label>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelectedCampaigns(campaigns.map(c => c.id))}>Todas</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelectedCampaigns([])}>Nenhuma</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-sm)' }}>
                    {campaigns.map(c => (
                      <label key={c.id} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                        padding: '8px 12px',
                        background: selectedCampaigns.includes(c.id) ? 'var(--accent-primary-glow)' : 'var(--bg-glass)',
                        border: `1px solid ${selectedCampaigns.includes(c.id) ? 'var(--border-accent)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13,
                      }}>
                        <input type="checkbox" checked={selectedCampaigns.includes(c.id)} onChange={() => toggleCampaign(c.id)} style={{ accentColor: 'var(--accent-primary)' }} />
                        <span style={{ flex: 1 }}>{c.name}</span>
                        <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`} style={{ fontSize: 11 }}>
                          {c.platform === 'meta' ? 'Meta' : 'Google'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => setShowPreview(!showPreview)}><FiEye /> Preview</button>
                  <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                  <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={generating || reportMetrics.length === 0}>
                    {generating ? <><div className="spinner" /> Gerando...</> : <><FiDownload /> Gerar Relatório</>}
                  </button>
                </div>
              </div>
            )}

            {/* Report Preview */}
            {showPreview && reportMetrics.length > 0 && (
              <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)' }}>
                <div className="section-header">
                  <div>
                    <h3 className="section-title">📋 Preview do Relatório</h3>
                    <p className="section-subtitle">{reportName || 'Relatório'} — {periodLabel}</p>
                  </div>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowPreview(false)}><FiX size={14} /></button>
                </div>

                {/* KPI Summary */}
                <div className="kpi-grid" style={{ marginBottom: 'var(--space-lg)' }}>
                  {activeMetrics.map(m => (
                    <div key={m.key} className="kpi-card" style={{ padding: 'var(--space-md)' }}>
                      <div className="kpi-card-header">
                        <span className="kpi-card-label">{m.label}</span>
                        <div className="kpi-card-icon" style={{ background: `${m.color}15`, color: m.color, width: 28, height: 28 }}>
                          <m.icon size={14} />
                        </div>
                      </div>
                      <div className="kpi-card-value" style={{ fontSize: 20 }}>{m.format(totals[m.key])}</div>
                    </div>
                  ))}
                </div>

                {/* Per-Campaign Table (desktop) */}
                <div className="table-container desktop-only">
                  <table>
                    <thead>
                      <tr>
                        <th>Campanha</th>
                        <th>Plataforma</th>
                        {activeMetrics.map(m => <th key={m.key}>{m.shortLabel}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>
                            <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                              {c.platform === 'meta' ? 'Meta' : 'Google'}
                            </span>
                          </td>
                          {activeMetrics.map(m => (
                            <td key={m.key} style={{
                              fontWeight: m.key === 'roas' ? 700 : 400,
                              color: m.key === 'roas' ? (m.getValue(c as any) >= 3 ? 'var(--success)' : 'var(--danger)') : undefined,
                            }}>
                              {m.format(m.getValue(c as any))}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border-color)' }}>
                        <td>Total / Média</td>
                        <td>—</td>
                        {activeMetrics.map(m => (
                          <td key={m.key} style={{ color: 'var(--accent-primary)' }}>{m.format(totals[m.key])}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="mobile-only">
                  {filteredCampaigns.map(c => (
                    <div key={c.id} className="mobile-campaign-card">
                      <div className="mobile-campaign-card-header">
                        <div><div className="mobile-campaign-card-name">{c.name}</div></div>
                        <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                          {c.platform === 'meta' ? 'Meta' : 'Google'}
                        </span>
                      </div>
                      <div className="mobile-campaign-card-metrics">
                        {activeMetrics.slice(0, 6).map(m => (
                          <div key={m.key} className="mobile-metric">
                            <div className="mobile-metric-label">{m.shortLabel}</div>
                            <div className="mobile-metric-value">{m.format(m.getValue(c as any))}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Reports */}
            <div className="section-header">
              <h2 className="section-title">Relatórios Salvos</h2>
            </div>
            {savedReports.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-text">Nenhum relatório salvo ainda</p>
                <p className="text-sm text-secondary">Crie seu primeiro relatório acima</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {savedReports.map(report => (
                  <div key={report.id} className="card list-card" style={{ padding: 'var(--space-lg)' }}>
                    <div className="list-card-info">
                      <div style={{
                        width: 44, height: 44,
                        background: 'var(--accent-primary-glow)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent-primary)', fontSize: 20, flexShrink: 0,
                      }}>
                        <FiFileText />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{report.name}</h3>
                        <div className="list-card-meta">
                          <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiCalendar size={11} /> {report.period}
                          </span>
                          <span className="text-sm text-secondary">{report.metrics.length} métricas</span>
                          <span className="text-sm text-secondary">{report.campaigns.length} campanhas</span>
                        </div>
                      </div>
                    </div>
                    <div className="list-card-actions">
                      <button className="btn btn-secondary btn-sm"><FiEye size={14} /> Ver</button>
                      <button className="btn btn-primary btn-sm"><FiDownload size={14} /> PDF</button>
                      <button className="btn btn-secondary btn-sm"><FiSend size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
