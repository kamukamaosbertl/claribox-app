import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Lock, User, Mail, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { adminAPI } from '../../services/api';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const focusIn  = (e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; };
const focusOut = (e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; };

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  paddingLeft: '40px', paddingRight: '14px',
  paddingTop: '11px', paddingBottom: '11px',
  borderRadius: '12px', border: '1px solid #E2E8F0',
  background: '#F8FAFC', fontSize: '13.5px', color: '#0F172A',
  fontFamily: font, outline: 'none', transition: 'all 0.15s ease',
};

const FieldIcon = ({ icon: Icon }) => (
  <Icon size={15} color="#94A3B8" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
);

export default function AdminAuth() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const params    = new URLSearchParams(location.search);
  const redirect  = params.get('redirect');
  const from      = redirect || location.state?.from?.pathname || '/admin/dashboard';

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [formData,      setFormData]      = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); setSuccess(''); };

  const saveAndRedirect = (token, id, name, email) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify({ id, name, email }));
    navigate(from, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isRegistering) {
        await adminAPI.register({ name: formData.name, email: formData.email, password: formData.password });
        setSuccess('Account created! Please sign in.');
        setIsRegistering(false);
        setFormData({ name: '', email: '', password: '' });
        setLoading(false);
        return;
      }
      const response = await adminAPI.login({ email: formData.email, password: formData.password });
      const { token, id, name, email } = response.data.data;
      saveAndRedirect(token, id, name, email);
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true); setError('');
      try {
        const response = await adminAPI.googleLogin(tokenResponse.access_token);
        const { token, id, name, email } = response.data.data;
        saveAndRedirect(token, id, name, email);
      } catch (err) { setError(err.response?.data?.message || 'Google sign-in failed. Please try again.'); }
      finally { setGoogleLoading(false); }
    },
    onError: () => { setError('Google sign-in was cancelled or failed.'); setGoogleLoading(false); },
  });

  return (
    <div style={{
      minHeight: '100vh', fontFamily: font,
      background: 'linear-gradient(160deg, #0F172A 0%, #0C1222 55%, #080D18 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: '-80px', left: '30%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', right: '20%', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>

        {/* ── Logo ────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}>
            <Shield size={28} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.04em' }}>
            Clari<span style={{ color: '#60A5FA' }}>Box</span>
          </h1>
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.40)', margin: 0, fontWeight: 500 }}>
            {isRegistering ? 'Create Admin Account' : 'Admin Portal'}
          </p>
        </div>

        {/* ── Card ────────────────────────────────────────────── */}
        <div style={{
          background: '#FFFFFF', borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
          padding: '28px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>

          {/* Error / Success banners */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '11px 14px', marginBottom: '18px', fontSize: '13px', color: '#B91C1C', fontWeight: 600 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '11px 14px', marginBottom: '18px', fontSize: '13px', color: '#15803D', fontWeight: 600 }}>
              {success}
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading || loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '11px', borderRadius: '13px',
              border: '1px solid #E2E8F0', background: '#FFFFFF',
              fontSize: '13.5px', fontWeight: 700, color: '#334155',
              cursor: googleLoading || loading ? 'not-allowed' : 'pointer', fontFamily: font,
              opacity: googleLoading || loading ? 0.6 : 1,
              marginBottom: '18px', transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
            }}
            onMouseEnter={(e) => { if (!googleLoading && !loading) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.08)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'; }}
          >
            {googleLoading
              ? <Loader2 size={16} color="#2563EB" style={{ animation: 'spin 0.8s linear infinite' }} />
              : <GoogleIcon />
            }
            {googleLoading ? 'Signing in with Google…' : `${isRegistering ? 'Sign up' : 'Sign in'} with Google`}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
            <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600, letterSpacing: '0.02em' }}>or continue with email</span>
            <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Name — register only */}
            {isRegistering && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <FieldIcon icon={User} />
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Enter your full name" required={isRegistering}
                    style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <FieldIcon icon={Mail} />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="admin@must.ac.ug" required
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <FieldIcon icon={Lock} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={formData.password} onChange={handleChange}
                  placeholder={isRegistering ? 'Create a password' : 'Enter your password'}
                  required minLength={6}
                  style={{ ...inputStyle, paddingRight: '42px' }}
                  onFocus={focusIn} onBlur={focusOut}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', transition: 'color 0.14s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {isRegistering && (
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: '5px 0 0', fontWeight: 500 }}>Minimum 6 characters</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '13px', border: 'none', marginTop: '4px',
                background: loading || googleLoading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF', fontSize: '14px', fontWeight: 800, letterSpacing: '-0.01em',
                cursor: loading || googleLoading ? 'not-allowed' : 'pointer', fontFamily: font,
                boxShadow: loading || googleLoading ? 'none' : '0 6px 16px rgba(37,99,235,0.28)',
                transition: 'all 0.16s ease',
              }}
              onMouseEnter={(e) => { if (!loading && !googleLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.35)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading || googleLoading ? 'none' : '0 6px 16px rgba(37,99,235,0.28)'; }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                {isRegistering ? 'Creating Account…' : 'Signing in…'}</>
              ) : (
                <>{isRegistering ? 'Create Account' : 'Sign In'}
                {!isRegistering && <ArrowRight size={16} />}</>
              )}
            </button>
          </form>

          {/* Toggle login / register */}
          <div style={{ marginTop: '18px', textAlign: 'center' }}>
            {isRegistering ? (
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Already have an account?{' '}
                <button onClick={() => { setIsRegistering(false); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#2563EB', fontFamily: font, padding: 0 }}>
                  Sign In
                </button>
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Don't have an account?{' '}
                <button onClick={() => { setIsRegistering(true); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#2563EB', fontFamily: font, padding: 0 }}>
                  Create Account
                </button>
              </p>
            )}
          </div>

          {/* Back link */}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <a href="/" style={{ fontSize: '12.5px', color: '#CBD5E1', textDecoration: 'none', fontWeight: 500, transition: 'color 0.14s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#CBD5E1'; }}
            >
              ← Back to Student Portal
            </a>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}