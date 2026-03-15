import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { adminAPI } from '../../services/api';

const COLORS = [
  { bg: '#6366f1', light: '#eef2ff', text: '#4338ca' },
  { bg: '#10b981', light: '#f0fdf4', text: '#065f46' },
  { bg: '#f59e0b', light: '#fffbeb', text: '#92400e' },
  { bg: '#ef4444', light: '#fef2f2', text: '#991b1b' },
  { bg: '#8b5cf6', light: '#f5f3ff', text: '#5b21b6' },
  { bg: '#ec4899', light: '#fdf2f8', text: '#9d174d' },
  { bg: '#06b6d4', light: '#ecfeff', text: '#155e75' },
  { bg: '#84cc16', light: '#f7fee7', text: '#3f6212' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1e1b4b', borderRadius: '10px',
        padding: '10px 14px', border: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <p style={{ fontSize: '12px', color: '#a5b4fc', margin: '0 0 4px' }}>{label || payload[0].name}</p>
        <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>
          {payload[0].value}
          <span style={{ fontSize: '11px', fontWeight: 400, color: '#a5b4fc', marginLeft: '4px' }}>submissions</span>
        </p>
      </div>
    );
  }
  return null;
};

const CategoryInsights = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selected, setSelected]         = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // getCategoryStats calls GET /admin/analytics
      const response = await adminAPI.getCategoryStats();
      const data = response.data;

      // Backend returns: { categoryData: [{ name, count, value }] }
      setCategoryData(data.categoryData || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load category insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const total = categoryData.reduce((sum, c) => sum + (c.count || 0), 0);

  // Loading
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '380px', gap: '14px' }}>
        <div style={{
          width: '44px', height: '44px',
          border: '3px solid #eef2ff', borderTopColor: '#6366f1',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Loading category data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(99,102,241,0.3)'
      }}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <PieChart size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Category Insights</h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Analyze feedback distribution by category
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 18px', borderRadius: '10px',
            border: 'none', background: 'rgba(255,255,255,0.2)',
            color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.2s', position: 'relative'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 18px', background: '#fff1f2',
          border: '1px solid #fecdd3', borderRadius: '12px'
        }}>
          <AlertCircle size={16} color="#ef4444" />
          <p style={{ fontSize: '13px', color: '#be123c', margin: 0 }}>{error}</p>
          <button onClick={fetchData} style={{
            marginLeft: 'auto', fontSize: '12px', fontWeight: 700,
            color: '#be123c', background: 'none', border: 'none', cursor: 'pointer'
          }}>Try Again</button>
        </div>
      )}

      {categoryData.length > 0 ? (
        <>
          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Donut chart */}
            <div style={{
              background: '#fff', borderRadius: '16px',
              border: '1px solid #f0f0f5', padding: '22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b', margin: '0 0 4px' }}>Distribution</h2>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Breakdown of feedback by category</p>
              </div>
              <div style={{ height: '240px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%" cy="50%"
                      innerRadius={65} outerRadius={100}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length].bg} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none'
                }}>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#1e1b4b', margin: 0, lineHeight: 1 }}>{total}</p>
                  <p style={{ fontSize: '10px', color: '#9ca3af', margin: '3px 0 0' }}>total</p>
                </div>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {categoryData.map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length].bg, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal bar chart */}
            <div style={{
              background: '#fff', borderRadius: '16px',
              border: '1px solid #f0f0f5', padding: '22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b', margin: '0 0 4px' }}>Comparison</h2>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Submissions per category</p>
              </div>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f0f0f5" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name" type="category" width={90}
                      tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fafafa' }} />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category cards */}
          <div style={{
            background: '#fff', borderRadius: '16px',
            border: '1px solid #f0f0f5',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid #f0f0f5',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <BarChart3 size={16} color="#6366f1" />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>All Categories</h2>
              <span style={{
                fontSize: '11px', fontWeight: 700,
                background: '#eef2ff', color: '#4338ca',
                padding: '2px 9px', borderRadius: '20px', marginLeft: 'auto'
              }}>
                {categoryData.length} categories
              </span>
            </div>

            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {categoryData.map((cat, i) => {
                const color = COLORS[i % COLORS.length];
                const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                const isSelected = selected === cat.name;

                return (
                  <div
                    key={i}
                    onClick={() => setSelected(isSelected ? null : cat.name)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1.5px solid ${isSelected ? color.bg : '#f0f0f5'}`,
                      background: isSelected ? color.light : '#fafafa',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = color.bg + '80';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#f0f0f5';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color.bg }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e1b4b' }}>{cat.count}</span>
                    </div>
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: color.bg, borderRadius: '4px',
                        transition: 'width 0.8s ease'
                      }} />
                    </div>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: color.text, margin: 0, textAlign: 'right' }}>
                      {pct}% of total
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top categories ranked */}
          <div style={{
            background: '#fff', borderRadius: '16px',
            border: '1px solid #f0f0f5',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              padding: '16px 22px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <TrendingUp size={16} color="#fff" />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
                Top Categories by Volume
              </h2>
            </div>
            <div>
              {[...categoryData]
                .sort((a, b) => b.count - a.count)
                .map((cat, i) => {
                  const color = COLORS[categoryData.indexOf(cat) % COLORS.length];
                  const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                  const medals = ['🥇', '🥈', '🥉'];

                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 22px',
                      borderBottom: i < categoryData.length - 1 ? '1px solid #f8f8fc' : 'none',
                      transition: 'background 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: i < 3 ? '18px' : '12px', fontWeight: 700, color: '#9ca3af', minWidth: '28px' }}>
                        {medals[i] || `#${i + 1}`}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{cat.name}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>{cat.count}</span>
                        </div>
                        <div style={{ height: '5px', background: '#f0f0f5', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: color.bg, borderRadius: '5px',
                            transition: 'width 0.8s ease'
                          }} />
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        background: color.light, color: color.text,
                        padding: '3px 9px', borderRadius: '20px', minWidth: '42px', textAlign: 'center'
                      }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid #f0f0f5',
          padding: '64px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#eef2ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BarChart3 size={28} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
            No Category Data Yet
          </h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, maxWidth: '380px' }}>
            Category insights will appear here once students submit feedback.
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryInsights;