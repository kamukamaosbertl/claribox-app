import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { dashboardConfig } from '../../config/dashboardConfig';

import DashboardHeader    from './DashboardHeader';
import StatsCards         from './StatsCards';
import DateFilters        from './DateFilters';
import CategoryChart      from './CategoryChart';
import TimelineChart      from './TimelineChart';
import RecentFeedback     from './RecentFeedback';
import TrendingIssues     from './TrendingIssues';
import ResolutionsPanel   from './ResolutionsPanel';
import ResolutionModal    from './ResolutionModal';
import AiCTA              from './AiCTA';
import SentimentAnalysis  from './SentimentAnalysis';

const Dashboard = () => {
  const [dateFilter,           setDateFilter]           = useState('all');
  const [resolutionModalOpen,  setResolutionModalOpen]  = useState(false);

  // ── Get real admin info from localStorage ─────────────────────────────────
  // This is saved when the admin logs in (email or Google)
  // So the greeting will show their real name 
  const [admin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminUser') || '{}');
    } catch {
      return { name: 'Admin', email: '', role: 'admin' };
    }
  });

  const handleResolvedClick = () => setResolutionModalOpen(true);
  const { data, loading, error, lastUpdated, refresh } = useDashboardData(dateFilter);

  useEffect(() => {
    if (data?.stats) {
      console.log('Dashboard stats:', data.stats);
    }
  }, [data]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-500">Preparing your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">

        {/* ── Header — shows real admin name and greeting ── */}
        {dashboardConfig.showHeader && (
          <div className="mb-8 lg:mb-12">
            <DashboardHeader
              lastUpdated={lastUpdated}
              onRefresh={refresh}
              loading={loading}
              admin={admin}
            />
          </div>
        )}

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-900 mb-1">Something went wrong</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={refresh}
                className="ml-3 flex-shrink-0 px-4 py-1.5 bg-white text-red-700 font-medium text-sm rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* ── Stats + Date Filter ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8 lg:mb-12">
          <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <StatsCards stats={data.stats} />
          </div>
          <div className="xl:col-span-1">
            <DateFilters currentFilter={dateFilter} onFilterChange={setDateFilter} />
          </div>
        </div>

        {/* ── Charts + Sentiment ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">

          {dashboardConfig.showSentimentAnalysis && (
            <div className="lg:col-span-2 xl:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
                <SentimentAnalysis sentimentData={data.sentiment} />
              </div>
            </div>
          )}

          {dashboardConfig.showCharts && (
            <>
              {dashboardConfig.showCategoryChart && (
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[320px]">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback by Category</h3>
                    <CategoryChart data={data.categoryData} />
                  </div>
                </div>
              )}
              {dashboardConfig.showTimeline && (
                <div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[320px]">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Over Time</h3>
                    <TimelineChart data={data.timeData} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Recent Feedback + Trending Issues ── */}
        {(dashboardConfig.showRecentFeedback || dashboardConfig.showTrendingIssues) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
            {dashboardConfig.showRecentFeedback && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[420px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Feedback</h3>
                <RecentFeedback items={data.recent} />
              </div>
            )}
            {dashboardConfig.showTrendingIssues && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[420px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Trending Issues</h3>
                <TrendingIssues trends={data.trends} />
              </div>
            )}
          </div>
        )}

        {/* ── Resolutions Panel ── */}
        {dashboardConfig.showResolutionsPanel && (
          <div className="mb-8 lg:mb-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <ResolutionsPanel resolutions={data.resolutions} onRefresh={refresh} />
            </div>
          </div>
        )}

        {/* ── AI CTA ── */}
        {dashboardConfig.showAiCTA && (
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-8 text-white shadow-xl">
            <AiCTA />
          </div>
        )}

      </div>

      {/* ── Resolution Modal ── */}
      <ResolutionModal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
};

export default Dashboard;