// ── Email Service ─────────────────────────────────────────────────────────────
// Handles all email sending for ClariBox using Resend
// Checks admin notification preferences before sending each email type
// If a toggle is OFF in Settings → that email type is skipped

const { Resend } = require('resend');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const resend      = new Resend(process.env.RESEND_API_KEY);

// ── Get admin notification preferences from MongoDB ───────────────────────────
// Called before sending each email to check if that type is enabled
// Returns preferences object or defaults (all true) if not found
async function getNotificationPrefs() {
    try {
        const Admin = require('../models/Admin');
        // Get the most recently logged in admin's preferences
        const admin = await Admin.findOne().sort({ lastLogin: -1 }).select('notificationPrefs');
        return admin?.notificationPrefs || {
            emailWeeklyReport: true,
            emailSpikeAlert:   true,
            emailInactivity:   true
        };
    } catch {
        // If DB check fails — default to sending all emails
        return { emailWeeklyReport: true, emailSpikeAlert: true, emailInactivity: true };
    }
}

// ── Send weekly report email ──────────────────────────────────────────────────
// Called every Monday at 8am by the cron job in server.js
// Checks emailWeeklyReport preference before sending
async function sendWeeklyReport(stats) {
    // Check if admin has this notification type enabled
    const prefs = await getNotificationPrefs();
    if (!prefs.emailWeeklyReport) {
        console.log('⏭️  Weekly report skipped — disabled in settings');
        return false;
    }

    try {
        const { total, positive, neutral, negative, topCategories, weekStart, weekEnd } = stats;

        const from = new Date(weekStart).toLocaleDateString([], { month: 'short', day: 'numeric' });
        const to   = new Date(weekEnd).toLocaleDateString([], { month: 'short', day: 'numeric' });

        const categoryRows = topCategories.map((cat, i) => `
            <tr>
                <td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f5;">
                    <span style="font-weight: 600; color: #1e1b4b;">#${i + 1} ${cat.name}</span>
                </td>
                <td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f5; text-align: right;">
                    <span style="background: #eef2ff; color: #4338ca; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 700;">
                        ${cat.count} feedbacks
                    </span>
                </td>
            </tr>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;">Clari<span style="color:#c4b5fd;">Box</span></h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Weekly Feedback Report · ${from} – ${to}</p>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 24px;font-size:20px;color:#1e1b4b;font-weight:800;">👋 Here's your weekly summary</h2>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px;">
                <div style="background:#eef2ff;border-radius:14px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:28px;font-weight:900;color:#4f46e5;">${total}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#6366f1;font-weight:600;text-transform:uppercase;">Total</p>
                </div>
                <div style="background:#f0fdf4;border-radius:14px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:28px;font-weight:900;color:#059669;">${positive}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#059669;font-weight:600;text-transform:uppercase;">Positive</p>
                </div>
                <div style="background:#f8fafc;border-radius:14px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:28px;font-weight:900;color:#64748b;">${neutral}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Neutral</p>
                </div>
                <div style="background:#fff1f2;border-radius:14px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:28px;font-weight:900;color:#e11d48;">${negative}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#e11d48;font-weight:600;text-transform:uppercase;">Negative</p>
                </div>
              </div>
              ${topCategories.length > 0 ? `
              <h3 style="margin:0 0 12px;font-size:15px;color:#1e1b4b;font-weight:700;">📊 Top Categories This Week</h3>
              <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:12px;overflow:hidden;margin-bottom:32px;">
                ${categoryRows}
              </table>` : '<p style="color:#9ca3af;margin-bottom:32px;">No feedback received this week.</p>'}
              ${total === 0 ? `<div style="background:#f0fdf4;border-radius:14px;padding:20px;text-align:center;margin-bottom:32px;"><p style="margin:0;color:#059669;font-weight:600;">✅ No feedback this week — all quiet!</p></div>` : ''}
              <div style="text-align:center;margin-bottom:24px;">
                <a href="http://localhost:5173/admin/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
                  View Full Dashboard →
                </a>
              </div>
            </div>
            <div style="background:#f8f8fc;padding:20px 32px;text-align:center;border-top:1px solid #f0f0f5;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ClariBox · Weekly Report · <a href="http://localhost:5173/admin/settings" style="color:#6366f1;">Manage email preferences</a></p>
            </div>
          </div>
        </body>
        </html>`;

        const result = await resend.emails.send({
            from:    'ClariBox <onboarding@resend.dev>',
            to:      ADMIN_EMAIL,
            subject: `📊 ClariBox Weekly Report — ${total} feedbacks (${from} – ${to})`,
            html
        });
        console.log('✅ Weekly report email sent:', result.id);
        return true;
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return false;
    }
}

// ── Send inactivity reminder ──────────────────────────────────────────────────
// Checks emailInactivity preference before sending
async function sendInactivityReminder(unreadCount) {
    const prefs = await getNotificationPrefs();
    if (!prefs.emailInactivity) {
        console.log('⏭️  Inactivity reminder skipped — disabled in settings');
        return false;
    }

    try {
        const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;">Clari<span style="color:#c4b5fd;">Box</span></h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">You have been away for a while</p>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#1e1b4b;font-weight:800;">👋 Students are waiting for your attention</h2>
              <div style="background:#eef2ff;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0;font-size:48px;font-weight:900;color:#4f46e5;">${unreadCount}</p>
                <p style="margin:4px 0 0;font-size:14px;color:#6366f1;font-weight:600;">feedbacks waiting to be reviewed</p>
              </div>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">Students have submitted feedback that hasn't been reviewed yet.</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="http://localhost:5173/admin/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
                  Review Feedback →
                </a>
              </div>
            </div>
            <div style="background:#f8f8fc;padding:20px 32px;text-align:center;border-top:1px solid #f0f0f5;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ClariBox · <a href="http://localhost:5173/admin/settings" style="color:#6366f1;">Manage email preferences</a></p>
            </div>
          </div>
        </body>
        </html>`;

        const result = await resend.emails.send({
            from:    'ClariBox <onboarding@resend.dev>',
            to:      ADMIN_EMAIL,
            subject: `⏰ ${unreadCount} feedbacks waiting — You have been away from ClariBox`,
            html
        });
        console.log('✅ Inactivity reminder sent:', result.id);
        return true;
    } catch (error) {
        console.error('❌ Inactivity email error:', error.message);
        return false;
    }
}

// ── Send feedback spike alert ─────────────────────────────────────────────────
// Checks emailSpikeAlert preference before sending
async function sendSpikeAlert(count, category) {
    const prefs = await getNotificationPrefs();
    if (!prefs.emailSpikeAlert) {
        console.log('⏭️  Spike alert skipped — disabled in settings');
        return false;
    }

    try {
        const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);padding:40px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;">Clari<span style="color:#fca5a5;">Box</span></h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Feedback Spike Alert</p>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#1e1b4b;font-weight:800;">⚠️ Unusual feedback activity detected</h2>
              <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:14px;padding:24px;margin-bottom:24px;">
                <p style="margin:0;font-size:14px;color:#be123c;line-height:1.6;">
                  <strong>${count} feedbacks</strong> submitted today${category ? ` in <strong>${category}</strong>` : ''}.
                  This may indicate a serious issue needing your attention.
                </p>
              </div>
              <div style="text-align:center;margin:24px 0;display:flex;gap:12px;justify-content:center;">
                <a href="http://localhost:5173/admin/login" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
                  Login to Review →
                </a>
                <a href="http://localhost:5173/admin/login?redirect=/admin/chat" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
                  Ask AI About This →
                </a>
              </div>
            </div>
            <div style="background:#f8f8fc;padding:20px 32px;text-align:center;border-top:1px solid #f0f0f5;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ClariBox · <a href="http://localhost:5173/admin/settings" style="color:#6366f1;">Manage email preferences</a></p>
            </div>
          </div>
        </body>
        </html>`;

        const result = await resend.emails.send({
            from:    'ClariBox <onboarding@resend.dev>',
            to:      ADMIN_EMAIL,
            subject: `⚠️ Feedback spike — ${count} submissions today${category ? ` in ${category}` : ''}`,
            html
        });
        console.log('✅ Spike alert sent:', result.id);
        return true;
    } catch (error) {
        console.error('❌ Spike alert email error:', error.message);
        return false;
    }
}

// ── Send security alert ───────────────────────────────────────────────────────
// Always sent — no preference check (security alerts cannot be disabled)
async function sendSecurityAlert(adminName, changeType) {
    try {
        const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#d97706 0%,#f59e0b 100%);padding:40px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;">Clari<span style="color:#fef3c7;">Box</span></h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Security Alert</p>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#1e1b4b;font-weight:800;">🔐 Your ${changeType} was changed</h2>
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:20px;margin-bottom:24px;">
                <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">
                  Hello <strong>${adminName}</strong>, your <strong>${changeType}</strong> was recently changed.
                  If this was you, ignore this email. If not — your account may be compromised.
                </p>
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="http://localhost:5173/admin/login" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
                  Verify My Account →
                </a>
              </div>
            </div>
            <div style="background:#f8f8fc;padding:20px 32px;text-align:center;border-top:1px solid #f0f0f5;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ClariBox · Security notification · ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
        </html>`;

        const result = await resend.emails.send({
            from:    'ClariBox <onboarding@resend.dev>',
            to:      ADMIN_EMAIL,
            subject: `🔐 Security alert — Your ClariBox ${changeType} was changed`,
            html
        });
        console.log('✅ Security alert sent:', result.id);
        return true;
    } catch (error) {
        console.error('❌ Security alert email error:', error.message);
        return false;
    }
}

module.exports = { sendWeeklyReport, sendInactivityReminder, sendSpikeAlert, sendSecurityAlert };