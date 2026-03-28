'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdAccount } from './AdAccountContext';

export interface RealCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  platform: string;
  accountId: string;
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
  startDate?: string;
  stopDate?: string;
}

export function useRealCampaigns(datePreset: string = 'last_30d') {
  const { selectedAccount, metaConnected } = useAdAccount();
  const [campaigns, setCampaigns] = useState<RealCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealData, setIsRealData] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!selectedAccount) return;

    const token = localStorage.getItem('meta_access_token');
    
    // If connected to Meta and this is a real Meta account
    if (metaConnected && token && selectedAccount.platform === 'meta' && !selectedAccount.id.startsWith('act_00')) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/meta/campaigns?accountId=${selectedAccount.id}&token=${token}&datePreset=${datePreset}`);
        const data = await res.json();
        
        if (data.success && data.campaigns) {
          setCampaigns(data.campaigns);
          setIsRealData(true);
        } else {
          setError(data.error || 'Erro ao buscar campanhas');
          setCampaigns([]);
          setIsRealData(false);
        }
      } catch (e) {
        setError('Falha na conexão com a API');
        setCampaigns([]);
        setIsRealData(false);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to mock data for mock accounts
      setCampaigns([]);
      setIsRealData(false);
    }
  }, [selectedAccount, metaConnected, datePreset]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { campaigns, loading, error, isRealData, refetch: fetchCampaigns };
}
