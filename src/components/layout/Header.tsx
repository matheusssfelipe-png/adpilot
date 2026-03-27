'use client';

import { FiBell, FiSearch } from 'react-icons/fi';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
      </div>
      <div className="header-actions">
        <button className="btn btn-secondary btn-icon" title="Buscar">
          <FiSearch size={18} />
        </button>
        <button className="btn btn-secondary btn-icon" title="Notificações" style={{ position: 'relative' }}>
          <FiBell size={18} />
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, background: 'var(--danger)',
            borderRadius: '50%', border: '2px solid var(--bg-secondary)'
          }} />
        </button>
        <div style={{
          width: 34, height: 34,
          background: 'var(--accent-gradient)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer'
        }}>
          U
        </div>
      </div>
    </header>
  );
}
