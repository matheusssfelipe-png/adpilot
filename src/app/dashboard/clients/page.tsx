'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { FiUsers, FiPlus, FiLink, FiCopy, FiCheck, FiTrash2, FiExternalLink, FiX } from 'react-icons/fi';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  accessToken: string;
  createdAt: string;
  lastAccess?: string;
}

const mockClients: Client[] = [
  { id: '1', name: 'João Silva', email: 'joao@empresa.com', company: 'Empresa ABC', accessToken: 'abc123def456', createdAt: '2026-03-01', lastAccess: '2026-03-25' },
  { id: '2', name: 'Maria Santos', email: 'maria@loja.com', company: 'Loja XYZ', accessToken: 'xyz789ghi012', createdAt: '2026-03-10', lastAccess: '2026-03-24' },
  { id: '3', name: 'Pedro Costa', email: 'pedro@tech.com', company: 'Tech Solutions', accessToken: 'tech345sol678', createdAt: '2026-03-18' },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/client/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Header title="Clientes" subtitle="Gerencie o acesso dos seus clientes" />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
          <p className="text-secondary">{clients.length} clientes cadastrados</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <FiPlus /> Novo Cliente
          </button>
        </div>

        {showCreate && (
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 'var(--space-lg)' }}>👤 Cadastrar Cliente</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Nome</label>
                  <input className="input" placeholder="Nome completo" />
                </div>
                <div className="input-group">
                  <label className="input-label">Empresa</label>
                  <input className="input" placeholder="Nome da empresa" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">E-mail</label>
                <input className="input" type="email" placeholder="email@empresa.com" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => setShowCreate(false)}>Cadastrar</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {clients.map(client => (
            <div key={client.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                <div style={{
                  width: 48, height: 48,
                  background: 'var(--accent-gradient)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'white',
                }}>
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{client.name}</h3>
                  <p className="text-sm text-secondary">{client.company} • {client.email}</p>
                  <p className="text-sm text-secondary">
                    {client.lastAccess ? `Último acesso: ${new Date(client.lastAccess).toLocaleDateString('pt-BR')}` : 'Nunca acessou'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => copyLink(client.accessToken, client.id)}>
                  {copiedId === client.id ? <><FiCheck size={14} /> Copiado!</> : <><FiLink size={14} /> Copiar Link</>}
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => window.open(`/client/${client.accessToken}`, '_blank')}>
                  <FiExternalLink size={14} /> Abrir Portal
                </button>
                <button className="btn btn-sm btn-danger">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
