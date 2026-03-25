import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Clock, Hash } from 'lucide-react';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

// ── Category colour mapping ───────────────────────────────────────────────
const CATEGORY_COLORS = {
  academic:   { stroke: '#6366F1', bg: 'rgba(99,102,241,0.08)',  text: '#4338CA' },
  library:    { stroke: '#22C55E', bg: 'rgba(34,197,94,0.08)',   text: '#15803D' },
  it:         { stroke: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   text: '#0E7490' },
  facilities: { stroke: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  text: '#B45309' },
  canteen:    { stroke: '#EAB308', bg: 'rgba(234,179,8,0.08)',   text: '#A16207' },
  transport:  { stroke: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  text: '#6D28D9' },
  hostel:     { stroke: '#F43F5E', bg: 'rgba(244,63,94,0.08)',   text: '#BE123C' },
  admin:      { stroke: '#64748B', bg: 'rgba(100,116,139,0.08)', text: '#475569' },
  other:      { stroke: '#94A3B8', bg: 'rgba(148,163,184,0.08)', text: '#64748B' },
};

// ── Sentiment colour mapping ──────────────────────────────────────────────
const SENTIMENT_COLORS = {
  positive: { stroke: '#22C55E', bg: 'rgba(34,197,94,0.08)',  text: '#15803D', emoji: '😊', label: 'Positive' },
  negative: { stroke: '#EF4444', bg: 'rgba(239,68,68,0.08)',  text: '#B91C1C', emoji: '😞', label: 'Negative' },
  neutral:  { stroke: '#94A3B8', bg: 'rgba(148,163,184,0.08)',text: '#475569', emoji: '😐', label: 'Neutral'  },
};

// ── Pill component ────────────────────────────────────────────────────────
const Pill = ({ color, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: color.bg, borderRadius: '20px',
    padding: '3px 9px',
    fontSize: '11px', fontWeight: 700,
    color: color.text, fontFamily: font,
    whiteSpace: 'nowrap',
    border: `1px solid ${color.stroke}28`,
  }}>
    {children}
  </span>
);

// ── RecentFeedback ────────────────────────────────────────────────────────
const RecentFeedback = ({ items }) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      fontFamily: font,
    }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        {/* mesh blob */}
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
            <MessageSquare size={16} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
              Recent Feedback
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 500 }}>
              Latest student submissions
            </p>
          </div>
        </div>

        <Link
          to="/admin/feedback"
          style={{
            position: 'relative',
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '11.5px', fontWeight: 700,
            color: '#FFFFFF',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '20px', padding: '5px 12px',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
        >
          View All <ArrowRight size={11} />
        </Link>
      </div>

      {/* ── Feedback list ──────────────────────────────────────── */}
      {items && items.length > 0 ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {items.map((item, idx) => {
            const catKey  = item.category?.toLowerCase();
            const sentKey = item.sentiment?.toLowerCase();
            const cat  = CATEGORY_COLORS[catKey]  || CATEGORY_COLORS.other;
            const sent = SENTIMENT_COLORS[sentKey] || SENTIMENT_COLORS.neutral;
            const isLast = idx === items.length - 1;

            return (
              <div
                key={item._id || item.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: isLast ? 'none' : '1px solid #F8FAFC',
                  transition: 'background 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <Pill color={cat}>
                    <span style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: cat.stroke, flexShrink: 0,
                    }} />
                    {item.category}
                  </Pill>
                  <Pill color={sent}>
                    {sent.emoji} {sent.label}
                  </Pill>
                </div>

                {/* Feedback text */}
                <p style={{
                  fontSize: '12.5px', color: '#334155',
                  lineHeight: '1.55', margin: '0 0 10px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {item.feedback || item.text}
                </p>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hash size={11} color="#CBD5E1" />
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                      {item.anonymous_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} color="#CBD5E1" />
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : 'Just now'}
                    </span>
                  </div>
                </div>
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
            <MessageSquare size={22} color="#2563EB" />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>
            No feedback yet
          </p>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, maxWidth: '200px', lineHeight: '1.5' }}>
            When students submit feedback, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentFeedback;