import { Link } from 'react-router-dom';
import { RefreshCw, Activity, Sparkles } from 'lucide-react';

const DashboardHeader = ({ 
  lastUpdated, 
  onRefresh, 
  loading 
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
      {/* Title Section */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1.5 font-medium">
          Overview of feedback and insights
        </p>
      </div>
      
      {/* Action Bar */}
      <div className="flex items-center gap-3">
        {/* Last Updated Indicator */}
        {lastUpdated && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
        
        {/* Chat with AI - Primary Action */}
        <Link
          to="/admin/chat"
          className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Chat with AI</span>
          <Sparkles className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
        </Link>
      </div>
    </div>
  );
};

export default DashboardHeader;