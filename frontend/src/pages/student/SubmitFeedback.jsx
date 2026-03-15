import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Phone, ArrowLeft, Paperclip, X, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';

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

const SubmitFeedback = () => {
  const [formData,      setFormData]      = useState({ category: '', feedback: '' });
  const [evidenceFile,  setEvidenceFile]  = useState(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [isSuccess,     setIsSuccess]     = useState(false);
  const [error,         setError]         = useState('');

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

  const handleReset = () => {
    setIsSuccess(false);
    setFormData({ category: '', feedback: '' });
    setEvidenceFile(null);
  };

  const isDisabled = isSubmitting || !formData.category || !formData.feedback;

  /* ── SUCCESS SCREEN ── */
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden text-center">

          {/* Green header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-500 px-8 py-10">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-white" />
            </div>
          </div>

          <div className="px-8 py-8">
            <h2 className="text-xl font-extrabold text-indigo-950 mb-2">Feedback Submitted! 🎉</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Thank you for speaking up. Your feedback has been submitted completely anonymously and will be reviewed by administrators.
            </p>

            {/* What happens next */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">What happens next</p>
              <div className="space-y-2">
                {nextSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-extrabold text-indigo-600">{i + 1}</span>
                    </div>
                    <span className="text-xs text-slate-500">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/25 hover:-translate-y-0.5 transition-all cursor-pointer border-none"
              >
                <Send className="w-4 h-4" /> Submit Another
              </button>
              <Link
                to="/"
                className="block py-3 rounded-xl border border-slate-200 bg-white text-slate-500 text-sm font-semibold no-underline hover:bg-slate-50 transition-colors"
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
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-xl mx-auto">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors no-underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Title */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 px-4 py-1.5 rounded-full mb-3">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600">Anonymous Submission</span>
          </div>
          <h1 className="text-2xl font-extrabold text-indigo-950 tracking-tight mb-1.5">
            Submit Your Feedback
          </h1>
          <p className="text-sm text-slate-400">Your feedback is completely anonymous — no personal data collected.</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Indigo top bar */}
          <div className="flex items-center gap-2.5 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs font-semibold text-white">
              Your identity is protected — no personal information is ever collected
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-7 py-7 flex flex-col gap-5">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.feedback}
                onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                required
                rows={6}
                placeholder="Share your thoughts, concerns, or suggestions here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none leading-relaxed"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-slate-400">Be specific for best results</span>
                <span className={`text-xs font-semibold ${formData.feedback.length > 900 ? 'text-red-500' : 'text-slate-400'}`}>
                  {formData.feedback.length}/1000
                </span>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Attach Evidence{' '}
                <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="evidence-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="evidence-upload"
                  className={`flex items-center justify-center gap-2.5 py-4 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${evidenceFile
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                >
                  <Paperclip className={`w-4 h-4 ${evidenceFile ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${evidenceFile ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {evidenceFile ? evidenceFile.name : 'Upload PDF or Image (Max 5MB)'}
                  </span>
                </label>
                {evidenceFile && (
                  <button
                    type="button"
                    onClick={() => setEvidenceFile(null)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors border-none cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isDisabled}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all border-none
                ${isDisabled
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer'
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <><Send className="w-4 h-4" /> Submit Feedback</>
              )}
            </button>

          </form>
        </div>

        {/* Emergency contact */}
        <div className="mt-4 flex items-start gap-3 bg-white border border-amber-200 rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-950 mb-1">Need immediate help?</p>
            <p className="text-xs text-slate-400 mb-3">For urgent matters, contact staff directly:</p>
            <a
              href="tel:+256793702186"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-bold no-underline shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 transition-all"
            >
              <Phone className="w-3 h-3" /> +256 793 702 186
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubmitFeedback;