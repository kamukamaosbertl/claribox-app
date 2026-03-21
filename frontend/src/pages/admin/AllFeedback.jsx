import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, RefreshCw, MessageSquare,
  Hash, Clock, ChevronLeft, ChevronRight,
  AlertCircle, SlidersHorizontal, X
} from 'lucide-react';
import { adminAPI } from '../../services/api';

// ── Category colors ───────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  academic:   { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  library:    { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500'   },
  it:         { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-500'    },
  facilities: { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  canteen:    { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500'  },
  transport:  { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  hostel:     { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500'    },
  admin:      { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
  other:      { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
};

// ── Sentiment colors ──────────────────────────────────────────────────────────
const SENTIMENT_COLORS = {
  positive: { bg: 'bg-green-50', text: 'text-green-700', label: '😊 Positive' },
  negative: { bg: 'bg-red-50',   text: 'text-red-700',   label: '😞 Negative' },
  neutral:  { bg: 'bg-slate-50', text: 'text-slate-500', label: '😐 Neutral'  },
};

const CATEGORIES = ['all', 'academic', 'library', 'it', 'facilities', 'canteen', 'transport', 'hostel', 'admin', 'other'];
const SENTIMENTS  = ['all', 'positive', 'neutral', 'negative'];
const PAGE_SIZE   = 10;

// ── Feedback detail modal ─────────────────────────────────────────────────────
const FeedbackModal = ({ feedback, onClose }) => {
  if (!feedback) return null;
  const catColor  = CATEGORY_COLORS[feedback.category]  || CATEGORY_COLORS.other;
  const sentColor = SENTIMENT_COLORS[feedback.sentiment] || SENTIMENT_COLORS.neutral;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Feedback Detail</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${catColor.bg} ${catColor.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot}`} />
              {feedback.category}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sentColor.bg} ${sentColor.text}`}>
              {sentColor.label}
            </span>
          </div>

          {/* Full feedback text */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-700 leading-relaxed">{feedback.feedback}</p>
          </div>

          {/* Evidence file */}
          {feedback.evidenceFile?.url && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Attached Evidence</p>
              {feedback.evidenceFile.fileType?.startsWith('image/') ? (
                <img src={feedback.evidenceFile.url} alt="Evidence" className="w-full rounded-xl border border-slate-200" />
              ) : (
                <a href={feedback.evidenceFile.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold no-underline hover:bg-indigo-100 transition-colors">
                  📄 {feedback.evidenceFile.fileName || 'View attached file'}
                </a>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">{feedback.anonymous_id}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">
                {new Date(feedback.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main AllFeedback page ─────────────────────────────────────────────────────
const AllFeedback = () => {
  const [feedback,    setFeedback]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [selected,    setSelected]    = useState(null); // feedback detail modal

  // ── Filters ──
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('all');
  const [sentiment,  setSentiment]  = useState('all');
  const [sort,       setSort]       = useState('newest');
  const [showFilter, setShowFilter] = useState(false);

  // ── Fetch feedback from backend ───────────────────────────────────────────
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit:    PAGE_SIZE,
        sort,
        ...(category  !== 'all' && { category  }),
        ...(sentiment !== 'all' && { sentiment }),
      };

      const res  = await adminAPI.getAllFeedback(params);
      const data = res.data;

      // Client-side search filter — backend doesn't have text search yet
      let items = data.data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        items = items.filter(f =>
          f.feedback?.toLowerCase().includes(q) ||
          f.category?.toLowerCase().includes(q)  ||
          f.anonymous_id?.toLowerCase().includes(q)
        );
      }

      setFeedback(items);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, sentiment, search]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [category, sentiment, sort, search]);

  const activeFilters = [
    category  !== 'all' && category,
    sentiment !== 'all' && sentiment,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">All Feedback</h1>
              <p className="text-sm text-slate-500 mt-1">
                {total} total submissions from students
              </p>
            </div>
            <button
              onClick={fetchFeedback}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">

            {/* Search input */}
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search feedback text, category, ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer
                ${showFilter || activeFilters > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilters > 0 && (
                <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Expanded filters */}
          {showFilter && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4">

              {/* Category filter */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize
                        ${category === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sentiment filter */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Sentiment</p>
                <div className="flex gap-1.5">
                  {SENTIMENTS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSentiment(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize
                        ${sentiment === s
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                    >
                      {s === 'all' ? 'All' : s === 'positive' ? '😊 Positive' : s === 'negative' ? '😞 Negative' : '😐 Neutral'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {activeFilters > 0 && (
                <button
                  onClick={() => { setCategory('all'); setSentiment('all'); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer self-end"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={fetchFeedback} className="ml-auto text-xs font-bold text-red-700 hover:text-red-900">
              Try Again
            </button>
          </div>
        )}

        {/* ── Feedback table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-5">Feedback</div>
            <div className="col-span-2">Sentiment</div>
            <div className="col-span-2">Date</div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading feedback...</p>
            </div>
          ) : feedback.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {feedback.map((item, index) => {
                const catColor  = CATEGORY_COLORS[item.category]  || CATEGORY_COLORS.other;
                const sentColor = SENTIMENT_COLORS[item.sentiment] || SENTIMENT_COLORS.neutral;
                const rowNum    = (page - 1) * PAGE_SIZE + index + 1;

                return (
                  <div
                    key={item._id}
                    onClick={() => setSelected(item)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    {/* Row number */}
                    <div className="hidden md:flex items-center col-span-1">
                      <span className="text-xs text-slate-400 font-medium">{rowNum}</span>
                    </div>

                    {/* Category */}
                    <div className="md:col-span-2 flex items-center">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${catColor.bg} ${catColor.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot} flex-shrink-0`} />
                        {item.category}
                      </span>
                    </div>

                    {/* Feedback text preview */}
                    <div className="md:col-span-5 flex items-center">
                      <div>
                        <p className="text-sm text-slate-700 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {item.feedback}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 md:hidden">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400">{item.anonymous_id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sentiment */}
                    <div className="md:col-span-2 flex items-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sentColor.bg} ${sentColor.text}`}>
                        {sentColor.label}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="md:col-span-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No feedback found</p>
              <p className="text-xs text-slate-400">
                {search || activeFilters > 0
                  ? 'Try adjusting your search or filters'
                  : 'No feedback has been submitted yet'
                }
              </p>
              {(search || activeFilters > 0) && (
                <button
                  onClick={() => { setSearch(''); setCategory('all'); setSentiment('all'); }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-1"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">
                Page {page} of {pages} — {total} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page - 2 + i;
                  if (p < 1 || p > pages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer
                        ${p === page
                          ? 'bg-indigo-600 text-white border border-indigo-600'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Feedback detail modal ── */}
      {selected && (
        <FeedbackModal feedback={selected} onClose={() => setSelected(null)} />
      )}

    </div>
  );
};

export default AllFeedback;