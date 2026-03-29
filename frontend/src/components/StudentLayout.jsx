import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SplashScreen from '../../components/SplashScreen';
import Onboarding   from '../../components/Onboarding';
import InstallBanner from '../../components/InstallBanner';

// Flow: SPLASH → ONBOARDING → APP (every time)
export default function StudentLayout() {
  const [phase, setPhase] = useState('splash'); // 'splash' | 'onboarding' | 'app'

  if (phase === 'splash') {
    return <SplashScreen onDone={() => setPhase('onboarding')} />;
  }

  if (phase === 'onboarding') {
    return <Onboarding onDone={() => setPhase('app')} />;
  }

  return (
    <>
      <Outlet />
      <InstallBanner />
    </>
  );
}