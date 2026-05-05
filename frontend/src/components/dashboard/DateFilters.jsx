import { Calendar } from 'lucide-react';

const filters = [
  { key: 'all', label: 'All Time' },
  { key: '7days', label: 'Last 7 Days' },
  { key: '30days', label: 'Last 30 Days' },
  { key: 'semester', label: 'Semester' },
];

const DateFilters = ({ currentFilter, onFilterChange }) => {
  return (
    <div className="font-sans">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          <Calendar size={17} />
        </div>

        <div>
          <p className="m-0 text-sm font-black text-slate-950">
            Filter Overview
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Choose the feedback period
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filters.map((filter) => {
          const isActive = currentFilter === filter.key;

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilterChange(filter.key)}
              className={`
                rounded-2xl border px-4 py-3 text-left text-sm font-bold transition
                ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                }
              `}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateFilters;