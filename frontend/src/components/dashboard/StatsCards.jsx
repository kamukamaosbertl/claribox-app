import { MessageSquare, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';

const StatsCards = ({ stats, type = 'all', onResolvedClick }) => {
  if (!stats) {
    return (
      <div className="h-[160px] bg-gradient-to-br from-slate-50/80 to-indigo-50/60 backdrop-blur-xl border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-lg animate-pulse">
        <div className="w-12 h-12 bg-indigo-100/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <MessageSquare size={24} className="text-indigo-400" />
        </div>
        <span className="text-sm font-semibold text-indigo-500 tracking-wide">Loading stats...</span>
      </div>
    );
  }

  const resolvedPercent = stats.total > 0
    ? Math.round((stats.resolved / stats.total) * 100)
    : 0;

  const pendingPercent = stats.total > 0
    ? Math.round((stats.pending / stats.total) * 100)
    : 0;

  /* ---- RESOLVED CARD ---- */
  if (type === 'resolved') {
    return (
      <div
        onClick={onResolvedClick}
        className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl p-8 shadow-2xl shadow-emerald-500/30 hover:shadow-3xl hover:shadow-emerald-500/50 hover:-translate-y-2 active:scale-[0.98] transition-all duration-500 cursor-pointer overflow-hidden h-full border border-white/20 backdrop-blur-xl hover:border-white/40"
      >
        {/* Premium decorative orbs */}
        <div className="absolute top-0 -right-6 w-24 h-24 bg-white/15 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-0 left-6 w-20 h-20 bg-white/10 rounded-full blur-lg [animation:bounce_3s_ease-in-out_infinite]" />
        
        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 -skew-x-12 -translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200/90 mb-2">
                Resolved Issues
              </p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-4xl lg:text-5xl font-black text-white drop-shadow-2xl leading-none">
                  {stats.resolved || 0}
                </h3>
                <span className="text-sm font-bold bg-white/25 backdrop-blur-sm text-white px-3 py-1 rounded-full shadow-lg">
                  {resolvedPercent}%
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/30 shadow-xl group-hover:scale-110 transition-all duration-300">
              <CheckCircle size={24} className="text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Premium Progress Bar */}
          <div className="space-y-3">
            <div className="h-2 bg-white/30 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-white/90 to-white rounded-full shadow-lg transition-all duration-1000 ease-out"
                style={{ width: `${resolvedPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-100/90 tracking-wide">
                Resolution Rate
              </span>
              <ArrowRight size={16} className="text-emerald-200/80 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- TOTAL FEEDBACK CARD (default) ---- */
  return (
    <div className="group relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl shadow-indigo-500/30 hover:shadow-3xl hover:shadow-indigo-500/50 hover:-translate-y-2 active:scale-[0.98] transition-all duration-500 overflow-hidden h-full border border-white/20 backdrop-blur-xl hover:border-white/40">
      
      {/* Premium decorative orbs */}
      <div className="absolute top-0 -right-6 w-28 h-28 bg-white/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-0 left-6 w-24 h-24 bg-white/10 rounded-full blur-lg [animation:bounce_4s_ease-in-out_infinite]" />
      
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-white/10 -skew-x-12 -translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-200/90 mb-3">
              Total Feedback
            </p>
            <h3 className="text-4xl lg:text-5xl font-black text-white drop-shadow-2xl leading-none">
              {stats.total || 0}
            </h3>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/30 shadow-xl group-hover:scale-110 transition-all duration-300">
            <MessageSquare size={24} className="text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Pending Stats */}
        <div className="pt-6 border-t border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-400/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-amber-400/30">
                <TrendingUp size={14} className="text-amber-300" />
              </div>
              <span className="text-sm font-semibold text-indigo-200/90">
                {stats.pending || 0} pending
              </span>
            </div>
            <span className="text-xs font-bold bg-white/25 backdrop-blur-sm text-indigo-100 px-3 py-1 rounded-full shadow-lg">
              {pendingPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;