'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdAccount } from './AdAccountContext';

export function useAds(adSetId: string | null, datePreset: string = 'last_30d', customRange?: { since: string; until: string } | null) {
  const { metaConnected } = useAdAccount();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAds = useCallback(async () => {
    if (!adSetId || !metaConnected) { setAds([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ adsetId: adSetId });
      if (datePreset === 'custom' && customRange?.since && customRange?.until) {
        params.set('since', customRange.since);
        params.set('until', customRange.until);
      } else {
        params.set('datePreset', datePreset);
      }

      const res = await fetch(`/api/meta/ads?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.ads) {
        setAds(data.ads);
      } else {
        setAds([]);
      }
    } catch {
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [adSetId, datePreset, customRange?.since, customRange?.until, metaConnected]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return { ads, loading, refetch: fetchAds };
}
