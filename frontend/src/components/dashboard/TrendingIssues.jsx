import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

const RANK_LABELS = ['🥇', '🥈', '🥉'];

const TrendingIssues = ({ trends }) => {
  const max = trends && trends.length > 0
    ? Math.max(...trends.map(t => t.count || 0))
    : 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 flex items-center justify-between">
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none mb-0.5">Trending Issues</h2>
            <p className="text-xs text-white/65">Most reported problems</p>
          </div>
        </div>

        {trends && trends.length > 0 && (
          <span className="relative text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full">
            {trends.length} issues
          </span>
        )}
      </div>

      {/* Content */}
      {trends && trends.length > 0 ? (
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          {trends.map((trend, index) => {
            const pct       = max > 0 ? Math.round((trend.count / max) * 100) : 0;
            const isRising  = trend.trend === 'up';
            const isFalling = trend.trend === 'down';
            const isTop     = index === 0;

            return (
              <div
                key={index}
                className={`group px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200
                  ${isTop
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-100'
                  }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    {/* Rank */}
                    <span className={`font-extrabold min-w-5 text-center
                      ${index < 3 ? 'text-base' : 'text-xs text-indigo-500'}`}>
                      {RANK_LABELS[index] || `#${index + 1}`}
                    </span>
                    <p className="text-sm font-bold text-slate-800">{trend.title}</p>
                  </div>

                  {/* Trend badge */}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
                    ${isRising  ? 'bg-red-50 text-red-700 border-red-200'
                    : isFalling ? 'bg-green-50 text-green-700 border-green-200'
                    :             'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {isRising  && <TrendingUp  className="w-3 h-3" />}
                    {isFalling && <TrendingDown className="w-3 h-3" />}
                    {!isRising && !isFalling && <Minus className="w-3 h-3" />}
                    {isRising ? 'Rising' : isFalling ? 'Falling' : 'Stable'}
                  </div>
                </div>

                {/* Progress bar + count */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700
                        ${isTop ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 min-w-fit">
                    {trend.count} mentions
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
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