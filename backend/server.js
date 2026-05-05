require('dotenv').config();

const cron = require('node-cron');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');

const { initSocketIO } = require('./socket');
const { reprocessStuckFeedback } = require('./jobs/reprocessStuckFeedback');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

app.use(cors({
  origin: [
    'https://studentfeedback.com',
    'https://www.studentfeedback.com',
    'https://claribox-app-jjmk.vercel.app',
    'http://localhost:5173',
  ],
  credentials: true,
}));

app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
}));

// ─────────────────────────────────────────────
// Socket.IO
// Must be initialized before routes because routes emit events.
// ─────────────────────────────────────────────

initSocketIO(server);

// ─────────────────────────────────────────────
// Background recovery job
// Automatically retries feedback that failed or got stuck.
// Lock prevents overlapping runs.
// ─────────────────────────────────────────────

let isReprocessing = false;

async function runReprocessJob() {
  if (isReprocessing) return;

  isReprocessing = true;

  try {
    await reprocessStuckFeedback();
  } catch (error) {
    console.error('Auto reprocess job failed:', error.message);
  } finally {
    isReprocessing = false;
  }
}

// ─────────────────────────────────────────────
// Database
// Start recovery only after MongoDB connects.
// ─────────────────────────────────────────────

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');

    // Run once on startup.
    runReprocessJob();

    // Then keep checking every 5 minutes.
    cron.schedule('*/5 * * * *', runReprocessJob);
  })
  .catch((err) => {
    console.error('❌ MongoDB Error:', err.message);
  });

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/Notificationroutes'));

// ─────────────────────────────────────────────
// Weekly report
// Runs every Monday at 8:00 AM.
// ─────────────────────────────────────────────

cron.schedule('0 8 * * 1', async () => {
  try {
    console.log('⏰ Running weekly feedback report...');

    const { generateAndSendWeeklyReport } = require('./services/weeklyReport');
    await generateAndSendWeeklyReport();
  } catch (error) {
    console.error('Weekly report error:', error.message);
  }
});

// ─────────────────────────────────────────────
// Inactivity reminder
// Runs every day at 9:00 AM.
// ─────────────────────────────────────────────

cron.schedule('0 9 * * *', async () => {
  try {
    const Admin = require('./models/Admin');
    const Feedback = require('./models/Feedback');
    const { sendInactivityReminder } = require('./services/emailService');

    const admin = await Admin.findOne().sort({ lastLogin: -1 });
    if (!admin?.lastLogin) return;

    const daysSinceLogin =
      (Date.now() - new Date(admin.lastLogin)) / (1000 * 60 * 60 * 24);

    if (daysSinceLogin < 3) return;

    const since = new Date();
    since.setDate(since.getDate() - 3);

    const unreadCount = await Feedback.countDocuments({
      createdAt: { $gte: since },
    });

    if (unreadCount <= 0) return;

    console.log(
      `Admin inactive for ${Math.floor(daysSinceLogin)} days — sending reminder`
    );

    await sendInactivityReminder(unreadCount);
  } catch (error) {
    console.error('Inactivity check error:', error.message);
  }
});

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ClariBox API is running',
  });
});

// ─────────────────────────────────────────────
// Start server
// Use server.listen, not app.listen, because Socket.IO needs the HTTP server.
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});