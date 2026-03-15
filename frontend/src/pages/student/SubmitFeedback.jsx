import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Phone, ArrowLeft, Paperclip, X, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';

const categories = [
  { value: 'academic',   label: 'Academic & Teaching',       emoji: '📚' },
  { value: 'library',    label: 'Library Services',           emoji: '📖' },
  { value: 'it',         label: 'IT & WiFi',                  emoji: '💻' },
  { value: 'facilities', label: 'Campus Facilities',          emoji: '🏫' },
  { value: 'canteen',    label: 'Food & Canteen',             emoji: '🍽️' },
  { value: 'transport',  label: 'Transport & Parking',        emoji: '🚌' },
  { value: 'hostel',     label: 'Hostel & Accommodation',     emoji: '🏠' },
  { value: 'admin',      label: 'Administrative Services',    emoji: '📋' },
  { value: 'other',      label: 'Other',                      emoji: '💬' },
];

const inputStyle = (focused) => ({
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: `1.5px solid ${focused ? '#6366f1' : '#e0e0f0'}`,
  fontSize: '14px',
  color: '#1e1b4b',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
});

const SubmitFeedback = () => {
  const [formData, setFormData]       = useState({ category: '', feedback: '' });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);
  const [error, setError]             = useState('');
  const [focusedField, setFocusedField] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }
    setEvidenceFile(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('feedback', formData.feedback);
      if (evidenceFile) data.append('evidenceFile', evidenceFile);
      await studentAPI.submitFeedback(data);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── SUCCESS SCREEN ── */
  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '440px', width: '100%',
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          textAlign: 'center'
        }}>
          {/* Green gradient top */}
          <div style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            padding: '40px 32px 32px',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: '-30px', right: '-30px',
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
            }} />
            <div style={{
              width: '70px', height: '70px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto'
            }}>
              <CheckCircle size={36} color="#fff" />
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 10px' }}>
              Feedback Submitted! 🎉
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.7, margin: '0 0 28px' }}>
              Thank you for speaking up. Your feedback has been submitted completely anonymously and will be reviewed by administrators.
            </p>

            {/* What happens next */}
            <div style={{
              background: '#f8f8fc',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                What happens next
              </p>
              {[
                'Your feedback is reviewed by administrators',
                'Action is taken on valid concerns',
                'Resolutions are published on the platform',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < 2 ? '8px' : 0 }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#eef2ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#6366f1' }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{step}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setFormData({ category: '', feedback: '' });
                  setEvidenceFile(null);
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '13px',
                  borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#fff', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(99,102,241,0.3)'
                }}
              >
                <Send size={15} /> Submit Another
              </button>
              <Link
                to="/"
                style={{
                  display: 'block', padding: '13px',
                  borderRadius: '12px',
                  border: '1px solid #e0e0f0',
                  background: '#fff', color: '#6b7280',
                  fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none', textAlign: 'center'
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── FORM ── */
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', padding: '40px 24px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Back link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', fontWeight: 600, color: '#6b7280',
            textDecoration: 'none', marginBottom: '24px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Page title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#eef2ff', padding: '5px 14px',
            borderRadius: '20px', marginBottom: '12px'
          }}>
            <Sparkles size={12} color="#6366f1" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
              Anonymous Submission
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1e1b4b', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Submit Your Feedback
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Your feedback is completely anonymous — no personal data collected.
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>

          {/* Indigo top bar */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={13} color="#fff" />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
              Your identity is protected — no personal information is ever collected
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px',
                background: '#fff1f2', border: '1px solid #fecdd3',
                borderRadius: '10px'
              }}>
                <AlertCircle size={15} color="#ef4444" />
                <span style={{ fontSize: '13px', color: '#be123c' }}>{error}</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Category <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                required
                style={inputStyle(focusedField === 'category')}
                onFocus={() => setFocusedField('category')}
                onBlur={() => setFocusedField('')}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Feedback textarea */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Your Feedback <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={formData.feedback}
                onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                required
                rows={6}
                placeholder="Share your thoughts, concerns, or suggestions here..."
                style={{ ...inputStyle(focusedField === 'feedback'), resize: 'none', lineHeight: '1.6' }}
                onFocus={() => setFocusedField('feedback')}
                onBlur={() => setFocusedField('')}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Be specific for best results</span>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: formData.feedback.length > 900 ? '#ef4444' : '#9ca3af'
                }}>
                  {formData.feedback.length}/1000
                </span>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Attach Evidence <span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  id="evidence-upload"
                  style={{ display: 'none' }}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="evidence-upload"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `2px dashed ${evidenceFile ? '#6366f1' : '#e0e0f0'}`,
                    background: evidenceFile ? '#eef2ff' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Paperclip size={16} color={evidenceFile ? '#6366f1' : '#9ca3af'} />
                  <span style={{
                    fontSize: '13px', fontWeight: 500,
                    color: evidenceFile ? '#4f46e5' : '#9ca3af'
                  }}>
                    {evidenceFile ? evidenceFile.name : 'Upload PDF or Image (Max 5MB)'}
                  </span>
                </label>
                {evidenceFile && (
                  <button
                    type="button"
                    onClick={() => setEvidenceFile(null)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      width: '24px', height: '24px',
                      borderRadius: '50%',
                      border: 'none', background: '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#9ca3af'
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.category || !formData.feedback}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px',
                borderRadius: '12px', border: 'none',
                background: isSubmitting || !formData.category || !formData.feedback
                  ? '#a5b4fc'
                  : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#fff', fontSize: '15px', fontWeight: 700,
                cursor: isSubmitting || !formData.category || !formData.feedback
                  ? 'not-allowed' : 'pointer',
                boxShadow: isSubmitting || !formData.category || !formData.feedback
                  ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Submitting...
                </>
              ) : (
                <><Send size={16} /> Submit Feedback</>
              )}
            </button>

          </form>
        </div>

        {/* Emergency contact */}
        <div style={{
          marginTop: '16px',
          background: '#fff',
          border: '1px solid #fde68a',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex', alignItems: 'flex-start', gap: '12px'
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: '#fef3c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertCircle size={16} color="#d97706" />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e1b4b', margin: '0 0 4px' }}>
              Need immediate help?
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 10px' }}>
              For urgent matters, contact staff directly:
            </p>
            <a
              href="tel:+256793702186"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#fff', fontSize: '12px', fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <Phone size={12} /> +256 793 702 186
            </a>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubmitFeedback;