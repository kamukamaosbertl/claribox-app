import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const RANK_LABELS = ['🥇', '🥈', '🥉'];

const CATEGORY_COLORS = {
  academic:   '#6366F1',
  library:    '#22C55E',
  it:         '#06B6D4',
  facilities: '#F59E0B',
  canteen:    '#EAB308',
  transport:  '#8B5CF6',
  hostel:     '#F43F5E',
  admin:      '#64748B',
  other:      '#94A3B8',
};

const TrendingIssues = ({ trends }) => {
  const max = trends?.length > 0 ? Math.max(...trends.map((t) => t.count || 0)) : 1;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden', fontFamily: font,
    }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)',
        padding: '16px 20px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          position: 'absolute', top: '-16px', right: '-16px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={16} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
              Trending Issues
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 500 }}>
              ↑ rising · ↓ improving this week
            </p>
          </div>
        </div>

        {trends?.length > 0 && (
          <span style={{
            position: 'relative',
            fontSize: '11px', fontWeight: 700, color: '#FFFFFF',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '20px', padding: '4px 10px',
          }}>
            {trends.length} issues
          </span>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {trends?.length > 0 ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trends.map((trend, index) => {
            const pct       = max > 0 ? Math.round((trend.count / max) * 100) : 0;
            const isRising  = trend.trend === 'up';
            const isFalling = trend.trend === 'down';
            const isTop     = index === 0;
            const catColor  = CATEGORY_COLORS[trend.title?.toLowerCase()] || CATEGORY_COLORS.other;

            const changeLabel = trend.change > 0
              ? `+${trend.change} this week`
              : trend.change < 0
                ? `${trend.change} this week`
                : 'same as last week';

            // Card background logic
            const cardBg     = isTop     ? '#FFFBEB'
                             : isFalling ? '#F0FDF4'
                             :             '#FAFBFC';
            const cardBorder = isTop     ? '#FDE68A'
                             : isFalling ? '#BBF7D0'
                             :             '#E2E8F0';

            // Trend badge
            const trendBg    = isRising  ? 'rgba(239,68,68,0.08)'
                             : isFalling ? 'rgba(34,197,94,0.08)'
                             :             'rgba(100,116,139,0.08)';
            const trendBorder= isRising  ? 'rgba(239,68,68,0.25)'
                             : isFalling ? 'rgba(34,197,94,0.25)'
                             :             'rgba(100,116,139,0.2)';
            const trendColor = isRising  ? '#B91C1C'
                             : isFalling ? '#15803D'
                             :             '#64748B';

            // Bar color
            const barColor   = isTop     ? '#F59E0B'
                             : isFalling ? '#22C55E'
                             :             catColor;

            return (
              <div
                key={index}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '14px',
                  padding: '12px 14px',
                  transition: 'all 0.18s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top row */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Rank */}
                    <span style={{
                      fontSize: index < 3 ? '15px' : '11px',
                      fontWeight: 800,
                      color: index < 3 ? 'inherit' : '#6366F1',
                      minWidth: '20px', textAlign: 'center',
                      lineHeight: 1,
                    }}>
                      {RANK_LABELS[index] || `#${index + 1}`}
                    </span>

                    {/* Category dot */}
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: catColor, flexShrink: 0,
                      boxShadow: `0 0 0 2px ${catColor}28`,
                    }} />

                    {/* Category name */}
                    <p style={{
                      fontSize: '13px', fontWeight: 700,
                      color: '#0F172A', margin: 0,
                      textTransform: 'capitalize', letterSpacing: '-0.01em',
                    }}>
                      {trend.title}
                    </p>
                  </div>

                  {/* Trend badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: trendBg, border: `1px solid ${trendBorder}`,
                    borderRadius: '20px', padding: '3px 9px',
                    fontSize: '10.5px', fontWeight: 700, color: trendColor,
                  }}>
                    {isRising  && <TrendingUp  size={11} color={trendColor} />}
                    {isFalling && <TrendingDown size={11} color={trendColor} />}
                    {!isRising && !isFalling && <Minus size={11} color={trendColor} />}
                    {isRising ? 'Rising' : isFalling ? 'Improving' : 'Stable'}
                  </div>
                </div>

                {/* Progress bar + count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
                  <div style={{
                    flex: 1, height: '5px', borderRadius: '99px',
                    background: '#E2E8F0', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      borderRadius: '99px', background: barColor,
                      boxShadow: `0 0 5px ${barColor}55`,
                      transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, color: '#64748B',
                    whiteSpace: 'nowrap', minWidth: 'fit-content',
                  }}>
                    {trend.count} total
                  </span>
                </div>

                {/* Change label + week comparison */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    color: isRising ? '#EF4444' : isFalling ? '#16A34A' : '#94A3B8',
                  }}>
                    {changeLabel}
                  </span>
                  {(trend.thisWeek !== undefined || trend.lastWeek !== undefined) && (
                    <span style={{ fontSize: '10.5px', color: '#CBD5E1', fontWeight: 500 }}>
                      {trend.thisWeek ?? 0} this wk · {trend.lastWeek ?? 0} last wk
                    </span>
                  )}
                </div>

                {/* Resolution impact note */}
                {isFalling && (
                  <div style={{
                    marginTop: '9px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(34,197,94,0.10)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '8px', padding: '6px 10px',
                  }}>
                    <span style={{ fontSize: '12px' }}>✅</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803D' }}>
                      Feedback reducing — resolution may be working
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '12px', padding: '40px 24px', textAlign: 'center',
          background: '#FAFBFC',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            border: '1px solid #BFDBFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.10)',
          }}>
            <BarChart3 size={22} color="#2563EB" />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>
            No trending issues
          </p>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, maxWidth: '200px', lineHeight: '1.5' }}>
            Issues will appear here as feedback grows.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendingIssues;