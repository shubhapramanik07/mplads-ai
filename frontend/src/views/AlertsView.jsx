import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Download, 
  Filter, 
  SlidersHorizontal, 
  ShieldAlert,
  ChevronDown,
  Building,
  User,
  CheckCircle2,
  Camera
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchAlerts, fetchStateSummaries, fetchWorkTypes, formatINR } from '../services/api';

export default function AlertsView({ onSelectWork }) {
  const [threshold, setThreshold] = useState(70);
  const [stateFilter, setStateFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [states, setStates] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFilters() {
      const [stList, wtList] = await Promise.all([
        fetchStateSummaries(),
        fetchWorkTypes()
      ]);
      setStates(stList || []);
      setWorkTypes(wtList || []);
    }
    loadFilters();
  }, []);

  useEffect(() => {
    async function loadAlertsData() {
      setLoading(true);
      const params = {
        min_risk_score: threshold,
        limit: 100
      };
      if (stateFilter !== 'ALL') params.state = stateFilter;
      if (categoryFilter !== 'ALL') params.work_type = categoryFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await fetchAlerts(params);
      setAlerts(res?.alerts || []);
      setTotalAlerts(res?.total_alerts || 0);
      setLoading(false);
    }
    loadAlertsData();
  }, [threshold, stateFilter, categoryFilter, searchTerm]);

  const handleExportCSV = () => {
    if (alerts.length === 0) return;
    const headers = ["Work ID", "Description", "Category", "MP Name", "Constituency", "State", "Sanctioned Cost", "Risk Score", "Risk Category", "Risk Reasons"];
    const rows = alerts.map(a => [
      `"${a.work_id}"`,
      `"${(a.work_description || '').replace(/"/g, '""')}"`,
      `"${a.work_type}"`,
      `"${a.mp_name}"`,
      `"${a.constituency}"`,
      `"${a.state}"`,
      a.final_amount,
      a.risk_score,
      a.risk_category,
      `"${(Array.isArray(a.risk_reasons) ? a.risk_reasons.join(' | ') : '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mplads_high_risk_audit_queue_${threshold}plus.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>CAG & Internal Vigilance Audit Workbench</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">High-Risk Anomaly & Fraud Audit Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Proactive triage queue prioritizing projects with cost inflation, duplicate claims, and documentation gaps
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Audit Queue (CSV)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          
          {/* Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1"><SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Alert Threshold:</span>
              <span className="text-red-600 font-extrabold">&ge; {threshold} / 100</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* State Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">State / UT:</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All States ({states.length})</option>
              {states.map((s, idx) => (
                <option key={idx} value={s.state}>{s.state}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Work Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All Categories</option>
              {workTypes.map((w, idx) => (
                <option key={idx} value={w.work_type}>{w.work_type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Keyword Search:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description, MP, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Audit Queue Summary Banner */}
      <div className="bg-slate-100/80 rounded-xl px-5 py-3 border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
        <span className="font-semibold text-slate-700">
          Showing <strong className="text-slate-900 font-extrabold">{alerts.length}</strong> prioritized audit cases (Total matching database: <strong className="text-red-700 font-extrabold">{totalAlerts.toLocaleString()}</strong>)
        </span>
        <span className="text-slate-500 font-medium">
          Click any card to inspect full technical BoQ & vigilance notice details
        </span>
      </div>

      {/* Priority Cards Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">No Anomalies Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No projects in the active dataset meet or exceed Risk Score &ge; {threshold} with the applied filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((work, idx) => (
            <div
              key={idx}
              onClick={() => onSelectWork(work)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-red-400 hover:shadow-md transition-all p-5 cursor-pointer group space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                    #{work.work_id}
                  </span>
                  <RiskBadge score={work.risk_score} category={work.risk_category} />
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    {work.work_type} • {work.state} ({work.constituency})
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-slate-900">{formatINR(work.final_amount)}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed group-hover:text-blue-900">
                "{work.work_description}"
              </p>

              {/* Risk Reasons */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 space-y-1">
                {(work.risk_reasons || []).map((r, rIdx) => (
                  <div key={rIdx} className="text-xs font-bold text-rose-900 flex items-start gap-1.5">
                    <span className="text-rose-600 font-bold mt-0.5">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* Metadata Footer */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <span><strong>MP:</strong> {work.mp_name}</span>
                  <span><strong>IDA:</strong> {work.ida}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><strong>Photos:</strong> {work.has_images ? '✅ Attached' : '❌ Missing'}</span>
                  <span><strong>Completion:</strong> {work.completed_date || 'N/A'}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
