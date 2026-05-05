import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  RefreshCw,
  Sparkles,
  Brain,
  Flame,
  MessageSquare,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';

import { useDashboardData } from '../../hooks/useDashboardData';
import { useRealTimeNotifications } from '../../hooks/useRealTimeNotifications';

import DashboardHeader from './DashboardHeader';
import DateFilters from './DateFilters';
import CategoryChart from './CategoryChart';
import RecentFeedback from './RecentFeedback';
import TrendingIssues from './TrendingIssues';
import SentimentAnalysis from './SentimentAnalysis';
import { UrgentAlertBanner } from './UrgentAlertBanner';

const SectionCard = ({ children, className = '' }) => (
  <section
    className={`
      relative overflow-hidden rounded-[28px]
      border border-slate-200 bg-white
      shadow-[0_18px_45px_rgba(15,23,42,0.06)]
      ${className}
    `}
  >
    {children}
  </section>
);

const SectionHeader = ({ icon: Icon, title, subtitle, badge, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={`
              flex h-11 w-11 shrink-0 items-center justify-center
              rounded-2xl border ${tones[tone]}
            `}
          >
            <Icon size={20} />
          </div>
        )}

        <div>
          <h3 className="text-[17px] font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {badge && (
        <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">
          {badge}
        </span>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [dateFilter, setDateFilter] = useState('all');

  const navigate = useNavigate();

  const { urgentAlerts, dismissAlert } = useRealTimeNotifications();

  const {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useDashboardData(dateFilter);

  const [admin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminUser') || '{}');
    } catch {
      return { name: 'Admin', email: '', role: 'admin' };
    }
  });

  const negativeCount = data?.sentiment?.negative ?? 0;

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] px-6">
        <div className="w-full max-w-[390px] rounded-[32px] border border-slate-200 bg-white px-8 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-100 bg-blue-50">
            <Brain className="animate-pulse text-blue-600" size={30} />
          </div>

          <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
            Loading dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Preparing feedback insights...
          </p>
        </div>
      </div>
    );
  }

  const hasNegativeFeedback = negativeCount > 0;

  return (
    <div className="relative min-h-screen bg-[#F4F7FB]">
      <div className="sticky top-0 z-30 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500" />

      <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          loading={loading}
          admin={admin}
          thisWeekCount={data?.stats?.thisWeekCount ?? 0}
          lastWeekCount={data?.stats?.lastWeekCount ?? 0}
        />

        <UrgentAlertBanner
          alerts={urgentAlerts}
          onDismiss={dismissAlert}
          onView={() => navigate('/admin/feedback')}
        />

        {error && (
          <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="mt-1 text-red-600" />

            <div className="flex-1">
              <h3 className="text-sm font-black text-red-900">
                Something went wrong
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>

            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* ACTION SUMMARY */}
        <section className="relative overflow-hidden rounded-[34px] border border-blue-100 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-green-100 blur-3xl" />

          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_360px]">
            <div>
            

              <h1 className="mt-5 max-w-3xl text-2xl font-black leading-[1.08] tracking-[-0.05em] text-slate-950 sm:text-4xl">
                {hasNegativeFeedback
                  ? 'Student feedback shows issues that need attention.'
                  : 'Student feedback is currently stable.'}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                This dashboard focuses on sentiment, recent feedback, repeated issues,
                and problem categories so admins can decide what to review first.
              </p>
            </div>

            <div
              className={`
                rounded-[26px] border p-5
                ${
                  hasNegativeFeedback
                    ? 'border-red-100 bg-red-50'
                    : 'border-green-100 bg-green-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    flex h-12 w-12 items-center justify-center rounded-2xl
                    ${
                      hasNegativeFeedback
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                    }
                  `}
                >
                  <AlertCircle size={24} />
                </div>

                <div>
                  <p
                    className={`
                      text-sm font-black
                      ${hasNegativeFeedback ? 'text-red-900' : 'text-green-900'}
                    `}
                  >
                    {hasNegativeFeedback ? 'Priority focus' : 'No urgent pattern'}
                  </p>

                  <p
                    className={`
                      text-sm
                      ${hasNegativeFeedback ? 'text-red-700' : 'text-green-700'}
                    `}
                  >
                    {hasNegativeFeedback
                      ? 'Review trending issues and recent feedback first.'
                      : 'Keep monitoring new feedback as it arrives.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/admin/feedback')}
                className={`
                  mt-5 w-full rounded-2xl px-4 py-3 text-sm font-bold text-white transition
                  ${
                    hasNegativeFeedback
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }
                `}
              >
                Review feedback
              </button>
            </div>
          </div>
        </section>

        {/* SENTIMENT + FILTER */}
        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_340px]">
          <SectionCard className="bg-gradient-to-br from-white to-blue-50/40 p-5 sm:p-6">
            <SectionHeader
              icon={Brain}
              title="Sentiment Analysis"
              subtitle="Understand whether feedback is positive, neutral, or negative."
              badge="AI monitored"
              tone="blue"
            />
            <SentimentAnalysis sentimentData={data.sentiment} />
          </SectionCard>

          <SectionCard className="p-5 sm:p-6">
            <SectionHeader
              icon={SlidersHorizontal}
              title="Filter Overview"
              subtitle="Change the feedback period without cluttering the page."
              tone="slate"
            />
            <DateFilters
              currentFilter={dateFilter}
              onFilterChange={setDateFilter}
            />
          </SectionCard>
        </section>

        {/* MAIN WORK AREA */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <SectionCard className="min-h-[460px] p-5 sm:p-6">
            <SectionHeader
              icon={MessageSquare}
              title="Recent Feedback"
              subtitle="Newest student submissions for quick review."
              badge="Latest"
              tone="green"
            />
            <RecentFeedback items={data.recent} />
          </SectionCard>

          <div className="space-y-6">
            <SectionCard className="min-h-[260px] border-red-100 bg-gradient-to-br from-white to-red-50/50 p-5 sm:p-6">
              <SectionHeader
                icon={Flame}
                title="Trending Issues"
                subtitle="Repeated problems detected across student feedback."
                badge="Watchlist"
                tone="red"
              />
              <TrendingIssues trends={data.trends} />
            </SectionCard>

            <SectionCard className="min-h-[260px] p-5 sm:p-6">
              <SectionHeader
                icon={Activity}
                title="Problem Categories"
                subtitle="See where feedback is concentrated."
                tone="blue"
              />
              <div className="h-[240px] sm:h-[280px]">
                <CategoryChart data={data.categoryData} />
              </div>
            </SectionCard>
          </div>
        </section>
      </main>

      {/* FLOATING AI ASSISTANT */}
      <button
     onClick={() => navigate('/admin/chat')}
        className="
          group fixed bottom-6 right-6 z-50
          flex h-16 w-16 items-center justify-center rounded-full
          bg-gradient-to-br from-blue-600 via-blue-500 to-green-500
          text-white shadow-[0_22px_50px_rgba(37,99,235,0.40)]
          transition hover:scale-105 active:scale-95
        "
        aria-label="Open AI Assistant"
      >
        <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
        <Sparkles size={28} className="relative z-10" />
      </button>
    </div>
  );
};

export default Dashboard;