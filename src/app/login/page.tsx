'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FiZap, FiMail, FiLock, FiArrowRight, FiAlertCircle } from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login.');
        setLoading(false);
        return;
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        {/* Logo */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <FiZap size={28} />
          </div>
          <h1 className="login-brand-text">AdPilot</h1>
          <p className="login-brand-subtitle">Gerenciador Inteligente de Anúncios</p>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Bem-vindo de volta</h2>
            <p className="login-card-desc">Entre com suas credenciais para acessar o painel</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <FiAlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label className="login-label" htmlFor="email">Email</label>
              <div className="login-input-wrapper">
                <FiMail className="login-input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Senha</label>
              <div className="login-input-wrapper">
                <FiLock className="login-input-icon" size={18} />
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <div className="login-spinner" />
              ) : (
                <>
                  Entrar
                  <FiArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="login-footer">
          © {new Date().getFullYear()} AdPilot — Trizos Company
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          position: relative;
          overflow: hidden;
          padding: var(--space-md);
        }

        /* Animated background */
        .login-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.4;
          animation: float 20s ease-in-out infinite;
        }

        .login-bg-orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #6366f1, transparent 70%);
          top: -10%;
          right: -5%;
          animation-delay: 0s;
        }

        .login-bg-orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #8b5cf6, transparent 70%);
          bottom: -10%;
          left: -5%;
          animation-delay: -7s;
        }

        .login-bg-orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #a855f7, transparent 70%);
          top: 40%;
          left: 50%;
          animation-delay: -14s;
        }

        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 10px) scale(1.02); }
        }

        /* Container */
        .login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: slideUp 600ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Brand */
        .login-brand {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .login-brand-icon {
          width: 64px;
          height: 64px;
          background: var(--accent-gradient);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto var(--space-md);
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
          animation: pulse-glow 3s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3); }
          50% { box-shadow: 0 8px 48px rgba(99, 102, 241, 0.5); }
        }

        .login-brand-text {
          font-size: 32px;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .login-brand-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        /* Card */
        .login-card {
          width: 100%;
          background: rgba(18, 18, 26, 0.8);
          backdrop-filter: blur(24px);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
        }

        .login-card-header {
          margin-bottom: var(--space-xl);
        }

        .login-card-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .login-card-desc {
          font-size: 14px;
          color: var(--text-secondary);
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--danger-bg);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: var(--danger);
          font-size: 13px;
          font-weight: 500;
          animation: shake 400ms ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .login-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-tertiary);
          pointer-events: none;
          transition: color var(--transition-fast);
        }

        .login-input {
          width: 100%;
          padding: 12px 14px 12px 44px;
          background: var(--bg-glass);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: all var(--transition-fast);
        }

        .login-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-glow);
          background: rgba(255, 255, 255, 0.04);
        }

        .login-input:focus + .login-input-icon,
        .login-input-wrapper:focus-within .login-input-icon {
          color: var(--accent-primary);
        }

        .login-input::placeholder {
          color: var(--text-tertiary);
        }

        /* Submit */
        .login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          width: 100%;
          padding: 14px;
          background: var(--accent-gradient);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-top: var(--space-sm);
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .login-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 22px;
          height: 22px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 600ms linear infinite;
        }

        /* Footer */
        .login-footer {
          margin-top: var(--space-xl);
          font-size: 12px;
          color: var(--text-tertiary);
        }

        /* Mobile */
        @media (max-width: 480px) {
          .login-card {
            padding: var(--space-lg);
          }

          .login-brand-icon {
            width: 52px;
            height: 52px;
          }

          .login-brand-text {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}
