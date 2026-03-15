import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Bot,
  FileText, X, Shield, PieChart, Cog, LogOut, Sparkles
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const menuItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard'        },
  { path: '/admin/chat',      icon: Bot,             label: 'AI Assistant'     },
  { path: '/admin/insights',  icon: PieChart,        label: 'Category Insights'},
  { path: '/admin/reports',   icon: FileText,        label: 'Reports'          },
  { path: '/admin/feedback',  icon: MessageSquare,   label: 'All Feedback'     },
  { path: '/admin/settings',  icon: Cog,             label: 'Settings'         },
];

const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    adminAPI.logout();
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-[260px] text-white border-r border-indigo-900/30"
      style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #1a1730 60%, #0f0e1a 100%)' }}
    >

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 flex-shrink-0">
            <Shield className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-white tracking-tight leading-none">
              Clari<span className="text-indigo-400">Box</span>
            </p>
            <p className="text-xs text-white/40 font-medium mt-0.5">Admin Portal</p>
          </div>
        </div>

        {/* Mobile close — only visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-bold text-white/25 uppercase tracking-widest">Navigation</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${isActive
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 translate-x-0.5'
                : 'text-white/45 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* AI CTA card */}
      <div className="mx-3 mb-3 rounded-2xl p-4 relative overflow-hidden border border-white/10 shadow-lg shadow-indigo-500/20"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
      >
        <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">AI Assistant</span>
          <Sparkles className="w-3 h-3 text-white/60 ml-auto" />
        </div>

        <p className="relative text-xs text-white/65 mb-3 leading-relaxed">
          Analyze feedback and generate reports instantly.
        </p>

        <NavLink
          to="/admin/chat"
          onClick={onClose}
          className="relative block w-full py-2 rounded-xl bg-white text-indigo-600 text-xs font-extrabold text-center hover:bg-indigo-50 transition-colors no-underline"
        >
          Start Chat →
        </NavLink>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/5 pt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/35 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop — fixed sidebar */}
      <div className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </div>

      {/* Mobile — slide-in overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-[#0f0e1a]/70 backdrop-blur-sm"
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