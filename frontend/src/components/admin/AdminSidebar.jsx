import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  FileText,
  X,
  PieChart,
  Cog,
  LogOut,
  Zap,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

// ── Import logo from assets (fixes logo not showing) ───────────────────────
import clariLogo from '../../assets/Clari.png';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const menuItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/chat', icon: Bot, label: 'AI Assistant' },
  { path: '/admin/insights', icon: PieChart, label: 'Category Insights' },
  { path: '/admin/reports', icon: FileText, label: 'Reports' },
  { path: '/admin/feedback', icon: MessageSquare, label: 'All Feedback' },
  { path: '/admin/settings', icon: Cog, label: 'Settings' },
];

// ── Skeleton shimmer bar ────────────────────────────────────────────────────
const Skel = ({ width = '100%', height = 12, radius = 6, style = {} }) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      background:
        'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.06) 75%)',
      backgroundSize: '600px 100%',
      animation: 'sidebarShimmer 1.6s infinite linear',
      flexShrink: 0,
      ...style,
    }}
  />
);

// ── Skeleton nav row ────────────────────────────────────────────────────────
const SkeletonNavRow = ({ delay = 0 }) => (
  <div
    className="flex items-center gap-[10px] px-3 py-[10px] rounded-xl"
    style={{
      opacity: 0,
      animation: `skelFadeIn 0.35s ease forwards`,
      animationDelay: `${delay}ms`,
    }}
  >
    <Skel width={30} height={30} radius={9} />
    <Skel width="52%" height={11} radius={5} />
  </div>
);

// ── Skeleton CTA card ───────────────────────────────────────────────────────
const SkeletonCTACard = () => (
  <div
    className="mx-[10px] my-3 rounded-2xl p-4 bg-[rgba(37,99,235,0.12)] border border-[rgba(37,99,235,0.18)]"
    style={{ opacity: 0, animation: 'skelFadeIn 0.35s ease forwards', animationDelay: '380ms' }}
  >
    <div className="flex items-center gap-2 mb-3">
      <Skel width={28} height={28} radius={8} />
      <Skel width="48%" height={11} radius={5} />
      <Skel width={32} height={17} radius={99} style={{ marginLeft: 'auto' }} />
    </div>
    <Skel width="88%" height={9} radius={4} style={{ marginBottom: 6 }} />
    <Skel width="68%" height={9} radius={4} style={{ marginBottom: 14 }} />
    <Skel width="100%" height={30} radius={10} />
  </div>
);

