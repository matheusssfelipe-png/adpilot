'use client';

import { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiChevronDown } from 'react-icons/fi';
import { useMetricsStore } from '@/lib/useMetricsStore';

const PRESET_OPTIONS = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'last_7d', label: '7 dias' },
  { key: 'last_14d', label: '14 dias' },
  { key: 'last_30d', label: '30 dias' },
  { key: 'last_90d', label: '90 dias' },
];

interface PeriodSelectorProps {
  compact?: boolean;
}

export default function PeriodSelector({ compact }: PeriodSelectorProps) {
  const { selectedPeriod, setSelectedPeriod, customDateRange, setCustomDateRange } = useMetricsStore();
  const [showCustom, setShowCustom] = useState(false);
  const [tempSince, setTempSince] = useState(customDateRange?.since || '');
  const [tempUntil, setTempUntil] = useState(customDateRange?.until || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCustom(false);
      }
    };
    if (showCustom) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCustom]);

  // Sync temp values when custom range updates externally
  useEffect(() => {
    if (customDateRange) {
      setTempSince(customDateRange.since);
      setTempUntil(customDateRange.until);
    }
  }, [customDateRange]);

  const handlePresetClick = (key: string) => {
    setSelectedPeriod(key);
    setShowCustom(false);
  };

  const handleApplyCustom = () => {
    if (tempSince && tempUntil) {
      setSelectedPeriod('custom');
      setCustomDateRange({ since: tempSince, until: tempUntil });
      setShowCustom(false);
    }
  };

  const formatCustomLabel = () => {
    if (!customDateRange) return 'Personalizado';
    const fmt = (d: string) => {
      const [y, m, day] = d.split('-');
      return `${day}/${m}`;
    };
    return `${fmt(customDateRange.since)} – ${fmt(customDateRange.until)}`;
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
      {/* Preset buttons */}
      {PRESET_OPTIONS.map(p => (
        <button
          key={p.key}
          className={`btn btn-sm ${selectedPeriod === p.key ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handlePresetClick(p.key)}
        >
          {p.label}
        </button>
      ))}

      {/* Custom date button */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          className={`btn btn-sm ${selectedPeriod === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowCustom(!showCustom)}
          style={{ gap: 4, display: 'flex', alignItems: 'center' }}
        >
          <FiCalendar size={13} />
          {selectedPeriod === 'custom' ? formatCustomLabel() : (compact ? '' : 'Personalizado')}
          <FiChevronDown size={12} style={{
            transform: showCustom ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms ease',
          }} />
        </button>

        {/* Custom date dropdown */}
        {showCustom && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            zIndex: 200,
            width: 300,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: 16,
            animation: 'slideUp 200ms ease',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
              📅 Período Personalizado
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Data Inicial
                </label>
                <input
                  type="date"
                  className="input"
                  value={tempSince}
                  onChange={e => setTempSince(e.target.value)}
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Data Final
                </label>
                <input
                  type="date"
                  className="input"
                  value={tempUntil}
                  onChange={e => setTempUntil(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>

              {/* Quick presets inside dropdown */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {[
                  { label: 'Este mês', getSince: () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; }},
                  { label: 'Mês passado', getSince: () => { const d = new Date(); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; }, getUntil: () => { const d = new Date(); d.setDate(0); return d.toISOString().split('T')[0]; }},
                  { label: 'Últimos 60 dias', getSince: () => { const d = new Date(); d.setDate(d.getDate()-60); return d.toISOString().split('T')[0]; }},
                ].map(q => (
                  <button
                    key={q.label}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => {
                      const since = q.getSince();
                      const until = q.getUntil ? q.getUntil() : new Date().toISOString().split('T')[0];
                      setTempSince(since);
                      setTempUntil(until);
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={handleApplyCustom}
                disabled={!tempSince || !tempUntil}
                style={{ marginTop: 4, width: '100%' }}
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
