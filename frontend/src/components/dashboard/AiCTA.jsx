import { Link } from 'react-router-dom';
import { Bot, ArrowRight, Sparkles, Zap } from 'lucide-react';

const features = ['Category Search', 'Auto Summary', 'Trend Detection', '100% Private'];

const AiCTA = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl px-8 py-8 flex flex-wrap items-center justify-between gap-6 shadow-xl shadow-indigo-500/30"
      style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 35%, #7c3aed 70%, #9333ea 100%)' }}
    >

      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-12 left-[10%] w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-5 left-[40%] w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

      {/* Floating sparkles */}
      <div className="absolute top-5 right-56 pointer-events-none animate-bounce">
        <Sparkles className="w-3.5 h-3.5 text-white/40" />
      </div>
      <div className="absolute bottom-5 right-80 pointer-events-none animate-pulse">
        <Sparkles className="w-2.5 h-2.5 text-white/30" />
      </div>

      {/* Left — icon + text */}
      <div className="relative flex items-center gap-5 flex-1 min-w-0">

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <Bot className="w-7 h-7 text-white" />
        </div>

        <div className="min-w-0">
          {/* Title + badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Unlock Deeper Insights
            </h3>
            <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5 text-amber-300" />
              <span className="text-xs font-bold text-amber-200">AI Powered</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-white/75 leading-relaxed max-w-md">
            Ask questions, discover trends, and get instant summaries from student feedback — powered by local AI running on your machine.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {features.map((feat) => (
              <span
                key={feat}
                className="text-xs font-semibold text-white/85 bg-white/10 border border-white/15 px-2.5 py-1 rounded-full"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — CTA button */}
      <Link
        to="/admin/chat"
        className="relative flex-shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-indigo-600 text-sm font-extrabold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap no-underline"
      >
        <Bot className="w-4 h-4" />
        Ask AI Now
        <ArrowRight className="w-4 h-4" />
      </Link>

    </div>
  );
};

export default AiCTA;