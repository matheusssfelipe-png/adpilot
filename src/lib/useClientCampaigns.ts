'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClient } from './ClientContext';

export interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  platform: 'google' | 'meta';
  accountId: string;
  clientAccountId: string; // DB id for API calls
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  leads: number;
  cpl: number;
  roas: number;
  costPerConversion?: number;
  conversionsValue?: number;
}

interface UseClientCampaignsOptions {
  datePreset?: string;
  customRange?: { since: string; until: string } | null;
}

export function useClientCampaigns(options: UseClientCampaignsOptions = {}) {
  const { datePreset = 'last_30d', customRange } = options;
  const { selectedClient } = useClient();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!selectedClient || !selectedClient.accounts.length) {
      setCampaigns([]);
      return;
    }

    setLoading(true);
    setError(null);

    const allCampaigns: Campaign[] = [];

    // Fetch campaigns from each account in parallel
    const promises = selectedClient.accounts
      .filter(a => a.status === 'active')
      .map(async (account) => {
        try {
          const params = new URLSearchParams({
            clientAccountId: account.id,
          });

          if (datePreset === 'custom' && customRange?.since && customRange?.until) {
            params.set('since', customRange.since);
            params.set('until', customRange.until);
          } else {
            params.set('datePreset', datePreset);
          }

          let url = '';
          if (account.platform === 'google') {
            url = `/api/google/campaigns?${params.toString()}`;
          } else {
            // Meta support (future) — will use existing /api/meta/campaigns
            url = `/api/meta/campaigns?${params.toString()}&accountId=${account.accountId}`;
          }

          const res = await fetch(url);
          const data = await res.json();

          if (data.success && data.campaigns) {
            return data.campaigns.map((c: any) => ({
              ...c,
              clientAccountId: account.id,
            }));
          }
          return [];
        } catch {
          return [];
        }
      });

    try {
      const results = await Promise.all(promises);
      results.forEach(r => allCampaigns.push(...r));

      // Sort by spend descending
      allCampaigns.sort((a, b) => b.spend - a.spend);
      setCampaigns(allCampaigns);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, datePreset, customRange?.since, customRange?.until]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
    hasGoogleAccounts: selectedClient?.accounts.some(a => a.platform === 'google') || false,
    hasMetaAccounts: selectedClient?.accounts.some(a => a.platform === 'meta') || false,
  };
}
