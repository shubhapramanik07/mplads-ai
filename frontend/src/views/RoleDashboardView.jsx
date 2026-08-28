import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  IndianRupee, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  UserCheck, 
  TrendingUp, 
  ArrowUpRight, 
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import KPICard from '../components/KPICard';
import RiskBadge from '../components/RiskBadge';
import { 
  fetchDashboardSummary, 
  fetchProjects, 
  fetchStates, 
  fetchDistricts, 
  fetchAnalytics, 
  formatINR 
} from '../services/api';

export default function RoleDashboardView({ 
  currentRole, 
  selectedScope, 
  setSelectedScope,
  onSelectProject, 
  onNavigate 
}) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for interactive monitoring table
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [sumData, analData, projData, stData, distData] = await Promise.all([
        fetchDashboardSummary(
          currentRole, 
          currentRole === 'ministry' ? undefined : (selectedScope.state !== 'National' ? selectedScope.state : undefined), 
          currentRole === 'district' && selectedScope.district !== 'All' ? selectedScope.district : undefined, 
          currentRole === 'mp' ? selectedScope.mpName : undefined
        ),
        fetchAnalytics(
          currentRole, 
          currentRole === 'ministry' ? undefined : (selectedScope.state !== 'National' ? selectedScope.state : undefined), 
          currentRole === 'district' && selectedScope.district !== 'All' ? selectedScope.district : undefined, 
          currentRole === 'mp' ? selectedScope.mpName : undefined
        ),
        fetchProjects({
          role: currentRole,
          state: currentRole === 'ministry' ? undefined : (selectedScope.state !== 'National' ? selectedScope.state : undefined),
          district: currentRole === 'district' && selectedScope.district !== 'All' ? selectedScope.district : undefined,
          mp_name: currentRole === 'mp' ? selectedScope.mpName : undefined,
          risk_level: riskFilter !== 'ALL' ? riskFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          work_type: typeFilter !== 'ALL' ? typeFilter : undefined,
          search: searchFilter || undefined,
          limit: 30
        }),
        currentRole === 'ministry' ? fetchStates() : Promise.resolve([]),
        (currentRole === 'state' || currentRole === 'district') ? fetchDistricts(selectedScope.state) : Promise.resolve([])
      ]);

      setSummary(sumData);
      setAnalytics(analData);
      setProjectsList(projData?.projects || []);
      setStatesList(stData || []);
      setDistrictsList(distData || []);
      setLoading(false);
    }
    loadData();
  }, [currentRole, selectedScope, statusFilter, typeFilter, riskFilter, searchFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy"></div>
          <span className="text-xs font-semibold text-slate-600">Loading {currentRole.toUpperCase()} Authority Intelligence...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 1. MP DASHBOARD VIEW
  // ----------------------------------------------------
  if (currentRole === 'mp') {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider">
              <UserCheck className="w-4 h-4" />
              <span>Member of Parliament (MP) Constituency Portfolio</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">{selectedScope.mpName || 'Constituency MP Portfolio'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Constituency Project Monitoring, Fund Utilization & Vigilance Tracking</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('map')}
              className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Open Constituency Map</span>
            </button>
            <button
              onClick={() => onNavigate('alerts')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Constituency Alerts ({summary?.high_risk_projects || 0})</span>
            </button>
          </div>
        </div>

        {/* 8 Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard title="Total Projects" value={(summary?.total_projects || 0).toLocaleString()} subtitle="Recommended Works" color="blue" />
          <KPICard title="Completed Projects" value={(summary?.completed_projects || 0).toLocaleString()} subtitle="100% Physical Execution" color="emerald" />
          <KPICard title="Ongoing Projects" value={(summary?.ongoing_projects || 0).toLocaleString()} subtitle="Under Implementation" color="purple" />
          <KPICard title="Delayed Projects" value={(summary?.delayed_projects || 0).toLocaleString()} subtitle="Schedule Target" color="amber" badge={summary?.delayed_projects > 0 ? "Delayed" : null} />
          <KPICard title="Sanctioned Amount" value={`₹${summary?.total_sanctioned_crores || 0} Cr`} subtitle="Total Allocation" color="blue" />
          <KPICard title="Total Expenditure" value={`₹${summary?.total_expenditure_crores || 0} Cr`} subtitle="Disbursed Funds" color="emerald" />
          <KPICard title="Fund Utilization" value={`${summary?.fund_utilization_pct || 0}%`} subtitle="Scheme Outlay Ratio" color="blue" />
          <KPICard title="High-Risk Projects" value={(summary?.high_risk_projects || 0).toLocaleString()} subtitle="Flagged for Verification" color="red" badge={summary?.high_risk_projects > 0 ? "Review" : null} />
        </div>

        {/* Monthly Expenditure Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Monthly Completion & Expenditure Velocity</h3>
          <p className="text-xs text-slate-500 mb-4">Completed works expenditure trajectory over the last 12 months</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="Cr" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="expenditure_crores" stroke="#1A56DB" strokeWidth={2.5} name="Expenditure (₹ Cr)" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Constituency Projects Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Constituency Projects Monitoring Ledger ({projectsList.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Real-time status and physical verification details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Project ID & Name</th>
                  <th className="px-4 py-3">Location / Agency</th>
                  <th className="px-4 py-3 text-right">Sanctioned</th>
                  <th className="px-4 py-3 text-right">Expenditure</th>
                  <th className="px-4 py-3 text-center">Progress</th>
                  <th className="px-4 py-3 text-center">Risk Level</th>
                  <th className="px-6 py-3">Status Note</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {projectsList.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-mono font-bold text-slate-900">#{p.project_id}</div>
                      <div className="line-clamp-1 max-w-xs text-slate-700 font-semibold">{p.project_name}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      <div>{p.district}, {p.state}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{p.implementing_agency}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold">{formatINR(p.sanctioned_amount)}</td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatINR(p.expenditure)}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-700">
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">{p.progress_pct}%</span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <RiskBadge score={p.risk_score} category={p.risk_level} />
                    </td>
                    <td className="px-6 py-3.5 text-[11px] max-w-xs">
                      <span className={p.risk_level === 'LOW' ? 'text-emerald-700 font-bold' : 'text-red-700 font-semibold'}>
                        {p.risk_factors?.[0] || '100% completed on schedule'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => onSelectProject(p)}
                        className="px-3 py-1 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 mx-auto shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. DISTRICT AUTHORITY DASHBOARD
  // ----------------------------------------------------
  if (currentRole === 'district') {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>District Magistrate / District Collectorate Command Center</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              {selectedScope.district && selectedScope.district !== 'All' ? `${selectedScope.district} District` : `${selectedScope.state} — All Districts`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Project-wise physical verification, financial tracking, and tender anomaly auditing</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('map')}
              className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Open District Map</span>
            </button>
          </div>
        </div>

        {/* 8 Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard title="Total Projects" value={(summary?.total_projects || 0).toLocaleString()} subtitle="In District Scope" color="blue" />
          <KPICard title="Sanctioned Amount" value={`₹${summary?.total_sanctioned_crores || 0} Cr`} subtitle="Approved Budget" color="blue" />
          <KPICard title="Total Expenditure" value={`₹${summary?.total_expenditure_crores || 0} Cr`} subtitle="Realized Outlay" color="emerald" />
          <KPICard title="Fund Utilization" value={`${summary?.fund_utilization_pct || 0}%`} subtitle="Efficiency Ratio" color="emerald" />
          <KPICard title="Completed Works" value={(summary?.completed_projects || 0).toLocaleString()} subtitle="100% Progress (🟢 Low Risk)" color="purple" />
          <KPICard title="Ongoing Works" value={(summary?.ongoing_projects || 0).toLocaleString()} subtitle="Active Execution" color="blue" />
          <KPICard title="Delayed Projects" value={(summary?.delayed_projects || 0).toLocaleString()} subtitle="Schedule Overrun" color="amber" badge={summary?.delayed_projects > 0 ? "Delayed" : null} />
          <KPICard title="High-Risk Projects" value={(summary?.high_risk_projects || 0).toLocaleString()} subtitle="Critical Audit Required" color="red" badge={summary?.high_risk_projects > 0 ? "Priority" : null} />
        </div>

        {/* District Project Monitoring Table with Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">District Project Monitoring Workbench ({projectsList.length} Works)</h3>
              <p className="text-xs text-slate-500">Live operational ledger showing financial variances, timeline progress, and AI risk scores</p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Delayed">Delayed</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="ALL">All Work Types</option>
                <option value="road">Roads</option>
                <option value="street_light">Street Lights</option>
                <option value="water_supply">Water Supply</option>
                <option value="education">Education</option>
                <option value="community_hall">Community Hall</option>
                <option value="drainage">Drainage</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="ALL">All Risk Tiers</option>
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low (100% Progress)</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter name / ID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium w-40"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Project ID & Work Name</th>
                  <th className="px-4 py-3">Work Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Sanctioned</th>
                  <th className="px-4 py-3 text-right">Estimated Cost</th>
                  <th className="px-4 py-3 text-right">Expenditure</th>
                  <th className="px-4 py-3 text-center">Progress</th>
                  <th className="px-4 py-3">Timeline</th>
                  <th className="px-4 py-3 text-center">Risk Level</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {projectsList.map((p, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-3.5 max-w-xs">
                      <div className="font-mono font-bold text-slate-900">#{p.project_id}</div>
                      <div className="line-clamp-1 font-semibold text-slate-700">{p.project_name}</div>
                    </td>
                    <td className="px-4 py-3.5 capitalize font-semibold text-slate-600">{p.work_type}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{p.district}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatINR(p.sanctioned_amount)}</td>
                    <td className="px-4 py-3.5 text-right text-slate-600">{formatINR(p.estimated_cost)}</td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatINR(p.expenditure)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{p.progress_pct}%</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      <div>Start: {p.start_date || 'N/A'}</div>
                      <div className={p.is_delayed ? 'text-red-600 font-bold' : ''}>Target: {p.expected_completion_date || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <RiskBadge score={p.risk_score} category={p.risk_level} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => onSelectProject(p)}
                        className="px-3 py-1 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 mx-auto shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. STATE NODAL AUTHORITY DASHBOARD
  // ----------------------------------------------------
  if (currentRole === 'state') {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>State Nodal Authority Oversight</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">{selectedScope.state || 'State Nodal Command'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Inter-district implementation audit, fund utilization, and agency concentration monitoring</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('map')}
              className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Open State GIS Map</span>
            </button>
          </div>
        </div>

        {/* 8 Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard title="Total Districts" value={(districtsList.length || summary?.total_districts || 0).toLocaleString()} subtitle="Under State Jurisdiction" color="blue" />
          <KPICard title="Total Projects" value={(summary?.total_projects || 0).toLocaleString()} subtitle="Completed & Ongoing" color="blue" />
          <KPICard title="Sanctioned Outlay" value={`₹${summary?.total_sanctioned_crores || 0} Cr`} subtitle="State Sanctions" color="blue" />
          <KPICard title="Total Expenditure" value={`₹${summary?.total_expenditure_crores || 0} Cr`} subtitle="Fund Utilization" color="emerald" />
          <KPICard title="Fund Utilization" value={`${summary?.fund_utilization_pct || 0}%`} subtitle="State Efficiency" color="emerald" />
          <KPICard title="Completed Projects" value={(summary?.completed_projects || 0).toLocaleString()} subtitle="100% Progress (🟢 Low Risk)" color="purple" />
          <KPICard title="Delayed Projects" value={(summary?.delayed_projects || 0).toLocaleString()} subtitle="Behind Target" color="amber" badge={summary?.delayed_projects > 0 ? "Delayed" : null} />
          <KPICard title="High-Risk Projects" value={(summary?.high_risk_projects || 0).toLocaleString()} subtitle="Vigilance Flags" color="red" badge={summary?.high_risk_projects > 0 ? "Audit" : null} />
        </div>

        {/* District Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">District Performance & Risk Comparison Leaderboard</h3>
              <p className="text-xs text-slate-500">Click any district to view its live GIS Map & Project Locations</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              {districtsList.length} Districts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">District</th>
                  <th className="px-4 py-3 text-right">Projects</th>
                  <th className="px-4 py-3 text-right">Expenditure (₹ Cr)</th>
                  <th className="px-4 py-3 text-right">Utilization %</th>
                  <th className="px-4 py-3 text-right">Delayed</th>
                  <th className="px-4 py-3 text-right">High Risk</th>
                  <th className="px-4 py-3 text-right">Avg Risk Score</th>
                  <th className="px-6 py-3 text-center">Open Map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {districtsList.map((d, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => {
                      setSelectedScope({ ...selectedScope, district: d.district });
                      onNavigate('map');
                    }}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5 font-bold text-slate-900">{d.district}</td>
                    <td className="px-4 py-3.5 text-right font-extrabold">{d.total_projects.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right font-bold">₹{d.total_expenditure_crores} Cr</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">{d.fund_utilization_pct}%</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={d.delayed_projects > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                        {d.delayed_projects}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                        d.high_risk_projects > 50 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.high_risk_projects}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black">
                      <span className={d.avg_risk_score >= 35 ? 'text-red-600' : 'text-slate-800'}>
                        {d.avg_risk_score} / 100
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>Open District Map</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 4. MINISTRY DASHBOARD VIEW (NATIONAL OVERSIGHT)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Profile */}
      <div className="bg-gradient-to-r from-gov-navy via-[#113264] to-[#1E3A8A] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-3 backdrop-blur-xs border border-white/10">
            <Building2 className="w-3.5 h-3.5" />
            <span>Ministry of Statistics & Programme Implementation (MoSPI)</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            National MPLADS AI Monitoring & Vigilance Command Center
          </h1>
          
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Macro oversight of <strong className="text-white">43,496 official projects</strong> across <strong className="text-white">33 States/UTs</strong>. 
            Click any State or District to inspect on the <span className="text-amber-300 font-bold">Interactive GIS Map</span>.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('map')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Open National GIS Map</span>
            </button>

            <button
              onClick={() => onNavigate('alerts')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all border border-white/20 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>National Priority Alerts ({summary?.high_risk_projects || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard title="Total States / UTs" value={(summary?.total_states || 33).toLocaleString()} subtitle="National Coverage" color="blue" />
        <KPICard title="Total Projects" value={(summary?.total_projects || 0).toLocaleString()} subtitle="Recorded Scheme Works" color="blue" />
        <KPICard title="Sanctioned Funds" value={`₹${summary?.total_sanctioned_crores || 0} Cr`} subtitle="Total Allocation" color="blue" />
        <KPICard title="Total Expenditure" value={`₹${summary?.total_expenditure_crores || 0} Cr`} subtitle="Disbursed Funds" color="emerald" />
        <KPICard title="Fund Utilization" value={`${summary?.fund_utilization_pct || 0}%`} subtitle="Overall Efficiency" color="emerald" />
        <KPICard title="Completed Projects" value={(summary?.completed_projects || 0).toLocaleString()} subtitle="100% Progress (🟢 Low Risk)" color="purple" />
        <KPICard title="Delayed Projects" value={(summary?.delayed_projects || 0).toLocaleString()} subtitle="Milestone Overdue" color="amber" badge={summary?.delayed_projects > 0 ? "Delayed" : null} />
        <KPICard title="High-Risk Projects" value={(summary?.high_risk_projects || 0).toLocaleString()} subtitle="Vigilance Flags" color="red" badge={summary?.high_risk_projects > 0 ? "Priority" : null} />
      </div>

      {/* State Ranking Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">National State Ranking Leaderboard (33 States/UTs)</h3>
            <p className="text-xs text-slate-500">Click any state to open its interactive GIS Map and local works</p>
          </div>
          <span className="text-xs text-slate-500">Sorted by Total Works Volume</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">State / UT</th>
                <th className="px-4 py-3 text-right">Projects</th>
                <th className="px-4 py-3 text-right">Sanctioned (₹ Cr)</th>
                <th className="px-4 py-3 text-right">Expenditure (₹ Cr)</th>
                <th className="px-4 py-3 text-right">Utilization %</th>
                <th className="px-4 py-3 text-right">Delayed</th>
                <th className="px-4 py-3 text-right">High Risk</th>
                <th className="px-4 py-3 text-center">Risk Level</th>
                <th className="px-6 py-3 text-center">Open Map</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {statesList.map((st, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => {
                    setSelectedScope({ ...selectedScope, state: st.state, district: 'All' });
                    onNavigate('map');
                  }}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5 font-bold text-slate-900">{st.state}</td>
                  <td className="px-4 py-3.5 text-right font-extrabold">{st.total_projects.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right text-slate-600">₹{st.total_sanctioned_crores} Cr</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">₹{st.total_expenditure_crores} Cr</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">{st.fund_utilization_pct}%</td>
                  <td className="px-4 py-3.5 text-right text-amber-700 font-bold">{st.delayed_projects}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                      st.high_risk_projects > 200 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {st.high_risk_projects.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <RiskBadge score={st.avg_risk_score} category={st.risk_level} showScore={false} />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>Open Map</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
