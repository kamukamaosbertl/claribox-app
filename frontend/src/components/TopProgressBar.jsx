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

    // Start immediately at 30%
    setVisible(true);
    setProgress(30);

    // Quickly creep to 85% over ~300ms
    const creep = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + 15;
      });
    }, 80);

    // Complete at 400ms — fast enough to feel snappy
    const finish = setTimeout(() => {
      clearInterval(creep);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      clearInterval(creep);
      clearTimeout(finish);
    };
  }, [location]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: `${progress}%`, height: '3px',
      background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
      zIndex: 99999,
      transition: 'width 0.15s ease',
      boxShadow: '0 0 8px rgba(37,99,235,0.6)',
    }} />
  );
};

export default TopProgressBar;