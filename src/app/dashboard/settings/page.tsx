'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useAdAccount } from '@/lib/AdAccountContext';
import { FiSave, FiEye, FiEyeOff, FiCheck, FiLink, FiXCircle, FiExternalLink, FiShield, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Reusable scrollable account list component
function AccountList({ accounts, platform }: { accounts: any[]; platform: 'meta' | 'google' }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.businessName?.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const COLLAPSED_MAX = 4;
  const showExpand = filtered.length > COLLAPSED_MAX;
  const displayed = expanded ? filtered : filtered.slice(0, COLLAPSED_MAX);

  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
        <div className="text-sm text-secondary" style={{ fontWeight: 600 }}>
          Contas vinculadas ({accounts.length})
        </div>
      </div>

      {/* Search - only show if more than 4 accounts */}
      {accounts.length > 4 && (
        <div style={{ position: 'relative', marginBottom: 'var(--space-sm)' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar conta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
            name="account-search"
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Account list with max-height scroll */}
      <div style={{
        maxHeight: expanded ? '400px' : 'none',
        overflowY: expanded ? 'auto' : 'visible',
        borderRadius: 'var(--radius-sm)',
      }}>
        {displayed.map(account => (
          <div key={account.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
            marginBottom: 3,
            transition: 'background 0.15s',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {account.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {account.businessName} • {account.id}
              </div>
            </div>
            <span className={`badge ${account.status === 'active' ? 'badge-active' : 'badge-paused'}`} style={{ fontSize: 9, flexShrink: 0, marginLeft: 8 }}>
              <span className="badge-dot" />
              {account.status === 'active' ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--text-tertiary)', fontSize: 12 }}>
            Nenhuma conta encontrada
          </div>
        )}
      </div>

      {/* Show more/less button */}
      {showExpand && !search && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            padding: '6px',
            background: 'none',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            marginTop: 4,
            transition: 'all 0.15s',
          }}
        >
          {expanded ? <><FiChevronUp size={12} /> Mostrar menos</> : <><FiChevronDown size={12} /> Ver todas ({filtered.length - COLLAPSED_MAX} mais)</>}
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { accounts, metaConnected, googleConnected, disconnectMeta, disconnectGoogle } = useAdAccount();
  const [saved, setSaved] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const metaAccounts = accounts.filter(a => a.platform === 'meta');
  const googleAccounts = accounts.filter(a => a.platform === 'google');

  return (
    <>
      <Header title="Configurações" subtitle="Integrações e credenciais" />
      <div className="page-content" style={{ maxWidth: 800 }}>

        {/* Integrations Section */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Integrações</h2>
            <p className="section-subtitle">Vincule suas contas de anúncio para dados em tempo real</p>
          </div>
        </div>

        {/* Meta Ads Integration */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{
                width: 44, height: 44, background: 'var(--meta-blue-glow)',
                borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--meta-blue)', fontSize: 20, fontWeight: 700,
              }}>f</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Meta Ads</h3>
                <p className="text-sm text-secondary">Facebook & Instagram Ads</p>
              </div>
            </div>
            <span className={`badge ${metaConnected ? 'badge-active' : 'badge-draft'}`}>
              <span className="badge-dot" />
              {metaConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {metaConnected ? (
            <>
              <AccountList accounts={metaAccounts} platform="meta" />
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary" onClick={disconnectMeta}>
                  <FiXCircle size={14} /> Desconectar
                </button>
                <a href="/api/auth/meta" className="btn btn-secondary">
                  <FiLink size={14} /> Reconectar
                </a>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
              <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
                Vincule sua conta Meta para acessar campanhas em tempo real
              </p>
              <a href="/api/auth/meta" className="btn btn-primary btn-lg">
                <FiLink size={16} /> Vincular Meta Ads
              </a>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <FiShield size={10} /> Usamos OAuth seguro. Nunca armazenamos sua senha.
              </p>
            </div>
          )}
        </div>

        {/* Google Ads Integration */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{
                width: 44, height: 44, background: 'var(--google-glow)',
                borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--google-blue)', fontSize: 20, fontWeight: 700,
              }}>G</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Google Ads</h3>
                <p className="text-sm text-secondary">Search, Display & Performance Max</p>
              </div>
            </div>
            <span className={`badge ${googleConnected ? 'badge-active' : 'badge-draft'}`}>
              <span className="badge-dot" />
              {googleConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {googleConnected ? (
            <>
              <AccountList accounts={googleAccounts} platform="google" />
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary" onClick={disconnectGoogle}>
                  <FiXCircle size={14} /> Desconectar
                </button>
                <a href="/api/auth/google" className="btn btn-secondary">
                  <FiLink size={14} /> Reconectar
                </a>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
              <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
                Vincule sua conta Google para acessar campanhas em tempo real
              </p>
              <a href="/api/auth/google" className="btn btn-primary btn-lg">
                <FiLink size={16} /> Vincular Google Ads
              </a>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <FiShield size={10} /> Usamos OAuth seguro. Nunca armazenamos sua senha.
              </p>
            </div>
          )}
        </div>

        {/* Manual API Keys */}
        <div className="section-header" style={{ marginTop: 'var(--space-xl)' }}>
          <div>
            <h2 className="section-title">Chaves de API (Avançado)</h2>
            <p className="section-subtitle">Configure manualmente se preferir</p>
          </div>
        </div>

        {/* Gemini */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div style={{
              width: 40, height: 40, background: 'rgba(99,102,241,0.1)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-primary)', fontSize: 18, fontWeight: 700,
            }}>✦</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Google Gemini (IA)</h3>
              <p className="text-sm text-secondary">Geração de imagens e textos</p>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">API Key</label>
            <input className="input" type={showTokens ? 'text' : 'password'} placeholder="Sua chave do Google AI Studio" />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Obtenha sua chave gratuita no AI Studio <FiExternalLink size={10} />
            </a>
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={() => setShowTokens(!showTokens)}>
            {showTokens ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            {showTokens ? 'Ocultar tokens' : 'Mostrar tokens'}
          </button>
          <button className="btn btn-primary btn-lg" onClick={handleSave}>
            {saved ? <><FiCheck /> Salvo!</> : <><FiSave /> Salvar Configurações</>}
          </button>
        </div>
      </div>
    </>
  );
}
