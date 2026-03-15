import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { TrendingUp, MessageSquare } from 'lucide-react';

const SENTIMENTS = [
  { key: 'positive', label: 'Positive', emoji: '😊', color: '#22c55e', light: '#f0fdf4', dark: '#15803d', bar: '#4ade80' },
  { key: 'neutral',  label: 'Neutral',  emoji: '😐', color: '#f59e0b', light: '#fffbeb', dark: '#b45309', bar: '#fcd34d' },
  { key: 'negative', label: 'Negative', emoji: '😞', color: '#ef4444', light: '#fff1f2', dark: '#b91c1c', bar: '#f87171' },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1e1b4b', border: 'none',
        borderRadius: '10px', padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: '12px'
      }}>
        <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{payload[0].name}</p>
        <p style={{ color: '#a5b4fc', margin: 0 }}>{payload[0].value} submissions</p>
      </div>
    );
  }
  return null;
};

const SentimentAnalysis = ({ sentimentData }) => {
  const total = (sentimentData?.positive || 0) + (sentimentData?.neutral || 0) + (sentimentData?.negative || 0);

  const chartData = SENTIMENTS.map(s => ({
    name: s.label,
    value: Number(sentimentData?.[s.key]) || 0,
    color: s.color,
    bar: s.bar
  })).filter(d => d.value > 0);

  const dominant = SENTIMENTS.reduce((prev, curr) =>
    (sentimentData?.[curr.key] || 0) > (sentimentData?.[prev.key] || 0) ? curr : prev,
    SENTIMENTS[0]
  );

  if (!sentimentData || total === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        borderRadius: '16px',
        padding: '40px 24px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(99,102,241,0.3)'
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <MessageSquare size={24} color="#fff" />
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
          No Sentiment Data Yet
        </p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
          Sentiment analysis will appear here once feedback is submitted.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #f0f0f5',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden'
    }}>

      {/* Header - indigo gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={15} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Sentiment Analysis
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              {total} feedback analysed
            </p>
          </div>
        </div>

        {/* Dominant sentiment badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.2)',
          padding: '5px 12px', borderRadius: '20px'
        }}>
          <span style={{ fontSize: '14px' }}>{dominant.emoji}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
            Mostly {dominant.label}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Sentiment score cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {SENTIMENTS.map(s => {
            const val = sentimentData?.[s.key] || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={s.key} style={{
                background: s.light,
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                border: `1px solid ${s.color}22`
              }}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.emoji}</div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: s.dark, margin: '0 0 2px', lineHeight: 1 }}>
                  {val}
                </p>
                <p style={{ fontSize: '10px', fontWeight: 600, color: s.dark, margin: '0 0 6px', opacity: 0.8 }}>
                  {s.label}
                </p>
                {/* mini bar */}
                <div style={{
                  height: '4px', background: `${s.color}33`,
                  borderRadius: '4px', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: s.color, borderRadius: '4px',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
                <p style={{ fontSize: '10px', color: s.dark, margin: '4px 0 0', opacity: 0.7 }}>
                  {pct}%
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Donut chart */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Distribution
            </p>
            <div style={{ height: '160px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center', pointerEvents: 'none'
              }}>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#1e1b4b', margin: 0, lineHeight: 1 }}>{total}</p>
                <p style={{ fontSize: '9px', color: '#9ca3af', margin: '2px 0 0' }}>total</p>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Count
            </p>
            <div style={{ height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
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

        {/* Overall score */}
        {sentimentData?.overallScore !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
            borderRadius: '12px',
            border: '1px solid #c7d2fe'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4338ca' }}>
              Overall Sentiment Score
            </span>
            <span style={{
              fontSize: '18px', fontWeight: 800, color: '#4f46e5'
            }}>
              {sentimentData.overallScore?.toFixed(2)}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default SentimentAnalysis;