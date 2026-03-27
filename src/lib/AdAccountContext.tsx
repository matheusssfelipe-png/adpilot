'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

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
  const [accounts] = useState<AdAccount[]>(mockAdAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [allAccountsMode, setAllAccountsMode] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  const switchAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setAllAccountsMode(false);
  }, []);

  return (
    <AdAccountContext.Provider value={{
      accounts,
      selectedAccount,
      switchAccount,
      allAccountsMode,
      setAllAccountsMode,
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
