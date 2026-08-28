import React from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  Building2, 
  UserCheck, 
  AlertTriangle, 
  FlaskConical, 
  Search,
  Activity,
  Layers
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isLive = true }) {
  const navItems = [
    { id: 'overview', label: 'National DigiGov', icon: BarChart3 },
    { id: 'ministry', label: 'Ministry Executive', icon: Building2 },
    { id: 'state', label: 'State & IDA Radar', icon: Layers },
    { id: 'mp', label: 'MP Constituency', icon: UserCheck },
    { id: 'alerts', label: 'Vigilance & Alerts', icon: AlertTriangle, badge: 'Priority' },
    { id: 'validation', label: 'AI Validation Lab', icon: FlaskConical },
    { id: 'explorer', label: 'Work Explorer', icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Government Strip */}
      <div className="tricolor-stripe w-full"></div>
      
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-navy text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-gov-saffron uppercase">Government of India</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">MoSPI (Ministry of Statistics & Programme Implementation)</span>
            </div>
            <h1 className="text-lg font-extrabold text-gov-navy flex items-center gap-2">
              MPLADS <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">AI Risk Engine v2.0</span>
            </h1>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>43,496 Real Works Active</span>
          </div>

          <div className="text-right hidden md:block">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Scheme Tenure</div>
            <div className="text-xs font-bold text-slate-700">17th Lok Sabha & Rajya Sabha</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-gov-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isActive ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
