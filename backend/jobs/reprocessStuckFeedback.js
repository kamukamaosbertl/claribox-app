const Feedback = require('../models/Feedback');

const processModule = require('../services/processFeedbackJob');
console.log('PROCESS MODULE:', processModule);

const { processFeedbackJob } = processModule;

async function reprocessStuckFeedback() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stuckFeedback = await Feedback.find({
      createdAt: { $lte: tenMinutesAgo },
      $or: [
        { processingStatus: 'pending' },
        { processingStatus: 'failed' },
        { sentiment: null },
        { topicLabel: null },
        { ragStatus: 'pending' },
        { ragStatus: 'failed' },
      ],
    }).limit(10);

    if (!stuckFeedback.length) return;

    console.log(`🔁 Reprocessing ${stuckFeedback.length} stuck feedback items...`);

    for (const feedback of stuckFeedback) {
      try {
        await processFeedbackJob(feedback._id);
        console.log(`✅ Reprocessed feedback ${feedback.anonymous_id}`);
      } catch (error) {
        console.error(
          `❌ Failed to reprocess ${feedback.anonymous_id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error('Auto reprocess job error:', error.message);
  }
}

module.exports = { reprocessStuckFeedback };