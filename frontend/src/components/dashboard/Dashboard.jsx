import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { dashboardConfig } from '../../config/dashboardConfig';

import DashboardHeader from './DashboardHeader';
import StatsCards from './StatsCards';
import DateFilters from './DateFilters';
import CategoryChart from './CategoryChart';
import TimelineChart from './TimelineChart';
import RecentFeedback from './RecentFeedback';
import TrendingIssues from './TrendingIssues';
import ResolutionsPanel from './ResolutionsPanel';
import ResolutionModal from './ResolutionModal';
import AiCTA from './AiCTA';
import SentimentAnalysis from './SentimentAnalysis';
import ClariCoin from './ClariCoin'; // ← added

// ─────────────────────────────────────────────
// Section wrapper — shared card shell
// ─────────────────────────────────────────────
const SectionCard = ({ children, className = '' }) => (
  <div
    className={`
      bg-white border border-[#E2E8F0] rounded-[20px]
      shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)]
      transition-[box-shadow,border-color] duration-200 ease-in-out
      hover:shadow-[0_4px_20px_rgba(37,99,235,0.10)] hover:border-[#BFDBFE]
      ${className}
    `}
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────
// Section header inside a card
// ─────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, badge }) => (
  <div className="flex items-start justify-between gap-3 mb-5">
    <div>
      <h3
        className="text-base font-bold tracking-[-0.025em] text-[#0F172A] m-0"
        style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          className="mt-1 text-[13px] text-[#64748B] leading-[1.5]"
          style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
        >
          {subtitle}
        </p>
      )}
    </div>
    {badge && (
      <span
        className="
          shrink-0 inline-flex items-center
          bg-[#EFF6FF] border border-[#DBEAFE] rounded-[20px]
          px-[10px] py-[3px] text-[11px] font-semibold text-[#2563EB]
          tracking-[0.01em] whitespace-nowrap
        "
        style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
      >
        {badge}
      </span>
    )}
  </div>
);

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
const Dashboard = () => {
  const [dateFilter, setDateFilter] = useState('all');
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);

  const [admin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminUser') || '{}');
    } catch {
      return { name: 'Admin', email: '', role: 'admin' };
    }
  });

  const { data, loading, error, lastUpdated, refresh } = useDashboardData(dateFilter);

  const thisWeekCount = data?.stats?.thisWeekCount ?? 0;
  const lastWeekCount = data?.stats?.lastWeekCount ?? 0;

  useEffect(() => {
    if (data?.stats) console.log('Dashboard stats:', data.stats);
  }, [data]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div
        className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-6 py-12"
        style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
      >
        <div
          className="
            w-full max-w-[400px] bg-white border border-[#E2E8F0]
            rounded-[28px] px-8 py-10 text-center
            shadow-[0_10px_40px_rgba(15,23,42,0.08)]
          "
        >
          {/* Spinner */}
          <div
            className="
              w-14 h-14 rounded-full border-4 border-[#DBEAFE] border-t-[#2563EB]
              mx-auto mb-6 animate-spin
            "
          />
          <h2
            className="text-[22px] font-bold tracking-[-0.03em] text-[#0F172A] mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
          >
            Loading Dashboard
          </h2>
          <p
            className="text-sm text-[#64748B]"
            style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
          >
            Preparing your analytics…
          </p>
        </div>
      </div>
    );
  }

  // ── Page layout ──────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#F4F7FB]"
      style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
    >
      {/* Subtle top-of-page accent bar */}
      <div
        className="h-[3px] sticky top-0 z-50"
        style={{
          background:
            'linear-gradient(90deg, #2563EB 0%, #3B82F6 60%, #22C55E 100%)',
        }}
      />

      <div className="max-w-[1280px] mx-auto px-5 py-7">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        {dashboardConfig.showHeader && (
          <div className="mb-7">
            <DashboardHeader
              lastUpdated={lastUpdated}
              onRefresh={refresh}
              loading={loading}
              admin={admin}
              thisWeekCount={thisWeekCount}
              lastWeekCount={lastWeekCount}
            />
          </div>
        )}

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div
            className="
              mb-6 bg-[#FEF2F2] border border-[#FECACA]
              rounded-2xl p-4 px-5 flex items-start gap-[14px]
            "
          >
            <div
              className="
                shrink-0 w-10 h-10 rounded-[10px] bg-white border border-[#FEE2E2]
                flex items-center justify-center
              "
            >
              <AlertCircle size={18} color="#DC2626" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-[#991B1B] mb-[3px]">
                Something went wrong
              </h3>
              <p className="text-[13px] text-[#B91C1C] m-0">{error}</p>
            </div>
            <button
              onClick={refresh}
              className="
                shrink-0 inline-flex items-center gap-[6px]
                bg-white border border-[#FCA5A5] rounded-[10px]
                px-[14px] py-[7px] text-[13px] font-semibold text-[#B91C1C]
                cursor-pointer
              "
              style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        {/* ── Stats row + Date filter ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-5 mb-6 items-start">
          {/* Stats cards */}
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatsCards stats={data.stats} />
          </div>

          {/* Date filter card */}
          <SectionCard className="p-5 self-start">
            <SectionHeader
              title="Filter Overview"
              subtitle="Narrow dashboard insights by timeline."
            />
            <DateFilters currentFilter={dateFilter} onFilterChange={setDateFilter} />
          </SectionCard>
        </div>

        {/* ── Sentiment + Charts ───────────────────────────────────────────── */}
        <div
          className="grid gap-5 mb-6"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {/* Sentiment spans full width */}
          {dashboardConfig.showSentimentAnalysis && (
            <SectionCard className="col-span-full p-6 px-7">
              <SectionHeader
                title="Sentiment Analysis"
                subtitle="Positive, neutral, and negative feedback patterns."
                badge="Live overview"
              />
              <SentimentAnalysis sentimentData={data.sentiment} />
            </SectionCard>
          )}

          {/* Category chart — wider */}
          {dashboardConfig.showCharts && dashboardConfig.showCategoryChart && (
            <SectionCard
              className="h-[340px] p-6 px-7 overflow-hidden"
              style={{ gridColumn: 'span 2' }}
            >
              <SectionHeader
                title="Feedback by Category"
                subtitle="Compare the volume of submissions across categories."
              />
              <CategoryChart data={data.categoryData} />
            </SectionCard>
          )}

          {/* Timeline chart */}
          {dashboardConfig.showCharts && dashboardConfig.showTimeline && (
            <SectionCard className="h-[340px] p-6 px-7 overflow-hidden">
              <SectionHeader
                title="Feedback Over Time"
                subtitle="Track reporting activity and momentum over time."
              />
              <TimelineChart data={data.timeData} />
            </SectionCard>
          )}
        </div>

        {/* ── Recent Feedback + Trending Issues ────────────────────────────── */}
        {(dashboardConfig.showRecentFeedback || dashboardConfig.showTrendingIssues) && (
          <div
            className="grid gap-5 mb-6"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
          >
            {dashboardConfig.showRecentFeedback && (
              <SectionCard className="h-[440px] p-6 px-7 overflow-hidden">
                <SectionHeader
                  title="Recent Feedback"
                  subtitle="Latest submissions requiring visibility and quick review."
                />
                <RecentFeedback items={data.recent} />
              </SectionCard>
            )}

            {dashboardConfig.showTrendingIssues && (
              <SectionCard className="h-[440px] p-6 px-7 overflow-hidden">
                <SectionHeader
                  title="Trending Issues"
                  subtitle="Repeated problem areas gaining traction this period."
                />
                <TrendingIssues trends={data.trends} />
              </SectionCard>
            )}
          </div>
        )}

        {/* ── Resolutions Panel ─────────────────────────────────────────────── */}
        {dashboardConfig.showResolutionsPanel && (
          <div className="mb-6">
            <SectionCard>
              {/* Card header row with bottom border */}
              <div
                className="
                  border-b border-[#F1F5F9] px-7 py-5
                  flex items-center justify-between gap-3
                "
              >
                <div>
                  <h3
                    className="text-base font-bold tracking-[-0.025em] text-[#0F172A] m-0"
                    style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
                  >
                    Recent Resolutions
                  </h3>
                  <p
                    className="mt-1 text-[13px] text-[#64748B]"
                    style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
                  >
                    Monitor resolved issues and keep actions accountable.
                  </p>
                </div>
                <span
                  className="
                    inline-flex items-center gap-[5px]
                    bg-[#F0FDF4] border border-[#BBF7D0] rounded-[20px]
                    px-3 py-1 text-[11px] font-semibold text-[#166534] whitespace-nowrap
                  "
                  style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-[#22C55E] inline-block" />
                  All resolved
                </span>
              </div>

              <div className="p-6 px-7">
                <ResolutionsPanel resolutions={data.resolutions} onRefresh={refresh} />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── AI CTA ────────────────────────────────────────────────────────── */}
        {dashboardConfig.showAiCTA && (
          <div
            className="rounded-3xl p-[2px] mb-2"
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #1D4ED8 100%)',
              boxShadow: '0 16px 48px rgba(37,99,235,0.28)',
            }}
          >
            <div
              className="rounded-[22px] p-8 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #1D4ED8 100%)',
              }}
            >
              {/* Mesh background */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)',
                }}
              />
              <div
                className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
              <div className="relative text-white">
                <AiCTA />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Resolution Modal ──────────────────────────────────────────────── */}
      <ResolutionModal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        onSuccess={refresh}
      />

      {/* ── Clari spinning logo — fixed bottom-left ───────────────────────── */}
      <ClariCoin size={48} />

    </div>
  );
};

export default Dashboard;