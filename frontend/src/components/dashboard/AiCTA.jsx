import { Link } from 'react-router-dom';
import { Bot, ArrowRight, Sparkles, Zap } from 'lucide-react';

const AiCTA = () => {
  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '20px',
      padding: '32px 36px',
      background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 35%, #7c3aed 70%, #9333ea 100%)',
      boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '24px'
    }}>

      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-50px', left: '10%',
        width: '160px', height: '160px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '20px', left: '40%',
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        pointerEvents: 'none'
      }} />

      {/* Floating sparkles */}
      <div style={{
        position: 'absolute', top: '18px', right: '220px',
        animation: 'float 3s ease-in-out infinite',
        pointerEvents: 'none'
      }}>
        <Sparkles size={14} color="rgba(255,255,255,0.4)" />
      </div>
      <div style={{
        position: 'absolute', bottom: '22px', right: '340px',
        animation: 'float 4s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }}>
        <Sparkles size={10} color="rgba(255,255,255,0.3)" />
      </div>

      {/* Left - icon + text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', flex: 1 }}>
        {/* Icon box */}
        <div style={{
          width: '60px', height: '60px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          backdropFilter: 'blur(4px)'
        }}>
          <Bot size={28} color="#fff" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{
              fontSize: '20px', fontWeight: 800,
              color: '#fff', margin: 0,
              letterSpacing: '-0.3px'
            }}>
              Unlock Deeper Insights
            </h3>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'rgba(255,255,255,0.15)',
              padding: '2px 8px', borderRadius: '20px'
            }}>
              <Zap size={10} color="#fbbf24" />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#fde68a' }}>
                AI Powered
              </span>
            </div>
          </div>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.75)',
            margin: 0,
            lineHeight: '1.6',
            maxWidth: '420px'
          }}>
            Ask questions, discover trends, and get instant summaries from student feedback — powered by local AI running on your machine.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {['Category Search', 'Auto Summary', 'Trend Detection', '100% Private'].map((feat) => (
              <span key={feat} style={{
                fontSize: '11px', fontWeight: 600,
                background: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right - CTA button */}
      <Link
        to="/admin/chat"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 28px',
          borderRadius: '14px',
          background: '#fff',
          color: '#4f46e5',
          fontSize: '14px',
          fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          position: 'relative'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        }}
      >
        <Bot size={16} color="#4f46e5" />
        Ask AI Now
        <ArrowRight size={15} color="#4f46e5" />
      </Link>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default AiCTA;