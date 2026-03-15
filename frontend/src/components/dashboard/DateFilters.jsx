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
    <div style={{
      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)',
      borderRadius: '16px',
      padding: '20px 22px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Decorative background circles */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '100px', height: '100px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-30px', left: '30px',
        width: '80px', height: '80px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        <div style={{
          width: '34px', height: '34px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          backdropFilter: 'blur(4px)'
        }}>
          <Calendar size={15} color="#fff" />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0 }}>
            Time Period
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            Filter feedback by date
          </p>
        </div>
      </div>

      {/* Filter buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '12px',
        padding: '4px',
        gap: '3px',
        position: 'relative'
      }}>
        {filters.map((filter) => {
          const isActive = currentFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              title={filter.label}
              style={{
                padding: '9px 4px',
                borderRadius: '9px',
                border: 'none',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? '#4f46e5' : 'rgba(255,255,255,0.7)',
                fontSize: '12px',
                fontWeight: isActive ? 800 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {filter.short}
            </button>
          );
        })}
      </div>

      {/* Active label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        marginTop: 'auto',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={11} color="rgba(255,255,255,0.6)" />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
            Showing
          </span>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#4f46e5',
          background: '#fff',
          padding: '3px 12px',
          borderRadius: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          {active.label}
        </span>
      </div>

    </div>
  );
};

export default DateFilters;