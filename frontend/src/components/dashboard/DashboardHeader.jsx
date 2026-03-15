import { Link } from 'react-router-dom';
import { RefreshCw, Sparkles, Bot } from 'lucide-react';

const DashboardHeader = ({ lastUpdated, onRefresh, loading, admin }) => {

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const today = new Date().toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      paddingBottom: '24px',
      borderBottom: '1px solid #f0f0f5',
      marginBottom: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>

        {/* Left - Title + greeting */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              letterSpacing: '-0.5px',
              lineHeight: 1.2
            }}>
              {greeting()}, {admin?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {today}
            </p>
            {lastUpdated && (
              <>
                <span style={{ color: '#e2e8f0' }}>·</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ position: 'relative', width: '7px', height: '7px' }}>
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: '#22c55e',
                      opacity: 0.4,
                      animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite'
                    }} />
                    <span style={{
                      position: 'absolute',
                      inset: '1px',
                      borderRadius: '50%',
                      background: '#22c55e'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Updated {formatTime(lastUpdated)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right - Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}
            />
          </button>

          {/* Chat with AI button */}
          <Link
            to="/admin/chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Bot size={15} />
            Ask AI
            <Sparkles size={11} style={{ opacity: 0.8 }} />
          </Link>

        </div>
      </div>

      {/* Bottom bar - admin info + subtitle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          Here's what's happening with student feedback across your institution.
        </p>
        {admin?.role && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#6366f1',
            background: '#eef2ff',
            padding: '3px 10px',
            borderRadius: '20px',
            letterSpacing: '0.3px'
          }}>
            {admin.role}
          </span>
        )}
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DashboardHeader;