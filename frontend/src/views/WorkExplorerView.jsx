import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  Building2, 
  User, 
  Calendar, 
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Download,
  Eye,
  SlidersHorizontal,
  UserCheck
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchProjects, fetchStates, fetchDistricts, formatINR } from '../services/api';

export default function WorkExplorerView({ currentRole, selectedScope, onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState(selectedScope?.state || 'ALL');
  const [districtFilter, setDistrictFilter] = useState(selectedScope?.district || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      if (currentRole !== 'mp') {
        const [stList, distList] = await Promise.all([
          fetchStates(),
          fetchDistricts(stateFilter !== 'ALL' ? stateFilter : '')
        ]);
        setStates(stList || []);
        setDistricts(distList || []);
      }
    }
    loadMeta();
  }, [stateFilter, currentRole]);

  useEffect(() => {
    async function loadProjectsData() {
      setLoading(true);
      const params = {
        role: currentRole,
        limit: pageSize,
        offset: page * pageSize
      };
      if (currentRole === 'mp') {
        params.mp_name = selectedScope?.mpName;
      } else {
        if (stateFilter !== 'ALL') params.state = stateFilter;
        if (districtFilter !== 'ALL') params.district = districtFilter;
      }
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.work_type = categoryFilter;
      if (riskFilter !== 'ALL') params.risk_level = riskFilter;

      const res = await fetchProjects(params);
      setProjects(res?.projects || []);
      setTotalCount(res?.total || 0);
      setLoading(false);
    }
    loadProjectsData();
  }, [page, pageSize, searchTerm, statusFilter, stateFilter, districtFilter, categoryFilter, riskFilter, currentRole, selectedScope]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
            {currentRole === 'mp' ? <UserCheck className="w-4 h-4 text-purple-600" /> : <Layers className="w-4 h-4 text-blue-600" />}
            <span>
              {currentRole === 'mp' 
                ? `Constituency Project Ledger • ${selectedScope?.mpName || 'MP Works'}`
                : 'National Scheme Works Ledger'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {currentRole === 'mp' ? `${selectedScope?.mpName || 'MP'} Sanctioned Works` : 'All MPLADS Works & Anomaly Audit'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'mp'
              ? `Showing all ${totalCount} works recommended and sanctioned for ${selectedScope?.mpName}`
              : `Comprehensive registry of ${totalCount.toLocaleString()} works with explainable AI risk assessments`}
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-gov-navy">{totalCount.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase">Total Works Scoped</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search work name, ID, contractor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Completed">Completed (100% Progress)</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Delayed">Delayed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="ALL">All Work Types</option>
            <option value="road">Roads & Pathways</option>
            <option value="street_light">Street Lights</option>
            <option value="water_supply">Drinking Water</option>
            <option value="education">Education Facilities</option>
            <option value="community_hall">Community Halls</option>
            <option value="drainage">Drainage & Sanitation</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">🔴 Critical Risk</option>
            <option value="HIGH">🟠 High Risk</option>
            <option value="MEDIUM">🟡 Medium Risk</option>
            <option value="LOW">🟢 Low Risk (100% Progress)</option>
          </select>

          {/* State & District Filters (Hidden for MP role as MP is already strictly scoped) */}
          {currentRole !== 'mp' && (
            <>
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setDistrictFilter('ALL');
                  setPage(0);
                }}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                <option value="ALL">All States</option>
                {states.map((s, idx) => (
                  <option key={idx} value={s.state}>{s.state}</option>
                ))}
              </select>

              {stateFilter !== 'ALL' && (
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setPage(0);
                  }}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="ALL">All Districts</option>
                  {districts.map((d, idx) => (
                    <option key={idx} value={d.district}>{d.district}</option>
                  ))}
                </select>
              )}
            </>
          )}

        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Project ID & Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Jurisdiction / MP</th>
                <th className="px-4 py-3.5 text-right">Sanctioned</th>
                <th className="px-4 py-3.5 text-right">Expenditure</th>
                <th className="px-4 py-3.5 text-center">Progress</th>
                <th className="px-4 py-3.5 text-center">Risk Tier</th>
                <th className="px-6 py-3.5">Primary Factor</th>
                <th className="px-4 py-3.5 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gov-navy mx-auto mb-2"></div>
                    <span>Querying projects...</span>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No projects found matching the active search and filter criteria.
                  </td>
                </tr>
              ) : (
                projects.map((p, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-3.5 max-w-xs">
                      <div className="font-mono font-bold text-slate-900">#{p.project_id}</div>
                      <div className="line-clamp-1 font-semibold text-slate-700">{p.project_name}</div>
                    </td>
                    <td className="px-4 py-3.5 capitalize font-semibold text-slate-600 whitespace-nowrap">
                      {p.work_type}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      <div>{p.district}, {p.state}</div>
                      <div className="text-[10px] text-slate-400">{p.mp_name}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                      {formatINR(p.sanctioned_amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900">
                      {formatINR(p.expenditure)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {p.progress_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <RiskBadge score={p.risk_score} category={p.risk_level} />
                    </td>
                    <td className="px-6 py-3.5 text-[11px] max-w-xs">
                      <span className={p.risk_level === 'LOW' ? 'text-emerald-700 font-bold' : 'text-red-700 font-semibold'}>
                        {p.risk_factors?.[0] || '100% physically completed on schedule'}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900">{page * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-900">{Math.min((page + 1) * pageSize, totalCount)}</strong> of{' '}
            <strong className="text-slate-900">{totalCount.toLocaleString()}</strong> works
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
