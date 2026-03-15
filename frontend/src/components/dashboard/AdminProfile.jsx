import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, X, Mail, Shield } from 'lucide-react';

const AdminProfile = ({ admin }) => {
  const [isOpen,    setIsOpen]    = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData,  setFormData]  = useState({
    name:  admin?.name  || 'Admin User',
    email: admin?.email || 'admin@school.edu',
    role:  admin?.role  || 'Administrator'
  });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    console.log('Updating profile:', formData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const initials = formData.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e0e0f0',
    fontSize: '12px',
    color: '#1e1b4b',
    background: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'relative' }}>

      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px 6px 6px',
          background: '#fff',
          border: '1px solid #e0e0f0',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#c7d2fe'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0f0'}
      >
        {/* Avatar */}
        <div style={{
          width: '30px', height: '30px',
          borderRadius: '9px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
            {initials}
          </span>
        </div>
        <span style={{
          fontSize: '12px', fontWeight: 600, color: '#374151',
          display: 'none'
        }}
          className="sm-inline"
        >
          {formData.name.split(' ')[0]}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => { setIsOpen(false); setIsEditing(false); }}
          />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: '280px',
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #f0f0f5',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 20,
            overflow: 'hidden',
            animation: 'dropIn 0.15s ease'
          }}>

            {/* Profile header */}
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              padding: '18px 18px 16px',
              position: 'relative'
            }}>
              <button
                onClick={() => { setIsOpen(false); setIsEditing(false); }}
                style={{
                  position: 'absolute', top: '12px', right: '12px',
                  width: '24px', height: '24px', borderRadius: '7px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={12} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Large avatar */}
                <div style={{
                  width: '46px', height: '46px',
                  borderRadius: '13px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                    {initials}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {formData.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                    <Shield size={10} color="rgba(255,255,255,0.7)" />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                      {formData.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info / Edit section */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f5' }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                      Name
                    </label>
                    <input
                      type="text" name="name"
                      value={formData.name}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = '#e0e0f0'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                      Email
                    </label>
                    <input
                      type="email" name="email"
                      value={formData.email}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = '#e0e0f0'}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleSave}
                      style={{
                        flex: 1, padding: '8px',
                        borderRadius: '8px', border: 'none',
                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        color: '#fff', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        flex: 1, padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0f0',
                        background: '#fff', color: '#6b7280',
                        fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '7px',
                      background: '#eef2ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={12} color="#6366f1" />
                    </div>
                    <span style={{ fontSize: '12px', color: '#374151' }}>{formData.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '7px',
                      background: '#eef2ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Mail size={12} color="#6366f1" />
                    </div>
                    <span style={{ fontSize: '12px', color: '#374151' }}>{formData.email}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: '8px' }}>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '9px', border: 'none',
                    background: 'transparent',
                    color: '#374151', fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', transition: 'background 0.15s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f8fc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Settings size={14} color="#6366f1" />
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '9px', border: 'none',
                  background: 'transparent',
                  color: '#ef4444', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', transition: 'background 0.15s',
                  textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={14} color="#ef4444" />
                Logout
              </button>
            </div>

          </div>
        </>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminProfile;