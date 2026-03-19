// Express router setup for admin routes
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const jwt        = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary'); // Cloudinary for profile pictures

// Models
const Feedback   = require('../models/Feedback');
const Admin      = require('../models/Admin');
const Resolution = require('../models/Resolution');

// ── Multer — memory storage (file goes to Cloudinary not disk) ────────────────
// We no longer save files locally — they go straight to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const valid = allowed.test(file.mimetype) && allowed.test(file.originalname.toLowerCase());
    valid ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// ── Auth middleware — verifies JWT token on every protected route ──────────────
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

// ── Helper — calculate start date based on filter value ───────────────────────
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

// ── Helper — upload buffer to Cloudinary ──────────────────────────────────────
// Takes a file buffer and uploads it to Cloudinary
// Returns the secure URL of the uploaded image
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        // Crop and resize to square — good for profile pictures
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

// GET /api/admin/profile
// Returns the logged-in admin's profile data
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
        profilePicture: admin.profilePicture, // Cloudinary URL or Google photo URL
        role:           admin.role
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/profile
// Updates admin name, email, and/or profile picture
// Profile picture is uploaded to Cloudinary — URL saved in MongoDB
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    // Only update fields that were actually sent
    if (name)  updateData.name  = name;
    if (email) updateData.email = email;

    // If a new profile picture was uploaded
    if (req.file) {
      // Upload image buffer to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, 'admin-profiles');
      // Save Cloudinary URL to MongoDB — not a local path
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
// FEEDBACK ROUTES
// ============================================================

// GET /api/admin/feedback — with filters and pagination
router.get('/feedback', auth, async (req, res) => {
  try {
    const { category, status, sort, limit, page, filter } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (status   && status   !== 'all') query.status   = status;

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

    const [total, positive, neutral, negative] = await Promise.all([
      Feedback.countDocuments(matchQuery),
      Feedback.countDocuments({ ...matchQuery, sentiment: 'positive' }),
      Feedback.countDocuments({ ...matchQuery, sentiment: 'neutral'  }),
      Feedback.countDocuments({ ...matchQuery, sentiment: 'negative' }),
    ]);

    const resolved = await Resolution.countDocuments({
      ...matchQuery,
      isPublished: true
    });

    const overallScore = total > 0 ? (positive - negative) / total : 0;

    const [categoryStats, timeStats] = await Promise.all([
      Feedback.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Feedback.aggregate([
        { $match: matchQuery },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, feedback: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ])
    ]);

    res.json({
      success:      true,
      stats:        { total, resolved },
      sentiment:    { positive, neutral, negative, overallScore: Math.round(overallScore * 100) / 100 },
      categoryData: categoryStats.map(c => ({ name: c._id, count: c.count, value: c.count })),
      timeData:     timeStats.map(t => ({ date: t._id, feedback: t.feedback }))
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
    const { filter }   = req.query;
    const startDate    = getStartDate(filter);
    const matchQuery   = startDate ? { createdAt: { $gte: startDate } } : {};

    const trends = await Feedback.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: trends.map(t => ({ title: t._id, count: t.count, trend: 'up' }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/feedback/:id — update feedback status
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

// GET /api/admin/resolutions
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

// POST /api/admin/resolutions
router.post('/resolutions', auth, async (req, res) => {
  try {
    const { title, description, category, affectedFeedbackIds } = req.body;
    const resolution = new Resolution({
      title,
      description,
      category,
      affectedFeedbackIds: affectedFeedbackIds || [],
      resolvedBy:  req.adminId,
      isPublished: true
    });
    await resolution.save();
    res.status(201).json({ success: true, data: resolution });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/resolutions/:id
router.delete('/resolutions/:id', auth, async (req, res) => {
  try {
    await Resolution.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resolution deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;