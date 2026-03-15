import {
  AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1e1b4b',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        border: 'none'
      }}>
        <p style={{ fontSize: '11px', color: '#a5b4fc', margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>
          {payload[0].value}
          <span style={{ fontSize: '11px', fontWeight: 400, color: '#a5b4fc', marginLeft: '4px' }}>
            submissions
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const TimelineChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Calculate trend
  const first = data[0]?.feedback || 0;
  const last = data[data.length - 1]?.feedback || 0;
  const total = data.reduce((sum, d) => sum + (d.feedback || 0), 0);
  const avg = total > 0 ? Math.round(total / data.length) : 0;
  const trendPct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
  const trending = trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #f0f0f5',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>

      {/* Header - indigo gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        padding: '18px 22px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '90px', height: '90px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
              Feedback Over Time
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Trend analysis of incoming submissions
            </p>
          </div>

          {/* Trend badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: trending === 'up'
              ? 'rgba(34,197,94,0.25)'
              : trending === 'down'
              ? 'rgba(239,68,68,0.25)'
              : 'rgba(255,255,255,0.15)',
            padding: '5px 12px',
            borderRadius: '20px'
          }}>
            {trending === 'up' && <TrendingUp size={13} color="#4ade80" />}
            {trending === 'down' && <TrendingDown size={13} color="#f87171" />}
            {trending === 'flat' && <Minus size={13} color="rgba(255,255,255,0.7)" />}
            <span style={{
              fontSize: '12px', fontWeight: 700,
              color: trending === 'up' ? '#4ade80' : trending === 'down' ? '#f87171' : 'rgba(255,255,255,0.8)'
            }}>
              {trending === 'flat' ? 'Stable' : `${Math.abs(trendPct)}% ${trending}`}
            </span>
          </div>
        </div>

        {/* Mini stats row */}
        <div style={{
          display: 'flex', gap: '20px',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.15)'
        }}>
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</p>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>{total}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Avg</p>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>{avg}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latest</p>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>{last}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, padding: '20px 16px 12px', minHeight: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f5"
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#c7d2fe', strokeWidth: 1, strokeDasharray: '5 5' }}
            />

            <Area
              type="monotone"
              dataKey="feedback"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#feedbackGradient)"
              activeDot={{
                r: 5,
                fill: '#6366f1',
                stroke: '#fff',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default TimelineChart;