const mongoose = require('mongoose');

// ── Notification Model ────────────────────────────────────────────────────────
// Stores notifications for the admin
// Created automatically when certain feedback conditions are met
const notificationSchema = new mongoose.Schema({

  // Type of notification — determines icon and color in the UI
  type: {
    type: String,
    enum: [
      'negative_feedback',  // A negative feedback was submitted
      'category_spike',     // A category has many feedbacks today
      'new_feedback'        // General new feedback notification
    ],
    required: true
  },

  // Short title shown in the notification dropdown
  title: {
    type:     String,
    required: true
  },

  // Longer description with more detail
  message: {
    type:     String,
    required: true
  },

  // Which category this notification is about (optional)
  category: {
    type:    String,
    default: null
  },

  // Link to navigate to when admin clicks this notification
  link: {
    type:    String,
    default: '/admin/dashboard'
  },

  // Whether the admin has read this notification
  // false = unread (shows red dot on bell)
  // true  = read (no longer counts toward unread badge)
  isRead: {
    type:    Boolean,
    default: false
  },

  createdAt: {
    type:    Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Notification', notificationSchema);