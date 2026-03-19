import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Lock, User, Mail, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { adminAPI } from '../../services/api';

// Google SVG icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AdminAuth() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // After login redirect back to the page they tried to visit
  // Falls back to dashboard if they came directly to login
  const params   = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  const from     = redirect || location.state?.from?.pathname || '/admin/dashboard';

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  // Save token and user info then redirect
  const saveAndRedirect = (token, id, name, email) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify({ id, name, email }));
    navigate(from, { replace: true }); // go back to where they came from
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegistering) {
        await adminAPI.register({
          name:     formData.name,
          email:    formData.email,
          password: formData.password,
        });
        setSuccess('Account created! Please sign in.');
        setIsRegistering(false);
        setFormData({ name: '', email: '', password: '' });
        setLoading(false);
        return;
      }

      const response = await adminAPI.login({
        email:    formData.email,
        password: formData.password,
      });

      const { token, id, name, email } = response.data.data;
      saveAndRedirect(token, id, name, email);

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Google login handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        const response = await adminAPI.googleLogin(tokenResponse.access_token);
        const { token, id, name, email } = response.data.data;
        saveAndRedirect(token, id, name, email);
      } catch (err) {
        setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.');
      setGoogleLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Clari<span className="text-indigo-400">Box</span>
          </h1>
          <p className="text-gray-400 mt-2">
            {isRegistering ? 'Create Admin Account' : 'Admin Portal'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm mb-5">
              {success}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all hover:border-slate-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-5 cursor-pointer"
          >
            {googleLoading
              ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              : <GoogleIcon />
            }
            {googleLoading
              ? 'Signing in with Google...'
              : `${isRegistering ? 'Sign up' : 'Sign in'} with Google`
            }
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name — register only */}
            {isRegistering && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleChange} placeholder="Enter your full name"
                    required={isRegistering}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="admin@must.ac.ug"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={formData.password}
                  onChange={handleChange}
                  placeholder={isRegistering ? 'Create a password' : 'Enter your password'}
                  required minLength={6}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isRegistering && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegistering ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isRegistering ? 'Create Account' : 'Sign In'}
                  {!isRegistering && <ArrowRight className="w-5 h-5" />}
                </>
              )}
            </button>
          </form>

          {/* Toggle login / register */}
          <div className="mt-6 text-center">
            {isRegistering ? (
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => { setIsRegistering(false); setError(''); setSuccess(''); }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >Sign In</button>
              </p>
            ) : (
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => { setIsRegistering(true); setError(''); setSuccess(''); }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >Create Account</button>
              </p>
            )}
          </div>

          {/* Back to home */}
          <div className="mt-4 text-center">
            <a href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
              ← Back to Student Portal
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}