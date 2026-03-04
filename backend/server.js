// Load environment variables from .env file
require('dotenv').config();

// Import Express.js framework for building the web server
const express = require('express');

// Import Mongoose for MongoDB object modeling
const mongoose = require('mongoose');

// Import CORS middleware to allow cross-origin requests
const cors = require('cors');

// Initialize the Express application
const app = express();

// Apply CORS middleware to enable cross-origin resource sharing
app.use(cors());

// Apply Express.json() middleware to parse incoming JSON request bodies
app.use(express.json());

// Connect to MongoDB database using the URI from environment variables
mongoose.connect(process.env.MONGODB_URI)
  // Success callback: log when connection is established
  .then(() => console.log('✅ MongoDB Connected'))
  // Error callback: log connection errors
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// Mount authentication routes at /api/auth
app.use('/api/auth', require('./routes/authRoutes'));

// Mount feedback routes at /api/feedback
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Mount admin routes at /api/admin
app.use('/api/admin', require('./routes/adminRoutes'));

// Mount AI-related routes at /api/ai
app.use('/api/ai', require('./routes/aiRoutes'));

// Define a health check endpoint to verify the server is running
app.get('/api/health', (req, res) => {
  // Return a JSON response indicating the API is operational
  res.json({ status: 'ok', message: 'ClariBox API is running' });
});

// Get the port number from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Start the Express server and listen on the specified port
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
