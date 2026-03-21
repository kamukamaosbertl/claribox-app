const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('../config/cloudinary');
const Feedback     = require('../models/Feedback');
const Notification           = require('../models/Notification');
const { sendSpikeAlert } = require('../services/emailService');
const { analyzeSentiment } = require('../services/sentimentService');
const pdfParse   = require('pdf-parse');

// ── NEW: Import Socket.IO emitters and urgency detector ──────────
// emitNewFeedback  → pushes notification to admin bell in real time
// emitUrgentAlert  → pushes urgent banner to admin dashboard
// emitStatsUpdate  → refreshes dashboard counts live
// detectUrgency    → scans text for dangerous/serious keywords
const { emitNewFeedback, emitUrgentAlert, emitStatsUpdate } = require('../socket');
const { detectUrgency } = require('../services/urgencyDetector');

// ── Multer — memory storage ───────────────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const MAX_TEXT_LENGTH = 4000;

// ── Local embedding pipeline ──────────────────────────────────────────────────
let embeddingPipeline = null;

async function getEmbeddingPipeline() {
    if (!embeddingPipeline) {
        console.log('Loading local embedding model...');
        const { pipeline } = await import('@xenova/transformers');
        embeddingPipeline = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2'
        );
        console.log('Embedding model ready ✅');
    }
    return embeddingPipeline;
}

/* ---------------- HELPER FUNCTIONS ---------------- */

