import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// ── Colour palette (unchanged) ─────────────────────────────────────────────
const PALETTE = [
  { stroke: '#2563EB', bg: 'rgba(37,99,235,0.08)', text: '#1D4ED8' },
  { stroke: '#22C55E', bg: 'rgba(34,197,94,0.08)', text: '#16A34A' },
  { stroke: '#F59E0B', bg: 'rgba(245,158,11,0.08)', text: '#B45309' },
  { stroke: '#EF4444', bg: 'rgba(239,68,68,0.08)', text: '#B91C1C' },
  { stroke: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', text: '#6D28D9' },
  { stroke: '#06B6D4', bg: 'rgba(6,182,212,0.08)', text: '#0E7490' },
  { stroke: '#EC4899', bg: 'rgba(236,72,153,0.08)', text: '#BE185D' },
  { stroke: '#84CC16', bg: 'rgba(132,204,22,0.08)', text: '#4D7C0F' },
];

// ── Tooltip ────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const color = PALETTE[payload[0].payload._colorIndex % PALETTE.length];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] px-[14px] py-[10px] shadow-[0_8px_24px_rgba(15,23,42,0.10)] min-w-[140px]">
      <div className="flex items-center gap-[7px] mb-[4px]">
        <span
          className="w-[8px] h-[8px] rounded-full"
          style={{
            background: color.stroke,
            boxShadow: `0 0 0 3px ${color.bg}`,
          }}
        />
        <p className="text-[12px] font-bold text-[#0F172A] m-0">
          {payload[0].name}
        </p>
      </div>
      <p className="text-[11.5px] text-[#64748B] m-0 pl-[15px]">
        {payload[0].value} submissions
      </p>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const CategoryChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + (item.value || item.count || 0), 0);

  const chartData = data.map((item, i) => ({
    name: item.name,
    value: item.value || item.count || 0,
    _colorIndex: i,
  }));

  const sorted = [...chartData].sort((a, b) => b.value - a.value);

  return (
    <div className="flex items-center gap-[24px] h-full font-sans">

      {/* ── Donut ───────────────────────────────────────── */}
      <div className="relative w-[168px] h-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={PALETTE[index % PALETTE.length].stroke}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[24px] font-extrabold tracking-[-0.04em] text-[#0F172A] leading-none m-0">
            {total}
          </p>
          <p className="text-[10px] text-[#94A3B8] font-semibold mt-[3px] uppercase tracking-[0.06em]">
            total
          </p>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-[10px] overflow-hidden">
        {sorted.map((cat) => {
          const color = PALETTE[cat._colorIndex % PALETTE.length];
          const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;

          return (
            <div key={cat.name}>
              {/* Row */}
              <div className="flex items-center justify-between mb-[5px]">
                <div className="flex items-center gap-[7px] min-w-0">
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: color.stroke }}
                  />
                  <span className="text-[12px] font-semibold text-[#334155] truncate">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-[7px] shrink-0">
                  <span className="text-[11px] text-[#94A3B8] font-medium">
                    {cat.value}
                  </span>
                  <span
                    className="text-[10.5px] font-bold rounded-[20px] px-[7px] py-[2px] tracking-[-0.01em]"
                    style={{
                      color: color.text,
                      background: color.bg,
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="h-[5px] rounded-full bg-[#F1F5F9] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                    width: `${pct}%`,
                    background: color.stroke,
                    boxShadow: `0 0 6px ${color.stroke}55`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChart;