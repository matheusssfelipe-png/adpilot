'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { MobileMenuProvider, useMobileMenu } from '@/components/layout/MobileMenuContext';
import { AdAccountProvider } from '@/lib/AdAccountContext';
import { MetricsStoreProvider } from '@/lib/useMetricsStore';
import { ClientProvider } from '@/lib/ClientContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useMobileMenu();
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [close]);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${isOpen ? 'active' : ''}`}
        onClick={close}
      />

      <Sidebar />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProvider>
      <AdAccountProvider>
        <MetricsStoreProvider>
          <MobileMenuProvider>
            <DashboardContent>{children}</DashboardContent>
          </MobileMenuProvider>
        </MetricsStoreProvider>
      </AdAccountProvider>
    </ClientProvider>
  );
}

