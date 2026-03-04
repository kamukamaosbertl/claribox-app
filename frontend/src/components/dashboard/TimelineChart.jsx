import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TimelineChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Custom Tooltip Component for a polished look
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg">
          <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-indigo-600">
            {payload[0].value} <span className="text-slate-600 font-normal">submissions</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Feedback Over Time</h2>
        <p className="text-sm text-slate-500 mt-1">Trend analysis of incoming submissions</p>
      </div>
      
      {/* Chart Container */}
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Subtle Grid Lines */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#f1f5f9" 
            />
            
            {/* Clean X Axis */}
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              dy={10}
            />
            
            {/* Clean Y Axis */}
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
            />
            
            {/* Styled Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} />
            
            {/* Area Data */}
            <Area 
              type="monotone" 
              dataKey="feedback" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorFeedback)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimelineChart;