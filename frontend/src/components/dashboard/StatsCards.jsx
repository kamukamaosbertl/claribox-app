import { MessageSquare, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';

const StatsCards = ({ stats, type = 'all', onResolvedClick }) => {

  if (!stats) {
    return (
      <div style={{
        height: '140px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #f8f8fc 0%, #eef2ff 100%)',
        border: '2px dashed #c7d2fe',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        animation: 'pulse 2s infinite'
      }}>
        <MessageSquare size={20} color="#a5b4fc" />
        <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: 500 }}>Loading...</span>
      </div>
    );
  }

  const resolvedPercent = stats.total > 0
    ? Math.round((stats.resolved / stats.total) * 100)
    : 0;

  const pendingPercent = stats.total > 0
    ? Math.round((stats.pending / stats.total) * 100)
    : 0;

  /* ---- RESOLVED CARD ---- */
  if (type === 'resolved') {
    return (
      <div
        onClick={onResolvedClick}
        style={{
          position: 'relative',
          borderRadius: '16px',
          padding: '20px',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)',
          boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          height: '100%'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.3)';
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-15px', right: '-15px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20px', left: '20px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Resolved Issues
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>
                  {stats.resolved || 0}
                </h3>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  background: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '20px'
                }}>
                  {resolvedPercent}%
                </span>
              </div>
            </div>
            <div style={{
              width: '42px', height: '42px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={20} color="#fff" />
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div style={{
              height: '6px',
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '6px'
            }}>
              <div style={{
                height: '100%',
                width: `${resolvedPercent}%`,
                background: '#fff',
                borderRadius: '6px',
                transition: 'width 1s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                Resolution rate
              </span>
              <ArrowRight size={13} color="rgba(255,255,255,0.8)" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- TOTAL CARD (default) ---- */
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '16px',
        padding: '20px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 60%, #818cf8 100%)',
        boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        height: '100%'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)';
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: '-15px', right: '-15px',
        width: '90px', height: '90px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-25px', left: '10px',
        width: '70px', height: '70px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Feedback
            </p>
            <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>
              {stats.total || 0}
            </h3>
          </div>
          <div style={{
            width: '42px', height: '42px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageSquare size={20} color="#fff" />
          </div>
        </div>

        {/* Bottom row - pending info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={13} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
              {stats.pending || 0} pending review
            </span>
          </div>
          <span style={{
            fontSize: '10px', fontWeight: 700,
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '20px'
          }}>
            {pendingPercent}% pending
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;