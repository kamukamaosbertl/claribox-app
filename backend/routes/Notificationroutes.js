const express      = require('express');
const router       = express.Router();
const jwt          = require('jsonwebtoken');
const Notification = require('../models/Notification');

// ── Auth middleware ───────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── GET /api/notifications ────────────────────────────────────────────────────
// Returns latest 20 notifications + unread count
// Called when admin opens the dashboard or clicks the bell
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 }) // newest first
      .limit(20);

    // Count unread — this is the number shown on the red dot
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      data:    notifications,
      unread:  unreadCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
// Marks a single notification as read
// Called when admin clicks a specific notification
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
// Marks ALL notifications as read
// Called when admin clicks "Mark all as read"
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
// Deletes a single notification
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;