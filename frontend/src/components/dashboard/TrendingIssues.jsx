import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

const TrendingIssues = ({ trends }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          Trending Issues
        </h2>
      </div>
      
      {/* Content */}
      {trends && trends.length > 0 ? (
        <div className="p-4 space-y-2">
          {trends.map((trend, index) => (
            <div 
              key={index} 
              className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md hover:border-slate-100 border border-transparent transition-all duration-200 cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">#{index + 1}</span>
                  <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {trend.title}
                  </p>
                </div>
                <p className="text-xs text-slate-500 font-medium ml-6">
                  {trend.count} mentions
                </p>
              </div>
              
              {/* Trend Badge */}
              <div className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border
                ${trend.trend === 'up' ? 'bg-red-50 text-red-600 border-red-100' : 
                  trend.trend === 'down' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  'bg-slate-100 text-slate-600 border-slate-200'}
              `}>
                {trend.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                 trend.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : 
                 <Minus className="w-3 h-3" />}
                {trend.trend === 'up' ? 'Rising' : 
                 trend.trend === 'down' ? 'Falling' : 'Stable'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50/30 text-center p-6">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <BarChart3 className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-slate-600 font-medium">No trending issues</p>
          <p className="text-slate-400 text-sm mt-1">Check back later for updates</p>
        </div>
      )}
    </div>
  );
};

export default TrendingIssues;