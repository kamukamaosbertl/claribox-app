import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  { bg: '#6366f1', light: 'bg-indigo-50',  text: 'text-indigo-700'  },
  { bg: '#22c55e', light: 'bg-green-50',   text: 'text-green-700'   },
  { bg: '#f59e0b', light: 'bg-amber-50',   text: 'text-amber-700'   },
  { bg: '#ef4444', light: 'bg-red-50',     text: 'text-red-700'     },
  { bg: '#8b5cf6', light: 'bg-violet-50',  text: 'text-violet-700'  },
  { bg: '#06b6d4', light: 'bg-cyan-50',    text: 'text-cyan-700'    },
  { bg: '#ec4899', light: 'bg-pink-50',    text: 'text-pink-700'    },
  { bg: '#84cc16', light: 'bg-lime-50',    text: 'text-lime-700'    },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-lg text-sm">
        <p className="font-semibold text-slate-800 mb-0.5">{payload[0].name}</p>
        <p className="text-slate-500">{payload[0].value} submissions</p>
      </div>
    );
  }
  return null;
};

const CategoryChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + (item.value || item.count || 0), 0);

  const chartData = data.map(item => ({
    name:  item.name,
    value: item.value || item.count || 0
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-800">Feedback by Category</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {total} total submissions across {data.length} categories
        </p>
      </div>

      {/* Chart + breakdown */}
      <div className="flex items-center gap-6">

        {/* Donut chart */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                strokeWidth={0}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length].bg} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-bold text-slate-800 leading-none">{total}</p>
            <p className="text-xs text-slate-400 mt-0.5">total</p>
          </div>
        </div>

        {/* Category bars */}
        <div className="flex-1 flex flex-col gap-2.5">
          {[...chartData]
            .sort((a, b) => b.value - a.value)
            .map((cat, index) => {
              const originalIndex = data.findIndex(d => d.name === cat.name);
              const color = COLORS[originalIndex % COLORS.length];
              const pct   = total > 0 ? Math.round((cat.value / total) * 100) : 0;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: color.bg }}
                      />
                      <span className="text-xs text-slate-600 font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">{cat.value}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${color.light} ${color.text}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color.bg }}
                    />
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