import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Sparkles } from 'lucide-react';

const AiCTA = () => {
  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white shadow-xl shadow-purple-500/20">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-12 -mb-12"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        
        {/* Left Side: Icon & Text */}
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Unlock Deeper Insights</h3>
            <p className="text-indigo-100 text-sm font-medium max-w-md">
              Let our AI analyze feedback trends and generate actionable reports instantly.
            </p>
          </div>
        </div>

        {/* Right Side: Action Button */}
        <Link
          to="/admin/chat"
          className="group/btn relative inline-flex items-center gap-2 bg-white text-indigo-600 px-7 py-3.5 rounded-xl font-bold shadow-lg shadow-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
        >
          <span>Start Chatting</span>
          <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          <Sparkles className="w-4 h-4 absolute top-2 right-2 opacity-0 group-hover/btn:opacity-100 transition-opacity text-amber-400" />
        </Link>
      </div>
    </div>
  );
};

export default AiCTA;