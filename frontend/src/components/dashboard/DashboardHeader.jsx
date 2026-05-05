import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

const DashboardHeader = ({
  lastUpdated,
  onRefresh,
  loading,
  admin,
}) => {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const today = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const initials = admin?.name
    ? admin.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : 'AD';

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-blue-500 to-green-500" />

      <div className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-base font-bold text-white">
                {initials}
              </div>

              <div className="absolute bottom-[-2px] right-[-2px] h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-[-0.03em] text-slate-950">
                {greeting()}, {admin?.name?.split(' ')[0] || 'Admin'}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-500">
                  {today}
                </span>

                {admin?.role && (
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-600">
                    {admin.role}
                  </span>
                )}

                {lastUpdated && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Live · {formatTime(lastUpdated)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
            className={`
              inline-flex h-11 w-11 items-center justify-center rounded-xl
              border border-slate-200 bg-white text-slate-600
              shadow-sm transition
              ${
                loading
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:border-blue-200 hover:text-blue-600 hover:shadow-md'
              }
            `}
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-500">
          Monitor student feedback, sentiment, and recurring issues from one focused dashboard.
          <Link
            to="/admin/reports"
            className="ml-2 text-xs font-bold text-blue-600 no-underline hover:text-blue-700"
          >
            View full report →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default DashboardHeader;