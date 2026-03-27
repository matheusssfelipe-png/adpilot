'use client';

import { useState, useCallback } from 'react';
import { FiSettings, FiChevronUp, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import { ALL_METRICS } from '@/lib/metrics-config';

interface MetricsConfigPanelProps {
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
  compact?: boolean;
}

export default function MetricsConfigPanel({ selectedMetrics, onMetricsChange, compact }: MetricsConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMetric = useCallback((key: string) => {
    onMetricsChange(
      selectedMetrics.includes(key)
        ? selectedMetrics.filter(k => k !== key)
        : [...selectedMetrics, key]
    );
  }, [selectedMetrics, onMetricsChange]);

  const moveMetric = useCallback((key: string, direction: 'up' | 'down') => {
    const idx = selectedMetrics.indexOf(key);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === selectedMetrics.length - 1) return;
    const next = [...selectedMetrics];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onMetricsChange(next);
  }, [selectedMetrics, onMetricsChange]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        className={`btn ${isOpen ? 'btn-primary' : 'btn-secondary'} ${compact ? 'btn-sm' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ gap: 6 }}
      >
        <FiSettings size={compact ? 13 : 15} />
        {!compact && <>Métricas ({selectedMetrics.length})</>}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 149,
            }}
          />

          {/* Dropdown panel */}
          <div style={{
            position: 'absolute', top: '100%', right: 0,
            marginTop: 8, zIndex: 150,
            width: compact ? 280 : 320,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            animation: 'slideUp 200ms ease',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Configurar Métricas
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Metrics list */}
            <div style={{ padding: '8px', maxHeight: 380, overflowY: 'auto' }}>
              {ALL_METRICS.map(metric => {
                const isActive = selectedMetrics.includes(metric.key);
                const order = selectedMetrics.indexOf(metric.key);
                return (
                  <div
                    key={metric.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 2,
                      background: isActive ? 'var(--accent-primary-glow)' : 'transparent',
                      opacity: isActive ? 1 : 0.6,
                      transition: 'all 100ms ease',
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleMetric(metric.key)}
                      style={{
                        width: 18, height: 18, borderRadius: 3,
                        background: isActive ? metric.color : 'transparent',
                        border: `2px solid ${isActive ? metric.color : 'var(--border-color)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'white', flexShrink: 0, padding: 0,
                      }}
                    >
                      {isActive && <FiCheck size={10} />}
                    </button>

                    {/* Icon */}
                    <div style={{
                      width: 22, height: 22, borderRadius: 4,
                      background: `${metric.color}20`, color: metric.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <metric.icon size={11} />
                    </div>

                    {/* Label */}
                    <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer' }}
                      onClick={() => toggleMetric(metric.key)}
                    >
                      {metric.label}
                    </span>

                    {/* Order badge */}
                    {isActive && (
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', minWidth: 16, textAlign: 'center' }}>
                        #{order + 1}
                      </span>
                    )}

                    {/* Reorder */}
                    {isActive && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <button
                          onClick={() => moveMetric(metric.key, 'up')}
                          style={{
                            background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
                            borderRadius: 2, cursor: 'pointer', color: 'var(--text-secondary)',
                            padding: '0px 3px', display: 'flex', alignItems: 'center',
                          }}
                        >
                          <FiChevronUp size={10} />
                        </button>
                        <button
                          onClick={() => moveMetric(metric.key, 'down')}
                          style={{
                            background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
                            borderRadius: 2, cursor: 'pointer', color: 'var(--text-secondary)',
                            padding: '0px 3px', display: 'flex', alignItems: 'center',
                          }}
                        >
                          <FiChevronDown size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
