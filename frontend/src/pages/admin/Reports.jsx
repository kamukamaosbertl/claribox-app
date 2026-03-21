import { useState, useEffect, useRef } from 'react';
import {
  FileText, RefreshCw, AlertCircle,
  TrendingUp, MessageSquare, CheckCircle,
  Calendar, FileDown, Printer,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { adminAPI } from '../../services/api';

// ── Category colors ───────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  academic:   'bg-indigo-500',
  library:    'bg-green-500',
  it:         'bg-cyan-500',
  facilities: 'bg-orange-500',
  canteen:    'bg-yellow-500',
  transport:  'bg-purple-500',
  hostel:     'bg-rose-500',
  admin:      'bg-slate-400',
  other:      'bg-slate-400',
};

// ── Date filter options ───────────────────────────────────────────────────────
const DATE_FILTERS = [
  { label: 'All Time',     value: 'all'      },
  { label: 'Last 7 days',  value: '7days'    },
  { label: 'Last 30 days', value: '30days'   },
  { label: 'This Semester',value: 'semester' },
];

// How many resolutions to show per page
const RES_PER_PAGE = 5;

// ── Export to CSV ─────────────────────────────────────────────────────────────
// Always exports ALL resolutions — not just the current page
// This ensures the full report is included even with pagination active
const exportToCSV = (stats, categoryData, resolutions, filter) => {
  const rows = [];
  const date = new Date().toLocaleDateString();
  const period = DATE_FILTERS.find(f => f.value === filter)?.label || 'All Time';

  // Section 1 — Report header
  rows.push(['CLARIBOX FEEDBACK REPORT']);
  rows.push([`Generated: ${date}`]);
  rows.push([`Period: ${period}`]);
  rows.push([]);

  // Section 2 — Summary stats
  rows.push(['SUMMARY']);
  rows.push(['Metric', 'Value']);
  rows.push(['Total Feedback',  stats.total    || 0]);
  rows.push(['Positive',        stats.positive || 0]);
  rows.push(['Neutral',         stats.neutral  || 0]);
  rows.push(['Negative',        stats.negative || 0]);
  rows.push(['Total Resolutions', resolutions.length]);
  rows.push([]);

  // Section 3 — Category breakdown
  rows.push(['FEEDBACK BY CATEGORY']);
  rows.push(['Category', 'Count', 'Percentage']);
  categoryData.forEach(cat => {
    const pct = stats.total > 0 ? ((cat.count / stats.total) * 100).toFixed(1) : '0.0';
    rows.push([cat.name, cat.count, `${pct}%`]);
  });
  rows.push([]);

  // Section 4 — ALL resolved issues (not just current page)
  rows.push(['RESOLVED ISSUES']);
  rows.push(['Title', 'Description', 'Category', 'Status', 'Date Resolved']);
  resolutions.forEach(res => {
    rows.push([
      res.title,
      res.description || '',
      res.category,
      res.status || 'Completed',
      new Date(res.createdAt).toLocaleDateString()
    ]);
  });

  // Convert to CSV and trigger download
  const csv     = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement('a');
  link.href     = url;
  link.download = `claribox-report-${date.replace(/\//g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ── Export to PDF ─────────────────────────────────────────────────────────────
// Before printing — temporarily show ALL resolutions so full list is in PDF
// After printing — restore pagination
const exportToPDF = (setResPage, totalPages) => {
  // Show all pages before printing
  setResPage(1);
  // Small delay to let React re-render with all data visible
  setTimeout(() => {
    window.print();
  }, 300);
};

// ── Reports page ──────────────────────────────────────────────────────────────
const Reports = () => {
  const [filter,       setFilter]       = useState('all');
  const [stats,        setStats]        = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [resolutions,  setResolutions]  = useState([]);  // ALL resolutions from backend
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ── Pagination state for Resolved Issues table ──────────────────────────
  // resPage — current page number (starts at 1)
  // We paginate the resolutions array client-side
  const [resPage, setResPage] = useState(1);

  const printRef = useRef(null);

  // ── Fetch all report data ─────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, resolutionsRes] = await Promise.all([
        adminAPI.getAnalytics({ filter }),
        adminAPI.getResolutions()
      ]);

      const analytics = analyticsRes.data;
      setStats({
        total:    analytics.stats?.total        || 0,
        resolved: analytics.stats?.resolved     || 0,
        positive: analytics.sentiment?.positive || 0,
        neutral:  analytics.sentiment?.neutral  || 0,
        negative: analytics.sentiment?.negative || 0,
      });

      setCategoryData(analytics.categoryData || []);
      setResolutions(resolutionsRes.data.data || []);

      // Reset to page 1 when data reloads
      setResPage(1);
    } catch {
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  // ── Pagination calculations ───────────────────────────────────────────────
  // totalResPages — how many pages needed based on total resolutions
  // paginatedResolutions — slice of resolutions for current page only
  const totalResPages        = Math.ceil(resolutions.length / RES_PER_PAGE);
  const paginatedResolutions = resolutions.slice(
    (resPage - 1) * RES_PER_PAGE,
     resPage      * RES_PER_PAGE
  );

  const reportDate = new Date().toLocaleDateString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Print styles — hides UI controls when saving as PDF */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { background: white !important; padding: 0 !important; }
          /* Show ALL resolutions when printing — override pagination */
          .res-print-all { display: block !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 py-8 print-page" ref={printRef}>

        {/* ── Page header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8 no-print">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Export and analyse feedback data</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Export CSV — exports ALL data including all resolution pages */}
            <button
              onClick={() => stats && exportToCSV(stats, categoryData, resolutions, filter)}
              disabled={loading || !stats}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>

            {/* Export PDF — opens print dialog, saves as PDF */}
            <button
              onClick={() => exportToPDF(setResPage, totalResPages)}
              disabled={loading || !stats}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* ── Date filter ── */}
        <div className="flex flex-wrap gap-2 mb-6 no-print">
          {DATE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
                ${filter === f.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={fetchData} className="ml-auto text-xs font-bold text-red-700">Try Again</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading report data...</p>
          </div>
        ) : stats && (
          <div className="space-y-6">

            {/* ── Print title — only visible when printing ── */}
            <div className="hidden print:block mb-6">
              <h1 className="text-2xl font-black text-slate-900">ClariBox Feedback Report</h1>
              <p className="text-sm text-slate-500 mt-1">
                {reportDate} · {DATE_FILTERS.find(f2 => f2.value === filter)?.label}
              </p>
            </div>

            {/* ── Summary stats cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Total Feedback</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                  <span className="text-base">😊</span>
                </div>
                <p className="text-2xl font-black text-green-600">{stats.positive}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Positive</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                  <span className="text-base">😐</span>
                </div>
                <p className="text-2xl font-black text-slate-600">{stats.neutral}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Neutral</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                  <span className="text-base">😞</span>
                </div>
                <p className="text-2xl font-black text-red-600">{stats.negative}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Negative</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-600">{resolutions.length}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Resolutions</p>
              </div>
            </div>

            {/* ── Feedback by category ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Feedback by Category</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Count</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Share</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categoryData.length > 0 ? categoryData.map((cat, i) => {
                      const pct      = stats.total > 0 ? ((cat.count / stats.total) * 100).toFixed(1) : '0.0';
                      const barColor = CATEGORY_COLORS[cat.name?.toLowerCase()] || 'bg-slate-400';
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
                              <span className="text-sm font-semibold text-slate-700 capitalize">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-900">{cat.count}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-slate-500">{pct}%</span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                          No feedback data for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Resolved issues with pagination ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Resolved Issues</h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Shows current range e.g. "1-5 of 12" */}
                  {resolutions.length > 0 && (
                    <span className="text-xs text-slate-400 no-print">
                      {(resPage - 1) * RES_PER_PAGE + 1}–{Math.min(resPage * RES_PER_PAGE, resolutions.length)} of {resolutions.length}
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    {resolutions.length} total
                  </span>
                </div>
              </div>

              {/* Table — shows paginatedResolutions (current page slice) */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedResolutions.length > 0 ? paginatedResolutions.map((res, i) => {
                      // Calculate real row number across all pages
                      const rowNum = (resPage - 1) * RES_PER_PAGE + i + 1;
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-400 font-medium">{rowNum}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-800">{res.title}</p>
                            {res.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{res.description}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                              {res.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                              ${res.status === 'Completed'   ? 'bg-green-50 text-green-700'  :
                                res.status === 'In Progress' ? 'bg-amber-50 text-amber-700'  :
                                                               'bg-indigo-50 text-indigo-700' }`}>
                              {res.status || 'Completed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs text-slate-400">
                              {new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                          No resolutions published yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination controls ── */}
              {/* Only shows if there are more than RES_PER_PAGE resolutions */}
              {totalResPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 no-print">
                  <p className="text-xs text-slate-500">
                    Page {resPage} of {totalResPages}
                  </p>
                  <div className="flex items-center gap-2">

                    {/* Previous page button */}
                    <button
                      onClick={() => setResPage(p => Math.max(1, p - 1))}
                      disabled={resPage === 1}
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page number buttons */}
                    {Array.from({ length: totalResPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setResPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer
                          ${p === resPage
                            ? 'bg-indigo-600 text-white border border-indigo-600'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                          }`}
                      >
                        {p}
                      </button>
                    ))}

                    {/* Next page button */}
                    <button
                      onClick={() => setResPage(p => Math.min(totalResPages, p + 1))}
                      disabled={resPage === totalResPages}
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                  </div>
                </div>
              )}
            </div>

            {/* ── Report footer ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">ClariBox Feedback Report</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">{reportDate}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;