import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertCircle, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminAPI } from '../../services/api';

const PALETTE = [
  '#2563EB',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

const EMOTION_CONFIG = {
  joy: { emoji: '😊', label: 'Joy' },
  anger: { emoji: '😠', label: 'Anger' },
  sadness: { emoji: '😔', label: 'Sadness' },
  fear: { emoji: '😟', label: 'Fear' },
  surprise: { emoji: '😮', label: 'Surprise' },
  disgust: { emoji: '🤢', label: 'Disgust' },
  neutral: { emoji: '😐', label: 'Neutral' },
};

const getTopEmotion = (emotions = {}) => {
  const top = Object.entries(emotions)
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => b[1] - a[1])[0];

  if (!top) return null;

  const [key, count] = top;
  const meta = EMOTION_CONFIG[key] || {
    emoji: '💬',
    label: key.replace(/_/g, ' '),
  };

  return {
    key,
    count,
    ...meta,
  };
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-black text-slate-950">
        {payload[0].name}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {payload[0].value} submissions
      </p>
    </div>
  );
};

const CategoryInsights = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.getCategoryStats();
      setCategoryData(response.data.categoryData || []);
    } catch (err) {
      console.error('Category insights error:', err);
      setError('Failed to load category insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const total = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  }, [categoryData]);

  const sortedCategories = useMemo(() => {
    return [...categoryData].sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [categoryData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-white" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="h-[420px] animate-pulse rounded-3xl bg-white xl:col-span-5" />
          <div className="h-[420px] animate-pulse rounded-3xl bg-white xl:col-span-7" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
            <PieIcon size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
              Category Insights
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              See which feedback areas need the most attention.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={18} className="mt-0.5 text-red-600" />
          <p className="flex-1 text-sm font-semibold text-red-700">
            {error}
          </p>
          <button onClick={fetchData} className="text-sm font-black text-red-700">
            Try Again
          </button>
        </div>
      )}

      {categoryData.length > 0 ? (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] xl:col-span-5">
            <div className="mb-5">
              <h2 className="text-base font-black text-slate-950">
                Category Distribution
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Share of total feedback by category.
              </p>
            </div>

            <div className="relative h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={78}
                    outerRadius={112}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                    stroke="none"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-black tracking-[-0.06em] text-slate-950">
                  {total}
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  feedback
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] xl:col-span-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-green-600">
                <TrendingUp size={18} />
              </div>

              <div>
                <h2 className="text-base font-black text-slate-950">
                  Category Comparison
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ranked by number of submissions.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {sortedCategories.map((category, index) => {
                const pct = total > 0 ? Math.round((category.count / total) * 100) : 0;
                const color = PALETTE[index % PALETTE.length];
                const topEmotion = getTopEmotion(category.emotions);

                return (
                  <div key={category.name || index}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: color }}
                          />
                          <p className="truncate text-sm font-black capitalize text-slate-800">
                            {category.name}
                          </p>
                        </div>

                        {topEmotion && (
                          <p className="mt-1 text-xs text-slate-500">
                            Top feeling: {topEmotion.emoji} {topEmotion.label}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-slate-950">
                          {category.count}
                        </p>
                        <p className="text-xs font-bold text-slate-400">
                          {pct}%
                        </p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
            <PieIcon size={24} />
          </div>

          <h3 className="text-base font-black text-slate-950">
            No Category Data Yet
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Category insights will appear once students submit feedback.
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryInsights;