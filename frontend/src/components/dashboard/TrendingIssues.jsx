import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7c2f', '#6366f1', '#6366f1'];
const RANK_LABELS = ['🥇', '🥈', '🥉', '4', '5'];

const TrendingIssues = ({ trends }) => {
  const max = trends && trends.length > 0
    ? Math.max(...trends.map(t => t.count || 0))
    : 1;

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #f0f0f5',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>

      {/* Header - indigo gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-15px', right: '-15px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={15} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Trending Issues
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Most reported problems
            </p>
          </div>
        </div>
        {trends && trends.length > 0 && (
          <span style={{
            fontSize: '11px', fontWeight: 700,
            background: 'rgba(255,255,255,0.2)',
            color: '#fff', padding: '3px 10px',
            borderRadius: '20px'
          }}>
            {trends.length} issues
          </span>
        )}
      </div>

      {/* Content */}
      {trends && trends.length > 0 ? (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {trends.map((trend, index) => {
            const pct = max > 0 ? Math.round((trend.count / max) * 100) : 0;
            const isRising = trend.trend === 'up';
            const isFalling = trend.trend === 'down';

            return (
              <div
                key={index}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: index === 0 ? '#fefce8' : '#fafafa',
                  border: index === 0 ? '1px solid #fde68a' : '1px solid #f0f0f5',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#eef2ff';
                  e.currentTarget.style.borderColor = '#c7d2fe';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = index === 0 ? '#fefce8' : '#fafafa';
                  e.currentTarget.style.borderColor = index === 0 ? '#fde68a' : '#f0f0f5';
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Rank */}
                    <span style={{
                      fontSize: index < 3 ? '16px' : '11px',
                      fontWeight: 800,
                      color: index < 3 ? undefined : RANK_COLORS[index],
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {RANK_LABELS[index] || `#${index + 1}`}
                    </span>
                    <p style={{
                      fontSize: '13px', fontWeight: 700,
                      color: '#1e1b4b', margin: 0
                    }}>
                      {trend.title}
                    </p>
                  </div>

                  {/* Trend badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '3px 9px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: 700,
                    background: isRising ? '#fff1f2' : isFalling ? '#f0fdf4' : '#f8fafc',
                    color: isRising ? '#be123c' : isFalling ? '#15803d' : '#64748b',
                    border: `1px solid ${isRising ? '#fecdd3' : isFalling ? '#bbf7d0' : '#e2e8f0'}`
                  }}>
                    {isRising && <TrendingUp size={11} />}
                    {isFalling && <TrendingDown size={11} />}
                    {!isRising && !isFalling && <Minus size={11} />}
                    {isRising ? 'Rising' : isFalling ? 'Falling' : 'Stable'}
                  </div>
                </div>

                {/* Progress bar + count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    flex: 1, height: '5px',
                    background: '#e5e7eb',
                    borderRadius: '5px', overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: index === 0
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #6366f1, #818cf8)',
                      borderRadius: '5px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: '#6b7280', minWidth: '60px', textAlign: 'right'
                  }}>
                    {trend.count} mentions
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', gap: '12px',
          background: '#fafafa'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#eef2ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BarChart3 size={22} color="#6366f1" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>
            No trending issues
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
            Issues will appear here as feedback grows.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendingIssues;