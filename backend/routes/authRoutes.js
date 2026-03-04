// Authentication routes for admin users
// Handles registration, login, and JWT token generation

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Generates a JWT token for authenticated users
// Token includes user ID and role, expires in 7 days
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Admin registration endpoint
// Creates a new admin account after validating email uniqueness
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if email is already registered
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create and save new admin
    const admin = new Admin({ name, email, password });
    await admin.save();

    // Generate authentication token
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

// Admin login endpoint
// Authenticates admin credentials and returns JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }


    

    // Update last login timestamp
    admin.lastLogin = new Date();
    await admin.save();

    // Generate authentication token
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

module.exports = router;
