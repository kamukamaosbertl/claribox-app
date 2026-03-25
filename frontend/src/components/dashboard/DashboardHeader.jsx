import { Link } from 'react-router-dom';
import { RefreshCw, Sparkles, Bot, TrendingUp } from 'lucide-react';

const DashboardHeader = ({
  lastUpdated,
  onRefresh,
  loading,
  admin,
  thisWeekCount = 0,
  lastWeekCount = 0,
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

  let percentageChange = 0;

  if (lastWeekCount === 0 && thisWeekCount === 0) {
    percentageChange = 0;
  } else if (lastWeekCount === 0) {
    percentageChange = 100;
  } else {
    percentageChange = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
  }

  if (percentageChange > 100) percentageChange = 100;
  if (percentageChange < -100) percentageChange = -100;

  const roundedChange = Math.round(percentageChange);
  const trendText = `${roundedChange > 0 ? '+' : ''}${roundedChange}% feedback`;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFF_100%)] shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_32px_rgba(37,99,235,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-[24px] bg-[linear-gradient(90deg,#2563EB_0%,#3B82F6_50%,#22C55E_100%)]" />

      <div className="pointer-events-none absolute right-0 top-0 h-full w-[320px] bg-[radial-gradient(ellipse_at_100%_50%,rgba(37,99,235,0.04)_0%,transparent_70%)]" />

      <div className="relative px-8 py-7">
        <div className="flex flex-row flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <div className="relative shrink-0">
              <div className="flex h-[56px] w-[56px] items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#2563EB_0%,#1D4ED8_100%)] font-sans text-[18px] font-bold tracking-[-0.02em] text-white shadow-[0_4px_16px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.15)]">
                {initials}
              </div>

              <div className="absolute bottom-[-2px] right-[-2px] h-[14px] w-[14px] rounded-full border-[2.5px] border-white bg-[#22C55E] shadow-[0_0_0_3px_rgba(34,197,94,0.15)]" />
            </div>

            <div className="min-w-0">
              {admin?.role && (
                <div className="mb-[6px]">
                  <span className="inline-flex items-center gap-[5px] rounded-[6px] border border-[#DBEAFE] bg-[#EFF6FF] px-2 py-[2px] font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#2563EB]">
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#2563EB]" />
                    {admin.role}
                  </span>
                </div>
              )}

              <h1 className="m-0 break-words font-sans text-[clamp(18px,3vw,26px)] font-bold leading-[1.25] tracking-[-0.035em] text-[#0F172A]">
                {greeting()},{' '}
                <span className="text-[#2563EB]">
                  {admin?.name?.split(' ')[0] || 'Admin'}
                </span>
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-sans text-[13px] font-medium text-[#64748B]">
                  {today}
                </span>

                {lastUpdated && (
                  <div className="inline-flex items-center gap-[6px] rounded-[20px] border border-[#BBF7D0] bg-[#F0FDF4] px-[10px] py-[3px]">
                    <span className="relative inline-flex h-2 w-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#22C55E] opacity-40" />
                      <span className="relative inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
                    </span>
                    <span className="font-sans text-[11px] font-semibold text-[#166534]">
                      Live · {formatTime(lastUpdated)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2 rounded-[12px] border border-[#E2E8F0] bg-[#FAFAFA] px-[14px] py-[10px]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,#DCFCE7_0%,#BBF7D0_100%)]">
                <TrendingUp size={15} color="#16A34A" />
              </div>
              <div>
                <p className="m-0 font-sans text-[11px] font-medium leading-none text-[#94A3B8]">
                  This week
                </p>
                <p className="mt-[2px] font-sans text-[14px] font-bold leading-none tracking-[-0.02em] text-[#0F172A]">
                  {trendText}
                </p>
              </div>
            </div>

            <div className="h-9 w-px bg-[#E2E8F0]" />

            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh data"
              className={`inline-flex h-[42px] w-[42px] items-center justify-center rounded-[11px] border border-[#E2E8F0] bg-white text-[#475569] shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all duration-150 ease-in-out ${
                loading
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:border-[#BFDBFE] hover:text-[#2563EB] hover:shadow-[0_4px_12px_rgba(37,99,235,0.12)]'
              }`}
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
            </button>

            <Link
              to="/admin/chat"
              className="inline-flex whitespace-nowrap rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,#2563EB_0%,#1D4ED8_100%)] px-[18px] py-[10px] font-sans text-[13.5px] font-bold tracking-[-0.01em] text-white no-underline shadow-[0_4px_16px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-[180ms] ease-in-out hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#1D4ED8_0%,#1E40AF_100%)] hover:shadow-[0_6px_24px_rgba(37,99,235,0.38),inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <div className="inline-flex items-center gap-2">
                <Bot size={15} />
                <span>Ask AI</span>
                <Sparkles size={13} className="opacity-[0.85]" />
              </div>
            </Link>
          </div>
        </div>

        <p className="m-[18px_0_0] mt-[18px] border-t border-[#F1F5F9] pt-[18px] font-sans text-[13.5px] font-normal leading-[1.6] text-[#64748B]">
          Here's what's happening with student feedback across your institution.
          <Link
            to="/admin/reports"
            className="ml-2 text-[12px] font-semibold text-[#2563EB] no-underline hover:text-[#1D4ED8]"
          >
            View full report →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default DashboardHeader;