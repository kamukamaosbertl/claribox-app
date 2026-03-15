import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MessageSquare, Sparkles } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    fontSize: '14px',
    fontWeight: 500,
    color: isActive(path) ? '#4f46e5' : '#6b7280',
    textDecoration: 'none',
    padding: '6px 4px',
    borderBottom: isActive(path) ? '2px solid #6366f1' : '2px solid transparent',
    transition: 'all 0.2s ease'
  });

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(99,102,241,0.1)',
      boxShadow: '0 1px 12px rgba(99,102,241,0.08)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>

        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            textDecoration: 'none'
          }}
        >
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)'
          }}>
            <MessageSquare size={18} color="#fff" />
          </div>
          <span style={{
            fontSize: '18px', fontWeight: 800,
            color: '#1e1b4b',
            letterSpacing: '-0.3px'
          }}>
            Clari<span style={{ color: '#6366f1' }}>Box</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '28px'
        }}
          className="desktop-nav"
        >
          <Link to="/" style={linkStyle('/')}>Home</Link>
          <Link to="/submit" style={linkStyle('/submit')}>Submit Feedback</Link>

          {/* CTA button */}
          <Link
            to="/submit"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              color: '#fff',
              fontSize: '13px', fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(99,102,241,0.35)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(99,102,241,0.35)';
            }}
          >
            <Sparkles size={13} />
            Speak Up
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'none',
            width: '36px', height: '36px',
            borderRadius: '9px',
            border: '1px solid #e0e0f0',
            background: '#fff',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#4f46e5'
          }}
          className="mobile-toggle"
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div style={{
          borderTop: '1px solid #f0f0f5',
          padding: '16px 24px 20px',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          animation: 'slideDown 0.2s ease'
        }}>
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            style={{
              padding: '11px 14px',
              borderRadius: '10px',
              fontSize: '14px', fontWeight: 500,
              color: isActive('/') ? '#4f46e5' : '#374151',
              background: isActive('/') ? '#eef2ff' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s'
            }}
          >
            Home
          </Link>
          <Link
            to="/submit"
            onClick={() => setIsOpen(false)}
            style={{
              padding: '11px 14px',
              borderRadius: '10px',
              fontSize: '14px', fontWeight: 500,
              color: isActive('/submit') ? '#4f46e5' : '#374151',
              background: isActive('/submit') ? '#eef2ff' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s'
            }}
          >
            Submit Feedback
          </Link>
          <Link
            to="/submit"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              marginTop: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              color: '#fff',
              fontSize: '14px', fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(99,102,241,0.3)'
            }}
          >
            <Sparkles size={14} />
            Speak Up
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;