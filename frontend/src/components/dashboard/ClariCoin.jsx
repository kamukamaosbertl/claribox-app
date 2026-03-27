// ClariCoin.jsx
// Spinning 3-D coin using clari.png on both faces.
// Usage: <ClariCoin size={48} />

import React from 'react';
import clariLogo from '../../assets/Clari.png'; // adjust path if needed

const ClariCoin = ({ size = 48 }) => {
  // Outer wrapper — fixed position + dark circular backdrop
  const wrapperStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 50,
    width: `${size + 28}px`,
    height: `${size + 28}px`,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
    boxShadow: '0 4px 24px rgba(37,99,235,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const coinStyle = {
    fontSize: `${size}px`,
    width: '0.1em',
    height: '1em',
    background: 'linear-gradient(#faa504, #141001)',
    position: 'relative',
    animation: 'clari_coin_rotate 7s infinite linear',
    transformStyle: 'preserve-3d',
  };

  const sideBase = {
    position: 'absolute',
    width: '1em',
    height: '1em',
    overflow: 'hidden',
    borderRadius: '50%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    MozBackfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  };

  const headsStyle = {
    ...sideBase,
    right: '-0.4em',
    transform: 'rotateY(-90deg)',
  };

  const tailsStyle = {
    ...sideBase,
    left: '-0.4em',
    transform: 'rotateY(90deg)',
  };

  const imgStyle = {
    width: '85%',
    height: '85%',
    objectFit: 'contain',
    borderRadius: '50%',
  };

  return (
    <>
      <style>{`
        @keyframes clari_coin_rotate {
          100% { transform: rotateY(360deg); }
        }
      `}</style>

      <div style={wrapperStyle}>
        <div style={coinStyle}>
          {/* Heads */}
          <div style={headsStyle}>
            <img src={clariLogo} alt="Clari" style={imgStyle} />
          </div>

          {/* Tails (mirrored) */}
          <div style={tailsStyle}>
            <img src={clariLogo} alt="box" style={{ ...imgStyle, transform: 'scaleX(-1)' }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ClariCoin;