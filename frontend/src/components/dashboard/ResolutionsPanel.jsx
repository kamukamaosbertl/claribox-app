import { useState } from 'react';
import { CheckCircle, Plus, X, Send } from 'lucide-react';
import { adminAPI } from '../../services/api';

const ResolutionsPanel = ({ resolutions = [], onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    status: 'Completed'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await adminAPI.addResolution(formData);
      setFormData({
        title: '',
        description: '',
        category: 'General',
        status: 'Completed'
      });
      setIsAdding(false);
      onRefresh(); // Refresh parent data
    } catch (error) {
      console.error('Error adding resolution:', error);
      alert('Failed to add resolution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Resolved Issues</h2>
            <p className="text-sm text-gray-500">
              {resolutions.length} resolution{resolutions.length !== 1 ? 's' : ''} documented
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          {isOpen ? 'Hide' : 'View All'}
        </button>
      </div>

      {/* Add New Resolution Button */}
      {!isAdding && (
        <div className="p-6">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Resolution
          </button>
        </div>
      )}

      {/* Add Resolution Form */}
      {isAdding && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Add New Resolution</h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setFormData({
                  title: '',
                  description: '',
                  category: 'General',
                  status: 'Completed'
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Fixed WiFi issues in Library"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what was resolved and how it addresses student feedback..."
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Save Resolution
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setFormData({
                    title: '',
                    description: '',
                    category: 'General',
                    status: 'Completed'
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resolutions List */}
      {isOpen && (
        <div className="border-t border-gray-100">
          {resolutions.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {resolutions.map((resolution, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{resolution.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      resolution.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      resolution.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {resolution.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{resolution.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                      {resolution.category}
                    </span>
                    <span>
                      {resolution.createdAt ? new Date(resolution.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No resolutions documented yet</p>
              <p className="text-sm mt-1">Add resolutions to show students their feedback is being addressed</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResolutionsPanel;