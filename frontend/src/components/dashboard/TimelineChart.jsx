import {
  AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-indigo-950 rounded-xl px-4 py-2.5 shadow-xl border-none">
        <p className="text-xs text-indigo-300 mb-1">{label}</p>
        <p className="text-sm font-extrabold text-white">
          {payload[0].value}
          <span className="text-xs font-normal text-indigo-300 ml-1">submissions</span>
        </p>
      </div>
    );
  }
  return null;
};

const TimelineChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const first    = data[0]?.feedback || 0;
  const last     = data[data.length - 1]?.feedback || 0;
  const total    = data.reduce((sum, d) => sum + (d.feedback || 0), 0);
  const avg      = total > 0 ? Math.round(total / data.length) : 0;
  const trendPct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
  const trending = trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4">
        <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

        {/* Title + trend badge */}
        <div className="relative flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white leading-none mb-0.5">Feedback Over Time</h2>
            <p className="text-xs text-white/65">Trend analysis of incoming submissions</p>
          </div>

          {/* Trend badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
            ${trending === 'up'   ? 'bg-green-500/25 text-green-300'
            : trending === 'down' ? 'bg-red-500/25 text-red-300'
            :                       'bg-white/15 text-white/80'}`}>
            {trending === 'up'   && <TrendingUp  className="w-3.5 h-3.5" />}
            {trending === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {trending === 'flat' && <Minus        className="w-3.5 h-3.5" />}
            {trending === 'flat' ? 'Stable' : `${Math.abs(trendPct)}% ${trending}`}
          </div>
        </div>

        {/* Mini stats */}
        <div className="relative flex gap-5 pt-3 border-t border-white/15">
          {[
            { label: 'Total',     value: total },
            { label: 'Daily Avg', value: avg   },
            { label: 'Latest',    value: last  },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-white/60 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-base font-extrabold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-4 pt-5 pb-3 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f5" />

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
              activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default TimelineChart;