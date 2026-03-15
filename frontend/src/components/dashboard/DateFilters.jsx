import { Calendar, Clock } from 'lucide-react';

const filters = [
  { key: 'all',      label: 'All Time',     short: 'All',  icon: '∞' },
  { key: '7days',    label: 'Last 7 Days',  short: '7d',   icon: '7' },
  { key: '30days',   label: 'Last 30 Days', short: '30d',  icon: '30' },
  { key: 'semester', label: 'Semester',     short: 'Sem',  icon: '◑' },
];

const DateFilters = ({ currentFilter, onFilterChange }) => {
  const active = filters.find(f => f.key === currentFilter) || filters[0];

  return (
    <div className="group relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 h-full flex flex-col gap-6 overflow-hidden shadow-2xl shadow-indigo-500/25 hover:shadow-3xl hover:shadow-indigo-500/40 transition-all duration-500 backdrop-blur-xl border border-white/20">
      
      {/* Enhanced Decorative Elements */}
      <div className="absolute top-0 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-0 left-4 w-20 h-20 bg-white/5 rounded-full blur-lg [animation:custom-bounce_4s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30 shadow-lg group-hover:scale-105 transition-transform duration-300">
          <Calendar size={16} className="text-white drop-shadow-sm" />
        </div>
        <div>
          <p className="text-sm font-bold text-white drop-shadow-md tracking-tight">
            Time Period
          </p>
          <p className="text-xs text-indigo-100/80 font-medium tracking-wide">
            Filter feedback by date
          </p>
        </div>
      </div>

      {/* Premium Filter Chip Selector */}
      <div className="relative z-10 bg-black/20 backdrop-blur-xl rounded-2xl p-2 shadow-xl ring-1 ring-white/20">
        <div className="grid grid-cols-4 gap-2">
          {filters.map((filter) => {
            const isActive = currentFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => onFilterChange(filter.key)}
                title={filter.label}
                className={`relative p-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-[0.97] ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-2xl shadow-indigo-300/50 ring-4 ring-indigo-200/50 !scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 blur opacity-75 animate-pulse rounded-[inherit]" />
                )}
                <span className="relative z-10">{filter.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Display */}
      <div className="relative z-10 flex items-center justify-between pt-4 mt-auto border-t border-white/20">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 p-1 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
            <Clock size={10} className="text-white/70" />
          </div>
          <span className="text-xs text-white/70 font-medium tracking-wide">
            Showing
          </span>
        </div>
        
        <span className="group/active relative px-4 py-1.5 bg-white/90 backdrop-blur-xl text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg ring-1 ring-white/50 hover:shadow-xl hover:shadow-indigo-100/50 hover:scale-105 hover:bg-white transition-all duration-300 overflow-hidden">
          {active.label}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur opacity-0 group-hover/active:opacity-100 transition-opacity duration-300" />
        </span>
      </div>

      <style jsx>{`
        @keyframes custom-bounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }
        [animation="custom-bounce_4s_ease-in-out_infinite"] {
          animation: custom-bounce 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default DateFilters;