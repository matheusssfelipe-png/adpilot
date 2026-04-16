'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useClient } from '@/lib/ClientContext';
import { FiPlus, FiTrash2, FiLink, FiSearch, FiUser, FiX, FiSettings, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#a855f7', '#14b8a6', '#64748b',
];

interface GoogleAccount {
  id: string;
  name: string;
  currency: string;
  isManager: boolean;
  status: string;
  managedBy?: string;
}

function ClientsPageContent() {
  const {
    clients, selectedClient, selectClient,
    isLoading, createClient, deleteClient, refetchClients,
  } = useClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<string | null>(null);

  // Google Account Picker state
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [linkingClientId, setLinkingClientId] = useState<string>('');
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [linkingAccountId, setLinkingAccountId] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Detect ?link=google&clientId=xxx from OAuth callback
  useEffect(() => {
    const link = searchParams.get('link');
    const clientId = searchParams.get('clientId');
    const error = searchParams.get('error');

    if (error) {
      const errorMessages: Record<string, string> = {
        google_denied: 'Autorização Google negada pelo usuário.',
        no_code: 'Código de autorização não recebido.',
        token_failed: 'Falha ao obter token do Google.',
        no_developer_token: 'Developer Token não configurado.',
        no_google_accounts: 'Nenhuma conta Google Ads encontrada.',
        google_failed: 'Erro na autenticação Google.',
      };
      setAccountsError(errorMessages[error] || `Erro: ${error}`);
      // Clean URL
      router.replace('/dashboard/clients', { scroll: false });
    }

    if (link === 'google' && clientId) {
      setLinkingClientId(clientId);
      setShowAccountPicker(true);
      fetchGoogleAccounts();
      // Clean URL
      router.replace('/dashboard/clients', { scroll: false });
    }
  }, [searchParams, router]);

  const fetchGoogleAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setAccountsError(null);
    try {
      const res = await fetch('/api/google/accounts/list');
      
      // Check if we got HTML instead of JSON (middleware redirect)
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setAccountsError('Sessão expirada ou erro de autenticação. Tente vincular novamente.');
        return;
      }
      
      const data = await res.json();
      if (data.success && data.accounts) {
        setGoogleAccounts(data.accounts);
      } else {
        setAccountsError(data.error || 'Falha ao carregar contas');
      }
    } catch (e: any) {
      setAccountsError(`Erro ao listar contas: ${e.message}`);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const linkGoogleAccount = async (account: GoogleAccount) => {
    if (!linkingClientId || linkingAccountId) return;
    setLinkingAccountId(account.id);
    try {
      const res = await fetch(`/api/clients/${linkingClientId}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'google',
          accountId: account.id,
          accountName: account.name,
          currency: account.currency,
          mccId: account.managedBy || process.env.NEXT_PUBLIC_GOOGLE_ADS_MCC_ID || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLinkSuccess(account.name);
        await refetchClients();
        // Show success briefly then close
        setTimeout(() => {
          setShowAccountPicker(false);
          setLinkSuccess(null);
          setGoogleAccounts([]);
          setLinkingAccountId(null);
          setShowConfig(linkingClientId);
        }, 1500);
      } else {
        setAccountsError(data.error || 'Falha ao vincular conta');
        setLinkingAccountId(null);
      }
    } catch {
      setAccountsError('Erro ao vincular conta');
      setLinkingAccountId(null);
    }
  };

  const filtered = search
    ? clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : clients;

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    const result = await createClient(newName, newColor);
    if (result) {
      setNewName('');
      setShowCreate(false);
      setShowConfig(result.id);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    await deleteClient(id);
    setConfirmDelete(null);
  };

  return (
    <>
      <Header title="Clientes" subtitle="Gerencie seus clientes e contas vinculadas" />
      <div className="page-content" style={{ maxWidth: 900 }}>

        {/* Header actions */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <FiPlus size={16} /> Novo Cliente
          </button>
        </div>

        {/* Error banner */}
        {accountsError && !showAccountPicker && (
          <div className="card" style={{
            marginBottom: 'var(--space-lg)',
            border: '2px solid var(--danger)',
            padding: 'var(--space-md)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
          }}>
            <FiAlertCircle size={18} color="var(--danger)" />
            <span style={{ flex: 1, color: 'var(--danger)' }}>{accountsError}</span>
            <button onClick={() => setAccountsError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Create card */}
        {showCreate && (
          <div className="card" style={{
            marginBottom: 'var(--space-lg)',
            border: '2px solid var(--accent-primary)',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowCreate(false)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none',
                color: 'var(--text-tertiary)', cursor: 'pointer',
              }}
            >
              <FiX size={18} />
            </button>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 'var(--space-md)' }}>
              Novo Cliente
            </h3>

            <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="input-label">Nome do Cliente</label>
              <input
                className="input"
                type="text"
                placeholder="Ex: E-commerce Premium"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label className="input-label" style={{ marginBottom: 6, display: 'block' }}>Cor do Avatar</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: color,
                      border: newColor === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  />
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim() || creating}>
              {creating ? 'Criando...' : 'Criar Cliente'}
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-md)' }} />
            Carregando clientes...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && clients.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <FiUser size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhum cliente cadastrado</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
              Crie seu primeiro cliente para vincular contas do Google Ads.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>
              <FiPlus size={16} /> Criar Primeiro Cliente
            </button>
          </div>
        )}

        {/* Client cards */}
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {filtered.map(client => {
            const googleAccts = client.accounts.filter(a => a.platform === 'google');
            const metaAccts = client.accounts.filter(a => a.platform === 'meta');
            const isSelected = selectedClient?.id === client.id;

            return (
              <div key={client.id}>
                <div
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => selectClient(client.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-md)',
                      background: client.avatarColor || '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0,
                    }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{client.name}</h3>
                        {isSelected && (
                          <span className="badge badge-active" style={{ fontSize: 9 }}>
                            <span className="badge-dot" /> Selecionado
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                        {googleAccts.length > 0 && (
                          <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#4285f4', fontWeight: 700, fontSize: 13 }}>G</span>
                            {googleAccts.length} conta{googleAccts.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {metaAccts.length > 0 && (
                          <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#1877f2', fontWeight: 700, fontSize: 13 }}>f</span>
                            {metaAccts.length} conta{metaAccts.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {client.accounts.length === 0 && (
                          <span className="text-sm" style={{ color: 'var(--warning)' }}>
                            <FiLink size={12} /> Nenhuma conta vinculada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfig(showConfig === client.id ? null : client.id);
                        }}
                        title="Configurar contas"
                      >
                        <FiSettings size={14} />
                      </button>
                      {confirmDelete === client.id ? (
                        <>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--danger)', color: '#fff', fontSize: 11 }}
                            onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                          >
                            Confirmar
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: 11 }}
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                          >
                            Não
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(client.id); }}
                          title="Remover cliente"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable config panel */}
                {showConfig === client.id && (
                  <div className="card" style={{
                    marginTop: -1,
                    borderTop: '1px dashed var(--border-color)',
                    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                  }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                      Contas Vinculadas
                    </h4>

                    {/* Existing accounts */}
                    {client.accounts.map(account => (
                      <div key={account.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-sm)', marginBottom: 6,
                      }}>
                        <div>
                          <span className={`badge ${account.platform === 'google' ? 'badge-google' : 'badge-meta'}`}
                            style={{ fontSize: 9, marginRight: 8 }}>
                            {account.platform === 'google' ? 'Google' : 'Meta'}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{account.accountName}</span>
                          <span className="text-sm text-tertiary" style={{ marginLeft: 8 }}>
                            {account.accountId}
                          </span>
                        </div>
                        <span className={`badge ${account.status === 'active' ? 'badge-active' : 'badge-paused'}`}
                          style={{ fontSize: 9 }}>
                          <span className="badge-dot" />
                          {account.status === 'active' ? 'Ativo' : 'Expirado'}
                        </span>
                      </div>
                    ))}

                    {/* Add account buttons */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-md)' }}>
                      <a
                        href={`/api/auth/google?clientId=${client.id}`}
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={{ color: '#4285f4', fontWeight: 700 }}>G</span>
                        Vincular Google Ads
                      </a>
                      <a
                        href={`/api/auth/meta?clientId=${client.id}`}
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={{ color: '#1877f2', fontWeight: 700 }}>f</span>
                        Vincular Meta Ads
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =============================== */}
      {/* Google Account Picker Modal     */}
      {/* =============================== */}
      {showAccountPicker && (
        <div className="modal-overlay" onClick={() => {
          setShowAccountPicker(false);
          setGoogleAccounts([]);
          setAccountsError(null);
        }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4285f4', fontWeight: 700, fontSize: 20 }}>G</span>
                Selecionar Conta Google Ads
              </h2>
              <button className="btn btn-secondary btn-icon" onClick={() => {
                setShowAccountPicker(false);
                setGoogleAccounts([]);
                setAccountsError(null);
              }}>
                <FiX />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {/* Link success */}
              {linkSuccess && (
                <div style={{
                  textAlign: 'center', padding: 'var(--space-xl)',
                  color: 'var(--success)',
                }}>
                  <FiCheck size={48} style={{ marginBottom: 'var(--space-md)' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    Conta vinculada!
                  </h3>
                  <p className="text-secondary">{linkSuccess}</p>
                </div>
              )}

              {/* Loading */}
              {loadingAccounts && !linkSuccess && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                  <div className="spinner" style={{ margin: '0 auto var(--space-md)' }} />
                  Buscando contas do Google Ads...
                </div>
              )}

              {/* Error */}
              {accountsError && (
                <div style={{
                  padding: 'var(--space-lg)', textAlign: 'center',
                  color: 'var(--danger)',
                }}>
                  <FiAlertCircle size={32} style={{ marginBottom: 'var(--space-sm)' }} />
                  <p style={{ marginBottom: 'var(--space-md)' }}>{accountsError}</p>
                  <button className="btn btn-secondary" onClick={() => { setAccountsError(null); fetchGoogleAccounts(); }}>
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Account list */}
              {!loadingAccounts && !accountsError && !linkSuccess && googleAccounts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-sm)' }}>
                    Selecione a conta que deseja vincular a este cliente:
                  </p>
                  {googleAccounts.filter(a => !a.isManager).map(account => (
                    <button
                      key={account.id}
                      className="card"
                      onClick={() => linkGoogleAccount(account)}
                      disabled={!!linkingAccountId}
                      style={{
                        cursor: linkingAccountId ? 'wait' : 'pointer',
                        border: '2px solid transparent',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        width: '100%',
                        opacity: linkingAccountId && linkingAccountId !== account.id ? 0.5 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-md)',
                          background: '#4285f415', color: '#4285f4',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 700, flexShrink: 0,
                        }}>G</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{account.name}</div>
                          <div className="text-sm text-tertiary">
                            ID: {account.id} • {account.currency}
                            {account.managedBy && ` • MCC: ${account.managedBy}`}
                          </div>
                        </div>
                        {linkingAccountId === account.id ? (
                          <FiLoader size={18} className="spin" style={{ color: 'var(--accent-primary)' }} />
                        ) : (
                          <FiLink size={16} style={{ color: 'var(--text-tertiary)' }} />
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Manager accounts section */}
                  {googleAccounts.filter(a => a.isManager).length > 0 && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                      <p className="text-sm text-tertiary" style={{ marginBottom: 'var(--space-xs)' }}>
                        Contas gerenciadoras (MCC) — não podem ser vinculadas diretamente:
                      </p>
                      {googleAccounts.filter(a => a.isManager).map(account => (
                        <div key={account.id} style={{
                          padding: '8px 12px', background: 'var(--bg-glass)',
                          borderRadius: 'var(--radius-sm)', marginBottom: 4,
                          opacity: 0.6, fontSize: 13,
                        }}>
                          🏢 {account.name} (MCC: {account.id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No accounts found */}
              {!loadingAccounts && !accountsError && !linkSuccess && googleAccounts.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                  <p>Nenhuma conta Google Ads encontrada.</p>
                  <p className="text-sm">Verifique se sua conta Google tem acesso a contas do Google Ads.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    }>
      <ClientsPageContent />
    </Suspense>
  );
}
