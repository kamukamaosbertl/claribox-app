import { useState, useEffect } from 'react';
import {
  Loader2, Save, Bell, Lock, Globe,
  AlertCircle, CheckCircle, Eye, EyeOff, KeyRound,
  Share2, Copy, Link, MessageCircle,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

// ── Shared input style ────────────────────────────────────────────────────
const inputBase = (hasError = false) => ({
  width: '100%', boxSizing: 'border-box',
  padding: '10px 14px', borderRadius: '11px',
  border: `1px solid ${hasError ? '#FECACA' : '#E2E8F0'}`,
  background: hasError ? '#FEF2F2' : '#F8FAFC',
  fontSize: '13px', color: '#0F172A', fontFamily: font,
  outline: 'none', transition: 'all 0.15s ease',
});

const labelStyle = {
  display: 'block', fontSize: '10.5px', fontWeight: 700,
  color: '#475569', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.07em',
};

const focusIn  = (e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; };
const focusOut = (e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; };

// ── Section card ──────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, subtitle, accent = '#2563EB', accentBg = '#EFF6FF', accentBorder = '#DBEAFE', children }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)',
    overflow: 'hidden', marginBottom: '20px',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '16px 22px', borderBottom: '1px solid #F1F5F9',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
        background: `linear-gradient(135deg, ${accentBg} 0%, ${accentBorder} 100%)`,
        border: `1px solid ${accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 3px 8px ${accent}18`,
      }}>
        <Icon size={17} color={accent} />
      </div>
      <div>
        <h2 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>
          {subtitle}
        </p>
      </div>
    </div>
    <div style={{ padding: '20px 22px' }}>
      {children}
    </div>
  </div>
);

// ── Toggle ────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, description }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '16px', padding: '12px 16px', borderRadius: '13px',
    background: '#F8FAFC', border: '1px solid #E2E8F0',
    transition: 'border-color 0.15s ease',
  }}>
    <div>
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
        {label}
      </p>
      {description && (
        <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '2px 0 0', fontWeight: 400 }}>
          {description}
        </p>
      )}
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '99px', flexShrink: 0,
        background: checked ? '#2563EB' : '#E2E8F0',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s ease',
        boxShadow: checked ? '0 2px 8px rgba(37,99,235,0.28)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: checked ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(15,23,42,0.18)',
        transition: 'left 0.2s ease',
        display: 'block',
      }} />
    </button>
  </div>
);

