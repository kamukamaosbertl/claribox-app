import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import TopProgressBar   from './components/TopProgressBar';

// ── Student Pages ─────────────────────────────────────────────────────────
import Navbar           from './components/common/Navbar';
import Footer           from './components/common/Footer';
import Home             from './pages/student/Home';
import SubmitFeedback   from './pages/student/SubmitFeedback';
import SplashScreen     from './components/SplashScreen';
import Onboarding       from './components/Onboarding';

// ── Admin Pages ───────────────────────────────────────────────────────────
import AdminLayout      from './components/admin/AdminLayout';
import Login            from './pages/admin/Login';
import Dashboard        from './components/dashboard/Dashboard';
import CategoryInsights from './pages/admin/CategoryInsights';
import Reports          from './pages/admin/Reports';
import Settings         from './pages/admin/Settings';
import ChatWithAI       from './pages/admin/ChatWithAI';
import AllFeedback      from './pages/admin/AllFeedback';

// ── Token validator ───────────────────────────────────────────────────────
const getValidToken = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return null;
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    if (Date.now() >= exp * 1000) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      return null;
    }
    return token;
  } catch {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    return null;
  }
};

// ── Protected route ───────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const token    = getValidToken();
  const location = useLocation();
  if (!token) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return children;
};

// ── Public route ──────────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const token = getValidToken();
  if (token) return <Navigate to="/admin/dashboard" replace />;
  return children;
};

// ── Student layout ────────────────────────────────────────────────────────
// Splash + Onboarding only show when app is installed as a PWA (standalone)
// In a regular browser the student goes straight to the page
const StudentLayout = () => {
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
  const [phase, setPhase] = useState(isInstalled ? 'splash' : 'app');

  if (phase === 'splash') {
    return <SplashScreen onDone={() => setPhase('onboarding')} />;
  }

  if (phase === 'onboarding') {
    return <Onboarding onDone={() => setPhase('app')} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <TopProgressBar />
      <Routes>

        {/* ── Student routes ── */}
        <Route element={<StudentLayout />}>
          <Route path="/"       element={<Home />} />
          <Route path="/submit" element={<SubmitFeedback />} />
        </Route>

        {/* ── Admin login ── */}
        <Route path="/admin/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* ── Admin routes ── */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index             element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="chat"       element={<ChatWithAI />} />
          <Route path="insights"   element={<CategoryInsights />} />
          <Route path="reports"    element={<Reports />} />
          <Route path="feedback"   element={<AllFeedback />} />
          <Route path="settings"   element={<Settings />} />
        </Route>

        {/* ── Catch all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;