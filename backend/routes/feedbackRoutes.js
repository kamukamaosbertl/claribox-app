
const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');


const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');

const { sendSpikeAlert } = require('../services/emailService');
const { analyzeSentiment } = require('../services/sentimentService');
const { assignThemeGroup } = require('../services/themeGrouper');
const { detectUrgency } = require('../services/urgencyDetector');
const { indexFeedbackForRAG } = require('../services/ragIndexer');
const { processFeedbackJob } = require('../services/processFeedbackJob');

const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

const {
  emitNewFeedback,
  emitUrgentAlert,
  emitStatsUpdate
} = require('../socket');

// ============================================================
// UPLOAD FOLDER SETUP
// ============================================================

const uploadDirs = ['uploads/images', 'uploads/pdfs'];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================================
// MULTER STORAGE CONFIGURATION
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPdf = path.extname(file.originalname).toLowerCase() === '.pdf';
    cb(null, isPdf ? 'uploads/pdfs' : 'uploads/images');
  },

  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname.replace(/\s+/g, '-');
    const uniqueName = `${Date.now()}-${safeOriginalName}`;
    cb(null, uniqueName);
  }
});

// ============================================================
// FILE TYPE VALIDATION
// ============================================================

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Only JPG, PNG, and PDF files are allowed'));
  }

  cb(null, true);
};

// ============================================================
// MULTER UPLOAD INSTANCE
// ============================================================

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ============================================================
// CONSTANTS
// ============================================================

const MAX_FEEDBACK_LENGTH = 1000;
const MAX_TEXT_LENGTH = 4000;

const EMPTY_EVIDENCE_FILE = {
  url: null,
  fileName: null,
  fileType: null
};

// ============================================================
// TEXT EXTRACTION HELPERS
// ============================================================

async function extractTextFromPDF(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    return (pdfData.text || '').trim();
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    return '';
  }
}

async function extractTextFromImage(filePath) {
  try {
    const result = await Tesseract.recognize(filePath, 'eng');
    return (result.data.text || '').trim();
  } catch (err) {
    console.error('OCR error:', err.message);
    return '';
  }
}

async function extractEvidenceText(file) {
  if (!file) return { extractedText: '', fileData: EMPTY_EVIDENCE_FILE };

  const normalizedPath = file.path.replace(/\\/g, '/');

  const fileData = {
    url: `/${normalizedPath}`,
    fileName: file.originalname,
    fileType: file.mimetype
  };

  let extractedText = '';

  if (file.mimetype === 'application/pdf') {
    extractedText = await extractTextFromPDF(file.path);
  } else if (file.mimetype.startsWith('image/')) {
    extractedText = await extractTextFromImage(file.path);
  }

  return {
    extractedText: extractedText.slice(0, MAX_TEXT_LENGTH),
    fileData
  };
}

// ============================================================
// NLP TAG ANALYSIS
// ============================================================

async function analyseText(text) {
  try {
    const response = await axios.post('http://127.0.0.1:5001/analyse', {
      text
    });

    return {
      tags: response.data.tags || []
    };
  } catch (err) {
    console.error('NLP service error:', err.message);
    return { tags: [] };
  }
}

function buildAnalysisText(feedback, evidenceText) {
  if (!evidenceText) return feedback;

  return `${feedback}\n\nEvidence context:\n${evidenceText}`.slice(0, MAX_TEXT_LENGTH);
}

// ============================================================
// NOTIFICATION HELPERS
// ============================================================

async function createAndEmitNotification({ type, title, message, link }) {
  const notification = await Notification.create({
    type,
    title,
    message,
    link
  });

  emitNewFeedback({
    notificationId: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    timestamp: notification.createdAt
  });

  return notification;
}

