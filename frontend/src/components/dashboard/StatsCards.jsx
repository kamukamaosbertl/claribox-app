import { MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

const StatsCards = ({ stats, type = 'all', onResolvedClick }) => {
  // 1. Improved Loading State
  if (!stats) {
    return (
      <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 animate-pulse">
        <MessageSquare className="w-6 h-6 text-gray-300" />
        <span className="text-xs text-gray-400 font-medium">Loading data...</span>
      </div>
    );
  }

  // Helper calculation
  const resolvedPercent = stats.total > 0 
    ? Math.round((stats.resolved / stats.total) * 100) 
    : 0;

  // --- TYPE: RESOLVED ---
  if (type === 'resolved') {
    return (
      <div 
        onClick={onResolvedClick} 
        className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Decorative Background Glow (Green) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-green-100 transition-colors duration-500"></div>

        <div className="relative z-10 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              {/* Label with Badge style */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-800">{stats.resolved || 0}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                  {resolvedPercent}%
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Resolved Issues</p>
            </div>
            
            {/* Icon Container with Gradient */}
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xs font-medium text-slate-400">Resolution Rate</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${resolvedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Hover Action Arrow (Visible on Hover) */}
        <div className="absolute bottom-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <ArrowRight className="w-5 h-5 text-green-600" />
        </div>
      </div>
    );
  }

  // --- TYPE: TOTAL (Default) ---
  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
      {/* Decorative Background Glow (Blue) */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-100 transition-colors duration-500"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Feedback</p>
             <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.total || 0}</h3>
          </div>
          
          {/* Icon Container with Gradient */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-center gap-2 text-slate-500">
           <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              <MessageSquare className="w-3 h-3" />
           </span>
           <span className="text-xs font-medium">All submissions</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;