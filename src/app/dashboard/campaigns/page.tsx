'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { mockCampaigns, Campaign, CampaignStatus, Platform } from '@/lib/mock-data';
import { useAdAccount } from '@/lib/AdAccountContext';
import { FiPlay, FiPause, FiEdit2, FiPlus, FiSearch, FiX } from 'react-icons/fi';

const statusLabels: Record<CampaignStatus, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  DRAFT: 'Rascunho',
  ERROR: 'Erro',
};

const statusClass: Record<CampaignStatus, string> = {
  ACTIVE: 'badge-active',
  PAUSED: 'badge-paused',
  DRAFT: 'badge-draft',
  ERROR: 'badge-error',
};

export default function CampaignsPage() {
  const { selectedAccount } = useAdAccount();
  
  // Filter by selected account first
  const accountCampaigns = useMemo(
    () => selectedAccount
      ? mockCampaigns.filter(c => c.accountId === selectedAccount.id)
      : mockCampaigns,
    [selectedAccount]
  );

  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [filterPlatform, setFilterPlatform] = useState<'all' | Platform>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | CampaignStatus>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const currentCampaigns = campaigns.filter(c => 
    selectedAccount ? c.accountId === selectedAccount.id : true
  );

  const filtered = currentCampaigns.filter(c => {
    if (filterPlatform !== 'all' && c.platform !== filterPlatform) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, status: c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
    }));
  };

  return (
    <>
      <Header title="Campanhas" subtitle="Gerencie todas as suas campanhas" />
      <div className="page-content">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-search">
            <FiSearch className="toolbar-search-icon" />
            <input
              className="input w-full"
              placeholder="Buscar campanhas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          <div className="tabs">
            <button className={`tab ${filterPlatform === 'all' ? 'active' : ''}`} onClick={() => setFilterPlatform('all')}>Todas</button>
            <button className={`tab ${filterPlatform === 'meta' ? 'active' : ''}`} onClick={() => setFilterPlatform('meta')}>Meta</button>
            <button className={`tab ${filterPlatform === 'google' ? 'active' : ''}`} onClick={() => setFilterPlatform('google')}>Google</button>
          </div>

          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">Todos Status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="PAUSED">Pausadas</option>
            <option value="DRAFT">Rascunho</option>
          </select>

          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <FiPlus /> Nova Campanha
          </button>
        </div>

        {/* Desktop: Table */}
        <div className="table-container desktop-only">
          <table>
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Plataforma</th>
                <th>Status</th>
                <th>Orçamento</th>
                <th>Gasto</th>
                <th>Impressões</th>
                <th>Cliques</th>
                <th>CTR</th>
                <th>CPC</th>
                <th>Conv.</th>
                <th>ROAS</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                      <div className="text-sm text-secondary">{c.objective}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                      {c.platform === 'meta' ? 'Meta' : 'Google'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusClass[c.status]}`}>
                      <span className="badge-dot" />
                      {statusLabels[c.status]}
                    </span>
                  </td>
                  <td>R$ {c.budget.toLocaleString('pt-BR')}</td>
                  <td>R$ {c.spend.toLocaleString('pt-BR')}</td>
                  <td>{c.impressions.toLocaleString('pt-BR')}</td>
                  <td>{c.clicks.toLocaleString('pt-BR')}</td>
                  <td>{c.ctr}%</td>
                  <td>R$ {c.cpc.toFixed(2)}</td>
                  <td>{c.conversions.toLocaleString('pt-BR')}</td>
                  <td style={{ color: c.roas >= 3 ? 'var(--success)' : c.roas >= 2 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>
                    {c.roas > 0 ? `${c.roas}x` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className={`btn btn-sm ${c.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(c.id)}
                        title={c.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                      >
                        {c.status === 'ACTIVE' ? <FiPause size={14} /> : <FiPlay size={14} />}
                      </button>
                      <button className="btn btn-sm btn-secondary" title="Editar">
                        <FiEdit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Campaign Cards */}
        <div className="mobile-only">
          {filtered.map(c => (
            <div key={c.id} className="mobile-campaign-card">
              <div className="mobile-campaign-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mobile-campaign-card-name">{c.name}</div>
                  <div className="mobile-campaign-card-objective">{c.objective}</div>
                </div>
                <div className="mobile-campaign-card-badges">
                  <span className={`badge ${statusClass[c.status]}`}>
                    <span className="badge-dot" />
                    {statusLabels[c.status]}
                  </span>
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
                  }}>{c.roas > 0 ? `${c.roas}x` : '—'}</div>
                </div>
                <div className="mobile-metric">
                  <div className="mobile-metric-label">CPC</div>
                  <div className="mobile-metric-value">R$ {c.cpc.toFixed(2)}</div>
                </div>
                <div className="mobile-metric">
                  <div className="mobile-metric-label">Cliques</div>
                  <div className="mobile-metric-value">{c.clicks.toLocaleString('pt-BR')}</div>
                </div>
                <div className="mobile-metric">
                  <div className="mobile-metric-label">Conv.</div>
                  <div className="mobile-metric-value">{c.conversions.toLocaleString('pt-BR')}</div>
                </div>
              </div>
              <div className="mobile-campaign-card-actions">
                <button
                  className={`btn btn-sm ${c.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => toggleStatus(c.id)}
                >
                  {c.status === 'ACTIVE' ? <><FiPause size={12} /> Pausar</> : <><FiPlay size={12} /> Ativar</>}
                </button>
                <button className="btn btn-sm btn-secondary">
                  <FiEdit2 size={12} /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">Nenhuma campanha encontrada</p>
            <p className="text-sm text-secondary">Tente ajustar os filtros ou crie uma nova campanha</p>
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Nova Campanha</h2>
                <button className="btn btn-secondary btn-icon" onClick={() => setShowCreateModal(false)}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div className="input-group">
                    <label className="input-label">Nome da Campanha</label>
                    <input className="input" placeholder="Ex: Black Friday - Conversão" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Plataforma</label>
                    <select className="input">
                      <option value="meta">Meta Ads (Facebook / Instagram)</option>
                      <option value="google">Google Ads</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Objetivo</label>
                    <select className="input">
                      <option>Conversões</option>
                      <option>Alcance</option>
                      <option>Tráfego</option>
                      <option>Search</option>
                      <option>Display</option>
                      <option>Performance Max</option>
                    </select>
                  </div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Orçamento Diário (R$)</label>
                      <input className="input" type="number" placeholder="100.00" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Data de Início</label>
                      <input className="input" type="date" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(false)}>Criar Campanha</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
