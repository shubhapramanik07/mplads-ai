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
  SlidersHorizontal
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
      const [stList, distList] = await Promise.all([
        fetchStates(),
        fetchDistricts(stateFilter !== 'ALL' ? stateFilter : '')
      ]);
      setStates(stList || []);
      setDistricts(distList || []);
    }
    loadMeta();
  }, [stateFilter]);

  useEffect(() => {
    async function loadProjectsData() {
      setLoading(true);
      const params = {
        role: currentRole,
        limit: pageSize,
        offset: page * pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (stateFilter !== 'ALL') params.state = stateFilter;
      if (districtFilter !== 'ALL') params.district = districtFilter;
      if (categoryFilter !== 'ALL') params.work_type = categoryFilter;
      if (riskFilter !== 'ALL') params.risk_level = riskFilter;

      const res = await fetchProjects(params);
      setProjects(res?.projects || []);
      setTotalCount(res?.total || 0);
      setLoading(false);
    }
    loadProjectsData();
  }, [currentRole, page, pageSize, searchTerm, statusFilter, stateFilter, districtFilter, categoryFilter, riskFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const workTypes = [
    { id: 'road', name: 'Roads & Pathways' },
    { id: 'street_light', name: 'Street Lights / Solar' },
    { id: 'water_supply', name: 'Water Supply' },
    { id: 'education', name: 'Education Facilities' },
    { id: 'community_hall', name: 'Community Halls' },
    { id: 'drainage', name: 'Drainage Systems' },
    { id: 'sanitation', name: 'Sanitation' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'sports', name: 'Sports Infrastructure' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Master Project Monitoring Ledger</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">MPLADS Project Directory & Verification</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Query across <strong className="text-slate-900 font-bold">43,496 completed works</strong> with multi-attribute filtering & AI risk annotations
          </p>
        </div>

        <div className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
          Total Matching: {totalCount.toLocaleString()} Projects
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, name, MP, district, agency..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium"
            />
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          {/* State */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setDistrictFilter('ALL'); setPage(0); }}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All States ({states.length})</option>
              {states.map((s, idx) => (
                <option key={idx} value={s.state}>{s.state}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All Categories</option>
              {workTypes.map((w, idx) => (
                <option key={idx} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Risk Tier */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="CRITICAL">🔴 Critical (&ge;85)</option>
              <option value="HIGH">🟠 High (70-84)</option>
              <option value="MEDIUM">🟡 Medium (40-69)</option>
              <option value="LOW">🟢 Low (&lt;40)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Project ID & Work Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location & MP</th>
                <th className="px-4 py-3 text-right">Sanctioned</th>
                <th className="px-4 py-3 text-right">Expenditure</th>
                <th className="px-4 py-3 text-center">Progress</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-4 py-3 text-center">Risk Level</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy mx-auto"></div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    No matching projects found.
                  </td>
                </tr>
              ) : (
                projects.map((p, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-3.5 max-w-xs">
                      <div className="font-mono font-bold text-slate-900">#{p.project_id}</div>
                      <div className="line-clamp-1 text-slate-800 font-semibold">{p.project_name}</div>
                    </td>
                    <td className="px-4 py-3.5 capitalize text-slate-600 whitespace-nowrap">{p.work_type}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{p.district}, {p.state}</div>
                      <div className="text-[10px] text-slate-500">{p.mp_name}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatINR(p.sanctioned_amount)}</td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatINR(p.expenditure)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{p.progress_pct}%</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      <div>Start: {p.start_date || 'N/A'}</div>
                      <div className={p.is_delayed ? 'text-red-600 font-bold' : ''}>
                        Target: {p.expected_completion_date || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <RiskBadge score={p.risk_score} category={p.risk_level} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => onSelectProject(p)}
                        className="px-3 py-1 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 mx-auto shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Showing Page <strong className="text-slate-900">{page + 1}</strong> of <strong className="text-slate-900">{totalPages || 1}</strong> ({totalCount.toLocaleString()} total projects)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-semibold flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-semibold flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
