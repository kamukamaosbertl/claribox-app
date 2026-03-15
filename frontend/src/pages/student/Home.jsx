import { Link } from 'react-router-dom';
import {
  Send, Shield, CheckCircle, Phone, AlertCircle,
  ArrowRight, Lock, Eye, Zap, Heart, Star, MessageCircle
} from 'lucide-react';

const whyCards = [
  { icon: Lock,        color: 'text-indigo-600', bg: 'bg-indigo-50',  title: 'Completely Anonymous',     desc: 'We never ask for your name, student ID, or any identifying information. Your privacy is our top priority.' },
  { icon: Zap,         color: 'text-violet-600', bg: 'bg-violet-50',  title: 'Instant Submission',       desc: 'Submit feedback in under 60 seconds. No lengthy forms, no sign-ups, no waiting rooms.' },
  { icon: Eye,         color: 'text-emerald-600',bg: 'bg-emerald-50', title: 'Real Action Taken',        desc: 'Your feedback goes directly to administrators who review and act on it. Not a suggestion box that collects dust.' },
  { icon: Shield,      color: 'text-cyan-600',   bg: 'bg-cyan-50',    title: 'Safe to Speak Freely',     desc: 'Share what you truly think — about teaching, facilities, food, anything — without fear of consequences.' },
  { icon: Heart,       color: 'text-rose-600',   bg: 'bg-rose-50',    title: 'Your Campus, Your Voice',  desc: 'Every improvement starts with a student noticing something. Your feedback shapes the university experience for everyone.' },
  { icon: CheckCircle, color: 'text-amber-600',  bg: 'bg-amber-50',   title: 'Transparent Resolutions',  desc: 'See what issues have been resolved. Know that your feedback made a real difference on campus.' },
];

const steps = [
  { step: '01', icon: Send,        color: 'text-indigo-600', bg: 'bg-indigo-50', title: 'Submit Your Feedback', desc: 'Share your thoughts, concerns, or ideas using our simple form. Takes less than a minute.' },
  { step: '02', icon: Shield,      color: 'text-violet-600', bg: 'bg-violet-50', title: 'Stay Anonymous',       desc: 'Your identity is never collected. Speak freely without any worry of being identified.' },
  { step: '03', icon: CheckCircle, color: 'text-emerald-600',bg: 'bg-emerald-50',title: 'See Changes Happen',  desc: 'Administrators review your feedback and take action. Real improvements start with your voice.' },
];

const quotes = [
  { quote: 'I finally felt safe enough to report the broken lights in the parking lot. They were fixed within a week!', faculty: 'Engineering Student' },
  { quote: 'I suggested extending library hours during exam season and it actually happened. ClariBox works!',           faculty: 'Business Student'    },
  { quote: 'The canteen food quality improved after I submitted feedback. Knowing my voice matters means everything.',   faculty: 'Science Student'     },
];

const Home = () => {
  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 75%, #9333ea 100%)' }}
      >
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-10 -left-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/3 right-[15%] w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full mb-7">
            <Lock className="w-3 h-3 text-amber-300" />
            <span className="text-xs font-semibold text-white/90">100% Anonymous · No Login Required</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tighter mb-5">
            Speak Up. Be Heard.
            <br />
            <span className="text-violet-300">Help Make Campus Better.</span>
          </h1>

          <p className="text-lg text-white/75 max-w-xl mx-auto mb-10 leading-relaxed">
            Your identity is never collected or stored. Share your thoughts,
            raise concerns, and suggest improvements — completely anonymously.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white text-indigo-600 text-sm font-extrabold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all no-underline"
            >
              <Send className="w-4 h-4" />
              Submit Your Feedback
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/12 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors no-underline"
            >
              Learn More
            </a>
          </div>

          <p className="text-xs text-white/45 mt-4">No personal data collected · Your voice stays private</p>
        </div>

        {/* Wave */}
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full h-16" viewBox="0 0 1440 64" fill="#f9fafb" preserveAspectRatio="none">
            <path d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,42.7C840,43,960,53,1080,53.3C1200,53,1320,43,1380,37.3L1440,32L1440,64L1380,64C1320,64,1200,64,1080,64C960,64,840,64,720,64C600,64,480,64,360,64C240,64,120,64,60,64L0,64Z" />
          </svg>
        </div>
      </section>

      {/* ── WHY CLARIBOX ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-indigo-950 tracking-tight mb-2">Why Use ClariBox?</h2>
            <p className="text-sm text-slate-400">Built for students who want to be heard without fear</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whyCards.map((card, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all">
                <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <h3 className="text-sm font-bold text-indigo-950 mb-2">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-indigo-950 tracking-tight mb-2">How It Works</h2>
            <p className="text-sm text-slate-400">Three simple steps to make your voice heard</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center hover:-translate-y-1 hover:shadow-md transition-all">
                <div className="text-5xl font-black text-slate-100 leading-none mb-4">{item.step}</div>
                <div className={`w-13 h-13 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-4`} style={{ width: '52px', height: '52px' }}>
                  <item.icon className={`w-5 h-5 ${item.color}`} size={22} />
                </div>
                <h3 className="text-sm font-bold text-indigo-950 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDENT QUOTES ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-indigo-950 tracking-tight mb-2">What Students Are Saying</h2>
            <p className="text-sm text-slate-400">Real feedback from real students</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quotes.map((item, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-7 border border-slate-100 shadow-sm">
                <div className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">"{item.quote}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{item.faculty[0]}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Anonymous · {item.faculty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative overflow-hidden py-20 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)' }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white tracking-tight mb-3">Ready to Make a Difference?</h2>
          <p className="text-sm text-white/70 mb-8 max-w-md mx-auto leading-relaxed">
            Your feedback takes less than 2 minutes and could change the campus experience for thousands of students.
          </p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl bg-white text-indigo-600 text-sm font-extrabold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all no-underline"
          >
            <Send className="w-4 h-4" />
            Submit Feedback Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── EMERGENCY CONTACT ── */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-950 mb-1.5">Need Immediate Help?</h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                For urgent matters requiring immediate attention, contact staff directly:
              </p>
              <a
                href="tel:+256793702186"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 no-underline hover:-translate-y-0.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                +256 793 702 186
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;