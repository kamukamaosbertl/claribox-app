import {
  AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

// ── Tooltip ────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0F172A',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
      fontFamily: font,
    }}>
      <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
        {payload[0].value}
        <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748B', marginLeft: '5px' }}>submissions</span>
      </p>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const TimelineChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const first    = data[0]?.feedback || 0;
  const last     = data[data.length - 1]?.feedback || 0;
  const total    = data.reduce((sum, d) => sum + (d.feedback || 0), 0);
  const avg      = total > 0 ? Math.round(total / data.length) : 0;
  const trendPct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
  const trending = trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';

  const trendStyles = {
    up:   { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)',  color: '#22C55E' },
    down: { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  color: '#EF4444' },
    flat: { bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.2)', color: '#FFFFFF' },
  };
  const ts = trendStyles[trending];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#FFFFFF', borderRadius: '20px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      overflow: 'hidden', fontFamily: font,
    }}>

      {/* ── Header bar ──────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)',
        padding: '18px 20px 16px',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.08)',
      }}>
        {/* Mesh blob */}
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
        }} />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Title row */}
        <div style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
              Feedback Over Time
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 500 }}>
              Trend analysis of incoming submissions
            </p>
          </div>

          {/* Trend badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: ts.bg, border: `1px solid ${ts.border}`,
            borderRadius: '20px', padding: '4px 10px',
            fontSize: '11px', fontWeight: 700, color: ts.color,
          }}>
            {trending === 'up'   && <TrendingUp  size={12} color={ts.color} />}
            {trending === 'down' && <TrendingDown size={12} color={ts.color} />}
            {trending === 'flat' && <Minus        size={12} color={ts.color} />}
            {trending === 'flat' ? 'Stable' : `${Math.abs(trendPct)}% ${trending}`}
          </div>
        </div>

        {/* Mini stats */}
        <div style={{
          position: 'relative',
          display: 'flex', gap: '20px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.12)',
        }}>
          {[
            { label: 'Total',     value: total },
            { label: 'Daily Avg', value: avg   },
            { label: 'Latest',    value: last  },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 3px' }}>
                {label}
              </p>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart area ──────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '16px 12px 8px 4px', minHeight: '140px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="tlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#2563EB" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3" vertical={false}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="date" axisLine={false} tickLine={false}
              tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 600, fontFamily: font }}
              dy={6}
            />
            <YAxis
              axisLine={false} tickLine={false}
              tick={{ fill: '#CBD5E1', fontSize: 10, fontFamily: font }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#BFDBFE', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="feedback"
              stroke="#2563EB"
              strokeWidth={2.5}
              fill="url(#tlGradient)"
              activeDot={{
                r: 5, fill: '#2563EB',
                stroke: '#FFFFFF', strokeWidth: 2,
                filter: 'drop-shadow(0 0 4px rgba(37,99,235,0.5))',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimelineChart;