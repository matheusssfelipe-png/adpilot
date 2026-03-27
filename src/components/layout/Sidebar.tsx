'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, FiTarget, FiImage, FiBarChart2, FiFileText, 
  FiUsers, FiSettings, FiLogOut, FiZap, FiMessageSquare
} from 'react-icons/fi';

const navItems = [
  { label: 'Principal', items: [
    { href: '/dashboard', icon: FiHome, text: 'Dashboard' },
    { href: '/dashboard/chat', icon: FiMessageSquare, text: 'Chat IA', highlight: true },
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

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <FiZap />
        </div>
        <span className="sidebar-brand-text">AdPilot</span>
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
              >
                <span className="sidebar-link-icon"><item.icon /></span>
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link href="/dashboard/settings" className="sidebar-link">
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
