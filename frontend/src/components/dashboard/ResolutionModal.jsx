import { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle, Send, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';

const getFeedbackCategory = (feedback) => {
  return (
    feedback?.topicLabel ||
    feedback?.topicShortLabel ||
    feedback?.category ||
    'General'
  );
};

const getInitialForm = (feedback) => ({
  title: '',
  description: '',
  category: getFeedbackCategory(feedback),
});

const ResolutionModal = ({
  isOpen,
  onClose,
  onSuccess,
  feedback,
  categories = [],
}) => {
  const [formData, setFormData] = useState(() => getInitialForm(feedback));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set([
        getFeedbackCategory(feedback),
        ...categories,
        'General',
      ].filter(Boolean))
    );
  }, [feedback, categories]);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialForm(feedback));
      setErrors({});
      setSubmitError('');
    }
  }, [isOpen, feedback]);

  if (!isOpen) return null;

  const validate = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      nextErrors.title = 'Max 100 characters';
    }

    if (!formData.description.trim()) {
      nextErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      nextErrors.description = 'Max 500 characters';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: '',
    }));

    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setSubmitError('');

    try {
      await adminAPI.createResolution({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        affectedFeedbackIds: feedback?._id ? [feedback._id] : [],
      });

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error creating resolution:', error);
      setSubmitError('Failed to create resolution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading ||
    !formData.title.trim() ||
    !formData.description.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 font-sans">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-[24px] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.20)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-600 to-emerald-700 px-6 py-5 text-white">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                <CheckCircle size={20} />
              </div>

              <div>
                <h2 className="text-base font-black tracking-[-0.03em]">
                  Add Resolution
                </h2>
                <p className="mt-1 text-xs text-white/70">
                  Document how this feedback issue was handled.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close resolution modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {feedback && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                Resolving feedback
              </p>

              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-700">
                {feedback.feedback || feedback.text || 'Selected feedback item'}
              </p>
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">
              Resolution Title
            </label>

            <input
              type="text"
              value={formData.title}
              onChange={(event) => handleChange('title', event.target.value)}
              placeholder="e.g., Fixed WiFi issues in the library"
              maxLength={100}
              disabled={loading}
              className={`
                w-full rounded-2xl border px-4 py-3 text-sm text-slate-950 outline-none transition
                focus:border-blue-300 focus:ring-4 focus:ring-blue-100
                disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
                ${
                  errors.title
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white'
                }
              `}
            />

            <div className="mt-1 flex justify-between gap-3 text-xs">
              <span className="font-semibold text-red-500">
                {errors.title || ''}
              </span>
              <span className="text-slate-400">
                {formData.title.length}/100
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">
              Description
            </label>

            <textarea
              value={formData.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Describe what was done to resolve this issue..."
              rows={4}
              maxLength={500}
              disabled={loading}
              className={`
                w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-relaxed text-slate-950 outline-none transition
                focus:border-blue-300 focus:ring-4 focus:ring-blue-100
                disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
                ${
                  errors.description
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white'
                }
              `}
            />

            <div className="mt-1 flex justify-between gap-3 text-xs">
              <span className="font-semibold text-red-500">
                {errors.description || ''}
              </span>
              <span className="text-slate-400">
                {formData.description.length}/500
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">
              Category
            </label>

            <select
              value={formData.category}
              onChange={(event) => handleChange('category', event.target.value)}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-400">
              Category is pulled from the selected feedback when available.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isDisabled}
                className={`
                  flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white transition
                  ${
                    isDisabled
                      ? 'cursor-not-allowed bg-blue-300'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-[0_10px_24px_rgba(37,99,235,0.28)]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Publish Resolution
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolutionModal;