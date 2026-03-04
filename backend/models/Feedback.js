const mongoose = require('mongoose');

// Feedback Schema: Defines the structure for student feedback submissions
// Supports anonymous feedback with categories, analysis, and status tracking

const feedbackSchema = new mongoose.Schema({
  // Unique identifier for anonymous feedback submissions
  // Auto-generates a random ID in format "FB-XXXXXXXXX" if not provided
  anonymous_id: {
    type: String,
    default: () => 'FB-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  },

  // Category of feedback - helps with routing to appropriate departments
  category: {
    type: String,
    required: true,
    enum: ['academic', 'library', 'it', 'facilities', 'canteen', 'transport', 'hostel', 'admin', 'other']
  },

  // The actual feedback text content from the student
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // AI-generated analysis of the feedback for insights and categorization
  analysis: {
    sentiment: { type: String, default: 'neutral' },      // Emotion analysis: positive/negative/neutral
    urgency: { type: String, default: 'medium' },         // Priority level: low/medium/high
    topics: [String],                                      // Detected topics from the feedback
    keywords: [String],                                    // Key terms extracted
    pattern: { type: String, default: 'individual' },     // Pattern type (individual/complaint/praise)
    insights: { type: String, default: '' }                // AI-generated insights summary
  },

  // Current status of the feedback in the review pipeline
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'in-progress', 'resolved'],
    default: 'pending'
  },

  // Notes added by administrators during review
  admin_notes: { type: String, default: '' },

  // Timestamp fields for tracking creation and last modification
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware: Automatically updates the updatedAt timestamp
// Ensures accurate tracking of when feedback was last modified
feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual property: Returns a human-readable relative time string
// Formats the time since creation as "X min ago", "X hours ago", "X days ago", or date
feedbackSchema.virtual('date').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return this.createdAt.toLocaleDateString();
});

// Export the Feedback model for use in other parts of the application
module.exports = mongoose.model('Feedback', feedbackSchema);
