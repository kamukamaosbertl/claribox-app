import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash for 2s then fade out over 0.6s
    const fadeTimer = setTimeout(() => setFading(true), 2000);
    const doneTimer = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.6s ease',
      userSelect: 'none',
    }}>

      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '280px', height: '280px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />

      {/* Logo */}
      <div style={{
        width: '100px', height: '100px', borderRadius: '28px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
        marginBottom: '24px',
        animation: 'splashPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <img
          src="/Clari.png"
          alt="ClariBox"
          style={{ width: '68px', height: '68px', objectFit: 'contain' }}
        />
      </div>

      {/* App name */}
      <h1 style={{
        fontSize: '32px', fontWeight: 900, color: '#FFFFFF',
        margin: '0 0 8px', letterSpacing: '-0.04em',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: 'splashFadeUp 0.5s 0.15s ease both',
      }}>
        ClariBox
      </h1>

      {/* Tagline */}
      <p style={{
        fontSize: '14px', color: 'rgba(255,255,255,0.75)',
        margin: '0 0 48px', fontWeight: 500, letterSpacing: '0.01em',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: 'splashFadeUp 0.5s 0.25s ease both',
      }}>
        Speak up, stay anonymous
      </p>

      {/* Spinner */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.25)',
        borderTopColor: '#FFFFFF',
        animation: 'spin 0.8s linear infinite',
      }} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes splashPop {
          from { opacity: 0; transform: scale(0.7); }
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