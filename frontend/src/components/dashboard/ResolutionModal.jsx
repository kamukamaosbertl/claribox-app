import { useState } from 'react';
import { X, CheckCircle, Send } from 'lucide-react';
import { adminAPI } from '../../services/api';

const CATEGORIES = [
  'General', 'Infrastructure', 'Academics',
  'Services', 'Facilities', 'Technology', 'Other'
];

const EMPTY_FORM = { title: '', description: '', category: 'General' };

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1px solid ${hasError ? '#fca5a5' : '#e0e0f0'}`,
  fontSize: '13px',
  color: '#1e1b4b',
  background: hasError ? '#fff5f5' : '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
});

const ResolutionModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!formData.title.trim())         e.title = 'Title is required';
    if (formData.title.length > 100)    e.title = 'Max 100 characters';
    if (!formData.description.trim())   e.description = 'Description is required';
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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(3px)'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative',
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: '100%', maxWidth: '480px',
        margin: '0 16px',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'modalIn 0.2s ease'
      }}>

        {/* Header - green gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative circle */}
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '11px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                Add Resolution
              </h2>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                Document how you resolved the issue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px',
              borderRadius: '9px',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Title */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>
              Resolution Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Fixed WiFi issues in Library"
              style={inputStyle(!!errors.title)}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = errors.title ? '#fca5a5' : '#e0e0f0'}
            />
            {errors.title && (
              <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>{errors.title}</p>
            )}
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0', textAlign: 'right' }}>
              {formData.title.length}/100
            </p>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what was done to resolve this issue and how it addresses student feedback..."
              rows={4}
              style={{ ...inputStyle(!!errors.description), resize: 'none', lineHeight: '1.55' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = errors.description ? '#fca5a5' : '#e0e0f0'}
            />
            {errors.description && (
              <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>{errors.description}</p>
            )}
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0', textAlign: 'right' }}>
              {formData.description.length}/500
            </p>
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              style={inputStyle(false)}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e0e0f0'}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #f0f0f5', marginTop: '4px' }} />

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading || isFormEmpty}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '11px',
                borderRadius: '11px',
                border: 'none',
                background: loading || isFormEmpty
                  ? '#a5b4fc'
                  : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#fff',
                fontSize: '13px', fontWeight: 700,
                cursor: loading || isFormEmpty ? 'not-allowed' : 'pointer',
                boxShadow: loading || isFormEmpty ? 'none' : '0 2px 10px rgba(99,102,241,0.35)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '13px', height: '13px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Saving...
                </>
              ) : (
                <><Send size={13} /> Publish Resolution</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '11px 20px',
                borderRadius: '11px',
                border: '1px solid #e0e0f0',
                background: '#fff',
                color: '#6b7280',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8f8fc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ResolutionModal;