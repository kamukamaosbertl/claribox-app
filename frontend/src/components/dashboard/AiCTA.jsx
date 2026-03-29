import { Link } from 'react-router-dom';
import { Bot, ArrowRight, Sparkles, Zap, Shield, TrendingUp, FileText, Search } from 'lucide-react';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const features = [
  { label: 'Category Search', icon: Search },
  { label: 'Auto Summary',    icon: FileText },
  { label: 'Trend Detection', icon: TrendingUp },
  { label: '100% Private',    icon: Shield },
];

const AiCTA = () => {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        padding: '32px 36px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '28px',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 45%, #1D4ED8 100%)',
        boxShadow: '0 20px 56px rgba(37,99,235,0.32), inset 0 1px 0 rgba(255,255,255,0.1)',
        fontFamily: font,
      }}
    >
      {/* ── Background decoration ─────────────────────────────────────── */}
      {/* Large soft blob top-right */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />
      {/* Small blob bottom-left */}
      <div style={{
        position: 'absolute', bottom: '-48px', left: '8%',
        width: '160px', height: '160px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
      }} />
      {/* Thin grid lines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Floating sparkles */}
      <div style={{
        position: 'absolute', top: '18px', right: '220px',
        pointerEvents: 'none', animation: 'floatA 3s ease-in-out infinite',
      }}>
        <Sparkles size={14} color="rgba(255,255,255,0.35)" />
      </div>
      <div style={{
        position: 'absolute', bottom: '20px', right: '320px',
        pointerEvents: 'none', animation: 'floatB 4s ease-in-out infinite',
      }}>
        <Sparkles size={10} color="rgba(255,255,255,0.22)" />
      </div>

      {/* ── LEFT: Icon + Copy ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '20px',
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Bot icon tile */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <Bot size={26} color="#FFFFFF" />
        </div>

        <div style={{ minWidth: 0 }}>
          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '8px',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Unlock Deeper Insights
            </h3>

            {/* AI badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(251,191,36,0.18)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#FCD34D',
                letterSpacing: '0.02em',
              }}
            >
              <Zap size={10} color="#FCD34D" />
              AI Powered
            </span>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '13.5px',
              color: 'rgba(255,255,255,0.72)',
              lineHeight: '1.65',
              margin: '0 0 16px',
              maxWidth: '480px',
            }}
          >
            Ask questions, discover trends, and get instant summaries from student feedback — powered by local AI running on your machine.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', overflowX: 'auto' }}>
            {features.map(({ label, icon: Icon }) => (
              <span
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '20px',
                  padding: '4px 11px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.88)',
                  letterSpacing: '-0.01em',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Icon size={11} color="rgba(255,255,255,0.65)" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: CTA button ─────────────────────────────────────────── */}
      <Link
        to="/admin/chat"
        style={{
          position: 'relative',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '9px',
          padding: '13px 24px',
          borderRadius: '14px',
          background: '#FFFFFF',
          color: '#1D4ED8',
          fontSize: '14px',
          fontWeight: 800,
          fontFamily: font,
          letterSpacing: '-0.02em',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 20px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
          transition: 'all 0.2s ease',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)';
          e.currentTarget.style.color = '#1E40AF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.9)';
          e.currentTarget.style.color = '#1D4ED8';
        }}
      >
        <Bot size={15} />
        Ask AI Now
        <ArrowRight size={14} />
      </Link>

      {/* Keyframes */}
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.35; }
          50%       { transform: translateY(-6px) rotate(15deg); opacity: 0.55; }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); opacity: 0.22; }
          50%       { transform: translateY(-4px); opacity: 0.38; }
        }
      `}</style>
    </div>
  );
};

export default AiCTA;