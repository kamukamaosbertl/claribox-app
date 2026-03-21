// socket.js
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');

let io = null;

function initSocketIO(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin:      process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Verify JWT on every socket connection
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token
            || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded    = jwt.verify(token, process.env.JWT_SECRET);
            socket.adminId   = decoded.id || decoded._id;
            socket.adminName = decoded.name || 'Admin';
            next();
        } catch (err) {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Admin connected: ${socket.adminName} (${socket.id})`);
        socket.join('admins');

        // Tell other admins this admin came online
        socket.to('admins').emit('admin:online', {
            adminId:   socket.adminId,
            adminName: socket.adminName,
            timestamp: new Date()
        });

        // When admin resolves feedback — notify other admins
        socket.on('feedback:resolved', ({ feedbackId, category }) => {
            socket.to('admins').emit('feedback:resolved', {
                feedbackId,
                category,
                resolvedBy: socket.adminName,
                timestamp:  new Date()
            });
        });

        socket.on('disconnect', () => {
            console.log(`Admin disconnected: ${socket.adminName}`);
            io.to('admins').emit('admin:offline', {
                adminId:   socket.adminId,
                adminName: socket.adminName
            });
        });
    });

    console.log('Socket.IO initialised ✅');
    return io;
}

function getIO() {
    if (!io) throw new Error('Socket.IO not initialised');
    return io;
}

// ── Emit new notification to all admin bells ─────────────────────
// Payload matches what your bell UI already reads from the API:
// { notificationId, type, title, message, category, link, timestamp }
function emitNewFeedback(notificationData) {
    if (!io) return;
    io.to('admins').emit('notification:new', notificationData);
}

// ── Emit urgent alert — shown as banner above dashboard ──────────
function emitUrgentAlert(feedbackData, reason) {
    if (!io) return;
    io.to('admins').emit('feedback:urgent', {
        id:        feedbackData._id,
        category:  feedbackData.category,
        preview:   feedbackData.feedback?.slice(0, 150),
        reason,
        timestamp: new Date()
    });
}

// ── Emit live stats update — refreshes dashboard counts ──────────
function emitStatsUpdate(stats) {
    if (!io) return;
    io.to('admins').emit('stats:updated', stats);
}

module.exports = { initSocketIO, getIO, emitNewFeedback, emitUrgentAlert, emitStatsUpdate };