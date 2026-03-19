import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Clock, Hash } from 'lucide-react';

// ── Category color mapping ────────────────────────────────────────────────────
// Each category has a background, text and dot color for the badge
const CATEGORY_COLORS = {
  academic:   { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  library:    { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500'  },
  it:         { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-500'   },
  facilities: { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500' },
  canteen:    { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
  transport:  { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  hostel:     { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500'   },
  admin:      { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400'  },
  other:      { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400'  },
};

// ── Sentiment color mapping ───────────────────────────────────────────────────
// Shows emoji + color based on Python sentiment analysis result
const SENTIMENT_COLORS = {
  positive: { bg: 'bg-green-50', text: 'text-green-700', label: '😊 Positive' },
  negative: { bg: 'bg-red-50',   text: 'text-red-700',   label: '😞 Negative' },
  neutral:  { bg: 'bg-slate-50', text: 'text-slate-600', label: '😐 Neutral'  },
};

// ── RecentFeedback component ──────────────────────────────────────────────────
// Shows the latest 5 feedback submissions on the dashboard
// Displays: category badge, sentiment badge, feedback text, anonymous ID and date
// Status badge removed — we no longer track pending/resolved per feedback
const RecentFeedback = ({ items }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none mb-0.5">Recent Feedback</h2>
            <p className="text-xs text-white/65">Latest student submissions</p>
          </div>
        </div>

        {/* Link to All Feedback page */}
        <Link
          to="/admin/feedback"
          className="flex items-center gap-1 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors no-underline"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── Feedback list ── */}
      {items && items.length > 0 ? (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {items.map((item) => {
            // Get color scheme for this feedback's category
            // Falls back to 'other' colors if category not in list
            const catColor  = CATEGORY_COLORS[item.category]  || CATEGORY_COLORS.other;

            // Get color scheme for sentiment
            // Falls back to neutral if sentiment not yet processed
            const sentColor = SENTIMENT_COLORS[item.sentiment] || SENTIMENT_COLORS.neutral;

            return (
              <div
                key={item._id || item.id}
                className="px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {/* ── Badges row: category + sentiment ── */}
                {/* Status badge removed — no longer tracking pending/resolved */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">

                  {/* Category badge with colored dot */}
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${catColor.bg} ${catColor.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot} flex-shrink-0`} />
                    {item.category}
                  </span>

                  {/* Sentiment badge with emoji */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sentColor.bg} ${sentColor.text}`}>
                    {sentColor.label}
                  </span>

                </div>

                {/* ── Feedback text preview ── */}
                {/* line-clamp-2 limits to 2 lines — admin reads full text in All Feedback page */}
                <p className="text-sm text-slate-700 leading-snug mb-2.5 line-clamp-2">
                  {item.feedback || item.text}
                </p>

                {/* ── Meta row: anonymous ID + date ── */}
                <div className="flex items-center gap-4">

                  {/* Anonymous ID e.g. FB-A1B2C3D4E */}
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400 font-medium">{item.anonymous_id}</span>
                  </div>

                  {/* Submission date */}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : 'Just now'}
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty state — shown when no feedback exists yet ── */
        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No feedback yet</p>
          <p className="text-xs text-slate-400 text-center max-w-xs">
            When students submit feedback, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentFeedback;