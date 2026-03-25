import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Phone, ArrowLeft, Paperclip, X, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import ClariCoin from '../../components/dashboard/ClariCoin';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const categories = [
  { value: 'academic',   label: 'Academic & Teaching',    emoji: '📚' },
  { value: 'library',    label: 'Library Services',        emoji: '📖' },
  { value: 'it',         label: 'IT & WiFi',               emoji: '💻' },
  { value: 'facilities', label: 'Campus Facilities',       emoji: '🏫' },
  { value: 'canteen',    label: 'Food & Canteen',          emoji: '🍽️' },
  { value: 'transport',  label: 'Transport & Parking',     emoji: '🚌' },
  { value: 'hostel',     label: 'Hostel & Accommodation',  emoji: '🏠' },
  { value: 'admin',      label: 'Administrative Services', emoji: '📋' },
  { value: 'other',      label: 'Other',                   emoji: '💬' },
];

const nextSteps = [
  'Your feedback is reviewed by administrators',
  'Action is taken on valid concerns',
  'Resolutions are published on the platform',
];

const inputStyle = (focused) => ({
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', borderRadius: '12px',
  border: `1px solid ${focused ? '#93C5FD' : '#E2E8F0'}`,
  background: focused ? '#FFFFFF' : '#F8FAFC',
  fontSize: '13.5px', color: '#0F172A', fontFamily: font,
  outline: 'none', transition: 'all 0.15s ease',
  boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
});

