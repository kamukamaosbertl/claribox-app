import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  { bg: '#6366f1', light: '#eef2ff', text: '#4338ca' }, // indigo
  { bg: '#22c55e', light: '#f0fdf4', text: '#15803d' }, // green
  { bg: '#f59e0b', light: '#fffbeb', text: '#b45309' }, // amber
  { bg: '#ef4444', light: '#fef2f2', text: '#b91c1c' }, // red
  { bg: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9' }, // purple
  { bg: '#06b6d4', light: '#ecfeff', text: '#0e7490' }, // cyan
  { bg: '#ec4899', light: '#fdf2f8', text: '#be185d' }, // pink
  { bg: '#84cc16', light: '#f7fee7', text: '#4d7c0f' }, // lime
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: '13px'
      }}>
        <p style={{ fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{item.name}</p>
        <p style={{ color: '#6b7280' }}>{item.value} submissions</p>
      </div>
    );
  }
  return null;
};

const CategoryChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + (item.value || item.count || 0), 0);

  const chartData = data.map(item => ({
    name: item.name,
    value: item.value || item.count || 0
  }));

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #f0f0f5',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Feedback by Category
        </h2>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
          {total} total submissions across {data.length} categories
        </p>
      </div>

      {/* Chart + Legend side by side */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>

        {/* Donut chart */}
        <div style={{ width: '180px', height: '180px', flexShrink: 0, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length].bg}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{total}</p>
            <p style={{ fontSize: '10px', color: '#9ca3af', margin: '3px 0 0' }}>total</p>
          </div>
        </div>

        {/* Category breakdown bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {chartData
            .sort((a, b) => b.value - a.value)
            .map((cat, index) => {
              const originalIndex = data.findIndex(d => (d.name === cat.name));
              const color = COLORS[originalIndex % COLORS.length];
              const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;

              return (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '8px', height: '8px',
                        borderRadius: '50%',
                        background: color.bg,
                        flexShrink: 0
                      }} />
                      <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                        {cat.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{cat.value}</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: color.text,
                        background: color.light,
                        padding: '1px 6px',
                        borderRadius: '20px'
                      }}>{pct}%</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    height: '4px',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color.bg,
                      borderRadius: '4px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default CategoryChart;