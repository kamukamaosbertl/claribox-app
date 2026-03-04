const mongoose = require('mongoose');

// 🔹 Schema for resolved feedback entries
const resolutionSchema = new mongoose.Schema({
  title: {                // Short title for resolution
    type: String,
    required: true,
    trim: true
  },
  description: {          // Detailed description of how issue was resolved
    type: String,
    required: true
  },
  category: {             // Optional category for filtering/reporting
    type: String,
    enum: ['General','Infrastructure','Academics','Services','Facilities','Technology','Other'],
    default: 'General'
  },
  affectedFeedbackIds: [{ // Keep track of which feedback this resolution addresses
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  }],
  resolvedBy: {           // Admin who resolved the issue
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  isPublished: {          // Whether students can see it (as confirmation)
    type: Boolean,
    default: false
  }
}, { timestamps: true }); // createdAt and updatedAt

module.exports = mongoose.model('Resolution', resolutionSchema);