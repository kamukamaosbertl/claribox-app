import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Shield, LogOut, Settings, Camera, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../../services/api';

const AdminLayout = () => {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [admin,        setAdmin]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [isEditing,    setIsEditing]    = useState(false);
  const [formData,     setFormData]     = useState({ name: '', email: '', profilePicture: null });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await adminAPI.getProfile();
        const d = response.data;
        setAdmin(d);
        setFormData({ name: d.name || 'Admin', email: d.email || 'admin@school.edu', profilePicture: d.profilePicture || null });
      } catch {
        setFormData({ name: 'Admin', email: 'admin@school.edu', profilePicture: null });
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.updateProfile(formData);
      setAdmin(res.data);
      setIsEditing(false);
      setProfileOpen(false);
    } catch {
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('profilePicture', file);
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      const res = await adminAPI.updateProfile(fd);
      setAdmin(res.data);
      setFormData(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
    } catch {
      alert('Failed to upload picture.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-indigo-950 text-white border-b border-indigo-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold tracking-tight">
            Clari<span className="text-indigo-400">Box</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset matches sidebar width (260px) */}
      <div className="lg:pl-[260px]">

        {/* Desktop header */}
        <header className="hidden lg:flex items-center justify-between bg-white px-6 py-3 border-b border-slate-100 sticky top-0 z-30 shadow-sm">

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search feedback, categories..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">

            {/* Notifications */}
            <button className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-white"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {admin?.profilePicture
                    ? <img src={admin.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    : <span className="text-xs font-bold text-white">{loading ? '…' : getInitials(formData.name)}</span>
                  }
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none">{loading ? 'Loading…' : formData.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Administrator</p>
                </div>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setProfileOpen(false); setIsEditing(false); }} />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">

                    {/* Gradient header */}
                    <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
                      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                      <button
                        onClick={() => { setProfileOpen(false); setIsEditing(false); }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0 group">
                          {admin?.profilePicture
                            ? <img src={admin.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            : <span className="text-base font-bold text-white">{getInitials(formData.name)}</span>
                          }
                          <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="w-4 h-4 text-white" />
                            <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
                          </label>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{formData.name}</p>
                          <p className="text-xs text-white/70 mt-0.5">{formData.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Edit form / view */}
                    <div className="p-4 border-b border-slate-100">
                      {isEditing ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Name</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Email</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={e => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="flex-1 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg hover:shadow-md transition-all">
                              Save
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        onClick={() => { setProfileOpen(false); navigate('/admin/settings'); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;