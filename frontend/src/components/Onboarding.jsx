import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '🗣️',
    accent: '#2563EB',
    accentLight: '#EFF6FF',
    title: 'Your Voice Matters',
    body: 'Every piece of feedback you share goes directly to university decision-makers. Your opinion shapes real change on campus.',
  },
  {
    emoji: '✨',
    accent: '#7C3AED',
    accentLight: '#F5F3FF',
    title: 'Easy to Use',
    body: "Submit feedback in under 60 seconds. Pick a category, describe your experience, and you're done — no sign-up needed.",
  },
  {
    emoji: '🔒',
    accent: '#059669',
    accentLight: '#F0FDF4',
    title: '100% Private',
    body: 'Your identity is never collected or stored. Everything you share is completely anonymous — speak freely without fear.',
  },
];

export default function Onboarding({ onDone }) {
  const [current,   setCurrent]   = useState(0);
  const [exiting,   setExiting]   = useState(false);
  const [finishing, setFinishing] = useState(false);
  const navigate = useNavigate();

  const slide  = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      handleFinish();
      return;
    }
    setExiting(true);
    setTimeout(() => { setCurrent((c) => c + 1); setExiting(false); }, 280);
  };

  const handleFinish = () => {
    setFinishing(true);
    setTimeout(() => {
      onDone();
      navigate('/submit');
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', flexDirection: 'column',
      background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* Skip button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px' }}>
        <button
          onClick={handleFinish}
          disabled={finishing}
          style={{
            background: 'none', border: 'none',
            fontSize: '13px', fontWeight: 600, color: '#94A3B8',
            cursor: finishing ? 'not-allowed' : 'pointer', padding: '6px 10px',
          }}
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateX(-24px)' : 'translateX(0)',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
      }}>

        {/* Icon circle */}
        <div style={{
          width: '110px', height: '110px', borderRadius: '32px',
          background: slide.accentLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '52px', marginBottom: '36px',
          boxShadow: `0 12px 40px ${slide.accent}18`,
        }}>
          {slide.emoji}
        </div>

        <h2 style={{
          fontSize: '26px', fontWeight: 900, color: '#0F172A',
          margin: '0 0 14px', textAlign: 'center', letterSpacing: '-0.03em',
        }}>
          {slide.title}
        </h2>

        <p style={{
          fontSize: '15px', color: '#64748B', textAlign: 'center',
          lineHeight: '1.7', margin: 0, maxWidth: '300px', fontWeight: 500,
        }}>
          {slide.body}
        </p>
      </div>

      {/* Bottom controls */}
      <div style={{ padding: '24px 28px 48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => !finishing && setCurrent(i)}
              style={{
                height: '8px', borderRadius: '99px',
                cursor: finishing ? 'default' : 'pointer',
                width: i === current ? '24px' : '8px',
                background: i === current ? slide.accent : '#E2E8F0',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Next / Get Started button */}
        <button
          onClick={goNext}
          disabled={finishing}
          style={{
            width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
            background: finishing
              ? `${slide.accent}99`
              : `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)`,
            color: '#fff', fontSize: '15px', fontWeight: 800,
            cursor: finishing ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em',
            boxShadow: finishing ? 'none' : `0 8px 24px ${slide.accent}40`,
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
          }}
        >
          {finishing ? (
            <>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,0.35)',
                borderTopColor: '#ffffff',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
              }} />
              Taking you there…
            </>
          ) : (
            isLast ? '🚀 Submit Feedback' : 'Next →'
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}