import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Shield, LogOut, Settings, Camera, X, Check, CheckCheck } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../../services/api';

const AdminLayout = () => {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [admin,        setAdmin]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [isEditing,    setIsEditing]    = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [formData,     setFormData]     = useState({ name: '', email: '', profilePicture: null });

  const navigate = useNavigate();

  // ── Notifications state ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifOpen,     setNotifOpen]     = useState(false);

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const searchRef = useRef(null);

  // ── Load admin profile ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await adminAPI.getProfile();
        const d = response.data.data || response.data;
        setAdmin(d);
        setFormData({
          name:           d.name           || 'Admin',
          email:          d.email          || '',
          profilePicture: d.profilePicture || null
        });
      } catch {
        const stored = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setFormData({ name: stored.name || 'Admin', email: stored.email || '', profilePicture: null });
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  // ── Load notifications on mount + poll every 60s ──────────────────────────
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res  = await adminAPI.getNotifications();
        const data = res.data;
        setNotifications(data.data  || []);
        setUnreadCount(data.unread  || 0);
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Mark single notification as read ─────────────────────────────────────
  // Called when admin clicks a specific notification
  // Updates that notification in state immediately — no need to refetch
  const markAsRead = async (id) => {
    try {
      await adminAPI.markNotificationRead(id);
      // Update local state — mark this one as read
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      // Decrease unread count by 1 (minimum 0)
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  // ── Mark all notifications as read ───────────────────────────────────────
  // Called when admin clicks "Mark all read" button
  // Only runs if there are actually unread notifications — avoids unnecessary API calls
  const markAllRead = async () => {
    if (unreadCount === 0) return; // nothing to mark — skip API call
    try {
      await adminAPI.markAllNotificationsRead();
      // Mark all as read in local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  // ── Handle bell click ─────────────────────────────────────────────────────
  // Just opens/closes dropdown — does NOT auto mark as read
  // Admin must explicitly click "Mark all read" or click individual notifications
  const handleBellClick = () => {
    setNotifOpen(prev => !prev);
  };

  // ── Handle notification click ─────────────────────────────────────────────
  // Marks this notification as read AND navigates to its link
  const handleNotifClick = (notif) => {
    // Only call API if not already read — avoid unnecessary requests
    if (!notif.isRead) markAsRead(notif._id);
    setNotifOpen(false);
    navigate(notif.link || '/admin/dashboard');
  };

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res   = await adminAPI.getAllFeedback({ limit: 50, sort: 'newest' });
        const items = res.data.data || [];
        const q     = searchQuery.toLowerCase();
        const matched = items.filter(f =>
          f.feedback?.toLowerCase().includes(q) ||
          f.category?.toLowerCase().includes(q) ||
          f.anonymous_id?.toLowerCase().includes(q)
        );
        setSearchResults(matched.slice(0, 5));
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = () => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate('/admin/feedback');
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  // ── Profile update ────────────────────────────────────────────────────────
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res     = await adminAPI.updateProfile({ name: formData.name, email: formData.email });
      const updated = res.data.data || res.data;
      setAdmin(updated);
      setFormData(prev => ({ ...prev, name: updated.name, email: updated.email }));
      setIsEditing(false);
    } catch {
      alert('Failed to update profile. Please try again.');
    }
  };

  // ── Profile picture upload ────────────────────────────────────────────────
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profilePicture', file);
      fd.append('name',  formData.name);
      fd.append('email', formData.email);
      const res     = await adminAPI.updateProfile(fd);
      const updated = res.data.data || res.data;
      setAdmin(updated);
      setFormData(prev => ({ ...prev, profilePicture: updated.profilePicture }));
    } catch {
      alert('Failed to upload picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const ProfileAvatar = ({ size = 'sm' }) => {
    const sizeClass = size === 'lg' ? 'w-12 h-12 rounded-xl text-base' : 'w-7 h-7 rounded-lg text-xs';
    const picture   = admin?.profilePicture || formData.profilePicture;
    if (picture) return <img src={picture} alt="Profile" className={`${sizeClass} object-cover`} />;
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
          <span className="font-extrabold tracking-tight">Clari<span className="text-indigo-400">Box</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleBellClick} className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
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

          {/* Search */}
          <div className="flex-1 max-w-md" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                placeholder="Search feedback, categories..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-all"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              )}
              {searchQuery && !searchLoading && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {searchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="divide-y divide-slate-50">
                        {searchResults.map(item => (
                          <div key={item._id} onClick={handleSearchResultClick} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                            <span className="mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 flex-shrink-0 capitalize">{item.category}</span>
                            <p className="text-xs text-slate-600 line-clamp-1 flex-1">{item.feedback}</p>
                          </div>
                        ))}
                      </div>
                      <div onClick={handleSearchResultClick} className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer text-center">
                        View all results in All Feedback →
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-slate-400">No feedback found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* ── Notifications bell ── */}
            <div className="relative">

              {/* Bell button — just opens/closes, does NOT auto mark as read */}
              <button
                onClick={handleBellClick}
                className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {/* Red badge — shows unread count */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Notifications dropdown ── */}
              {notifOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />

                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">

                    {/* Dropdown header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                        {/* Unread count badge in header */}
                        {unreadCount > 0 && (
                          <span className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Mark all read button — only shows when there are unread */}
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
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
                            className={`relative flex items-start gap-3 px-4 py-3 border-b border-slate-50 transition-colors
                              ${!notif.isRead ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}
                          >
                            {/* Notification icon */}
                            <div
                              onClick={() => handleNotifClick(notif)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm cursor-pointer
                                ${notif.type === 'negative_feedback' ? 'bg-red-100' :
                                  notif.type === 'category_spike'    ? 'bg-amber-100' : 'bg-indigo-100'}`}
                            >
                              {notif.type === 'negative_feedback' ? '⚠️' :
                               notif.type === 'category_spike'    ? '📈' : '🔔'}
                            </div>

                            {/* Notification text — clicking navigates */}
                            <div
                              onClick={() => handleNotifClick(notif)}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <p className={`text-xs font-bold leading-tight
                                ${!notif.isRead ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString([], {
                                  month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>

                            {/* Right side — unread dot OR mark as read button */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              {!notif.isRead ? (
                                <>
                                  {/* Blue unread dot */}
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1" />
                                  {/* Individual mark as read button */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                                    title="Mark as read"
                                    className="w-5 h-5 rounded-full bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer mt-1"
                                  >
                                    <Check className="w-2.5 h-2.5 text-slate-400 hover:text-indigo-600" />
                                  </button>
                                </>
                              ) : (
                                /* Grey check for already read */
                                <Check className="w-3.5 h-3.5 text-slate-300 mt-1" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Bell className="w-8 h-8 text-slate-300" />
                          <p className="text-sm text-slate-400">No notifications yet</p>
                        </div>
                      )}
                    </div>

                    {/* Footer — shows when all are read */}
                    {notifications.length > 0 && unreadCount === 0 && (
                      <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                          All caught up!
                        </p>
                      </div>
                    )}

                  </div>
                </>
              )}
            </div>

            {/* ── Profile button ── */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-white cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <ProfileAvatar size="sm" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none">{loading ? 'Loading…' : formData.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Administrator</p>
                </div>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setProfileOpen(false); setIsEditing(false); }} />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">
                    <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
                      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                      <button onClick={() => { setProfileOpen(false); setIsEditing(false); }} className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0 group">
                          <ProfileAvatar size="lg" />
                          <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            {uploading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                            <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
                          </label>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{formData.name}</p>
                          <p className="text-xs text-white/70 mt-0.5">{formData.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-b border-slate-100">
                      {isEditing ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1">Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="flex-1 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg hover:shadow-md transition-all cursor-pointer">Save</button>
                            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => setIsEditing(true)} className="w-full py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                          Edit Profile
                        </button>
                      )}
                    </div>

                    <div className="p-2">
                      <button onClick={() => { setProfileOpen(false); navigate('/admin/settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer">
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
                        <LogOut className="w-4 h-4" /> Logout
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