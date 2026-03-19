import { Link } from 'react-router-dom';
import { RefreshCw, Sparkles, Bot } from 'lucide-react';

const DashboardHeader = ({ lastUpdated, onRefresh, loading, admin }) => {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const today = new Date().toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <div className="flex flex-col gap-6 pb-8 border-b border-slate-200/60 backdrop-blur-sm bg-white/60 rounded-3xl p-8 -mx-6 lg:-mx-8 mb-8 shadow-xl shadow-slate-100/50 hover:shadow-2xl transition-all duration-500">
      
      {/* Main Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 lg:gap-8">
        
        {/* Left: Greeting + Date */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent drop-shadow-2xl leading-tight tracking-tight">
              {greeting()}, {admin?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <span className="text-2xl"></span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <p className="text-slate-500 font-medium tracking-wide capitalize">
              {today}
            </p>
            
            {lastUpdated && (
              <>
                <span className="text-slate-300 mx-1">·</span>
                <div className="flex items-center gap-2 bg-slate-100/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                  <div className="relative w-2 h-2">
                    <span className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full opacity-60 animate-ping" />
                    <span className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-emerald-500/30" />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">
                    Updated {formatTime(lastUpdated)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {/* Enhanced Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
            className="group relative p-3 rounded-2xl border-2 border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-300 hover:bg-indigo-50/80 active:scale-95 active:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center w-12 h-12"
          >
            <RefreshCw
              size={18}
              className={`text-slate-600 group-hover:text-indigo-600 transition-colors duration-200 ${loading ? 'animate-spin' : ''}`}
            />
            {loading && (
              <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>

          {/* Premium AI Chat Button */}
          <Link
            to="/admin/chat"
            className="group relative flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-semibold text-sm shadow-2xl shadow-indigo-500/25 hover:shadow-3xl hover:shadow-indigo-500/40 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 active:scale-[0.97] active:shadow-xl transition-all duration-300 overflow-hidden transform-gpu ring-1 ring-indigo-500/30 backdrop-blur-sm"
          >
            <Bot size={16} className="group-hover:scale-110 transition-transform duration-200 drop-shadow-sm" />
            <span>Ask AI</span>
            <Sparkles 
              size={14} 
              className="ml-1 opacity-80 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-300 drop-shadow-sm"
            />
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Link>
        </div>
      </div>

      {/* Subtitle + Role Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="text-slate-600 text-sm lg:text-base font-medium leading-relaxed max-w-2xl">
          Here's what's happening with student feedback across your institution.
        </p>
        
        {admin?.role && (
          <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-200/50 shadow-sm hover:shadow-md hover:bg-indigo-200/80 transition-all duration-200">
            {admin.role}
          </span>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;