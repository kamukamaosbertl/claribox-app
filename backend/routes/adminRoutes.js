// Express router setup for admin routes
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const jwt        = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');

// Models
const Feedback   = require('../models/Feedback');
const Admin      = require('../models/Admin');
const Resolution = require('../models/Resolution');

// ── Multer — memory storage ───────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const valid = allowed.test(file.mimetype) && allowed.test(file.originalname.toLowerCase());
    valid ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

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

// ── Helper — calculate start date based on filter value ──────────────────────
const getStartDate = (filter) => {
  if (filter === '7days') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (filter === '30days') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (filter === 'semester') {
    const d = new Date();
    d.setMonth(d.getMonth() - 4);
    return d;
  }
  return null;
};

// ── Helper — upload buffer to Cloudinary ─────────────────────────────────────
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }]
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

// ============================================================
// PROFILE ROUTES
// ============================================================

router.get('/profile', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({
      success: true,
      data: {
        name:           admin.name,
        email:          admin.email,
        profilePicture: admin.profilePicture,
        role:           admin.role
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    if (name)  updateData.name  = name;
    if (email) updateData.email = email;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'admin-profiles');
      updateData.profilePicture = result.secure_url;
    }

    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: {
        name:           admin.name,
        email:          admin.email,
        profilePicture: admin.profilePicture,
        role:           admin.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// NOTIFICATION PREFERENCES ROUTES
// ============================================================

router.get('/notification-prefs', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('notificationPrefs');
    res.json({
      success: true,
      data: admin?.notificationPrefs || {
        emailWeeklyReport: true,
        emailSpikeAlert:   true,
        emailInactivity:   true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/notification-prefs', auth, async (req, res) => {
  try {
    const { emailWeeklyReport, emailSpikeAlert, emailInactivity } = req.body;
    await Admin.findByIdAndUpdate(req.adminId, {
      notificationPrefs: { emailWeeklyReport, emailSpikeAlert, emailInactivity }
    });
    res.json({ success: true, message: 'Preferences saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// FEEDBACK ROUTES
// ============================================================

router.get('/feedback', auth, async (req, res) => {
  try {
    const { category, status, sentiment,emotion , sort, limit, page, filter } = req.query;
    const query = {};

    if (category  && category  !== 'all') query.category  = category;
    if (status    && status    !== 'all') query.status    = status;
    if (sentiment && sentiment !== 'all') query.sentiment = sentiment;
    if (emotion  && emotion  !== 'all') query.emotion  = emotion;

    const startDate = getStartDate(filter);
    if (startDate) query.createdAt = { $gte: startDate };

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const limitNum   = parseInt(limit) || 20;
    const pageNum    = parseInt(page)  || 1;

    const feedback = await Feedback.find(query)
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data:    feedback,
      total,
      page:    pageNum,
      pages:   Math.ceil(total / limitNum)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/analytics — dashboard stats with date filtering
router.get('/analytics', auth, async (req, res) => {
  try {
    const { filter } = req.query;
    const startDate  = getStartDate(filter);
    const matchQuery = startDate ? { createdAt: { $gte: startDate } } : {};

    console.log('Filter received:', filter);
    console.log('Match query:', matchQuery);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const [
      total,
      positive,
      neutral,
      negative,
      resolved,
      thisWeekCount,
      lastWeekCount,
      categoryStats,
      timeStats,
      // ── NEW: emotion counts aggregation ──────────────────────
      emotionStats
    ] = await Promise.all([
      Feedback.countDocuments(matchQuery),
      Feedback.countDocuments({ ...matchQuery, sentiment: 'positive' }),
      Feedback.countDocuments({ ...matchQuery, sentiment: 'neutral'  }),
      Feedback.countDocuments({ ...matchQuery, sentiment: 'negative' }),
      Resolution.countDocuments({ ...matchQuery, isPublished: true }),
      Feedback.countDocuments({ createdAt: { $gte: thisWeekStart } }),
      Feedback.countDocuments({ createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd } }),
      Feedback.aggregate([
          { $match: matchQuery },
          { $group: {
              _id: '$category',
              count:   { $sum: 1 },
              emotions: { $push: '$emotion' }
          }},
          { $sort: { count: -1 } }
      ]),
      Feedback.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            feedback: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      // ── NEW: count each emotion label across all feedback ────
      // Only counts feedback where emotion is not null
      Feedback.aggregate([
        { $match: { ...matchQuery, emotion: { $ne: null } } },
        { $group: { _id: '$emotion', count: { $sum: 1 } } }
      ])
    ]);

    const overallScore = total > 0 ? (positive - negative) / total : 0;

    // ── NEW: convert emotion array to flat object ────────────
    // e.g. [{ _id: 'angry', count: 4 }] → { angry: 4, ... }
    const emotions = {
      excited:         0,
      satisfied:       0,
      hopeful:         0,
      angry:           0,
      disappointed:    0,
      confused:        0,
      neutral_emotion: 0
    };
    emotionStats.forEach(e => {
      if (e._id && emotions.hasOwnProperty(e._id)) {
        emotions[e._id] = e.count;
      }
    });

    res.json({
      success: true,
      stats: {
        total,
        resolved,
        thisWeekCount,
        lastWeekCount
      },
      sentiment: {
        positive,
        neutral,
        negative,
        overallScore: Math.round(overallScore * 100) / 100,
        emotions      // ← added: emotion breakdown for dashboard chart
      },
      categoryData: categoryStats.map(c => {
          const emotionCounts = {};
          (c.emotions || []).forEach(e => {
              const key = e || 'neutral_emotion';
              emotionCounts[key] = (emotionCounts[key] || 0) + 1;
          });
          if (Object.keys(emotionCounts).length > 1) {
              delete emotionCounts['neutral_emotion'];
          }
          return {
              name:     c._id,
              count:    c.count,
              value:    c.count,
              emotions: emotionCounts
          };
      }),
      timeData: timeStats.map(t => ({
        date:     t._id,
        feedback: t.feedback
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/stats/time
router.get('/stats/time', auth, async (req, res) => {
  try {
    const { period, filter } = req.query;
    let days = 7;
    if (period === '30d'  || filter === '30days')  days = 30;
    if (period === '90d')                           days = 90;
    if (period === 'year' || filter === 'semester') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeStats = await Feedback.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, feedback: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: timeStats.map(t => ({ date: t._id, feedback: t.feedback })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/trends
router.get('/trends', auth, async (req, res) => {
  try {
    const { filter } = req.query;
    const startDate  = getStartDate(filter);
    const matchQuery = startDate ? { createdAt: { $gte: startDate } } : {};

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const trends   = await Feedback.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const thisWeek = await Feedback.aggregate([
      { $match: { createdAt: { $gte: thisWeekStart } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const lastWeek = await Feedback.aggregate([
      { $match: { createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const thisWeekMap = {};
    const lastWeekMap = {};
    thisWeek.forEach(t => thisWeekMap[t._id] = t.count);
    lastWeek.forEach(t => lastWeekMap[t._id] = t.count);

    const formatted = trends.map(t => {
      const thisCount = thisWeekMap[t._id] || 0;
      const lastCount = lastWeekMap[t._id] || 0;

      let trend = 'stable';
      if (thisCount > lastCount) trend = 'up';
      if (thisCount < lastCount) trend = 'down';

      return {
        title:    t._id,
        count:    t.count,
        trend,
        thisWeek: thisCount,
        lastWeek: lastCount,
        change:   thisCount - lastCount
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/feedback/:id
router.put('/feedback/:id', auth, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status, admin_notes },
      { new: true }
    );
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// RESOLUTION ROUTES
// ============================================================

router.get('/resolutions', auth, async (req, res) => {
  try {
    const resolutions = await Resolution.find()
      .sort({ createdAt: -1 })
      .populate('resolvedBy', 'name');
    res.json({ success: true, data: resolutions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/resolutions', auth, async (req, res) => {
  try {
    const { title, description, category, affectedFeedbackIds } = req.body;
    const resolution = new Resolution({
      title,
      description,
      category,
      affectedFeedbackIds: affectedFeedbackIds || [],
      resolvedBy:          req.adminId,
      isPublished:         true
    });
    await resolution.save();
    res.status(201).json({ success: true, data: resolution });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/resolutions/:id', auth, async (req, res) => {
  try {
    await Resolution.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resolution deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;