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
  profilePicture?: string;
}

interface AdAccountContextType {
  accounts: AdAccount[];
  selectedAccount: AdAccount | null;
  switchAccount: (accountId: string) => void;
  allAccountsMode: boolean;
  setAllAccountsMode: (v: boolean) => void;
  metaConnected: boolean;
  disconnectMeta: () => void;
}

const AdAccountContext = createContext<AdAccountContextType | null>(null);

// Mock ad accounts — will be replaced with real data from OAuth
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

  // Load token and fetch real accounts on mount
  useEffect(() => {
    // Set initial selected account if not set
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }

    // Check if we just redirected back from Meta OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      localStorage.setItem('meta_access_token', tokenFromUrl);
      
      // Clean up the URL without reloading the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    const token = tokenFromUrl || localStorage.getItem('meta_access_token');
    if (token) {
      setMetaConnected(true);
      fetchRealMetaAccounts(token);
    }
  }, []);

  const fetchRealMetaAccounts = async (token: string) => {
    try {
      let allData: any[] = [];
      let url: string | null = `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status,currency,business{id,name}&limit=100&access_token=${token}`;
      
      // Paginate through ALL accounts
      while (url) {
        const res: Response = await fetch(url);
        const data: { data?: any[]; paging?: { next?: string } } = await res.json();
        
        if (data.data) {
          allData = [...allData, ...data.data];
        }
        
        // Follow pagination cursor
        url = data.paging?.next || null;
      }

      if (allData.length > 0) {
        const realMetaAccounts: AdAccount[] = allData.map((acc: any) => ({
          id: acc.id,
          name: acc.name || 'Conta sem nome',
          platform: 'meta' as Platform,
          businessName: acc.business?.name || 'Sem Business Manager',
          businessId: acc.business?.id || 'unknown',
          currency: acc.currency || 'BRL',
          status: acc.account_status === 1 ? 'active' as const : 'disconnected' as const,
        }));

        // Replace meta mocks with real ones, keep google mocks
        setAccounts(prev => {
          const others = prev.filter(a => a.platform !== 'meta');
          const newAccounts = [...realMetaAccounts, ...others];
          // Auto-select first account if none selected
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

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  const switchAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setAllAccountsMode(false);
  }, []);

  const disconnectMeta = useCallback(() => {
    localStorage.removeItem('meta_access_token');
    setMetaConnected(false);
    setAccounts(mockAdAccounts);
  }, []);

  return (
    <AdAccountContext.Provider value={{
      accounts,
      selectedAccount,
      switchAccount,
      allAccountsMode,
      setAllAccountsMode,
      metaConnected,
      disconnectMeta,
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
