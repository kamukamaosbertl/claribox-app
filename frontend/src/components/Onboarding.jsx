import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '🗣️',
    accent: '#2563EB',
    accentLight: '#EFF6FF',
    title: 'Your Voice Matters',
    body: 'Every piece of feedback you share goes directly to university decision-makers. Your opinion shapes real change on campus.',
    nextLabel: 'How does it work? →',
  },
  {
    emoji: '✨',
    accent: '#7C3AED',
    accentLight: '#F5F3FF',
    title: 'Easy to Use',
    body: "Submit feedback in under 60 seconds. Pick a category, describe your experience, and you're done — no sign-up needed.",
    nextLabel: 'Is it private? →',
  },
  {
    emoji: '🔒',
    accent: '#059669',
    accentLight: '#F0FDF4',
    title: '100% Private',
    body: 'Your identity is never collected or stored. Everything you share is completely anonymous — speak freely without fear.',
    nextLabel: '🚀 Submit Feedback',
  },
];

const PROGRESS_DURATION = 2500; // ms for progress bar on last slide
const PROGRESS_INTERVAL = 30;   // ms between progress ticks

export default function Onboarding({ onDone }) {
  const [current,   setCurrent]   = useState(0);
  const [exiting,   setExiting]   = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [finishing, setFinishing] = useState(false);
  const [progress,  setProgress]  = useState(0); // 0–100
  const navigate = useNavigate();

  const slide  = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const isFirst = current === 0;

  // ── Progress bar on last slide ──────────────────────────────────────────
  useEffect(() => {
    if (!finishing) return;

    const steps    = PROGRESS_DURATION / PROGRESS_INTERVAL;
    const increment = 100 / steps;
    let current    = 0;

    const timer = setInterval(() => {
      current += increment;
      setProgress(Math.min(current, 100));
      if (current >= 100) {
        clearInterval(timer);
        setTimeout(() => { onDone(); navigate('/submit'); }, 200);
      }
    }, PROGRESS_INTERVAL);

    return () => clearInterval(timer);
  }, [finishing]);

  const navigate_slide = (dir) => {
    setDirection(dir);
    setExiting(true);
    setTimeout(() => {
      setCurrent((c) => c + dir);
      setExiting(false);
    }, 260);
  };

  const goNext = () => {
    if (isLast) { setFinishing(true); return; }
    navigate_slide(1);
  };

  const goBack = () => {
    if (isFirst || finishing) return;
    navigate_slide(-1);
  };

  const handleSkip = () => {
    if (finishing) return;
    setFinishing(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', flexDirection: 'column',
      background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* ── Top bar: back + skip ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '16px 20px',
      }}>
        {/* Back button */}
        <button
          onClick={goBack}
          disabled={isFirst || finishing}
          style={{
            background: 'none', border: 'none',
            fontSize: '13px', fontWeight: 600,
            color: isFirst || finishing ? 'transparent' : '#94A3B8',
            cursor: isFirst || finishing ? 'default' : 'pointer',
            padding: '6px 10px', transition: 'color 0.2s',
          }}
        >
          ← Back
        </button>

        {/* Step indicator */}
        <span style={{
          fontSize: '12px', fontWeight: 700, color: '#CBD5E1',
          letterSpacing: '0.05em',
        }}>
          {current + 1} / {SLIDES.length}
        </span>

        {/* Skip button */}
        <button
          onClick={handleSkip}
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

      {/* ── Slide content ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px',
        opacity: exiting ? 0 : 1,
        transform: exiting
          ? `translateX(${direction > 0 ? '-28px' : '28px'})`
          : 'translateX(0)',
        transition: 'opacity 0.26s ease, transform 0.26s ease',
      }}>

        {/* Icon */}
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

      {/* ── Bottom controls ── */}
      <div style={{ padding: '24px 28px 52px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {SLIDES.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                if (finishing) return;
                if (i === current) return;
                navigate_slide(i > current ? 1 : -1);
                setTimeout(() => setCurrent(i), 0);
              }}
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

        {/* Progress bar — only shows on last slide when finishing */}
        {finishing && (
          <div style={{
            width: '100%', height: '6px', borderRadius: '99px',
            background: '#E2E8F0', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${slide.accent}, ${slide.accent}99)`,
              transition: `width ${PROGRESS_INTERVAL}ms linear`,
            }} />
          </div>
        )}

        {/* Next / Submit button */}
        <button
          onClick={goNext}
          disabled={finishing}
          style={{
            width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
            background: finishing
              ? `${slide.accent}80`
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
                width: '17px', height: '17px', borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,0.35)',
                borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite', flexShrink: 0,
              }} />
              Setting things up…
            </>
          ) : (
            slide.nextLabel
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}