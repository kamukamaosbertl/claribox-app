// Load environment variables from .env file
require('dotenv').config();

// Import node-cron for scheduling the weekly email report
const cron = require('node-cron');

// Import Express.js framework for building the web server
const express = require('express');

// Import Mongoose for MongoDB object modeling
const mongoose = require('mongoose');

// Import CORS middleware to allow cross-origin requests
const cors = require('cors');

// Initialize the Express application
const app = express();

// Apply CORS middleware to enable cross-origin resource sharing
app.use(cors());

// Apply Express.json() middleware to parse incoming JSON request bodies
app.use(express.json());

// Connect to MongoDB database using the URI from environment variables
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// ── Routes ────────────────────────────────────────────────────────────────────

// Authentication — register, login, Google OAuth
app.use('/api/auth',          require('./routes/authRoutes'));

// Student feedback submission
app.use('/api/feedback',      require('./routes/feedbackRoutes'));

// Admin dashboard — analytics, profile, resolutions
app.use('/api/admin',         require('./routes/adminRoutes'));

// AI chat and summaries — RAG pipeline with Groq
app.use('/api/ai',            require('./routes/aiRoutes'));

// Notifications — bell icon alerts for admin
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ── Weekly email report — every Monday at 8am ────────────────────────────────
cron.schedule('0 8 * * 1', async () => {
  console.log('⏰ Running weekly feedback report...');
  const { generateAndSendWeeklyReport } = require('./services/weeklyReport');
  await generateAndSendWeeklyReport();
});

// ── Inactivity reminder — every day at 9am ────────────────────────────────────
// Checks if admin has not logged in for 3+ days
// If so sends a reminder email with unread feedback count
cron.schedule('0 9 * * *', async () => {
  try {
    const Admin    = require('./models/Admin');
    const Feedback = require('./models/Feedback');
    const { sendInactivityReminder } = require('./services/emailService');

    // Find the most recently logged in admin
    const admin = await Admin.findOne().sort({ lastLogin: -1 });
    if (!admin || !admin.lastLogin) return;

    // Check if last login was more than 3 days ago
    const daysSinceLogin = (Date.now() - new Date(admin.lastLogin)) / (1000 * 60 * 60 * 24);

    if (daysSinceLogin >= 3) {
      // Count feedback from last 3 days
      const since = new Date();
      since.setDate(since.getDate() - 3);
      const unreadCount = await Feedback.countDocuments({ createdAt: { $gte: since } });

      // Only send if there is actually new feedback to check
      if (unreadCount > 0) {
        console.log(`Admin inactive for ${Math.floor(daysSinceLogin)} days — sending reminder`);
        await sendInactivityReminder(unreadCount);
      }
    }
  } catch (error) {
    console.error('Inactivity check error:', error.message);
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ClariBox API is running' });
});


// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});