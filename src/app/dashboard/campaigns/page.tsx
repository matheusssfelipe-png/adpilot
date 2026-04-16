'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import PeriodSelector from '@/components/PeriodSelector';
import { mockCampaigns, Campaign, CampaignStatus, Platform } from '@/lib/mock-data';
import { useAdAccount } from '@/lib/AdAccountContext';
import { useMetricsStore } from '@/lib/useMetricsStore';
import { useRealCampaigns } from '@/lib/useRealCampaigns';
import { useAdSets } from '@/lib/useAdSets';
import { useAds } from '@/lib/useAds';
import { FiPlay, FiPause, FiEdit2, FiPlus, FiSearch, FiX, FiWifi, FiRefreshCw, FiChevronRight } from 'react-icons/fi';

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  DRAFT: 'Rascunho',
  ERROR: 'Erro',
  DELETED: 'Excluída',
  ARCHIVED: 'Arquivada',
};

const statusClass: Record<string, string> = {
  ACTIVE: 'badge-active',
  PAUSED: 'badge-paused',
  DRAFT: 'badge-draft',
  ERROR: 'badge-error',
  DELETED: 'badge-draft',
  ARCHIVED: 'badge-draft',
};

export default function CampaignsPage() {
  const { selectedAccount } = useAdAccount();
  const { selectedPeriod, customDateRange } = useMetricsStore();
  const customRange = selectedPeriod === 'custom' ? customDateRange : null;
  
  // View state
  const [selectedCampaign, setSelectedCampaign] = useState<{ id: string, name: string } | null>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<{ id: string, name: string } | null>(null);

  const { campaigns: realCampaigns, loading: campaignsLoading, isRealData, refetch: refetchCampaigns } = useRealCampaigns(selectedPeriod, customRange);
  const { adSets: realAdSets, loading: adSetsLoading, refetch: refetchAdSets } = useAdSets(selectedCampaign?.id || null, selectedPeriod, customRange);
  const { ads: realAds, loading: adsLoading, refetch: refetchAds } = useAds(selectedAdSet?.id || null, selectedPeriod, customRange);
  
  // Build unified campaign list
  const allCampaigns = useMemo(() => {
    if (isRealData && realCampaigns.length > 0) {
      return realCampaigns.map(c => ({
        ...c,
        status: c.status as any,
        platform: c.platform as 'meta' | 'google',
        startDate: c.startDate || new Date().toISOString(),
        endDate: c.stopDate || new Date().toISOString(),
      }));
    }
    return selectedAccount
      ? mockCampaigns.filter(c => c.accountId === selectedAccount.id)
      : mockCampaigns;
  }, [selectedAccount, realCampaigns, isRealData]);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<'all' | Platform>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setCampaigns(allCampaigns);
  }, [allCampaigns]);

  const filtered = campaigns.filter(c => {
    if (filterPlatform !== 'all' && c.platform !== filterPlatform) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleStatus = async (id: string, platform: string) => {
    const campaignToToggle = campaigns.find(c => c.id === id);
    if (!campaignToToggle) return;

    const newStatus = campaignToToggle.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    // Optimistic UI update (only for campaign-level toggle)
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, status: newStatus };
    }));

    if (isRealData && platform === 'meta') {
      try {
        const res = await fetch('/api/meta/campaigns/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: id,
            status: newStatus,
          }),
        });
        
        const data = await res.json();
        if (!data.success) {
          // Revert on failure
          console.error(data.error);
          alert(`Erro ao alterar status no Meta: ${data.error}`);
          setCampaigns(prev => prev.map(c => {
            if (c.id !== id) return c;
            return { ...c, status: campaignToToggle.status };
          }));
        }
      } catch (err) {
        console.error(err);
        // Revert on failure
        setCampaigns(prev => prev.map(c => {
          if (c.id !== id) return c;
          return { ...c, status: campaignToToggle.status };
        }));
      }
    }
  };

  return (
    <>
      <Header title="Campanhas" subtitle="Gerencie todas as suas campanhas" />
      <div className="page-content">
        {/* Period selector */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <PeriodSelector />
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
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

          {isRealData && (
             <button 
               onClick={() => selectedAdSet ? refetchAds() : selectedCampaign ? refetchAdSets() : refetchCampaigns()} 
               className="btn btn-secondary" title="Atualizar dados">
               <FiRefreshCw className={(selectedAdSet ? adsLoading : selectedCampaign ? adSetsLoading : campaignsLoading) ? 'spin' : ''} />
             </button>
          )}

          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <FiPlus /> Nova
          </button>
        </div>

        {/* Breadcrumbs */}
        {(selectedCampaign || selectedAdSet) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => { setSelectedCampaign(null); setSelectedAdSet(null); }}>
              Campanhas
            </span>
            <FiChevronRight size={14} color="var(--text-tertiary)" />
            
            {selectedCampaign && !selectedAdSet && (
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCampaign.name}</span>
            )}
            
            {selectedCampaign && selectedAdSet && (
              <>
                <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedAdSet(null)}>
                  {selectedCampaign.name}
                </span>
                <FiChevronRight size={14} color="var(--text-tertiary)" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAdSet.name}</span>
              </>
            )}
          </div>
        )}

        {/* Desktop: Table */}
        <div className="table-container desktop-only">
          <table>
            <thead>
              <tr>
                <th>{selectedAdSet ? 'Anúncio' : selectedCampaign ? 'Conjunto de Anúncios' : 'Campanha'}</th>
                {!selectedCampaign && <th>Plataforma</th>}
                <th>Status</th>
                <th>Orçamento</th>
                <th>Gasto</th>
                <th>Impressões</th>
                <th>CTR</th>
                <th>CPC</th>
                <th>Leads</th>
                <th>CPL</th>
                <th>Conv.</th>
                <th>ROAS</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(selectedAdSet ? realAds : selectedCampaign ? realAdSets : filtered).map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isRealData && <FiWifi size={12} color="var(--accent-primary)" title="Dados Reais" />}
                      <div>
                        <div 
                           style={{ fontWeight: 600, marginBottom: 2, cursor: 'pointer', color: 'var(--text-primary)' }} 
                           className="hover:text-accent transition-colors"
                           onClick={() => {
                             if (!selectedCampaign) setSelectedCampaign({ id: c.id, name: c.name });
                             else if (!selectedAdSet) setSelectedAdSet({ id: c.id, name: c.name });
                           }}
                        >
                          {c.name}
                        </div>
                        <div className="text-sm text-secondary">{c.objective || (selectedAdSet ? 'Anúncio' : 'Conjunto')}</div>
                      </div>
                    </div>
                  </td>
                  {!selectedCampaign && (
                    <td>
                      <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                        {c.platform === 'meta' ? 'Meta' : 'Google'}
                      </span>
                    </td>
                  )}
                  <td>
                    <span className={`badge ${statusClass[c.status] || 'badge-draft'}`}>
                      <span className="badge-dot" />
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
                  <td>R$ {c.budget.toLocaleString('pt-BR')}</td>
                  <td>R$ {c.spend.toLocaleString('pt-BR')}</td>
                  <td>{c.impressions.toLocaleString('pt-BR')}</td>
                  <td>{c.ctr}%</td>
                  <td>R$ {c.cpc.toFixed(2)}</td>
                  <td>{c.leads.toLocaleString('pt-BR')}</td>
                  <td>R$ {c.cpl.toFixed(2)}</td>
                  <td>{c.conversions.toLocaleString('pt-BR')}</td>
                  <td style={{ color: c.roas >= 3 ? 'var(--success)' : c.roas >= 2 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>
                    {c.roas > 0 ? `${c.roas}x` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className={`btn btn-sm ${c.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(c.id, c.platform)}
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
          {(selectedAdSet ? realAds : selectedCampaign ? realAdSets : filtered).map((c: any) => (
            <div key={c.id} className="mobile-campaign-card">
              <div className="mobile-campaign-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div 
                     className="mobile-campaign-card-name"
                     style={{ cursor: 'pointer', color: 'var(--text-primary)' }}
                     onClick={() => {
                       if (!selectedCampaign) setSelectedCampaign({ id: c.id, name: c.name });
                       else if (!selectedAdSet) setSelectedAdSet({ id: c.id, name: c.name });
                     }}
                  >
                    {isRealData && <FiWifi size={10} color="var(--accent-primary)" style={{ marginRight: 4 }} />}
                    {c.name}
                  </div>
                  <div className="mobile-campaign-card-objective">{c.objective || (selectedAdSet ? 'Anúncio' : 'Conjunto de Anúncios')}</div>
                </div>
                <div className="mobile-campaign-card-badges">
                  <span className={`badge ${statusClass[c.status] || 'badge-draft'}`}>
                    <span className="badge-dot" />
                    {statusLabels[c.status] || c.status}
                  </span>
                  {!selectedCampaign && (
                    <span className={`badge ${c.platform === 'meta' ? 'badge-meta' : 'badge-google'}`}>
                      {c.platform === 'meta' ? 'Meta' : 'Google'}
                    </span>
                  )}
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
                  <div className="mobile-metric-label">Leads</div>
                  <div className="mobile-metric-value">{c.leads.toLocaleString('pt-BR')}</div>
                </div>
                <div className="mobile-metric">
                  <div className="mobile-metric-label">CPL</div>
                  <div className="mobile-metric-value">R$ {c.cpl.toFixed(2)}</div>
                </div>
                <div className="mobile-metric">
                  <div className="mobile-metric-label">Conv.</div>
                  <div className="mobile-metric-value">{c.conversions.toLocaleString('pt-BR')}</div>
                </div>
              </div>
              <div className="mobile-campaign-card-actions">
                <button
                  className={`btn btn-sm ${c.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => toggleStatus(c.id, c.platform)}
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

        {/* Empty state - considers drill-down level */}
        {(() => {
          const currentItems = selectedAdSet ? realAds : selectedCampaign ? realAdSets : filtered;
          const currentLoading = selectedAdSet ? adsLoading : selectedCampaign ? adSetsLoading : campaignsLoading;
          if (currentItems.length === 0 && !currentLoading) {
            return (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p className="empty-state-text">
                  {selectedAdSet
                    ? 'Nenhum anúncio encontrado neste conjunto'
                    : selectedCampaign
                    ? 'Nenhum conjunto de anúncios encontrado'
                    : 'Nenhuma campanha encontrada'}
                </p>
                <p className="text-sm text-secondary">
                  {selectedAdSet || selectedCampaign
                    ? 'Volte para o nível anterior ou tente outro período'
                    : 'Tente ajustar os filtros ou crie uma nova campanha'}
                </p>
              </div>
            );
          }
          return null;
        })()}

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
