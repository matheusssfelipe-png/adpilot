'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type Platform = 'meta' | 'google';

export interface AdAccount {
  id: string;
  name: string;
  platform: Platform;
  businessName: string;
  businessId: string;
  currency: string;
  status: 'active' | 'disconnected';
  isManager?: boolean;
  profilePicture?: string;
}

interface AdAccountContextType {
  accounts: AdAccount[];
  selectedAccount: AdAccount | null;
  switchAccount: (accountId: string) => void;
  allAccountsMode: boolean;
  setAllAccountsMode: (v: boolean) => void;
  metaConnected: boolean;
  googleConnected: boolean;
  disconnectMeta: () => void;
  disconnectGoogle: () => void;
}

const AdAccountContext = createContext<AdAccountContextType | null>(null);

// Mock ad accounts — used as fallback when not connected
export const mockAdAccounts: AdAccount[] = [
  {
    id: 'act_001',
    name: 'E-commerce Principal',
    platform: 'meta',
    businessName: 'Agência Digital MF',
    businessId: 'bm_001',
    currency: 'BRL',
    status: 'active',
  },
  {
    id: 'act_002',
    name: 'Loja Moda Feminina',
    platform: 'meta',
    businessName: 'Agência Digital MF',
    businessId: 'bm_001',
    currency: 'BRL',
    status: 'active',
  },
  {
    id: 'act_003',
    name: 'Google Ads - E-commerce',
    platform: 'google',
    businessName: 'Agência Digital MF',
    businessId: 'bm_001',
    currency: 'BRL',
    status: 'active',
  },
  {
    id: 'act_004',
    name: 'Cliente Premium - Saúde',
    platform: 'meta',
    businessName: 'BM Cliente Premium',
    businessId: 'bm_002',
    currency: 'BRL',
    status: 'active',
  },
];

export function AdAccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AdAccount[]>(mockAdAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [allAccountsMode, setAllAccountsMode] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  // Check token status and fetch real accounts on mount
  useEffect(() => {
    // Set initial selected account
    if (accounts.length > 0) {
      setSelectedAccountId(prev => prev || accounts[0].id);
    }

    // Clean URL params after OAuth redirect (success/error indicators only now)
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthResult = urlParams.get('success') || urlParams.get('error');
    if (hasOAuthResult) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Check which tokens exist via secure API endpoint
    checkTokenStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkTokenStatus = async () => {
    try {
      const res = await fetch('/api/auth/tokens');
      const data = await res.json();

      if (data.meta) {
        setMetaConnected(true);
        fetchRealMetaAccounts();
      }

      if (data.google) {
        setGoogleConnected(true);
        fetchRealGoogleAccounts();
      }
    } catch (e) {
      console.error('Failed to check token status:', e);
    }
  };

  // --- Meta Ads: fetch real accounts via API route (Bug #11 fix) ---
  const fetchRealMetaAccounts = async () => {
    try {
      const res = await fetch('/api/meta/accounts');
      const data = await res.json();

      if (data.error) {
        console.error('Meta accounts error:', data.error);
        return;
      }

      if (data.accounts && data.accounts.length > 0) {
        const realMetaAccounts: AdAccount[] = data.accounts.map((acc: any) => ({
          id: acc.id,
          name: acc.name || 'Conta sem nome',
          platform: 'meta' as Platform,
          businessName: acc.businessName || 'Sem Business Manager',
          businessId: acc.businessId || 'unknown',
          currency: acc.currency || 'BRL',
          status: acc.status === 'active' ? 'active' as const : 'disconnected' as const,
        }));

        setAccounts(prev => {
          const others = prev.filter(a => a.platform !== 'meta');
          const newAccounts = [...realMetaAccounts, ...others];
          setSelectedAccountId(cur => {
            if (!cur || !newAccounts.find(a => a.id === cur)) {
              return newAccounts[0]?.id || '';
            }
            return cur;
          });
          return newAccounts;
        });
      }
    } catch (e) {
      console.error('Failed to fetch real meta accounts:', e);
    }
  };

  // --- Google Ads: fetch real accounts ---
  const fetchRealGoogleAccounts = async () => {
    try {
      const res = await fetch('/api/google/accounts');

      const data = await res.json();

      if (data.error) {
        console.error('Google Ads error:', data.error);
        return;
      }

      if (data.accounts && data.accounts.length > 0) {
        const realGoogleAccounts: AdAccount[] = data.accounts.map((acc: any) => ({
          id: `google_${acc.id}`,
          name: acc.name || `Google Ads ${acc.id}`,
          platform: 'google' as Platform,
          businessName: acc.managedBy ? `MCC ${acc.managedBy}` : 'Google Ads',
          businessId: String(acc.id),
          currency: acc.currency || 'BRL',
          status: 'active' as const,
          isManager: acc.isManager || false,
        }));

        if (realGoogleAccounts.length > 0) {
          setAccounts(prev => {
            const others = prev.filter(a => a.platform !== 'google');
            const newAccounts = [...others, ...realGoogleAccounts];
            setSelectedAccountId(cur => {
              if (!cur || !newAccounts.find(a => a.id === cur)) {
                return newAccounts[0]?.id || '';
              }
              return cur;
            });
            return newAccounts;
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch real google accounts:', e);
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  const switchAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setAllAccountsMode(false);
  }, []);

  const disconnectMeta = useCallback(async () => {
    try {
      await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'meta' }),
      });
    } catch { /* ignore */ }
    setMetaConnected(false);
    setAccounts(prev => {
      const googleAccounts = prev.filter(a => a.platform === 'google');
      const defaultMeta = mockAdAccounts.filter(a => a.platform === 'meta');
      return [...defaultMeta, ...googleAccounts];
    });
  }, []);

  const disconnectGoogle = useCallback(async () => {
    try {
      await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'google' }),
      });
    } catch { /* ignore */ }
    setGoogleConnected(false);
    setAccounts(prev => {
      const metaAccounts = prev.filter(a => a.platform === 'meta');
      const defaultGoogle = mockAdAccounts.filter(a => a.platform === 'google');
      return [...metaAccounts, ...defaultGoogle];
    });
  }, []);

  return (
    <AdAccountContext.Provider value={{
      accounts,
      selectedAccount,
      switchAccount,
      allAccountsMode,
      setAllAccountsMode,
      metaConnected,
      googleConnected,
      disconnectMeta,
      disconnectGoogle,
    }}>
      {children}
    </AdAccountContext.Provider>
  );
}

export function useAdAccount() {
  const ctx = useContext(AdAccountContext);
  if (!ctx) throw new Error('useAdAccount must be used within AdAccountProvider');
  return ctx;
}
