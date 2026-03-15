import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { TrendingUp, MessageSquare } from 'lucide-react';

const SENTIMENTS = [
  { key: 'positive', label: 'Positive', emoji: '😊', color: '#10b981', light: 'bg-emerald-50/80', dark: 'text-emerald-800', bar: '#34d399' },
  { key: 'neutral',  label: 'Neutral',  emoji: '😐', color: '#eab308', light: 'bg-amber-50/80', dark: 'text-amber-800', bar: 'amber-400' },
  { key: 'negative', label: 'Negative', emoji: '😞', color: '#ef4444', light: 'bg-red-50/80', dark: 'text-red-800', bar: '#f87171' },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/20 text-sm font-medium">
        <p className="font-bold text-white mb-1">{payload[0].name}</p>
        <p className="text-indigo-300">{payload[0].value} submissions</p>
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
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-10 text-center shadow-2xl shadow-indigo-500/25 backdrop-blur-xl border border-white/20 hover:shadow-3xl transition-all duration-500 group">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm ring-2 ring-white/30 group-hover:scale-110 transition-transform duration-300">
          <MessageSquare size={28} className="text-white drop-shadow-lg" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">
          No Sentiment Data Yet
        </h3>
        <p className="text-indigo-100 text-sm leading-relaxed max-w-md mx-auto opacity-90">
          Sentiment analysis will appear here once feedback is submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl shadow-slate-100/50 hover:shadow-3xl hover:shadow-indigo-100/50 transition-all duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 flex items-center justify-between flex-wrap gap-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 animate-pulse" />
        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-bounce" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/40 shadow-lg">
            <TrendingUp size={20} className="text-white drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white drop-shadow-xl tracking-tight">
              Sentiment Analysis
            </h2>
            <p className="text-sm text-indigo-100 font-medium tracking-wide">
              {total.toLocaleString()} feedback analysed
            </p>
          </div>
        </div>

        {/* Dominant sentiment badge */}
        <div className="relative bg-white/20 backdrop-blur-sm p-3 px-4 rounded-2xl ring-1 ring-white/30 shadow-lg group hover:bg-white/30 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xl">{dominant.emoji}</span>
            <span className="text-sm font-bold text-white">
              Mostly {dominant.label}
            </span>
          </div>
        </div>
      </div>

      <div className="p-8 pb-6 space-y-8">
        
        {/* Sentiment score cards */}
        <div className="grid grid-cols-3 gap-4">
          {SENTIMENTS.map(s => {
            const val = sentimentData?.[s.key] || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div 
                key={s.key} 
                className={`group relative ${s.light} rounded-2xl p-6 text-center border border-opacity-20 shadow-lg hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 cursor-pointer active:scale-[0.98] overflow-hidden bg-gradient-to-b from-transparent/50 to-white/30 backdrop-blur-sm`}
              >
                {/* Decorative shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-20 group-hover:translate-x-20 transition-transform duration-1000" />
                
                <div className="relative z-10">
                  <div className="text-3xl mb-3">{s.emoji}</div>
                  <p className={`text-3xl font-black ${s.dark} mb-1 leading-none group-hover:scale-105 transition-transform`}>
                    {val.toLocaleString()}
                  </p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${s.dark} mb-4 opacity-80`}>
                    {s.label}
                  </p>
                  
                  {/* Animated progress bar */}
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden mb-3 backdrop-blur-sm">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  
                  <p className={`text-xs font-bold ${s.dark} opacity-90`}>
                    {pct}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-8">
          
          {/* Pie Chart */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Distribution</p>
            <div className="relative h-40 p-4 bg-slate-50/50 rounded-2xl backdrop-blur-sm border border-slate-100/50 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={1}
                    stroke="rgba(255,255,255,0.8)"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-2xl font-black text-slate-900 drop-shadow-sm mb-1">
                  {total.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  total
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Count</p>
            <div className="h-40 p-4 bg-slate-50/50 rounded-2xl backdrop-blur-sm border border-slate-100/50 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={32} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                    tickMargin={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                    tickMargin={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
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
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-100 rounded-2xl border border-indigo-200/50 shadow-sm hover:shadow-md transition-all duration-300">
            <span className="text-sm font-bold text-indigo-800 uppercase tracking-wider">
              Overall Sentiment Score
            </span>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
              {sentimentData.overallScore?.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SentimentAnalysis;