// ── Skeleton logo ───────────────────────────────────────────────────────────
const SkeletonLogo = () => (
  <div
    className="flex items-center gap-[10px] px-[14px] py-4 border-b border-white/5 shrink-0"
    style={{ opacity: 0, animation: 'skelFadeIn 0.3s ease forwards' }}
  >
    <Skel width={38} height={38} radius={10} />
    <div className="flex flex-col gap-[7px]">
      <Skel width={88} height={13} radius={5} />
      <Skel width={58} height={8} radius={4} />
    </div>
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────
const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    adminAPI.logout?.();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <aside
      className="flex flex-col w-[260px] h-full relative overflow-hidden border-r border-white/5"
      style={{
        fontFamily: font,
        background: 'linear-gradient(180deg, #0F172A 0%, #0C1222 55%, #080D18 100%)',
      }}
    >
      {/* Keyframe animations */}
      <style>{`
        @keyframes sidebarShimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        @keyframes skelFadeIn {
          from { opacity: 0; transform: translateX(-5px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes contentReveal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Starfield animations ── */
        @keyframes animStar {
          from { transform: translateY(0px); }
          to   { transform: translateY(-2000px); }
        }
        .stars-1 {
          width: 1px; height: 1px; background: transparent;
          box-shadow:
            501px 811px #fff,1450px 1324px #fff,1093px 1780px #fff,1469px 678px #fff,
            904px 741px #fff,1160px 781px #fff,1841px 1962px #fff,1630px 1667px #fff,
            1788px 676px #fff,367px 1734px #fff,1343px 156px #fff,1283px 1142px #fff,
            1062px 378px #fff,1395px 467px #fff,1017px 1891px #fff,137px 1114px #fff,
            1767px 1403px #fff,1543px 11px #fff,1078px 181px #fff,1189px 1574px #fff,
            1697px 1551px #fff,439px 472px #fff,1491px 677px #fff,1364px 599px #fff,
            34px 382px #fff,1221px 1584px #fff,1266px 1499px #fff,169px 1907px #fff,
            1219px 1125px #fff,659px 18px #fff,1731px 1959px #fff,332px 1216px #fff,
            1913px 788px #fff,80px 712px #fff,326px 1605px #fff,574px 1502px #fff,
            473px 1653px #fff,404px 975px #fff,322px 1797px #fff,425px 1321px #fff,
            1121px 1797px #fff,731px 647px #fff,891px 1584px #fff,1523px 109px #fff,
            1379px 244px #fff,865px 1064px #fff,493px 956px #fff,624px 1380px #fff,
            440px 619px #fff,1630px 767px #fff,955px 1196px #fff,62px 729px #fff,
            126px 946px #fff,1256px 896px #fff,1444px 256px #fff,661px 1628px #fff,
            1078px 1716px #fff,300px 737px #fff,1734px 413px #fff,1296px 129px #fff;
          animation: animStar 50s linear infinite;
          position: absolute; top: 0; left: 0;
        }
        .stars-1::after {
          content: " "; position: absolute; top: 2000px; width: 1px; height: 1px;
          background: transparent;
          box-shadow:
            501px 811px #fff,1450px 1324px #fff,1093px 1780px #fff,1469px 678px #fff,
            904px 741px #fff,1160px 781px #fff,1841px 1962px #fff,1630px 1667px #fff,
            1788px 676px #fff,367px 1734px #fff,1343px 156px #fff,1283px 1142px #fff,
            1062px 378px #fff,1395px 467px #fff,1017px 1891px #fff,137px 1114px #fff,
            1767px 1403px #fff,1543px 11px #fff,1078px 181px #fff,1189px 1574px #fff,
            1697px 1551px #fff,439px 472px #fff,1491px 677px #fff,1364px 599px #fff,
            34px 382px #fff,1221px 1584px #fff,1266px 1499px #fff,169px 1907px #fff,
            1219px 1125px #fff,659px 18px #fff,1731px 1959px #fff,332px 1216px #fff,
            1913px 788px #fff,80px 712px #fff,326px 1605px #fff,574px 1502px #fff,
            473px 1653px #fff,404px 975px #fff,322px 1797px #fff,425px 1321px #fff,
            1121px 1797px #fff,731px 647px #fff,891px 1584px #fff,1523px 109px #fff,
            1379px 244px #fff,865px 1064px #fff,493px 956px #fff,624px 1380px #fff,
            440px 619px #fff,1630px 767px #fff,955px 1196px #fff,62px 729px #fff,
            126px 946px #fff,1256px 896px #fff,1444px 256px #fff,661px 1628px #fff,
            1078px 1716px #fff,300px 737px #fff,1734px 413px #fff,1296px 129px #fff;
        }
        .stars-2 {
          width: 2px; height: 2px; background: transparent;
          box-shadow:
            1925px 1320px #fff,693px 1778px #fff,1016px 711px #fff,1171px 563px #fff,
            661px 1919px #fff,1610px 44px #fff,1275px 140px #fff,1208px 1802px #fff,
            1473px 1587px #fff,11px 1117px #fff,853px 1757px #fff,1149px 937px #fff,
            1353px 428px #fff,270px 279px #fff,258px 1404px #fff,417px 1188px #fff,
            286px 561px #fff,393px 1765px #fff,147px 881px #fff,666px 1097px #fff,
            1425px 1278px #fff,806px 156px #fff,1252px 561px #fff,218px 52px #fff,
            1371px 1980px #fff,171px 745px #fff,1424px 89px #fff,137px 244px #fff,
            939px 1922px #fff,137px 1080px #fff,1757px 50px #fff,904px 536px #fff;
          animation: animStar 100s linear infinite;
          position: absolute; top: 0; left: 0;
        }
        .stars-2::after {
          content: " "; position: absolute; top: 2000px; width: 2px; height: 2px;
          background: transparent;
          box-shadow:
            1925px 1320px #fff,693px 1778px #fff,1016px 711px #fff,1171px 563px #fff,
            661px 1919px #fff,1610px 44px #fff,1275px 140px #fff,1208px 1802px #fff,
            1473px 1587px #fff,11px 1117px #fff,853px 1757px #fff,1149px 937px #fff,
            1353px 428px #fff,270px 279px #fff,258px 1404px #fff,417px 1188px #fff,
            286px 561px #fff,393px 1765px #fff,147px 881px #fff,666px 1097px #fff,
            1425px 1278px #fff,806px 156px #fff,1252px 561px #fff,218px 52px #fff,
            1371px 1980px #fff,171px 745px #fff,1424px 89px #fff,137px 244px #fff,
            939px 1922px #fff,137px 1080px #fff,1757px 50px #fff,904px 536px #fff;
        }
        .stars-3 {
          width: 3px; height: 3px; background: transparent;
          box-shadow:
            200px 981px #fff,1731px 521px #fff,132px 1039px #fff,1888px 1547px #fff,
            899px 1226px #fff,1887px 580px #fff,1548px 1092px #fff,1626px 689px #fff,
            254px 1072px #fff,1684px 1211px #fff,672px 1267px #fff,939px 668px #fff,
            1969px 645px #fff,1126px 983px #fff,457px 568px #fff,476px 876px #fff,
            829px 1896px #fff,1364px 1846px #fff,1507px 1120px #fff,936px 1948px #fff;
          animation: animStar 150s linear infinite;
          position: absolute; top: 0; left: 0;
        }
        .stars-3::after {
          content: " "; position: absolute; top: 2000px; width: 3px; height: 3px;
          background: transparent;
          box-shadow:
            200px 981px #fff,1731px 521px #fff,132px 1039px #fff,1888px 1547px #fff,
            899px 1226px #fff,1887px 580px #fff,1548px 1092px #fff,1626px 689px #fff,
            254px 1072px #fff,1684px 1211px #fff,672px 1267px #fff,939px 668px #fff,
            1969px 645px #fff,1126px 983px #fff,457px 568px #fff,476px 876px #fff,
            829px 1896px #fff,1364px 1846px #fff,1507px 1120px #fff,936px 1948px #fff;
        }
      `}</style>

      {/* ── Starfield layers ──────────────────────────────── */}
      <div className="stars-1" />
      <div className="stars-2" />
      <div className="stars-3" />

      {/* Blue glow orb */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '-60px',
          right: '-60px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)',
        }}
      />

      {/* ── Logo ─────────────────────────────────────────── */}
      {loading ? (
        <SkeletonLogo />
      ) : (
        <div
          className="flex items-center justify-between px-[14px] py-4 border-b border-white/5 shrink-0 relative z-10"
          style={{ animation: 'contentReveal 0.3s ease' }}
        >
          <div className="flex items-center gap-[10px]">
            {/* Logo in white ellipse */}
            <div
              className="shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: '0 2px 12px rgba(255,255,255,0.18)',
              }}
            >
              <img
                src={clariLogo}
                alt="ClariBox icon"
                style={{ width: '90px', height: '90px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <p
                className="font-black leading-none m-0 tracking-[-0.04em]"
                style={{ fontFamily: font, fontSize: '32px' }}
              >
                <span className="text-[#60A5FA]">Clari</span>
                <span className="text-[#4ADE80]">Box</span>
              </p>
              <p className="text-[15px] text-white/30 font-semibold mt-[3px] mb-0 tracking-[0.06em] uppercase text-center">
                Admin Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center cursor-pointer text-white/50 transition-all duration-150 shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Nav section label ─────────────────────────────── */}
      <div className="px-[18px] pt-[18px] pb-2 relative z-10">
        {loading ? (
          <Skel width={68} height={8} radius={4} />
        ) : (
          <p
            className="text-[10px] font-extrabold text-white/20 uppercase tracking-[0.12em] m-0"
            style={{ animation: 'contentReveal 0.3s ease' }}
          >
            Navigation
          </p>
        )}
      </div>

        {/* ── Nav items ─────────────────────────────────────── */}
        <nav className="flex-1 px-[10px] overflow-y-auto flex flex-col gap-1 relative z-10">
          {loading
            ? menuItems.map((_, i) => <SkeletonNavRow key={i} delay={i * 55} />)
            : menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-[10px] px-[12px] py-[10px] rounded-[12px]
                    text-[13px] transition-all duration-[0.18s]
                    ${isActive
                      ? 'bg-gradient-to-br from-blue-600/90 to-blue-800/80 text-white font-bold border border-blue-300/30 shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/10 hover:scale-[1.02]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`w-[30px] h-[30px] rounded-[9px] shrink-0 flex items-center justify-center transition-all duration-[0.18s]
                        ${isActive
                          ? 'bg-white/20'
                          : 'bg-white/5 group-hover:bg-white/15'
                        }`}
                      >
                        <item.icon
                          size={14}
                          color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.52)'}
                        />
                      </div>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
        </nav>

      {/* ── AI CTA card ───────────────────────────────────── */}
      {loading ? (
        <SkeletonCTACard />
      ) : (
        <div
          className="mx-[10px] my-3 rounded-2xl p-4 relative overflow-hidden border border-[rgba(37,99,235,0.35)] z-10"
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1D4ED8 100%)',
            boxShadow: '0 8px 24px rgba(37,99,235,0.20)',
            animation: 'contentReveal 0.4s ease',
          }}
        >
          {/* Decorative circle */}
          <div className="absolute top-[-16px] right-[-16px] w-[70px] h-[70px] rounded-full bg-white/[0.08] pointer-events-none" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg shrink-0 bg-white/15 border border-white/20 flex items-center justify-center">
              <Bot size={14} color="#FFFFFF" />
            </div>
            <span
              className="text-[13px] font-extrabold text-white tracking-[-0.02em]"
              style={{ fontFamily: font }}
            >
              AI Assistant
            </span>
            <div className="ml-auto flex items-center gap-[3px] bg-[rgba(251,191,36,0.18)] border border-[rgba(251,191,36,0.28)] rounded-[20px] px-[7px] py-[2px]">
              <Zap size={9} color="#FCD34D" />
              <span className="text-[9px] font-bold text-[#FCD34D] tracking-[0.04em]">AI</span>
            </div>
          </div>

          <p className="relative text-[11.5px] text-white/[0.68] my-0 mb-3 leading-[1.55]">
            Analyze feedback and generate instant reports.
          </p>

          <NavLink
            to="/admin/chat"
            onClick={onClose}
            className="relative block w-full py-2 rounded-[10px] bg-white text-[#1D4ED8] text-[12px] font-extrabold text-center no-underline tracking-[-0.01em] border border-white/90"
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              fontFamily: font,
            }}
          >
            Start Chat →
          </NavLink>
        </div>
      )}

      {/* ── Logout ────────────────────────────────────────── */}
      <div className="px-[10px] pt-2 pb-4 border-t border-white/5 shrink-0 relative z-10">
        {loading ? (
          <div
            className="px-3 py-[9px] flex items-center gap-[10px]"
            style={{
              opacity: 0,
              animation: 'skelFadeIn 0.35s ease forwards',
              animationDelay: '440ms',
            }}
          >
            <Skel width={28} height={28} radius={8} />
            <Skel width="42%" height={10} radius={5} />
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-[10px] px-3 py-[9px] rounded-[11px] border-none bg-transparent text-white/[0.52] text-[13px] font-semibold cursor-pointer text-left transition-all duration-[0.16s]"
            style={{ fontFamily: font, animation: 'contentReveal 0.3s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.10)';
              e.currentTarget.style.color = '#FCA5A5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.52)';
            }}
          >
            <div className="w-7 h-7 rounded-lg shrink-0 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.12)] flex items-center justify-center">
              <LogOut size={14} color="rgba(239,68,68,0.72)" />
            </div>
            Sign out
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop — fixed sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </div>

      {/* Mobile — slide-in overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0"
            style={{ background: 'rgba(8,13,24,0.60)' }}
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;