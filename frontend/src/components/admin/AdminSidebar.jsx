import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Bot,
  FileText, X, Shield, PieChart, Cog, LogOut, Sparkles
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const menuItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/chat',      icon: Bot,             label: 'AI Assistant' },
  { path: '/admin/insights',  icon: PieChart,        label: 'Category Insights' },
  { path: '/admin/reports',   icon: FileText,        label: 'Reports' },
  { path: '/admin/feedback',  icon: MessageSquare,   label: 'All Feedback' },
  { path: '/admin/settings',  icon: Cog,             label: 'Settings' },
];

const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    adminAPI.logout();
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', width: '260px',
      background: 'linear-gradient(180deg, #1e1b4b 0%, #1a1730 60%, #0f0e1a 100%)',
      color: '#fff',
      borderRight: '1px solid rgba(99,102,241,0.15)'
    }}>

      {/* Logo */}
      <div style={{
        padding: '22px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            flexShrink: 0
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: '17px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
              Clari<span style={{ color: '#818cf8' }}>Box</span>
            </p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>
              Admin Portal
            </p>
          </div>
        </div>

        {/* Mobile close */}
        <button
          onClick={onClose}
          style={{
            display: 'none', width: '28px', height: '28px',
            borderRadius: '8px', border: 'none',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
          className="mobile-close-btn"
        >
          <X size={14} />
        </button>
      </div>

      {/* Nav label */}
      <div style={{ padding: '20px 20px 8px' }}>
        <p style={{
          fontSize: '10px', fontWeight: 700,
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase', letterSpacing: '1px',
          margin: 0
        }}>
          Navigation
        </p>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 14px',
              borderRadius: '11px',
              textDecoration: 'none',
              fontSize: '13px', fontWeight: 600,
              transition: 'all 0.2s ease',
              background: isActive
                ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
              boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
              transform: isActive ? 'translateX(2px)' : 'translateX(0)'
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.style.background.includes('gradient')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background.includes('gradient')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
              }
            }}
          >
            <item.icon size={16} style={{ flexShrink: 0 }} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* AI CTA card */}
      <div style={{
        margin: '12px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', position: 'relative' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={14} color="#fff" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>AI Assistant</span>
          <div style={{ marginLeft: 'auto' }}>
            <Sparkles size={12} color="rgba(255,255,255,0.6)" />
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0 0 12px', lineHeight: 1.5, position: 'relative' }}>
          Analyze feedback and generate reports instantly.
        </p>

        <NavLink
          to="/admin/chat"
          onClick={onClose}
          style={{
            display: 'block', width: '100%',
            padding: '9px',
            borderRadius: '9px',
            background: '#fff',
            color: '#4f46e5',
            fontSize: '12px', fontWeight: 800,
            textDecoration: 'none', textAlign: 'center',
            boxSizing: 'border-box',
            position: 'relative',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          Start Chat →
        </NavLink>
      </div>

      {/* Logout */}
      <div style={{ padding: '8px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '11px 14px',
            borderRadius: '11px', border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            textAlign: 'left'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
          }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-close-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div style={{
        display: 'none',
        position: 'fixed', top: 0, bottom: 0, left: 0,
        zIndex: 40, flexDirection: 'column'
      }}
        className="desktop-sidebar"
      >
        <SidebarContent />
      </div>

      {/* Mobile */}
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,26,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <div style={{ position: 'fixed', top: 0, bottom: 0, left: 0 }}>
            <SidebarContent />
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default AdminSidebar;