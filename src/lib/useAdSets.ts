'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdAccount } from './AdAccountContext';

export function useAdSets(campaignId: string | null, datePreset: string = 'last_30d', customRange?: { since: string; until: string } | null) {
  const { metaConnected } = useAdAccount();
  const [adSets, setAdSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdSets = useCallback(async () => {
    if (!campaignId || !metaConnected) { setAdSets([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ campaignId });
      if (datePreset === 'custom' && customRange?.since && customRange?.until) {
        params.set('since', customRange.since);
        params.set('until', customRange.until);
      } else {
        params.set('datePreset', datePreset);
      }

      const res = await fetch(`/api/meta/adsets?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.adsets) {
        setAdSets(data.adsets);
      } else {
        setAdSets([]);
      }
    } catch {
      setAdSets([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, datePreset, customRange?.since, customRange?.until, metaConnected]);

  useEffect(() => {
    fetchAdSets();
  }, [fetchAdSets]);

  return { adSets, loading, refetch: fetchAdSets };
}
