const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const axios = require('axios');

const OLLAMA_URL = 'http://localhost:11434/api';
const MAX_TEXT_LENGTH = 4000;

// Only allow feedback-related questions
const ALLOWED_TOPICS = [
    'feedback', 'student', 'students', 'complaint', 'complain', 'issue',
    'problem', 'suggestion', 'improve', 'improvement', 'experience',
    'teaching', 'teacher', 'lecturer', 'lecture', 'class', 'course',
    'facility', 'facilities', 'library', 'hostel', 'food', 'canteen',
    'staff', 'service', 'support', 'happy', 'unhappy', 'satisfied',
    'unsatisfied', 'concern', 'concerns', 'report', 'summary', 'trend',
    'common', 'most', 'frequent', 'total', 'pending', 'resolved',
    'category', 'sentiment', 'negative', 'positive', 'neutral',
    'rating', 'performance', 'quality', 'wifi', 'internet', 'transport',
    'parking', 'hostel', 'accommodation', 'admin', 'administrative', 'it',
    'today', 'week', 'month', 'year', 'recent', 'latest', 'happening'
];

// Maps keywords in admin questions to feedback category values
const CATEGORY_KEYWORDS = {
    academic: [
        'academic', 'teaching', 'teacher', 'lecturer', 'lecture',
        'class', 'course', 'learning', 'exam', 'assignment', 'marks',
        'grades', 'tutor', 'professor', 'education', 'subject'
    ],
    library: [
        'library', 'books', 'reading', 'resources', 'journals',
        'study room', 'library services', 'librarian', 'borrow'
    ],
    it: [
        'wifi', 'wi-fi', 'internet', 'network', 'computer', 'lab',
        'it', 'technology', 'system', 'portal', 'online', 'connection',
        'slow internet', 'it services', 'software', 'hardware'
    ],
    facilities: [
        'facility', 'facilities', 'campus', 'building', 'classroom',
        'toilet', 'bathroom', 'grounds', 'sports', 'gym',
        'field', 'infrastructure', 'maintenance', 'cleaning'
    ],
    canteen: [
        'canteen', 'food', 'meal', 'eating', 'dining', 'cafeteria',
        'lunch', 'breakfast', 'dinner', 'menu', 'cook', 'kitchen',
        'hungry', 'restaurant', 'drink', 'water', 'snack'
    ],
    transport: [
        'transport', 'bus', 'vehicle', 'parking', 'commute', 'travel',
        'driver', 'route', 'schedule', 'taxi', 'shuttle', 'road'
    ],
    hostel: [
        'hostel', 'accommodation', 'room', 'dormitory', 'dorm',
        'housing', 'sleep', 'bed', 'warden', 'residence', 'living'
    ],
    admin: [
        'admin', 'administrative', 'office', 'registration', 'fees',
        'payment', 'documents', 'staff', 'service', 'secretary',
        'bursar', 'finance', 'enrollment', 'admission', 'records'
    ]
};

/* ---------------- HELPER FUNCTIONS ---------------- */

// Block irrelevant questions
function isRelevantQuestion(question) {
    const lower = question.toLowerCase();
    return ALLOWED_TOPICS.some(topic => lower.includes(topic));
}

// Detect which feedback category the admin question relates to
function detectCategory(question) {
    const lower = question.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => {
            const regex = new RegExp(`\\b${keyword.replace(/[-\/]/g, '\\$&')}\\b`, 'i');
            return regex.test(lower);
        })) {
            console.log(`Category detected: ${category}`);
            return category;
        }
    }
    console.log('No specific category detected - searching all feedback');
    return null;
}
// Detect time range from the question
// Returns { start, end (optional), label } or null if no date found
function detectDateRange(question) {
    const lower = question.toLowerCase();
    const now = new Date();

    if (lower.includes('today')) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return { start, label: 'today' };
    }

    if (lower.includes('this week') || lower.includes('last 7 days')) {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return { start, label: 'this week' };
    }

    if (lower.includes('last week')) {
        const start = new Date(now);
        start.setDate(now.getDate() - 14);
        const end = new Date(now);
        end.setDate(now.getDate() - 7);
        return { start, end, label: 'last week' };
    }

    if (lower.includes('this month')) {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start, label: 'this month' };
    }

    if (lower.includes('last month')) {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start, end, label: 'last month' };
    }

    if (lower.includes('this year')) {
        const start = new Date(now.getFullYear(), 0, 1);
        return { start, label: 'this year' };
    }

    if (lower.includes('recent') || lower.includes('latest') || lower.includes('happening')) {
        // "recent" / "latest" / "what's happening" = last 30 days
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        return { start, label: 'recently (last 30 days)' };
    }

    return null;
}

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

