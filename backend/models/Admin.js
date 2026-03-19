const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true },

  // Password is optional — Google accounts don't have one
  password:       { type: String, minlength: 6, default: null },

  // Google OAuth fields
  googleId:       { type: String, default: null },

  profilePicture: { type: String, default: null },
  role:           { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  createdAt:      { type: Date, default: Date.now },
  lastLogin:      { type: Date }
});

// Hash password before saving — only if password exists and was modified
adminSchema.pre('save', async function(next) {
  if (!this.password)               return next();
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password — returns false if no password set (Google account)
adminSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
adminSchema.methods.toJSON = function() {
  const admin = this.toObject();
  delete admin.password;
  delete admin.googleId;
  return admin;
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;