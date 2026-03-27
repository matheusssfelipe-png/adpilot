'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import { 
  FiHome, FiTarget, FiImage, FiBarChart2, FiFileText, 
  FiUsers, FiSettings, FiLogOut, FiZap, FiMessageSquare, FiX,
  FiChevronDown, FiCheck, FiSearch
} from 'react-icons/fi';
import { useMobileMenu } from './MobileMenuContext';
import { useAdAccount } from '@/lib/AdAccountContext';

const navItems = [
  { label: 'Principal', items: [
    { href: '/dashboard', icon: FiHome, text: 'Dashboard' },
    { href: '/dashboard/chat', icon: FiMessageSquare, text: 'Chat IA' },
    { href: '/dashboard/campaigns', icon: FiTarget, text: 'Campanhas' },
    { href: '/dashboard/creatives', icon: FiImage, text: 'Criativos IA' },
    { href: '/dashboard/analytics', icon: FiBarChart2, text: 'Análises' },
  ]},
  { label: 'Relatórios', items: [
    { href: '/dashboard/reports', icon: FiFileText, text: 'Relatórios' },
    { href: '/dashboard/clients', icon: FiUsers, text: 'Clientes' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileMenu();
  const { accounts, selectedAccount, switchAccount } = useAdAccount();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

      {/* Account Selector */}
      <div className="account-selector">
        <button 
          className="account-selector-btn"
          onClick={() => {
            setAccountDropdownOpen(!accountDropdownOpen);
            if (!accountDropdownOpen) setSearchQuery('');
          }}
        >
          <div className="account-selector-info">
            <div className="account-selector-platform">
              <span className={`badge ${selectedAccount?.platform === 'meta' ? 'badge-meta' : 'badge-google'}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                {selectedAccount?.platform === 'meta' ? 'Meta' : 'Google'}
              </span>
            </div>
            <div className="account-selector-name">{selectedAccount?.name || 'Selecionar conta'}</div>
            <div className="account-selector-business">{selectedAccount?.businessName}</div>
          </div>
          <FiChevronDown 
            size={16} 
            style={{ 
              transition: 'transform 200ms ease',
              transform: accountDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
              color: 'var(--text-tertiary)',
            }} 
          />
        </button>

        {/* Dropdown */}
        {accountDropdownOpen && (
          <div className="account-dropdown">
            {/* Search input */}
            <div className="account-search-wrapper">
              <FiSearch size={14} className="account-search-icon" />
              <input
                type="text"
                className="account-search-input"
                placeholder={`Buscar entre ${accounts.length} contas...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Scrollable accounts list */}
            <div className="account-dropdown-list">
              {Object.keys(businesses).length === 0 ? (
                <div className="account-dropdown-empty">
                  Nenhuma conta encontrada
                </div>
              ) : (
                Object.entries(businesses).map(([businessName, accts]) => (
                  <div key={businessName}>
                    <div className="account-dropdown-group">{businessName} ({accts.length})</div>
                    {accts.map(account => (
                      <button
                        key={account.id}
                        className={`account-dropdown-item ${account.id === selectedAccount?.id ? 'active' : ''}`}
                        onClick={() => {
                          switchAccount(account.id);
                          setAccountDropdownOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={`badge ${account.platform === 'meta' ? 'badge-meta' : 'badge-google'}`} style={{ fontSize: 9, padding: '0px 5px' }}>
                              {account.platform === 'meta' ? 'M' : 'G'}
                            </span>
                            <span className="account-dropdown-item-name">{account.name}</span>
                          </div>
                        </div>
                        {account.id === selectedAccount?.id && (
                          <FiCheck size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                  </div>
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
        <button className="sidebar-link" style={{ color: 'var(--danger)' }}>
          <span className="sidebar-link-icon"><FiLogOut /></span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
