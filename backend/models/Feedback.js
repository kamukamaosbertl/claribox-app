const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({

  // Unique anonymous identifier for each submission e.g. FB-A1B2C3D4E
  anonymous_id: {
    type:    String,
    default: () => 'FB-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  },

  // Which area the feedback is about
  category: {
    type:     String,
    required: true,
    enum:     ['academic', 'library', 'it', 'facilities', 'canteen', 'transport', 'hostel', 'admin', 'other']
  },

  // The actual feedback text from the student
  feedback: {
    type:      String,
    required:  true,
    maxlength: 1000
  },

  // Evidence file attached by student (stored in Cloudinary)
  evidenceFile: {
    url:      { type: String, default: null },
    fileName: { type: String, default: null },
    fileType: { type: String, default: null }
  },

  // Text extracted from the evidence file via OCR (PDF or image)
  evidenceText: {
    type:    String,
    default: null
  },

  // Sentiment detected by Python script
  sentiment: {
    type:    String,
    enum:    ['positive', 'neutral', 'negative'],
    default: null  // null until background processing completes
  },
  sentimentScore: {
    type:    Number,
    default: null
  },

  // AI generated summary — created on demand by admin
  summary: {
    type:    String,
    default: null
  },

  // Embedding vector for MongoDB vector search (384 dimensions)
  embedding: {
    type:    [Number],
    default: []
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

}, {
  toJSON:   { virtuals: true },
  toObject: { virtuals: true }
});

// Update updatedAt timestamp before every save
feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual — human readable time e.g. "2 hours ago"
feedbackSchema.virtual('date').get(function() {
  const now     = new Date();
  const diff    = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} min ago`;
  if (hours   < 24) return `${hours} hours ago`;
  if (days    <  7) return `${days} days ago`;
  return this.createdAt.toLocaleDateString();
});

module.exports = mongoose.model('Feedback', feedbackSchema);