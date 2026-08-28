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
  Camera,
  ExternalLink,
  Eye,
  Check
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fetchApiAlerts, fetchStates, fetchDistricts, formatINR } from '../services/api';

export default function AlertsView({ currentRole, selectedScope, onSelectProject }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState(selectedScope?.state || 'ALL');
  const [districtFilter, setDistrictFilter] = useState(selectedScope?.district || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [resolvedIds, setResolvedIds] = useState(new Set());
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
    async function loadAlertsData() {
      setLoading(true);
      const params = {
        role: currentRole,
        limit: 100
      };
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (typeFilter !== 'ALL') params.alert_type = typeFilter;
      if (stateFilter !== 'ALL') params.state = stateFilter;
      if (districtFilter !== 'ALL') params.district = districtFilter;

      const res = await fetchApiAlerts(params);
      setAlerts(res?.alerts || []);
      setTotalAlerts(res?.total_alerts || 0);
      setLoading(false);
    }
    loadAlertsData();
  }, [currentRole, severityFilter, typeFilter, stateFilter, districtFilter]);

  const toggleResolve = (e, alertId) => {
    e.stopPropagation();
    setResolvedIds(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  };

  const filteredAlerts = alerts.filter(a => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.project_id.toLowerCase().includes(s) ||
      a.project_name.toLowerCase().includes(s) ||
      a.district.toLowerCase().includes(s) ||
      a.state.toLowerCase().includes(s) ||
      a.mp_name.toLowerCase().includes(s)
    );
  });

  const handleExportCSV = () => {
    if (filteredAlerts.length === 0) return;
    const headers = ["Alert ID", "Project ID", "Alert Type", "Severity", "Risk Score", "Sanctioned Amount", "Expenditure", "Location", "MP Name", "Main Reason", "Status"];
    const rows = filteredAlerts.map(a => [
      `"${a.alert_id}"`,
      `"${a.project_id}"`,
      `"${a.alert_type}"`,
      `"${a.severity}"`,
      a.risk_score,
      a.sanctioned_amount,
      a.expenditure,
      `"${a.district}, ${a.state}"`,
      `"${a.mp_name}"`,
      `"${(a.main_reason || '').replace(/"/g, '""')}"`,
      `"${resolvedIds.has(a.alert_id) ? 'RESOLVED' : 'UNRESOLVED'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mplads_ai_alerts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>CAG & Internal Vigilance Investigative Queue</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">AI Risk & Anomaly Alerts Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Proactive alerts prioritizing cost overruns, duplicate tender claims, visual compliance gaps, and agency monopoly risks
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Alert Queue (CSV)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Severity */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">Severity Level:</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">🔴 Critical (&ge;85)</option>
            <option value="HIGH">🟠 High (70-84)</option>
            <option value="MEDIUM">🟡 Medium (40-69)</option>
          </select>
        </div>

        {/* Alert Type */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">Alert Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All Alert Types</option>
            <option value="cost_overrun">Cost Overruns / Outliers</option>
            <option value="duplicate">Potential Duplicate Works</option>
            <option value="compliance">Visual Compliance Gaps</option>
          </select>
        </div>

        {/* State */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">State / UT:</label>
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setDistrictFilter('ALL'); }}
            className="w-full mt-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All States ({states.length})</option>
            {states.map((s, idx) => (
              <option key={idx} value={s.state}>{s.state}</option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">District:</label>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All Districts</option>
            {districts.map((d, idx) => (
              <option key={idx} value={d.district}>{d.district}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">Keyword Search:</label>
          <div className="relative mt-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, MP, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium"
            />
          </div>
        </div>

      </div>

      {/* Queue Summary Banner */}
      <div className="bg-slate-100 rounded-xl px-5 py-3 border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
        <span className="font-semibold text-slate-700">
          Showing <strong className="text-slate-900 font-extrabold">{filteredAlerts.length}</strong> prioritized alerts (Total matching database: <strong className="text-red-700 font-extrabold">{totalAlerts.toLocaleString()}</strong>)
        </span>
        <span className="text-slate-500">
          Click <strong>[Investigate]</strong> on any card to open full forensic audit dossier
        </span>
      </div>

      {/* Alert Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">No Anomalies Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No projects in the selected scope match the applied vigilance alert filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAlerts.map((alert, idx) => {
            const isResolved = resolvedIds.has(alert.alert_id);
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs space-y-3 ${
                  isResolved ? 'opacity-60 border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-red-400 hover:shadow-md'
                }`}
              >
                {/* Alert Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-black text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                      {alert.alert_id}
                    </span>
                    <RiskBadge score={alert.risk_score} category={alert.severity} />
                    <span className="text-xs font-extrabold text-slate-900">
                      {alert.alert_type}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {alert.district}, {alert.state}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => toggleResolve(e, alert.alert_id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        isResolved ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{isResolved ? 'Marked Resolved' : 'Mark as Resolved'}</span>
                    </button>

                    <button
                      onClick={() => onSelectProject({
                        work_id: alert.project_id,
                        project_id: alert.project_id,
                        work_description: alert.project_name,
                        project_name: alert.project_name,
                        state: alert.state,
                        district: alert.district,
                        constituency: alert.district,
                        mp_name: alert.mp_name,
                        sanctioned_amount: alert.sanctioned_amount,
                        final_amount: alert.expenditure,
                        expenditure: alert.expenditure,
                        risk_score: alert.risk_score,
                        risk_level: alert.severity,
                        risk_category: alert.severity,
                        risk_reasons: alert.reasons,
                        risk_factors: alert.reasons,
                        has_images: alert.has_images
                      })}
                      className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Investigate</span>
                    </button>
                  </div>
                </div>

                {/* Work Name */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Project #{alert.project_id}</div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 leading-relaxed">
                    "{alert.project_name}"
                  </p>
                </div>

                {/* Financial Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Sanctioned Amount</span>
                    <div className="font-extrabold text-slate-800 mt-0.5">{formatINR(alert.sanctioned_amount)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Expenditure</span>
                    <div className="font-black text-slate-900 mt-0.5">{formatINR(alert.expenditure)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Recommending MP</span>
                    <div className="font-bold text-slate-800 mt-0.5 truncate">{alert.mp_name}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Date Detected</span>
                    <div className="font-semibold text-slate-600 mt-0.5">{alert.date_detected}</div>
                  </div>
                </div>

                {/* Risk Reasons */}
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 space-y-1">
                  {(alert.reasons || []).map((r, rIdx) => (
                    <div key={rIdx} className="text-xs font-bold text-rose-900 flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold mt-0.5">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
