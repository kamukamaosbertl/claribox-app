import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';

const SubmitFeedback = () => {
  const [formData, setFormData] = useState({ category: '', feedback: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'academic', label: 'Academic & Teaching' },
    { value: 'library', label: 'Library Services' },
    { value: 'it', label: 'IT & WiFi' },
    { value: 'facilities', label: 'Campus Facilities' },
    { value: 'canteen', label: 'Food & Canteen' },
    { value: 'transport', label: 'Transport & Parking' },
    { value: 'hostel', label: 'Hostel & Accommodation' },
    { value: 'admin', label: 'Administrative Services' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await studentAPI.submitFeedback(formData);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your feedback. Your suggestion has been submitted anonymously.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => { setIsSuccess(false); setFormData({ category: '', feedback: '' }); }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-2" />
                Submit Another
              </button>
              <Link to="/" className="block w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 text-center">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Feedback</h1>
          <p className="text-gray-600">Your feedback is completely anonymous.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          {/* Anonymous Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Your identity is protected</p>
              <p className="text-green-700 text-sm">No personal information is collected or stored.</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
              {error}
            </div>
          )}

          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Feedback Textarea */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Your Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              required
              rows={6}
              placeholder="Share your thoughts, concerns, or suggestions here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
            <p className="text-gray-500 text-sm mt-1">
              {formData.feedback.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.category || !formData.feedback}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Feedback
              </>
            )}
          </button>
        </form>

        {/* Emergency Contact */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Need immediate help?</p>
            <p className="text-red-700 text-sm mb-2">For urgent matters, contact staff directly:</p>
            <a href="tel:+256306099876" className="inline-flex items-center text-red-600 hover:text-red-700 font-medium">
              <Phone className="w-4 h-4 mr-1" />
              +256 793 702 186
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitFeedback;