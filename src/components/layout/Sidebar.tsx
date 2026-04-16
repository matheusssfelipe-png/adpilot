'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { 
  FiHome, FiTarget, FiImage, FiBarChart2, FiFileText, 
  FiUsers, FiSettings, FiLogOut, FiZap, FiMessageSquare, FiX,
  FiChevronDown, FiCheck, FiSearch
} from 'react-icons/fi';
import { useMobileMenu } from './MobileMenuContext';
import { useAdAccount } from '@/lib/AdAccountContext';
import { useClient } from '@/lib/ClientContext';

const navItems = [
  { label: 'Principal', items: [
    { href: '/dashboard', icon: FiHome, text: 'Dashboard' },
    { href: '/dashboard/clients', icon: FiUsers, text: 'Clientes' },
    { href: '/dashboard/chat', icon: FiMessageSquare, text: 'Chat IA' },
    { href: '/dashboard/campaigns', icon: FiTarget, text: 'Campanhas' },
  ]},
  { label: 'Análises', items: [
    { href: '/dashboard/analytics', icon: FiBarChart2, text: 'Analytics' },
    { href: '/dashboard/reports', icon: FiFileText, text: 'Relatórios' },
    { href: '/dashboard/creatives', icon: FiImage, text: 'Criativos IA' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useMobileMenu();
  const { accounts, selectedAccount, switchAccount } = useAdAccount();
  const { clients, selectedClient, selectClient } = useClient();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  }

  // Filter accounts by search query
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(a => 
      a.name.toLowerCase().includes(q) || 
      a.businessName.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  // Group filtered accounts by business
  const businesses = filteredAccounts.reduce((acc, account) => {
    if (!acc[account.businessName]) acc[account.businessName] = [];
    acc[account.businessName].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <FiZap />
        </div>
        <span className="sidebar-brand-text">AdPilot</span>

        {/* Close button - only visible on mobile via CSS */}
        <button
          className="mobile-menu-btn"
          onClick={close}
          style={{ marginLeft: 'auto' }}
          aria-label="Fechar menu"
        >
          <FiX />
        </button>
      </div>

      {/* Client Selector */}
      <div className="account-selector">
        <button 
          className="account-selector-btn"
          onClick={() => {
            setClientDropdownOpen(!clientDropdownOpen);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {/* Client avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              background: selectedClient?.avatarColor || 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>
              {selectedClient?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="account-selector-name">
                {selectedClient?.name || 'Selecionar cliente'}
              </div>
              <div className="account-selector-business">
                {selectedClient?.accounts.length
                  ? `${selectedClient.accounts.length} conta${selectedClient.accounts.length > 1 ? 's' : ''} vinculada${selectedClient.accounts.length > 1 ? 's' : ''}`
                  : 'Nenhuma conta'
                }
              </div>
            </div>
          </div>
          <FiChevronDown 
            size={16} 
            style={{ 
              transition: 'transform 200ms ease',
              transform: clientDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
              color: 'var(--text-tertiary)',
            }} 
          />
        </button>

        {/* Client Dropdown */}
        {clientDropdownOpen && (
          <div className="account-dropdown">
            <div className="account-dropdown-list">
              {clients.length === 0 ? (
                <div className="account-dropdown-empty">
                  Nenhum cliente cadastrado
                </div>
              ) : (
                clients.map(client => (
                  <button
                    key={client.id}
                    className={`account-dropdown-item ${client.id === selectedClient?.id ? 'active' : ''}`}
                    onClick={() => {
                      selectClient(client.id);
                      setClientDropdownOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 4,
                        background: client.avatarColor || '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span className="account-dropdown-item-name">{client.name}</span>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', gap: 6 }}>
                          {client.accounts.filter(a => a.platform === 'google').length > 0 && (
                            <span><strong style={{ color: '#4285f4' }}>G</strong> {client.accounts.filter(a => a.platform === 'google').length}</span>
                          )}
                          {client.accounts.filter(a => a.platform === 'meta').length > 0 && (
                            <span><strong style={{ color: '#1877f2' }}>f</strong> {client.accounts.filter(a => a.platform === 'meta').length}</span>
                          )}
                          {client.accounts.length === 0 && <span>sem contas</span>}
                        </div>
                      </div>
                    </div>
                    {client.id === selectedClient?.id && (
                      <FiCheck size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                onClick={close}
              >
                <span className="sidebar-link-icon"><item.icon /></span>
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link href="/dashboard/settings" className="sidebar-link" onClick={close}>
          <span className="sidebar-link-icon"><FiSettings /></span>
          <span>Configurações</span>
        </Link>
        <button className="sidebar-link" style={{ color: 'var(--danger)' }} onClick={handleLogout} disabled={loggingOut}>
          <span className="sidebar-link-icon"><FiLogOut /></span>
          <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  );
}
