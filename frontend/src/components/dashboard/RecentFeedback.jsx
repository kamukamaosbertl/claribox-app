import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Clock, Hash } from 'lucide-react';

const CATEGORY_COLORS = {
  academic:   { bg: '#eef2ff', text: '#4338ca', dot: '#6366f1' },
  library:    { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  it:         { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4' },
  facilities: { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  canteen:    { bg: '#fef9c3', text: '#854d0e', dot: '#eab308' },
  transport:  { bg: '#fdf4ff', text: '#7e22ce', dot: '#a855f7' },
  hostel:     { bg: '#fff1f2', text: '#be123c', dot: '#f43f5e' },
  admin:      { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' },
  other:      { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' },
};

const SENTIMENT_COLORS = {
  positive: { bg: '#f0fdf4', text: '#15803d', label: '😊 Positive' },
  negative: { bg: '#fff1f2', text: '#be123c', label: '😞 Negative' },
  neutral:  { bg: '#f8fafc', text: '#475569', label: '😐 Neutral' },
};

const RecentFeedback = ({ items }) => {
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

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 20px',
        borderBottom: '1px solid #f0f0f5',
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '9px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageSquare size={15} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Recent Feedback
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Latest student submissions
            </p>
          </div>
        </div>
        <Link
          to="/admin/feedback"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: 600,
            color: '#fff',
            background: 'rgba(255,255,255,0.2)',
            padding: '5px 12px',
            borderRadius: '20px',
            textDecoration: 'none',
            transition: 'background 0.2s'
          }}
        >
          View All <ArrowRight size={12} />
        </Link>
      </div>

      {/* List */}
      {items && items.length > 0 ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {items.map((item, i) => {
            const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
            const sentColor = SENTIMENT_COLORS[item.sentiment] || SENTIMENT_COLORS.neutral;

            return (
              <div
                key={item._id || item.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: i < items.length - 1 ? '1px solid #f8f8fc' : 'none',
                  transition: 'background 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Top row - badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    fontSize: '11px', fontWeight: 700,
                    background: catColor.bg,
                    color: catColor.text
                  }}>
                    <span style={{
                      width: '5px', height: '5px',
                      borderRadius: '50%',
                      background: catColor.dot,
                      flexShrink: 0
                    }} />
                    {item.category}
                  </span>
                  <span style={{
                    padding: '3px 9px',
                    borderRadius: '20px',
                    fontSize: '11px', fontWeight: 600,
                    background: sentColor.bg,
                    color: sentColor.text
                  }}>
                    {sentColor.label}
                  </span>
                  {item.status && (
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '20px',
                      fontSize: '11px', fontWeight: 600,
                      background: item.status === 'resolved' ? '#f0fdf4' : '#fff7ed',
                      color: item.status === 'resolved' ? '#15803d' : '#c2410c',
                      marginLeft: 'auto'
                    }}>
                      {item.status}
                    </span>
                  )}
                </div>

                {/* Feedback text */}
                <p style={{
                  fontSize: '13px',
                  color: '#374151',
                  lineHeight: '1.55',
                  margin: '0 0 10px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.feedback || item.text}
                </p>

                {/* Footer meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hash size={11} color="#9ca3af" />
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                      {item.anonymous_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} color="#9ca3af" />
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
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
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          gap: '12px',
          background: '#fafafa'
        }}>
          <div style={{
            width: '52px', height: '52px',
            borderRadius: '50%',
            background: '#eef2ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageSquare size={22} color="#6366f1" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>
            No feedback yet
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
            When students submit feedback, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentFeedback;