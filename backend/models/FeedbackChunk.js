const mongoose = require('mongoose');

const feedbackChunkSchema = new mongoose.Schema({
  // ─────────────────────────────────────────────
  // Reference back to the raw Feedback document
  // This links each chunk to its original feedback
  // ─────────────────────────────────────────────
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    required: true,
    index: true
  },

  // Anonymous feedback tracking ID copied from Feedback
  // Useful for debugging and tracing chunk ownership
  anonymous_id: {
    type: String,
    required: true,
    index: true
  },

  // Position of this chunk inside the full indexable text
  // Example: chunk 0, chunk 1, chunk 2...
  chunkIndex: {
    type: Number,
    required: true
  },

  // The actual chunked text used for retrieval
  // This is what will later be embedded and searched
  chunkText: {
    type: String,
    required: true
  },

  // Where this chunk mainly came from
  // feedback = student typed feedback
  // evidence = OCR/PDF extracted text
  // combined = merged feedback + evidence block
  sourceType: {
    type: String,
    enum: ['feedback', 'evidence', 'combined'],
    default: 'combined'
  },

  // Tags copied from the main feedback record
  // Helpful later for filtering or debugging
  tags: {
    type: [String],
    default: []
  },

  // Topic grouping label copied from Feedback
  topicLabel: {
    type: String,
    default: null
  },

  // Short topic label copied from Feedback
// Example: "Canteen Food"
  topicShortLabel: {
    type: String,
    default: null
  },

  // Sentiment copied from Feedback
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: null
  },

  // Emotion copied from Feedback
  emotion: {
    type: String,
    enum: ['joy', 'anger', 'sadness', 'fear', 'disgust', 'surprise', 'neutral'],
    default: null
  },

  // FAISS row/id mapping
  // Later, when you add vectors to FAISS, store the FAISS ID here
  // For now this can stay null while you test chunking only
  faissId: {
    type: Number,
    default: null
  },

  // Stores whether this chunk has already been embedded/indexed
  // Very useful when you start adding FAISS later
  embeddingStatus: {
    type: String,
    enum: ['pending', 'indexed', 'failed'],
    default: 'pending'
  },

  // If embedding/indexing fails for this chunk, save the reason here
  embeddingError: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate chunk numbers for the same feedback
feedbackChunkSchema.index({ feedbackId: 1, chunkIndex: 1 }, { unique: true });

module.exports = mongoose.model('FeedbackChunk', feedbackChunkSchema);