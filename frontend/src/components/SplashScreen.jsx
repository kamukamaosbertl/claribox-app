import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2200);
    const doneTimer = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #1E3A8A 0%, #1E40AF 50%, #2563EB 100%)',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.6s ease',
      userSelect: 'none',
    }}>

      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '260px', height: '260px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
      }} />

      {/* Logo container — clean square with padding so icon fits perfectly */}
      <div style={{
        width: '112px', height: '112px', borderRadius: '28px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        marginBottom: '28px', padding: '16px', boxSizing: 'border-box',
        animation: 'splashPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <img
          src="/f5.png"
          alt="ClariBox"
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain', display: 'block',
          }}
        />
      </div>

      {/* App name */}
      <h1 style={{
        fontSize: '34px', fontWeight: 900, color: '#FFFFFF',
        margin: '0 0 8px', letterSpacing: '-0.04em',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: 'splashFadeUp 0.5s 0.15s ease both',
      }}>
        ClariBox
      </h1>

      {/* Tagline */}
      <p style={{
        fontSize: '14px', color: 'rgba(255,255,255,0.70)',
        margin: '0 0 52px', fontWeight: 500, letterSpacing: '0.01em',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: 'splashFadeUp 0.5s 0.25s ease both',
      }}>
        Speak up, stay anonymous
      </p>

      {/* Spinner */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.20)',
        borderTopColor: '#FFFFFF',
        animation: 'spin 0.9s linear infinite',
      }} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes splashPop {
          from { opacity: 0; transform: scale(0.72); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}