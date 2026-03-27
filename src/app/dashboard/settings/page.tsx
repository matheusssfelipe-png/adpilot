'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { FiSave, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Header title="Configurações" subtitle="Configure as integrações e credenciais" />
      <div className="page-content" style={{ maxWidth: 800 }}>
        {/* Meta Ads */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div style={{
              width: 40, height: 40, background: 'var(--meta-blue-glow)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--meta-blue)', fontSize: 18, fontWeight: 700,
            }}>f</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Meta Ads API</h3>
              <p className="text-sm text-secondary">Facebook & Instagram Ads</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">App ID</label>
              <input className="input" type={showTokens ? 'text' : 'password'} placeholder="Seu App ID" />
            </div>
            <div className="input-group">
              <label className="input-label">App Secret</label>
              <input className="input" type={showTokens ? 'text' : 'password'} placeholder="Seu App Secret" />
            </div>
            <div className="input-group">
              <label className="input-label">Access Token</label>
              <input className="input" type={showTokens ? 'text' : 'password'} placeholder="System User Access Token" />
            </div>
            <div className="input-group">
              <label className="input-label">Ad Account ID</label>
              <input className="input" placeholder="act_123456789" />
            </div>
          </div>
        </div>

        {/* Google Ads */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div style={{
              width: 40, height: 40, background: 'var(--google-glow)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--google-blue)', fontSize: 18, fontWeight: 700,
            }}>G</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Google Ads API</h3>
              <p className="text-sm text-secondary">Search, Display & Performance Max</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Client ID</label>
                <input className="input" type={showTokens ? 'text' : 'password'} placeholder="OAuth Client ID" />
              </div>
              <div className="input-group">
                <label className="input-label">Client Secret</label>
                <input className="input" type={showTokens ? 'text' : 'password'} placeholder="OAuth Client Secret" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Developer Token</label>
              <input className="input" type={showTokens ? 'text' : 'password'} placeholder="22 caracteres" />
            </div>
            <div className="input-group">
              <label className="input-label">Refresh Token</label>
              <input className="input" type={showTokens ? 'text' : 'password'} placeholder="OAuth Refresh Token" />
            </div>
            <div className="input-group">
              <label className="input-label">Customer ID</label>
              <input className="input" placeholder="123-456-7890" />
            </div>
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
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Google Gemini (Nano Banana)</h3>
              <p className="text-sm text-secondary">Geração de imagens e textos com IA</p>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">API Key</label>
            <input className="input" type={showTokens ? 'text' : 'password'} placeholder="Sua chave do Google AI Studio" />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
