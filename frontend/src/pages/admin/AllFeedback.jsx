import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  MessageSquare,
  Hash,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import ResolutionModal from '../../components/dashboard/ResolutionModal';


const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const COLOR_PALETTE = [
  { stroke: '#2563EB', bg: 'rgba(37,99,235,0.08)', text: '#1D4ED8' },
  { stroke: '#22C55E', bg: 'rgba(34,197,94,0.08)', text: '#15803D' },
  { stroke: '#F59E0B', bg: 'rgba(245,158,11,0.08)', text: '#B45309' },
  { stroke: '#EF4444', bg: 'rgba(239,68,68,0.08)', text: '#B91C1C' },
  { stroke: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', text: '#6D28D9' },
  { stroke: '#06B6D4', bg: 'rgba(6,182,212,0.08)', text: '#0E7490' },
  { stroke: '#14B8A6', bg: 'rgba(20,184,166,0.08)', text: '#0F766E' },
  { stroke: '#F43F5E', bg: 'rgba(244,63,94,0.08)', text: '#BE123C' },
  { stroke: '#64748B', bg: 'rgba(100,116,139,0.08)', text: '#475569' },
];

const DEFAULT_COLOR = {
  stroke: '#94A3B8',
  bg: 'rgba(148,163,184,0.08)',
  text: '#64748B'
};

const SENTIMENT_COLORS = {
  positive: { stroke: '#22C55E', bg: 'rgba(34,197,94,0.08)', text: '#15803D', emoji: '😊', label: 'Positive' },
  negative: { stroke: '#EF4444', bg: 'rgba(239,68,68,0.08)', text: '#B91C1C', emoji: '😞', label: 'Negative' },
  neutral: { stroke: '#94A3B8', bg: 'rgba(148,163,184,0.08)', text: '#475569', emoji: '😐', label: 'Neutral' },
};

const EMOTION_STYLES = {
  excited: { label: 'Excited', emoji: '🤩', color: '#2563EB', bg: 'rgba(37,99,235,0.08)', text: '#1D4ED8' },
  satisfied: { label: 'Satisfied', emoji: '😊', color: '#16A34A', bg: 'rgba(22,163,74,0.08)', text: '#15803D' },
  hopeful: { label: 'Hopeful', emoji: '🌟', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', text: '#1D4ED8' },
  angry: { label: 'Angry', emoji: '😠', color: '#DC2626', bg: 'rgba(220,38,38,0.08)', text: '#B91C1C' },
  disappointed: { label: 'Disappointed', emoji: '😔', color: '#EA580C', bg: 'rgba(234,88,12,0.08)', text: '#C2410C' },
  confused: { label: 'Confused', emoji: '😕', color: '#D97706', bg: 'rgba(217,119,6,0.08)', text: '#B45309' },
  neutral: { label: 'Neutral', emoji: '😐', color: '#64748B', bg: 'rgba(100,116,139,0.08)', text: '#475569' },
  neutral_emotion: { label: 'Neutral', emoji: '😐', color: '#64748B', bg: 'rgba(100,116,139,0.08)', text: '#475569' },
};

const SENTIMENTS = ['all', 'positive', 'neutral', 'negative'];
const PAGE_SIZE = 10;

const getFeedbackCategory = (item) => {
  return (
    item?.topicLabel ||
    item?.topicShortLabel ||
    item?.category ||
    'Uncategorized'
  );
};

const getCategoryColor = (category = '') => {
  if (!category) return DEFAULT_COLOR;

  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length] || DEFAULT_COLOR;
};

const formatCategory = (category) => {
  if (!category) return 'Uncategorized';
  return String(category)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const Pill = ({ color, children }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: color.bg,
    border: `1px solid ${color.stroke}28`,
    borderRadius: '20px',
    padding: '3px 9px',
    fontSize: '11px',
    fontWeight: 700,
    color: color.text,
    whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

const EmotionPill = ({ emotionKey }) => {
  const e = EMOTION_STYLES[emotionKey] || EMOTION_STYLES.neutral;
  if (!emotionKey) return null;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: e.bg,
      border: `1px solid ${e.color}28`,
      borderRadius: '20px',
      padding: '3px 9px',
      fontSize: '11px',
      fontWeight: 700,
      color: e.text,
      whiteSpace: 'nowrap',
    }}>
      {e.emoji} {e.label}
    </span>
  );
};

const FeedbackModal = ({ feedback, onClose, onAddResolution }) => {
  if (!feedback) return null;

  const categoryName = getFeedbackCategory(feedback);
  const cat = getCategoryColor(categoryName);
  const sent = SENTIMENT_COLORS[feedback.sentiment] || SENTIMENT_COLORS.neutral;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: font
    }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15,23,42,0.50)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      />

      <div style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: '22px',
        boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '92vh',
        overflowY: 'auto',
        animation: 'modalIn 0.2s ease',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#0F172A',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Feedback Detail
          </h2>

          <button
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            <Pill color={cat}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: cat.stroke,
                flexShrink: 0
              }} />
              {formatCategory(categoryName)}
            </Pill>

            <Pill color={sent}>
              {sent.emoji} {sent.label}
            </Pill>

            {feedback.emotion && <EmotionPill emotionKey={feedback.emotion} />}
          </div>

          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '13px',
            padding: '16px'
          }}>
            <p style={{
              fontSize: '13.5px',
              color: '#334155',
              lineHeight: '1.65',
              margin: 0
            }}>
              {feedback.feedback}
            </p>
          </div>

          {feedback.tags?.length > 0 && (
            <div>
              <p style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#64748B',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.07em'
              }}>
                Tags
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {feedback.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '11px',
                      color: '#475569',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '999px',
                      padding: '4px 9px',
                      fontWeight: 700
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
    // feedback modal  
    <button
      onClick={() => onAddResolution(feedback)}
      style={{
        width: '100%',
        padding: '11px 14px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
        color: '#FFFFFF',
        fontSize: '13px',
        fontWeight: 800,
        cursor: 'pointer',
        fontFamily: font,
      }}
    >
      Add Resolution
    </button>
          {feedback.evidenceText && (
            <div>
              <p style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#64748B',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.07em'
              }}>
                Extracted Evidence Text
              </p>

              <div style={{
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: '13px',
                padding: '12px'
              }}>
                <p style={{
                  fontSize: '12.5px',
                  color: '#9A3412',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {feedback.evidenceText}
                </p>
              </div>
            </div>
          )}

          {feedback.evidenceFile?.url && (
            <div>
              <p style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#64748B',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.07em'
              }}>
                Attached Evidence
              </p>

              {feedback.evidenceFile.fileType?.startsWith('image/') ? (
                <img
                  src={feedback.evidenceFile.url}
                  alt="Evidence"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0'
                  }}
                />
              ) : (
                <a
                  href={feedback.evidenceFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '11px',
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#2563EB',
                    textDecoration: 'none',
                  }}
                >
                  📄 {feedback.evidenceFile.fileName || 'View attached file'}
                </a>
              )}
            </div>
          )}

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #F1F5F9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Hash size={12} color="#CBD5E1" />
              <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>
                {feedback.anonymous_id}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={12} color="#CBD5E1" />
              <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                {new Date(feedback.createdAt).toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>

            {feedback.ragStatus && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748B',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '999px',
                padding: '4px 9px'
              }}>
                RAG: {feedback.ragStatus}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ page, pages, total, onChange }) => {
  if (pages <= 1) return null;

  const visiblePages = Array.from({ length: Math.min(5, pages) }, (_, i) => {
    const p = page <= 3 ? i + 1 : page - 2 + i;
    return p >= 1 && p <= pages ? p : null;
  }).filter(Boolean);

  const btn = (content, onClick, disabled, active) => (
    <button
      key={typeof content === 'number' ? content : String(content)}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '9px',
        border: `1px solid ${active ? '#2563EB' : '#E2E8F0'}`,
        background: active
          ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
          : '#FFFFFF',
        color: active ? '#FFFFFF' : '#475569',
        fontSize: '12px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        boxShadow: active ? '0 3px 8px rgba(37,99,235,0.22)' : 'none',
        fontFamily: font,
      }}
    >
      {content}
    </button>
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      borderTop: '1px solid #F1F5F9',
      background: '#FAFBFC'
    }}>
      <p style={{
        fontSize: '11.5px',
        color: '#94A3B8',
        margin: 0,
        fontWeight: 500
      }}>
        Page {page} of {pages} — {total} total
      </p>

      <div style={{ display: 'flex', gap: '6px' }}>
        {btn(<ChevronLeft size={14} />, () => onChange(p => Math.max(1, p - 1)), page === 1, false)}
        {visiblePages.map(p => btn(p, () => onChange(p), false, p === page))}
        {btn(<ChevronRight size={14} />, () => onChange(p => Math.min(pages, p + 1)), page === pages, false)}
      </div>
    </div>
  );
};

const AllFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [resolutionTarget, setResolutionTarget] = useState(null);

  const [category, setCategory] = useState('all');
  const [sentiment, setSentiment] = useState('all');
  const [emotion, setEmotion] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showFilter, setShowFilter] = useState(false);

  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [dynamicEmotions, setDynamicEmotions] = useState([]);

  const activeFilters = [
    category !== 'all',
    sentiment !== 'all',
    emotion !== 'all'
  ].filter(Boolean).length;

  const fetchFilters = useCallback(async () => {
    setFiltersLoading(true);

    try {
      const res = await adminAPI.getFeedbackFilters();
      const data = res.data?.data || {};

      setDynamicCategories(data.categories || []);
      setDynamicEmotions(data.emotions || []);
    } catch (err) {
      console.error('Failed to load filters:', err);
      setDynamicCategories([]);
      setDynamicEmotions([]);
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        sort,
        ...(category !== 'all' && { category }),
        ...(sentiment !== 'all' && { sentiment }),
        ...(emotion !== 'all' && { emotion }),
      };

      const res = await adminAPI.getAllFeedback(params);
      const data = res.data;

      setFeedback(data.data || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('Feedback load error:', err);
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, sentiment, emotion]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  useEffect(() => {
    setPage(1);
  }, [category, sentiment, emotion, sort]);

  const clearAllFilters = () => {
    setCategory('all');
    setSentiment('all');
    setEmotion('all');
  };

  return (
    <div style={{ fontFamily: font }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes modalIn {
          from { opacity:0; transform:scale(0.96) translateY(12px); }
          to { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 4px',
            letterSpacing: '-0.035em'
          }}>
            All Feedback
          </h1>

          <p style={{
            fontSize: '13px',
            color: '#94A3B8',
            margin: 0,
            fontWeight: 500
          }}>
            {total} total submissions from students
          </p>
        </div>

        <button
          onClick={() => {
            fetchFilters();
            fetchFeedback();
          }}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 16px',
            borderRadius: '11px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            color: '#475569',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            fontFamily: font,
            boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
          }}
        >
          <RefreshCw
            size={14}
            style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}
          />
          Refresh
        </button>
      </div>

      <div style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)',
        padding: '14px 16px',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
         

          <button
            onClick={() => setShowFilter(!showFilter)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              borderRadius: '11px',
              cursor: 'pointer',
              fontFamily: font,
              border: `1px solid ${showFilter || activeFilters > 0 ? '#93C5FD' : '#E2E8F0'}`,
              background: showFilter || activeFilters > 0 ? '#EFF6FF' : '#FFFFFF',
              color: showFilter || activeFilters > 0 ? '#2563EB' : '#475569',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <SlidersHorizontal size={14} />
            Filters

            {activeFilters > 0 && (
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '9.5px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeFilters}
              </span>
            )}
          </button>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '11px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: '13px',
              color: '#475569',
              fontFamily: font,
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {showFilter && (
          <div style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <p style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#64748B',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.07em'
              }}>
                Category
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  onClick={() => setCategory('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    border: `1px solid ${category === 'all' ? '#2563EB' : '#E2E8F0'}`,
                    background: category === 'all'
                      ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                      : '#F8FAFC',
                    color: category === 'all' ? '#FFFFFF' : '#475569',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    fontFamily: font,
                  }}
                >
                  All Categories
                </button>

                {filtersLoading ? (
                  <span style={{ fontSize: '12px', color: '#94A3B8', padding: '5px 0' }}>
                    Loading categories…
                  </span>
                ) : dynamicCategories.length > 0 ? (
                  dynamicCategories.map(cat => {
                    const isActive = category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          border: `1px solid ${isActive ? '#2563EB' : '#E2E8F0'}`,
                          background: isActive
                            ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                            : '#F8FAFC',
                          color: isActive ? '#FFFFFF' : '#475569',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          fontFamily: font,
                        }}
                      >
                        {formatCategory(cat)}
                      </button>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '12px', color: '#94A3B8', padding: '5px 0' }}>
                    No categories yet
                  </span>
                )}
              </div>
            </div>

            <div>
              <p style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#64748B',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.07em'
              }}>
                Sentiment
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SENTIMENTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSentiment(s)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      border: `1px solid ${sentiment === s ? '#2563EB' : '#E2E8F0'}`,
                      background: sentiment === s
                        ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                        : '#F8FAFC',
                      color: sentiment === s ? '#FFFFFF' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      fontFamily: font,
                    }}
                  >
                    {s === 'all'
                      ? 'All Sentiments'
                      : s === 'positive'
                        ? '😊 Positive'
                        : s === 'negative'
                          ? '😞 Negative'
                          : '😐 Neutral'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#64748B',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.07em'
              }}>
                Emotion
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  onClick={() => setEmotion('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    border: `1px solid ${emotion === 'all' ? '#2563EB' : '#E2E8F0'}`,
                    background: emotion === 'all'
                      ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                      : '#F8FAFC',
                    color: emotion === 'all' ? '#FFFFFF' : '#475569',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    fontFamily: font,
                  }}
                >
                  All Emotions
                </button>

                {(dynamicEmotions.length > 0 ? dynamicEmotions : Object.keys(EMOTION_STYLES)).map(eKey => {
                  const style = EMOTION_STYLES[eKey] || {
                    label: formatCategory(eKey),
                    emoji: '•',
                    color: '#64748B'
                  };

                  const isActive = emotion === eKey;

                  return (
                    <button
                      key={eKey}
                      onClick={() => setEmotion(eKey)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        border: `1px solid ${isActive ? style.color : '#E2E8F0'}`,
                        background: isActive ? style.color : '#F8FAFC',
                        color: isActive ? '#FFFFFF' : '#475569',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        fontFamily: font,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {style.emoji} {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={clearAllFilters}
                style={{
                  width: 'fit-content',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(239,68,68,0.25)',
                  background: 'rgba(239,68,68,0.07)',
                  color: '#B91C1C',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: font,
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '13px 16px',
          borderRadius: '13px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          marginBottom: '16px'
        }}>
          <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
          <p style={{
            fontSize: '13px',
            color: '#B91C1C',
            margin: 0,
            flex: 1,
            fontWeight: 500
          }}>
            {error}
          </p>

          <button
            onClick={fetchFeedback}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#B91C1C',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: font
            }}
          >
            Try Again
          </button>
        </div>
      )}

      <div style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)',
        overflow: 'hidden'
      }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 170px 1fr 120px 110px',
            gap: '0',
            padding: '10px 20px',
            background: '#F8FAFC',
            borderBottom: '1px solid #F1F5F9'
          }}
          className="hidden md:grid"
        >
          {['#', 'Category', 'Feedback', 'Sentiment', 'Date'].map((h, i) => (
            <div
              key={h}
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textAlign: i === 4 ? 'right' : 'left'
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 0',
            gap: '14px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '4px solid #DBEAFE',
              borderTopColor: '#2563EB',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
              Loading feedback…
            </p>
          </div>
        ) : feedback.length > 0 ? (
          <div>
            {feedback.map((item, index) => {
              const categoryName = getFeedbackCategory(item);
              const cat = getCategoryColor(categoryName);
              const sent = SENTIMENT_COLORS[item.sentiment] || SENTIMENT_COLORS.neutral;
              const rowNum = (page - 1) * PAGE_SIZE + index + 1;

              return (
                <div
                  key={item._id}
                  onClick={() => setSelected(item)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 170px 1fr 120px 110px',
                    gap: '0',
                    padding: '13px 20px',
                    borderBottom: '1px solid #F8FAFC',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
                      {rowNum}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    <Pill color={cat}>
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: cat.stroke,
                        flexShrink: 0
                      }} />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '130px'
                      }}>
                        {formatCategory(categoryName)}
                      </span>
                    </Pill>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    paddingRight: '12px'
                  }}>
                    <p style={{
                      fontSize: '13px',
                      color: '#334155',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.01em'
                    }}>
                      {item.feedback}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Pill color={sent}>
                      {sent.emoji} {sent.label}
                    </Pill>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px'
                  }}>
                    <Clock size={11} color="#CBD5E1" />
                    <span style={{
                      fontSize: '11.5px',
                      color: '#94A3B8',
                      fontWeight: 500
                    }}>
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            gap: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.10)'
            }}>
              <MessageSquare size={24} color="#2563EB" />
            </div>

            <p style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#334155',
              margin: 0
            }}>
              No feedback found
            </p>

            <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: 0 }}>
              { activeFilters > 0
                ? 'Try adjusting your search or filters'
                : 'No feedback has been submitted yet'}
            </p>

            {( activeFilters > 0) && (
              <button
                onClick={() => {
                  clearAllFilters();
                }}
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#2563EB',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: font,
                  marginTop: '4px'
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        <Pagination page={page} pages={pages} total={total} onChange={setPage} />
      </div>

      {selected && (
  <FeedbackModal
    feedback={selected}
    onClose={() => setSelected(null)}
    onAddResolution={(feedbackItem) => {
      setResolutionTarget(feedbackItem);
      setSelected(null);
    }}
  />
)}

{resolutionTarget && (
<ResolutionModal
  isOpen={!!resolutionTarget}
  feedback={resolutionTarget}
  categories={dynamicCategories}
  onClose={() => setResolutionTarget(null)}
  onSuccess={() => {
    setResolutionTarget(null);
    fetchFeedback();
  }}
/>
)}
    </div>
  );
};

export default AllFeedback;