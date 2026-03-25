import { MessageSquare, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';

// ── Shared tokens (mirrors Dashboard.jsx tokens) ──────────────────────────
const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

// ── Skeleton / loading card ───────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div
    style={{
      height: '160px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      borderRadius: '20px',
      border: '1.5px dashed #D9E3F0',
      background: '#FFFFFF',
      padding: '24px',
      boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
      animation: 'pulse 1.8s ease-in-out infinite',
      fontFamily: font,
    }}
  >
    <div
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: '#EFF6FF',
        border: '1px solid #DBEAFE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MessageSquare size={20} color="#93C5FD" />
    </div>
    <span
      style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#94A3B8',
        letterSpacing: '-0.01em',
      }}
    >
      Loading stats…
    </span>

    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.55; }
      }
    `}</style>
  </div>
);

// ── Resolved card ─────────────────────────────────────────────────────────
const ResolvedCard = ({ stats, resolvedPercent, onResolvedClick }) => {
  const handleEnter = (e) => {
    e.currentTarget.style.transform = 'translateY(-3px)';
    e.currentTarget.style.boxShadow = '0 16px 36px rgba(34,197,94,0.14)';
    e.currentTarget.style.borderColor = '#86EFAC';
  };
  const handleLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.06)';
    e.currentTarget.style.borderColor = '#BBF7D0';
  };

  return (
    <button
      type="button"
      onClick={onResolvedClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        border: '1px solid #BBF7D0',
        borderRadius: '20px',
        padding: '24px',
        textAlign: 'left',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
        transition: 'all 0.22s ease',
        fontFamily: font,
        overflow: 'hidden',
      }}
    >
      {/* Soft green mesh in corner */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Label */}
          <p
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: '#16A34A',
              margin: '0 0 10px',
            }}
          >
            Resolved Issues
          </p>

          {/* Number + percent pill */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <span
              style={{
                fontSize: '42px',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.045em',
                color: '#0F172A',
              }}
            >
              {stats.resolved || 0}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '20px',
                padding: '3px 9px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#15803D',
                marginBottom: '6px',
              }}
            >
              {resolvedPercent}%
            </span>
          </div>
        </div>

        {/* Icon tile */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
            border: '1px solid #86EFAC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(34,197,94,0.15)',
          }}
        >
          <CheckCircle size={22} color="#16A34A" />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 'auto' }}>
        <div
          style={{
            height: '6px',
            borderRadius: '99px',
            background: '#DCFCE7',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${resolvedPercent}%`,
              borderRadius: '99px',
              background: 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)',
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 6px rgba(34,197,94,0.4)',
            }}
          />
        </div>

        {/* Footer row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
            Resolution Rate
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#16A34A',
            }}
          >
            View details
            <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </button>
  );
};

// ── Total feedback card ───────────────────────────────────────────────────
const TotalCard = ({ stats }) => {
  const handleEnter = (e) => {
    e.currentTarget.style.transform = 'translateY(-3px)';
    e.currentTarget.style.boxShadow = '0 16px 36px rgba(37,99,235,0.14)';
    e.currentTarget.style.borderColor = '#93C5FD';
  };
  const handleLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.06)';
    e.currentTarget.style.borderColor = '#BFDBFE';
  };

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        border: '1px solid #BFDBFE',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
        transition: 'all 0.22s ease',
        fontFamily: font,
        overflow: 'hidden',
      }}
    >
      {/* Blue mesh in corner */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: '#2563EB',
              margin: '0 0 10px',
            }}
          >
            Total Feedback
          </p>

          <span
            style={{
              fontSize: '42px',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.045em',
              color: '#0F172A',
            }}
          >
            {stats.total || 0}
          </span>
        </div>

        {/* Icon tile */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(37,99,235,0.12)',
          }}
        >
          <MessageSquare size={22} color="#2563EB" />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 'auto',
          borderTop: '1px solid #F1F5F9',
          paddingTop: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
          Feedback submissions recorded
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#2563EB',
            background: '#EFF6FF',
            border: '1px solid #DBEAFE',
            borderRadius: '20px',
            padding: '2px 8px',
          }}
        >
          <TrendingUp size={11} />
          Active
        </span>
      </div>
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────
const StatsCards = ({ stats, type = 'all', onResolvedClick }) => {
  if (!stats) return <LoadingSkeleton />;

  const resolvedPercent =
    stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  if (type === 'resolved') {
    return (
      <ResolvedCard
        stats={stats}
        resolvedPercent={resolvedPercent}
        onResolvedClick={onResolvedClick}
      />
    );
  }

  return (
    <TotalCard stats={stats} />
  );
};

export default StatsCards;