// ── Weekly Report Job ─────────────────────────────────────────────────────────
// Gathers feedback stats from the last 7 days
// Then calls emailService to send the report to admin

const Feedback          = require('../models/Feedback');
const { sendWeeklyReport } = require('./emailService');

// ── Generate and send weekly report ──────────────────────────────────────────
// Called every Monday at 8am by the cron job in server.js
async function generateAndSendWeeklyReport() {
    try {
        console.log('Generating weekly feedback report...');

        // Calculate date range — last 7 days
        const weekEnd   = new Date();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const matchQuery = { createdAt: { $gte: weekStart, $lte: weekEnd } };

        // Run all queries in parallel for speed
        const [total, positive, neutral, negative, categoryStats] = await Promise.all([
            Feedback.countDocuments(matchQuery),
            Feedback.countDocuments({ ...matchQuery, sentiment: 'positive' }),
            Feedback.countDocuments({ ...matchQuery, sentiment: 'neutral'  }),
            Feedback.countDocuments({ ...matchQuery, sentiment: 'negative' }),
            Feedback.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        // Format category stats for the email
        const topCategories = categoryStats.map(c => ({
            name:  c._id.charAt(0).toUpperCase() + c._id.slice(1),
            count: c.count
        }));

        // Send the email with all stats
        await sendWeeklyReport({
            total,
            positive,
            neutral,
            negative,
            topCategories,
            weekStart,
            weekEnd
        });

        console.log(`Weekly report sent — ${total} feedbacks this week`);

    } catch (error) {
        console.error(' Weekly report error:', error.message);
    }
}

module.exports = { generateAndSendWeeklyReport };