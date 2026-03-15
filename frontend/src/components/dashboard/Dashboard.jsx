import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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

const Dashboard = () => {
  const [dateFilter, setDateFilter] = useState('all');
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);

  const [admin] = useState({
    name: 'Admin User',
    email: 'admin@school.edu',
    role: 'Administrator'
  });

  const handleResolvedClick = () => setResolutionModalOpen(true);
  const { data, loading, error, lastUpdated, refresh } = useDashboardData(dateFilter);

  useEffect(() => {
    if (data?.stats) {
      console.log('Dashboard stats:', data.stats);
    }
  }, [data]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-12 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-indigo-100/50 border-t-indigo-500 rounded-full animate-spin shadow-2xl mx-auto" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center animate-pulse shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Loading Dashboard</h2>
            <p className="text-sm text-slate-500 font-medium">Preparing your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Premium Background System */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 overflow-hidden">
        {/* Large decorative orbs */}
        <div className="absolute -bottom-96 -right-96 w-[800px] h-[800px] bg-gradient-to-r from-indigo-400/15 via-purple-400/10 to-pink-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-80 -left-80 w-[600px] h-[600px] bg-gradient-to-b from-indigo-300/20 via-blue-300/15 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(55,65,81,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(99,102,241,0.06),transparent_50%)]" />
      </div>

      <div className="relative z-40">
        {/* Main Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          
          {/* Header Section */}
          <section className="mb-12 lg:mb-20">
            {dashboardConfig.showHeader && (
              <DashboardHeader
                lastUpdated={lastUpdated}
                onRefresh={refresh}
                loading={loading}
                admin={admin}
              />
            )}
          </section>

          {/* Error Banner */}
          {error && (
            <section className="mb-12">
              <div className="bg-gradient-to-r from-rose-50 to-red-50/50 backdrop-blur-sm border border-rose-200/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 mb-12">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertCircle size={24} className="text-rose-500" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-rose-900 mb-2">Something went wrong</h3>
                    <p className="text-sm text-rose-800 leading-relaxed">{error}</p>
                  </div>
                  <button
                    onClick={refresh}
                    className="ml-4 flex-shrink-0 px-6 py-2.5 bg-white text-rose-700 font-bold text-sm rounded-2xl border-2 border-rose-200 hover:border-rose-300 hover:bg-rose-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Primary Metrics Row */}
          <section className="mb-12 lg:mb-20">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
              {/* Stats Cards */}
              <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                <StatsCards stats={data.stats} />
              </div>
              
              {/* Date Filter - Prominent Position */}
              <div className="xl:col-span-1 self-stretch">
                <DateFilters
                  currentFilter={dateFilter}
                  onFilterChange={setDateFilter}
                />
              </div>
            </div>
          </section>

          {/* Sentiment Analysis - Hero Section */}
          {dashboardConfig.showSentimentAnalysis && (
            <section className="mb-12 lg:mb-20">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-1 mb-8">
                <SentimentAnalysis sentimentData={data.sentiment} />
              </div>
            </section>
          )}

          {/* Charts Row */}
          {dashboardConfig.showCharts && (
            <section className="mb-12 lg:mb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                {dashboardConfig.showCategoryChart && (
                  <article className="group">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl border border-slate-200/50 hover:border-indigo-200/50 transition-all duration-500 group-hover:-translate-y-2">
                      <CategoryChart data={data.categoryData} />
                    </div>
                  </article>
                )}
                {dashboardConfig.showTimeline && (
                  <article className="group">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl border border-slate-200/50 hover:border-indigo-200/50 transition-all duration-500 group-hover:-translate-y-2">
                      <TimelineChart data={data.timeData} />
                    </div>
                  </article>
                )}
              </div>
            </section>
          )}

          {/* Insights Row */}
          {(dashboardConfig.showRecentFeedback || dashboardConfig.showTrendingIssues) && (
            <section className="mb-12 lg:mb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                {dashboardConfig.showRecentFeedback && (
                  <article className="group">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl border border-slate-200/50 hover:border-emerald-200/50 transition-all duration-500 group-hover:-translate-y-2 h-[480px]">
                      <RecentFeedback items={data.recent} />
                    </div>
                  </article>
                )}
                {dashboardConfig.showTrendingIssues && (
                  <article className="group">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl border border-slate-200/50 hover:border-orange-200/50 transition-all duration-500 group-hover:-translate-y-2 h-[480px]">
                      <TrendingIssues trends={data.trends} />
                    </div>
                  </article>
                )}
              </div>
            </section>
          )}

          {/* Resolutions Panel */}
          {dashboardConfig.showResolutionsPanel && (
            <section className="mb-16 lg:mb-24">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-1">
                <ResolutionsPanel
                  resolutions={data.resolutions}
                  onRefresh={refresh}
                />
              </div>
            </section>
          )}

          {/* Final CTA */}
          {dashboardConfig.showAiCTA && (
            <section>
              <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 backdrop-blur-xl rounded-3xl border border-indigo-200/30 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <AiCTA />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      <ResolutionModal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        onSuccess={refresh}
      />

      {/* Enhanced Loading Styles */}
      <style jsx>{`
        .delay-1000 {
          animation-delay: 1s;
        }
        [style*="animationDuration"] {
          animation-duration: var(--duration, 6s);
        }
      `}</style>
    </>
  );
};

export default Dashboard;