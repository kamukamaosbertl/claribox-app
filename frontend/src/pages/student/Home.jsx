import { Link } from 'react-router-dom';
import {
  Send, Shield, CheckCircle, Phone, AlertCircle,
  ArrowRight, Lock, Eye, Zap, Heart, Star, MessageCircle
} from 'lucide-react';

const Home = () => {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO SECTION ── */}
      <section style={{
        background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 75%, #9333ea 100%)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '40px', left: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '15%',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          padding: '100px 24px 80px',
          textAlign: 'center',
          position: 'relative', zIndex: 1
        }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '6px 16px', borderRadius: '20px',
            marginBottom: '28px'
          }}>
            <Lock size={11} color="#fde68a" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              100% Anonymous · No Login Required
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.08,
            margin: '0 0 20px',
            letterSpacing: '-1.5px'
          }}>
            Speak Up. Be Heard.
            <br />
            <span style={{ color: '#c4b5fd' }}>
              Help Make Campus Better.
            </span>
          </h1>

          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.75)',
            maxWidth: '560px',
            margin: '0 auto 40px',
            lineHeight: 1.7
          }}>
            Your identity is never collected or stored. Share your thoughts,
            raise concerns, and suggest improvements — completely anonymously.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/submit"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '16px 36px',
                borderRadius: '14px',
                background: '#fff',
                color: '#4f46e5',
                fontSize: '15px', fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
              }}
            >
              <Send size={16} color="#4f46e5" />
              Submit Your Feedback
              <ArrowRight size={15} color="#4f46e5" />
            </Link>

            <a
              href="#how-it-works"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '16px 28px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '14px', fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              Learn More
            </a>
          </div>

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '16px' }}>
            No personal data collected · Your voice stays private
          </p>
        </div>

        {/* Wave */}
        <div style={{ position: 'relative', height: '64px' }}>
          <svg
            style={{ position: 'absolute', bottom: 0, width: '100%', height: '64px' }}
            viewBox="0 0 1440 64" fill="#f5f5f7"
            preserveAspectRatio="none"
          >
            <path d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,42.7C840,43,960,53,1080,53.3C1200,53,1320,43,1380,37.3L1440,32L1440,64L1380,64C1320,64,1200,64,1080,64C960,64,840,64,720,64C600,64,480,64,360,64C240,64,120,64,60,64L0,64Z" />
          </svg>
        </div>
      </section>

      {/* ── WHY CLARIBOX ── */}
      <section style={{ padding: '72px 24px', background: '#f5f5f7' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
              Why Use ClariBox?
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Built for students who want to be heard without fear
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              {
                icon: Lock,
                color: '#4f46e5', light: '#eef2ff',
                title: 'Completely Anonymous',
                desc: 'We never ask for your name, student ID, or any identifying information. Your privacy is our top priority.'
              },
              {
                icon: Zap,
                color: '#7c3aed', light: '#f5f3ff',
                title: 'Instant Submission',
                desc: 'Submit feedback in under 60 seconds. No lengthy forms, no sign-ups, no waiting rooms.'
              },
              {
                icon: Eye,
                color: '#059669', light: '#f0fdf4',
                title: 'Real Action Taken',
                desc: 'Your feedback goes directly to administrators who review and act on it. Not a suggestion box that collects dust.'
              },
              {
                icon: Shield,
                color: '#0e7490', light: '#ecfeff',
                title: 'Safe to Speak Freely',
                desc: 'Share what you truly think — about teaching, facilities, food, anything — without fear of consequences.'
              },
              {
                icon: Heart,
                color: '#be123c', light: '#fff1f2',
                title: 'Your Campus, Your Voice',
                desc: 'Every improvement starts with a student noticing something. Your feedback shapes the university experience for everyone.'
              },
              {
                icon: CheckCircle,
                color: '#b45309', light: '#fffbeb',
                title: 'Transparent Resolutions',
                desc: 'See what issues have been resolved. Know that your feedback made a real difference on campus.'
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '28px 24px',
                border: '1px solid #f0f0f5',
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{
                  width: '46px', height: '46px',
                  borderRadius: '13px',
                  background: item.light,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <item.icon size={20} color={item.color} />
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b', margin: '0 0 8px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.65, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
              How It Works
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Three simple steps to make your voice heard
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { step: '01', icon: Send,         color: '#4f46e5', light: '#eef2ff', title: 'Submit Your Feedback',  desc: 'Share your thoughts, concerns, or ideas using our simple form. Takes less than a minute.' },
              { step: '02', icon: Shield,        color: '#7c3aed', light: '#f5f3ff', title: 'Stay Anonymous',        desc: 'Your identity is never collected. Speak freely without any worry of being identified.' },
              { step: '03', icon: CheckCircle,   color: '#059669', light: '#f0fdf4', title: 'See Changes Happen',    desc: 'Administrators review your feedback and take action. Real improvements start with your voice.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '32px 28px',
                border: '1px solid #f0f0f5',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{ fontSize: '52px', fontWeight: 900, color: item.light, lineHeight: 1, marginBottom: '16px' }}>
                  {item.step}
                </div>
                <div style={{
                  width: '52px', height: '52px',
                  borderRadius: '14px', background: item.light,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <item.icon size={22} color={item.color} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b', margin: '0 0 8px' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDENT QUOTES ── */}
      <section style={{ padding: '72px 24px', background: '#f5f5f7' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
              What Students Are Saying
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Real feedback from real students
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { quote: 'I finally felt safe enough to report the broken lights in the parking lot. They were fixed within a week!', faculty: 'Engineering Student', stars: 5 },
              { quote: 'I suggested extending library hours during exam season and it actually happened. ClariBox works!', faculty: 'Business Student', stars: 5 },
              { quote: 'The canteen food quality improved after I submitted feedback. Knowing my voice matters means everything.', faculty: 'Science Student', stars: 5 },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '28px 24px',
                border: '1px solid #f0f0f5',
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                position: 'relative'
              }}>
                {/* Quote mark */}
                <div style={{
                  position: 'absolute', top: '20px', right: '20px',
                  width: '32px', height: '32px', borderRadius: '9px',
                  background: '#eef2ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MessageCircle size={15} color="#6366f1" />
                </div>

                {/* Stars */}
                <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                  {Array.from({ length: item.stars }).map((_, s) => (
                    <Star key={s} size={13} color="#f59e0b" fill="#f59e0b" />
                  ))}
                </div>

                <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: '0 0 16px', fontStyle: 'italic' }}>
                  "{item.quote}"
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                      {item.faculty[0]}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>
                    Anonymous · {item.faculty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{
        padding: '72px 24px',
        background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '250px', height: '250px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            Ready to Make a Difference?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your feedback takes less than 2 minutes and could change the campus experience for thousands of students.
          </p>
          <Link
            to="/submit"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 40px',
              borderRadius: '14px',
              background: '#fff',
              color: '#4f46e5',
              fontSize: '15px', fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            }}
          >
            <Send size={16} color="#4f46e5" />
            Submit Feedback Now
            <ArrowRight size={15} color="#4f46e5" />
          </Link>
        </div>
      </section>

      {/* ── EMERGENCY CONTACT ── */}
      <section style={{ padding: '40px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '16px', padding: '24px',
            display: 'flex', alignItems: 'flex-start', gap: '14px'
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertCircle size={18} color="#d97706" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b', margin: '0 0 6px' }}>
                Need Immediate Help?
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px', lineHeight: 1.6 }}>
                For urgent matters requiring immediate attention, contact staff directly:
              </p>
              <a
                href="tel:+256793702186"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '9px 18px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                }}
              >
                <Phone size={14} />
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