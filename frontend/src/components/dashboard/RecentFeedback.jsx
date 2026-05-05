import { Link } from 'react-router-dom';
import { MessageSquare, Clock } from 'lucide-react';

const CATEGORY_COLORS = {
  academic:   'bg-indigo-50 text-indigo-700',
  library:    'bg-green-50 text-green-700',
  it:         'bg-cyan-50 text-cyan-700',
  facilities: 'bg-amber-50 text-amber-700',
  canteen:    'bg-yellow-50 text-yellow-700',
  transport:  'bg-violet-50 text-violet-700',
  hostel:     'bg-pink-50 text-pink-700',
  admin:      'bg-slate-100 text-slate-700',
  other:      'bg-slate-100 text-slate-500',
};

const SENTIMENT_COLORS = {
  positive: 'bg-green-50 text-green-700',
  negative: 'bg-red-50 text-red-700',
  neutral:  'bg-slate-100 text-slate-600',
};

const RecentFeedback = ({ items }) => {
  return (
    <div className="flex h-full flex-col">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">

        </div>

      </div>

      {/* LIST */}
      {items && items.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">

          {items.map((item) => {
            const category = CATEGORY_COLORS[item.category?.toLowerCase()] || CATEGORY_COLORS.other;
            const sentiment = SENTIMENT_COLORS[item.sentiment?.toLowerCase()] || SENTIMENT_COLORS.neutral;

            return (
              <div
                key={item._id || item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
              >
                {/* BADGES */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${category}`}>
                    {item.category}
                  </span>

                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${sentiment}`}>
                    {item.sentiment}
                  </span>
                </div>

                {/* TEXT */}
                <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 mb-3">
                  {item.feedback || item.text}
                </p>

                {/* META */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    #{item.anonymous_id}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Now'}
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center gap-3">
          <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <MessageSquare size={20} />
          </div>

          <p className="text-sm font-bold text-slate-700">
            No feedback yet
          </p>

          <p className="text-xs text-slate-500 max-w-[220px]">
            When students submit feedback, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentFeedback;