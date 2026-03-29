import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const TopProgressBar = () => {
  const location      = useLocation();
  const isFirstRender = useRef(true);
  const [progress, setProgress] = useState(0);
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Reset and show
    setProgress(0);
    setVisible(true);

    // Slowly creep from 0 → 80% over ~1.5s so user can see it moving
    let current = 0;
    const creep = setInterval(() => {
      // Slow down as it approaches 80 — feels like real loading
      const step = current < 40 ? 6 : current < 65 ? 3 : 1;
      current = Math.min(current + step, 80);
      setProgress(current);
      if (current >= 80) clearInterval(creep);
    }, 120);

    // Complete bar after 1.8s
    const finish = setTimeout(() => {
      clearInterval(creep);
      setProgress(100);
      // Linger at 100% briefly so user sees completion
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    }, 1800);

    return () => {
      clearInterval(creep);
      clearTimeout(finish);
    };
  }, [location]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, zIndex: 99999,
      width: `${progress}%`, height: '4px',
      background: 'linear-gradient(90deg, #1D4ED8, #3B82F6, #60A5FA)',
      transition: 'width 0.12s ease',
      boxShadow: '0 0 10px rgba(59,130,246,0.8), 0 0 4px rgba(59,130,246,0.5)',
      borderRadius: '0 2px 2px 0',
    }} />
  );
};

export default TopProgressBar;