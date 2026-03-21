require('dotenv').config();

const cron      = require('node-cron');
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

// NEW: Import http and Socket.IO
// http.createServer wraps Express so Socket.IO can attach to it
// Without this Socket.IO cannot work — it needs the raw http server
const http             = require('http');
const { initSocketIO } = require('./socket');

const app    = express();
// NEW: Wrap Express in http.Server
// OLD: const app = express(); app.listen(...)
// NEW: const server = http.createServer(app); server.listen(...)
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      200,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { status: 'error', message: 'Too many requests, please try again later.' }
}));

// ── Database ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// NEW: Initialise Socket.IO BEFORE routes
// feedbackRoutes.js calls emitNewFeedback() from socket.js
// so Socket.IO must be ready before any route is registered
initSocketIO(server);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/feedback',      require('./routes/feedbackRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/ai',            require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ── Weekly email report — every Monday at 8am ────────────────────────────────
cron.schedule('0 8 * * 1', async () => {
  console.log('⏰ Running weekly feedback report...');
  const { generateAndSendWeeklyReport } = require('./services/weeklyReport');
  await generateAndSendWeeklyReport();
});

// ── Inactivity reminder — every day at 9am ───────────────────────────────────
cron.schedule('0 9 * * *', async () => {
  try {
    const Admin    = require('./models/Admin');
    const Feedback = require('./models/Feedback');
    const { sendInactivityReminder } = require('./services/emailService');

    const admin = await Admin.findOne().sort({ lastLogin: -1 });
    if (!admin || !admin.lastLogin) return;

    const daysSinceLogin = (Date.now() - new Date(admin.lastLogin)) / (1000 * 60 * 60 * 24);

    if (daysSinceLogin >= 3) {
      const since = new Date();
      since.setDate(since.getDate() - 3);
      const unreadCount = await Feedback.countDocuments({ createdAt: { $gte: since } });
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
// NEW: server.listen instead of app.listen
// This is the only other change — server is the http wrapper, not Express directly
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});