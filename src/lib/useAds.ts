import { useState, useCallback, useEffect } from 'react';

export interface RealAd {
  id: string;
  name: string;
  status: string;
  adsetId: string;
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

export function useAds(adSetId: string | null, datePreset: string = 'last_30d') {
  const [ads, setAds] = useState<RealAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    if (!adSetId) return;

    const token = localStorage.getItem('meta_access_token');
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meta/ads?adsetId=${adSetId}&token=${token}&datePreset=${datePreset}`);
      const data = await res.json();
      
      if (data.success && data.ads) {
        setAds(data.ads);
      } else {
        setError(data.error || 'Failed to load ads');
      }
    } catch (err: any) {
      console.error('Error fetching ads:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [adSetId, datePreset]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return { ads, loading, error, refetch: fetchAds };
}
