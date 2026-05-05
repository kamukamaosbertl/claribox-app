import { useState, useEffect } from 'react';
import {
  Loader2, Save, Bell, Globe,
  AlertCircle, CheckCircle, Eye, EyeOff,
  Copy, Link, MessageCircle, Share2, KeyRound,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ type = 'text', value, onChange, placeholder, required, rightSlot }) => (
  <div className="relative">
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-[13px] text-slate-900
        outline-none transition placeholder:text-slate-400
        focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
      style={{ paddingRight: rightSlot ? '40px' : undefined }}
    />
    {rightSlot && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
    )}
  </div>
);

const Select = ({ value, onChange, children }) => (
  <select
    value={value} onChange={onChange}
    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-[13px] text-slate-900
      outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
  >
    {children}
  </select>
);

const Btn = ({ onClick, type = 'button', disabled, loading, children, variant = 'primary' }) => {
  const base = 'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50';
  const styles = {
    primary:  'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.20)]',
    ghost:    'border border-[#E2E8F0] bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600',
    green:    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_4px_12px_rgba(5,150,105,0.20)]',
    red:      'bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.20)]',
    violet:   'bg-violet-600 text-white hover:bg-violet-700 shadow-[0_4px_12px_rgba(124,58,237,0.20)]',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${styles[variant]}`}>
      {loading ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : children}
    </button>
  );
};

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
    <div>
      <p className="text-[13px] font-semibold text-slate-800">{label}</p>
      {description && <p className="mt-0.5 text-[11.5px] text-slate-400">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${checked ? 'left-[23px]' : 'left-[3px]'}`} />
    </button>
  </div>
);

