'use client';

import { FiSearch, FiBell, FiMenu } from 'react-icons/fi';
import { useMobileMenu } from './MobileMenuContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { toggle } = useMobileMenu();

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {/* Mobile menu button - hidden on desktop via CSS */}
        <button
          className="mobile-menu-btn"
          onClick={toggle}
          aria-label="Abrir menu"
        >
          <FiMenu />
        </button>
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle text-sm text-secondary">{subtitle}</p>}
        </div>
      </div>
      <div className="header-actions">
        <button className="btn btn-icon btn-secondary" aria-label="Buscar">
          <FiSearch size={18} />
        </button>
        <button className="btn btn-icon btn-secondary" aria-label="Notificações" style={{ position: 'relative' }}>
          <FiBell size={18} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--danger)',
          }} />
        </button>
        <div style={{
          width: 34, height: 34,
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'white',
        }}>
          U
        </div>
      </div>
    </header>
  );
}
