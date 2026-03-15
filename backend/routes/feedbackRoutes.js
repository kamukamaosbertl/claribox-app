const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Feedback = require('../models/Feedback');
const { analyzeSentiment } = require('../services/sentimentService');
const pdfParse = require('pdf-parse');
const axios = require('axios');

// Multer config - memory storage for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const OLLAMA_URL = 'http://localhost:11434/api';
const MAX_TEXT_LENGTH = 4000;

/* ---------------- HELPER FUNCTIONS ---------------- */

// Generate embedding using Ollama (nomic-embed-text)
async function generateEmbedding(text) {
    try {
        const safeText = text.slice(0, MAX_TEXT_LENGTH);
        const response = await axios.post(`${OLLAMA_URL}/embeddings`, {
            model: 'nomic-embed-text',
            prompt: safeText
        });
        return response.data.embedding || [];
    } catch (error) {
        console.error('Embedding error:', error.message);
        return [];
    }
}

// Upload file to Cloudinary with OCR
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'student-evidence', ocr: 'adv_ocr', timeout: 60000 },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

/* ---------------- ROUTE ---------------- */

// POST /submit - Student submits feedback
// Strategy: save immediately → respond to student → process everything in background
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

        // Save feedback immediately with just the raw text
        // No embedding, no sentiment, no summary — student should not wait for these
        const newFeedback = new Feedback({
            category,
            feedback: safeFeedback,
            summary: null,       // Generated later by admin on demand
            sentiment: null,     // Generated in background
            sentimentScore: null,
            embedding: []        // Generated in background
        });

        await newFeedback.save();

        // ✅ Student sees success immediately — under 1 second
        res.json({
            success: true,
            message: 'Feedback submitted successfully!',
            data: { id: newFeedback.anonymous_id }
        });

        /* ------------------------------------------------
           BACKGROUND PROCESSING
           Everything below runs after student gets response.
           Student never waits for any of this.
        ------------------------------------------------ */
        (async () => {
            try {
                let finalText = safeFeedback;
                let extractedText = '';

                // Step 1: Handle file upload if attached
                if (req.file) {
                    const uploadResult = await streamUpload(req.file.buffer);

                    if (req.file.mimetype === 'application/pdf') {
                        const pdfData = await pdfParse(req.file.buffer);
                        extractedText = pdfData.text;
                    } else if (req.file.mimetype.startsWith('image/')) {
                        extractedText = uploadResult.info?.ocr?.adv_ocr?.data[0]?.fullTextAnnotation?.text || '';
                    }

                    // Combine feedback + extracted file text for richer context
                    if (extractedText) {
                        finalText = `${safeFeedback}. Evidence context: ${extractedText}`;
                        finalText = finalText.slice(0, MAX_TEXT_LENGTH);
                    }

                    // Save file details to MongoDB
                    await Feedback.findByIdAndUpdate(newFeedback._id, {
                        evidenceFile: {
                            url: uploadResult.secure_url,
                            fileName: req.file.originalname,
                            fileType: req.file.mimetype
                        },
                        evidenceText: extractedText.slice(0, MAX_TEXT_LENGTH)
                    });
                }

                // Step 2: Generate embedding + sentiment in parallel on final text
                // Summary is NOT generated here — admin generates it on demand
                const [embedding, sentimentResult] = await Promise.all([
                    generateEmbedding(finalText),
                    analyzeSentiment(finalText)
                ]);

                // Step 3: Update MongoDB with embedding and sentiment
                await Feedback.findByIdAndUpdate(newFeedback._id, {
                    embedding,
                    sentiment: sentimentResult.label,
                    sentimentScore: sentimentResult.score
                });

                console.log(`Background processing complete for ${newFeedback.anonymous_id}`);

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