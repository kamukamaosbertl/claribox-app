import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Shield,
  LogOut,
  Settings,
  Camera,
  X,
  Check,
  CheckCheck,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../../services/api';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', profilePicture: null });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const navigate = useNavigate();

  const isTokenExpired = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

  useEffect(() => {
    const fetchAdminData = async () => {
      // Token expiry check
      const token = localStorage.getItem('adminToken');
      if (!token || isTokenExpired(token)) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          navigate('/admin/login');
          return;
      }
      try {
        const response = await adminAPI.getProfile();
        const d = response?.data?.data || response?.data || null;
        if (d) {
          setAdmin(d);
          setFormData({ name: d.name || 'Admin', email: d.email || '', profilePicture: d.profilePicture || null });
        }
      } catch {
        const stored = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setFormData({ name: stored.name || 'Admin', email: stored.email || '', profilePicture: stored.profilePicture || null });
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await adminAPI.getNotifications();
        const data = res?.data || {};
        setNotifications(data.data || []);
        setUnreadCount(data.unread || 0);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await adminAPI.getAllFeedback({ limit: 50, sort: 'newest' });
        const items = res?.data?.data || [];
        const q = searchQuery.toLowerCase();
        const matched = items.filter(
          (f) => f.feedback?.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q) || f.anonymous_id?.toLowerCase().includes(q)
        );
        setSearchResults(matched.slice(0, 5));
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
        setSearchOpen(true);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) { setProfileOpen(false); setIsEditing(false); }
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await adminAPI.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* no-op */ }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await adminAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* no-op */ }
  };

  const handleBellClick = () => { setNotifOpen((prev) => !prev); setProfileOpen(false); };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    setNotifOpen(false);
    navigate(notif.link || '/admin/dashboard');
  };

  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); };

  const handleSearchResultClick = (item) => {
    clearSearch();
    navigate('/admin/feedback', { state: { selectedFeedbackId: item?._id } });
  };

  const handleLogout = () => {
    adminAPI.logout?.();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.updateProfile({ name: formData.name, email: formData.email });
      const updated = res?.data?.data || res?.data;
      setAdmin(updated);
      setFormData((prev) => ({ ...prev, name: updated?.name || prev.name, email: updated?.email || prev.email }));
      setIsEditing(false);
    } catch {
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profilePicture', file);
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      const res = await adminAPI.updateProfile(fd);
      const updated = res?.data?.data || res?.data;
      setAdmin(updated);
      setFormData((prev) => ({ ...prev, profilePicture: updated?.profilePicture || prev.profilePicture }));
    } catch {
      alert('Failed to upload picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const ProfileAvatar = ({ size = 'sm' }) => {
    const picture = admin?.profilePicture || formData.profilePicture;
    const isLg = size === 'lg';
    if (picture) {
      return (
        <img
          src={picture}
          alt="Profile"
          className={`object-cover shrink-0 ${isLg ? 'w-12 h-12 rounded-xl' : 'w-[30px] h-[30px] rounded-lg'}`}
        />
      );
    }
    return (
      <div
        className={`shrink-0 flex items-center justify-center font-extrabold text-white tracking-[-0.01em] font-inter ${isLg ? 'w-12 h-12 rounded-xl text-[15px]' : 'w-[30px] h-[30px] rounded-lg text-[11px]'}`}
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
      >
        {loading ? '…' : getInitials(formData.name)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-inter">

      {/* ── Mobile top bar: hamburger + logo only, NO bell ── */}
      <div id="mobile-topbar" style={{ display: 'block' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#0F172A',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                width: 36, height: 36, borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.70)',
              }}
            >
              <Menu size={17} />
            </button>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(37,99,235,0.30)',
            }}>
              <Shield size={16} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif' }}>
              Clari<span style={{ color: '#60A5FA' }}>Box</span>
            </span>
          </div>
        </div>
      </div>

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div id="main-content">

        {/* ── Desktop header ── */}
        <header id="desktop-header" style={{ display: 'block' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            gap: 20,
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #E2E8F0',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)',
          }}>

            {/* Search */}
            <div style={{ flex: 1, maxWidth: 420, position: 'relative' }} ref={searchRef}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={(e) => {
                    if (searchResults.length > 0) setSearchOpen(true);
                    e.target.style.borderColor = '#93C5FD';
                    e.target.style.background = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.background = '#F8FAFC';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Search feedback, categories…"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: 36, paddingRight: searchQuery ? 32 : 14,
                    paddingTop: 8, paddingBottom: 8,
                    borderRadius: 11, border: '1px solid #E2E8F0',
                    background: '#F8FAFC', fontSize: 13, color: '#0F172A',
                    fontFamily: 'Inter, sans-serif', outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-[13px] h-[13px] rounded-full border-2 border-[#DBEAFE] border-t-[#2563EB] animate-spin" />
                )}
                {searchQuery && !searchLoading && (
                  <button
                    onClick={clearSearch}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 2 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {searchOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
                  boxShadow: '0 8px 28px rgba(15,23,42,0.12)', zIndex: 50, overflow: 'hidden',
                }}>
                  {searchResults.length > 0 ? (
                    <>
                      {searchResults.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => handleSearchResultClick(item)}
                          className="flex items-start gap-[10px] px-[14px] py-[10px] border-b border-[#F8FAFC] cursor-pointer hover:bg-[#F8FAFC]"
                        >
                          <span className="shrink-0 text-[10.5px] font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] rounded-[20px] px-2 py-[2px] capitalize mt-[1px]">
                            {item.category}
                          </span>
                          <p className="text-[12.5px] text-[#334155] flex-1 m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.feedback}
                          </p>
                        </div>
                      ))}
                      <div
                        onClick={() => { clearSearch(); navigate('/admin/feedback'); }}
                        className="px-[14px] py-[10px] bg-[#F8FAFC] border-t border-[#E2E8F0] text-xs font-bold text-[#2563EB] text-center cursor-pointer hover:bg-[#EFF6FF]"
                      >
                        View all results in All Feedback →
                      </div>
                    </>
                  ) : (
                    <div className="px-[14px] py-6 text-center">
                      <p className="text-[12.5px] text-[#94A3B8] m-0">No feedback found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Bell + Divider + Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

              {/* Bell — only one, next to profile */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  onClick={handleBellClick}
                  style={{
                    position: 'relative', width: 38, height: 38, borderRadius: 11,
                    border: '1px solid #E2E8F0', background: '#FFFFFF',
                    cursor: 'pointer', color: '#475569',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                  }}
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      minWidth: 17, height: 17, borderRadius: 99, padding: '0 3px',
                      background: '#EF4444', border: '2px solid #FFFFFF',
                      color: '#FFFFFF', fontSize: 9, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 320, background: '#FFFFFF', borderRadius: 18,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
                    zIndex: 20, overflow: 'hidden', animation: 'dropIn 0.18s ease',
                  }}>
                    {/* Notif header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span style={{ minWidth: 18, height: 18, borderRadius: 99, padding: '0 4px', background: '#EF4444', color: '#FFFFFF', fontSize: 9.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                        >
                          <CheckCheck size={12} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notif list */}
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 10,
                              padding: '12px 14px', borderBottom: '1px solid #F8FAFC',
                              background: !notif.isRead ? 'rgba(37,99,235,0.03)' : 'transparent',
                            }}
                          >
                            <div
                              onClick={() => handleNotifClick(notif)}
                              style={{
                                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 15, cursor: 'pointer',
                                background: notif.type === 'negative_feedback' ? '#FEF2F2' : notif.type === 'category_spike' ? '#FFFBEB' : '#EFF6FF',
                                border: notif.type === 'negative_feedback' ? '1px solid #FECACA' : notif.type === 'category_spike' ? '1px solid #FDE68A' : '1px solid #DBEAFE',
                              }}
                            >
                              {notif.type === 'negative_feedback' ? '⚠️' : notif.type === 'category_spike' ? '📈' : '🔔'}
                            </div>
                            <div onClick={() => handleNotifClick(notif)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                              <p style={{ fontSize: 12.5, fontWeight: !notif.isRead ? 700 : 600, color: !notif.isRead ? '#0F172A' : '#334155', margin: '0 0 3px', lineHeight: 1.3, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
                                {notif.title}
                              </p>
                              <p style={{ fontSize: 11.5, color: '#64748B', margin: '0 0 4px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: 'Inter, sans-serif' }}>
                                {notif.message}
                              </p>
                              <p style={{ fontSize: 10.5, color: '#94A3B8', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                                {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, paddingTop: 2 }}>
                              {!notif.isRead ? (
                                <>
                                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB' }} />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                                    title="Mark as read"
                                    style={{ width: 22, height: 22, borderRadius: 99, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  >
                                    <Check size={11} color="#2563EB" />
                                  </button>
                                </>
                              ) : (
                                <Check size={13} color="#CBD5E1" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', gap: 10 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={20} color="#2563EB" />
                          </div>
                          <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 28, background: '#E2E8F0' }} />

              {/* Profile */}
              <div style={{ position: 'relative' }} ref={profileRef}>
                <button
                  onClick={() => { setProfileOpen((prev) => !prev); setNotifOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    paddingLeft: 5, paddingRight: 12, paddingTop: 5, paddingBottom: 5,
                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                  }}
                >
                  <ProfileAvatar size="sm" />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.01em', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
                      {loading ? 'Loading…' : formData.name}
                    </p>
                    <p style={{ fontSize: 10.5, color: '#94A3B8', margin: '3px 0 0', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                      Administrator
                    </p>
                  </div>
                </button>

                {profileOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 280, background: '#FFFFFF', borderRadius: 18,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
                    zIndex: 20, overflow: 'hidden', animation: 'dropIn 0.18s ease',
                  }}>
                    {/* Banner */}
                    <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)', padding: 18 }}>
                      <button
                        onClick={() => { setProfileOpen(false); setIsEditing(false); }}
                        style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={12} />
                      </button>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ProfileAvatar size="lg" />
                          </div>
                          <label
                            className="absolute inset-0 rounded-[13px] bg-black/45 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity duration-150"
                          >
                            {uploading ? (
                              <div className="w-[14px] h-[14px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            ) : (
                              <Camera size={14} color="#FFFFFF" />
                            )}
                            <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
                          </label>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', margin: '0 0 3px', letterSpacing: '-0.025em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
                            {formData.name}
                          </p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: 'Inter, sans-serif' }}>{formData.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Edit section */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                      {isEditing ? (
                        <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[{ label: 'Name', type: 'text', key: 'name' }, { label: 'Email', type: 'email', key: 'email' }].map(({ label, type, key }) => (
                            <div key={key}>
                              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#64748B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>{label}</label>
                              <input
                                type={type}
                                value={formData[key]}
                                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                onFocus={(e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: 12.5, color: '#0F172A', fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'all 0.15s ease' }}
                              />
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" style={{ flex: 1, padding: 8, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              Save changes
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          style={{ width: '100%', padding: 9, borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(37,99,235,0.22)' }}
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: 7 }}>
                      <button
                        onClick={() => { setProfileOpen(false); navigate('/admin/settings'); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, border: 'none', background: 'transparent', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left' }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Settings size={13} color="#2563EB" />
                        </div>
                        Settings
                      </button>
                      <div style={{ height: 1, background: '#F1F5F9', margin: 4 }} />
                      <button
                        onClick={handleLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, border: 'none', background: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left' }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LogOut size={13} color="#EF4444" />
                        </div>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: 24 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Below 1024px: show mobile bar, hide desktop header, no sidebar margin */
        @media (max-width: 767px) {
          #mobile-topbar  { display: block !important; }
          #desktop-header { display: none  !important; }
          #main-content   { margin-left: 0 !important; }
        }

        /* 1024px and above: hide mobile bar, show desktop header, sidebar margin */
        @media (min-width: 768px) {
          #mobile-topbar  { display: none  !important; }
          #desktop-header { display: block !important; }
          #main-content   { margin-left: 260px; }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;