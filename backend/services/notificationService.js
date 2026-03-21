// services/notificationService.js
// ─────────────────────────────────────────────────────────────────
// Creates Notification documents when feedback is submitted.
// Called from feedbackRoutes.js after feedback.save()
// Also emits Socket.IO events so the bell updates instantly.
// ─────────────────────────────────────────────────────────────────

const Notification = require('../models/Notification');
const { emitNewFeedback, emitUrgentAlert, emitStatsUpdate } = require('../socket');
const { detectUrgency } = require('./urgencyDetector');

// Category display names for readable notification titles
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

async function handleNewFeedback(feedback) {
    try {
        const categoryLabel = CATEGORY_LABELS[feedback.category] || feedback.category || 'General';
        const preview       = feedback.feedback?.slice(0, 80) || '';
        const urgentReason  = detectUrgency(feedback.feedback);

        // ── Decide notification type and content ─────────────────
        let type, title, message, link;

        if (urgentReason) {
            // Urgent feedback — highest priority
            type    = 'negative_feedback';
            title   = `⚠️ Urgent: ${urgentReason}`;
            message = `${categoryLabel}: "${preview}..."`;
            link    = `/admin/feedback?category=${feedback.category}&status=pending`;

        } else if (feedback.sentiment === 'negative') {
            // Negative feedback
            type    = 'negative_feedback';
            title   = `Negative feedback — ${categoryLabel}`;
            message = `"${preview}..."`;
            link    = `/admin/feedback?category=${feedback.category}&status=pending`;

        } else {
            // General new feedback (positive or neutral)
            type    = 'new_feedback';
            title   = `New ${feedback.sentiment || 'feedback'} — ${categoryLabel}`;
            message = `"${preview}..."`;
            link    = `/admin/feedback`;
        }

        // ── Save notification to MongoDB ─────────────────────────
        const notification = await Notification.create({
            type,
            title,
            message,
            category: feedback.category || null,
            link,
            isRead:   false
        });

        // ── Emit real-time events via Socket.IO ──────────────────
        // This makes the bell update instantly without page refresh

        // 1. Emit the new notification so bell count increments
        emitNewFeedback({
            notificationId: notification._id,
            type,
            title,
            message,
            category:  feedback.category,
            sentiment: feedback.sentiment,
            link,
            timestamp: notification.createdAt
        });

        // 2. If urgent — emit a separate urgent alert
        if (urgentReason) {
            emitUrgentAlert({
                _id:      feedback._id,
                category: feedback.category,
                feedback: feedback.feedback
            }, urgentReason);
        }

        // 3. Emit updated stats so dashboard counts refresh live
        const Feedback = require('../models/Feedback');
        const [total, pending, resolved] = await Promise.all([
            Feedback.countDocuments(),
            Feedback.countDocuments({ status: 'pending' }),
            Feedback.countDocuments({ status: 'resolved' })
        ]);
        emitStatsUpdate({ total, pending, resolved });

        console.log(`Notification created: ${title}`);
        return notification;

    } catch (err) {
        // Non-fatal — feedback was saved, notification just failed
        console.error('Notification creation error:', err.message);
    }
}

// Check if a category has spiked today — call this after saving feedback
// If 10+ feedbacks in same category today, create a spike notification
async function checkCategorySpike(category) {
    try {
        const Feedback = require('../models/Feedback');
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const count = await Feedback.countDocuments({
            category,
            createdAt: { $gte: todayStart }
        });

        // Trigger at 10, 20, 30... to avoid spamming
        if (count > 0 && count % 10 === 0) {
            const categoryLabel = CATEGORY_LABELS[category] || category;
            const notification  = await Notification.create({
                type:     'category_spike',
                title:    `${categoryLabel} spike — ${count} submissions today`,
                message:  `${count} students have submitted feedback about ${categoryLabel} today. This may need attention.`,
                category,
                link:     `/admin/feedback?category=${category}`,
                isRead:   false
            });

            emitNewFeedback({
                notificationId: notification._id,
                type:           'category_spike',
                title:          notification.title,
                message:        notification.message,
                category,
                link:           notification.link,
                timestamp:      notification.createdAt
            });

            console.log(`Category spike notification: ${categoryLabel} — ${count} today`);
        }
    } catch (err) {
        console.error('Category spike check error:', err.message);
    }
}

module.exports = { handleNewFeedback, checkCategorySpike };