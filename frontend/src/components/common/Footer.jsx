import { Phone, Mail, MapPin, MessageSquare, Shield, Sparkles } from 'lucide-react';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const WhatsAppIcon = ({ size = 14, color = '#60A5FA' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const quickLinks = [
  { label: 'Submit Feedback', href: '/submit'  },
  { label: 'About Us',        href: '/about'   },
  { label: 'Contact Staff',   href: '/contact' },
  { label: 'Help & FAQ',      href: '/help'    },
];

const contactItems = [
  { icon: Phone,     label: '+256 793 702 186',                href: null                              },
  { icon: 'wa',      label: 'WhatsApp Us',                    href: 'https://wa.me/256793702186'      },
  { icon: Mail,      label: 'claribox@gmail.com',             href: null                              },
  { icon: MapPin,    label: 'Main Administration Block, Kihumuro', href: null                         },
];

const Footer = () => (
  <footer style={{
    position: 'relative', overflow: 'hidden', fontFamily: font,
    background: 'linear-gradient(160deg, #0F172A 0%, #0C1222 50%, #080D18 100%)',
    color: '#94A3B8',
  }}>
    {/* Glow blobs */}
    <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: '-40px', left: '20%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
    {/* Grid texture */}
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

    <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 0' }}>

      {/* ── Top grid ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', paddingBottom: '40px' }}>

        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.28)',
            }}>
              <MessageSquare size={17} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.04em' }}>
              Clari<span style={{ color: '#60A5FA' }}>Box</span>
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.65', marginBottom: '18px', maxWidth: '260px' }}>
            Your voice matters. ClariBox provides a safe and anonymous way to share thoughts, raise concerns, and suggest improvements.
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '20px',
            background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.18)',
          }}>
            <Shield size={12} color="#60A5FA" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA' }}>100% Anonymous & Secure</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ fontSize: '10px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 18px' }}>
            Quick Links
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickLinks.map(link => (
              <li key={link.href}>
                <a href={link.href} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '13px', color: '#475569', textDecoration: 'none',
                  transition: 'color 0.14s ease',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#60A5FA'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 style={{ fontSize: '10px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 18px' }}>
            Contact Staff
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {contactItems.map(({ icon: Icon, label, href }) => {
              const iconTile = (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(37,99,235,0.10)',
                  border: '1px solid rgba(37,99,235,0.16)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Icon === 'wa'
                    ? <WhatsAppIcon size={13} />
                    : <Icon size={13} color="#60A5FA" />
                  }
                </div>
              );
              const content = (
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  {iconTile}
                  <span style={{ fontSize: '12.5px', color: '#475569' }}>{label}</span>
                </div>
              );
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      style={{ textDecoration: 'none', display: 'block', transition: 'opacity 0.14s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      {content}
                    </a>
                  ) : content}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '10px', padding: '16px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <p style={{ fontSize: '11.5px', color: '#334155', margin: 0 }}>
          © {new Date().getFullYear()} ClariBox. Your feedback is completely anonymous.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={11} color="#2563EB" />
          <span style={{ fontSize: '11.5px', color: '#334155' }}>
            Powered by local AI — your data never leaves your institution
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;