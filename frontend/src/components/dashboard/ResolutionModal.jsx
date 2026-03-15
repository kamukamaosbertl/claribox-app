import { useState } from 'react';
import { X, CheckCircle, Send } from 'lucide-react';
import { adminAPI } from '../../services/api';

const CATEGORIES = [
  'General', 'Infrastructure', 'Academics',
  'Services', 'Facilities', 'Technology', 'Other'
];

const EMPTY_FORM = { title: '', description: '', category: 'General' };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-modal">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-t-2xl px-6 py-5 flex items-center justify-between">
          {/* Decorative circle */}
          <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none mb-0.5">Add Resolution</h2>
              <p className="text-xs text-white/70">Document how you resolved the issue</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors border-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Resolution Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Fixed WiFi issues in Library"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                ${errors.title
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 bg-white'
                }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-400 mt-1 text-right">{formData.title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what was done to resolve this issue..."
              rows={4}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors resize-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                ${errors.description
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 bg-white'
                }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length}/500</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Category
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <hr className="border-slate-100" />

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || isFormEmpty}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all
                ${loading || isFormEmpty
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 cursor-pointer'
                }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <><Send className="w-3.5 h-3.5" /> Publish Resolution</>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-gray-600 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>

      <style>{`
        .animate-modal {
          animation: modalIn 0.2s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ResolutionModal;