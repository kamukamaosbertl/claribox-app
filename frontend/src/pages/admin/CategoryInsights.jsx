import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { adminAPI } from '../../services/api';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const PALETTE = [
  { stroke: '#2563EB', bg: 'rgba(37,99,235,0.08)',   text: '#1D4ED8'  },
  { stroke: '#22C55E', bg: 'rgba(34,197,94,0.08)',   text: '#15803D'  },
  { stroke: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  text: '#B45309'  },
  { stroke: '#EF4444', bg: 'rgba(239,68,68,0.08)',   text: '#B91C1C'  },
  { stroke: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  text: '#6D28D9'  },
  { stroke: '#EC4899', bg: 'rgba(236,72,153,0.08)',  text: '#BE185D'  },
  { stroke: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   text: '#0E7490'  },
  { stroke: '#84CC16', bg: 'rgba(132,204,22,0.08)',  text: '#4D7C0F'  },
];

const MEDALS = ['🥇', '🥈', '🥉'];

// ── Tooltip ───────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px', padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.24)', fontFamily: font,
    }}>
      <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 3px', fontWeight: 500 }}>
        {label || payload[0].name}
      </p>
      <p style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
        {payload[0].value}
        <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748B', marginLeft: '5px' }}>submissions</span>
      </p>
    </div>
  );
};

const EMOTION_CONFIG = {
  angry:          { emoji: '😡', color: '#EF4444', bg: '#FEF2F2', label: 'Angry'        },
  disappointed:   { emoji: '😞', color: '#F59E0B', bg: '#FFFBEB', label: 'Disappointed' },
  confused:       { emoji: '😕', color: '#8B5CF6', bg: '#F5F3FF', label: 'Confused'     },
  excited:        { emoji: '🤩', color: '#22C55E', bg: '#F0FDF4', label: 'Excited'      },
  satisfied:      { emoji: '😊', color: '#2563EB', bg: '#EFF6FF', label: 'Satisfied'    },
  hopeful:        { emoji: '🙏', color: '#06B6D4', bg: '#ECFEFF', label: 'Hopeful'      },
  neutral_emotion:{ emoji: '😐', color: '#94A3B8', bg: '#F8FAFC', label: 'Neutral'      },
};

