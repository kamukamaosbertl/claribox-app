import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Clock, User } from 'lucide-react';

const RecentFeedback = ({ items }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
      {/* Header Section */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <h2 className="text-lg font-bold text-slate-800">Recent Feedback</h2>
        <Link 
          to="/admin/feedback" 
          className="group flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All 
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      {/* List Content */}
      {items.length > 0 ? (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div 
                key={item._id || item.id} 
                className="p-5 hover:bg-slate-50 transition-all duration-200 group cursor-pointer"
              >
                {/* Badges Row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {item.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {item.status}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm font-medium text-slate-700 line-clamp-2 mb-3 group-hover:text-slate-900 transition-colors">
                  {item.text}
                </p>

                {/* Footer / Meta Data */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>ID: {item.anonymous_id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50/50 text-center p-6">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold">No feedback yet</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            When users submit feedback, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentFeedback;