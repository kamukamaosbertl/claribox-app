import { useState,useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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

const Dashboard = () => {
  const [dateFilter, setDateFilter] = useState('all');
  const [admin] = useState({
    name: 'Admin User',
    email: 'admin@school.edu',
    role: 'Administrator'
  });

  // 🔹 Add modal state here
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);

  // 🔹 Add function to open modal
  const handleResolvedClick = () => setResolutionModalOpen(true);

  
  const { data, loading, error, lastUpdated, refresh } = useDashboardData(dateFilter);
  useEffect(() => {
    if (data && data.stats) {
      console.log("Dashboard stats:", data.stats);
    }
  }, [data]);

  // 🔹 Return a loader if data is not ready
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {dashboardConfig.showHeader && (
        <DashboardHeader 
          lastUpdated={lastUpdated} 
          onRefresh={refresh} 
          loading={loading}
          admin={admin}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={refresh}
            className="ml-auto text-red-700 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Cards + Date Filters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <StatsCards stats={data.stats} />
         {/* 🔹 Resolved Card - clickable to open modal */}
        
        {/* Resolved */}
        <StatsCards stats={data.stats} type="resolved"  onResolvedClick={handleResolvedClick} />


        
        
        {/* Date Filters - Taking 2 slots on large screens */}
        <div className="lg:col-span-2">
          <DateFilters 
            currentFilter={dateFilter} 
            onFilterChange={setDateFilter} 
          />
        </div>
      </div>

      {/* Charts Section */}
      {dashboardConfig.showCharts && (dashboardConfig.showCategoryChart || dashboardConfig.showTimeline) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardConfig.showCategoryChart && (
            <CategoryChart data={data.categoryData} />
          )}
          {dashboardConfig.showTimeline && (
            <TimelineChart data={data.timeData} />
          )}
        </div>
      )}

      {/* Recent Feedback & Trending */}
      {(dashboardConfig.showRecentFeedback || dashboardConfig.showTrendingIssues) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardConfig.showRecentFeedback && (
            <RecentFeedback items={data.recent} />
          )}
          {dashboardConfig.showTrendingIssues && (
            <TrendingIssues trends={data.trends} />
          )}
        </div>
      )}

      {/* Resolutions Panel */}
      {dashboardConfig.showResolutionsPanel && (
        <ResolutionsPanel 
          resolutions={data.resolutions} 
          onRefresh={refresh}
        />
      )}

      {/* AI Chat CTA */}
      {dashboardConfig.showAiCTA && (
        <AiCTA />
      )}

        {/* 🔹 Resolution Modal */}
          <ResolutionModal
            isOpen={resolutionModalOpen}
            onClose={() => setResolutionModalOpen(false)}
            onSuccess={refresh} // 🔹 Refresh stats after publishing
          />
    </div>

    
  );
};

export default Dashboard;