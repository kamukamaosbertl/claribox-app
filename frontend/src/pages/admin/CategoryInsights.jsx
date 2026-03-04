import { useState, useEffect } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  BarChart3,
  PieChart,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { adminAPI } from '../../services/api';

const CategoryInsights = () => {
  const [data, setData] = useState({
    categories: [],
    categoryStats: [],
    topIssues: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categories, stats] = await Promise.all([
        adminAPI.getCategories(),
        adminAPI.getCategoryStats()
      ]);
      
      setData({
        categories: categories || [],
        categoryStats: stats || [],
        topIssues: categories?.flatMap(c => c.topIssues || []).slice(0, 10) || []
      });
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load category insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Custom Tooltip for Bar Chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg">
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="text-sm text-indigo-600 font-medium">
            {payload[0].value} <span className="text-slate-500 font-normal">submissions</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <PieChart className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Category Insights</h1>
            <p className="text-sm text-slate-500 font-medium">Analyze feedback distribution by category</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all text-sm font-semibold shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Charts Section */}
      {data.categoryStats.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                  Distribution
                </h2>
                <p className="text-sm text-slate-500 mt-1">Breakdown of feedback by category</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={data.categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                      stroke="none"
                    >
                      {data.categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {data.categoryStats.map((cat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs font-medium text-slate-600">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Comparison
                </h2>
                <p className="text-sm text-slate-500 mt-1">Count of submissions per category</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryStats} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar 
                      dataKey="count" 
                      fill="url(#barGradient)" 
                      radius={[0, 6, 6, 0]} 
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">All Categories</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.categoryStats.map((category, index) => (
                <div 
                  key={index}
                  className={`group p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedCategory === category.name 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                      : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-1'
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full ring-2 ring-offset-2" style={{ backgroundColor: COLORS[index % COLORS.length], ringColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-bold text-slate-800">{category.name}</span>
                    </div>
                    <span className="text-2xl font-extrabold text-slate-900">{category.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${category.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <span className="text-xs font-semibold text-slate-500">{category.percentage}% of total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <BarChart3 className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Category Data</h3>
          <p className="text-slate-500 max-w-md mx-auto">Category insights will appear here once feedback is submitted and categorized.</p>
        </div>
      )}

      {/* Top Issues List */}
      {data.topIssues.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Top Issues
            </h2>
            <Link to="/admin/feedback" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.topIssues.map((issue, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                    index < 3 ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{issue.title || issue.issue}</p>
                    <p className="text-xs text-slate-500 font-medium">{issue.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                    {issue.count} mentions
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryInsights;