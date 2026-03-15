import { Phone, Mail, MapPin, MessageSquare, Shield, Sparkles } from 'lucide-react';

// WhatsApp SVG icon (not in lucide-react so we use inline SVG)
const WhatsAppIcon = ({ size = 13, color = '#818cf8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Footer = () => {
  return (
    <footer style={{
      background: 'linear-gradient(160deg, #0f0e1a 0%, #1a1730 50%, #0f172a 100%)',
      color: '#94a3b8',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Decorative background blobs */}
      <div style={{
        position: 'absolute', bottom: '-60px', right: '-60px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '-40px', left: '20%',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '52px 24px 0',
        position: 'relative', zIndex: 1
      }}>

        {/* Top section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gap: '48px',
          paddingBottom: '40px'
        }}>

          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '38px', height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
              }}>
                <MessageSquare size={18} color="#fff" />
              </div>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.8px' }}>
                Clari<span style={{ color: '#818cf8' }}>Box</span>
              </span>
            </div>

            <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#64748b', marginBottom: '20px', maxWidth: '280px' }}>
              Your voice matters. ClariBox provides a safe and anonymous way to share thoughts, raise concerns, and suggest improvements that make your university better.
            </p>

            {/* Anonymous badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)'
            }}>
              <Shield size={12} color="#818cf8" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#818cf8' }}>
                100% Anonymous & Secure
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{
              fontSize: '12px', fontWeight: 700,
              color: '#fff',
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: '20px'
            }}>
              Quick Links
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Submit Feedback', href: '/submit' },
                { label: 'About Us',        href: '/about' },
                { label: 'Contact Staff',   href: '/contact' },
                { label: 'Help & FAQ',      href: '/help' },
              ].map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    style={{
                      fontSize: '13px',
                      color: '#64748b',
                      textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                  >
                    <span style={{
                      width: '4px', height: '4px',
                      borderRadius: '50%',
                      background: '#4f46e5',
                      flexShrink: 0
                    }} />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{
              fontSize: '12px', fontWeight: 700,
              color: '#fff',
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: '20px'
            }}>
              Contact Staff
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Phone */}
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Phone size={13} color="#818cf8" />
                </div>
                <span style={{ fontSize: '13px', color: '#64748b' }}>+256 793 702 186</span>
              </li>

              {/* WhatsApp */}
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href="https://wa.me/256793702186"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    textDecoration: 'none',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <WhatsAppIcon size={14} color="#818cf8" />
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>
                    WhatsApp Us
                  </span>
                </a>
              </li>

              {/* Email */}
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Mail size={13} color="#818cf8" />
                </div>
                <span style={{ fontSize: '13px', color: '#64748b' }}>claribox@gmail.com</span>
              </li>

              {/* Location */}
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <MapPin size={13} color="#818cf8" />
                </div>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Main Administration Block, Kihumuro</span>
              </li>

            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
            © {new Date().getFullYear()} ClariBox. Your feedback is completely anonymous.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={11} color="#4f46e5" />
            <span style={{ fontSize: '11px', color: '#475569' }}>
              Powered by local AI — your data never leaves your institution
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;