const mongoose = require('mongoose');

// ── Resolution Model ──────────────────────────────────────────────────────────
// Stores issues that have been resolved by the admin
// Shown on dashboard and in reports
const resolutionSchema = new mongoose.Schema({

  // Short title e.g. "Fixed WiFi in Library"
  title: {
    type:     String,
    required: true,
    trim:     true
  },

  // Full description of what was done to resolve the issue
  description: {
    type:     String,
    required: true
  },

  // Category matches feedback categories so trending issues can be linked
  category: {
    type:    String,
    enum:    [
      'General', 'Infrastructure', 'Academics', 'Services',
      'Facilities', 'Technology', 'Other',
      // Feedback categories — matched to resolution for trending impact
      'Academic', 'Library', 'IT', 'Canteen', 'Transport', 'Hostel', 'Admin'
    ],
    default: 'General'
  },

  // Status of the resolution — tracks progress
  status: {
    type:    String,
    enum:    ['Completed', 'In Progress', 'Planned'],
    default: 'Completed'
  },

  // Which feedback submissions this resolution addresses (optional)
  affectedFeedbackIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Feedback'
  }],

  // Admin who created this resolution
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Admin'
  },

  // Whether this resolution is published/active
  isPublished: {
    type:    Boolean,
    default: true
  }

}, { timestamps: true }); // adds createdAt and updatedAt automatically

module.exports = mongoose.model('Resolution', resolutionSchema);