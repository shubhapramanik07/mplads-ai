import React, { useState } from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  FolderGit2, 
  AlertTriangle, 
  LineChart, 
  MapPin, 
  FileSpreadsheet, 
  FlaskConical,
  Search,
  Bell,
  User,
  ChevronDown,
  Building,
  Layers,
  UserCheck,
  Check
} from 'lucide-react';

export default function Navbar({ 
  currentRole, 
  setCurrentRole, 
  selectedScope, 
  setSelectedScope,
  states = [],
  districts = [],
  mps = [],
  activeNav, 
  setActiveNav,
  alertCount = 0,
  onGlobalSearch
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const roles = [
    { id: 'ministry', label: 'Ministry / Central Govt', subtitle: 'National MoSPI Oversight', icon: Building, color: 'bg-blue-600' },
    { id: 'state', label: 'State Nodal Authority', subtitle: 'State & District Implementation', icon: Layers, color: 'bg-emerald-600' },
    { id: 'district', label: 'District Authority', subtitle: 'District Magistrate / Collector', icon: Building, color: 'bg-amber-600' },
    { id: 'mp', label: 'Member of Parliament', subtitle: 'Constituency Work Monitoring', icon: UserCheck, color: 'bg-purple-600' },
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'alerts', label: 'AI Alerts', icon: AlertTriangle, badge: alertCount > 0 ? `${alertCount}` : null },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'map', label: 'Project Map', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'validation', label: 'AI Model Lab', icon: FlaskConical },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onGlobalSearch) onGlobalSearch(searchInput);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Government Tricolor Stripe */}
      <div className="tricolor-stripe w-full"></div>

      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left: Emblem & App Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gov-navy text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-wider text-gov-saffron uppercase">GOVERNMENT OF INDIA</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-semibold text-slate-500">MoSPI (e-SAKSHI)</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-gov-navy flex items-center gap-2">
              MPLADS <span className="bg-blue-100 text-blue-900 text-xs px-2 py-0.5 rounded font-extrabold">AI Vigilance Platform</span>
            </h1>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Global Search (Project ID, MP, District, Agency)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            />
          </form>
        </div>

        {/* Right: Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Notifications Button */}
          <button 
            onClick={() => setActiveNav('alerts')}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View AI Alerts"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>

          {/* Role Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all text-left shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-gov-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
                <User className="w-4 h-4 text-amber-400" />
              </div>
              <div className="hidden sm:block">
                <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Active Role</div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <span>{roles.find(r => r.id === currentRole)?.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-extrabold text-slate-900">Switch Monitoring Role</div>
                  <div className="text-[11px] text-slate-400">Select authority view to simulate live workflow</div>
                </div>

                <div className="p-1 space-y-1">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = currentRole === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setCurrentRole(r.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                          isSelected ? 'bg-blue-50 border border-blue-200 text-blue-950' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg text-white ${r.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold">{r.label}</div>
                            <div className="text-[10px] text-slate-400">{r.subtitle}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Role Context Bar (State/District/MP Specific Selectors) */}
      <div className="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <span className="text-slate-400">Authority Scope:</span>
          
          {currentRole === 'ministry' && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-bold">
              🇮🇳 National MoSPI Oversight (All 33 States & UTs)
            </span>
          )}

          {currentRole === 'state' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">State:</span>
              <select
                value={selectedScope.state || (states[0]?.state || 'Uttar Pradesh')}
                onChange={(e) => setSelectedScope({ ...selectedScope, state: e.target.value })}
                className="font-bold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-900"
              >
                {states.map((s, idx) => (
                  <option key={idx} value={s.state}>{s.state}</option>
                ))}
              </select>
            </div>
          )}

          {currentRole === 'district' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">State:</span>
                <select
                  value={selectedScope.state || (states[0]?.state || 'Uttar Pradesh')}
                  onChange={(e) => setSelectedScope({ ...selectedScope, state: e.target.value })}
                  className="font-bold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-900"
                >
                  {states.map((s, idx) => (
                    <option key={idx} value={s.state}>{s.state}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500">District:</span>
                <select
                  value={selectedScope.district || ''}
                  onChange={(e) => setSelectedScope({ ...selectedScope, district: e.target.value })}
                  className="font-bold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-900"
                >
                  <option value="All">All Districts</option>
                  {districts.map((d, idx) => (
                    <option key={idx} value={d.district}>{d.district}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentRole === 'mp' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Member of Parliament:</span>
              <select
                value={selectedScope.mpName || (mps[0]?.mp_name || '')}
                onChange={(e) => setSelectedScope({ ...selectedScope, mpName: e.target.value })}
                className="font-bold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-900 max-w-xs truncate"
              >
                {mps.map((m, idx) => (
                  <option key={idx} value={m.mp_name}>
                    {m.mp_name} — {m.constituency} ({m.state})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>43,496 Official Works Active in Pipeline</span>
        </div>
      </div>

      {/* Navigation Sub-Menu */}
      <div className="bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-gov-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
