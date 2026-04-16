'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useClient } from '@/lib/ClientContext';
import { FiPlus, FiTrash2, FiLink, FiChevronRight, FiSearch, FiUser, FiX, FiSettings } from 'react-icons/fi';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#a855f7', '#14b8a6', '#64748b',
];

export default function ClientsPage() {
  const {
    clients, selectedClient, selectClient,
    isLoading, createClient, deleteClient,
  } = useClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<string | null>(null);

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
      setShowConfig(result.id); // Open config for new client
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
            const googleAccounts = client.accounts.filter(a => a.platform === 'google');
            const metaAccounts = client.accounts.filter(a => a.platform === 'meta');
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
                        {googleAccounts.length > 0 && (
                          <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#4285f4', fontWeight: 700, fontSize: 13 }}>G</span>
                            {googleAccounts.length} conta{googleAccounts.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {metaAccounts.length > 0 && (
                          <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#1877f2', fontWeight: 700, fontSize: 13 }}>f</span>
                            {metaAccounts.length} conta{metaAccounts.length > 1 ? 's' : ''}
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
    </>
  );
}
