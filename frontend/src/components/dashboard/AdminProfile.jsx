import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, X, Mail, Shield, ChevronDown } from 'lucide-react';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const AdminProfile = ({ admin }) => {
  const [isOpen,    setIsOpen]    = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData,  setFormData]  = useState({
    name:  admin?.name  || 'Admin User',
    email: admin?.email || 'admin@school.edu',
    role:  admin?.role  || 'Administrator',
  });
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    console.log('Updating profile:', formData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleClose = () => { setIsOpen(false); setIsEditing(false); };

  const initials = formData.name
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ position: 'relative', fontFamily: font }}>

      {/* ── Trigger button ──────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 10px 5px 5px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
          transition: 'all 0.16s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#BFDBFE';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.10)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.06)';
        }}
      >
        {/* Avatar tile */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(37,99,235,0.22)',
          position: 'relative',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            {initials}
          </span>
          {/* Online dot */}
          <span style={{
            position: 'absolute', bottom: '-1px', right: '-1px',
            width: '9px', height: '9px', borderRadius: '50%',
            background: '#22C55E', border: '1.5px solid #FFFFFF',
          }} />
        </div>

        {/* Name — hidden on very small screens via inline media */}
        <span style={{
          fontSize: '12.5px', fontWeight: 700, color: '#334155',
          letterSpacing: '-0.01em', maxWidth: '100px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {formData.name.split(' ')[0]}
        </span>

        <ChevronDown
          size={13} color="#94A3B8"
          style={{ transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* ── Dropdown ────────────────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={handleClose}
          />

          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: '272px',
            background: '#FFFFFF',
            borderRadius: '18px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
            zIndex: 20,
            overflow: 'hidden',
            animation: 'dropIn 0.18s ease',
          }}>

            {/* ── Profile header ──────────────────────────────── */}
            <div style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)',
              padding: '18px 18px 16px',
            }}>
              {/* Blob + grid */}
              <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }} />

              {/* Close button */}
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute', top: '12px', right: '12px',
                  width: '26px', height: '26px', borderRadius: '7px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#FFFFFF', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              >
                <X size={12} />
              </button>

              {/* Avatar + name */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                }}>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    {initials}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px', fontWeight: 800, color: '#FFFFFF',
                    margin: '0 0 4px', letterSpacing: '-0.025em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {formData.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Shield size={10} color="rgba(255,255,255,0.60)" />
                    <span style={{
                      fontSize: '11px', color: 'rgba(255,255,255,0.60)',
                      fontWeight: 500, textTransform: 'capitalize',
                    }}>
                      {formData.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Info / Edit section ──────────────────────────── */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Name field */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '10.5px', fontWeight: 700,
                      color: '#64748B', marginBottom: '5px',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      Name
                    </label>
                    <input
                      type="text" name="name"
                      value={formData.name} onChange={handleChange}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '8px 12px', borderRadius: '10px',
                        border: '1px solid #E2E8F0', background: '#FFFFFF',
                        fontSize: '12.5px', color: '#0F172A', fontFamily: font,
                        outline: 'none', transition: 'all 0.15s ease',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                      onBlur={(e)  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Email field */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '10.5px', fontWeight: 700,
                      color: '#64748B', marginBottom: '5px',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      Email
                    </label>
                    <input
                      type="email" name="email"
                      value={formData.email} onChange={handleChange}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '8px 12px', borderRadius: '10px',
                        border: '1px solid #E2E8F0', background: '#FFFFFF',
                        fontSize: '12.5px', color: '#0F172A', fontFamily: font,
                        outline: 'none', transition: 'all 0.15s ease',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                      onBlur={(e)  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Save / Cancel */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleSave}
                      style={{
                        flex: 1, padding: '8px',
                        borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#FFFFFF', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer', fontFamily: font,
                        boxShadow: '0 3px 10px rgba(37,99,235,0.22)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 14px rgba(37,99,235,0.30)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 3px 10px rgba(37,99,235,0.22)'; }}
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        flex: 1, padding: '8px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF', color: '#475569',
                        fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: font,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {/* Name row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                      border: '1px solid #BFDBFE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User size={12} color="#2563EB" />
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500 }}>
                      {formData.name}
                    </span>
                  </div>

                  {/* Email row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                      border: '1px solid #BFDBFE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Mail size={12} color="#2563EB" />
                    </div>
                    <span style={{
                      fontSize: '12px', color: '#64748B', fontWeight: 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {formData.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Actions ─────────────────────────────────────── */}
            <div style={{ padding: '7px' }}>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 11px',
                    borderRadius: '10px', border: 'none',
                    background: 'transparent',
                    color: '#334155', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left', fontFamily: font,
                    transition: 'background 0.13s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    border: '1px solid #BFDBFE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Settings size={13} color="#2563EB" />
                  </div>
                  Edit Profile
                </button>
              )}

              {/* Divider before logout */}
              <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 4px' }} />

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 11px',
                  borderRadius: '10px', border: 'none',
                  background: 'transparent',
                  color: '#EF4444', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', textAlign: 'left', fontFamily: font,
                  transition: 'background 0.13s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.16)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LogOut size={13} color="#EF4444" />
                </div>
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
};

export default AdminProfile;