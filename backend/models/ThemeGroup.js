const mongoose = require('mongoose');

const themeGroupSchema = new mongoose.Schema({
  // Clean dashboard label, e.g. "Wifi and Internet"
  label: {
    type: String,
    required: true,
    trim: true
  },

  // Short sample tags that best represent this group
  representativeTags: {
    type: [String],
    default: []
  },

  // All tags that have been merged into this group over time
  allTags: {
    type: [String],
    default: []
  },
// FAISS id for this theme/category vector.
// The actual embedding is stored in FAISS, not MongoDB.
  categoryFaissId: {
  type: Number,
  default: null
},

  // How many feedback items currently belong to this theme group
  feedbackCount: {
    type: Number,
    default: 0
  },

  // Track when this theme group was last matched
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Helpful for dashboard display and duplicate prevention
themeGroupSchema.index({ label: 1 });
themeGroupSchema.index({ lastUsedAt: -1 });

module.exports = mongoose.model('ThemeGroup', themeGroupSchema);