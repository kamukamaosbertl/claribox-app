import { useState } from 'react';
import { X, CheckCircle, Send, Loader2 } from 'lucide-react';
import { adminAPI } from '../../services/api';

const ResolutionModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null; // 🔹 Modal only renders if open

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'General',
    'Infrastructure',
    'Academics',
    'Services',
    'Facilities',
    'Technology',
    'Other'
  ];

  // 🔹 Simple validation
  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length > 100) newErrors.title = 'Title cannot exceed 100 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length > 500) newErrors.description = 'Description cannot exceed 500 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await adminAPI.createResolution(formData);
      setFormData({ title: '', description: '', category: 'General' });
      setErrors({});
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating resolution:', error);
      alert('Failed to create resolution');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Disable button if fields are empty
  const isFormEmpty = !formData.title.trim() && !formData.description.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Resolution</h2>
              <p className="text-sm text-gray-500">Document how you resolved the issue</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Resolution Title"
              className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what was done to resolve this issue..."
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || isFormEmpty}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors
                ${isFormEmpty ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}
                ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Resolution</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolutionModal;