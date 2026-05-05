const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');

const Feedback = require('../models/Feedback');
const Admin = require('../models/Admin');
const Resolution = require('../models/Resolution');
const { processFeedbackJob } = require('../services/processFeedbackJob');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const valid =
      allowed.test(file.mimetype) &&
      allowed.test(file.originalname.toLowerCase());

    valid ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const getStartDate = filter => {
  const d = new Date();

  if (filter === '7days') {
    d.setDate(d.getDate() - 7);
    return d;
  }

  if (filter === '30days') {
    d.setDate(d.getDate() - 30);
    return d;
  }

  if (filter === 'semester') {
    d.setMonth(d.getMonth() - 4);
    return d;
  }

  return null;
};

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' }
        ]
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    stream.end(buffer);
  });
};

const buildFeedbackQuery = queryParams => {
  const {
    category,
    topic,
    status,
    sentiment,
    emotion,
    filter,
    search,
    ragStatus
  } = queryParams;

  const query = {};

  const selectedCategory = category || topic;

  if (selectedCategory && selectedCategory !== 'all') {
    query.$or = [
      { topicLabel: selectedCategory },
      { topicShortLabel: selectedCategory },
      { category: selectedCategory },
      { tags: selectedCategory }
    ];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (sentiment && sentiment !== 'all') {
    query.sentiment = sentiment;
  }

  if (emotion && emotion !== 'all') {
    query.emotion = emotion;
  }

  if (ragStatus && ragStatus !== 'all') {
    query.ragStatus = ragStatus;
  }

  const startDate = getStartDate(filter);
  if (startDate) {
    query.createdAt = { $gte: startDate };
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');

    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { feedback: regex },
        { evidenceText: regex },
        { topicLabel: regex },
        { topicShortLabel: regex },
        { tags: regex },
        { anonymous_id: regex }
      ]
    });
  }

  return query;
};

const getCategoryField = () => ({
  $ifNull: [
    '$topicLabel',
    {
      $ifNull: [
        '$topicShortLabel',
        {
          $ifNull: ['$category', 'Uncategorized']
        }
      ]
    }
  ]
});

// ============================================================
// PROFILE ROUTES
// ============================================================

