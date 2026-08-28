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
  Download
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchWorks, fetchStateSummaries, fetchWorkTypes, formatINR } from '../services/api';

export default function WorkExplorerView({ onSelectWork }) {
  const [works, setWorks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [states, setStates] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      const [stList, wtList] = await Promise.all([
        fetchStateSummaries(),
        fetchWorkTypes()
      ]);
      setStates(stList || []);
      setWorkTypes(wtList || []);
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function loadWorks() {
      setLoading(true);
      const params = {
        limit: pageSize,
        offset: page * pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (stateFilter !== 'ALL') params.state = stateFilter;
      if (categoryFilter !== 'ALL') params.work_type = categoryFilter;
      if (riskFilter !== 'ALL') params.risk_category = riskFilter;

      const res = await fetchWorks(params);
      setWorks(res?.data || []);
      setTotalCount(res?.total || 0);
      setLoading(false);
    }
    loadWorks();
  }, [page, pageSize, searchTerm, stateFilter, categoryFilter, riskFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
            <Search className="w-4 h-4 text-blue-600" />
            <span>Unified Search & Intelligence Directory</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Universal MPLADS Project Explorer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Query across <strong className="text-slate-900 font-bold">43,496 completed works</strong> with multi-attribute filtering & AI risk annotations
          </p>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
          Total Matching: {totalCount.toLocaleString()} Works
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, ID, MP, district..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium"
            />
          </div>

          {/* State */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All States / UTs ({states.length})</option>
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
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All Work Categories</option>
              {workTypes.map((w, idx) => (
                <option key={idx} value={w.work_type}>{w.work_type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Risk Band */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All Risk Bands</option>
              <option value="HIGH">High Risk Only (≥70)</option>
              <option value="MEDIUM">Medium Risk (40-69)</option>
              <option value="LOW">Normal (&lt;40)</option>
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
                <th className="px-6 py-3">Work ID & Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">MP & Location</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-center">Images</th>
                <th className="px-6 py-3 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy mx-auto"></div>
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                works.map((work, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => onSelectWork(work)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">#{work.work_id}</div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{work.work_type}</span>
                    </td>
                    <td className="px-4 py-3.5 max-w-sm">
                      <p className="line-clamp-2 text-slate-800 font-semibold">{work.work_description}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{work.mp_name}</div>
                      <div className="text-[11px] text-slate-500">{work.constituency}, {work.state}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {formatINR(work.final_amount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {work.has_images ? (
                        <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✅ Attached</span>
                      ) : (
                        <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">❌ Missing</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <RiskBadge score={work.risk_score} category={work.risk_category} />
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
            Showing Page <strong className="text-slate-900">{page + 1}</strong> of <strong className="text-slate-900">{totalPages || 1}</strong> ({totalCount.toLocaleString()} total works)
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
