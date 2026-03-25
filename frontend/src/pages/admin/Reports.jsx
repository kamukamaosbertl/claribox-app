import { useState, useEffect, useRef } from 'react';
import {
  FileText, RefreshCw, AlertCircle,
  TrendingUp, MessageSquare, CheckCircle,
  Calendar, FileDown, Printer,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const font = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

// ── Palette ───────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  academic:   '#6366F1',
  library:    '#22C55E',
  it:         '#06B6D4',
  facilities: '#F59E0B',
  canteen:    '#EAB308',
  transport:  '#8B5CF6',
  hostel:     '#F43F5E',
  admin:      '#64748B',
  other:      '#94A3B8',
};

const STATUS_STYLES = {
  'Completed':   { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  text: '#15803D' },
  'In Progress': { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#B45309' },
  'Planned':     { bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)',  text: '#1D4ED8' },
};

const DATE_FILTERS = [
  { label: 'All Time',      value: 'all'      },
  { label: 'Last 7 days',   value: '7days'    },
  { label: 'Last 30 days',  value: '30days'   },
  { label: 'This Semester', value: 'semester' },
];

const RES_PER_PAGE = 5;

// ── CSV export ────────────────────────────────────────────────────────────
const exportToCSV = (stats, categoryData, resolutions, filter) => {
  const rows   = [];
  const date   = new Date().toLocaleDateString();
  const period = DATE_FILTERS.find(f => f.value === filter)?.label || 'All Time';
  rows.push(['CLARIBOX FEEDBACK REPORT']);
  rows.push([`Generated: ${date}`]);
  rows.push([`Period: ${period}`]);
  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['Metric', 'Value']);
  rows.push(['Total Feedback',     stats.total    || 0]);
  rows.push(['Positive',           stats.positive || 0]);
  rows.push(['Neutral',            stats.neutral  || 0]);
  rows.push(['Negative',           stats.negative || 0]);
  rows.push(['Total Resolutions',  resolutions.length]);
  rows.push([]);
  rows.push(['FEEDBACK BY CATEGORY']);
  rows.push(['Category', 'Count', 'Percentage']);
  categoryData.forEach(cat => {
    const pct = stats.total > 0 ? ((cat.count / stats.total) * 100).toFixed(1) : '0.0';
    rows.push([cat.name, cat.count, `${pct}%`]);
  });
  rows.push([]);
  rows.push(['RESOLVED ISSUES']);
  rows.push(['Title', 'Description', 'Category', 'Status', 'Date Resolved']);
  resolutions.forEach(res => {
    rows.push([res.title, res.description || '', res.category, res.status || 'Completed', new Date(res.createdAt).toLocaleDateString()]);
  });
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `claribox-report-${date.replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToPDF = (setResPage) => {
  setResPage(1);
  setTimeout(() => window.print(), 300);
};

// ── Stat card ─────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, value, label, iconBg, iconColor, valueColor = '#0F172A' }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)',
    padding: '18px',
  }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      background: iconBg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', marginBottom: '12px',
    }}>
      {typeof Icon === 'string'
        ? <span style={{ fontSize: '16px' }}>{Icon}</span>
        : <Icon size={17} color={iconColor} />
      }
    </div>
    <p style={{ fontSize: '28px', fontWeight: 800, color: valueColor, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 4px' }}>
      {value}
    </p>
    <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </p>
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────
const Pagination = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  const btn = (content, onClick, disabled, active) => (
    <button
      key={content}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '32px', height: '32px', borderRadius: '9px',
        border: `1px solid ${active ? '#2563EB' : '#E2E8F0'}`,
        background: active ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#475569',
        fontSize: '12px', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        boxShadow: active ? '0 3px 8px rgba(37,99,235,0.22)' : 'none',
        transition: 'all 0.14s ease', fontFamily: font,
      }}
    >
      {content}
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC' }}
      className="no-print">
      <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
        Page {page} of {total}
      </p>
      <div style={{ display: 'flex', gap: '6px' }}>
        {btn(<ChevronLeft size={14} />, () => onChange(p => Math.max(1, p - 1)), page === 1, false)}
        {Array.from({ length: total }, (_, i) => i + 1).map(p =>
          btn(p, () => onChange(p), false, p === page)
        )}
        {btn(<ChevronRight size={14} />, () => onChange(p => Math.min(total, p + 1)), page === total, false)}
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const Reports = () => {
  const [filter,       setFilter]       = useState('all');
  const [stats,        setStats]        = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [resolutions,  setResolutions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [resPage,      setResPage]      = useState(1);
  const printRef = useRef(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [analyticsRes, resolutionsRes] = await Promise.all([
        adminAPI.getAnalytics({ filter }),
        adminAPI.getResolutions(),
      ]);
      const a = analyticsRes.data;
      setStats({
        total:    a.stats?.total        || 0,
        resolved: a.stats?.resolved     || 0,
        positive: a.sentiment?.positive || 0,
        neutral:  a.sentiment?.neutral  || 0,
        negative: a.sentiment?.negative || 0,
      });
      setCategoryData(a.categoryData || []);
      setResolutions(resolutionsRes.data.data || []);
      setResPage(1);
    } catch { setError('Failed to load report data. Please try again.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const totalResPages        = Math.ceil(resolutions.length / RES_PER_PAGE);
  const paginatedResolutions = resolutions.slice((resPage - 1) * RES_PER_PAGE, resPage * RES_PER_PAGE);
  const reportDate           = new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ fontFamily: font }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }} ref={printRef}>

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.035em' }}>
              Reports
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
              Export and analyse feedback data
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Refresh */}
            <button
              onClick={fetchData} disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '9px 16px', borderRadius: '11px',
                border: '1px solid #E2E8F0', background: '#FFFFFF',
                fontSize: '13px', fontWeight: 700, color: '#475569',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
                fontFamily: font, transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.color = '#2563EB'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>

            {/* CSV */}
            <button
              onClick={() => stats && exportToCSV(stats, categoryData, resolutions, filter)}
              disabled={loading || !stats}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '9px 16px', borderRadius: '11px', border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
                cursor: loading || !stats ? 'not-allowed' : 'pointer',
                opacity: loading || !stats ? 0.5 : 1, fontFamily: font,
                boxShadow: '0 4px 12px rgba(5,150,105,0.22)', transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!loading && stats) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(5,150,105,0.30)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,150,105,0.22)'; }}
            >
              <FileDown size={14} /> Export CSV
            </button>

            {/* PDF */}
            <button
              onClick={() => exportToPDF(setResPage)}
              disabled={loading || !stats}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '9px 16px', borderRadius: '11px', border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
                cursor: loading || !stats ? 'not-allowed' : 'pointer',
                opacity: loading || !stats ? 0.5 : 1, fontFamily: font,
                boxShadow: '0 4px 12px rgba(37,99,235,0.22)', transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!loading && stats) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.30)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.22)'; }}
            >
              <Printer size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* ── Date filter pills ────────────────────────────────────── */}
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {DATE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '8px 16px', borderRadius: '20px',
                border: filter === f.value ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                background: filter === f.value ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#FFFFFF',
                color: filter === f.value ? '#FFFFFF' : '#475569',
                fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: font,
                boxShadow: filter === f.value ? '0 4px 10px rgba(37,99,235,0.20)' : 'none',
                transition: 'all 0.16s ease',
              }}
              onMouseEnter={(e) => { if (filter !== f.value) { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.color = '#2563EB'; } }}
              onMouseLeave={(e) => { if (filter !== f.value) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; } }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 18px', borderRadius: '14px', marginBottom: '20px',
            background: '#FEF2F2', border: '1px solid #FECACA',
            animation: 'slideUp 0.2s ease',
          }}>
            <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: '#B91C1C', margin: 0, flex: 1, fontWeight: 500 }}>{error}</p>
            <button onClick={fetchData} style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>
              Try Again
            </button>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '4px solid #DBEAFE', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Loading report data…</p>
          </div>
        ) : stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Print title */}
            <div style={{ display: 'none' }} className="print-header">
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>ClariBox Feedback Report</h1>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{reportDate} · {DATE_FILTERS.find(f => f.value === filter)?.label}</p>
            </div>

            {/* ── Stat cards ──────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
              <StatCard icon={MessageSquare} value={stats.total}    label="Total Feedback" iconBg="#EFF6FF"       iconColor="#2563EB" />
              <StatCard icon="😊"            value={stats.positive} label="Positive"       iconBg="#F0FDF4"       iconColor="#22C55E" valueColor="#15803D" />
              <StatCard icon="😐"            value={stats.neutral}  label="Neutral"        iconBg="#F8FAFC"       iconColor="#64748B" valueColor="#475569" />
              <StatCard icon="😞"            value={stats.negative} label="Negative"       iconBg="#FEF2F2"       iconColor="#EF4444" valueColor="#B91C1C" />
              <StatCard icon={CheckCircle}   value={resolutions.length} label="Resolutions" iconBg="#F0FDF4"    iconColor="#22C55E" valueColor="#15803D" />
            </div>

            {/* ── Category breakdown table ─────────────────────────── */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#2563EB" />
                </div>
                <h2 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Feedback by Category</h2>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      {['Category', 'Count', 'Share', '%'].map((h, i) => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: i === 3 ? 'right' : 'left', fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: font }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.length > 0 ? categoryData.map((cat, i) => {
                      const pct   = stats.total > 0 ? ((cat.count / stats.total) * 100).toFixed(1) : '0.0';
                      const color = CATEGORY_COLORS[cat.name?.toLowerCase()] || CATEGORY_COLORS.other;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.14s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 0 2px ${color}28`, flexShrink: 0 }} />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{cat.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{cat.count}</span>
                          </td>
                          <td style={{ padding: '12px 20px', width: '180px' }}>
                            <div style={{ height: '5px', borderRadius: '99px', background: '#F1F5F9', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: color, boxShadow: `0 0 5px ${color}55`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                            </div>
                          </td>
                          <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>
                          No feedback data for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Resolutions table ────────────────────────────────── */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={16} color="#22C55E" />
                  </div>
                  <h2 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Resolved Issues</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="no-print">
                  {resolutions.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                      {(resPage - 1) * RES_PER_PAGE + 1}–{Math.min(resPage * RES_PER_PAGE, resolutions.length)} of {resolutions.length}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '20px', padding: '3px 10px' }}>
                    {resolutions.length} total
                  </span>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      {['#', 'Title', 'Category', 'Status', 'Date'].map((h, i) => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: i === 4 ? 'right' : 'left', fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: font }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResolutions.length > 0 ? paginatedResolutions.map((res, i) => {
                      const rowNum = (resPage - 1) * RES_PER_PAGE + i + 1;
                      const s      = STATUS_STYLES[res.status] || STATUS_STYLES['Planned'];
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.14s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>{rowNum}</span>
                          </td>
                          <td style={{ padding: '13px 20px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '0 0 2px', letterSpacing: '-0.01em' }}>{res.title}</p>
                            {res.description && (
                              <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                {res.description}
                              </p>
                            )}
                          </td>
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '20px', padding: '3px 9px' }}>
                              {res.category}
                            </span>
                          </td>
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: s.text, background: s.bg, border: `1px solid ${s.border}`, borderRadius: '20px', padding: '3px 9px' }}>
                              {res.status || 'Completed'}
                            </span>
                          </td>
                          <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                            <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>
                              {new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>
                          No resolutions published yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination page={resPage} total={totalResPages} onChange={setResPage} />
            </div>

            {/* ── Report footer ────────────────────────────────────── */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <FileText size={14} color="#CBD5E1" />
                <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>ClariBox Feedback Report</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color="#CBD5E1" />
                <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>{reportDate}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;