router.get('/profile', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
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
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
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
        name: admin.name,
        email: admin.email,
        profilePicture: admin.profilePicture,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

router.get('/notification-prefs', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('notificationPrefs');

    res.json({
      success: true,
      data: admin?.notificationPrefs || {
        emailWeeklyReport: true,
        emailSpikeAlert: true,
        emailInactivity: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/notification-prefs', auth, async (req, res) => {
  try {
    const { emailWeeklyReport, emailSpikeAlert, emailInactivity } = req.body;

    await Admin.findByIdAndUpdate(req.adminId, {
      notificationPrefs: {
        emailWeeklyReport,
        emailSpikeAlert,
        emailInactivity
      }
    });

    res.json({
      success: true,
      message: 'Preferences saved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// FEEDBACK LIST
// ============================================================

router.get('/feedback', auth, async (req, res) => {
  try {
    const {
      sort,
      limit,
      page
    } = req.query;

    const query = buildFeedbackQuery(req.query);

    const sortOption = sort === 'oldest'
      ? { createdAt: 1 }
      : { createdAt: -1 };

    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .sort(sortOption)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),

      Feedback.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: feedback,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Feedback list error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// DASHBOARD ANALYTICS
// ============================================================

router.get('/analytics', auth, async (req, res) => {
  try {
    const matchQuery = buildFeedbackQuery(req.query);

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
      sentimentStats,
      emotionStats,
      timeStats,
      ragStats,
      topTags
    ] = await Promise.all([
      Feedback.countDocuments(matchQuery),

      Feedback.countDocuments({
        ...matchQuery,
        sentiment: 'positive'
      }),

      Feedback.countDocuments({
        ...matchQuery,
        sentiment: 'neutral'
      }),

      Feedback.countDocuments({
        ...matchQuery,
        sentiment: 'negative'
      }),

      Resolution.countDocuments({
        isPublished: true
      }),

      Feedback.countDocuments({
        createdAt: { $gte: thisWeekStart }
      }),

      Feedback.countDocuments({
        createdAt: {
          $gte: lastWeekStart,
          $lte: lastWeekEnd
        }
      }),

      Feedback.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: getCategoryField(),
            count: { $sum: 1 },
            positive: {
              $sum: {
                $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0]
              }
            },
            neutral: {
              $sum: {
                $cond: [{ $eq: ['$sentiment', 'neutral'] }, 1, 0]
              }
            },
            negative: {
              $sum: {
                $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0]
              }
            },
            emotions: { $push: '$emotion' },
            tags: { $push: '$tags' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      Feedback.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $ifNull: ['$sentiment', 'unknown']
            },
            count: { $sum: 1 }
          }
        }
      ]),

      Feedback.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $ifNull: ['$emotion', 'neutral']
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      Feedback.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            feedback: { $sum: 1 },
            positive: {
              $sum: {
                $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0]
              }
            },
            neutral: {
              $sum: {
                $cond: [{ $eq: ['$sentiment', 'neutral'] }, 1, 0]
              }
            },
            negative: {
              $sum: {
                $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),

      Feedback.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $ifNull: ['$ragStatus', 'not_indexed']
            },
            count: { $sum: 1 }
          }
        }
      ]),

      Feedback.aggregate([
        { $match: matchQuery },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const overallScore = total > 0
      ? Math.round(((positive - negative) / total) * 100) / 100
      : 0;

    const sentimentBreakdown = {
      positive,
      neutral,
      negative,
      overallScore
    };

    sentimentStats.forEach(item => {
      if (!sentimentBreakdown[item._id]) {
        sentimentBreakdown[item._id] = item.count;
      }
    });

    const emotionBreakdown = {};
    emotionStats.forEach(item => {
      emotionBreakdown[item._id || 'neutral'] = item.count;
    });

    const ragBreakdown = {};
    ragStats.forEach(item => {
      ragBreakdown[item._id || 'not_indexed'] = item.count;
    });

    const categoryData = categoryStats.map(category => {
      const emotionCounts = {};

      (category.emotions || []).forEach(emotion => {
        const key = emotion || 'neutral';
        emotionCounts[key] = (emotionCounts[key] || 0) + 1;
      });

      return {
        name: category._id || 'Uncategorized',
        count: category.count,
        value: category.count,
        sentiment: {
          positive: category.positive,
          neutral: category.neutral,
          negative: category.negative
        },
        emotions: emotionCounts
      };
    });

    res.json({
      success: true,
      stats: {
        total,
        resolved,
        thisWeekCount,
        lastWeekCount,
        changeFromLastWeek: thisWeekCount - lastWeekCount
      },
      sentiment: {
        ...sentimentBreakdown,
        emotions: emotionBreakdown
      },
      rag: ragBreakdown,
      categoryData,
      timeData: timeStats.map(item => ({
        date: item._id,
        feedback: item.feedback,
        positive: item.positive,
        neutral: item.neutral,
        negative: item.negative
      })),
      topTags: topTags.map(tag => ({
        name: tag._id,
        count: tag.count
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// FILTER OPTIONS FOR DASHBOARD DROPDOWNS
// ============================================================

router.get('/filters', auth, async (req, res) => {
  try {
    const [
      categories,
      sentiments,
      emotions,
      statuses,
      ragStatuses
    ] = await Promise.all([
      Feedback.aggregate([
        {
          $group: {
            _id: getCategoryField()
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Feedback.distinct('sentiment'),
      Feedback.distinct('emotion'),
      Feedback.distinct('status'),
      Feedback.distinct('ragStatus')
    ]);

    res.json({
      success: true,
      data: {
        categories: categories
          .map(c => c._id)
          .filter(Boolean),

        sentiments: sentiments.filter(Boolean),
        emotions: emotions.filter(Boolean),
        statuses: statuses.filter(Boolean),
        ragStatuses: ragStatuses.filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// TIME SERIES
// ============================================================

router.get('/stats/time', auth, async (req, res) => {
  try {
    const { period, filter } = req.query;

    let days = 7;

    if (period === '30d' || filter === '30days') days = 30;
    if (period === '90d') days = 90;
    if (period === 'year' || filter === 'semester') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeStats = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          feedback: { $sum: 1 },
          positive: {
            $sum: {
              $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0]
            }
          },
          neutral: {
            $sum: {
              $cond: [{ $eq: ['$sentiment', 'neutral'] }, 1, 0]
            }
          },
          negative: {
            $sum: {
              $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: timeStats.map(item => ({
        date: item._id,
        feedback: item.feedback,
        positive: item.positive,
        neutral: item.neutral,
        negative: item.negative
      }))
    });
  } catch (error) {
    console.error('Time stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// TRENDS
// ============================================================

router.get('/trends', auth, async (req, res) => {
  try {
    const matchQuery = buildFeedbackQuery(req.query);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const trends = await Feedback.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: getCategoryField(),
          count: { $sum: 1 },
          negative: {
            $sum: {
              $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const thisWeek = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: thisWeekStart }
        }
      },
      {
        $group: {
          _id: getCategoryField(),
          count: { $sum: 1 }
        }
      }
    ]);

    const lastWeek = await Feedback.aggregate([
      {
        $match: {
          createdAt: {
            $gte: lastWeekStart,
            $lte: lastWeekEnd
          }
        }
      },
      {
        $group: {
          _id: getCategoryField(),
          count: { $sum: 1 }
        }
      }
    ]);

    const thisWeekMap = {};
    const lastWeekMap = {};

    thisWeek.forEach(item => {
      thisWeekMap[item._id || 'Uncategorized'] = item.count;
    });

    lastWeek.forEach(item => {
      lastWeekMap[item._id || 'Uncategorized'] = item.count;
    });

    const formatted = trends.map(item => {
      const title = item._id || 'Uncategorized';
      const thisCount = thisWeekMap[title] || 0;
      const lastCount = lastWeekMap[title] || 0;

      let trend = 'stable';
      if (thisCount > lastCount) trend = 'up';
      if (thisCount < lastCount) trend = 'down';

      return {
        title,
        count: item.count,
        negative: item.negative,
        trend,
        thisWeek: thisCount,
        lastWeek: lastCount,
        change: thisCount - lastCount
      };
    });

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// UPDATE FEEDBACK
// ============================================================

router.put('/feedback/:id', auth, async (req, res) => {
  try {
    const {
      status,
      admin_notes,
      topicLabel,
      topicShortLabel
    } = req.body;

    const updateData = {};

    if (status !== undefined) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (topicLabel !== undefined) updateData.topicLabel = topicLabel;
    if (topicShortLabel !== undefined) updateData.topicShortLabel = topicShortLabel;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Feedback update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// RESOLUTIONS
// ============================================================

router.get('/resolutions', auth, async (req, res) => {
  try {
    const resolutions = await Resolution.find()
      .sort({ createdAt: -1 })
      .populate('resolvedBy', 'name');

    res.json({
      success: true,
      data: resolutions
    });
  } catch (error) {
    console.error('Resolutions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/resolutions', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      affectedFeedbackIds
    } = req.body;

    const resolution = new Resolution({
      title,
      description,
      category,
      affectedFeedbackIds: affectedFeedbackIds || [],
      resolvedBy: req.adminId,
      isPublished: true
    });

    await resolution.save();

    res.status(201).json({
      success: true,
      data: resolution
    });
  } catch (error) {
    console.error('Resolution create error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reprocess feedback through RAG and categorisation
router.post('/feedback/:id/reprocess', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    await processFeedbackJob(feedback._id);

    res.json({
      success: true,
      message: 'Feedback reprocessed successfully',
    });
  } catch (error) {
    console.error('Reprocess feedback error:', error.message);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reprocess feedback',
    });
  }
});


router.delete('/resolutions/:id', auth, async (req, res) => {
  try {
    await Resolution.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Resolution deleted'
    });
  } catch (error) {
    console.error('Resolution delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;