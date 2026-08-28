import React from 'react';

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue', 
  badge,
  help
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const accentBorder = {
    blue: 'border-l-blue-600',
    red: 'border-l-red-600',
    amber: 'border-l-amber-500',
    emerald: 'border-l-emerald-600',
    purple: 'border-l-purple-600',
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 transition-all hover:shadow-md border-l-4 ${accentBorder[color] || 'border-l-blue-600'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs font-medium text-slate-500 flex items-center justify-between">
          <span>{subtitle}</span>
          {trend && (
            <span className={`font-bold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
