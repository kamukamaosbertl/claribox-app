import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MessageSquare, Sparkles } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-indigo-500/10 shadow-sm shadow-indigo-500/5">

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
            <MessageSquare className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <span className="text-lg font-extrabold text-indigo-950 tracking-tight">
            Clari<span className="text-indigo-600">Box</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <Link
            to="/"
            className={`text-sm font-medium pb-0.5 border-b-2 transition-colors no-underline
              ${isActive('/') ? 'text-indigo-600 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
          >
            Home
          </Link>
          <Link
            to="/submit"
            className={`text-sm font-medium pb-0.5 border-b-2 transition-colors no-underline
              ${isActive('/submit') ? 'text-indigo-600 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
          >
            Submit Feedback
          </Link>

          {/* CTA */}
          <Link
            to="/submit"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all no-underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Speak Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          {isOpen ? <X className="w-4.5 h-4.5" size={18} /> : <Menu className="w-4.5 h-4.5" size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 px-6 py-4 bg-white flex flex-col gap-1 animate-slideDown">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`px-4 py-3 rounded-xl text-sm font-medium no-underline transition-colors
              ${isActive('/') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            Home
          </Link>
          <Link
            to="/submit"
            onClick={() => setIsOpen(false)}
            className={`px-4 py-3 rounded-xl text-sm font-medium no-underline transition-colors
              ${isActive('/submit') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            Submit Feedback
          </Link>
          <Link
            to="/submit"
            onClick={() => setIsOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/25 no-underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Speak Up
          </Link>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease; }
      `}</style>
    </nav>
  );
};

export default Navbar;