const CategoryInsights = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selected,     setSelected]     = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const response = await adminAPI.getCategoryStats();
      setCategoryData(response.data.categoryData || []);
    } catch { setError('Failed to load category insights. Please try again.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const total = categoryData.reduce((sum, c) => sum + (c.count || 0), 0);

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '380px', gap: '14px', fontFamily: font }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '4px solid #DBEAFE', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Loading category data…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: font }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: '20px',
        padding: '20px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)',
        boxShadow: '0 8px 24px rgba(37,99,235,0.22)',
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieIcon size={20} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px', letterSpacing: '-0.025em' }}>
              Category Insights
            </h1>
            <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 500 }}>
              Analyze feedback distribution by category
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          style={{
            position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.12)', color: '#FFFFFF',
            fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: font,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.20)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '13px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#B91C1C', margin: 0, flex: 1, fontWeight: 500 }}>{error}</p>
          <button onClick={fetchData} style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>
            Try Again
          </button>
        </div>
      )}

      {categoryData.length > 0 ? (
        <>
          {/* ── Charts row ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

            {/* Donut */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)', padding: '20px 22px' }}>
              <h2 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Distribution</h2>
              <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '0 0 16px', fontWeight: 500 }}>Breakdown by category</p>

              <div style={{ position: 'relative', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="count" nameKey="name" strokeWidth={0}>
                      {categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length].stroke} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <p style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', color: '#0F172A', lineHeight: 1, margin: 0 }}>{total}</p>
                  <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>total</p>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
                {categoryData.map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PALETTE[i % PALETTE.length].stroke, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)', padding: '20px 22px' }}>
              <h2 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Comparison</h2>
              <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '0 0 16px', fontWeight: 500 }}>Submissions per category</p>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 4, right: 14 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#60A5FA" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={88}
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600, fontFamily: font }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Category cards grid ──────────────────────────────── */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={16} color="#2563EB" />
                </div>
                <h2 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>All Categories</h2>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '20px', padding: '3px 10px' }}>
                {categoryData.length} categories
              </span>
            </div>

            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {categoryData.map((cat, i) => {
                const color      = PALETTE[i % PALETTE.length];
                const pct        = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                const isSelected = selected === cat.name;

                return (
                  <div
                    key={i}
                    onClick={() => setSelected(isSelected ? null : cat.name)}
                    style={{
                      padding: '14px', borderRadius: '14px', cursor: 'pointer',
                      border: isSelected ? `1.5px solid ${color.stroke}` : '1px solid #E2E8F0',
                      background: isSelected ? color.bg : '#FAFBFC',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? `0 4px 12px ${color.stroke}20` : 'none',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = color.stroke + '60'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${color.stroke}15`; } }}
                    onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color.stroke, flexShrink: 0, boxShadow: `0 0 0 2px ${color.stroke}28` }} />
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', textTransform: 'capitalize' }}>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>{cat.count}</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '99px', background: '#E2E8F0', overflow: 'hidden', marginBottom: '7px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: color.stroke, boxShadow: `0 0 5px ${color.stroke}55`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                    <p style={{ fontSize: '10.5px', fontWeight: 700, color: color.text, margin: 0, textAlign: 'right' }}>{pct}% of total</p>
                    {/* ✅ Add here — inside the map, before the closing </div> of the card */}
                  {cat.emotions && Object.keys(cat.emotions).length > 0 && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 7px' }}>Emotions</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {Object.entries(cat.emotions).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([emotion, count]) => {
                          const cfg = EMOTION_CONFIG[emotion] || EMOTION_CONFIG.neutral_emotion;
                          return (
                            <span key={emotion} style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}28`, borderRadius: '20px', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              {cfg.emoji} {cfg.label} · {count}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Top ranked ───────────────────────────────────────── */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)',
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
              <TrendingUp size={16} color="#FFFFFF" />
              <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                Top Categories by Volume
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[...categoryData]
                .sort((a, b) => b.count - a.count)
                .map((cat, i) => {
                  const origIdx = categoryData.indexOf(cat);
                  const color   = PALETTE[origIdx % PALETTE.length];
                  const pct     = total > 0 ? Math.round((cat.count / total) * 100) : 0;

                  return (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 20px', borderBottom: '1px solid #F8FAFC', transition: 'background 0.14s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Rank */}
                      <span style={{ fontSize: i < 3 ? '18px' : '11px', fontWeight: 800, color: i < 3 ? 'inherit' : '#6366F1', minWidth: '28px', textAlign: 'center', lineHeight: 1 }}>
                        {MEDALS[i] || `#${i + 1}`}
                      </span>

                      {/* Bar */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color.stroke, flexShrink: 0, boxShadow: `0 0 0 2px ${color.stroke}28` }} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'capitalize', letterSpacing: '-0.01em' }}>{cat.name}</span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{cat.count}</span>
                        </div>
                        <div style={{ height: '5px', borderRadius: '99px', background: '#F1F5F9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: color.stroke, boxShadow: `0 0 5px ${color.stroke}55`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                          
                        </div>
                        {cat.emotions && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {Object.entries(cat.emotions).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([emotion, count]) => {
                            const cfg = EMOTION_CONFIG[emotion] || EMOTION_CONFIG.neutral_emotion;
                            return (
                              <span key={emotion} style={{ fontSize: '10px', fontWeight: 600, color: cfg.color, background: cfg.bg, borderRadius: '20px', padding: '2px 7px' }}>
                               {cfg.emoji} {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      </div>

                      {/* Pct pill */}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: color.text, background: color.bg, border: `1px solid ${color.stroke}28`, borderRadius: '20px', padding: '3px 10px', minWidth: '44px', textAlign: 'center', flexShrink: 0 }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      ) : (
        /* ── Empty state ──────────────────────────────────────── */
        <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.12)' }}>
            <BarChart3 size={24} color="#2563EB" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.025em' }}>No Category Data Yet</h3>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, maxWidth: '280px', lineHeight: '1.6' }}>
            Category insights will appear here once students submit feedback.
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryInsights;