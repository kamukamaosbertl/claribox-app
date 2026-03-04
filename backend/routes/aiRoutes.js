const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    const total = await Feedback.countDocuments();
    const pending = await Feedback.countDocuments({ status: 'pending' });
    const resolved = await Feedback.countDocuments({ status: 'resolved' });
    
    const categoryStats = await Feedback.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    let response = 'I understand your question. Ask me about feedback statistics.';
    
    const msg = message.toLowerCase();
    
    if (msg.includes('total')) {
      response = `There are ${total} total feedback submissions.`;
    } else if (msg.includes('pending')) {
      response = `There are ${pending} pending feedbacks.`;
    } else if (msg.includes('category') && categoryStats.length > 0) {
      response = `Top category: ${categoryStats[0]._id} with ${categoryStats[0].count} feedbacks.`;
    }

    res.json({ success: true, answer: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;