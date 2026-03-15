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

  const [admin] = useState({
    name: 'Admin User',
    email: 'admin@school.edu',
    role: 'Administrator'
  });

  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const handleResolvedClick = () => setResolutionModalOpen(true);

  const { data, loading, error, lastUpdated, refresh } = useDashboardData(dateFilter);

  useEffect(() => {
    if (data?.stats) {
      console.log('Dashboard stats:', data.stats);
    }
  }, [data]);

  if (loading || !data) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: '14px'
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '3px solid #eef2ff',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
          Loading dashboard...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: '#f5f5f7',
      overflow: 'hidden'
    }}>

      {/* Background gradient — bottom right corner */}
      <div style={{
        position: 'fixed',
        bottom: '-120px', right: '-120px',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(124,58,237,0.06) 50%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Background gradient — top left subtle */}
      <div style={{
        position: 'fixed',
        top: '-80px', left: '-80px',
        width: '350px', height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Dashboard content */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 24px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>

        {/* Header */}
        {dashboardConfig.showHeader && (
          <DashboardHeader
            lastUpdated={lastUpdated}
            onRefresh={refresh}
            loading={loading}
            admin={admin}
          />
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 18px',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '12px'
          }}>
            <AlertCircle size={16} color="#ef4444" />
            <p style={{ fontSize: '13px', color: '#be123c', margin: 0, flex: 1 }}>{error}</p>
            <button
              onClick={refresh}
              style={{
                fontSize: '12px', fontWeight: 700, color: '#be123c',
                background: 'none', border: 'none', cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Row 1 — Stats + Date Filter */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <StatsCards stats={data.stats} />
          <StatsCards
            stats={data.stats}
            type="resolved"
            onResolvedClick={handleResolvedClick}
          />
          <div style={{ gridColumn: 'span 2' }}>
            <DateFilters
              currentFilter={dateFilter}
              onFilterChange={setDateFilter}
            />
          </div>
        </div>

        {/* Row 2 — Sentiment (full width) */}
        {dashboardConfig.showSentimentAnalysis && (
          <SentimentAnalysis sentimentData={data.sentiment} />
        )}

        {/* Row 3 — Charts side by side */}
        {dashboardConfig.showCharts && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {dashboardConfig.showCategoryChart && (
              <CategoryChart data={data.categoryData} />
            )}
            {dashboardConfig.showTimeline && (
              <TimelineChart data={data.timeData} />
            )}
          </div>
        )}

        {/* Row 4 — Recent Feedback + Trending Issues */}
        {(dashboardConfig.showRecentFeedback || dashboardConfig.showTrendingIssues) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {dashboardConfig.showRecentFeedback && (
              <RecentFeedback items={data.recent} />
            )}
            {dashboardConfig.showTrendingIssues && (
              <TrendingIssues trends={data.trends} />
            )}
          </div>
        )}

        {/* Row 5 — Resolutions Panel */}
        {dashboardConfig.showResolutionsPanel && (
          <ResolutionsPanel
            resolutions={data.resolutions}
            onRefresh={refresh}
          />
        )}

        {/* Row 6 — AI CTA */}
        {dashboardConfig.showAiCTA && (
          <AiCTA />
        )}

        {/* Resolution Modal */}
        <ResolutionModal
          isOpen={resolutionModalOpen}
          onClose={() => setResolutionModalOpen(false)}
          onSuccess={refresh}
        />

      </div>
    </div>
  );
};

export default Dashboard;