import { useState, useEffect } from 'react';
import {
  FileText, RefreshCw, AlertCircle,
  TrendingUp, MessageSquare, CheckCircle,
  Calendar, FileDown, Printer,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
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
  'Completed':   { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  'In Progress': { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700'   },
  'Planned':     { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700'    },
};

const DATE_FILTERS = [
  { label: 'All Time',      value: 'all'      },
  { label: 'Last 7 days',   value: '7days'    },
  { label: 'Last 30 days',  value: '30days'   },
  { label: 'This Semester', value: 'semester' },
];

const RES_PER_PAGE = 5;

/* ─────────────────────────────────────────────────────────
   CSV EXPORT
───────────────────────────────────────────────────────── */
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
  rows.push(['Total Feedback',    stats.total    || 0]);
  rows.push(['Positive',          stats.positive || 0]);
  rows.push(['Neutral',           stats.neutral  || 0]);
  rows.push(['Negative',          stats.negative || 0]);
  rows.push(['Total Resolutions', resolutions.length]);
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
  a.href = url; a.download = `claribox-report-${date.replace(/\//g, '-')}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

/* ─────────────────────────────────────────────────────────
   PDF EXPORT  (jsPDF + autoTable loaded from CDN)
───────────────────────────────────────────────────────── */
const loadScript = src =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

const hexToRgb = hex => hex.match(/\w\w/g).map(x => parseInt(x, 16));

const exportToPDF = async (stats, categoryData, resolutions, filter, setPdfLoading) => {
  setPdfLoading(true);
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');

    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W    = doc.internal.pageSize.getWidth();
    const period = DATE_FILTERS.find(f => f.value === filter)?.label || 'All Time';
    const date   = new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    let y = 0;

    /* Header band */
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, W, 26, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text('ClariBox Feedback Report', 14, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(191, 219, 254);
    doc.text(`${date}  ·  ${period}`, 14, 21);
    y = 34;

    /* Summary stat boxes */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SUMMARY', 14, y);
    y += 4;

    const statItems = [
      { label: 'Total',       value: stats.total,        color: [37, 99, 235]   },
      { label: 'Positive',    value: stats.positive,     color: [5, 150, 105]   },
      { label: 'Neutral',     value: stats.neutral,      color: [100, 116, 139] },
      { label: 'Negative',    value: stats.negative,     color: [220, 38, 38]   },
      { label: 'Resolutions', value: resolutions.length, color: [5, 150, 105]   },
    ];

    const colW = (W - 28) / statItems.length;
    statItems.forEach((s, i) => {
      const x = 14 + i * colW;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, colW - 3, 19, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...s.color);
      doc.text(String(s.value), x + (colW - 3) / 2, y + 10, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(s.label.toUpperCase(), x + (colW - 3) / 2, y + 16, { align: 'center' });
    });
    y += 27;

    /* Category table */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('FEEDBACK BY CATEGORY', 14, y);
    y += 2;

    doc.autoTable({
      startY: y,
      head: [['Category', 'Count', 'Share %']],
      body: categoryData.length > 0
        ? categoryData.map(cat => {
            const pct = stats.total > 0 ? ((cat.count / stats.total) * 100).toFixed(1) : '0.0';
            return [cat.name?.charAt(0).toUpperCase() + cat.name?.slice(1), cat.count, `${pct}%`];
          })
        : [['No data for this period', '', '']],
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 22, halign: 'right' },
      },
      didDrawCell: data => {
        if (data.section === 'body' && data.column.index === 0 && categoryData.length > 0) {
          const raw = categoryData[data.row.index]?.name?.toLowerCase();
          const rgb = hexToRgb(CATEGORY_COLORS[raw] || CATEGORY_COLORS.other);
          doc.setFillColor(...rgb);
          doc.circle(data.cell.x + 3.5, data.cell.y + data.cell.height / 2, 1.4, 'F');
        }
      },
      theme: 'grid',
    });

    y = doc.lastAutoTable.finalY + 10;
    if (y > 220) { doc.addPage(); y = 16; }

    /* Resolutions table */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('RESOLVED ISSUES', 14, y);
    y += 2;

    doc.autoTable({
      startY: y,
      head: [['#', 'Title', 'Category', 'Status', 'Date']],
      body: resolutions.length > 0
        ? resolutions.map((res, i) => [
            i + 1,
            res.title,
            res.category,
            res.status || 'Completed',
            new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          ])
        : [['—', 'No resolutions published yet', '', '', '']],
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', textColor: [148, 163, 184] },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28 },
        3: { cellWidth: 26 },
        4: { cellWidth: 30, halign: 'right' },
      },
      theme: 'grid',
    });

    /* Page footer */
    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      const ph = doc.internal.pageSize.getHeight();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, ph - 10, W, 10, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('ClariBox Feedback Report', 14, ph - 4);
      doc.text(`Page ${p} of ${pages}`, W - 14, ph - 4, { align: 'right' });
    }

    doc.save(`claribox-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('PDF export failed. Please try again.');
  } finally {
    setPdfLoading(false);
  }
};

/* ─────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────── */
const Card = ({ children, className = '' }) => (
  <div className={`overflow-hidden rounded-2xl border border-[#E8ECF4] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[#F1F5F9] px-5 py-4">
    {children}
  </div>
);

const EyebrowLabel = ({ children }) => (
  <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">{children}</p>
);

const IconBadge = ({ icon: Icon, iconClass, bgClass, borderClass }) => (
  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${bgClass} ${borderClass}`}>
    <Icon size={15} className={iconClass} />
  </div>
);

const StatCard = ({ icon: Icon, value, label, iconBg, iconColor, valueColor = 'text-slate-900' }) => (
  <Card className="p-5">
    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
      {typeof Icon === 'string'
        ? <span className="text-base">{Icon}</span>
        : <Icon size={16} className={iconColor} />}
    </div>
    <p className={`text-3xl font-black leading-none tracking-[-0.04em] ${valueColor}`}>{value}</p>
    <EyebrowLabel>{label}</EyebrowLabel>
  </Card>
);

/* ─────────────────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────────────────── */
const Pagination = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  const Btn = ({ children, onClick, disabled, active }) => (
    <button
      onClick={onClick} disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition
        ${active ? 'border-blue-600 bg-blue-600 text-white shadow-[0_3px_8px_rgba(37,99,235,0.25)]'
                 : 'border-[#E2E8F0] bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'}
        ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
  return (
    <div className="flex items-center justify-between border-t border-[#F1F5F9] bg-[#FAFBFC] px-5 py-3">
      <p className="text-[11px] font-medium text-slate-400">Page {page} of {total}</p>
      <div className="flex gap-1.5">
        <Btn onClick={() => onChange(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={13} /></Btn>
        {Array.from({ length: total }, (_, i) => i + 1).map(p => (
          <Btn key={p} onClick={() => onChange(p)} active={p === page}>{p}</Btn>
        ))}
        <Btn onClick={() => onChange(p => Math.min(total, p + 1))} disabled={page === total}><ChevronRight size={13} /></Btn>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const Reports = () => {
  const [filter,       setFilter]       = useState('all');
  const [stats,        setStats]        = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [resolutions,  setResolutions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [pdfLoading,   setPdfLoading]   = useState(false);
  const [error,        setError]        = useState(null);
  const [resPage,      setResPage]      = useState(1);

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
    } catch {
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const totalResPages        = Math.ceil(resolutions.length / RES_PER_PAGE);
  const paginatedResolutions = resolutions.slice((resPage - 1) * RES_PER_PAGE, resPage * RES_PER_PAGE);
  const reportDate           = new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="font-sans antialiased">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="mx-auto max-w-[900px] space-y-6">

        {/* ══ PAGE HEADER ══════════════════════════════════════════ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.035em] text-slate-900">Reports</h1>
            <p className="mt-0.5 text-[13px] font-medium text-slate-400">Export and analyse feedback data</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchData} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-[13px] font-bold text-slate-500
                shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>

            <button
              onClick={() => stats && exportToCSV(stats, categoryData, resolutions, filter)}
              disabled={loading || !stats}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white
                shadow-[0_4px_12px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown size={13} /> Export CSV
            </button>

            <button
              onClick={() => stats && exportToPDF(stats, categoryData, resolutions, filter, setPdfLoading)}
              disabled={loading || !stats || pdfLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-bold text-white
                shadow-[0_4px_12px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pdfLoading
                ? <><RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</>
                : <><Printer size={13} /> Export PDF</>}
            </button>
          </div>
        </div>

        {/* ══ DATE FILTER PILLS ════════════════════════════════════ */}
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-4 py-2 text-[12.5px] font-bold transition
                ${filter === f.value
                  ? 'bg-blue-600 text-white shadow-[0_4px_10px_rgba(37,99,235,0.22)]'
                  : 'border border-[#E2E8F0] bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ══ ERROR ════════════════════════════════════════════════ */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <p className="flex-1 text-[13px] font-medium text-red-700">{error}</p>
            <button onClick={fetchData} className="text-[12px] font-bold text-red-600 hover:underline">Try Again</button>
          </div>
        )}

        {/* ══ LOADING ══════════════════════════════════════════════ */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="h-8 w-8 rounded-full border-4 border-blue-100 border-t-blue-600"
              style={{ animation: 'spin 0.8s linear infinite' }} />
            <p className="text-[13px] text-slate-400">Loading report data…</p>
          </div>
        )}

        {/* ══ CONTENT ══════════════════════════════════════════════ */}
        {!loading && stats && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              <StatCard icon={MessageSquare} value={stats.total}        label="Total"       iconBg="bg-blue-50"    iconColor="text-blue-500" />
              <StatCard icon="😊"            value={stats.positive}     label="Positive"    iconBg="bg-emerald-50" iconColor="text-emerald-500" valueColor="text-emerald-700" />
              <StatCard icon="😐"            value={stats.neutral}      label="Neutral"     iconBg="bg-slate-100"  iconColor="text-slate-400"   valueColor="text-slate-600" />
              <StatCard icon="😞"            value={stats.negative}     label="Negative"    iconBg="bg-red-50"     iconColor="text-red-500"     valueColor="text-red-700" />
              <StatCard icon={CheckCircle}   value={resolutions.length} label="Resolutions" iconBg="bg-emerald-50" iconColor="text-emerald-500" valueColor="text-emerald-700" />
            </div>

            {/* Category table */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <IconBadge icon={TrendingUp} iconClass="text-blue-600" bgClass="bg-blue-50" borderClass="border-blue-100" />
                  <h2 className="text-[13.5px] font-extrabold tracking-[-0.02em] text-slate-900">Feedback by Category</h2>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                      {['Category', 'Count', 'Share', '%'].map((h, i) => (
                        <th key={h} className={`px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400 ${i === 3 ? 'text-right' : 'text-left'}`}>
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
                        <tr key={i} className="border-b border-[#F8FAFC] transition hover:bg-[#F8FAFC]">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 0 2px ${color}28` }} />
                              <span className="text-[13px] font-semibold capitalize text-slate-700">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3"><span className="text-[13px] font-black text-slate-900">{cat.count}</span></td>
                          <td className="px-5 py-3 w-44">
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right"><span className="text-[12px] font-bold text-slate-500">{pct}%</span></td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-slate-400">No feedback data for this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Resolutions table */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <IconBadge icon={CheckCircle} iconClass="text-emerald-600" bgClass="bg-emerald-50" borderClass="border-emerald-100" />
                  <h2 className="text-[13.5px] font-extrabold tracking-[-0.02em] text-slate-900">Resolved Issues</h2>
                </div>
                <div className="flex items-center gap-2.5">
                  {resolutions.length > 0 && (
                    <span className="text-[11px] font-medium text-slate-400">
                      {(resPage - 1) * RES_PER_PAGE + 1}–{Math.min(resPage * RES_PER_PAGE, resolutions.length)} of {resolutions.length}
                    </span>
                  )}
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    {resolutions.length} total
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                      {['#', 'Title', 'Category', 'Status', 'Date'].map((h, i) => (
                        <th key={h} className={`px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400 ${i === 4 ? 'text-right' : 'text-left'}`}>
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
                        <tr key={i} className="border-b border-[#F8FAFC] transition hover:bg-[#F8FAFC]">
                          <td className="px-5 py-3.5"><span className="text-[11px] font-semibold text-slate-300">{rowNum}</span></td>
                          <td className="px-5 py-3.5 max-w-[240px]">
                            <p className="truncate text-[13px] font-bold tracking-[-0.01em] text-slate-900">{res.title}</p>
                            {res.description && <p className="mt-0.5 truncate text-[11.5px] text-slate-400">{res.description}</p>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">{res.category}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${s.bg} ${s.border} ${s.text}`}>
                              {res.status || 'Completed'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-[11.5px] font-medium text-slate-400">
                              {new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-slate-400">No resolutions published yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={resPage} total={totalResPages} onChange={setResPage} />
            </Card>

            {/* Report footer */}
            <div className="flex items-center justify-between rounded-2xl border border-[#E8ECF4] bg-white px-5 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-slate-300" />
                <span className="text-[11.5px] font-medium text-slate-400">ClariBox Feedback Report</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-300" />
                <span className="text-[11.5px] font-medium text-slate-400">{reportDate}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;