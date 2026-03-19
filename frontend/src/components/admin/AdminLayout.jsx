import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Shield, LogOut, Settings, Camera, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../../services/api';

const AdminLayout = () => {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [admin,        setAdmin]        = useState(null);       // full admin object from DB
  const [loading,      setLoading]      = useState(true);       // loading state for profile fetch
  const [profileOpen,  setProfileOpen]  = useState(false);      // controls dropdown visibility
  const [isEditing,    setIsEditing]    = useState(false);      // toggles edit form
  const [uploading,    setUploading]    = useState(false);      // shows spinner while uploading photo
  const [formData,     setFormData]     = useState({
    name: '',
    email: '',
    profilePicture: null
  });

  const navigate = useNavigate();

  // ── Notifications state ───────────────────────────────────────────────────
  const [notifications,    setNotifications]    = useState([]);  // list of notifications
  const [unreadCount,      setUnreadCount]      = useState(0);   // number on red dot
  const [notifOpen,        setNotifOpen]        = useState(false); // dropdown open/close

  // ── Load admin profile on mount ──────────────────────────────────────────────
  // Fetches admin data from backend when the layout first loads
  // This runs once when the admin opens any admin page
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await adminAPI.getProfile();
        const d = response.data.data || response.data;

        setAdmin(d);
        setFormData({
          name:           d.name           || 'Admin',
          email:          d.email          || '',
          // profilePicture can be:
          // 1. A Cloudinary URL (if they uploaded manually)
          // 2. A Google photo URL (if they logged in with Google)
          // 3. null (if email/password login with no photo — shows initials)
          profilePicture: d.profilePicture || null
        });
      } catch {
        // If profile fetch fails (e.g. network error), use fallback values
        // Try to get name from localStorage as backup
        const stored = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setFormData({
          name:           stored.name  || 'Admin',
          email:          stored.email || '',
          profilePicture: null
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  // ── Load notifications ───────────────────────────────────────────────────────
  // Fetches notifications on mount and every 60 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res  = await adminAPI.getNotifications();
        const data = res.data;
        setNotifications(data.data    || []);
        setUnreadCount(data.unread  || 0);
      } catch {
        // Silently fail — notifications are not critical
      }
    };
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Mark single notification as read ─────────────────────────────────────────
  const markAsRead = async (id) => {
    try {
      await adminAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  // ── Mark all notifications as read ───────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await adminAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  // ── Update name and email ─────────────────────────────────────────────────────
  // Called when admin submits the edit profile form
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.updateProfile({
        name:  formData.name,
        email: formData.email
      });
      const updated = res.data.data || res.data;
      setAdmin(updated);
      setFormData(prev => ({ ...prev, name: updated.name, email: updated.email }));
      setIsEditing(false);
    } catch {
      alert('Failed to update profile. Please try again.');
    }
  };

  // ── Upload profile picture ────────────────────────────────────────────────────
  // Called when admin selects a photo using the camera icon
  // Sends image to backend → saved to Cloudinary → URL stored in MongoDB
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Use FormData to send the file as multipart/form-data
      const fd = new FormData();
      fd.append('profilePicture', file);
      fd.append('name',  formData.name);
      fd.append('email', formData.email);

      const res = await adminAPI.updateProfile(fd);
      const updated = res.data.data || res.data;

      // Update both admin state and formData with new picture URL
      setAdmin(updated);
      setFormData(prev => ({ ...prev, profilePicture: updated.profilePicture }));
    } catch {
      alert('Failed to upload picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Get initials from name ────────────────────────────────────────────────────
  // Used when no profile picture is available
  // "Kamukama Osbert" → "KO"
  // "Admin" → "A"
  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ── Profile picture display logic ─────────────────────────────────────────────
  // Priority:
  // 1. Manual upload (Cloudinary URL stored in DB)
  // 2. Google photo (Google URL stored in DB when signed in with Google)
  // 3. Initials (fallback when no photo exists)
  const ProfileAvatar = ({ size = 'sm' }) => {
    const sizeClass = size === 'lg'
      ? 'w-12 h-12 rounded-xl text-base'
      : 'w-7 h-7 rounded-lg text-xs';

    const picture = admin?.profilePicture || formData.profilePicture;

    if (picture) {
      return (
        <img
          src={picture}
          alt="Profile"
          className={`${sizeClass} object-cover bg-gradient-to-br from-indigo-500 to-violet-600`}
        />
      );
    }

    return (
      <span className={`${sizeClass} font-bold text-white flex items-center justify-center`}>
        {loading ? '…' : getInitials(formData.name)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mobile top bar ── */}
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
          {/* Bell — notifications (to be implemented) */}
          <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main content ── */}
      <div className="lg:pl-[260px]">

        {/* ── Desktop header ── */}
        <header className="hidden lg:flex items-center justify-between bg-white px-6 py-3 border-b border-slate-100 sticky top-0 z-30 shadow-sm">

          {/* Search bar — TODO: implement search functionality */}
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

          <div className="flex items-center gap-3">

            {/* ── Notifications bell ── */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
                className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200"
              >
                <Bell className="w-4 h-4" />
                {/* Red dot — only shows when there are unread notifications */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div
                            key={notif._id}
                            onClick={() => { markAsRead(notif._id); setNotifOpen(false); navigate(notif.link || '/admin/dashboard'); }}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${!notif.isRead ? 'bg-indigo-50/50' : ''}`}
                          >
                            {/* Icon based on type */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${
                              notif.type === 'negative_feedback' ? 'bg-red-100' :
                              notif.type === 'category_spike'    ? 'bg-amber-100' : 'bg-indigo-100'
                            }`}>
                              {notif.type === 'negative_feedback' ? '⚠️' :
                               notif.type === 'category_spike'    ? '📈' : '🔔'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold text-slate-800 ${!notif.isRead ? 'text-indigo-900' : ''}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {/* Blue dot for unread */}
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Bell className="w-8 h-8 text-slate-300" />
                          <p className="text-sm text-slate-400">No notifications yet</p>
                        </div>
                      )}
                    </div>

                  </div>
                </>
              )}
            </div>

            {/* ── Profile button ── */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-white"
              >
                {/* Avatar — shows photo or initials */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <ProfileAvatar size="sm" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none">
                    {loading ? 'Loading…' : formData.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Administrator</p>
                </div>
              </button>

              {/* ── Profile dropdown ── */}
              {profileOpen && (
                <>
                  {/* Backdrop — closes dropdown when clicked outside */}
                  <div className="fixed inset-0 z-10" onClick={() => { setProfileOpen(false); setIsEditing(false); }} />

                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">

                    {/* Gradient header — shows photo/initials + name + email */}
                    <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
                      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

                      {/* Close button */}
                      <button
                        onClick={() => { setProfileOpen(false); setIsEditing(false); }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-3">
                        {/* Large avatar with camera overlay on hover */}
                        <div className="relative w-12 h-12 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0 group">
                          <ProfileAvatar size="lg" />

                          {/* Camera overlay — appears on hover to upload new photo */}
                          <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            {uploading
                              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              : <Camera className="w-4 h-4 text-white" />
                            }
                            {/* Hidden file input — triggers when camera icon clicked */}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePictureUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-white">{formData.name}</p>
                          <p className="text-xs text-white/70 mt-0.5">{formData.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Edit form or Edit button */}
                    <div className="p-4 border-b border-slate-100">
                      {isEditing ? (
                        // Edit mode — shows name and email inputs
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
                        // View mode — shows Edit Profile button
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {/* Menu actions */}
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

        {/* Page content — all admin pages render here via Outlet */}
        <main className="p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;