// ── Message banner ────────────────────────────────────────────────────────
const MessageBanner = ({ msg }) => {
  if (!msg.text) return null;
  const isSuccess = msg.type === 'success';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '11px 14px', borderRadius: '11px', marginTop: '14px',
      background: isSuccess ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${isSuccess ? '#BBF7D0' : '#FECACA'}`,
      fontSize: '12.5px', fontWeight: 600, fontFamily: font,
      color: isSuccess ? '#15803D' : '#B91C1C',
      animation: 'slideUp 0.2s ease',
    }}>
      {isSuccess
        ? <CheckCircle size={14} color="#22C55E" style={{ flexShrink: 0 }} />
        : <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
      }
      {msg.text}
    </div>
  );
};

// ── Save button ───────────────────────────────────────────────────────────
const SaveButton = ({ loading, onClick, type = 'button', label, icon: Icon, accent = '#2563EB', accentDark = '#1D4ED8' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={loading}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      padding: '10px 20px', borderRadius: '11px', border: 'none',
      background: loading ? '#93C5FD' : `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
      color: '#FFFFFF', fontSize: '13px', fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer', fontFamily: font,
      boxShadow: loading ? 'none' : `0 4px 12px ${accent}35`,
      transition: 'all 0.16s ease',
    }}
    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${accent}45`; } }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : `0 4px 12px ${accent}35`; }}
  >
    {loading
      ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
      : <><Icon size={13} /> {label}</>
    }
  </button>
);

// ─────────────────────────────────────────────────────────────────────────
// Main Settings component
// ─────────────────────────────────────────────────────────────────────────
const Settings = () => {

  // ── Password ──────────────────────────────────────────────────────────
  const [passwords,      setPasswords]      = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent,    setShowCurrent]    = useState(false);
  const [showNew,        setShowNew]        = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg,    setPasswordMsg]    = useState({ type: '', text: '' });

  // ── Notifications ─────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    emailWeeklyReport: true,
    emailSpikeAlert:   true,
    emailInactivity:   true,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg,    setNotifMsg]    = useState({ type: '', text: '' });

  // ── General prefs ─────────────────────────────────────────────────────
  const [general,       setGeneral]       = useState({ language: 'en', timezone: 'Africa/Kampala' });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalMsg,    setGeneralMsg]    = useState({ type: '', text: '' });

  // ── Share link ────────────────────────────────────────────────────────
  const [linkCopied, setLinkCopied] = useState(false);
  const feedbackLink = `${window.location.origin}/`;

  // ── Load prefs ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await adminAPI.getNotificationPrefs();
        if (res.data.data) setNotifications((prev) => ({ ...prev, ...res.data.data }));
      } catch {}
      try {
        const saved = JSON.parse(localStorage.getItem('generalPrefs') || '{}');
        if (Object.keys(saved).length > 0) setGeneral((prev) => ({ ...prev, ...saved }));
      } catch {}
    };
    loadPrefs();
  }, []);

  const showMsg = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter({ type: '', text: '' }), 3500);
  };

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass.length < 6)             { showMsg(setPasswordMsg, 'error', 'New password must be at least 6 characters.'); return; }
    if (passwords.newPass !== passwords.confirm)  { showMsg(setPasswordMsg, 'error', 'New passwords do not match.');                 return; }
    if (passwords.current === passwords.newPass)  { showMsg(setPasswordMsg, 'error', 'New password must differ from current.');      return; }
    setSavingPassword(true);
    try {
      await adminAPI.changePassword({
        token: localStorage.getItem('adminToken'),
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      setPasswords({ current: '', newPass: '', confirm: '' });
      showMsg(setPasswordMsg, 'success', 'Password changed! A security alert was sent to your email.');
    } catch (err) {
      showMsg(setPasswordMsg, 'error', err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally { setSavingPassword(false); }
  };

  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    try {
      await adminAPI.saveNotificationPrefs(notifications);
      showMsg(setNotifMsg, 'success', 'Notification preferences saved!');
    } catch { showMsg(setNotifMsg, 'error', 'Failed to save preferences.'); }
    finally  { setSavingNotif(false); }
  };

  const handleSaveGeneral = () => {
    setSavingGeneral(true);
    try {
      localStorage.setItem('generalPrefs', JSON.stringify(general));
      showMsg(setGeneralMsg, 'success', 'General settings saved!');
    } catch { showMsg(setGeneralMsg, 'error', 'Failed to save settings.'); }
    finally  { setSavingGeneral(false); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(feedbackLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Dear Student,\n\nWe value your feedback! Please use the link below to share your experience at our university.\n\n${feedbackLink}\n\nYour feedback is anonymous and helps us improve.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Share Your Feedback — ClariBox');
    const body    = encodeURIComponent(
      `Dear Student,\n\nWe value your feedback! Please use the link below.\n\n${feedbackLink}\n\nYour feedback is completely anonymous.\n\nThank you.`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  // ── Password input with show/hide ─────────────────────────────────────
  const PasswordField = ({ field, label, placeholder, show, toggleShow, hasError }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Lock size={14} color="#94A3B8" style={{
          position: 'absolute', left: '12px', top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none',
        }} />
        <input
          type={show ? 'text' : 'password'}
          value={passwords[field]}
          onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
          placeholder={placeholder}
          required
          style={{ ...inputBase(hasError), paddingLeft: '36px', paddingRight: '40px' }}
          onFocus={focusIn} onBlur={focusOut}
        />
        <button
          type="button" onClick={toggleShow}
          style={{
            position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94A3B8', display: 'flex', alignItems: 'center', padding: '2px',
            transition: 'color 0.13s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: font, maxWidth: '700px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* ── Page heading ────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 5px', letterSpacing: '-0.035em' }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
          Manage your account, notifications and preferences.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1. CHANGE PASSWORD
      ══════════════════════════════════════════════════════════ */}
      <Section
        icon={KeyRound} title="Change Password"
        subtitle="A security alert email will be sent after changing"
        accent="#7C3AED" accentBg="#F5F3FF" accentBorder="#DDD6FE"
      >
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <PasswordField
            field="current" label="Current Password"
            placeholder="Enter current password"
            show={showCurrent} toggleShow={() => setShowCurrent(!showCurrent)}
          />
          <PasswordField
            field="newPass" label="New Password"
            placeholder="Minimum 6 characters"
            show={showNew} toggleShow={() => setShowNew(!showNew)}
          />
          <PasswordField
            field="confirm" label="Confirm New Password"
            placeholder="Repeat new password"
            show={showConfirm} toggleShow={() => setShowConfirm(!showConfirm)}
            hasError={passwords.confirm && passwords.confirm !== passwords.newPass}
          />
          {/* Live mismatch */}
          {passwords.confirm && passwords.confirm !== passwords.newPass && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '-8px' }}>
              <AlertCircle size={12} color="#EF4444" />
              <span style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: 600 }}>
                Passwords do not match
              </span>
            </div>
          )}

          <SaveButton
            type="submit" loading={savingPassword}
            label="Change Password" icon={KeyRound}
            accent="#7C3AED" accentDark="#6D28D9"
          />
          <MessageBanner msg={passwordMsg} />
        </form>
      </Section>

      {/* ══════════════════════════════════════════════════════════
          2. EMAIL NOTIFICATIONS
      ══════════════════════════════════════════════════════════ */}
      <Section
        icon={Bell} title="Email Notifications"
        subtitle="Control which emails ClariBox sends you"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <Toggle
            checked={notifications.emailWeeklyReport}
            onChange={(val) => setNotifications((prev) => ({ ...prev, emailWeeklyReport: val }))}
            label="Weekly Feedback Report"
            description="Every Monday at 8am — summary of last 7 days"
          />
          <Toggle
            checked={notifications.emailSpikeAlert}
            onChange={(val) => setNotifications((prev) => ({ ...prev, emailSpikeAlert: val }))}
            label="Feedback Spike Alert"
            description="Sent immediately when 10+ feedbacks in one day"
          />
          <Toggle
            checked={notifications.emailInactivity}
            onChange={(val) => setNotifications((prev) => ({ ...prev, emailInactivity: val }))}
            label="Inactivity Reminder"
            description="Sent when you haven't logged in for 3+ days"
          />
        </div>

        <SaveButton
          loading={savingNotif} onClick={handleSaveNotifications}
          label="Save Preferences" icon={Save}
        />
        <MessageBanner msg={notifMsg} />
      </Section>

      {/* ══════════════════════════════════════════════════════════
          3. GENERAL PREFERENCES
      ══════════════════════════════════════════════════════════ */}
      <Section
        icon={Globe} title="General"
        subtitle="Language and timezone preferences"
        accent="#059669" accentBg="#F0FDF4" accentBorder="#BBF7D0"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Language</label>
            <select
              value={general.language}
              onChange={(e) => setGeneral({ ...general, language: e.target.value })}
              style={inputBase()}
              onFocus={focusIn} onBlur={focusOut}
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Timezone</label>
            <select
              value={general.timezone}
              onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
              style={inputBase()}
              onFocus={focusIn} onBlur={focusOut}
            >
              <option value="Africa/Kampala">Africa/Kampala (EAT +3)</option>
              <option value="UTC">UTC +0</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
              <option value="Africa/Lagos">Africa/Lagos (WAT +1)</option>
            </select>
          </div>
        </div>

        <SaveButton
          loading={savingGeneral} onClick={handleSaveGeneral}
          label="Save General Settings" icon={Save}
          accent="#059669" accentDark="#047857"
        />
        <MessageBanner msg={generalMsg} />
      </Section>

      {/* ══════════════════════════════════════════════════════════
          4. SHARE FEEDBACK LINK
      ══════════════════════════════════════════════════════════ */}
      <Section
        icon={Share2} title="Share Feedback Link"
        subtitle="Share this link with students so they can submit feedback"
        accent="#6366F1" accentBg="#EEF2FF" accentBorder="#C7D2FE"
      >
        {/* Link preview */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', borderRadius: '11px',
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          marginBottom: '12px',
        }}>
          <Link size={14} color="#6366F1" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: '12.5px', color: '#334155', flex: 1, fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {feedbackLink}
          </span>
        </div>

        {/* Info note */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '9px',
          padding: '11px 14px', borderRadius: '11px',
          background: '#EEF2FF', border: '1px solid #C7D2FE',
          marginBottom: '16px',
        }}>
          <CheckCircle size={14} color="#6366F1" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '12px', color: '#4338CA', margin: 0, lineHeight: '1.6', fontWeight: 500 }}>
            This link takes students directly to the feedback submission page.
            Submissions are completely anonymous — no personal data is collected.
          </p>
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {/* Copy */}
          <button
            onClick={handleCopyLink}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', borderRadius: '11px',
              border: `1px solid ${linkCopied ? '#BBF7D0' : '#E2E8F0'}`,
              background: linkCopied ? '#F0FDF4' : '#FFFFFF',
              color: linkCopied ? '#15803D' : '#334155',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: font,
              transition: 'all 0.16s ease',
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
            }}
            onMouseEnter={(e) => { if (!linkCopied) { e.currentTarget.style.borderColor = '#C7D2FE'; e.currentTarget.style.color = '#4338CA'; e.currentTarget.style.background = '#EEF2FF'; } }}
            onMouseLeave={(e) => { if (!linkCopied) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = '#FFFFFF'; } }}
          >
            {linkCopied
              ? <><CheckCircle size={13} /> Copied!</>
              : <><Copy size={13} /> Copy Link</>
            }
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', borderRadius: '11px', border: 'none',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: font,
              boxShadow: '0 4px 12px rgba(34,197,94,0.22)',
              transition: 'all 0.16s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(34,197,94,0.30)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34,197,94,0.22)'; }}
          >
            <MessageCircle size={13} />
            Share via WhatsApp
          </button>

          {/* Gmail */}
          <button
            onClick={handleEmail}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', borderRadius: '11px', border: 'none',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: font,
              boxShadow: '0 4px 12px rgba(239,68,68,0.22)',
              transition: 'all 0.16s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.30)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.22)'; }}
          >
            <Share2 size={13} />
            Share via Gmail
          </button>
        </div>
      </Section>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default Settings;