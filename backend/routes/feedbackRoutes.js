const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('../config/cloudinary');
const Feedback     = require('../models/Feedback');
const Notification           = require('../models/Notification');
const { sendSpikeAlert } = require('../services/emailService'); // email alerts
const { analyzeSentiment } = require('../services/sentimentService');
const pdfParse   = require('pdf-parse');

// ── Multer — memory storage ───────────────────────────────────────────────────
// Files are kept in memory (not saved to disk)
// They go directly to Cloudinary from memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
});

const MAX_TEXT_LENGTH = 4000;

// ── Local embedding pipeline ──────────────────────────────────────────────────
// This loads the AI embedding model once when the server starts
// After that it stays in memory and is reused for every submission
// No internet needed — runs completely on the server
let embeddingPipeline = null;

async function getEmbeddingPipeline() {
    if (!embeddingPipeline) {
        console.log('Loading local embedding model...');
        const { pipeline } = await import('@xenova/transformers');
        // all-MiniLM-L6-v2 produces 384-dimension vectors
        // Used for MongoDB vector search in the AI chat
        embeddingPipeline = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2'
        );
        console.log('Embedding model ready ✅');
    }
    return embeddingPipeline;
}

/* ---------------- HELPER FUNCTIONS ---------------- */

// Generate embedding — converts text to array of 384 numbers
// These numbers represent the meaning of the text
// Similar texts produce similar number arrays
// Used by MongoDB vector search to find relevant feedback
async function generateEmbedding(text) {
    try {
        const safeText = text.slice(0, MAX_TEXT_LENGTH);
        const pipe     = await getEmbeddingPipeline();
        const output   = await pipe(safeText, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (error) {
        console.error('Embedding error:', error.message);
        return []; // Return empty array on failure — won't break MongoDB
    }
}

// Upload file buffer to Cloudinary with OCR enabled
// OCR = Optical Character Recognition — extracts text from images
// Returns Cloudinary result with secure_url and extracted text
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder:  'student-evidence',
                ocr:     'adv_ocr',   // Enable advanced OCR for text extraction
                timeout: 60000        // 60 second timeout for large files
            },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

/* ---------------- ROUTE ---------------- */

// POST /api/feedback/submit
// Students submit feedback through this route
//
// Strategy — respond fast, process in background:
// 1. Save feedback text immediately → student gets success in <1 second
// 2. Everything else (embedding, sentiment, file upload) runs AFTER response
// 3. Student never waits for AI processing
router.post('/submit', upload.single('evidenceFile'), async (req, res) => {
    try {
        const { category, feedback } = req.body;

        // Validate required fields
        if (!category || !feedback) {
            return res.status(400).json({
                success: false,
                message: 'Category and feedback are required.'
            });
        }

        // Trim feedback to max length
        const safeFeedback = feedback.slice(0, MAX_TEXT_LENGTH);

        // Save feedback immediately with just the raw text
        // Embedding and sentiment are null for now — filled in background
        const newFeedback = new Feedback({
            category,
            feedback:  safeFeedback,
            summary:   null,  // Admin generates this on demand via AI
            sentiment: null,  // Python script fills this in background
            embedding: []     // Local model fills this in background
        });

        await newFeedback.save();

        // ✅ Send success response to student immediately
        // Student sees "Feedback submitted!" in under 1 second
        res.json({
            success: true,
            message: 'Feedback submitted successfully!',
            data: { id: newFeedback.anonymous_id }
        });

        /* ────────────────────────────────────────────────
           BACKGROUND PROCESSING
           Everything below runs AFTER student gets response
           Student never waits for any of this
        ──────────────────────────────────────────────── */
        (async () => {
            try {
                let finalText     = safeFeedback;
                let extractedText = '';

                // ── Step 1: Handle file upload if student attached evidence ──
                if (req.file) {
                    // Upload file to Cloudinary — also runs OCR to extract text
                    const uploadResult = await streamUpload(req.file.buffer);

                    if (req.file.mimetype === 'application/pdf') {
                        // Extract text from PDF using pdf-parse
                        const pdfData = await pdfParse(req.file.buffer);
                        extractedText = pdfData.text;
                    } else if (req.file.mimetype.startsWith('image/')) {
                        // Extract text from image using Cloudinary OCR
                        extractedText = uploadResult.info?.ocr?.adv_ocr?.data[0]?.fullTextAnnotation?.text || '';
                    }

                    // Combine feedback text + extracted file text
                    // This gives the AI more context when answering questions
                    if (extractedText) {
                        finalText = `${safeFeedback}. Evidence context: ${extractedText}`;
                        finalText = finalText.slice(0, MAX_TEXT_LENGTH);
                    }

                    // Save file details and extracted text to MongoDB
                    await Feedback.findByIdAndUpdate(newFeedback._id, {
                        evidenceFile: {
                            url:      uploadResult.secure_url,
                            fileName: req.file.originalname,
                            fileType: req.file.mimetype
                        },
                        evidenceText: extractedText.slice(0, MAX_TEXT_LENGTH)
                    });
                }

                // ── Step 2: Generate embedding + sentiment at the same time ──
                // Promise.all runs both in parallel — faster than one by one
                const [embedding, sentimentResult] = await Promise.all([
                    generateEmbedding(finalText),  // Local model — 384 numbers
                    analyzeSentiment(finalText)     // Python script — positive/neutral/negative
                ]);

                // ── Step 3: Save embedding and sentiment to MongoDB ──
                await Feedback.findByIdAndUpdate(newFeedback._id, {
                    embedding,
                    sentiment:      sentimentResult.label,  // 'positive' | 'neutral' | 'negative'
                    sentimentScore: sentimentResult.score   // number between -1 and 1
                });

                console.log(`Background processing complete for ${newFeedback.anonymous_id}`);

                // ── Step 4: Create notifications based on feedback content ──

                // Notify admin if feedback is negative
                if (sentimentResult.label === 'negative') {
                    await Notification.create({
                        type:     'negative_feedback',
                        title:    'Negative Feedback Received',
                        message:  `A student submitted negative feedback about ${category}.`,
                        category: category,
                        link:     '/admin/dashboard'
                    });
                }

                // Notify admin if a category is spiking — 5+ feedbacks today
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayCount = await Feedback.countDocuments({
                    category,
                    createdAt: { $gte: todayStart }
                });

                // Only notify at exactly 5 to avoid spamming
                if (todayCount === 5) {
                    await Notification.create({
                        type:     'category_spike',
                        title:    `${category.charAt(0).toUpperCase() + category.slice(1)} Feedback Spiking`,
                        message:  `5 feedbacks received in ${category} today. Consider reviewing.`,
                        category: category,
                        link:     '/admin/insights'
                    });
                }

                // Send spike email alert at 10 feedbacks in one day
                if (todayCount === 10) {
                    await sendSpikeAlert(todayCount, category);
                }

            } catch (bgErr) {
                // Background errors don't affect the student
                // Feedback is already saved — just missing embedding/sentiment
                console.error('Background processing error:', bgErr.message);
            }
        })();

    } catch (error) {
        console.error('Submission error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during feedback submission.'
        });
    }
});

module.exports = router;