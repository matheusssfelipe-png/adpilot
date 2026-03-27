'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { mockCampaigns } from '@/lib/mock-data';
import { FiFileText, FiDownload, FiSend, FiCalendar, FiEye, FiCheck } from 'react-icons/fi';

interface Report {
  id: string;
  name: string;
  period: string;
  campaigns: number;
  createdAt: string;
  status: 'ready' | 'generating';
}

const mockReports: Report[] = [
  { id: 'r1', name: 'Relatório Mensal - Março 2026', period: '01/03 - 31/03', campaigns: 6, createdAt: '2026-03-25', status: 'ready' },
  { id: 'r2', name: 'Relatório Semanal - Sem 12', period: '17/03 - 23/03', campaigns: 4, createdAt: '2026-03-23', status: 'ready' },
  { id: 'r3', name: 'Performance Black Friday', period: '01/03 - 15/03', campaigns: 3, createdAt: '2026-03-15', status: 'ready' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [showCreate, setShowCreate] = useState(false);
  const [reportName, setReportName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const toggleCampaign = (id: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 3000));
    const newReport: Report = {
      id: `r${Date.now()}`,
      name: reportName || 'Novo Relatório',
      period: `${startDate} - ${endDate}`,
      campaigns: selectedCampaigns.length || mockCampaigns.length,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ready',
    };
    setReports(prev => [newReport, ...prev]);
    setGenerating(false);
    setShowCreate(false);
    setReportName('');
  };

  return (
    <>
      <Header title="Relatórios" subtitle="Gere e exporte relatórios para seus clientes" />
      <div className="page-content">
        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
          <div>
            <p className="text-secondary">{reports.length} relatórios gerados</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <FiFileText /> Novo Relatório
          </button>
        </div>

        {/* Create Report Form */}
        {showCreate && (
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
              📊 Configurar Relatório
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label className="input-label">Nome do Relatório</label>
                <input
                  className="input"
                  placeholder="Ex: Relatório Mensal - Cliente X"
                  value={reportName}
                  onChange={e => setReportName(e.target.value)}
                />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Data Início</label>
                  <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Data Fim</label>
                  <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Campanhas (selecione as que deseja incluir)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {mockCampaigns.map(c => (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                        padding: 'var(--space-sm) var(--space-md)',
                        background: selectedCampaigns.includes(c.id) ? 'var(--accent-primary-glow)' : 'var(--bg-glass)',
                        border: `1px solid ${selectedCampaigns.includes(c.id) ? 'var(--border-accent)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', fontSize: 14,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.includes(c.id)}
                        onChange={() => toggleCampaign(c.id)}
                        style={{ accentColor: 'var(--accent-primary)' }}
                      />
                      <span style={{ flex: 1 }}>{c.name}</span>
                      <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                        {c.platform === 'meta' ? 'Meta' : 'Google'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={generating}>
                  {generating ? <><div className="spinner" /> Gerando PDF...</> : <><FiDownload /> Gerar Relatório</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {reports.map(report => (
            <div key={report.id} className="card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-lg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                <div style={{
                  width: 48, height: 48,
                  background: 'var(--accent-primary-glow)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-primary)', fontSize: 22,
                }}>
                  <FiFileText />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{report.name}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
                    <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCalendar size={12} /> {report.period}
                    </span>
                    <span className="text-sm text-secondary">
                      {report.campaigns} campanhas
                    </span>
                    <span className="text-sm text-secondary">
                      Criado em {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary btn-sm">
                  <FiEye size={14} /> Visualizar
                </button>
                <button className="btn btn-primary btn-sm">
                  <FiDownload size={14} /> PDF
                </button>
                <button className="btn btn-secondary btn-sm">
                  <FiSend size={14} /> Enviar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
