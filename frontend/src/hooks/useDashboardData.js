import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export const useDashboardData = (dateFilter = 'all') => {
  const [data, setData] = useState({
    stats:        null,
    recent:       [],
    trends:       [],
    categoryData: [],
    timeData:     [],
    sentiment:    null,
    resolutions:  []
  });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const filterParams = { filter: dateFilter };

      // Fetch all data in parallel — resolutions from its own endpoint
      const [analyticsRes, feedbackRes, trendsRes, resolutionsRes] = await Promise.all([
        adminAPI.getAnalytics(filterParams),
        adminAPI.getAllFeedback({ ...filterParams, limit: 5, sort: 'newest' }),
        adminAPI.getTrends(filterParams),
        adminAPI.getResolutions()   // ✅ correct endpoint for resolutions
      ]);

      console.log('Dashboard stats:', analyticsRes.data.stats);

      setData({
        stats:        analyticsRes.data.stats        || null,
        recent:       feedbackRes.data.data           || [],
        trends:       trendsRes.data.data             || [],
        categoryData: analyticsRes.data.categoryData  || [],
        timeData:     analyticsRes.data.timeData      || [],
        sentiment:    analyticsRes.data.sentiment     || null,
        resolutions:  resolutionsRes.data.data        || []  // ✅ from correct source
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  return { data, loading, error, lastUpdated, refresh: fetchDashboardData };
};