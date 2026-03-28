import { useState, useCallback, useEffect } from 'react';

export interface RealAdSet {
  id: string;
  name: string;
  status: string;
  campaignId: string;
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
}

export function useAdSets(campaignId: string | null, datePreset: string = 'last_30d') {
  const [adSets, setAdSets] = useState<RealAdSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdSets = useCallback(async () => {
    if (!campaignId) return;

    const token = localStorage.getItem('meta_access_token');
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meta/adsets?campaignId=${campaignId}&token=${token}&datePreset=${datePreset}`);
      const data = await res.json();
      
      if (data.success && data.adsets) {
        setAdSets(data.adsets);
      } else {
        setError(data.error || 'Failed to load ad sets');
      }
    } catch (err: any) {
      console.error('Error fetching ad sets:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [campaignId, datePreset]);

  useEffect(() => {
    fetchAdSets();
  }, [fetchAdSets]);

  return { adSets, loading, error, refetch: fetchAdSets };
}
