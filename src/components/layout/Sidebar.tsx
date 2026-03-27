'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, FiTarget, FiImage, FiBarChart2, FiFileText, 
  FiUsers, FiSettings, FiLogOut, FiZap, FiMessageSquare, FiX
} from 'react-icons/fi';
import { useMobileMenu } from './MobileMenuContext';

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
