const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// ChatSession Model
//
// PURPOSE:
//   Stores conversation history across browser sessions so the admin
//   can close the dashboard and come back to continue where they left off.
//   This is what gives the AI "memory" — just like Meta AI remembers context.
//
// HOW IT WORKS:
//   1. When admin starts chatting, frontend generates a sessionId (UUID)
//      and stores it in localStorage
//   2. Every message is saved to this model under that sessionId
//   3. When admin reopens the dashboard, frontend sends the sessionId
//      and we load the last N messages as history
//   4. Sessions auto-delete after 24 hours (TTL index) — keeps DB clean
//
// FIELDS:
//   sessionId  — unique browser-generated ID (stored in localStorage)
//   messages   — array of { question, answer, timestamp }
//   createdAt  — auto-managed by mongoose timestamps
//   expiresAt  — TTL field: MongoDB auto-deletes this document after 24h
// ─────────────────────────────────────────────

const messageSchema = new mongoose.Schema({
    question:  { type: String, required: true },
    answer:    { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false }); // no individual IDs needed for message subdocs

const chatSessionSchema = new mongoose.Schema({
    sessionId: {
        type:     String,
        required: true,
        unique:   true,
        index:    true  // fast lookup by sessionId on every request
    },
    messages: {
        type:    [messageSchema],
        default: []
    },
    expiresAt: {
        type:    Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        index:   { expireAfterSeconds: 0 } // MongoDB TTL index — auto-deletes expired docs
    }
}, {
    timestamps: true // adds createdAt and updatedAt automatically
});

// Keep only the last 50 messages per session to avoid documents growing too large
chatSessionSchema.methods.addMessage = function(question, answer) {
    this.messages.push({ question, answer, timestamp: new Date() });
    if (this.messages.length > 50) {
        this.messages = this.messages.slice(-50); // keep only last 50
    }
    // Refresh the 24h expiry every time admin sends a message
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);