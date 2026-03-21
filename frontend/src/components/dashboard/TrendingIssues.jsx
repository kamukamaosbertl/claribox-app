import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

const RANK_LABELS = ['🥇', '🥈', '🥉'];

// ── Category colors for dot indicators ───────────────────────────────────────
const CATEGORY_COLORS = {
  academic:   'bg-indigo-500',
  library:    'bg-green-500',
  it:         'bg-cyan-500',
  facilities: 'bg-orange-500',
  canteen:    'bg-yellow-500',
  transport:  'bg-purple-500',
  hostel:     'bg-rose-500',
  admin:      'bg-slate-400',
  other:      'bg-slate-400',
};

// ── TrendingIssues component ──────────────────────────────────────────────────
// Shows top categories by feedback count
// trend = 'up'     → more feedback this week than last → problem getting worse
// trend = 'down'   → less feedback this week → problem improving (resolution working!)
// trend = 'stable' → same as last week
// change           → exact number difference e.g. +3 or -2
const TrendingIssues = ({ trends }) => {
  const max = trends && trends.length > 0
    ? Math.max(...trends.map(t => t.count || 0))
    : 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 flex items-center justify-between">
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none mb-0.5">Trending Issues</h2>
            {/* Subtitle explains what the trend arrows mean */}
            <p className="text-xs text-white/65">↑ rising · ↓ improving this week</p>
          </div>
        </div>
        {trends && trends.length > 0 && (
          <span className="relative text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full">
            {trends.length} issues
          </span>
        )}
      </div>

      {/* ── Content ── */}
      {trends && trends.length > 0 ? (
        <div className="p-4 flex flex-col gap-2.5 flex-1 overflow-y-auto">
          {trends.map((trend, index) => {
            // How wide the progress bar should be relative to the top item
            const pct       = max > 0 ? Math.round((trend.count / max) * 100) : 0;
            const isRising  = trend.trend === 'up';
            const isFalling = trend.trend === 'down';
            const isTop     = index === 0;
            const catColor  = CATEGORY_COLORS[trend.title?.toLowerCase()] || 'bg-slate-400';

            // Format change number e.g. +3, -2, 0
            const changeLabel = trend.change > 0
              ? `+${trend.change} this week`
              : trend.change < 0
                ? `${trend.change} this week`
                : 'same as last week';

            return (
              <div
                key={index}
                className={`group px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm
                  ${isTop
                    ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                    : isFalling
                      // Green tint when falling — resolution is working!
                      ? 'bg-green-50/50 border-green-100 hover:bg-green-50'
                      : 'bg-slate-50 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200'
                  }`}
              >
                {/* ── Top row: rank + title + trend badge ── */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    {/* Rank medal or number */}
                    <span className={`font-extrabold min-w-5 text-center
                      ${index < 3 ? 'text-base' : 'text-xs text-indigo-500'}`}>
                      {RANK_LABELS[index] || `#${index + 1}`}
                    </span>

                    {/* Category color dot */}
                    <div className={`w-2 h-2 rounded-full ${catColor} flex-shrink-0`} />

                    {/* Category name */}
                    <p className="text-sm font-bold text-slate-800 capitalize">{trend.title}</p>
                  </div>

                  {/* ── Trend badge ── */}
                  {/* Shows rising/falling/stable with color coding */}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
                    ${isRising
                      ? 'bg-red-50 text-red-700 border-red-200'      // red = getting worse
                      : isFalling
                        ? 'bg-green-50 text-green-700 border-green-200' // green = improving
                        : 'bg-slate-100 text-slate-500 border-slate-200' // grey = stable
                    }`}>
                    {isRising  && <TrendingUp   className="w-3 h-3" />}
                    {isFalling && <TrendingDown className="w-3 h-3" />}
                    {!isRising && !isFalling && <Minus className="w-3 h-3" />}
                    <span>
                      {isRising ? 'Rising' : isFalling ? 'Improving' : 'Stable'}
                    </span>
                  </div>
                </div>

                {/* ── Progress bar + count ── */}
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700
                        ${isTop
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                          : isFalling
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 min-w-fit">
                    {trend.count} total
                  </span>
                </div>

                {/* ── This week vs last week ── */}
                {/* Shows the actual change number so admin knows exactly how much */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium
                    ${isRising  ? 'text-red-500'
                    : isFalling ? 'text-green-600'
                    :             'text-slate-400'}`}>
                    {changeLabel}
                  </span>

                  {/* Show this week / last week counts if available */}
                  {(trend.thisWeek !== undefined || trend.lastWeek !== undefined) && (
                    <span className="text-xs text-slate-400">
                      {trend.thisWeek ?? 0} this wk · {trend.lastWeek ?? 0} last wk
                    </span>
                  )}
                </div>

                {/* ── Resolution impact note ── */}
                {/* Shows a green note when category is improving */}
                {isFalling && (
                  <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 rounded-lg">
                    <span className="text-xs">✅</span>
                    <span className="text-xs text-green-700 font-semibold">
                      Feedback reducing — resolution may be working
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No trending issues</p>
          <p className="text-xs text-slate-400 text-center max-w-xs">
            Issues will appear here as feedback grows.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendingIssues;