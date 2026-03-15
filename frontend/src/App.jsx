import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

// Student layout wrapper — wraps all student-facing pages with Navbar + Footer
const StudentLayout = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Navbar />
    <main style={{ flex: 1 }}>
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Student Routes — Navbar + Footer on every page */}
        <Route path="/" element={
          <StudentLayout>
            <Home />
          </StudentLayout>
        } />
        <Route path="/submit" element={
          <StudentLayout>
            <SubmitFeedback />
          </StudentLayout>
        } />

        {/* Admin Routes — no Navbar/Footer, AdminLayout handles its own UI */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<ChatWithAI />} />
          <Route path="insights" element={<CategoryInsights />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="feedback" element={<Dashboard />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;