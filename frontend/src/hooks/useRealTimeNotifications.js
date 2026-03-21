// hooks/useRealTimeNotifications.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
    || 'http://localhost:5000';

export function useRealTimeNotifications(onNewNotification) {
    const [urgentAlerts,  setUrgentAlerts]  = useState([]);
    const [onlineAdmins,  setOnlineAdmins]  = useState([]);
    const [liveStats,     setLiveStats]     = useState(null);
    const [connected,     setConnected]     = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth:                { token },
            transports:          ['websocket', 'polling'],
            reconnection:        true,
            reconnectionDelay:   1000,
            reconnectionAttempts: 10
        });

        socketRef.current = socket;

        socket.on('connect',    () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        // ── New notification ─────────────────────────────────────
        // Fires when a student submits feedback
        // Shape matches your Notification model exactly
        // Call the parent component's handler so it can:
        //   1. Increment the bell count
        //   2. Add to the dropdown list
        socket.on('notification:new', (data) => {
            if (onNewNotification) onNewNotification(data);
        });

        // ── Urgent alert ─────────────────────────────────────────
        socket.on('feedback:urgent', (data) => {
            setUrgentAlerts(prev => [{
                id:        data.id,
                category:  data.category,
                preview:   data.preview,
                reason:    data.reason,
                timestamp: new Date(data.timestamp),
            }, ...prev]);

            // Subtle sound alert
            try {
                const ctx  = new AudioContext();
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 520;
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            } catch (e) {}
        });

        // ── Live stats ───────────────────────────────────────────
        // Updates dashboard counts without page refresh
        socket.on('stats:updated', (stats) => {
            setLiveStats(stats);
        });

        // ── Multiple admin activity ──────────────────────────────
        socket.on('admin:online', (data) => {
            setOnlineAdmins(prev => {
                if (prev.find(a => a.adminId === data.adminId)) return prev;
                return [...prev, data];
            });
        });

        socket.on('admin:offline', (data) => {
            setOnlineAdmins(prev => prev.filter(a => a.adminId !== data.adminId));
        });

        socket.on('feedback:resolved', (data) => {
            // Another admin resolved something — pass to notification handler
            if (onNewNotification) onNewNotification({
                type:      'new_feedback',
                title:     `${data.resolvedBy} resolved a ${data.category} issue`,
                message:   'Feedback marked as resolved',
                timestamp: data.timestamp,
                link:      '/admin/feedback'
            });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const dismissAlert = useCallback((alertId) => {
        setUrgentAlerts(prev => prev.filter(a => a.id !== alertId));
    }, []);

    const emitResolved = useCallback((feedbackId, category) => {
        socketRef.current?.emit('feedback:resolved', { feedbackId, category });
    }, []);

    return {
        urgentAlerts,
        onlineAdmins,
        liveStats,
        connected,
        dismissAlert,
        emitResolved
    };
}