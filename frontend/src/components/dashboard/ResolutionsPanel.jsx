import { useState } from 'react';
import { CheckCircle, Plus, X, Send, Clock, Sparkles, Trash2 } from 'lucide-react';
import { adminAPI } from '../../services/api';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const STATUS_STYLES = {
  'Completed':   { stroke: '#22C55E', bg: 'rgba(34,197,94,0.08)',   text: '#15803D',  dot: '#22C55E' },
  'In Progress': { stroke: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  text: '#B45309',  dot: '#F59E0B' },
  'Planned':     { stroke: '#2563EB', bg: 'rgba(37,99,235,0.08)',   text: '#1D4ED8',  dot: '#2563EB' },
};

const EMPTY_FORM = { title: '', description: '', category: 'General', status: 'Completed' };
const CATEGORIES = ['General','Academic','Library','IT','Facilities','Canteen','Transport','Hostel','Other'];

// ── Shared input style ────────────────────────────────────────────────────
const inputStyle = (hasError) => ({
  width: '100%', boxSizing: 'border-box',
  padding: '9px 13px',
  borderRadius: '11px',
  border: `1px solid ${hasError ? '#FECACA' : '#E2E8F0'}`,
  background: hasError ? '#FEF2F2' : '#FFFFFF',
  fontSize: '13px', color: '#0F172A', fontFamily: font,
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
});

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: '#475569', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: font,
};

const ResolutionsPanel = ({ resolutions = [], onRefresh }) => {
  const [isOpen,     setIsOpen]     = useState(false);
  const [isAdding,   setIsAdding]   = useState(false);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resolution? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await adminAPI.deleteResolution(id);
      onRefresh();
    } catch {
      alert('Failed to delete resolution. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ fontFamily: font }}>

      {/* ── Add button ──────────────────────────────────────────── */}
      {!isAdding && (
        <div style={{ marginBottom: isOpen ? '16px' : '0' }}>
          <button
            onClick={() => setIsAdding(true)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px',
              borderRadius: '13px',
              border: '1.5px dashed #BFDBFE',
              background: '#F8FBFF',
              fontSize: '13px', fontWeight: 700,
              color: '#2563EB', cursor: 'pointer', fontFamily: font,
              transition: 'all 0.16s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EFF6FF';
              e.currentTarget.style.borderColor = '#93C5FD';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8FBFF';
              e.currentTarget.style.borderColor = '#BFDBFE';
            }}
          >
            <Plus size={15} />
            Add New Resolution
          </button>
        </div>
      )}

      {/* ── Add form ────────────────────────────────────────────── */}
      {isAdding && (
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '18px 20px',
          marginBottom: '16px',
        }}>
          {/* Form header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '1px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={13} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                New Resolution
              </h3>
            </div>
            <button
              onClick={handleCancel}
              style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#94A3B8',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <X size={13} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Resolution Title</label>
              <input
                type="text" name="title"
                value={formData.title} onChange={handleChange}
                placeholder="e.g., Fixed WiFi issues in Library"
                required style={inputStyle(false)}
                onFocus={(e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description} onChange={handleChange}
                placeholder="Describe what was resolved and how it addresses student feedback..."
                rows={3} required
                style={{ ...inputStyle(false), resize: 'none', lineHeight: '1.55' }}
                onFocus={(e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Category + Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select name="category" value={formData.category} onChange={handleChange}
                  style={inputStyle(false)}
                  onFocus={(e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                  onBlur={(e)  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}
                  style={inputStyle(false)}
                  onFocus={(e) => { e.target.style.borderColor = '#93C5FD'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                  onBlur={(e)  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#E2E8F0', margin: '2px 0' }} />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit" disabled={submitting}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  padding: '10px',
                  borderRadius: '11px',
                  border: 'none',
                  background: submitting
                    ? '#93C5FD'
                    : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF', fontSize: '13px', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: font,
                  boxShadow: submitting ? 'none' : '0 4px 12px rgba(37,99,235,0.22)',
                  transition: 'all 0.16s ease',
                }}
                onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.30)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = submitting ? 'none' : '0 4px 12px rgba(37,99,235,0.22)'; }}
              >
                {submitting ? (
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
                  <><Send size={13} /> Save Resolution</>
                )}
              </button>

              <button
                type="button" onClick={handleCancel}
                style={{
                  padding: '10px 18px',
                  borderRadius: '11px',
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
      )}

      {/* ── View All toggle ──────────────────────────────────────── */}
      {!isAdding && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '11px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF', cursor: 'pointer', fontFamily: font,
            transition: 'all 0.15s ease',
            marginBottom: isOpen ? '12px' : '0',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
            {resolutions.length} resolution{resolutions.length !== 1 ? 's' : ''} documented
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#2563EB',
            background: '#EFF6FF', border: '1px solid #DBEAFE',
            borderRadius: '20px', padding: '3px 10px',
          }}>
            {isOpen ? 'Hide' : 'View All'}
          </span>
        </button>
      )}

      {/* ── Resolutions list ─────────────────────────────────────── */}
      {isOpen && (
        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {resolutions.length > 0 ? resolutions.map((res, i) => {
            const s          = STATUS_STYLES[res.status] || STATUS_STYLES['Planned'];
            const isDeleting = deletingId === res._id;
            const isDone     = res.status === 'Completed';

            return (
              <div
                key={i}
                style={{
                  background: '#FAFBFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '13px',
                  padding: '14px 16px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#DBEAFE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '7px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0, flex: 1, lineHeight: '1.3' }}>
                    {res.title}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
                    {/* Status pill */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: s.bg, border: `1px solid ${s.stroke}30`,
                      borderRadius: '20px', padding: '3px 9px',
                      fontSize: '10.5px', fontWeight: 700, color: s.text,
                      whiteSpace: 'nowrap',
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot }} />
                      {res.status}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(res._id)}
                      disabled={isDeleting}
                      title="Delete resolution"
                      style={{
                        width: '26px', height: '26px', borderRadius: '7px',
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        color: '#EF4444', opacity: isDeleting ? 0.4 : 1,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => { if (!isDeleting) { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
                    >
                      {isDeleting
                        ? <div style={{ width: '11px', height: '11px', borderRadius: '50%', border: '2px solid rgba(239,68,68,0.3)', borderTopColor: '#EF4444', animation: 'spin 0.8s linear infinite' }} />
                        : <Trash2 size={11} />
                      }
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 10px', lineHeight: '1.55' }}>
                  {res.description}
                </p>

                {/* Meta footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: '#2563EB',
                    background: '#EFF6FF', border: '1px solid #DBEAFE',
                    borderRadius: '20px', padding: '2px 9px',
                  }}>
                    {res.category}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} color="#CBD5E1" />
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {res.createdAt
                        ? new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : 'Recently'}
                    </span>
                  </div>

                  {isDone && (
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: '#15803D',
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: '20px', padding: '2px 9px',
                    }}>
                      ✅ May reduce {res.category} complaints
                    </span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '40px 24px', textAlign: 'center',
              background: '#FAFBFC', borderRadius: '13px', border: '1px solid #E2E8F0',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', marginBottom: '12px',
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                border: '1px solid #BBF7D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(34,197,94,0.12)',
              }}>
                <CheckCircle size={20} color="#22C55E" />
              </div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>
                No resolutions yet
              </p>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, maxWidth: '200px', lineHeight: '1.5' }}>
                Add resolutions to show students their feedback is being addressed.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ResolutionsPanel;