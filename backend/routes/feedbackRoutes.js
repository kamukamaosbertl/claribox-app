// Express router module for handling feedback-related API endpoints
// Provides routes for submitting feedback and retrieving public statistics

const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

/**
 * POST /submit - Submit new student feedback
 * Validates input fields and saves anonymous feedback to database
 */
router.post('/submit', async (req, res) => {
  try {
    // Destructure category and text from request body
    const { category, feedback } = req.body;
    
    // Validate that both required fields are present before processing
    if (!category || !feedback) {
      return res.status(400).json({ success: false, message: 'Category and feedback are required' });
    }

    // Create new feedback document with category and text
    const newFeedback = new Feedback({ category, text: feedback });
    await newFeedback.save();

    // Return success response with the anonymous ID for reference
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { id: newFeedback.anonymous_id }
    });
  } catch (error) {
    // Handle server errors and return appropriate error message
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /stats/public - Retrieve public feedback statistics
 * Calculates total, resolved, pending counts and resolution percentage
 */
router.get('/stats/public', async (req, res) => {
  try {
    // Get total count of all feedback documents
    const total = await Feedback.countDocuments();
    // Get count of resolved feedback items
    const resolved = await Feedback.countDocuments({ status: 'resolved' });
    
    // Return aggregated statistics with calculated fields
    res.json({
      total,
      resolved,
      pending: total - resolved,
      // Estimated student count (multiplier based on feedback total)
      students: total > 0 ? total * 3 : 0,
      // Calculate resolution percentage rounded to nearest integer
      resolvedPercentage: total > 0 ? Math.round((resolved / total) * 100) : 0
    });
  } catch (error) {
    // Handle server errors and return appropriate error message
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
