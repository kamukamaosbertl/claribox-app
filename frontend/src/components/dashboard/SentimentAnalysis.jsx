import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { TrendingUp, MessageSquare } from 'lucide-react';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const SENTIMENTS = [
  {
    key: 'positive', label: 'Positive', emoji: '😊',
    stroke: '#22C55E', bg: 'rgba(34,197,94,0.07)',
    pill: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
    bar: '#22C55E', barLight: '#DCFCE7',
  },
  {
    key: 'neutral', label: 'Neutral', emoji: '😐',
    stroke: '#F59E0B', bg: 'rgba(245,158,11,0.07)',
    pill: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
    bar: '#F59E0B', barLight: '#FEF3C7',
  },
  {
    key: 'negative', label: 'Negative', emoji: '😞',
    stroke: '#EF4444', bg: 'rgba(239,68,68,0.07)',
    pill: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
    bar: '#EF4444', barLight: '#FEE2E2',
  },
];

// ── Tooltip ────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const s = SENTIMENTS.find((s) => s.label === payload[0].name) || SENTIMENTS[0];
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0',
      borderRadius: '12px', padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
      fontFamily: font, minWidth: '140px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: s.stroke, flexShrink: 0,
          boxShadow: `0 0 0 3px ${s.bg}`,
        }} />
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{payload[0].name}</p>
      </div>
      <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0, paddingLeft: '15px' }}>
        {payload[0].value} submissions
      </p>
    </div>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '48px 32px', textAlign: 'center',
    background: '#FFFFFF', borderRadius: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
    fontFamily: font,
  }}>
    <div style={{
      width: '56px', height: '56px', borderRadius: '16px', marginBottom: '20px',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      border: '1px solid #BFDBFE',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(37,99,235,0.12)',
    }}>
      <MessageSquare size={24} color="#2563EB" />
    </div>
    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
      No Sentiment Data Yet
    </h3>
    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: '1.6', maxWidth: '280px' }}>
      Sentiment analysis will appear here once feedback is submitted.
    </p>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const SentimentAnalysis = ({ sentimentData }) => {
  const total =
    (sentimentData?.positive || 0) +
    (sentimentData?.neutral  || 0) +
    (sentimentData?.negative || 0);

  const chartData = SENTIMENTS.map((s) => ({
    name:  s.label,
    value: Number(sentimentData?.[s.key]) || 0,
    stroke: s.stroke,
    bar:    s.bar,
  })).filter((d) => d.value > 0);

  const dominant = SENTIMENTS.reduce((prev, curr) =>
    (sentimentData?.[curr.key] || 0) > (sentimentData?.[prev.key] || 0) ? curr : prev,
    SENTIMENTS[0]
  );

  if (!sentimentData || total === 0) return <EmptyState />;

  return (
    <div style={{ fontFamily: font, display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Row 1: Score cards ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {SENTIMENTS.map((s) => {
          const val = sentimentData?.[s.key] || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          const isDominant = s.key === dominant.key;

          return (
            <div
              key={s.key}
              style={{
                position: 'relative',
                background: '#FFFFFF',
                border: isDominant ? `1.5px solid ${s.stroke}40` : '1px solid #E2E8F0',
                borderRadius: '18px',
                padding: '20px',
                overflow: 'hidden',
                boxShadow: isDominant
                  ? `0 8px 24px ${s.stroke}18`
                  : '0 2px 8px rgba(15,23,42,0.04)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 12px 28px ${s.stroke}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isDominant
                  ? `0 8px 24px ${s.stroke}18`
                  : '0 2px 8px rgba(15,23,42,0.04)';
              }}
            >
              {/* Corner glow */}
              <div style={{
                position: 'absolute', top: '-12px', right: '-12px',
                width: '64px', height: '64px', borderRadius: '50%',
                background: `${s.stroke}12`, pointerEvents: 'none',
              }} />

              {/* Emoji + dominant badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '26px', lineHeight: 1 }}>{s.emoji}</span>
                {isDominant && (
                  <span style={{
                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: s.pill.text,
                    background: s.pill.bg, border: `1px solid ${s.pill.border}`,
                    borderRadius: '20px', padding: '2px 7px',
                  }}>
                    Dominant
                  </span>
                )}
              </div>

              {/* Number */}
              <p style={{
                fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em',
                color: '#0F172A', lineHeight: 1, margin: '0 0 4px',
              }}>
                {val.toLocaleString()}
              </p>
              <p style={{
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#94A3B8', margin: '0 0 14px',
              }}>
                {s.label}
              </p>

              {/* Progress bar */}
              <div style={{ height: '5px', borderRadius: '99px', background: s.barLight, overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: '99px',
                  background: s.stroke,
                  boxShadow: `0 0 6px ${s.stroke}55`,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>

              <p style={{ fontSize: '11px', fontWeight: 700, color: s.pill.text, margin: 0 }}>
                {pct}%
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Charts ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Donut */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0',
          borderRadius: '18px', padding: '20px 20px 16px',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', margin: '0 0 14px' }}>
            Distribution
          </p>
          <div style={{ position: 'relative', height: '148px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData} cx="50%" cy="50%"
                  innerRadius={44} outerRadius={68}
                  paddingAngle={4} dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.stroke} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <p style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.04em', color: '#0F172A', lineHeight: 1, margin: 0 }}>
                {total.toLocaleString()}
              </p>
              <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                total
              </p>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
            {SENTIMENTS.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.stroke, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0',
          borderRadius: '18px', padding: '20px 20px 12px',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', margin: '0 0 14px' }}>
            Count
          </p>
          <div style={{ height: '148px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600, fontFamily: font }}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#CBD5E1', fontFamily: font }}
                  tickMargin={6}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.bar} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Overall score ───────────────────────────────────────── */}
      {sentimentData?.overallScore !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
          border: '1px solid #DBEAFE',
          borderRadius: '14px',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Overall Sentiment Score
          </span>
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.04em', color: '#2563EB' }}>
            {sentimentData.overallScore?.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;