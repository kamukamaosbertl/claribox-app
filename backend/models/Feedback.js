const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Unique identifier for anonymous feedback submissions
  anonymous_id: { 
    type: String, 
    default: () => 'FB-' + Math.random().toString(36).substr(2, 9).toUpperCase() 
  },
  
  // Category of feedback
  category: { 
    type: String, 
    required: true, 
    enum: ['academic', 'library', 'it', 'facilities', 'canteen', 'transport', 'hostel', 'admin', 'other'] 
  },
  
  // The actual feedback text (Matches your route logic)
  feedback: { 
    type: String, 
    required: true, 
    maxlength: 1000 
  },

  // 🔹 NEW: Evidence File Storage (Cloudinary info)
  evidenceFile: {
      url: { type: String, default: null },
      fileName: { type: String, default: null },
      fileType: { type: String, default: null }
  },

  // 🔹 NEW: Extracted Text from PDF
  evidenceText: { 
    type: String, 
    default: null 
  },

  // Sentiment fields
  sentiment: { 
    type: String, 
    enum: ['positive', 'neutral', 'negative'], 
    default: 'neutral' 
  },
  sentimentScore: { 
    type: Number, 
    default: 0 
  },

  // AI-generated analysis
  analysis: {
    sentiment: { type: String, default: 'neutral' },
    urgency: { type: String, default: 'medium' },
    topics: [String],
    keywords: [String],
    pattern: { type: String, default: 'individual' },
    insights: { type: String, default: '' }
  },

  // Management fields
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'in-progress', 'resolved'], 
    default: 'pending' 
  },
  admin_notes: { 
    type: String, 
    default: '' 
  },

  // 🔹 NEW: Embedding vector for AI vector search
  embedding: {
    type: [Number],             // Array of numbers (1536 floats)
    default: null,
    index: 'cosine'             // Enable cosine similarity index
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to update the updatedAt timestamp
feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual property for human-readable relative time
feedbackSchema.virtual('date').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 8400000);

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return this.createdAt.toLocaleDateString();
});

module.exports = mongoose.model('Feedback', feedbackSchema);