const SubmitFeedback = () => {
  const [formData,     setFormData]     = useState({ category: '', feedback: '' });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess,    setIsSuccess]    = useState(false);
  const [error,        setError]        = useState('');
  const [focused,      setFocused]      = useState({ category: false, feedback: false });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { setError('File is too large. Maximum size is 5MB.'); return; }
    setEvidenceFile(file); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setError('');
    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('feedback', formData.feedback);
      if (evidenceFile) data.append('evidenceFile', evidenceFile);
      await studentAPI.submitFeedback(data);
      setIsSuccess(true);
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.'); }
    finally      { setIsSubmitting(false); }
  };

  const handleReset = () => { setIsSuccess(false); setFormData({ category: '', feedback: '' }); setEvidenceFile(null); };
  const isDisabled  = isSubmitting || !formData.category || !formData.feedback;

  // ── SUCCESS SCREEN ───────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F4F7FB', fontFamily: font,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
      }}>
        <div style={{
          width: '100%', maxWidth: '420px', background: '#FFFFFF',
          borderRadius: '24px', overflow: 'hidden', textAlign: 'center',
          boxShadow: '0 16px 48px rgba(15,23,42,0.12)',
        }}>
          {/* Green header */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            padding: '40px 32px',
          }}>
            <div style={{ position: 'absolute', top: '-32px', right: '-32px', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
            }}>
              <CheckCircle size={32} color="#FFFFFF" />
            </div>
          </div>

          <div style={{ padding: '28px 32px 32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
              Feedback Submitted! 🎉
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.65', margin: '0 0 24px' }}>
              Thank you for speaking up. Your feedback has been submitted completely anonymously and will be reviewed by administrators.
            </p>

            {/* What happens next */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '22px', textAlign: 'left' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 12px' }}>
                What happens next
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nextSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      background: '#EFF6FF', border: '1px solid #DBEAFE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#2563EB' }}>{i + 1}</span>
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleReset}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '13px', border: 'none', cursor: 'pointer', fontFamily: font,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF', fontSize: '13.5px', fontWeight: 700, letterSpacing: '-0.01em',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.24)', transition: 'all 0.16s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.32)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.24)'; }}
              >
                <Send size={14} /> Submit Another
              </button>
              <Link to="/" style={{
                display: 'block', padding: '12px', borderRadius: '13px',
                border: '1px solid #E2E8F0', background: '#FFFFFF',
                color: '#475569', fontSize: '13.5px', fontWeight: 600,
                textDecoration: 'none', textAlign: 'center', transition: 'all 0.14s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', padding: '40px 24px', fontFamily: font }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Back link */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', fontWeight: 600, color: '#64748B', textDecoration: 'none',
          marginBottom: '24px', transition: 'color 0.14s ease',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
        >
          <ArrowLeft size={15} /> Back to Home
        </Link>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#EFF6FF', border: '1px solid #DBEAFE',
            padding: '5px 14px', borderRadius: '99px', marginBottom: '12px',
          }}>
            <Sparkles size={12} color="#2563EB" />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#2563EB' }}>Anonymous Submission</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.035em', margin: '0 0 6px' }}>
            Submit Your Feedback
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            Your feedback is completely anonymous — no personal data collected.
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: '#FFFFFF', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(15,23,42,0.10)' }}>

          {/* Header bar */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 22px',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)',
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={13} color="#FFFFFF" />
            </div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
              Your identity is protected — no personal information is ever collected
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', borderRadius: '12px',
                background: '#FEF2F2', border: '1px solid #FECACA',
              }}>
                <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#B91C1C', fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Category <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                style={inputStyle(focused.category)}
                onFocus={() => setFocused({ ...focused, category: true })}
                onBlur={() => setFocused({ ...focused, category: false })}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Feedback textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Your Feedback <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                required rows={6}
                placeholder="Share your thoughts, concerns, or suggestions here..."
                style={{ ...inputStyle(focused.feedback), resize: 'none', lineHeight: '1.65' }}
                onFocus={() => setFocused({ ...focused, feedback: true })}
                onBlur={() => setFocused({ ...focused, feedback: false })}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>Be specific for best results</span>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: formData.feedback.length > 900 ? '#EF4444' : '#94A3B8' }}>
                  {formData.feedback.length}/1000
                </span>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Attach Evidence <span style={{ fontSize: '10px', fontWeight: 500, color: '#94A3B8', textTransform: 'none' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input type="file" id="evidence-upload" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                <label
                  htmlFor="evidence-upload"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '16px', borderRadius: '12px',
                    border: `2px dashed ${evidenceFile ? '#2563EB' : '#E2E8F0'}`,
                    background: evidenceFile ? '#EFF6FF' : '#F8FAFC',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!evidenceFile) { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.background = '#F0F7FF'; } }}
                  onMouseLeave={(e) => { if (!evidenceFile) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; } }}
                >
                  <Paperclip size={15} color={evidenceFile ? '#2563EB' : '#94A3B8'} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: evidenceFile ? '#2563EB' : '#94A3B8' }}>
                    {evidenceFile ? evidenceFile.name : 'Upload PDF or Image (Max 5MB)'}
                  </span>
                </label>
                {evidenceFile && (
                  <button
                    type="button" onClick={() => setEvidenceFile(null)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      width: '24px', height: '24px', borderRadius: '50%', background: '#FFFFFF',
                      boxShadow: '0 1px 4px rgba(15,23,42,0.12)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#94A3B8', transition: 'color 0.14s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={isDisabled}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '13px', borderRadius: '13px', border: 'none', fontFamily: font,
                background: isDisabled ? '#93C5FD' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF', fontSize: '14px', fontWeight: 800, letterSpacing: '-0.01em',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                boxShadow: isDisabled ? 'none' : '0 4px 14px rgba(37,99,235,0.24)',
                transition: 'all 0.16s ease',
              }}
              onMouseEnter={(e) => { if (!isDisabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.32)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDisabled ? 'none' : '0 4px 14px rgba(37,99,235,0.24)'; }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#FFFFFF', animation: 'spin 0.8s linear infinite' }} />
                  Submitting…
                </>
              ) : (
                <><Send size={15} /> Submit Feedback</>
              )}
            </button>
          </form>
        </div>

        {/* Emergency contact */}
        <div style={{
          marginTop: '16px',
          display: 'flex', alignItems: 'flex-start', gap: '14px',
          background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: '16px', padding: '18px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: '#FEF3C7', border: '1px solid #FDE68A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={16} color="#D97706" />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: '0 0 5px', letterSpacing: '-0.01em' }}>
              Need immediate help?
            </p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px', lineHeight: '1.5' }}>
              For urgent matters, contact staff directly:
            </p>
            <a
              href="tel:+256793702186"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '9px', textDecoration: 'none',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#FFFFFF', fontSize: '12.5px', fontWeight: 700,
                boxShadow: '0 3px 8px rgba(37,99,235,0.22)', transition: 'all 0.16s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 12px rgba(37,99,235,0.30)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 3px 8px rgba(37,99,235,0.22)'; }}
            >
              <Phone size={12} /> +256 793 702 186
            </a>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* ── Clari spinning logo — fixed bottom-left ───────────────────────── */}
      <ClariCoin size={48} />{/* ── Clari spinning logo — fixed bottom-left ───────────────────────── */}
    </div>
  );
};

export default SubmitFeedback;