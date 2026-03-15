import { Phone, Mail, MapPin, MessageSquare, Shield, Sparkles } from 'lucide-react';

const WhatsAppIcon = ({ size = 13, color = '#818cf8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const quickLinks = [
  { label: 'Submit Feedback', href: '/submit'  },
  { label: 'About Us',        href: '/about'   },
  { label: 'Contact Staff',   href: '/contact' },
  { label: 'Help & FAQ',      href: '/help'    },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden text-slate-400"
      style={{ background: 'linear-gradient(160deg, #0f0e1a 0%, #1a1730 50%, #0f172a 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
      <div className="absolute -top-10 left-[20%] w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-14">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <MessageSquare className="w-4.5 h-4.5 text-white" size={18} />
              </div>
              <span className="text-3xl font-black text-white tracking-tight">
                Clari<span className="text-indigo-400">Box</span>
              </span>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed mb-5 max-w-xs">
              Your voice matters. ClariBox provides a safe and anonymous way to share thoughts, raise concerns, and suggest improvements that make your university better.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400">100% Anonymous & Secure</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-400 transition-colors no-underline"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-5">
              Contact Staff
            </h3>
            <ul className="space-y-3.5">

              {/* Phone */}
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-sm text-slate-500">+256 793 702 186</span>
              </li>

              {/* WhatsApp */}
              <li>
                <a
                  href="https://wa.me/256793702186"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity no-underline"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                    <WhatsAppIcon size={14} color="#818cf8" />
                  </div>
                  <span className="text-sm text-slate-500">WhatsApp Us</span>
                </a>
              </li>

              {/* Email */}
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-sm text-slate-500">claribox@gmail.com</span>
              </li>

              {/* Location */}
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-sm text-slate-500">Main Administration Block, Kihumuro</span>
              </li>

            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-5 border-t border-white/5">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ClariBox. Your feedback is completely anonymous.
          </p>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span className="text-xs text-slate-600">
              Powered by local AI — your data never leaves your institution
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;