// Generate AI response using Ollama (phi3)
async function generateAIResponse(prompt) {
    try {
        const response = await axios.post(`${OLLAMA_URL}/generate`, {
            model: 'phi3',
            prompt,
            stream: false,
            options: {
                temperature: 0.2,
                num_predict: 300
            }
        });
        return response.data.response || '';
    } catch (error) {
        console.error('AI response error:', error.message);
        return "Sorry, I'm having trouble processing that right now.";
    }
}

// Generate summary using Ollama (phi3) - admin use only
async function generateSummary(text) {
    try {
        const safeText = text.slice(0, MAX_TEXT_LENGTH);
        const response = await axios.post(`${OLLAMA_URL}/generate`, {
            model: 'phi3',
            prompt: `Summarize the following student feedback in 2-3 clear sentences:\n\n${safeText}`,
            stream: false,
            options: {
                temperature: 0.3,
                num_predict: 150
            }
        });
        return response.data.response || '';
    } catch (error) {
        console.error('Summary error:', error.message);
        return '';
    }
}

// Get quick stats from MongoDB
async function getStats() {
    const [total, pending, resolved, categoryStats] = await Promise.all([
        Feedback.countDocuments(),
        Feedback.countDocuments({ status: 'pending' }),
        Feedback.countDocuments({ status: 'resolved' }),
        Feedback.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ])
    ]);
    return { total, pending, resolved, categoryStats };
}

// Build rich context - includes feedback text + extracted file text
function buildContext(results) {
    return results.map((doc, i) => {
        let entry = `${i + 1}. [${doc.category} | ${doc.sentiment}] ${doc.feedback}`;
        if (doc.evidenceText) {
            entry += `\n   Evidence from attached file: ${doc.evidenceText.slice(0, 500)}`;
        }
        return entry;
    }).join('\n\n');
}

// Build balanced prompt
function buildPrompt(message, context, dateLabel, categoryLabel) {
    const scope = [
        categoryLabel ? `category: ${categoryLabel}` : null,
        dateLabel ? `time period: ${dateLabel}` : null
    ].filter(Boolean).join(', ');

    return `You are a university feedback analyst assistant.
${scope ? `You are answering about feedback from: ${scope}.` : ''}

Use the student feedback below as your PRIMARY source.
If the feedback is insufficient, you may use general knowledge to supplement,
but clearly indicate this by saying "Based on general knowledge:".

Question: ${message}

Student Feedback:
${context}

Answer helpfully in 2-3 sentences.
If using feedback say "Based on student feedback:".
If adding your own reasoning say "Based on general knowledge:".`;
}

// Run vector search with optional category + date filters
// Falls back to full search if filtered search returns nothing
async function runVectorSearch(questionEmbedding, detectedCategory, dateRange) {
    const vectorSearchStage = {
        $vectorSearch: {
            index: 'feedback_vector_index',
            queryVector: questionEmbedding,
            path: 'embedding',
            similarity: 'cosine',
            numCandidates: 100,
            limit: detectedCategory ? 10 : 3,
            ...(detectedCategory && {
                filter: { category: { $eq: detectedCategory } }
            })
        }
    };

    const projectStage = {
        $project: {
            feedback: 1,
            category: 1,
            summary: 1,
            sentiment: 1,
            evidenceText: 1,
            createdAt: 1
        }
    };

    // Build pipeline
    const pipeline = [vectorSearchStage];

    // Add date filter after vector search if date was detected
    if (dateRange) {
        pipeline.push({
            $match: {
                createdAt: {
                    $gte: dateRange.start,
                    ...(dateRange.end && { $lte: dateRange.end })
                }
            }
        });
    }

    pipeline.push(projectStage);
    pipeline.push({ $limit: 3 });

    const results = await Feedback.aggregate(pipeline);

    // If filters returned nothing, fall back to full unfiltered search
    if (!results.length && (detectedCategory || dateRange)) {
        console.log('Filtered search returned nothing - falling back to full search');
        const fallback = await Feedback.aggregate([
            {
                $vectorSearch: {
                    index: 'feedback_vector_index',
                    queryVector: questionEmbedding,
                    path: 'embedding',
                    similarity: 'cosine',
                    numCandidates: 100,
                    limit: 3
                }
            },
            projectStage
        ]);
        return { results: fallback, usedFallback: true };
    }

    return { results, usedFallback: false };
}

