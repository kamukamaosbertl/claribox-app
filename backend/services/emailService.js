// ── Email Service ─────────────────────────────────────────────────────────────
// Handles all email sending for ClariBox using Resend
// Used for weekly feedback digest reports

const { Resend } = require('resend');

// Initialize Resend with API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

// Admin email from .env — where reports are sent
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// ── Send weekly report email ──────────────────────────────────────────────────
// Called every Monday at 8am by the cron job in server.js
// stats — object with feedback summary data from MongoDB
async function sendWeeklyReport(stats) {
    try {
        const {
            total,
            positive,
            neutral,
            negative,
            topCategories,
            weekStart,
            weekEnd
        } = stats;

        // Format dates for email subject
        const from = new Date(weekStart).toLocaleDateString([], { month: 'short', day: 'numeric' });
        const to   = new Date(weekEnd).toLocaleDateString([], { month: 'short', day: 'numeric' });

        // Build top categories list as HTML rows
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

        // Build the full HTML email
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">

            <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 32px; text-align: center;">
                    <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">
                        Clari<span style="color: #c4b5fd;">Box</span>
                    </h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                        Weekly Feedback Report · ${from} – ${to}
                    </p>
                </div>

                <!-- Body -->
                <div style="padding: 32px;">

                    <h2 style="margin: 0 0 24px; font-size: 20px; color: #1e1b4b; font-weight: 800;">
                        👋 Here's your weekly summary
                    </h2>

                    <!-- Stats row -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px;">

                        <div style="background: #eef2ff; border-radius: 14px; padding: 16px; text-align: center;">
                            <p style="margin: 0; font-size: 28px; font-weight: 900; color: #4f46e5;">${total}</p>
                            <p style="margin: 4px 0 0; font-size: 11px; color: #6366f1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total</p>
                        </div>

                        <div style="background: #f0fdf4; border-radius: 14px; padding: 16px; text-align: center;">
                            <p style="margin: 0; font-size: 28px; font-weight: 900; color: #059669;">${positive}</p>
                            <p style="margin: 4px 0 0; font-size: 11px; color: #059669; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Positive</p>
                        </div>

                        <div style="background: #f8fafc; border-radius: 14px; padding: 16px; text-align: center;">
                            <p style="margin: 0; font-size: 28px; font-weight: 900; color: #64748b;">${neutral}</p>
                            <p style="margin: 4px 0 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Neutral</p>
                        </div>

                        <div style="background: #fff1f2; border-radius: 14px; padding: 16px; text-align: center;">
                            <p style="margin: 0; font-size: 28px; font-weight: 900; color: #e11d48;">${negative}</p>
                            <p style="margin: 4px 0 0; font-size: 11px; color: #e11d48; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Negative</p>
                        </div>

                    </div>

                    <!-- Top categories -->
                    ${topCategories.length > 0 ? `
                    <h3 style="margin: 0 0 12px; font-size: 15px; color: #1e1b4b; font-weight: 700;">
                        📊 Top Categories This Week
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 12px; overflow: hidden; margin-bottom: 32px;">
                        ${categoryRows}
                    </table>
                    ` : '<p style="color: #9ca3af; margin-bottom: 32px;">No feedback received this week.</p>'}

                    <!-- No feedback message -->
                    ${total === 0 ? `
                    <div style="background: #f0fdf4; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 32px;">
                        <p style="margin: 0; color: #059669; font-weight: 600;">✅ No feedback this week — all quiet!</p>
                    </div>
                    ` : ''}

                    <!-- CTA button -->
                    <div style="text-align: center; margin-bottom: 24px;">
                        <a href="http://localhost:5173/admin/dashboard"
                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(99,102,241,0.35);">
                            View Full Dashboard →
                        </a>
                    </div>

                </div>

                <!-- Footer -->
                <div style="background: #f8f8fc; padding: 20px 32px; text-align: center; border-top: 1px solid #f0f0f5;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        ClariBox · Automated Weekly Report · You are receiving this because you are the system administrator
                    </p>
                </div>

            </div>
        </body>
        </html>
        `;

        // Send email via Resend
        const result = await resend.emails.send({
            from:    'ClariBox <onboarding@resend.dev>', // Resend default sender for free accounts
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
// Called when admin has not logged in for 3+ days
// unreadCount — number of feedbacks waiting to be seen
async function sendInactivityReminder(unreadCount) {
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
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">Students have submitted feedback that hasn't been reviewed yet. Regular check-ins help build trust and show students their voices matter.</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="http://localhost:5173/admin/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
                  Review Feedback →
                </a>
              </div>
            </div>
            <div style="background:#f8f8fc;padding:20px 32px;text-align:center;border-top:1px solid #f0f0f5;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ClariBox · You are receiving this because you have not logged in for 3+ days</p>
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
        console.log(' Inactivity reminder sent:', result.id);
        return true;
    } catch (error) {
        console.error(' Inactivity email error:', error.message);
        return false;
    }
}

// ── Send feedback spike alert ─────────────────────────────────────────────────
// Called immediately when feedback count crosses 10 in one day
// count — number of feedbacks today, category — which category spiked
async function sendSpikeAlert(count, category) {
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
                  <strong>${count} feedbacks</strong> have been submitted today${category ? ` in the <strong>${category}</strong> category` : ''}. 
                  This is significantly higher than normal and may indicate a serious issue that needs your attention.
                </p>
              </div>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">We recommend reviewing these feedbacks and using the AI assistant to quickly identify the main concerns.</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="http://localhost:5173/admin/login?redirect=/admin/chat" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
                  Ask AI About This →
                </a>
              </div>
            </div>
            <div style="background:#f8f8fc;padding:20px 32px;text-align:center;border-top:1px solid #f0f0f5;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ClariBox · Automated spike alert</p>
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
        console.log(' Spike alert sent:', result.id);
        return true;
    } catch (error) {
        console.error('Spike alert email error:', error.message);
        return false;
    }
}

// ── Send password/email change security alert ─────────────────────────────────
// Called immediately when admin changes their password or email
// adminName — name of the admin who made the change
// changeType — 'password' or 'email'
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
                  Hello <strong>${adminName}</strong>, your account <strong>${changeType}</strong> was recently changed. 
                  If you made this change, you can ignore this email. 
                  If you did not make this change, your account may be compromised.
                </p>
              </div>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">For security, please log in and verify your account details immediately if this was not you.</p>
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
            subject: ` Security alert — Your ClariBox ${changeType} was changed`,
            html
        });
        console.log(' Security alert sent:', result.id);
        return true;
    } catch (error) {
        console.error(' Security alert email error:', error.message);
        return false;
    }
}

module.exports = { sendWeeklyReport, sendInactivityReminder, sendSpikeAlert, sendSecurityAlert };