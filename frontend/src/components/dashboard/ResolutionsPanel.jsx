import { useState } from 'react';
import { CheckCircle, Plus, X, Send, Clock, Sparkles } from 'lucide-react';
import { adminAPI } from '../../services/api';

const STATUS_STYLES = {
  'Completed':   { badge: 'bg-green-50 text-green-700',  dot: 'bg-green-500'  },
  'In Progress': { badge: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-500'  },
  'Planned':     { badge: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
};

const EMPTY_FORM = { title: '', description: '', category: 'General', status: 'Completed' };

const ResolutionsPanel = ({ resolutions = [], onRefresh }) => {
  const [isOpen,     setIsOpen]     = useState(false);
  const [isAdding,   setIsAdding]   = useState(false);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange  = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCancel  = () => { setIsAdding(false); setFormData(EMPTY_FORM); };

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

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4 flex items-center justify-between">
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none mb-0.5">Resolved Issues</h2>
            <p className="text-xs text-white/70">
              {resolutions.length} resolution{resolutions.length !== 1 ? 's' : ''} documented
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full transition-colors border-none cursor-pointer"
        >
          {isOpen ? 'Hide' : 'View All'}
        </button>
      </div>

      {/* Add button */}
      {!isAdding && (
        <div className="px-5 py-4">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-indigo-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 text-indigo-500 hover:text-indigo-600 text-sm font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Resolution
          </button>
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">

          {/* Form header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">New Resolution</h3>
            </div>
            <button
              onClick={handleCancel}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Resolution Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Fixed WiFi issues in Library"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what was resolved and how it addresses student feedback..."
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                >
                  {['General','Infrastructure','Academics','Services','Facilities','Technology','Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all
                  ${submitting
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-200 cursor-pointer'
                  }`}
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Save Resolution</>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resolutions list */}
      {isOpen && (
        <div className="border-t border-slate-100">
          {resolutions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
              {resolutions.map((res, i) => {
                const s = STATUS_STYLES[res.status] || STATUS_STYLES['Planned'];
                return (
                  <div key={i} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-bold text-slate-800">{res.title}</h4>
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${s.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {res.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{res.description}</p>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {res.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">
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
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No resolutions yet</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Add resolutions to show students their feedback is being addressed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResolutionsPanel;