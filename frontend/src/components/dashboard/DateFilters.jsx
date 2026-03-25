import { Calendar, Clock, ChevronRight } from 'lucide-react';

const filters = [
  { key: 'all', label: 'All Time', short: 'All', desc: 'Every submission' },
  { key: '7days', label: 'Last 7 Days', short: '7d', desc: 'Past week' },
  { key: '30days', label: 'Last 30 Days', short: '30d', desc: 'Past month' },
  { key: 'semester', label: 'This Semester', short: 'Sem', desc: 'Academic period' },
];

const DateFilters = ({ currentFilter, onFilterChange }) => {
  const active = filters.find((f) => f.key === currentFilter) || filters[0];

  return (
    <div className="flex h-full flex-col font-sans">
      {/* Header */}
      <div className="mb-[18px] flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-[#BFDBFE] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] shadow-[0_3px_8px_rgba(37,99,235,0.10)]">
          <Calendar size={16} color="#2563EB" />
        </div>

        <div>
          <p className="m-0 text-[13px] font-bold tracking-[-0.02em] text-[#0F172A]">
            Time Period
          </p>
          <p className="mt-[2px] text-[11px] font-medium text-[#94A3B8]">
            Filter feedback by date range
          </p>
        </div>
      </div>

      {/* Filter tiles */}
      <div className="grid flex-1 grid-cols-2 gap-2">
        {filters.map((filter) => {
          const isActive = currentFilter === filter.key;

          return (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              title={filter.label}
              className={[
                'relative flex flex-col items-start justify-between overflow-hidden rounded-[13px] px-3 pb-[10px] pt-[11px] transition-all duration-150 ease-in-out',
                isActive
                  ? 'border-[1.5px] border-[#2563EB] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_6px_16px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'border border-[#E2E8F0] bg-[#FAFBFC] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:-translate-y-[1px] hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:shadow-[0_4px_12px_rgba(37,99,235,0.09)]',
              ].join(' ')}
            >
              {isActive && (
                <div className="pointer-events-none absolute right-[-8px] top-[-8px] h-[52px] w-[52px] rounded-full bg-[rgba(255,255,255,0.09)]" />
              )}

              <span
                className={[
                  'relative mb-[5px] text-[18px] font-extrabold leading-none tracking-[-0.04em]',
                  isActive ? 'text-white' : 'text-[#0F172A]',
                ].join(' ')}
              >
                {filter.short}
              </span>

              <span
                className={[
                  'relative text-[10px] font-medium leading-none tracking-[0.01em]',
                  isActive ? 'text-[rgba(255,255,255,0.65)]' : 'text-[#94A3B8]',
                ].join(' ')}
              >
                {filter.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active summary footer */}
      <div className="mt-[14px] flex items-center justify-between gap-2 border-t border-[#F1F5F9] pt-[13px]">
        <div className="flex items-center gap-[7px]">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] border border-[#E2E8F0] bg-[#F8FAFC]">
            <Clock size={12} color="#94A3B8" />
          </div>
          <span className="text-[11px] font-medium text-[#94A3B8]">
            Now showing
          </span>
        </div>

        <span className="inline-flex items-center gap-[3px] whitespace-nowrap rounded-[20px] border border-[#DBEAFE] bg-[#EFF6FF] px-[11px] py-[3px] pr-[9px] text-[11px] font-bold tracking-[-0.01em] text-[#2563EB]">
          {active.label}
          <ChevronRight size={11} strokeWidth={2.5} />
        </span>
      </div>
    </div>
  );
};

export default DateFilters;