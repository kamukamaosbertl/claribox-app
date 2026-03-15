import { useState } from 'react';
import { CheckCircle, Plus, X, Send, Clock, Sparkles } from 'lucide-react';
import { adminAPI } from '../../services/api';

const STATUS_STYLES = {
  'Completed':   { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  'In Progress': { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  'Planned':     { bg: '#eef2ff', text: '#4338ca', dot: '#6366f1' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'General',
  status: 'Completed'
};

const ResolutionsPanel = ({ resolutions = [], onRefresh }) => {
  const [isOpen, setIsOpen]     = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCancel = () => { setIsAdding(false); setFormData(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminAPI.createResolution(formData);
      setFormData(EMPTY_FORM);
      setIsAdding(false);
      onRefresh();
    } catch (error) {
      console.error('Error adding resolution:', error);
      alert('Failed to add resolution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 14px',
    borderRadius: '10px',
    border: '1px solid #e0e0f0',
    fontSize: '13px',
    color: '#1e1b4b',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#4b5563',
    marginBottom: '6px',
    display: 'block'
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #f0f0f5',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden'
    }}>

      {/* Header - green gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-15px', right: '-15px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle size={15} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Resolved Issues
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              {resolutions.length} resolution{resolutions.length !== 1 ? 's' : ''} documented
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            fontSize: '12px', fontWeight: 600,
            background: 'rgba(255,255,255,0.2)',
            color: '#fff', border: 'none',
            padding: '5px 14px', borderRadius: '20px',
            cursor: 'pointer', position: 'relative'
          }}
        >
          {isOpen ? 'Hide' : 'View All'}
        </button>
      </div>

      {/* Add button */}
      {!isAdding && (
        <div style={{ padding: '16px 22px' }}>
          <button
            onClick={() => setIsAdding(true)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px',
              borderRadius: '12px',
              border: '2px dashed #c7d2fe',
              background: '#fafafa',
              color: '#6366f1',
              fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#eef2ff';
              e.currentTarget.style.borderColor = '#6366f1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fafafa';
              e.currentTarget.style.borderColor = '#c7d2fe';
            }}
          >
            <Plus size={15} />
            Add New Resolution
          </button>
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <div style={{
          padding: '20px 22px',
          background: '#fafbff',
          borderTop: '1px solid #f0f0f5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} color="#6366f1" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
                New Resolution
              </h3>
            </div>
            <button
              onClick={handleCancel}
              style={{
                width: '26px', height: '26px',
                borderRadius: '8px',
                border: '1px solid #e0e0f0',
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#9ca3af'
              }}
            >
              <X size={13} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div>
              <label style={labelStyle}>Resolution Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Fixed WiFi issues in Library"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e0e0f0'}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what was resolved and how it addresses student feedback..."
                rows={3}
                required
                style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e0e0f0'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="General">General</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Academics">Academics</option>
                  <option value="Services">Services</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: submitting
                    ? '#a5b4fc'
                    : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#fff',
                  fontSize: '13px', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s'
                }}
              >
                {submitting ? (
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
                  <><Send size={13} /> Save Resolution</>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #e0e0f0',
                  background: '#fff',
                  color: '#6b7280',
                  fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resolutions list */}
      {isOpen && (
        <div style={{ borderTop: '1px solid #f0f0f5' }}>
          {resolutions.length > 0 ? (
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {resolutions.map((res, i) => {
                const s = STATUS_STYLES[res.status] || STATUS_STYLES['Planned'];
                return (
                  <div
                    key={i}
                    style={{
                      padding: '16px 22px',
                      borderBottom: i < resolutions.length - 1 ? '1px solid #f8f8fc' : 'none',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px', gap: '10px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
                        {res.title}
                      </h4>
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        background: s.bg, color: s.text,
                        padding: '3px 9px', borderRadius: '20px',
                        whiteSpace: 'nowrap', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot }} />
                        {res.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.55' }}>
                      {res.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600,
                        background: '#eef2ff', color: '#4338ca',
                        padding: '2px 9px', borderRadius: '20px'
                      }}>
                        {res.category}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} color="#9ca3af" />
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {res.createdAt
                            ? new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                            : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '40px 24px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CheckCircle size={22} color="#22c55e" />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>
                No resolutions yet
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                Add resolutions to show students their feedback is being addressed.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ResolutionsPanel;