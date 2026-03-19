import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';

// Student Pages
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/student/Home';
import SubmitFeedback from './pages/student/SubmitFeedback';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './components/dashboard/Dashboard';
import CategoryInsights from './pages/admin/CategoryInsights';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import ChatWithAI from './pages/admin/ChatWithAI';

// ─── Token Validator ──────────────────────────────────────────────────────────
// Checks token exists AND is not expired by decoding the JWT payload
const getValidToken = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return null;

  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    if (Date.now() >= exp * 1000) {
      // Token expired — clean up and return null
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      return null;
    }
    return token;
  } catch {
    // Malformed token — clean up
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    return null;
  }
};

// ─── Protected Route ──────────────────────────────────────────────────────────
// Blocks access if token is missing or expired
// Saves attempted URL so admin is redirected back after login
const ProtectedRoute = ({ children }) => {
  const token    = getValidToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

// ─── Public Route ─────────────────────────────────────────────────────────────
// Redirects logged-in admin away from login page to dashboard
const PublicRoute = ({ children }) => {
  const token = getValidToken();
  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

// ─── Student Layout ───────────────────────────────────────────────────────────
// Uses nested layout pattern — consistent with AdminLayout approach
const StudentLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Student Routes — nested layout pattern ── */}
        <Route element={<StudentLayout />}>
          <Route path="/"       element={<Home />} />
          <Route path="/submit" element={<SubmitFeedback />} />
        </Route>

        {/* ── Admin Login — redirect to dashboard if already logged in ── */}
        <Route path="/admin/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* ── Admin Routes — all protected with valid token check ── */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index          element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat"      element={<ChatWithAI />} />
          <Route path="insights"  element={<CategoryInsights />} />
          <Route path="reports"   element={<Reports />} />
          <Route path="feedback"  element={<Dashboard />} />  {/* TODO: replace with AllFeedback page */}
          <Route path="settings"  element={<Settings />} />
        </Route>

        {/* ── Catch all unknown URLs ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;