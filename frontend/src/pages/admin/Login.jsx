import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Lock, User, Mail, ArrowRight } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function AdminAuth() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegistering) {
        // REGISTER
        await adminAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        setSuccess('Account created! Please sign in.');
        setIsRegistering(false);
        setFormData({ name: '', email: '', password: '' });
        setLoading(false);
        return;
      }

      // LOGIN
      const response = await adminAPI.login({
        email: formData.email,
        password: formData.password,
      });

      const { token, id, name, email } = response.data.data;

      // Save token
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify({ id, name, email }));

      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ClariBox</h1>
          <p className="text-gray-400 mt-2">
            {isRegistering ? 'Create Admin Account' : 'Admin Portal'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Name (Register Only) */}
            {isRegistering && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required={isRegistering}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@must.ac.ug"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isRegistering ? 'Create password' : 'Enter password'}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isRegistering && (
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isRegistering ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isRegistering ? 'Create Account' : 'Sign In'}
                  {!isRegistering && <ArrowRight className="w-5 h-5 ml-2" />}
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            {isRegistering ? (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegistering(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegistering(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <a href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to Student Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}