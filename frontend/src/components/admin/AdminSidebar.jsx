import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bot, 
  FileText, 
  Settings, 
  LogOut, 
  X, 
  Shield,
  PieChart,
  Cog
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/chat', icon: Bot, label: 'AI Assistant' },
    { path: '/admin/insights', icon: PieChart, label: 'Category Insights' },
    { path: '/admin/reports', icon: FileText, label: 'Reports' },
    { path: '/admin/feedback', icon: MessageSquare, label: 'All Feedback' },
    { path: '/admin/settings', icon: Cog, label: 'Settings' },
  ];

  const handleLogout = () => {
    adminAPI.logout();
    navigate('/admin/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-72">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-wide">ClariBox</span>
              <p className="text-xs text-slate-400 font-medium">Admin Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 -translate-y-0.5'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            onClick={() => onClose()}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* AI Assistant CTA Card */}
      <div className="p-4 mx-4 mb-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-900/20 border border-indigo-500/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm text-white">AI Assistant</span>
        </div>
        <p className="text-xs text-indigo-100 mb-3 leading-relaxed">
          Analyze feedback and generate reports instantly.
        </p>
        <NavLink
          to="/admin/chat"
          className="block w-full bg-white text-indigo-600 text-center py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors"
          onClick={() => onClose()}
        >
          Start Chat
        </NavLink>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-72">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;