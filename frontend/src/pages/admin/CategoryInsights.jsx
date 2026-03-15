import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { adminAPI } from '../../services/api';

const COLORS = [
  { bg: '#6366f1', light: 'bg-indigo-50',  text: 'text-indigo-700'  },
  { bg: '#10b981', light: 'bg-emerald-50', text: 'text-emerald-700' },
  { bg: '#f59e0b', light: 'bg-amber-50',   text: 'text-amber-700'   },
  { bg: '#ef4444', light: 'bg-red-50',     text: 'text-red-700'     },
  { bg: '#8b5cf6', light: 'bg-violet-50',  text: 'text-violet-700'  },
  { bg: '#ec4899', light: 'bg-pink-50',    text: 'text-pink-700'    },
  { bg: '#06b6d4', light: 'bg-cyan-50',    text: 'text-cyan-700'    },
  { bg: '#84cc16', light: 'bg-lime-50',    text: 'text-lime-700'    },
];

const MEDALS = ['🥇', '🥈', '🥉'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-indigo-950 rounded-xl px-4 py-2.5 shadow-xl">
        <p className="text-xs text-indigo-300 mb-1">{label || payload[0].name}</p>
        <p className="text-sm font-extrabold text-white">
          {payload[0].value}
          <span className="text-xs font-normal text-indigo-300 ml-1">submissions</span>
        </p>
      </div>
    );
  }
  return null;
};

const CategoryInsights = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selected,     setSelected]     = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getCategoryStats();
      setCategoryData(response.data.categoryData || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load category insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const total = categoryData.reduce((sum, c) => sum + (c.count || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading category data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-indigo-500/20"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}
      >
        <div className="absolute -top-5 -right-5 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white leading-none mb-0.5">Category Insights</h1>
            <p className="text-xs text-white/65">Analyze feedback distribution by category</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold border-none cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={fetchData} className="text-xs font-bold text-red-700 hover:text-red-900 bg-none border-none cursor-pointer">
            Try Again
          </button>
        </div>
      )}

      {categoryData.length > 0 ? (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Donut chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-indigo-950 mb-0.5">Distribution</h2>
              <p className="text-xs text-slate-400 mb-4">Breakdown of feedback by category</p>
              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={62} outerRadius={95}
                      paddingAngle={3} dataKey="count" nameKey="name" strokeWidth={0}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length].bg} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-black text-indigo-950 leading-none">{total}</p>
                  <p className="text-xs text-slate-400 mt-0.5">total</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length].bg }} />
                    <span className="text-xs text-slate-500">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-indigo-950 mb-0.5">Comparison</h2>
              <p className="text-xs text-slate-400 mb-4">Submissions per category</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f5" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90}
                      tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fafafa' }} />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category cards */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-indigo-950">All Categories</h2>
              <span className="ml-auto text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {categoryData.length} categories
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryData.map((cat, i) => {
                const color = COLORS[i % COLORS.length];
                const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                const isSelected = selected === cat.name;
                return (
                  <div
                    key={i}
                    onClick={() => setSelected(isSelected ? null : cat.name)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:-translate-y-0.5
                      ${isSelected ? `${color.light} border-current` : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}
                    style={{ borderColor: isSelected ? color.bg : undefined }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: color.bg }} />
                        <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                      </div>
                      <span className="text-lg font-black text-indigo-950">{cat.count}</span>
                    </div>
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color.bg }} />
                    </div>
                    <p className={`text-xs font-semibold text-right ${color.text}`}>{pct}% of total</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top categories ranked */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500">
              <TrendingUp className="w-4 h-4 text-white" />
              <h2 className="text-sm font-bold text-white">Top Categories by Volume</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {[...categoryData]
                .sort((a, b) => b.count - a.count)
                .map((cat, i) => {
                  const color = COLORS[categoryData.indexOf(cat) % COLORS.length];
                  const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <span className={`font-extrabold min-w-7 ${i < 3 ? 'text-lg' : 'text-xs text-slate-400'}`}>
                        {MEDALS[i] || `#${i + 1}`}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm font-semibold text-slate-700">{cat.name}</span>
                          <span className="text-xs font-bold text-slate-500">{cat.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color.bg }} />
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full min-w-10 text-center ${color.light} ${color.text}`}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-base font-bold text-indigo-950">No Category Data Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm">Category insights will appear here once students submit feedback.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryInsights;