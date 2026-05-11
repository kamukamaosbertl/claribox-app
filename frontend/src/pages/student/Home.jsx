import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Shield, CheckCircle, Phone, AlertCircle,
  ArrowRight, Lock, Eye, Zap, Heart, Star, MessageCircle,
} from 'lucide-react';


const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const whyCards = [
  { icon: Lock,        accent: '#2563EB', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.15)',  title: 'Completely Anonymous',    desc: 'We never ask for your name, student ID, or any identifying information. Your privacy is our top priority.' },
  { icon: Zap,         accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.15)', title: 'Instant Submission',      desc: 'Submit feedback in under 60 seconds. No lengthy forms, no sign-ups, no waiting rooms.' },
  { icon: Eye,         accent: '#059669', bg: 'rgba(5,150,105,0.08)',   border: 'rgba(5,150,105,0.15)',  title: 'Real Action Taken',       desc: 'Your feedback goes directly to administrators who review and act on it. Not a suggestion box that collects dust.' },
  { icon: Shield,      accent: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.15)',  title: 'Safe to Speak Freely',    desc: 'Share what you truly think — about teaching, facilities, food, anything — without fear of consequences.' },
  { icon: Heart,       accent: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.15)',  title: 'Your Campus, Your Voice', desc: 'Every improvement starts with a student noticing something. Your feedback shapes the university experience for everyone.' },
  { icon: CheckCircle, accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.15)', title: 'Transparent Resolutions', desc: 'See what issues have been resolved. Know that your feedback made a real difference on campus.' },
];

const steps = [
  { step: '01', icon: Send,        accent: '#2563EB', bg: 'rgba(37,99,235,0.08)',  title: 'Submit Your Feedback', desc: 'Share your thoughts, concerns, or ideas using our simple form. Takes less than a minute.' },
  { step: '02', icon: Shield,      accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', title: 'Stay Anonymous',       desc: 'Your identity is never collected. Speak freely without any worry of being identified.' },
  { step: '03', icon: CheckCircle, accent: '#059669', bg: 'rgba(5,150,105,0.08)',  title: 'See Changes Happen',  desc: 'Administrators review your feedback and take action. Real improvements start with your voice.' },
];

const quotePool = [
  { quote: 'The library got quieter study zones after students kept mentioning the noise issue. That was a real win.', faculty: 'FAST Student' },
  { quote: 'I reported unstable Wi-Fi in the hostel block and improvements were made faster than I expected.', faculty: 'Computing Student' },
  { quote: 'It felt good submitting feedback without worrying about being known by anyone.', faculty: 'Business Student' },
  { quote: 'The canteen menu became more balanced after several suggestions. That honestly surprised me.', faculty: 'Science Student' },
  { quote: 'I shared concerns about late class timetable updates and the communication became clearer afterwards.', faculty: 'FAST Student' },
  { quote: 'The parking area lighting improved after repeated feedback. It feels much safer now.', faculty: 'FAST Student' },
  { quote: 'I suggested more charging points in study spaces and now there are clearly more places to plug in.', faculty: 'Medicine Student' },
  { quote: 'Feedback about long office queues actually led to a better process. That made students trust the system more.', faculty: 'Education Student' },
  { quote: 'The cleanliness in one of the hostel wings improved after students kept raising it through the platform.', faculty: 'Social Sciences Student' },
  { quote: 'I liked that I could be honest about lecture pacing without fear. That kind of privacy matters.', faculty: 'Economics Student' },
  { quote: 'Exam week library hours were extended and that helped a lot. Students had been asking for that for ages.', faculty: 'Agriculture Student' },
  { quote: 'The response to broken classroom projectors was much quicker once several reports pointed to the same issue.', faculty: 'FAST Student' },
  { quote: 'I noticed better communication around missed classes after concerns were submitted consistently.', faculty: 'Public Health Student' },
  { quote: 'The portal was easier to use after feedback about confusing navigation. Small fix, big difference.', faculty: 'IT Student' },
  { quote: 'I reported poor ventilation in one lecture room and the issue was actually looked into. That felt encouraging.', faculty: 'Nursing Student' },
  { quote: 'Students mentioned the need for more water points and some were added in busy areas. That was long overdue.', faculty: 'inter-displinary Student' },
  { quote: 'The feedback process is simple enough that you can say what matters without wasting half your day.', faculty: 'Finance Student' },
  { quote: 'More noticeboards started showing useful updates after students asked for better communication channels.', faculty: 'inter-displinary Student' },
  { quote: 'I raised concerns about crowded lab sessions and scheduling became a bit more sensible later on.', faculty: 'Bio-medical Student' },
  { quote: 'It was reassuring to see campus issues discussed and not just buried somewhere out of sight.', faculty: 'Psychology Student' },
  { quote: 'The cleanliness around common washrooms improved after repeated student complaints were submitted.', faculty: 'petroleum Student' },
  { quote: 'I appreciated being able to suggest practical changes instead of just complaining to friends.', faculty: 'Procurement Student' },
  { quote: 'More seating appeared near the main block after students kept mentioning congestion during breaks.', faculty: 'Statistics Student' },
  { quote: 'The platform makes it easier to raise real concerns without turning it into drama.', faculty: 'Development Studies Student' },
  { quote: 'I noticed better internet access in one faculty block after several students reported weak coverage.', faculty: 'FAST Student' },
  { quote: 'Student voices feel more meaningful when there is a proper channel instead of random hallway complaints.', faculty: 'Business Student' },
  { quote: 'The washroom maintenance improved after multiple anonymous reports highlighted the same problem.', faculty: 'Science Student' },
  { quote: 'I suggested better signage for offices and directions became easier for new students.', faculty: 'Computing Student' },
  { quote: 'The system feels trustworthy because it focuses on issues, not identities.', faculty: 'Computing Student' },
  { quote: 'We needed more awareness about support services, and student suggestions helped push that conversation.', faculty: 'Medicine Student' },
];

const shuffleArray = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const Home = () => {
  const shuffledQuotes = useMemo(() => shuffleArray(quotePool), []);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => {
        const next = prev + 3;
        return next >= shuffledQuotes.length ? 0 : next;
      });
    }, 20000); // every 8 seconds, so it rotates smoothly for well over 2 minutes

    return () => clearInterval(interval);
  }, [shuffledQuotes]);

  const visibleQuotes = [
    shuffledQuotes[quoteIndex % shuffledQuotes.length],
    shuffledQuotes[(quoteIndex + 1) % shuffledQuotes.length],
    shuffledQuotes[(quoteIndex + 2) % shuffledQuotes.length],
  ];

  return (
    <div style={{ minHeight: '100vh', fontFamily: font }}>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          color: '#FFFFFF',
          background: '#1E3A8A',
        }}
      >
        {/* Mesh blobs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '380px', height: '380px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '40px', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '15%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '6px 16px',
              borderRadius: '99px',
              marginBottom: '28px',
            }}
          >
            <Lock size={12} color="#FCD34D" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>
              100% Anonymous · No Login Required
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 7vw, 68px)',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              margin: '0 0 20px',
              color: '#FFFFFF',
            }}
          >
            Speak Up. Be Heard.
            <br />
            <span style={{ color: '#93C5FD' }}>Help Make Campus Better.</span>
          </h1>

          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.72)', maxWidth: '520px', margin: '0 auto 40px', lineHeight: '1.7', fontWeight: 400 }}>
            Your identity is never collected or stored. Share your thoughts,
            raise concerns, and suggest improvements — completely anonymously.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <Link
              to="/submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 32px',
                borderRadius: '16px',
                textDecoration: 'none',
                background: '#FFFFFF',
                color: '#1D4ED8',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                boxShadow: '0 8px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.9)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.20)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.16)';
              }}
            >
              <Send size={15} />
              Submit Your Feedback
              <ArrowRight size={15} />
            </Link>

            <a
              href="#how-it-works"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '16px',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.16s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.20)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              }}
            >
              Learn More
            </a>
          </div>

          <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.40)', marginTop: '16px', fontWeight: 500 }}>
            No personal data collected · Your voice stays private
          </p>
        </div>

        <div style={{ position: 'relative', height: '64px' }}>
          <svg style={{ position: 'absolute', bottom: 0, width: '100%', height: '64px' }} viewBox="0 0 1440 64" fill="#F4F7FB" preserveAspectRatio="none">
            <path d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,42.7C840,43,960,53,1080,53.3C1200,53,1320,43,1380,37.3L1440,32L1440,64L1380,64C1320,64,1200,64,1080,64C960,64,840,64,720,64C600,64,480,64,360,64C240,64,120,64,60,64L0,64Z" />
          </svg>
        </div>
      </section>

      {/* ── WHY CLARIBOX ──────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F4F7FB' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.035em', margin: '0 0 8px' }}>
              Why Use ClariBox?
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
              Built for students who want to be heard without fear
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {whyCards.map((card, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '26px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px rgba(15,23,42,0.10)`;
                  e.currentTarget.style.borderColor = '#BFDBFE';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <card.icon size={20} color={card.accent} />
                </div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: '1.65' }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '80px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.035em', margin: '0 0 8px' }}>
              How It Works
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
              Three simple steps to make your voice heard
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {steps.map((item, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '32px 28px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.10)';
                  e.currentTarget.style.borderColor = '#BFDBFE';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div style={{ fontSize: '52px', fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '16px' }}>
                  {item.step}
                </div>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <item.icon size={22} color={item.accent} />
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: '1.65' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDENT QUOTES ────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F4F7FB' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.035em', margin: '0 0 8px' }}>
              What Students Are Saying
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
              Real feedback from real students
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {visibleQuotes.map((item, i) => (
              <div
                key={`${item.quote}-${quoteIndex}-${i}`}
                style={{
                  position: 'relative',
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '26px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)',
                  transition: 'all 0.35s ease',
                  animation: 'studentQuoteFade 0.55s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)';
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageCircle size={15} color="#2563EB" />
                </div>

                <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </div>

                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', marginBottom: '18px', fontStyle: 'italic' }}>
                  "{item.quote}"
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px rgba(37,99,235,0.22)',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF' }}>
                      {item.faculty[0]}
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#94A3B8' }}>
                    Anonymous · {item.faculty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '80px 24px',
          textAlign: 'center',
          background: '#1E3A8A',
        }}
      >
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.035em', margin: '0 0 12px' }}>
            Ready to Make a Difference?
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.68)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px', lineHeight: '1.7' }}>
            Your feedback takes less than 2 minutes and could change the campus experience for thousands of students.
          </p>
          <Link
            to="/submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 32px',
              borderRadius: '16px',
              textDecoration: 'none',
              background: '#FFFFFF',
              color: '#1D4ED8',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.20)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.16)';
            }}
          >
            <Send size={15} />
            Submit Feedback Now
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── EMERGENCY CONTACT ─────────────────────────────────────── */}
      <section style={{ padding: '40px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '18px',
              padding: '22px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '11px',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={18} color="#D97706" />
            </div>
            <div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Need Immediate Help?
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px', lineHeight: '1.6' }}>
                For urgent matters requiring immediate attention, contact staff directly:
              </p>
              <a
                href="tel:+256793702186"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  background: 'linear-gradient(to bottom right, #2563EB, #4ADE80)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  boxShadow: '0 4px 10px rgba(37,99,235,0.22)',
                  transition: 'all 0.16s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(37,99,235,0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(37,99,235,0.22)';
                }}
              >
                <Phone size={13} /> +256 793 702 186
              </a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes studentQuoteFade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      
    </div>
  );
};

export default Home;