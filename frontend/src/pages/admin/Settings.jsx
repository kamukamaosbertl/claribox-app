import { useState, useEffect } from 'react';
import {
  Loader2, Save, Bell, Lock, Globe,
  AlertCircle, CheckCircle, Eye, EyeOff, KeyRound,
  Share2, Copy, Link, MessageCircle
} from 'lucide-react';
import { adminAPI } from '../../services/api';

// ── Settings page ─────────────────────────────────────────────────────────────
// Sections:
// 1. Change Password — calls /auth/change-password → sends security alert email
// 2. Notifications   — toggle email notifications on/off (stored in localStorage)
// 3. General         — language and timezone preferences (stored in localStorage)
const Settings = () => {

  // ── Change password state ──────────────────────────────────────────────────
  const [passwords,      setPasswords]      = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent,    setShowCurrent]    = useState(false);
  const [showNew,        setShowNew]        = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg,    setPasswordMsg]    = useState({ type: '', text: '' });

  // ── Notification preferences state ────────────────────────────────────────
  // Stored in localStorage — no backend needed
  // emailNotifications: true → admin receives email alerts
  const [notifications, setNotifications] = useState({
    emailWeeklyReport:  true,   // weekly digest every Monday
    emailSpikeAlert:    true,   // spike alert when 10+ feedbacks in one day
    emailInactivity:    true,   // reminder when not logged in for 3+ days
  });
  const [savingNotif,  setSavingNotif]  = useState(false);
  const [notifMsg,     setNotifMsg]     = useState({ type: '', text: '' });

  // ── General preferences state ──────────────────────────────────────────────
  const [general,       setGeneral]       = useState({ language: 'en', timezone: 'Africa/Kampala' });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalMsg,    setGeneralMsg]    = useState({ type: '', text: '' });

  // ── Link generator state ──────────────────────────────────────────────────
  // The feedback link is just the /submit page URL
  // Generated dynamically based on current domain
  const [linkCopied,    setLinkCopied]    = useState(false);
  const feedbackLink = `${window.location.origin}/`;

  // ── Load preferences on mount ─────────────────────────────────────────────
  // Loads notification prefs from MongoDB — general prefs from localStorage
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        // Load notification prefs from MongoDB
        const res = await adminAPI.getNotificationPrefs();
        if (res.data.data) setNotifications(prev => ({ ...prev, ...res.data.data }));
      } catch {
        // fallback to defaults if API fails
      }
      try {
        // Load general prefs from localStorage
        const savedGeneral = JSON.parse(localStorage.getItem('generalPrefs') || '{}');
        if (Object.keys(savedGeneral).length > 0) setGeneral(prev => ({ ...prev, ...savedGeneral }));
      } catch {}
    };
    loadPrefs();
  }, []);

  // ── Show message then auto-hide after 3 seconds ───────────────────────────
  const showMsg = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter({ type: '', text: '' }), 3000);
  };

  // ── Copy feedback link to clipboard ──────────────────────────────────────────
  const handleCopyLink = () => {
    navigator.clipboard.writeText(feedbackLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  // ── Share via WhatsApp ────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Dear Student,\n\nWe value your feedback! Please use the link below to share your experience at our university.\n\n${feedbackLink}\n\nYour feedback is anonymous and helps us improve.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // ── Share via Gmail ──────────────────────────────────────────────────────────
  // Opens Gmail compose window directly in browser
  // Works regardless of default email app set on computer
  const handleEmail = () => {
    const subject = encodeURIComponent('Share Your Feedback — ClariBox');
    const body = encodeURIComponent(
      `Dear Student,\n\nWe value your feedback! Please use the link below to share your experience at our university.\n\n${feedbackLink}\n\nYour feedback is completely anonymous and helps us improve your university experience.\n\nThank you.`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  // ── Change password ────────────────────────────────────────────────────────
  // Calls /auth/change-password on backend
  // Backend verifies current password, updates it, then sends security alert email
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (passwords.newPass.length < 6) {
      showMsg(setPasswordMsg, 'error', 'New password must be at least 6 characters.');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      showMsg(setPasswordMsg, 'error', 'New passwords do not match.');
      return;
    }
    if (passwords.current === passwords.newPass) {
      showMsg(setPasswordMsg, 'error', 'New password must be different from current password.');
      return;
    }

    setSavingPassword(true);
    try {
      const token = localStorage.getItem('adminToken');
      await adminAPI.changePassword({
        token,
        currentPassword: passwords.current,
        newPassword:     passwords.newPass
      });

      // Clear form on success
      setPasswords({ current: '', newPass: '', confirm: '' });
      showMsg(setPasswordMsg, 'success', 'Password changed successfully! A security alert was sent to your email.');
    } catch (err) {
      showMsg(setPasswordMsg, 'error', err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Save notification preferences to MongoDB via backend ──────────────────
  // When toggle is OFF → backend emailService skips that email type
  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    try {
      await adminAPI.saveNotificationPrefs(notifications);
      showMsg(setNotifMsg, 'success', 'Notification preferences saved!');
    } catch {
      showMsg(setNotifMsg, 'error', 'Failed to save preferences.');
    } finally {
      setSavingNotif(false);
    }
  };

  // ── Save general preferences ───────────────────────────────────────────────
  const handleSaveGeneral = () => {
    setSavingGeneral(true);
    try {
      localStorage.setItem('generalPrefs', JSON.stringify(general));
      showMsg(setGeneralMsg, 'success', 'General settings saved!');
    } catch {
      showMsg(setGeneralMsg, 'error', 'Failed to save settings.');
    } finally {
      setSavingGeneral(false);
    }
  };

  // ── Reusable message banner ────────────────────────────────────────────────
  const MessageBanner = ({ msg }) => {
    if (!msg.text) return null;
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium mt-4
        ${msg.type === 'success'
          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
          : 'bg-red-50 border-red-100 text-red-700'
        }`}>
        {msg.type === 'success'
          ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
          : <AlertCircle className="w-4 h-4 flex-shrink-0" />
        }
        {msg.text}
      </div>
    );
  };

  // ── Toggle switch component ────────────────────────────────────────────────
  const Toggle = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
    </label>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, notifications and preferences</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — CHANGE PASSWORD
          Calls /auth/change-password → verifies current password → updates
          → sends security alert email immediately
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Section header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Change Password</h2>
            <p className="text-xs text-slate-500">A security alert email will be sent after changing</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="px-6 py-5 space-y-4">

          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="Enter current password"
                required
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={passwords.newPass}
                onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="Repeat new password"
                required
                className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all
                  ${passwords.confirm && passwords.confirm !== passwords.newPass
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-slate-200'
                  }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Live mismatch warning */}
            {passwords.confirm && passwords.confirm !== passwords.newPass && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {savingPassword
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing...</>
              : <><KeyRound className="w-4 h-4" /> Change Password</>
            }
          </button>

          <MessageBanner msg={passwordMsg} />
        </form>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — EMAIL NOTIFICATIONS
          Each toggle controls whether that email type is sent
          Preferences saved to localStorage
          When toggle is OFF → that email type is skipped
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Bell className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Email Notifications</h2>
            <p className="text-xs text-slate-500">Control which emails ClariBox sends you</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Weekly report toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Weekly Feedback Report</p>
              <p className="text-xs text-slate-500 mt-0.5">Every Monday at 8am — summary of last 7 days</p>
            </div>
            <Toggle
              checked={notifications.emailWeeklyReport}
              onChange={val => setNotifications(prev => ({ ...prev, emailWeeklyReport: val }))}
            />
          </div>

          {/* Spike alert toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Feedback Spike Alert</p>
              <p className="text-xs text-slate-500 mt-0.5">Sent immediately when 10+ feedbacks in one day</p>
            </div>
            <Toggle
              checked={notifications.emailSpikeAlert}
              onChange={val => setNotifications(prev => ({ ...prev, emailSpikeAlert: val }))}
            />
          </div>

          {/* Inactivity reminder toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Inactivity Reminder</p>
              <p className="text-xs text-slate-500 mt-0.5">Sent when you haven't logged in for 3+ days</p>
            </div>
            <Toggle
              checked={notifications.emailInactivity}
              onChange={val => setNotifications(prev => ({ ...prev, emailInactivity: val }))}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveNotifications}
            disabled={savingNotif}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {savingNotif
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4" /> Save Preferences</>
            }
          </button>

          <MessageBanner msg={notifMsg} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — GENERAL PREFERENCES
          Language and timezone — saved to localStorage
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">General</h2>
            <p className="text-xs text-slate-500">Language and timezone preferences</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Language</label>
              <select
                value={general.language}
                onChange={e => setGeneral({ ...general, language: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer"
              >
                <option value="en">English</option>
                <option value="sw">Swahili</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Timezone</label>
              <select
                value={general.timezone}
                onChange={e => setGeneral({ ...general, timezone: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer"
              >
                <option value="Africa/Kampala">Africa/Kampala (EAT +3)</option>
                <option value="UTC">UTC +0</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
                <option value="Africa/Lagos">Africa/Lagos (WAT +1)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveGeneral}
            disabled={savingGeneral}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {savingGeneral
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4" /> Save General Settings</>
            }
          </button>

          <MessageBanner msg={generalMsg} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — SHARE FEEDBACK LINK
          Generates the student feedback submission URL
          Admin copies and shares with students via email/WhatsApp
          No backend needed — just the /submit page URL
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Share Feedback Link</h2>
            <p className="text-xs text-slate-500">Share this link with students so they can submit feedback</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Link preview box */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Link className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm text-slate-700 flex-1 truncate font-mono">
              {feedbackLink}
            </span>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              This link takes students directly to the feedback submission page.
              Submissions are completely anonymous — no personal data is collected.
              Students cannot access the admin dashboard through this link.
            </p>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap gap-3">

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border
                ${linkCopied
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
            >
              {linkCopied
                ? <><CheckCircle className="w-4 h-4" /> Copied!</>
                : <><Copy className="w-4 h-4" /> Copy Link</>
              }
            </button>

            {/* Share via WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-all cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Share via WhatsApp
            </button>

            {/* Share via Gmail */}
            <button
              onClick={handleEmail}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              Share via Gmail
            </button>

          </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;