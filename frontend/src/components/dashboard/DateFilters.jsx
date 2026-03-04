import { Calendar, Check } from 'lucide-react';

const DateFilters = ({ currentFilter, onFilterChange }) => {
  const filters = [
    { key: 'all', label: 'All Time' },
    { key: '7days', label: 'Last 7 Days' },
    { key: '30days', label: 'Last 30 Days' },
    { key: 'semester', label: 'Last Semester' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
          <Calendar className="w-5 h-5 text-slate-600" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Time Period
        </h3>
      </div>
      
      {/* Filter Buttons - Styled as modern Pills */}
      <div className="flex flex-wrap gap-2.5">
        {filters.map((filter) => {
          const isActive = currentFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={`
                relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 
                flex items-center gap-2
                ${isActive
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-300/50' // Dark active state (or change to bg-blue-600)
                  : 'bg-slate-50 text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-md border border-transparent hover:border-slate-200'
                }
              `}
            >
              {isActive && <Check className="w-3.5 h-3.5" />}
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Footer Status */}
      <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Filtering by</span>
        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <span className="text-xs font-bold text-slate-700">
            {filters.find(f => f.key === currentFilter)?.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DateFilters;