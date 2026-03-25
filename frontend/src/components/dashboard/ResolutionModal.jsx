import { useState } from 'react';
import { X, CheckCircle, Send } from 'lucide-react';
import { adminAPI } from '../../services/api';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const CATEGORIES = [
  'General', 'Infrastructure', 'Academics',
  'Services', 'Facilities', 'Technology', 'Other',
];

const EMPTY_FORM = { title: '', description: '', category: 'General' };

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: '12px',
  fontSize: '13px', color: '#0F172A', fontFamily: font,
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: '#475569', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: font,
};

const ResolutionModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!formData.title.trim())            e.title = 'Title is required';
    if (formData.title.length > 100)       e.title = 'Max 100 characters';
    if (!formData.description.trim())      e.description = 'Description is required';
    if (formData.description.length > 500) e.description = 'Max 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await adminAPI.createResolution(formData);
      setFormData(EMPTY_FORM);
      setErrors({});
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating resolution:', err);
      alert('Failed to create resolution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormEmpty = !formData.title.trim() && !formData.description.trim();
  const isDisabled  = loading || isFormEmpty;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: font,
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,23,42,0.50)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal card */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: '480px',
        margin: '0 16px',
        background: '#FFFFFF',
        borderRadius: '22px',
        boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
        overflow: 'hidden',
        animation: 'modalIn 0.2s ease',
        maxHeight: '92vh', overflowY: 'auto',
      }}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #064E3B 0%, #059669 55%, #047857 100%)',
          padding: '20px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Blob */}
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
          }} />
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '11px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
            }}>
              <CheckCircle size={19} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                Add Resolution
              </h2>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)', margin: 0, fontWeight: 500 }}>
                Document how you resolved the issue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              position: 'relative',
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#FFFFFF',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Form ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Resolution Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Fixed WiFi issues in Library"
              style={{
                ...inputBase,
                border: `1px solid ${errors.title ? '#FECACA' : '#E2E8F0'}`,
                background: errors.title ? '#FEF2F2' : '#FFFFFF',
              }}
              onFocus={(e) => { if (!errors.title) { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; } }}
              onBlur={(e)  => { e.target.style.borderColor = errors.title ? '#FECACA' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              {errors.title
                ? <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>{errors.title}</span>
                : <span />
              }
              <span style={{ fontSize: '11px', color: '#CBD5E1', marginLeft: 'auto' }}>
                {formData.title.length}/100
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what was done to resolve this issue..."
              rows={4}
              style={{
                ...inputBase,
                border: `1px solid ${errors.description ? '#FECACA' : '#E2E8F0'}`,
                background: errors.description ? '#FEF2F2' : '#FFFFFF',
                resize: 'none', lineHeight: '1.55',
              }}
              onFocus={(e) => { if (!errors.description) { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; } }}
              onBlur={(e)  => { e.target.style.borderColor = errors.description ? '#FECACA' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              {errors.description
                ? <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>{errors.description}</span>
                : <span />
              }
              <span style={{ fontSize: '11px', color: '#CBD5E1', marginLeft: 'auto' }}>
                {formData.description.length}/500
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{ ...inputBase, border: '1px solid #E2E8F0', background: '#FFFFFF' }}
              onFocus={(e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#F1F5F9' }} />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={isDisabled}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '11px',
                borderRadius: '12px', border: 'none',
                background: isDisabled
                  ? '#93C5FD'
                  : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF', fontSize: '13px', fontWeight: 800,
                cursor: isDisabled ? 'not-allowed' : 'pointer', fontFamily: font,
                boxShadow: isDisabled ? 'none' : '0 4px 14px rgba(37,99,235,0.24)',
                letterSpacing: '-0.01em',
                transition: 'all 0.16s ease',
              }}
              onMouseEnter={(e) => { if (!isDisabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.30)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDisabled ? 'none' : '0 4px 14px rgba(37,99,235,0.24)'; }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '13px', height: '13px', borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#FFFFFF',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Saving…
                </>
              ) : (
                <><Send size={13} /> Publish Resolution</>
              )}
            </button>

            <button
              type="button" onClick={onClose}
              style={{
                padding: '11px 20px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF', color: '#475569',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: font,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ResolutionModal;