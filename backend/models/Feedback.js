const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({

  // ─────────────────────────────────────────────
  // UNIQUE IDENTIFIER (Anonymous tracking)
  // ─────────────────────────────────────────────
  // Example: FB-A1B2C3D4E
  anonymous_id: {
    type: String,
    default: () => 'FB-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  },

  // ─────────────────────────────────────────────
  // AI TAGGING & GROUPING
  // ─────────────────────────────────────────────

  // Dynamic tags extracted from feedback (e.g. ["wifi", "canteen"])
  tags: {
    type: [String],
    default: []
  },

  // Higher-level grouping label (e.g. "Internet Issues")
  topicLabel: {
    type: String,
    default: null
  },


  // Short display label for dashboard/UI
// Example: "Canteen Food"
  topicShortLabel: {
    type: String,
    default: null
  },

  // ─────────────────────────────────────────────
  // CORE FEEDBACK CONTENT (SOURCE OF TRUTH)
  // ─────────────────────────────────────────────

  // Main student feedback text
  feedback: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // ─────────────────────────────────────────────
  // EVIDENCE HANDLING
  // ─────────────────────────────────────────────

  // Stored file info (image or PDF)
  evidenceFile: {
    url:      { type: String, default: null },
    fileName: { type: String, default: null },
    fileType: { type: String, default: null }
  },

  // Extracted text from evidence (OCR or PDF parsing)
  // This is what will be used in RAG, NOT the raw file
  evidenceText: {
    type: String,
    default: null
  },

  // ─────────────────────────────────────────────
  // SENTIMENT & EMOTION ANALYSIS
  // ─────────────────────────────────────────────

  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: null
  },

  sentimentScore: {
    type: Number,
    default: null
  },

  emotion: {
    type: String,
    enum: ['joy', 'anger', 'sadness', 'fear', 'disgust', 'surprise', 'neutral'],
    default: null
  },

  // How emotion was detected
  emotionTrigger: {
    type: String,
    enum: ['transformer', 'phrase_rule', 'single_word_rule', 'fallback'],
    default: null
  },

  // ─────────────────────────────────────────────
  // AI OUTPUT (Generated later by admin)
  // ─────────────────────────────────────────────

  // AI-generated summary of feedback
  summary: {
    type: String,
    default: null
  },



  processingStatus: {
  type: String,
  enum: ['pending', 'processing', 'completed', 'failed'],
  default: 'pending'
},

processingError: {
  type: String,
  default: null
},

processedAt: {
  type: Date,
  default: null
},

  // ─────────────────────────────────────────────
  // RAG PIPELINE STATUS TRACKING
  // ─────────────────────────────────────────────

  // Tracks indexing progress for FAISS / vector store
  ragStatus: {
    type: String,
    enum: ['pending', 'processing', 'indexed', 'failed'],
    default: 'pending'
  },

  // Stores error message if indexing fails
  ragError: {
    type: String,
    default: null
  },

  // When indexing was completed
  indexedAt: {
    type: Date,
    default: null
  },

  // ─────────────────────────────────────────────
  // TIMESTAMPS
  // ─────────────────────────────────────────────

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ─────────────────────────────────────────────
// AUTO-UPDATE TIMESTAMP
// ─────────────────────────────────────────────
feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ─────────────────────────────────────────────
// HUMAN-READABLE DATE (for UI)
// ─────────────────────────────────────────────
feedbackSchema.virtual('date').get(function() {
  const now     = new Date();
  const diff    = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24)   return `${hours} hours ago`;
  if (days < 7)     return `${days} days ago`;
  return this.createdAt.toLocaleDateString();
});

module.exports = mongoose.model('Feedback', feedbackSchema);