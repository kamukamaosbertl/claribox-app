// Express router setup for admin routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// JWT for token verification
const jwt = require('jsonwebtoken');

// Models
const Feedback = require('../models/Feedback');
const Admin = require('../models/Admin');
const Resolution = require('../models/Resolution');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/admin');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `admin-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Authentication middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Helper function to calculate start date based on filter
const getStartDate = (filter) => {
  let startDate = null;
  
  if (filter === '7days') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else if (filter === '30days') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  } else if (filter === 'semester') {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 4);
  }
  
  return startDate;
};

// ============================================
// PROFILE ROUTES
// ============================================

// GET /api/admin/profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Fetching profile for admin ID:', req.adminId);
    
    const admin = await Admin.findById(req.adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    res.json({
      success: true,
      data: {
        name: admin.name,
        email: admin.email,
        profilePicture: admin.profilePicture,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/profile
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email } = req.body;
    
    console.log('Updating profile for admin ID:', req.adminId);
    console.log('File uploaded:', req.file);
    
    const updateData = { name, email };
    
    // If a new profile picture was uploaded
    if (req.file) {
      updateData.profilePicture = `/uploads/admin/${req.file.filename}`;
    }
    
    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      data: {
        name: admin.name,
        email: admin.email,
        profilePicture: admin.profilePicture,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// FEEDBACK ROUTES
// ============================================

// GET /feedback - with date filtering
router.get('/feedback', auth, async (req, res) => {
  try {
    const { category, status, sort, limit, page, filter } = req.query;
    const query = {};
    
    // Add category filter
    if (category && category !== 'all') query.category = category;
    
    // Add status filter
    if (status && status !== 'all') query.status = status;
    
    // Add date filter
    const startDate = getStartDate(filter);
    if (startDate) {
      query.createdAt = { $gte: startDate };
    }

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;

    const feedback = await Feedback.find(query)
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Feedback.countDocuments(query);

    res.json({ 
      success: true, 
      data: feedback, 
      total, 
      page: pageNum, 
      pages: Math.ceil(total / limitNum) 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /analytics - with date filtering
router.get('/analytics', auth, async (req, res) => {
  try {
    const { filter } = req.query;
    
    // Calculate start date based on filter
    const startDate = getStartDate(filter);
    const matchQuery = startDate ? { createdAt: { $gte: startDate } } : {};


    console.log("Filter received:", filter);
    console.log("Match query:", matchQuery);
    const total = await Feedback.countDocuments(matchQuery);
    // Get stats based on filter
    const resolved = await Resolution.countDocuments({ 
  ...matchQuery,       // only consider resolutions after startDate if filter applied
      isPublished: true    // only count published resolutions
    });

    // 🔹 NEW: Get sentiment stats
    const positive = await Feedback.countDocuments({ ...matchQuery, sentiment: 'positive' });
    const neutral = await Feedback.countDocuments({ ...matchQuery, sentiment: 'neutral' });
    const negative = await Feedback.countDocuments({ ...matchQuery, sentiment: 'negative' });
    
    // Calculate overall sentiment score (-1 to 1)
    const overallScore = total > 0 ? (positive - negative) / total : 0;

    // Category stats with date filter
    const categoryStats = await Feedback.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Time stats with date filter
    const timeStats = await Feedback.aggregate([
      { $match: matchQuery },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, feedback: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    res.json({
      success: true,
      stats: { 
        total, 
        resolved 
      },
      sentiment: {
        positive,
        neutral,
        negative,
        overallScore: Math.round(overallScore * 100) / 100
      },
      categoryData: categoryStats.map(c => ({ name: c._id, count: c.count, value: c.count })),
      timeData: timeStats.map(t => ({ date: t._id, feedback: t.feedback }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
//total suggestion route

// GET /stats/time - with date filtering
router.get('/stats/time', auth, async (req, res) => {
  try {
    const { period, filter } = req.query;
    
    // Use period or filter parameter
    let days = 7;
    if (period === '30d' || filter === '30days') days = 30;
    if (period === '90d') days = 90;
    if (period === 'year' || filter === 'semester') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeStats = await Feedback.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, feedback: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ 
      success: true, 
      data: timeStats.map(t => ({ date: t._id, feedback: t.feedback }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /trends - with date filtering
router.get('/trends', auth, async (req, res) => {
  try {
    const { filter } = req.query;
    
    // Calculate start date based on filter
    const startDate = getStartDate(filter);
    const matchQuery = startDate ? { createdAt: { $gte: startDate } } : {};

    const trends = await Feedback.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const formatted = trends.map(t => ({
      title: t._id,
      count: t.count,
      trend: 'up'
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /feedback/:id
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

// 🔹 GET all resolutions
router.get('/resolutions', auth, async (req, res) => {
  try {
    const resolutions = await Resolution.find()
      .sort({ createdAt: -1 })
      .populate('resolvedBy', 'name'); // Show admin name for internal debugging
    res.json({ success: true, data: resolutions });
  } catch (error) {
    console.error('Error fetching resolutions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 🔹 POST a new resolution
router.post('/resolutions', auth, async (req, res) => {
  try {
    const { title, description, category, affectedFeedbackIds } = req.body;

    // Create new resolution object
    const resolution = new Resolution({
      title,
      description,
      category,
      affectedFeedbackIds: affectedFeedbackIds || [],
      resolvedBy: req.adminId, // Auth middleware sets adminId
      isPublished: true
    });

    await resolution.save(); // Save to DB

    res.status(201).json({ success: true, data: resolution });
  } catch (error) {
    console.error('Error creating resolution:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 🔹 DELETE resolution by ID
router.delete('/resolutions/:id', auth, async (req, res) => {
  try {
    await Resolution.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resolution deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
module.exports = router;