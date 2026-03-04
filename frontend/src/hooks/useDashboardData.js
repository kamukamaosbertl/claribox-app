import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export const useDashboardData = (dateFilter = 'all') => {
  const [data, setData] = useState({
    stats: null,
    recent: [],
    trends: [],
    categoryData: [],
    timeData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Pass filter parameter to all API calls
      const filterParams = { filter: dateFilter };
      
      const [analyticsRes, feedbackRes, trendsRes] = await Promise.all([
        adminAPI.getAnalytics(filterParams),
        adminAPI.getAllFeedback({ ...filterParams, limit: 5, sort: 'newest' }),
        adminAPI.getTrends(filterParams)
      ]);
      console.log("Fetched stats from API:", analyticsRes.data.stats);
      setData({
        stats: analyticsRes.data.stats || null,
        recent: feedbackRes.data.data || [],
        trends: trendsRes.data.data || [],
        categoryData: analyticsRes.data.categoryData || [],
        timeData: analyticsRes.data.timeData || []
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dateFilter changes
  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  return { data, loading, error, lastUpdated, refresh: fetchDashboardData };
};