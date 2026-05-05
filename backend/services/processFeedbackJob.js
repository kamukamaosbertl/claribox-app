const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');

const { analyzeSentiment } = require('./sentimentService');
const { assignThemeGroup } = require('./themeGrouper');
const { detectUrgency } = require('./urgencyDetector');
const { indexFeedbackForRAG } = require('./ragIndexer');
const { sendSpikeAlert } = require('./emailService');

const {
  emitNewFeedback,
  emitUrgentAlert,
  emitStatsUpdate,
} = require('../socket');

const MAX_TEXT_LENGTH = 4000;

function buildAnalysisText(feedback, evidenceText) {
  if (!evidenceText) return feedback;
  return `${feedback}\n\nEvidence context:\n${evidenceText}`.slice(0, MAX_TEXT_LENGTH);
}

async function createAndEmitNotification({ type, title, message, link }) {
  const notification = await Notification.create({
    type,
    title,
    message,
    link,
  });

  emitNewFeedback({
    notificationId: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    timestamp: notification.createdAt,
  });

  return notification;
}

async function handleFeedbackNotification({ feedbackDoc, safeFeedback, tags, topicLabel, sentimentLabel }) {
  const preview = safeFeedback.slice(0, 80);
  const urgentReason = detectUrgency(safeFeedback);
  const mainLabel = topicLabel || 'feedback';

  if (urgentReason) {
    await createAndEmitNotification({
      type: 'negative_feedback',
      title: `⚠️ Urgent — ${urgentReason}`,
      message: `${mainLabel}: "${preview}..."`,
      link: '/admin/feedback',
    });

    emitUrgentAlert(
      {
        _id: feedbackDoc._id,
        feedback: safeFeedback,
        tags,
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
      link: '/admin/dashboard',
    });

    return;
  }

  await createAndEmitNotification({
    type: 'new_feedback',
    title: `New ${sentimentLabel || 'neutral'} feedback`,
    message: `"${preview}..."`,
    link: '/admin/feedback',
  });
}

async function handleCategorySpike(topicLabel) {
  if (!topicLabel) return;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await Feedback.countDocuments({
    topicLabel,
    createdAt: { $gte: todayStart },
  });

  if (todayCount === 5) {
    await createAndEmitNotification({
      type: 'category_spike',
      title: `${topicLabel} Feedback Spiking`,
      message: `5 feedbacks related to "${topicLabel}" were received today.`,
      link: '/admin/insights',
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
    resolved: 0,
  });
}

async function safelyIndexFeedbackForRAG(feedbackId) {
  try {
    await Feedback.findByIdAndUpdate(feedbackId, {
      ragStatus: 'processing',
      ragError: null,
    });

    await indexFeedbackForRAG(feedbackId);
  } catch (err) {
    await Feedback.findByIdAndUpdate(feedbackId, {
      ragStatus: 'failed',
      ragError: err.message,
    });
  }
}

async function processFeedbackJob(feedbackId) {
  const feedbackDoc = await Feedback.findById(feedbackId);

  if (!feedbackDoc) {
    throw new Error(`Feedback not found: ${feedbackId}`);
  }

  await Feedback.findByIdAndUpdate(feedbackId, {
    processingStatus: 'processing',
    processingError: null,
  });

  try {
    const safeFeedback = feedbackDoc.feedback;
    const evidenceText = feedbackDoc.evidenceText || '';
    const analysisText = buildAnalysisText(safeFeedback, evidenceText);

    const sentimentResult = await analyzeSentiment(analysisText);

    const { topicLabel, topicShortLabel } = await assignThemeGroup({
      feedbackId: feedbackDoc._id,
      feedback: safeFeedback,
      tags: feedbackDoc.tags || [],
      evidenceText,
    });

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackDoc._id,
      {
        topicLabel,
        topicShortLabel,

        sentiment: sentimentResult.label || null,
        sentimentScore: sentimentResult.score || null,
        emotion: sentimentResult.emotion || null,
        emotionTrigger: sentimentResult.emotion_trigger || null,

        processingStatus: 'completed',
        processingError: null,
        processedAt: new Date(),

        ragStatus: 'pending',
        ragError: null,
      },
      { new: true }
    );

    await safelyIndexFeedbackForRAG(feedbackDoc._id);

    await handleFeedbackNotification({
      feedbackDoc: updatedFeedback,
      safeFeedback,
      tags: feedbackDoc.tags || [],
      topicLabel,
      sentimentLabel: sentimentResult.label,
    });

    await handleCategorySpike(topicLabel);
    await emitDashboardStats();

    return updatedFeedback;
  } catch (err) {
    await Feedback.findByIdAndUpdate(feedbackId, {
      processingStatus: 'failed',
      processingError: err.message,
      ragStatus: 'failed',
      ragError: err.message,
    });

    throw err;
  }
}
console.log('✅ processFeedbackJob.js reached bottom');
module.exports = {
  processFeedbackJob,
};