async function generateEmbedding(text) {
    try {
        const safeText = text.slice(0, MAX_TEXT_LENGTH);
        const pipe     = await getEmbeddingPipeline();
        const output   = await pipe(safeText, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (error) {
        console.error('Embedding error:', error.message);
        return [];
    }
}

const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder:  'student-evidence',
                ocr:     'adv_ocr',
                timeout: 60000
            },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

// ── Category display names for readable notification titles ───────
const CATEGORY_LABELS = {
    academic:   'Academic Teaching',
    library:    'Library',
    it:         'IT & WiFi',
    facilities: 'Facilities',
    canteen:    'Canteen',
    transport:  'Transport',
    hostel:     'Hostel',
    admin:      'Administration'
};

/* ---------------- ROUTE ---------------- */

router.post('/submit', upload.single('evidenceFile'), async (req, res) => {
    try {
        const { category, feedback } = req.body;

        if (!category || !feedback) {
            return res.status(400).json({
                success: false,
                message: 'Category and feedback are required.'
            });
        }

        const safeFeedback = feedback.slice(0, MAX_TEXT_LENGTH);

        const newFeedback = new Feedback({
            category,
            feedback:  safeFeedback,
            summary:   null,
            sentiment: null,
            embedding: []
        });

        await newFeedback.save();

        // ✅ Respond to student immediately
        res.json({
            success: true,
            message: 'Feedback submitted successfully!',
            data: { id: newFeedback.anonymous_id }
        });

        /* ────────────────────────────────────────────────
           BACKGROUND PROCESSING
        ──────────────────────────────────────────────── */
        (async () => {
            try {
                let finalText     = safeFeedback;
                let extractedText = '';

                // ── Step 1: Handle file upload ────────────────────
                if (req.file) {
                    const uploadResult = await streamUpload(req.file.buffer);

                    if (req.file.mimetype === 'application/pdf') {
                        const pdfData = await pdfParse(req.file.buffer);
                        extractedText = pdfData.text;
                    } else if (req.file.mimetype.startsWith('image/')) {
                        extractedText = uploadResult.info?.ocr?.adv_ocr?.data[0]?.fullTextAnnotation?.text || '';
                    }

                    if (extractedText) {
                        finalText = `${safeFeedback}. Evidence context: ${extractedText}`;
                        finalText = finalText.slice(0, MAX_TEXT_LENGTH);
                    }

                    await Feedback.findByIdAndUpdate(newFeedback._id, {
                        evidenceFile: {
                            url:      uploadResult.secure_url,
                            fileName: req.file.originalname,
                            fileType: req.file.mimetype
                        },
                        evidenceText: extractedText.slice(0, MAX_TEXT_LENGTH)
                    });
                }

                // ── Step 2: Embedding + sentiment in parallel ─────
                const [embedding, sentimentResult] = await Promise.all([
                    generateEmbedding(finalText),
                    analyzeSentiment(finalText)
                ]);

                // ── Step 3: Save embedding and sentiment ──────────
                await Feedback.findByIdAndUpdate(newFeedback._id, {
                    embedding,
                    sentiment:      sentimentResult.label,
                    sentimentScore: sentimentResult.score
                });

                console.log(`Background processing complete for ${newFeedback.anonymous_id}`);

                // ── Step 4: Notifications ─────────────────────────
                const categoryLabel = CATEGORY_LABELS[category] || category;
                const preview       = safeFeedback.slice(0, 80);

                // Check for urgent keywords FIRST — highest priority
                // NEW: detectUrgency scans for safety/harassment/health etc.
                const urgentReason = detectUrgency(safeFeedback);

                if (urgentReason) {
                    // Create urgent notification in DB
                    const urgentNotif = await Notification.create({
                        type:     'negative_feedback',
                        title:    `⚠️ Urgent — ${urgentReason}`,
                        message:  `${categoryLabel}: "${preview}..."`,
                        category: category,
                        link:     `/admin/feedback?category=${category}&status=pending`
                    });

                    // NEW: Push urgent notification to bell in real time
                    emitNewFeedback({
                        notificationId: urgentNotif._id,
                        type:           urgentNotif.type,
                        title:          urgentNotif.title,
                        message:        urgentNotif.message,
                        category,
                        link:           urgentNotif.link,
                        timestamp:      urgentNotif.createdAt
                    });

                    // NEW: Also push urgent banner to dashboard
                    emitUrgentAlert({
                        _id:      newFeedback._id,
                        category: category,
                        feedback: safeFeedback
                    }, urgentReason);

                } else if (sentimentResult.label === 'negative') {
                    // Original negative feedback notification — kept exactly as before
                    // Just added the Socket.IO emit so bell updates live
                    const negNotif = await Notification.create({
                        type:     'negative_feedback',
                        title:    'Negative Feedback Received',
                        message:  `A student submitted negative feedback about ${category}.`,
                        category: category,
                        link:     '/admin/dashboard'
                    });

                    // NEW: Push to bell in real time
                    emitNewFeedback({
                        notificationId: negNotif._id,
                        type:           negNotif.type,
                        title:          negNotif.title,
                        message:        negNotif.message,
                        category,
                        link:           negNotif.link,
                        timestamp:      negNotif.createdAt
                    });

                } else {
                    // Positive or neutral — still notify admin but lower priority
                    // NEW: added this so admin knows about ALL new feedback, not just negative
                    const newNotif = await Notification.create({
                        type:     'new_feedback',
                        title:    `New ${sentimentResult.label} feedback — ${categoryLabel}`,
                        message:  `"${preview}..."`,
                        category: category,
                        link:     '/admin/feedback'
                    });

                    // NEW: Push to bell in real time
                    emitNewFeedback({
                        notificationId: newNotif._id,
                        type:           newNotif.type,
                        title:          newNotif.title,
                        message:        newNotif.message,
                        category,
                        link:           newNotif.link,
                        timestamp:      newNotif.createdAt
                    });
                }

                // ── Category spike check — kept exactly as before ─
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayCount = await Feedback.countDocuments({
                    category,
                    createdAt: { $gte: todayStart }
                });

                if (todayCount === 5) {
                    const spikeNotif = await Notification.create({
                        type:     'category_spike',
                        title:    `${category.charAt(0).toUpperCase() + category.slice(1)} Feedback Spiking`,
                        message:  `5 feedbacks received in ${category} today. Consider reviewing.`,
                        category: category,
                        link:     '/admin/insights'
                    });

                    // NEW: Push spike notification to bell in real time
                    emitNewFeedback({
                        notificationId: spikeNotif._id,
                        type:           spikeNotif.type,
                        title:          spikeNotif.title,
                        message:        spikeNotif.message,
                        category,
                        link:           spikeNotif.link,
                        timestamp:      spikeNotif.createdAt
                    });
                }

                if (todayCount === 10) {
                    await sendSpikeAlert(todayCount, category);
                }

                // NEW: Push updated stats so dashboard counts refresh live
                // Admin sees total/pending/resolved update without refreshing
                const [total, pending, resolved] = await Promise.all([
                    Feedback.countDocuments(),
                    Feedback.countDocuments({ status: 'pending' }),
                    Feedback.countDocuments({ status: 'resolved' })
                ]);
                emitStatsUpdate({ total, pending, resolved });

            } catch (bgErr) {
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