async function handleFeedbackNotification({
  feedbackDoc,
  safeFeedback,
  tags,
  topicLabel,
  sentimentLabel
}) {
  const preview = safeFeedback.slice(0, 80);
  const urgentReason = detectUrgency(safeFeedback);
  const mainLabel = topicLabel || 'feedback';

  if (urgentReason) {
    await createAndEmitNotification({
      type: 'negative_feedback',
      title: `⚠️ Urgent — ${urgentReason}`,
      message: `${mainLabel}: "${preview}..."`,
      link: '/admin/feedback'
    });

    emitUrgentAlert(
      {
        _id: feedbackDoc._id,
        feedback: safeFeedback,
        tags
      },
      urgentReason
    );

    return;
  }

  if (sentimentLabel === 'negative') {
    await createAndEmitNotification({
      type: 'negative_feedback',
      title: 'Negative Feedback Received',
      message: `A student submitted negative feedback. Top tag: ${mainLabel}.`,
      link: '/admin/dashboard'
    });

    return;
  }

  await createAndEmitNotification({
    type: 'new_feedback',
    title: `New ${sentimentLabel || 'neutral'} feedback`,
    message: `"${preview}..."`,
    link: '/admin/feedback'
  });
}

async function handleCategorySpike(topicLabel) {
  if (!topicLabel) return;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await Feedback.countDocuments({
    topicLabel,
    createdAt: { $gte: todayStart }
  });

  if (todayCount === 5) {
    await createAndEmitNotification({
      type: 'category_spike',
      title: `${topicLabel} Feedback Spiking`,
      message: `5 feedbacks related to "${topicLabel}" were received today.`,
      link: '/admin/insights'
    });
  }

  if (todayCount === 10) {
    await sendSpikeAlert(todayCount, topicLabel);
  }
}

async function emitDashboardStats() {
  const total = await Feedback.countDocuments();

  emitStatsUpdate({
    total,
    pending: 0,
    resolved: 0
  });
}

// ============================================================
// RAG INDEXING HELPER
// ============================================================

async function safelyIndexFeedbackForRAG(feedbackId) {
  try {
    await Feedback.findByIdAndUpdate(feedbackId, {
      ragStatus: 'processing',
      ragError: null
    });

    await indexFeedbackForRAG(feedbackId);
  } catch (err) {
    console.error('RAG indexing error:', err.message);

    await Feedback.findByIdAndUpdate(feedbackId, {
      ragStatus: 'failed',
      ragError: err.message
    }).catch(() => {});
  }
}

// ============================================================
// POST /api/feedback/submit
// ============================================================

router.post(
  '/submit',

  // ------------------------------------------------------------
  // STEP 1: Run multer only for multipart/form-data requests
  // ------------------------------------------------------------

  (req, res, next) => {
    console.log('SUBMIT REQUEST RECEIVED');
    console.log('CONTENT-TYPE:', req.headers['content-type']);

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      return upload.single('evidenceFile')(req, res, (err) => {
        if (err) {
          console.error('MULTER ERROR:', err.message);

          return res.status(400).json({
            success: false,
            message: err.message || 'File upload error.'
          });
        }

        next();
      });
    }

    next();
  },

  // ------------------------------------------------------------
  // STEP 2: Handle feedback submission
  // ------------------------------------------------------------

  async (req, res) => {
    try {
      console.log('SUBMIT ROUTE HIT');
      console.log('BODY:', req.body);
      console.log('FILE:', req.file);

      const { feedback } = req.body;

      if (!feedback || !feedback.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Feedback is required.'
        });
      }

      const safeFeedback = feedback.trim().slice(0, MAX_FEEDBACK_LENGTH);
      const { extractedText, fileData } = await extractEvidenceText(req.file);

      // --------------------------------------------------------
      // STEP 3: Save raw feedback immediately
      // --------------------------------------------------------

      const newFeedback = await Feedback.create({
        feedback: safeFeedback,

        tags: [],
        topicLabel: null,
        topicShortLabel: null,

        summary: null,

        sentiment: null,
        sentimentScore: null,
        emotion: null,
        emotionTrigger: null,

        evidenceFile: fileData,
        evidenceText: extractedText || null,

        ragStatus: 'pending',
        ragError: null,
        indexedAt: null,

        processingStatus: 'pending',
        processingError: null,
        processedAt: null,
      });

      // --------------------------------------------------------
      // STEP 4: Return response immediately
      // --------------------------------------------------------

      res.json({
        success: true,
        message: 'Feedback submitted successfully!',
        data: {
          id: newFeedback.anonymous_id
        }
      });

      // --------------------------------------------------------
      // STEP 5: Background processing
      // --------------------------------------------------------
    processFeedbackJob(newFeedback._id).catch((err) => {
      console.error('Feedback processing job failed:', err.message);
    });
    } catch (error) {
      console.error('Submission error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Server error during feedback submission.'
      });
    }
  }
);

module.exports = router;
