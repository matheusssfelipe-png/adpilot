'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ============================
// Types
// ============================
export interface ClientAccount {
  id: string;
  clientId: string;
  platform: 'google' | 'meta';
  accountId: string;
  accountName: string;
  currency: string;
  status: string;
  mccId?: string;
  lastSyncedAt?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  avatarColor: string;
  notes?: string;
  accounts: ClientAccount[];
  createdAt: string;
  updatedAt: string;
}

interface ClientContextType {
  clients: Client[];
  selectedClient: Client | null;
  selectClient: (clientId: string) => void;
  isLoading: boolean;
  error: string | null;
  refetchClients: () => Promise<void>;
  createClient: (name: string, avatarColor?: string, notes?: string) => Promise<Client | null>;
  deleteClient: (clientId: string) => Promise<boolean>;
  linkAccount: (clientId: string, data: LinkAccountData) => Promise<boolean>;
  unlinkAccount: (clientId: string, accountDbId: string) => Promise<boolean>;
}

export interface LinkAccountData {
  platform: 'google' | 'meta';
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  mccId?: string;
  currency?: string;
}

const ClientContext = createContext<ClientContextType | null>(null);

// ============================
// Provider
// ============================
export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients from API
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/clients');
      const data = await res.json();

      if (data.success && data.clients) {
        setClients(data.clients);
        // Auto-select first client if none selected
        setSelectedClientId(prev => {
          if (!prev && data.clients.length > 0) return data.clients[0].id;
          if (prev && !data.clients.find((c: Client) => c.id === prev)) {
            return data.clients[0]?.id || '';
          }
          return prev;
        });
      } else {
        setError(data.error || 'Erro ao carregar clientes');
      }
    } catch (e) {
      console.error('Failed to fetch clients:', e);
      setError('Falha na conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Persist selected client to localStorage
  useEffect(() => {
    if (selectedClientId) {
      localStorage.setItem('adpilot_selected_client', selectedClientId);
    }
  }, [selectedClientId]);

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adpilot_selected_client');
    if (saved) setSelectedClientId(saved);
  }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  const selectClient = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
  }, []);

  const createClient = useCallback(async (name: string, avatarColor?: string, notes?: string) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarColor, notes }),
      });
      const data = await res.json();
      if (data.success && data.client) {
        const newClient = { ...data.client, accounts: [] };
        setClients(prev => [...prev, newClient]);
        setSelectedClientId(newClient.id);
        return newClient;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        if (selectedClientId === clientId) {
          setSelectedClientId(clients[0]?.id || '');
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [selectedClientId, clients]);

  const linkAccount = useCallback(async (clientId: string, accountData: LinkAccountData) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh clients to get updated accounts
        await fetchClients();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchClients]);

  const unlinkAccount = useCallback(async (clientId: string, accountDbId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/accounts?accountDbId=${accountDbId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchClients();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchClients]);

  return (
    <ClientContext.Provider value={{
      clients,
      selectedClient,
      selectClient,
      isLoading,
      error,
      refetchClients: fetchClients,
      createClient,
      deleteClient,
      linkAccount,
      unlinkAccount,
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error('useClient must be used within ClientProvider');
  return ctx;
}