/* ---------------- ROUTES ---------------- */

// POST /chat - Admin asks a question about student feedback
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required.'
            });
        }

        // Block irrelevant questions
        if (!isRelevantQuestion(message)) {
            return res.status(400).json({
                success: false,
                message: 'This assistant only answers questions about student feedback. Please ask about complaints, suggestions, trends, or feedback statistics.'
            });
        }

        const msg = message.toLowerCase();
        const stats = await getStats();

        // Quick stat answers - no AI needed
        if (msg.includes('total')) {
            return res.json({
                success: true,
                answer: `There are ${stats.total} total feedback submissions.`
            });
        }

        if (msg.includes('pending')) {
            return res.json({
                success: true,
                answer: `There are ${stats.pending} pending feedbacks and ${stats.resolved} resolved.`
            });
        }

        if (msg.includes('category') && stats.categoryStats.length > 0) {
            return res.json({
                success: true,
                answer: `Top category: ${stats.categoryStats[0]._id} (${stats.categoryStats[0].count} feedbacks).`
            });
        }

        // Full RAG pipeline
        console.log('Processing RAG query:', message);

        // Detect category and date from question
        const detectedCategory = detectCategory(message);
        const dateRange = detectDateRange(message);

        if (dateRange) {
            console.log(`Date range detected: ${dateRange.label}`);
        }

        // Generate embedding
        const questionEmbedding = await generateEmbedding(message);

        // Run vector search with filters
        const { results, usedFallback } = await runVectorSearch(
            questionEmbedding,
            detectedCategory,
            dateRange
        );

        console.log(`RAG found ${results.length} feedbacks${usedFallback ? ' (fallback search)' : ''}${detectedCategory ? ` | category: ${detectedCategory}` : ''}${dateRange ? ` | period: ${dateRange.label}` : ''}`);

        if (!results.length) {
            return res.json({
                success: true,
                answer: `No feedback found${dateRange ? ` for ${dateRange.label}` : ''}${detectedCategory ? ` in the ${detectedCategory} category` : ''}.`
            });
        }

        // Build context and generate answer
        const context = buildContext(results);
        const answer = await generateAIResponse(
            buildPrompt(message, context, dateRange?.label, detectedCategory)
        );

        res.json({
            success: true,
            answer,
            ragResults: results.length,
            detectedCategory: detectedCategory || 'all',
            detectedPeriod: dateRange?.label || 'all time',
            sources: results.map(r => r.feedback.substring(0, 100) + '...')
        });

    } catch (error) {
        console.error('Chat route error:', error.message);
        res.status(500).json({
            success: false,
            message: 'AI processing failed. Make sure Ollama is running with: ollama serve'
        });
    }
});

// GET /summary/:id - Admin requests summary for a specific feedback
router.get('/summary/:id', async (req, res) => {
    try {
        const feedbackItem = await Feedback.findById(req.params.id);

        if (!feedbackItem) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found.'
            });
        }

        // Return cached summary if exists
        if (feedbackItem.summary) {
            return res.json({
                success: true,
                summary: feedbackItem.summary,
                cached: true
            });
        }

        const textToSummarize = feedbackItem.evidenceText
            ? `${feedbackItem.feedback}. Evidence context: ${feedbackItem.evidenceText}`
            : feedbackItem.feedback;

        const summary = await generateSummary(textToSummarize);
        await Feedback.findByIdAndUpdate(feedbackItem._id, { summary });

        res.json({
            success: true,
            summary,
            cached: false
        });

    } catch (error) {
        console.error('Summary route error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to generate summary. Make sure Ollama is running.'
        });
    }
});

module.exports = router;