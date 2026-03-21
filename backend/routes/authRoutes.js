// Authentication routes for admin users
// Handles registration, login, Google OAuth and JWT token generation

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const axios   = require('axios');
const { sendSecurityAlert } = require('../services/emailService');
const Admin   = require('../models/Admin');

// Generates a JWT token for authenticated users
// Token includes user ID and role, expires in 7 days
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const admin = new Admin({ name, email, password });
    await admin.save();

    const token = generateToken(admin._id, admin.role);

    res.json({
      success: true,
      message: 'Admin registered successfully',
      data: { id: admin._id, name: admin.name, email: admin.email, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Block Google-only accounts from password login
    if (admin.googleId && !admin.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please use the Google button.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, admin.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: { id: admin._id, name: admin.name, email: admin.email, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────────
// Receives Google access token from frontend
// Verifies it with Google, then creates or finds admin account
router.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token is required.' });
    }

    // Use the access token to get user info from Google
    const googleRes = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const { sub: googleId, email, name, picture } = googleRes.data;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Could not get email from Google.' });
    }

    // Find existing admin by Google ID or email
    let admin = await Admin.findOne({ $or: [{ googleId }, { email }] });

    if (admin) {
      // Update Google info if logging in with Google for the first time
      if (!admin.googleId) {
        admin.googleId      = googleId;
        admin.profilePicture = picture;
        await admin.save();
      }
    } else {
      // Create new admin account from Google info
      admin = new Admin({
        name,
        email,
        googleId,
        profilePicture: picture,
        // No password for Google accounts
      });
      await admin.save();
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, admin.role);

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        id:    admin._id,
        name:  admin.name,
        email: admin.email,
        token
      }
    });

  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed. Please try again.'
    });
  }
});

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
// Sends security alert email when password is changed
router.post('/change-password', async (req, res) => {
  try {
    const { token, currentPassword, newPassword } = req.body;
    if (!token || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Verify token
    const jwt     = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin   = await Admin.findById(decoded.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Send security alert email
    await sendSecurityAlert(admin.name, 'password');

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;