const Banner = ({ msg }) => {
  if (!msg?.text) return null;
  const ok = msg.type === 'success';
  return (
    <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-semibold
      ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
      {ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
      {msg.text}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   SECTION WRAPPER
───────────────────────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div className="overflow-hidden rounded-2xl border border-[#E8ECF4] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
    <div className="border-b border-[#F1F5F9] px-5 py-4">
      <h2 className="text-[13.5px] font-extrabold tracking-[-0.02em] text-slate-900">{title}</h2>
    </div>
    <div className="space-y-4 p-5">{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const Settings = () => {
  /* Password */
  const [pw,          setPw]          = useState({ current: '', newPass: '', confirm: '' });
  const [showPw,      setShowPw]      = useState({ current: false, newPass: false, confirm: false });
  const [savingPw,    setSavingPw]    = useState(false);
  const [pwMsg,       setPwMsg]       = useState(null);

  /* Notifications */
  const [notif,       setNotif]       = useState({ emailWeeklyReport: true, emailSpikeAlert: true, emailInactivity: true });
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg,    setNotifMsg]    = useState(null);

  /* General */
  const [general,     setGeneral]     = useState({ language: 'en', timezone: 'Africa/Kampala' });
  const [savingGen,   setSavingGen]   = useState(false);
  const [genMsg,      setGenMsg]      = useState(null);

  /* Share */
  const [copied,      setCopied]      = useState(false);
  const feedbackLink = `${window.location.origin}/`;

  const flash = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getNotificationPrefs();
        if (res.data.data) setNotif(p => ({ ...p, ...res.data.data }));
      } catch {}
      try {
        const saved = JSON.parse(localStorage.getItem('generalPrefs') || '{}');
        if (Object.keys(saved).length) setGeneral(p => ({ ...p, ...saved }));
      } catch {}
    })();
  }, []);

  /* ── Handlers ── */
  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pw.newPass.length < 6)           return flash(setPwMsg, 'error', 'Password must be at least 6 characters.');
    if (pw.newPass !== pw.confirm)       return flash(setPwMsg, 'error', 'Passwords do not match.');
    if (pw.current === pw.newPass)       return flash(setPwMsg, 'error', 'New password must differ from current.');
    setSavingPw(true);
    try {
      await adminAPI.changePassword({ token: localStorage.getItem('adminToken'), currentPassword: pw.current, newPassword: pw.newPass });
      setPw({ current: '', newPass: '', confirm: '' });
      flash(setPwMsg, 'success', 'Password updated successfully.');
    } catch (err) {
      flash(setPwMsg, 'error', err.response?.data?.message || 'Failed to change password.');
    } finally { setSavingPw(false); }
  };

  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try { await adminAPI.saveNotificationPrefs(notif); flash(setNotifMsg, 'success', 'Preferences saved.'); }
    catch { flash(setNotifMsg, 'error', 'Failed to save.'); }
    finally { setSavingNotif(false); }
  };

  const handleSaveGeneral = () => {
    setSavingGen(true);
    try { localStorage.setItem('generalPrefs', JSON.stringify(general)); flash(setGenMsg, 'success', 'Settings saved.'); }
    catch { flash(setGenMsg, 'error', 'Failed to save.'); }
    finally { setSavingGen(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(feedbackLink);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Share your feedback here: ${feedbackLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const s = encodeURIComponent('Share Your Feedback — ClariBox');
    const b = encodeURIComponent(`Please submit your feedback here:\n\n${feedbackLink}\n\nIt's completely anonymous.`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${s}&body=${b}`, '_blank');
  };

  /* ── Render ── */
  return (
    <div className="mx-auto max-w-[640px] space-y-5 pb-12 font-sans antialiased">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-black tracking-[-0.035em] text-slate-900">Settings</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">Manage your account and preferences.</p>
      </div>

      {/* ── 1. Change Password ── */}
      <Section title="Change Password">
        <form onSubmit={handleChangePw} className="space-y-3.5">
          {[
            { key: 'current',  label: 'Current Password',      ph: 'Enter current password'  },
            { key: 'newPass',  label: 'New Password',           ph: 'Minimum 6 characters'    },
            { key: 'confirm',  label: 'Confirm New Password',   ph: 'Repeat new password'      },
          ].map(({ key, label, ph }) => (
            <Field key={key} label={label}>
              <Input
                type={showPw[key] ? 'text' : 'password'}
                value={pw[key]}
                onChange={e => setPw({ ...pw, [key]: e.target.value })}
                placeholder={ph}
                required
                rightSlot={
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    className="text-slate-400 transition hover:text-blue-500">
                    {showPw[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
            </Field>
          ))}

          {pw.confirm && pw.confirm !== pw.newPass && (
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-red-500">
              <AlertCircle size={11} /> Passwords do not match
            </p>
          )}

          <Btn type="submit" loading={savingPw} variant="violet">
            <KeyRound size={13} /> Change Password
          </Btn>
          <Banner msg={pwMsg} />
        </form>
      </Section>

      {/* ── 2. Email Notifications ── */}
      <Section title="Email Notifications">
        <div className="space-y-2">
          <Toggle
            checked={notif.emailWeeklyReport}
            onChange={val => setNotif(p => ({ ...p, emailWeeklyReport: val }))}
            label="Weekly Report"
            description="Every Monday — summary of the past 7 days"
          />
          <Toggle
            checked={notif.emailSpikeAlert}
            onChange={val => setNotif(p => ({ ...p, emailSpikeAlert: val }))}
            label="Spike Alert"
            description="When 10+ submissions arrive in one day"
          />
          <Toggle
            checked={notif.emailInactivity}
            onChange={val => setNotif(p => ({ ...p, emailInactivity: val }))}
            label="Inactivity Reminder"
            description="When you haven't logged in for 3+ days"
          />
        </div>
        <Btn loading={savingNotif} onClick={handleSaveNotif}>
          <Save size={13} /> Save
        </Btn>
        <Banner msg={notifMsg} />
      </Section>

      {/* ── 3. General ── */}
      <Section title="General">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Language">
            <Select value={general.language} onChange={e => setGeneral({ ...general, language: e.target.value })}>
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </Select>
          </Field>
          <Field label="Timezone">
            <Select value={general.timezone} onChange={e => setGeneral({ ...general, timezone: e.target.value })}>
              <option value="Africa/Kampala">Kampala (EAT +3)</option>
              <option value="UTC">UTC +0</option>
              <option value="Africa/Nairobi">Nairobi (EAT +3)</option>
              <option value="Africa/Lagos">Lagos (WAT +1)</option>
            </Select>
          </Field>
        </div>
        <Btn loading={savingGen} onClick={handleSaveGeneral} variant="green">
          <Save size={13} /> Save
        </Btn>
        <Banner msg={genMsg} />
      </Section>

      {/* ── 4. Share Feedback Link ── */}
      <Section title="Share Feedback Link">
        {/* URL preview */}
        <div className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5">
          <Link size={13} className="shrink-0 text-slate-400" />
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12.5px] text-slate-600">
            {feedbackLink}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={handleCopy} variant="ghost">
            {copied ? <><CheckCircle size={13} className="text-emerald-500" /> Copied!</> : <><Copy size={13} /> Copy Link</>}
          </Btn>
          <Btn onClick={handleWhatsApp} variant="green">
            <MessageCircle size={13} /> WhatsApp
          </Btn>
          <Btn onClick={handleEmail} variant="red">
            <Share2 size={13} /> Gmail
          </Btn>
        </div>
      </Section>

    </div>
  );
};

export default Settings;