import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Download, 
  Filter, 
  SlidersHorizontal, 
  ShieldAlert,
  Building,
  User,
  CheckCircle2,
  Camera,
  ExternalLink,
  Eye,
  Check,
  UserCheck,
  Network,
  ClipboardCheck,
  Clock3,
  ChevronDown,
  ChevronUp,
  
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
    async function loadAlertsData() {
      setLoading(true);
      const params = {
        role: currentRole,
        limit: 100
      };
      if (currentRole === 'mp') {
        params.mp_name = selectedScope?.mpName;
      } else {
        if (stateFilter !== 'ALL') params.state = stateFilter;
        if (districtFilter !== 'ALL') params.district = districtFilter;
      }
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (typeFilter !== 'ALL') params.alert_type = typeFilter;

      const res = await fetchApiAlerts(params);
      setAlerts(res?.alerts || []);
      setTotalAlerts(res?.total_alerts || 0);
      setLoading(false);
    }
    loadAlertsData();
  }, [severityFilter, typeFilter, stateFilter, districtFilter, currentRole, selectedScope]);
const [expandedAlerts, setExpandedAlerts] = useState(new Set());

const toggleAlertDetails = (alertId) => {
  setExpandedAlerts(prev => {
    const next = new Set(prev);

    if (next.has(alertId)) {
      next.delete(alertId);
    } else {
      next.add(alertId);
    }

    return next;
  });
};
  const toggleResolved = (alertId) => {
    const updated = new Set(resolvedIds);
    if (updated.has(alertId)) {
      updated.delete(alertId);
    } else {
      updated.add(alertId);
    }
    setResolvedIds(updated);
  };

  const filteredAlerts = alerts.filter(a => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.project_name?.toLowerCase().includes(s) ||
      a.project_id?.toLowerCase().includes(s) ||
      a.alert_type?.toLowerCase().includes(s) ||
      a.district?.toLowerCase().includes(s) ||
      a.mp_name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            {currentRole === 'mp' ? <UserCheck className="w-4 h-4 text-purple-600" /> : <ShieldAlert className="w-4 h-4" />}
            <span>
              {currentRole === 'mp'
                ? `Constituency Vigilance Center • ${selectedScope?.mpName || 'MP Works'}`
                : 'National Vigilance & Anomaly Triage Queue'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {currentRole === 'mp' ? `${selectedScope?.mpName || 'MP'} Priority Risk Alerts` : 'Explainable AI Early-Warning Alerts'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'mp'
              ? `Real-time risk warnings and schedule tracking for works under ${selectedScope?.mpName}`
              : `Real-time automated detection of cost overruns, tender duplication, and compliance gaps`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-red-100 text-red-800 rounded-xl text-xs font-black border border-red-200 shadow-2xs">
            {totalAlerts} Total Alerts
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Severity Quick Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                  severityFilter === sev
                    ? sev === 'CRITICAL' ? 'bg-red-600 text-white shadow-xs' :
                      sev === 'HIGH' ? 'bg-orange-500 text-white shadow-xs' :
                      sev === 'MEDIUM' ? 'bg-amber-400 text-slate-900 shadow-xs' :
                      'bg-gov-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev === 'ALL' ? 'All Severities' : sev}
              </button>
            ))}
          </div>

          {/* Anomaly Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="ALL">All Anomaly Types</option>
            <option value="cost_overrun">Cost Overrun / Outlier</option>
            <option value="delay">Milestone Delay & Schedule Overrun</option>
            <option value="compliance">Missing Geo-Photos & Compliance</option>
            <option value="monopoly">IDA Monopoly Concentration</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert, work name, MP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

        </div>
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-navy mx-auto mb-3"></div>
            <span className="text-xs font-semibold text-slate-500">Querying AI Alert Triage Center...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Actionable Alerts Pending</h3>
            <p className="text-xs text-slate-500 mt-1">All works in this scope conform to normal peer standards and schedules.</p>
          </div>
        ) : (
                      filteredAlerts.map((alert) => {
              const isResolved = resolvedIds.has(alert.alert_id);
              const isExpanded = expandedAlerts.has(alert.alert_id);

              const sevColor =
                alert.severity === 'CRITICAL'
                  ? 'border-l-red-600 bg-red-50/20'
                  : alert.severity === 'HIGH'
                  ? 'border-l-orange-500 bg-orange-50/20'
                  : 'border-l-amber-400 bg-amber-50/20';

              // AI confidence derived from risk score.
              // If your backend already provides confidence, use that instead.
              const aiConfidence = Math.min(
                99,
                Math.max(65, Math.round(alert.risk_score + 10))
              );

              // Example AI action plan
              const actionPlan =
                alert.severity === 'CRITICAL'
                  ? [
                      'Immediate field verification recommended',
                      'Verify expenditure against sanctioned amount',
                      'Check geo-tagged evidence and completion documents'
                    ]
                  : alert.severity === 'HIGH'
                  ? [
                      'Review project financial records',
                      'Verify physical progress against reported progress',
                      'Request missing supporting documents'
                    ]
                  : [
                      'Monitor project progress',
                      'Review financial utilization',
                      'Reassess risk during next reporting cycle'
                    ];

              return (
                <div
                  key={alert.alert_id}
                  className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${sevColor}
                    shadow-sm transition-all hover:shadow-md
                    ${isResolved ? 'opacity-60' : ''}`}
                >

                  {/* ================= MAIN ALERT ================= */}

                  <div className="p-5">

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                      {/* LEFT SIDE */}
                      <div className="space-y-2 flex-1">

                        {/* Alert Header */}
                        <div className="flex flex-wrap items-center gap-2">

                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {alert.alert_id}
                          </span>

                          <span className="text-slate-300">•</span>

                          <span className="text-xs font-extrabold text-slate-900">
                            {alert.alert_type}
                          </span>

                          <span className="text-slate-300">•</span>

                          <span className="text-[11px] text-slate-500">
                            {alert.date_detected}
                          </span>

                        </div>

                        {/* Project */}
                        <div>

                          <h4 className="text-sm font-black text-slate-900">
                            {alert.project_name}
                          </h4>

                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">

                            <span>
                              Jurisdiction:
                              <strong> {alert.district}, {alert.state}</strong>
                            </span>

                            <span>•</span>

                            <span>
                              MP:
                              <strong> {alert.mp_name}</strong>
                            </span>

                            <span>•</span>

                            <span>
                              Expenditure:
                              <strong> {formatINR(alert.expenditure)}</strong>
                            </span>

                          </div>

                        </div>


                        {/* ================= AI ROOT CAUSE ================= */}

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">

                          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                            AI Root Cause Forensic Findings
                          </div>

                          {alert.reasons?.map((r, rIdx) => (
                            <div
                              key={rIdx}
                              className="text-xs text-slate-700 font-semibold flex items-start gap-1.5"
                            >
                              <span className="text-amber-500 font-bold">
                                ▶
                              </span>

                              <span>{r}</span>
                            </div>
                          ))}

                        </div>


                        {/* ================= AI QUICK INTELLIGENCE ================= */}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">

                          {/* Confidence */}
                          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5">

                            <div className="flex items-center gap-1.5">

                              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />

                              <span className="text-[9px] font-extrabold uppercase text-blue-700">
                                AI Confidence
                              </span>

                            </div>

                            <div className="mt-1 text-sm font-black text-blue-900">
                              {aiConfidence}%
                            </div>

                          </div>


                          {/* Linked Cases */}
                          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-2.5">

                            <div className="flex items-center gap-1.5">

                              <Network className="w-3.5 h-3.5 text-purple-600" />

                              <span className="text-[9px] font-extrabold uppercase text-purple-700">
                                Similar Cases
                              </span>

                            </div>

                            <div className="mt-1 text-sm font-black text-purple-900">
                              {alert.similar_cases || 0}
                            </div>

                          </div>


                          {/* Investigation Status */}
                          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">

                            <div className="flex items-center gap-1.5">

                              <Clock3 className="w-3.5 h-3.5 text-amber-600" />

                              <span className="text-[9px] font-extrabold uppercase text-amber-700">
                                Status
                              </span>

                            </div>

                            <div className="mt-1 text-xs font-black text-amber-900">
                              {isResolved ? 'Resolved' : 'Needs Review'}
                            </div>

                          </div>

                        </div>


                        {/* ================= EXPANDABLE AI ACTION PLAN ================= */}

                        {isExpanded && (

                          <div className="mt-2 space-y-3 animate-fadeIn">

                            {/* AI Action Plan */}
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">

                              <div className="flex items-center gap-2 mb-2">

                                <ClipboardCheck className="w-4 h-4 text-emerald-700" />

                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                                  AI Recommended Action Plan
                                </span>

                              </div>

                              <div className="space-y-1.5">

                                {actionPlan.map((action, index) => (

                                  <div
                                    key={index}
                                    className="flex items-start gap-2 text-xs font-semibold text-slate-700"
                                  >

                                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] shrink-0">
                                      {index + 1}
                                    </span>

                                    <span>{action}</span>

                                  </div>

                                ))}

                              </div>

                            </div>


                            {/* Evidence Checklist */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3">

                              <div className="flex items-center gap-2 mb-2">

                                <ClipboardCheck className="w-4 h-4 text-slate-600" />

                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                                  Evidence Required
                                </span>

                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                                {[
                                  'Work Order',
                                  'Bill / Expenditure Records',
                                  'Geo-tagged Site Photos',
                                  'Completion Certificate',
                                  'Utilization Certificate',
                                  'Inspection Report'
                                ].map((item) => (

                                  <div
                                    key={item}
                                    className="flex items-center gap-2 text-xs text-slate-600"
                                  >

                                    <div className="w-3.5 h-3.5 border border-slate-300 rounded" />

                                    {item}

                                  </div>

                                ))}

                              </div>

                            </div>


                            {/* AI Network Detection */}
                            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3">

                              <div className="flex items-center gap-2">

                                <Network className="w-4 h-4 text-purple-700" />

                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800">
                                  AI Linked Anomaly Detection
                                </span>

                              </div>

                              <p className="text-xs text-slate-700 mt-2">

                                {alert.similar_cases
                                  ? `AI detected ${alert.similar_cases} projects with similar financial, progress, or implementation patterns. Consider reviewing them as a possible anomaly cluster.`
                                  : 'No significant linked anomaly cluster detected for this project.'
                                }

                              </p>

                            </div>


                            {/* Responsible Authority */}
                            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">

                              <div className="flex items-center gap-2">

                                <UserCheck className="w-4 h-4 text-blue-700" />

                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">
                                  Recommended Responsibility
                                </span>

                              </div>

                              <div className="mt-1 text-xs font-bold text-slate-700">

                                {alert.severity === 'CRITICAL'
                                  ? 'District Authority → Immediate Field Verification'
                                  : alert.severity === 'HIGH'
                                  ? 'District Authority → Financial & Physical Review'
                                  : 'District Authority → Routine Monitoring'
                                }

                              </div>

                            </div>

                          </div>

                        )}

                      </div>


                      {/* ================= RIGHT SIDE ================= */}

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">

                        <RiskBadge
                          score={alert.risk_score}
                          category={alert.severity}
                        />


                        <div className="flex items-center gap-2">

                          {/* Expand */}
                          <button
                            onClick={() => toggleAlertDetails(alert.alert_id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200
                              text-slate-700 text-xs font-bold rounded-lg
                              transition-colors flex items-center gap-1"
                          >

                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}

                            <span>
                              {isExpanded ? 'Less' : 'AI Details'}
                            </span>

                          </button>


                          {/* Investigate */}
                          <button
                            onClick={() =>
                              onSelectProject({
                                project_id: alert.project_id,
                                project_name: alert.project_name,
                                work_id: alert.project_id,
                                work_description: alert.project_name,
                                state: alert.state,
                                district: alert.district,
                                mp_name: alert.mp_name,
                                final_amount: alert.expenditure,
                                expenditure: alert.expenditure,
                                sanctioned_amount: alert.sanctioned_amount,
                                risk_score: alert.risk_score,
                                risk_level: alert.severity,
                                risk_factors: alert.reasons
                              })
                            }
                            className="px-3 py-1.5 bg-gov-navy hover:bg-slate-800
                              text-white text-xs font-bold rounded-lg
                              transition-colors flex items-center gap-1 shadow-2xs"
                          >

                            <Eye className="w-3.5 h-3.5 text-amber-400" />

                            <span>Investigate</span>

                          </button>


                          {/* Resolve */}
                          <button
                            onClick={() => toggleResolved(alert.alert_id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isResolved
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={
                              isResolved
                                ? 'Mark Unresolved'
                                : 'Mark as Acknowledged / Resolved'
                            }
                          >

                            <Check className="w-4 h-4" />

                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              );
            })
        )}
      </div>

    </div>
  );
}
